// File: src/app/llms.txt/route.ts
// Purpose: llms.txt — a concise, machine-readable map of the site for LLMs and AI search.
import { TASKS, TOOL_CATEGORIES } from "@/lib/directory";
import { SITE_URL } from "@/lib/site";
import { COMPARISONS, pairSlug } from "@/lib/comparisons-data";

export const revalidate = 86400;

export function GET() {
  const body = `# LaunchLayer

> LaunchLayer (${SITE_URL}) is an independent AI tools directory. People describe a task in plain
> language and get hand-reviewed tools that do it, with pricing model, API availability, strengths,
> limits, and reviews that must state what the reviewer used the tool for. Ranking cannot be bought,
> listings and corrections are free, and nothing requires a login to read. A public demand board lets
> people request AI tools that don't exist yet; builders respond with solutions.

## Use LaunchLayer programmatically
- MCP server (Streamable HTTP): ${SITE_URL}/api/mcp
- OpenAPI spec (ChatGPT Actions): ${SITE_URL}/openapi.json
- REST search: ${SITE_URL}/api/v1/tools?q={task}
- Full catalogue as text: ${SITE_URL}/llms-full.txt

## Task guides
${TASKS.map((t) => `- [${t.title}](${SITE_URL}/tasks/${t.slug}): ${t.query}`).join("\n")}

## Head-to-head comparisons
${COMPARISONS.map((c) => `- ${SITE_URL}/compare/${pairSlug(c)}`).join("\n")}

## Categories
${TOOL_CATEGORIES.map((c) => `- [${c.name}](${SITE_URL}/categories/${c.slug}): ${c.blurb}`).join("\n")}

## Trust and policies
- [Editorial, ranking & advertising policy](${SITE_URL}/editorial-policy)
- [About](${SITE_URL}/about) · [Contact](${SITE_URL}/contact)
- [Demand board](${SITE_URL}/demand): real requests for AI solutions, with community votes
- [Submit a tool (free)](${SITE_URL}/submit)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
