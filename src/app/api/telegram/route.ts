// File: src/app/api/telegram/route.ts
// Purpose: Telegram bot — people message the bot a task and get matching AI tools back.
// Cost: zero AI spend (in-process search) and Telegram's Bot API is free.
// Security: Telegram signs every webhook call with our secret header; anything else is ignored.
// Privacy: message text is used only to answer and is not stored.
//
// Setup: set TELEGRAM_BOT_TOKEN + TELEGRAM_WEBHOOK_SECRET (server-only env vars — never
// NEXT_PUBLIC_), deploy, then run: npm run telegram:setup

import { timingSafeEqual } from "node:crypto";
import { apiSearch, rateLimited } from "@/lib/public-api";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);

function validSecret(header: string | null): boolean {
  if (!SECRET || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function reply(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", link_preview_options: { is_disabled: true } }),
  }).catch(() => undefined);
}

const HELP =
  "👋 I'm the LaunchLayer bot. Tell me a job and I'll suggest AI tools that do it.\n\nTry: <i>summarise PDFs</i>, <i>Hindi voiceover</i>, <i>meeting notes without a bot</i>, <i>chatgpt vs claude</i>.\n\nListings are hand-reviewed; ranking is never paid for.";

export async function POST(req: Request) {
  if (!TOKEN || !validSecret(req.headers.get("x-telegram-bot-api-secret-token"))) {
    return new Response("forbidden", { status: 403 });
  }
  let update: { message?: { chat?: { id?: number; type?: string }; text?: string } };
  try {
    update = await req.json();
  } catch {
    return new Response("ok");
  }
  const chatId = update.message?.chat?.id;
  const text = (update.message?.text ?? "").trim().slice(0, 200);
  // Private chats only — avoids the bot reacting to every message in groups.
  if (typeof chatId !== "number" || update.message?.chat?.type !== "private" || !text) return new Response("ok");
  if (rateLimited(`tg:${chatId}`, 20)) return new Response("ok");

  if (/^\/(start|help)\b/i.test(text)) {
    await reply(chatId, HELP);
    return new Response("ok");
  }

  const result = await apiSearch({ query: text.replace(/^\/\w+\s*/, ""), limit: 3 });
  if (result.tools.length === 0) {
    await reply(
      chatId,
      `I couldn't find a listed tool for “${esc(text)}”.\n\nYou can post it as a request so builders see it:\n${result.noMatch?.postRequestUrl ?? `${SITE_URL}/demand/new`}`,
    );
    return new Response("ok");
  }
  const lines = result.tools.map(
    (t, i) => `<b>${i + 1}. ${esc(t.name)}</b> — ${esc(t.tagline)}\n${esc(t.pricingLabel)}${t.api ? " · API" : ""}\n${t.launchLayerUrl}`,
  );
  const guide = result.relatedGuides[0];
  await reply(
    chatId,
    `${lines.join("\n\n")}${guide ? `\n\n📘 Guide: ${guide.url}` : ""}\n\n<i>Pricing models only — confirm current prices on each official site.</i>`,
  );
  return new Response("ok");
}
