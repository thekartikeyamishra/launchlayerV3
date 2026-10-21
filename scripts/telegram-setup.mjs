// File: scripts/telegram-setup.mjs
// Purpose: Register the Telegram webhook with a secret token (run once after deploying).
// PowerShell: $env:TELEGRAM_BOT_TOKEN="..."; $env:TELEGRAM_WEBHOOK_SECRET="..."; npm run telegram:setup
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://launchlayer.me").replace(/\/$/, "");
if (!token || !secret) throw new Error("Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET first.");
if (!/^[A-Za-z0-9_-]{16,256}$/.test(secret)) throw new Error("TELEGRAM_WEBHOOK_SECRET must be 16–256 chars of A-Z a-z 0-9 _ -");
const call = async (method, body) => (await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();
console.log("setWebhook →", await call("setWebhook", { url: `${site}/api/telegram`, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: true }));
console.log("setMyCommands →", await call("setMyCommands", { commands: [{ command: "help", description: "How to use the LaunchLayer bot" }] }));
console.log("setMyDescription →", await call("setMyDescription", { description: "Tell me a task and I'll suggest AI tools that do it — from LaunchLayer's hand-reviewed directory." }));
