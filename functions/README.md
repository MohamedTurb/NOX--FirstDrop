# NOX Firebase Functions

Functions included:

- `onWaitlistCreate` — Firestore trigger when a document is added to `waitlist`:
  - Increments `counters/waitlist` aggregate counter
  - Sends a welcome email via SendGrid (if configured)
  - Checks inviter and awards `vip` when `invitesCount` >= `VIP_THRESHOLD`

- `onWaitlistDelete` — decrements counter

- `exportWaitlistCSV` — callable HTTPS function that returns CSV of `waitlist`. Requires caller to be authenticated and have `isAdmin` custom claim.

- `setAdminClaim` — callable function to set `isAdmin` custom claim. Only callable by an existing admin.

Environment & deployment:

1. Install dependencies

```bash
cd functions
npm install
```

2. Set environment variables (recommended via `firebase functions:config:set`):

- `sendgrid.key` — your SendGrid API key
- `sendgrid.from` — email address for `from`
- `nox.vip_threshold` — optional VIP threshold (default 5)
- `nox.origin` — origin used in share links

Example:

```bash
firebase functions:config:set sendgrid.key="KEY" sendgrid.from="no-reply@nox.com" nox.vip_threshold="5" nox.origin="https://nox.com"
```

3. Deploy

```bash
firebase deploy --only functions
```

Notes:
- The functions assume you use Firebase Authentication for admin accounts and set the `isAdmin` custom claim on admin users.
- For local testing, set `SENDGRID_API_KEY` and `VIP_THRESHOLD` environment variables before running the emulator.
