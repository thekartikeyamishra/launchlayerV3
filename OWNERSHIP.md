# Ownership & control checklist

Who owns LaunchLayer is decided by **who controls the accounts and paperwork**, not by the code. Work through this once, then review it every quarter.

## 1. Code
- [x] `LICENSE` — proprietary, all rights reserved to Kartikeya Mishra. `package.json` is `"license": "UNLICENSED"`, `"private": true`.
- [x] `THIRD_PARTY_NOTICES.md` + `src/fonts/OFL-*.txt` — every open-source dependency is under a permissive licence (MIT, Apache-2.0, BSD, ISC, OFL). There is no copyleft code in the app. The two non-permissive items are build- or server-only (see notes in that file). Run `npm run licenses` after adding any package, and avoid GPL/AGPL packages.
- [ ] Keep the GitHub repo **private** under *your* account, or an organisation you own. Turn on 2FA and branch protection on `main`.
- [ ] Commit under your own name and email: `git config user.name "Kartikeya Mishra"` and `git config user.email workmailkartikeya@gmail.com`.
- [ ] AI-assisted code: Anthropic's terms assign to you whatever rights it has in Claude's outputs. Your own direction, selection and edits are your authorship — keep this repo's history as the record.
- [ ] Anyone who contributes later (freelancer, employee, friend) signs a written IP assignment **before** their first commit.

## 2. Accounts — every one under an email you control, with 2FA
| Asset | Where | Why it matters |
|---|---|---|
| Domain `launchlayer.me` | Your registrar | Whoever holds the domain holds the brand. Turn on auto-renew and registrar lock. |
| GitHub repo | github.com/thekartikeyamishra | Source of truth |
| Firebase project `launchlayereco` | console.firebase.google.com | All user data. You must be **Owner**; add a second Owner only if you trust them fully. |
| Vercel (or other host) | vercel.com | Deployments and environment variables |
| Google Search Console, AdSense, Analytics | Google | Traffic and revenue. Put payouts into *your* bank account. |
| Razorpay (when added) | razorpay.com | Payments, under your PAN or company |
| Email for `CONTACT_EMAIL` | — | Legal notices and password resets |

Store recovery codes offline. Never share passwords — add people as members with the lowest role that works, and remove them when they leave.

## 3. Data — backups you control
- **Weekly Firestore export** (needs Blaze plan and the `gcloud` CLI):
  ```powershell
  gcloud config set project launchlayereco
  gsutil mb -l asia-south2 gs://launchlayer-backups   # once
  $env:FIREBASE_BACKUP_BUCKET="launchlayer-backups"; npm run backup
  ```
  Or schedule it in Firebase console → Firestore → Backups.
- Editorial content (tools, task guides) lives in this repo, so git is its backup.

## 4. No lock-in — exit plan
- **Hosting:** standard Next.js (`npm run build && npm start`) runs on Vercel, Netlify, Cloud Run, Render or any Node 20+ server.
- **Database:** Firestore data exports to standard formats; rules and indexes are in this repo.
- **Fonts and icons** are self-hosted; there are no runtime calls to font CDNs.
- **Search** runs in-process. There is no paid search or LLM API, so there is no per-query vendor bill.
- **Ads** are optional and controlled by environment variables. The site works fully without them.

## 5. Brand & company
- [ ] **Trademark:** file "LaunchLayer" (word mark) with India's IP office (ipindia.gov.in), Class 42 (software/SaaS) and Class 35 (online directories/advertising). Until it is registered, use "LaunchLayer™" (already in the footer).
- [ ] **Entity:** when revenue starts, consider an LLP or a Private Limited (OPC is possible as a sole founder). Then assign this IP to the company with a written IP assignment deed, and set `NEXT_PUBLIC_LEGAL_ENTITY` to the company name — the Terms and footer update automatically.
- [ ] Have the Terms, Privacy and Refund pages reviewed by a lawyer before taking payments.
- [ ] GST registration is needed once turnover crosses the threshold, or for export of services as required.
