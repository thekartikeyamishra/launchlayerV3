# LaunchLayer — honest AI tools directory + demand board (v0.3)

**Find the right AI tool for the job — or post the one that doesn't exist yet.**
Live at https://launchlayer.me

## What's in this version
| Area | What it does |
|---|---|
| **AI tools directory** | 90 hand-reviewed tools (`src/lib/tools-data.ts`), task-first search with plain-language intent matching, filters (free plan, API, open source), clean category pages |
| **Task guides** | 26 guides (`src/lib/tasks-data.ts`) — what to look for, mistakes to avoid, tools, at-a-glance table |
| **Tool pages** | Description, best-for, strengths/limits, key facts, alternatives, compare, real-use reviews, free correction flow |
| **Comparisons** | `/compare` + 15 editor-written `/compare/x-vs-y` guides (high-intent search pages) |
| **Maker badges** | `/badge/{slug}` SVG + copy-paste embed on every tool page → backlinks at zero CAC |
| **Lumi assistant** | Animated mascot (8 moods, pointer-tracking eyes). Chat or voice, English + Hindi. Answers from our own search: **₹0 AI cost per question** |
| **Admin with roles** | `/admin`: Overview dashboard, Submissions, Reports, Creators, Users, Team. Roles: superadmin, admin, moderator, editor, analyst — enforced in `firestore.rules` |
| **Telegram bot** | `/api/telegram` — people message a task and get tools back. Free API, secret-verified webhook |
| **Draft recovery** | Half-filled requests and submissions autosave on the device; the home page nudges people to finish them |
| **Personal library** | `/saved` — save tools + private autosaving notes (the retention loop) |
| **Most-saved ranking** | `/tools?sort=saved` — ordered by real save counts only |
| **Your data, your control** | Account export includes saved tools, notes and reviews; account deletion erases them |
| **Free submissions** | `/submit` → admin queue → published to `/tools` |
| **Demand board** | Unchanged v1 board; now the fallback for every search with no match |
| **AI integrations** | MCP server `/api/mcp`, REST `/api/v1/*`, OpenAPI `/openapi.json` (ChatGPT Actions), `/.well-known/ai-plugin.json`, `/llms.txt`, `/llms-full.txt` |
| **Monetisation** | AdSense — consent-gated, labelled, CLS-safe, only on tool & task pages; `/ads.txt` auto-generated |
| **Trust / legal** | About, Contact (+ Grievance Officer), Editorial & ranking policy, Terms, Privacy (AdSense disclosures), Refund, AUP |

### Fixes vs. what users complain about on There's An AI For That
| Complaint | LaunchLayer |
|---|---|
| Paid listings ($49–$437) and **paid listing updates** | Free listing, free corrections, forever |
| Sponsored listings blended into results with a small "Ad" tag | Ads labelled "Advertisement", outside lists, never styled as tools; payment never changes ranking |
| Login wall on the weekly feed | Nothing requires login to read |
| No ratings — only saves | Reviews must state what the tool was used for; averages only after 3 reviews |
| Cluttered: 3 overlapping menus, ~90 filter checkboxes, scope creep | 4 nav items, 4 filters, tools-only scope |
| Stale/dead listings, inconsistent states | "Reviewed" date on every card, `npm run check:links`, honest empty/error states |
| Nowhere to go when no tool exists | Every miss converts into a demand-board request |

## Ownership
Proprietary — see `LICENSE`. Account, backup, trademark and company checklist: **`OWNERSHIP.md`**. Dependency licences: `THIRD_PARTY_NOTICES.md` (`npm run licenses`).

## Setup (Windows / PowerShell, Node 22, npm 11)
```powershell
npm install
Copy-Item .env.example .env.local   # fill in Firebase values (same as before)
npx firebase deploy --only firestore   # REQUIRED: new rules + indexes for tools, reviews, saves
npm run dev                            # http://localhost:3000
```
Before each deploy: `npm run typecheck`, `npm run build`, `npm run check:links`.
After deploy: `npm run check:mcp -- https://launchlayer.me`

**Security note:** the old `.env.example` contained your real Firebase web config. Those keys are public by design, but restrict the API key to your domains in Google Cloud Console → APIs & Services → Credentials → HTTP referrers (`launchlayer.me/*`, `*.vercel.app/*`, `localhost:3000/*`).

## Deploy (Vercel)
Set all env vars from `.env.example`. Add `launchlayer.me` as primary and `www.launchlayer.me` as a redirect. Add both to Firebase Auth → Authorized domains. Optional `vercel.json`: `{ "regions": ["bom1"] }`.

## Google Search Console & Bing
1. Add the property, choose "HTML tag", put the content value in `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (Bing: `NEXT_PUBLIC_BING_SITE_VERIFICATION`), redeploy, verify.
2. Submit `https://launchlayer.me/sitemap.xml`.

## AdSense — honest expectations
1. Apply once the site has been live and indexed for a few weeks and has steady organic traffic. Set `NEXT_PUBLIC_ADSENSE_CLIENT` first so the verification meta tag and `/ads.txt` are present.
2. After approval, create two responsive display units and set `NEXT_PUBLIC_ADSENSE_SLOT_TOOL` / `_TASK`.
3. EEA/UK/Swiss traffic: enable Google's certified CMP in AdSense → Privacy & messaging.

No code can guarantee approval or a revenue figure. $5,000/month at typical directory RPMs ($2–$10 per 1,000 pageviews, higher for US/UK) means roughly 0.5–2.5M pageviews/month. The levers that get there are content depth (more tools and guides, kept fresh), real reviews, and AI-assistant referrals via the MCP/API — not more ad units. Adding ad units on thin pages is the fastest route back to "low-value content".

## Growing the directory (keep it high-value)
- Add tools in `tools-data.ts` with your own description, honest pros/cons, and accurate task tags — or approve submissions in `/admin`.
- Add a task guide only when it has 3+ good tools and genuinely useful guidance.
- Never bulk-generate pages; quality over count.

## Admin accounts (secure setup)
Passwords never go in code, `.env` files or Firestore. Create staff with the script — it asks for the password at a hidden prompt and sends it straight to Firebase Auth:
```powershell
# 1. Firebase console → Project settings → Service accounts → Generate new private key.
#    Save it OUTSIDE this repo, e.g. C:\secure\launchlayer-sa.json
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\secure\launchlayer-sa.json"
# 2. Create your super admin
npm run admin:create -- --email kartikeyamishra@launchlayer.com --username kartikeyahere --role superadmin

# Already created the account under the old email? Move it — password, username and role stay the same.
# Press Enter at the password prompt to keep the current password.
npm run admin:create -- --from kartikeyahere@seeveworks.com --email kartikeyamishra@launchlayer.com
```
The staff email must be on a domain you control (password resets and security alerts go there). The site's domain is `launchlayer.me`. If you don't own `launchlayer.com`, use `@launchlayer.me` instead.
Then sign in at `/sign-in` with that email and password and open `/admin`. Add teammates from **Admin → Team** (they sign up first; paste their UID) using the lowest role that works. Turn on multi-factor sign-in for staff (Firebase Auth → Sign-in method → Advanced → Multi-factor).

| Role | Can do |
|---|---|
| superadmin | Everything + manage team (can't change own role — no lock-out) |
| admin | Moderation, listings, creator approvals, user lookup |
| moderator | Reports, reviews, comments, demand posts, submissions |
| editor | Tool submissions and listings |
| analyst | Read-only dashboard |

**Penalties:** moderators can suspend an account from Admin → Users, with a written reason. The reason is shown to the user, and they can appeal. Suspended accounts can still browse, export and delete their data. Security rules block them from posting, reviewing, submitting, commenting or claiming. Suspensions live in `suspensions/{uid}` and are kept for appeals.

## Telegram bot (optional)
1. Message **@BotFather** → `/newbot` → copy the token.
2. In Vercel set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` (server-only — never `NEXT_PUBLIC_`). Redeploy.
3. Locally: `$env:TELEGRAM_BOT_TOKEN="…"; $env:TELEGRAM_WEBHOOK_SECRET="…"; npm run telegram:setup`

WhatsApp is left out on purpose: the official WhatsApp Business Platform needs Meta business verification and charges per conversation, and unofficial WhatsApp bots break WhatsApp's terms. Add it when revenue justifies it. ChatGPT and Claude are already covered by the MCP server.

## Running costs (per-user economics)
The design rule: **no per-visitor work that costs money.**
| Item | How it's kept cheap | Cost per extra user |
|---|---|---|
| Pages | Prerendered/ISR, served from the CDN | ~₹0 |
| Search, Lumi, MCP, API, Telegram | In-process search over cached data, no LLM calls | ₹0 |
| Demand board search + stats | `/api/v1/demand/pool` and `/stats`: one batched read per 5–15 min, CDN-cached (previously 300–1,000 reads per visitor) | ~₹0 |
| Page-view analytics | Sent to GA only; Firestore stores product actions only | ₹0 |
| Saves, reviews, posts | 1–3 Firestore operations each, only when a user acts | fractions of a paisa |
| Admin dashboard | Count aggregations, refreshed on demand only | negligible |
| Fonts, icons, OG image | Self-hosted / generated at build | ₹0 |

Firebase Spark (free) plus Vercel Hobby covers early traffic. Set a **budget alert** in Google Cloud Billing (e.g. ₹500/month) so you are never surprised. If you ever add a paid LLM to Lumi, put it behind a paid plan, a per-user daily cap, and server-side keys. The current version deliberately uses none.

## Later
- Full Hindi site translation (Lumi and search already understand Hindi)
- Remotion launch video and mobile apps (store links: `NEXT_PUBLIC_PLAY_STORE_URL` / `NEXT_PUBLIC_APP_STORE_URL`).
- Payments: Razorpay (India + international) for optional, labelled sponsorships. PayPal link stub is commented in `Footer.tsx`. Refund policy page is ready.
- Legal pages are carefully drafted but should be reviewed by counsel before taking payments.
