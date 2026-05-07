const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();
const db = admin.firestore();

const SENDGRID_KEY = process.env.SENDGRID_API_KEY || functions.config().sendgrid?.key;
if (SENDGRID_KEY) sgMail.setApiKey(SENDGRID_KEY);

const VIP_THRESHOLD = parseInt(process.env.VIP_THRESHOLD || functions.config().nox?.vip_threshold || '5');

// Aggregate counter doc path: counters/waitlist
async function incrementCounter(delta = 1) {
  const ref = db.doc('counters/waitlist');
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? (snap.data().count || 0) : 0;
    tx.set(ref, { count: current + delta }, { merge: true });
  });
}

exports.onWaitlistCreate = functions.firestore.document('waitlist/{id}').onCreate(async (snap, ctx) => {
  const data = snap.data();
  try {
    // increment aggregate counter
    await incrementCounter(1);

    // send welcome email (if email present)
    if (data.email) {
      const msg = {
        to: data.email,
        from: process.env.FROM_EMAIL || functions.config().sendgrid?.from || 'no-reply@nox.com',
        subject: "Welcome — you’re on the NOX waitlist",
        text: `Hi ${data.name || ''},\n\nThanks for joining the NOX waitlist. We'll send private access updates soon. Share your referral link: ${data.referralId ? `${process.env.ORIGIN || functions.config().nox?.origin || 'https://nox.com'}?ref=${data.referralId}` : ''}`,
      };
      if (SENDGRID_KEY) {
        await sgMail.send(msg);
      } else {
        console.log('SENDGRID_KEY not set — welcome email skipped', msg);
      }
    }

    // Award VIP if inviter crosses threshold
    if (data.referredBy) {
      // find inviter doc
      const q = db.collection('waitlist').where('referralId', '==', data.referredBy).limit(1);
      const snapInv = await q.get();
      if (!snapInv.empty) {
        const inviterDoc = snapInv.docs[0];
        const inviterRef = inviterDoc.ref;
        await db.runTransaction(async (tx) => {
          const inviterSnap = await tx.get(inviterRef);
          if (!inviterSnap.exists) return;
          const current = inviterSnap.data().invitesCount || 0;
          // Note: client increments invitesCount, but double-check and sync
          tx.update(inviterRef, { invitesCount: current });

          // award VIP if threshold reached
          if (current >= VIP_THRESHOLD && !inviterSnap.data().vip) {
            tx.update(inviterRef, { vip: true, vipAwardedAt: admin.firestore.FieldValue.serverTimestamp() });
            // send VIP notification
            const inviterEmail = inviterSnap.data().email;
            if (inviterEmail) {
              const vipMsg = {
                to: inviterEmail,
                from: process.env.FROM_EMAIL || functions.config().sendgrid?.from || 'no-reply@nox.com',
                subject: 'You earned VIP Early Access — NOX',
                text: `You earned VIP Early Access by referring ${current} people. We'll send VIP instructions soon.`,
              };
              if (SENDGRID_KEY) await sgMail.send(vipMsg);
              else console.log('VIP email skipped (no sendgrid key)', vipMsg);
            }
          }
        });
      }
    }
  } catch (err) {
    console.error('onWaitlistCreate error', err);
  }
});

exports.onWaitlistDelete = functions.firestore.document('waitlist/{id}').onDelete(async (snap, ctx) => {
  try {
    await incrementCounter(-1);
  } catch (err) {
    console.error('onWaitlistDelete error', err);
  }
});

// Callable function for exporting CSV (requires admin claim)
exports.exportWaitlistCSV = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Request had no authentication');
  const token = context.auth.token || {};
  if (!token.isAdmin) throw new functions.https.HttpsError('permission-denied', 'Must be admin');

  const snap = await db.collection('waitlist').get();
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (!rows.length) return { csv: '' };
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n');
  return { csv };
});

// Callable helper to set isAdmin claim - only callable by an existing admin
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Request had no authentication');
  if (!context.auth.token || !context.auth.token.isAdmin) throw new functions.https.HttpsError('permission-denied', 'Must be admin');
  const { uid, makeAdmin } = data;
  if (!uid) throw new functions.https.HttpsError('invalid-argument', 'Missing uid');
  try {
    await admin.auth().setCustomUserClaims(uid, { isAdmin: !!makeAdmin });
    return { success: true };
  } catch (err) {
    throw new functions.https.HttpsError('internal', 'Unable to set claims');
  }
});

// Callable function to update launch config (admin-only)
exports.updateLaunchConfig = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Request had no authentication');
  const token = context.auth.token || {};
  if (!token.isAdmin) throw new functions.https.HttpsError('permission-denied', 'Must be admin');

  try {
    const docRef = db.doc('config/launch');
    // merge update
    await docRef.set(data, { merge: true });
    const snap = await docRef.get();
    return { success: true, config: snap.data() };
  } catch (err) {
    console.error('updateLaunchConfig error', err);
    throw new functions.https.HttpsError('internal', 'Unable to update config');
  }
});
