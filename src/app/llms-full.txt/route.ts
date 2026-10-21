// File: src/app/llms-full.txt/route.ts
// Purpose: Full directory catalogue as plain text for LLM ingestion and AI-search citation.
import { getAllTools, getCategory } from "@/lib/directory";
import { PRICING_LABELS } from "@/lib/directory-types";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export async function GET() {
  const tools = await getAllTools();
  const body = [
    `# LaunchLayer — full AI tools catalogue (${tools.length} tools)`,
    `Source: ${SITE_URL}. Pricing is the pricing model only; confirm prices on official sites.`,
    "",
    ...tools.map((t) =>
      [
        `## ${t.name}`,
        `- Page: ${SITE_URL}/tools/${t.slug}`,
        `- Maker: ${t.maker || "Independent"} · Category: ${getCategory(t.category)?.name ?? t.category}`,
        `- Pricing model: ${PRICING_LABELS[t.pricing]} · API: ${t.api ? "yes" : "no"} · Open weights/source: ${t.openSource ? "yes" : "no"}`,
        `- Best for: ${t.bestFor}`,
        `- ${t.description}`,
        t.pros.length ? `- Strengths: ${t.pros.join("; ")}` : "",
        t.cons.length ? `- Limits: ${t.cons.join("; ")}` : "",
        `- Last reviewed: ${t.reviewedAt}`,
        "",
      ].filter(Boolean).join("\n"),
    ),
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
