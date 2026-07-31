# LaunchLayer — Demand Board MVP (v1)

The trust layer for the AI economy. This is the committed v1 scope from the Master
Documentation Set: a public board of real AI-solution demand, creator opportunity views,
link-out claims, Trust v0, and a minimal admin console. **No on-platform payments in v1.**

## Stack
Next.js 15 (App Router, TypeScript strict) · Firebase Auth + Firestore · Tailwind CSS v4 · GA4 (optional)

## Setup (Windows / PowerShell)

1. **Install dependencies**
   ```powershell
   npm install
   ```

2. **Firebase project**
   - In the Firebase Console, create (or open) your project.
   - Create the **Firestore database in `asia-south2` (Delhi)** — the region is fixed at creation.
   - Enable **Authentication → Sign-in methods**: Email/Password and Google.
   - Project settings → Your apps → add a **Web app**, copy the config.

3. **Environment**
   ```powershell
   Copy-Item .env.example .env.local
   ```
   Fill every `NEXT_PUBLIC_FIREBASE_*` value. `NEXT_PUBLIC_GA_MEASUREMENT_ID` is optional.

4. **Deploy security rules and indexes** (this project is deny-by-default until you do)
   ```powershell
   npx firebase login
   npx firebase use --add        # select your project
   npx firebase deploy --only firestore
   ```

5. **Run**
   ```powershell
   npm run dev                   # http://localhost:3000
   ```

## Making yourself admin
Admin access is granted manually (by design — Trust v0):
1. Sign up in the app, copy your UID from Firebase Console → Authentication.
2. In Firestore, create collection `admins` → document ID = your UID → add field `role: "superadmin"`.
3. Reload the app; the Admin link appears in the header.

## Deploy to Vercel
- Import the repo in Vercel, add the same env vars.
- Set the function region to Mumbai: create `vercel.json` with `{ "regions": ["bom1"] }`.
- Add your production domain to Firebase Auth → Authorized domains.

## What's deliberately NOT in v1
Payments, escrow, KYC/AML, trust scores, hosted listings, automated scanning, Launch
Battles, enterprise features. Per the launch plan, nothing marked [v2]/[Target] is built
until the validation gate passes: **100 organic demand posts + 20 creator claims in 60 days.**

The weekly Pulse **email** digest requires Cloud Functions (Blaze plan); the live `/pulse`
page ships in v1 and the email job is the first post-launch addition.

## Legal
`/legal/*` pages are launch-ready drafts aligned to the DPDP Act and GDPR. Have them
reviewed by qualified counsel before public launch, and add your Grievance Officer contact
to the Privacy Policy (required by DPDP/IT Rules).
