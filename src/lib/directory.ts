// File: src/lib/directory.ts
// Purpose: Directory data access + search. Pure functions over editorial seed data merged
// with admin-approved community listings (Firestore REST, public read, cached 10 min).
// Safe for server components and route handlers. No Firebase client SDK here.

import { EDITORIAL_TOOLS } from "./tools-data";
import { TASKS } from "./tasks-data";
import {
  TOOL_CATEGORIES,
  type PricingModel,
  type Task,
  type Tool,
  type ToolCategorySlug,
} from "./directory-types";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

type RestValue = {
  stringValue?: string;
  booleanValue?: boolean;
  arrayValue?: { values?: RestValue[] };
};
interface RestDoc {
  name?: string;
  fields?: Record<string, RestValue>;
}

const CATEGORY_SLUGS = new Set<string>(TOOL_CATEGORIES.map((c) => c.slug));
const PRICING = new Set<string>(["free", "freemium", "paid", "free-trial"]);

function strArr(v?: RestValue): string[] {
  return (v?.arrayValue?.values ?? []).map((x) => x.stringValue ?? "").filter(Boolean);
}

function docToTool(doc: RestDoc): Tool | null {
  const f = doc.fields;
  const slug = doc.name?.split("/").pop();
  if (!f || !slug) return null;
  const category = f.category?.stringValue ?? "";
  const pricing = f.pricing?.stringValue ?? "";
  const url = f.url?.stringValue ?? "";
  if (!CATEGORY_SLUGS.has(category) || !PRICING.has(pricing) || !url.startsWith("https://")) return null;
  return {
    slug,
    name: f.name?.stringValue ?? slug,
    url,
    maker: f.maker?.stringValue ?? "",
    tagline: f.tagline?.stringValue ?? "",
    description: f.description?.stringValue ?? "",
    category: category as ToolCategorySlug,
    tasks: strArr(f.tasks),
    pricing: pricing as PricingModel,
    api: f.api?.booleanValue === true,
    openSource: f.openSource?.booleanValue === true,
    platforms: strArr(f.platforms).length ? strArr(f.platforms) : ["Web"],
    pros: strArr(f.pros),
    cons: strArr(f.cons),
    bestFor: f.bestFor?.stringValue ?? "",
    reviewedAt: f.reviewedAt?.stringValue ?? new Date().toISOString().slice(0, 10),
    source: "community",
  };
}

async function fetchCommunityTools(): Promise<Tool[]> {
  if (!PROJECT_ID || !API_KEY) return [];
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tools?pageSize=300&key=${API_KEY}`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { documents?: RestDoc[] };
    return (json.documents ?? []).map(docToTool).filter((t): t is Tool => t !== null);
  } catch {
    return [];
  }
}

/** Public save counts (toolStats), cached 10 min. Real signals only — never seeded or estimated. */
export async function fetchSaveCounts(): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!PROJECT_ID || !API_KEY) return out;
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/toolStats?pageSize=300&key=${API_KEY}`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) return out;
    const json = (await res.json()) as { documents?: Array<{ name?: string; fields?: { saveCount?: { integerValue?: string } } }> };
    for (const d of json.documents ?? []) {
      const slug = d.name?.split("/").pop();
      const n = Number(d.fields?.saveCount?.integerValue ?? 0);
      if (slug && n > 0) out.set(slug, n);
    }
  } catch {
    // Counts are an enhancement; lists still render alphabetically.
  }
  return out;
}

/** All listings; editorial entries win on slug collisions. Deduplicated by slug and URL host. */
export async function getAllTools(): Promise<Tool[]> {
  const community = await fetchCommunityTools();
  const seen = new Set<string>();
  const hosts = new Set<string>();
  const out: Tool[] = [];
  for (const t of [...EDITORIAL_TOOLS, ...community]) {
    const host = hostOf(t.url);
    if (seen.has(t.slug) || (t.source === "community" && hosts.has(host))) continue;
    seen.add(t.slug);
    hosts.add(host);
    out.push(t);
  }
  return out;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function getTool(slug: string): Promise<Tool | null> {
  return (await getAllTools()).find((t) => t.slug === slug) ?? null;
}

export function getTask(slug: string): Task | null {
  return TASKS.find((t) => t.slug === slug) ?? null;
}

export function getCategory(slug: string) {
  return TOOL_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

/** Tools for a task — specialists (task listed first) before generalists, then by name. */
export function toolsForTask(tools: Tool[], taskSlug: string): Tool[] {
  return tools
    .filter((t) => t.tasks.includes(taskSlug))
    .sort((a, b) => a.tasks.indexOf(taskSlug) - b.tasks.indexOf(taskSlug) || a.name.localeCompare(b.name));
}

export function alternativesFor(tools: Tool[], tool: Tool, max = 6): Tool[] {
  return tools
    .filter((t) => t.slug !== tool.slug)
    .map((t) => ({
      t,
      score:
        t.tasks.filter((x) => tool.tasks.includes(x)).length * 2 + (t.category === tool.category ? 3 : 0),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.t.name.localeCompare(b.t.name))
    .slice(0, max)
    .map((r) => r.t);
}

// ---------- search ----------

// Everyday words people type mapped to task slugs (intent understanding without an LLM call:
// zero cost per query, instant, deterministic).
const SYNONYMS: Record<string, string[]> = {
  pdf: ["summarize-documents"], summary: ["summarize-documents"], summarise: ["summarize-documents"], summarize: ["summarize-documents"],
  slides: ["make-presentations"], ppt: ["make-presentations"], deck: ["make-presentations"], presentation: ["make-presentations"],
  logo: ["design-logos"], brand: ["design-logos"], thumbnail: ["design-graphics"], poster: ["design-graphics"], instagram: ["design-graphics"],
  image: ["generate-images"], images: ["generate-images"], picture: ["generate-images"], art: ["generate-images"], photo: ["edit-photos"], background: ["edit-photos"],
  video: ["create-videos", "edit-videos-and-podcasts"], reels: ["edit-videos-and-podcasts"], shorts: ["edit-videos-and-podcasts"], youtube: ["edit-videos-and-podcasts"], podcast: ["edit-videos-and-podcasts"], avatar: ["create-videos"],
  transcribe: ["transcribe-audio"], transcription: ["transcribe-audio"], captions: ["transcribe-audio"], subtitles: ["transcribe-audio"],
  voice: ["text-to-speech"], voiceover: ["text-to-speech"], tts: ["text-to-speech"], speech: ["text-to-speech", "transcribe-audio"],
  translate: ["translate-and-dub"], translation: ["translate-and-dub"], hindi: ["translate-and-dub"], dub: ["translate-and-dub"],
  music: ["make-music"], song: ["make-music"], jingle: ["make-music"],
  code: ["write-code"], coding: ["write-code"], programming: ["write-code"], debug: ["write-code"],
  app: ["build-apps-without-code"], website: ["build-apps-without-code"], nocode: ["build-apps-without-code"], "no-code": ["build-apps-without-code"],
  ui: ["design-ui"], ux: ["design-ui"], mockup: ["design-ui"],
  meeting: ["take-meeting-notes"], meetings: ["take-meeting-notes"], notes: ["take-meeting-notes"], zoom: ["take-meeting-notes"],
  research: ["research-with-sources"], papers: ["research-with-sources"], citations: ["research-with-sources"], sources: ["research-with-sources"],
  excel: ["analyze-data"], spreadsheet: ["analyze-data"], csv: ["analyze-data"], data: ["analyze-data"], chart: ["analyze-data"],
  email: ["write-content"], blog: ["write-content"], copy: ["write-content"], essay: ["write-content"], resume: ["write-content"],
  grammar: ["edit-and-proofread"], proofread: ["edit-and-proofread"], rewrite: ["edit-and-proofread"], paraphrase: ["edit-and-proofread"],
  seo: ["marketing-and-seo"], marketing: ["marketing-and-seo"], ads: ["marketing-and-seo"],
  automate: ["automate-workflows"], automation: ["automate-workflows"], workflow: ["automate-workflows"], agent: ["automate-workflows"], agents: ["automate-workflows"],
  support: ["customer-support"], chatbot: ["customer-support"], helpdesk: ["customer-support"], whatsapp: ["customer-support"],
  local: ["run-ai-locally"], offline: ["run-ai-locally"], private: ["run-ai-locally"], privacy: ["run-ai-locally"], "self-host": ["run-ai-locally"], selfhost: ["run-ai-locally"], llama: ["run-ai-locally"],
  upscale: ["edit-photos"], flashcards: ["learn-and-study"], maths: ["learn-and-study"], math: ["learn-and-study"], diagram: ["design-graphics"], flowchart: ["design-graphics"],
  // Hindi (Devanagari) and Hinglish — so search, the assistant and the Telegram bot work for Hindi speakers.
  "अनुवाद": ["translate-and-dub"], anuvad: ["translate-and-dub"],
  "वीडियो": ["create-videos", "edit-videos-and-podcasts"], "फोटो": ["edit-photos"], "तस्वीर": ["generate-images"], "चित्र": ["generate-images"], tasveer: ["generate-images"],
  "वॉइसओवर": ["text-to-speech"], "वॉयसओवर": ["text-to-speech"], "वॉइस": ["text-to-speech"], "वॉयस": ["text-to-speech"], "डबिंग": ["translate-and-dub"], "सबटाइटल": ["transcribe-audio"], "कैप्शन": ["transcribe-audio"],
  "आवाज": ["text-to-speech"], "आवाज़": ["text-to-speech"], awaaz: ["text-to-speech"], awaz: ["text-to-speech"], "बोलकर": ["transcribe-audio"], "लिखना": ["write-content"], likhna: ["write-content"],
  "लोगो": ["design-logos"], "कोड": ["write-code"], "कोडिंग": ["write-code"], "पढ़ाई": ["learn-and-study"], padhai: ["learn-and-study"], "परीक्षा": ["learn-and-study"],
  "मीटिंग": ["take-meeting-notes"], "सारांश": ["summarize-documents"], "प्रेजेंटेशन": ["make-presentations"], "गाना": ["make-music"], gaana: ["make-music"], "संगीत": ["make-music"],
  "ईमेल": ["write-content"], "ग्राहक": ["customer-support"], "व्हाट्सएप": ["customer-support"], "ऑटोमेशन": ["automate-workflows"], "डिज़ाइन": ["design-graphics"], "डिजाइन": ["design-graphics"],
  study: ["learn-and-study"], learn: ["learn-and-study"], tutor: ["learn-and-study"], exam: ["learn-and-study"],
};

const STOP = new Set(["a", "an", "the", "for", "to", "of", "and", "or", "with", "my", "me", "i", "ai", "tool", "tools", "best", "free", "app", "that", "in", "on", "make", "how", "do", "can", "want", "need", "without", "from", "into", "using", "use", "like", "some", "good", "top", "online", "software", "vs", "versus", "alternative", "alternatives", "similar", "run"]);

// Light normalisation: plurals ("pdfs" → "pdf") and UK/US spelling ("summarise" → "summarize").
function normalise(t: string): string {
  let x = t.replace(/is(e|ing|ed|es)$/, "iz$1");
  if (x.length > 3 && x.endsWith("s") && !x.endsWith("ss") && !SYNONYMS[x]) x = x.slice(0, -1);
  return x;
}

export function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP.has(t))
    .map(normalise);
}

function scoreTasks(q: string): Array<[string, number]> {
  const tokens = tokenize(q);
  const scores = new Map<string, number>();
  for (const tok of tokens) {
    for (const slug of SYNONYMS[tok] ?? []) scores.set(slug, (scores.get(slug) ?? 0) + 2);
    for (const task of TASKS) {
      const words = tokenize(`${task.title} ${task.query}`);
      if (words.includes(tok)) scores.set(task.slug, (scores.get(task.slug) ?? 0) + 1);
    }
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1]);
}

export function matchTasks(q: string): Task[] {
  return scoreTasks(q)
    .map(([slug]) => getTask(slug))
    .filter((t): t is Task => t !== null);
}

const ALT_WORDS = new Set(["alternative", "alternatives", "vs", "versus", "like", "similar", "competitor", "competitors"]);

/** Tools named in a query, in the order they appear ("otter vs fireflies" → [Otter.ai, Fireflies.ai]). */
export function findNamedTools(tools: Tool[], q: string): Tool[] {
  const raw = ` ${q.toLowerCase().replace(/[^a-z0-9.]+/g, " ").trim()} `;
  const hits: Array<{ t: Tool; at: number }> = [];
  for (const t of tools) {
    const full = t.name.toLowerCase().replace(/[^a-z0-9.]+/g, " ").trim();
    const first = full.split(/[^a-z0-9]+/)[0] ?? "";
    const candidates = [full, t.slug.replace(/-/g, " "), ...(first.length >= 4 ? [first] : [])];
    const at = Math.min(...candidates.map((c) => raw.indexOf(` ${c} `)).filter((i) => i >= 0), Infinity);
    if (at !== Infinity) hits.push({ t, at });
  }
  return hits.sort((x, y) => x.at - y.at).map((h) => h.t);
}

export function searchTools(tools: Tool[], q: string): Tool[] {
  const tokens = tokenize(q);
  if (tokens.length === 0) return [];

  // "chatgpt alternatives", "tools like canva", "otter vs fireflies" → alternatives for that tool.
  const raw = ` ${q.toLowerCase().replace(/[^a-z0-9.]+/g, " ").trim()} `;
  if (raw.split(" ").some((w) => ALT_WORDS.has(w))) {
    const named = findNamedTools(tools, q);
    if (named.length >= 2) return [...named, ...alternativesFor(tools, named[0]!, 12).filter((t) => !named.includes(t))];
    if (named.length === 1) return [named[0]!, ...alternativesFor(tools, named[0]!, 12)];
  }

  // Weight task matches by how strongly the query points at them.
  const taskScores = scoreTasks(q);
  const top = taskScores[0]?.[1] ?? 0;
  const taskWeight = new Map(taskScores.filter(([, sc]) => sc > 0).map(([slug, sc]) => [slug, sc / Math.max(top, 1)]));

  const scored = tools.map((t) => {
    const name = t.name.toLowerCase();
    const norm = (x: string) => x.toLowerCase().replace(/is(e|ing|ed|es)/g, "iz$1");
    let score = 0;
    for (const tok of tokens) {
      if (name === tok || t.slug === tok) score += 12;
      else if (name.split(/[^a-z0-9]+/).includes(tok) || (name.includes(tok) && tok.length >= name.length * 0.6)) score += 6;
      if (norm(t.tagline).includes(tok)) score += 3;
      if (norm(t.bestFor).includes(tok)) score += 2;
      if (norm(t.description).includes(tok)) score += 1;
      if (t.maker.toLowerCase().includes(tok)) score += 2;
    }
    t.tasks.forEach((x, i) => {
      const w = taskWeight.get(x);
      if (w) score += (i === 0 ? 8 : 5) * w; // a tool's primary task counts most
    });
    return { t, score };
  });
  const best = Math.max(0, ...scored.map((r) => r.score));
  return scored
    .filter((r) => r.score > 0 && r.score >= best * 0.25)
    .sort((a, b) => b.score - a.score || a.t.name.localeCompare(b.t.name))
    .map((r) => r.t);
}

export interface ToolFilters {
  category?: string;
  pricing?: string;
  api?: boolean;
  openSource?: boolean;
}

export function filterTools(tools: Tool[], f: ToolFilters): Tool[] {
  return tools.filter(
    (t) =>
      (!f.category || t.category === f.category) &&
      (!f.pricing || (f.pricing === "has-free" ? t.pricing === "free" || t.pricing === "freemium" : t.pricing === f.pricing)) &&
      (!f.api || t.api) &&
      (!f.openSource || t.openSource),
  );
}

export { TASKS, TOOL_CATEGORIES };
