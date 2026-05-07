# NOX Growth & Launch System

A complete viral growth + launch system for a streetwear brand built with **React**, **Firebase**, and **Cloud Functions**.

## 🎯 Features

### 1. 🔁 Referral System (Viral Loop)
- Unique referral ID per signup (`nox_XXXXX`)
- Share-to-earn: referral link format `?ref=USER_ID`
- Real-time referral tracking and leaderboard
- Automatic VIP status when threshold reached (default: 5 referrals)

### 2. 📊 Admin Dashboard
- Live waitlist counter with real-time updates
- User table (name, email, instagram, referral metrics)
- Top referrers leaderboard
- CSV export for email campaigns
- Secure Google Sign-in with `isAdmin` custom claim
- Toggle "sold out" status and VIP window settings

### 3. 💌 Conversion & Follow-ups
- Auto-generated referral link shown post-signup
- Copy-to-clipboard and WhatsApp share buttons
- Pre-written email and WhatsApp templates for sharing
- Welcome emails sent via Cloud Functions + SendGrid
- VIP notification emails for top referrers

### 4. 🔥 Scarcity Engine
- Configurable max waitlist spots
- Real-time countdown timer to close waitlist
- Automatic "Sold out" messaging
- VIP early access window (configurable hours)
- Aggregate counter for spot tracking

### 5. 🔐 Security
- Firebase Authentication (Google sign-in)
- Admin-only access via `isAdmin` custom claim
- Callable Cloud Functions with authentication checks
- Firestore security rules ready for production

## 📁 Project Structure

```
e:/Brand/Landing/
├── src/
│   ├── firebase.js              # Firebase client init
│   ├── firebaseConfig.json      # Firebase config
│   ├── firebaseHelpers.js       # Referral & leaderboard helpers
│   ├── App.jsx                  # Router (landing / admin)
│   ├── main.jsx                 # React entry
│   ├── index.css                # Tailwind imports
│   ├── components/
│   │   ├── AdminDashboard.jsx   # Admin UI with auth + actions
│   │   ├── LiveWaitlistCounter.jsx  # Real-time counter
│   │   └── ScarcityTimer.jsx    # Countdown timer
│   └── NOXLandingPage.jsx       # Landing page + signup form
├── functions/
│   ├── index.js                 # Cloud Functions
│   ├── package.json             # Functions dependencies
│   └── README.md                # Functions deployment guide
├── package.json                 # Client dependencies
├── vite.config.js               # Vite config
├── tailwind.config.js           # Tailwind config
└── index.html                   # HTML entry
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project (get one at [firebase.google.com](https://firebase.google.com))

### 1. Setup Client

```bash
cd e:/Brand/Landing
npm install
```

Update `src/firebase.js` with your Firebase config (or it's already set in `src/firebaseConfig.json`).

### 2. Run Locally

```bash
npm run dev
```

Access at `http://localhost:517X` (port printed in terminal).

- **Landing page**: `http://localhost:517X/`
- **Admin dashboard**: `http://localhost:517X/admin` (requires Google sign-in + `isAdmin` claim)

### 3. Setup Cloud Functions

```bash
cd functions
npm install
```

Set runtime config:

```bash
firebase functions:config:set \
  sendgrid.key="YOUR_SENDGRID_API_KEY" \
  sendgrid.from="no-reply@nox.com" \
  nox.vip_threshold="5" \
  nox.origin="https://nox.com"
```

Deploy:

```bash
firebase deploy --only functions
```

## 🔧 Configuration

### Firestore Collections

**`waitlist`** — Waitlist documents

```json
{
  "id": "auto-generated",
  "name": "John Doe",
  "email": "john@example.com",
  "instagram": "@johndoe",
  "referralId": "nox_abc123xyz",
  "referredBy": "nox_inviter123",
  "invitesCount": 0,
  "vip": false,
  "createdAt": "2026-05-07T12:00:00Z"
}
```

**`config/launch`** — Global launch settings

```json
{
  "maxSpots": 500,
  "soldOut": false,
  "waitlistCloseAt": "2026-05-15T00:00:00Z",
  "vipWindowHours": 48
}
```

**`counters/waitlist`** — Aggregate waitlist count (maintained by Cloud Functions)

```json
{
  "count": 42
}
```

### Environment Variables

Create a `.env` file in the project root (optional, for client-side overrides):

```
VITE_FB_PROJECT_ID=nox-streetwear
VITE_FB_AUTH_DOMAIN=nox-streetwear.firebaseapp.com
```

## 🎯 How It Works

### Referral Flow

1. User visits landing page and signs up with name, email, instagram
2. `createWaitlistEntry()` generates a unique `referralId` and writes to Firestore
3. New user sees their referral link: `origin/?ref=nox_XXXXX`
4. User shares link (copy, WhatsApp, email template provided)
5. New visitor arrives with `?ref=XXXXX` parameter
6. On signup, `referredBy` is set and inviter's `invitesCount` is atomically incremented
7. When `invitesCount >= VIP_THRESHOLD`, user is marked as `vip: true` and notified

### Admin Dashboard Flow

1. Admin visits `/admin` and signs in with Google
2. Client checks `isAdmin` custom claim via `getIdTokenResult()`
3. If admin, dashboard shows:
   - Real-time waitlist count (from `counters/waitlist`)
   - User table (from `waitlist` collection)
   - Top referrers (leaderboard query)
4. Admin can:
   - Export CSV (calls `exportWaitlistCSV` Cloud Function)
   - Mark sold out (calls `updateLaunchConfig`)
   - Set VIP window hours (calls `updateLaunchConfig`)

### Scarcity Engine

1. Landing page subscribes to `config/launch` on mount
2. If `soldOut: true` or current count >= `maxSpots`, form is disabled
3. `ScarcityTimer` component shows countdown to `waitlistCloseAt`
4. On close date, admins can toggle `soldOut: true` to show "Sold out forever" messaging

### Cloud Functions

**`onWaitlistCreate`** triggered on new document:
- Increments `counters/waitlist` atomically
- Sends welcome email (if SENDGRID_KEY set)
- Checks inviter and awards VIP if threshold met

**`exportWaitlistCSV`** callable:
- Requires authentication + `isAdmin` claim
- Returns CSV of all waitlist documents

**`updateLaunchConfig`** callable:
- Requires authentication + `isAdmin` claim
- Merges config updates into `config/launch`

**`setAdminClaim`** callable:
- Requires existing admin
- Sets `isAdmin` custom claim on another user (for onboarding admins)

## 📧 Email Integration (SendGrid)

The `onWaitlistCreate` Cloud Function sends a welcome email when a new user signs up:

```
To: user@email.com
Subject: Welcome — you're on the NOX waitlist
Body: Includes their unique referral link and CTA to share
```

VIP users also receive:

```
To: user@email.com
Subject: You earned VIP Early Access — NOX
Body: Congratulation message + next steps
```

**To enable:**

1. Get a SendGrid API key: [sendgrid.com](https://sendgrid.com)
2. Verify a sender email in SendGrid
3. Set Firebase Functions config:

```bash
firebase functions:config:set \
  sendgrid.key="YOUR_KEY" \
  sendgrid.from="verified-sender@nox.com"
```

## 🧪 Local Testing

### Test Signup Flow

1. Open landing page
2. Fill form and submit
3. See success message with referral link
4. Copy link and open in incognito window
5. Submit another signup — first user's `invitesCount` should increment in real-time (visible in Admin dashboard)

### Test Admin Dashboard

1. Set an admin user via Firebase Console:
   - Go to Authentication > Users
   - Find your test user
   - Custom Claims: `{"isAdmin": true}`
2. Navigate to `/admin` and sign in with that account
3. Dashboard should display all users and data

### Test Cloud Functions (Local Emulator)

```bash
firebase emulators:start --only functions,firestore
```

Then update `src/firebase.js` to connect to emulator:

```javascript
import { connectFirestoreEmulator } from 'firebase/firestore';
connectFirestoreEmulator(db, 'localhost', 8080);
```

## 🛡️ Security & Production Checklist

- [ ] Set Firestore security rules to restrict direct writes to `config/launch` (admins only)
- [ ] Verify Firebase Authentication is configured (Google provider enabled)
- [ ] Add rate limiting to prevent referral abuse
- [ ] Deploy functions with SendGrid config set
- [ ] Monitor Cloud Function logs for errors
- [ ] Add email verification for signups (optional, reduces spam)
- [ ] Test admin functions with actual Firebase project
- [ ] Set up monitoring/alerts for function failures
- [ ] Review and update `functions/README.md` before production deploy

## 📦 Build & Deploy

### Build for Production

```bash
npm run build
```

Output in `dist/` folder.

### Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Or deploy everything (functions + hosting):

```bash
firebase deploy
```

## 📝 API Reference

### Client Helpers (`src/firebaseHelpers.js`)

- `createWaitlistEntry(data)` — Create waitlist doc with referral
- `subscribeLeaderboard(cb, limit)` — Real-time leaderboard
- `subscribeWaitlist(cb)` — Real-time waitlist documents
- `subscribeConfig(cb)` — Real-time config subscription
- `getTotalWaitlistCount()` — Get current total
- `exportWaitlistCSV()` — Export all users

### Cloud Functions

All callable functions require authentication:

- `updateLaunchConfig(data)` — Update `config/launch` (admin-only)
- `exportWaitlistCSV()` — Export CSV (admin-only)
- `setAdminClaim({uid, makeAdmin})` — Set admin claim (admin-only)

Triggered functions:

- `onWaitlistCreate` — Auto-runs on new signup
- `onWaitlistDelete` — Auto-runs on removal

## 🐛 Troubleshooting

**Admin dashboard shows "Sign in" but I'm already signed in**
- Custom claim might not be set. Use Firebase Console to set `{"isAdmin": true}` on your user account.

**Welcome emails not sending**
- Verify `SENDGRID_API_KEY` is set via `firebase functions:config:get`
- Check Cloud Functions logs: `firebase functions:log`

**Referral count not incrementing**
- Ensure you're visiting the page with the `?ref=nox_XXXXX` parameter
- Check Firestore `waitlist` collection — `referredBy` should be set

**Countdown timer shows "—"**
- Ensure `config/launch` document exists with `waitlistCloseAt` timestamp

## 📄 License

MIT

## 🤝 Contributing

This is a starter template. Feel free to extend with:
- Email verification via Firebase Auth
- SMS notifications (Twilio)
- Analytics dashboard
- API key gating for partners
- Webhook integrations (Slack, Discord)

---

**Built with ❤️ for NOX streetwear brand**
