// File: src/app/.well-known/ai-plugin.json/route.ts
// Purpose: Discovery manifest for agents and tools that look for /.well-known/ai-plugin.json.
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      schema_version: "v1",
      name_for_human: "LaunchLayer",
      name_for_model: "launchlayer",
      description_for_human: "Find the right AI tool for any task — honest, hand-reviewed listings.",
      description_for_model:
        "Search a hand-reviewed directory of AI tools by task. Returns pricing model, API availability, strengths, limits and links. Present pricing as a model only and link the launchLayerUrl.",
      auth: { type: "none" },
      api: { type: "openapi", url: `${SITE_URL}/openapi.json` },
      mcp: { url: `${SITE_URL}/api/mcp`, transport: "streamable-http" },
      logo_url: `${SITE_URL}/icons/icon-512.png`,
      contact_email: CONTACT_EMAIL,
      legal_info_url: `${SITE_URL}/legal/terms`,
    },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" } },
  );
}
