// File: scripts/create-admin.mjs
// Purpose: Create (or update) a staff account securely — Firebase Auth user + admins/{uid} role.
// The password is typed at a hidden prompt and sent straight to Firebase Auth. It is never
// written to disk, to the repo, to Firestore, or to logs.
//
// Usage (PowerShell):
//   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\secure\launchlayer-service-account.json"
//   npm run admin:create -- --email you@example.com --username kartikeyahere --role superadmin
//
// Change an existing staff account's email, keeping its password, username and role:
//   npm run admin:create -- --from old@example.com --email new@example.com
//   (press Enter at the password prompt to keep the current password)
//
// Service account key: Firebase console → Project settings → Service accounts → Generate new
// private key. Store it OUTSIDE the repo; it grants full access to your project.

import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const ROLES = ["superadmin", "admin", "moderator", "editor", "analyst"];

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function hiddenPrompt(question) {
  return new Promise((resolve) => {
    let muted = false;
    const out = new Writable({ write(chunk, enc, cb) { if (!muted) process.stdout.write(chunk, enc); cb(); } });
    const rl = createInterface({ input: process.stdin, output: out, terminal: true });
    rl.question(question, (answer) => { rl.close(); process.stdout.write("\n"); resolve(answer); });
    muted = true;
  });
}

const email = arg("email")?.trim().toLowerCase();
const username = (arg("username") ?? "").replace(/^@/, "").trim();
const roleArg = arg("role");
const from = arg("from")?.trim().toLowerCase();

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Pass --email you@domain");
if (roleArg && !ROLES.includes(roleArg)) throw new Error(`--role must be one of: ${ROLES.join(", ")}`);
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error("Set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON path (outside the repo).");

initializeApp({ credential: applicationDefault() });
const auth = getAuth();
const db = getFirestore();

let user;

// Email migration: move the account to the new address. Password is untouched.
if (from && from !== email) {
  const old = await auth.getUserByEmail(from);
  user = await auth.updateUser(old.uid, { email, emailVerified: false });
  console.log(`Email changed: ${from} → ${email} (uid ${user.uid}). Password unchanged.`);
}

try {
  user = await auth.getUserByEmail(email);
  console.log(`Found existing account ${user.uid}.`);
  const change = (await hiddenPrompt("New password (leave blank to keep the current one): ")).trim();
  if (change) {
    if (change.length < 12) throw new Error("Use at least 12 characters for a staff password.");
    await auth.updateUser(user.uid, { password: change });
    console.log("Password updated.");
  }
} catch (e) {
  if (e?.code !== "auth/user-not-found") throw e;
  const password = await hiddenPrompt("Password for the new staff account: ");
  const again = await hiddenPrompt("Repeat password: ");
  if (password !== again) throw new Error("Passwords don't match.");
  if (password.length < 12) throw new Error("Use at least 12 characters for a staff password.");
  user = await auth.createUser({ email, password, displayName: username || email.split("@")[0], emailVerified: false });
  console.log(`Created account ${user.uid}.`);
}

const existing = (await db.doc(`admins/${user.uid}`).get()).data() ?? {};
const role = roleArg ?? existing.role ?? "superadmin";
const finalUsername = username || existing.username || "";
await db.doc(`admins/${user.uid}`).set({ role, username: finalUsername, email, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
const profileRef = db.doc(`users/${user.uid}`);
if (!(await profileRef.get()).exists) {
  await profileRef.set({ displayName: finalUsername || email.split("@")[0], verifiedCreator: false, verifiedCreatorRequest: "none", createdAt: FieldValue.serverTimestamp() });
}
console.log(`Done: ${email} (@${finalUsername || "—"}) is now ${role}. Sign in at /sign-in, then open /admin.`);
console.log("Next: turn on multi-factor sign-in for staff in Firebase Auth, and keep the service-account key offline.");
process.exit(0);
