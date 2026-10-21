// File: scripts/check-links.mjs
// Purpose: Detect dead or moved tools before each deploy (fixes the #1 directory complaint:
// stale, broken listings). Usage: npm run check:links   (Node 20+, no dependencies)
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/tools-data.ts", import.meta.url), "utf8");
const entries = [...src.matchAll(/slug: "([^"]+)", name: "([^"]+)", url: "([^"]+)"/g)].map((m) => ({ slug: m[1], name: m[2], url: m[3] }));

const check = async ({ slug, url }) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "LaunchLayerLinkCheck/1.0 (+https://launchlayer.me/editorial-policy)" } });
    const moved = new URL(res.url).hostname.replace(/^www\./, "") !== new URL(url).hostname.replace(/^www\./, "");
    return { slug, url, status: res.status, final: res.url, moved };
  } catch (e) {
    return { slug, url, status: 0, error: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(timer);
  }
};

const results = [];
for (let i = 0; i < entries.length; i += 6) results.push(...(await Promise.all(entries.slice(i, i + 6).map(check))));

// 403/429 usually means bot protection, not a dead site — flag for a manual look.
const dead = results.filter((r) => r.status === 0 || r.status === 404 || r.status === 410 || r.status >= 500);
const manual = results.filter((r) => r.status === 403 || r.status === 429);
const moved = results.filter((r) => r.moved);

console.log(`Checked ${results.length} tools.`);
for (const r of dead) console.log(`DEAD    ${r.slug.padEnd(20)} ${r.status || r.error}  ${r.url}`);
for (const r of moved) console.log(`MOVED   ${r.slug.padEnd(20)} → ${r.final}`);
for (const r of manual) console.log(`CHECK   ${r.slug.padEnd(20)} ${r.status} (bot protection?)  ${r.url}`);
if (!dead.length && !moved.length) console.log("All tool links resolve.");
process.exitCode = dead.length ? 1 : 0;
