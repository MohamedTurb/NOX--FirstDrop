import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  where,
} from 'firebase/firestore';

// generate a short referral id
export function generateReferralId() {
  return ('nox_' + Math.random().toString(36).substring(2, 9)).toLowerCase();
}

export async function createWaitlistEntry({ name, email, instagram, referredBy = null }) {
  const referralId = generateReferralId();
  const waitlistRef = collection(db, 'waitlist');

  // Create new document
  const newDoc = doc(waitlistRef);
  const payload = {
    name: name || '',
    email: email || '',
    instagram: instagram || '',
    referralId,
    referredBy: referredBy || null,
    invitesCount: 0,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(newDoc, payload);

    // If referredBy exists, increment inviter's invitesCount
    if (referredBy) {
      // find inviter by referralId
      const q = query(collection(db, 'waitlist'), where('referralId', '==', referredBy), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const inviterDoc = snap.docs[0];
        const inviterRef = inviterDoc.ref;
        // use transaction to increment safely
        await runTransaction(db, async (tx) => {
          const inviterSnap = await tx.get(inviterRef);
          if (!inviterSnap.exists()) return;
          const current = inviterSnap.data().invitesCount || 0;
          tx.update(inviterRef, { invitesCount: current + 1 });
        });
      }
    }

    return { success: true, referralId, id: newDoc.id };
  } catch (err) {
    console.error('createWaitlistEntry error', err);
    return { success: false, error: err };
  }
}

export function subscribeLeaderboard(cb, limitCount = 10) {
  const q = query(collection(db, 'waitlist'), orderBy('invitesCount', 'desc'), limit(limitCount));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(items);
  });
}

export function subscribeWaitlist(cb) {
  const q = query(collection(db, 'waitlist'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(items, snapshot.size);
  });
}

export async function getTotalWaitlistCount() {
  const snap = await getDocs(collection(db, 'waitlist'));
  return snap.size;
}

export function subscribeConfig(cb) {
  const docRef = doc(db, 'config', 'launch');
  return onSnapshot(docRef, (snap) => {
    cb(snap.exists() ? snap.data() : null);
  });
}

export async function getConfigOnce() {
  const snap = await getDoc(doc(db, 'config', 'launch'));
  return snap.exists() ? snap.data() : null;
}

export async function exportWaitlistCSV() {
  const snap = await getDocs(collection(db, 'waitlist'));
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (!rows.length) return null;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(',')]
    .concat(
      rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))
    )
    .join('\n');
  return csv;
}
