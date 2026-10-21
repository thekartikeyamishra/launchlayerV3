// File: src/lib/public-api.ts
// Purpose: Shared logic for the public read API, MCP server and OpenAPI actions.
// Cost model: pure in-memory search over cached data — zero LLM spend per request,
// so AI-platform traffic costs us almost nothing and every answer links back to us.

import { filterTools, getAllTools, getTask, matchTasks, searchTools, TASKS, toolsForTask } from "./directory";
import { PRICING_LABELS, TOOL_CATEGORIES, type Tool } from "./directory-types";
import { SITE_URL } from "./site";

export function publicTool(t: Tool) {
  return {
    slug: t.slug,
    name: t.name,
    maker: t.maker,
    tagline: t.tagline,
    description: t.description,
    bestFor: t.bestFor,
    category: t.category,
    tasks: t.tasks,
    pricingModel: t.pricing,
    pricingLabel: PRICING_LABELS[t.pricing],
    api: t.api,
    openSource: t.openSource,
    platforms: t.platforms,
    strengths: t.pros,
    limits: t.cons,
    officialUrl: t.url,
    launchLayerUrl: `${SITE_URL}/tools/${t.slug}`,
    reviewedAt: t.reviewedAt,
  };
}

export interface SearchArgs {
  query?: string;
  category?: string;
  pricing?: string;
  api?: boolean;
  openSource?: boolean;
  limit?: number;
}

export async function apiSearch(args: SearchArgs) {
  const all = await getAllTools();
  const q = (args.query ?? "").slice(0, 100).trim();
  const base = q ? searchTools(all, q) : [...all].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = filterTools(base, { category: args.category, pricing: args.pricing, api: args.api, openSource: args.openSource });
  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 50);
  const tasks = q ? matchTasks(q).slice(0, 3) : [];
  return {
    query: q,
    total: filtered.length,
    tools: filtered.slice(0, limit).map(publicTool),
    relatedGuides: tasks.map((t) => ({ slug: t.slug, title: t.title, url: `${SITE_URL}/tasks/${t.slug}` })),
    noMatch: filtered.length === 0
      ? { suggestion: "No listed tool matches. The user can post this need on the LaunchLayer demand board so builders can respond.", postRequestUrl: `${SITE_URL}/demand/new?title=${encodeURIComponent(q.slice(0, 120))}` }
      : undefined,
    disclaimer: "Pricing is the pricing model only; confirm current prices on the official site.",
    source: SITE_URL,
  };
}

export async function apiGetTool(slug: string) {
  const all = await getAllTools();
  const t = all.find((x) => x.slug === slug);
  return t ? publicTool(t) : null;
}

export function apiListTasks() {
  return TASKS.map((t) => ({ slug: t.slug, title: t.title, url: `${SITE_URL}/tasks/${t.slug}` }));
}

export async function apiGetTask(slug: string) {
  const task = getTask(slug);
  if (!task) return null;
  const tools = toolsForTask(await getAllTools(), slug);
  return {
    slug: task.slug,
    title: task.title,
    guide: task.intro,
    whatToLookFor: task.lookFor,
    mistakesToAvoid: task.pitfalls,
    tools: tools.map(publicTool),
    url: `${SITE_URL}/tasks/${task.slug}`,
  };
}

export const CATEGORY_SLUGS = TOOL_CATEGORIES.map((c) => c.slug);

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Authorization",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

// Best-effort per-instance rate limit (serverless instances are short-lived; pair with the
// host's firewall/WAF for hard limits). Protects against naive scraping loops.
const buckets = new Map<string, { tokens: number; at: number }>();
export function rateLimited(ip: string, perMinute = 120): boolean {
  const now = Date.now();
  const b = buckets.get(ip) ?? { tokens: perMinute, at: now };
  b.tokens = Math.min(perMinute, b.tokens + ((now - b.at) / 60000) * perMinute);
  b.at = now;
  if (b.tokens < 1) {
    buckets.set(ip, b);
    return true;
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  if (buckets.size > 5000) buckets.clear();
  return false;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
}
