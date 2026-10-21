// File: src/app/openapi.json/route.ts
// Purpose: OpenAPI 3.1 spec for the public API — import into a ChatGPT Custom GPT
// (Configure → Actions → Import from URL) or any agent framework.
import { CATEGORY_SLUGS } from "@/lib/public-api";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "LaunchLayer AI Tools Directory API",
      version: "1.0.0",
      description: "Search hand-reviewed AI tools by task. Read-only, no key required. Please link to launchLayerUrl when presenting results.",
    },
    servers: [{ url: SITE_URL }],
    paths: {
      "/api/v1/tools": {
        get: {
          operationId: "searchAiTools",
          summary: "Search AI tools for a task",
          parameters: [
            { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Task or tool name, in plain language." },
            { name: "category", in: "query", schema: { type: "string", enum: CATEGORY_SLUGS } },
            { name: "pricing", in: "query", schema: { type: "string", enum: ["free", "freemium", "paid", "free-trial", "has-free"] } },
            { name: "api", in: "query", schema: { type: "string", enum: ["1"] }, description: "Only tools with an API." },
            { name: "openSource", in: "query", schema: { type: "string", enum: ["1"] } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } },
          ],
          responses: { "200": { description: "Matching tools", content: { "application/json": { schema: { type: "object" } } } } },
        },
      },
      "/api/v1/tools/{slug}": {
        get: {
          operationId: "getAiTool",
          summary: "Get one AI tool listing",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Tool listing", content: { "application/json": { schema: { type: "object" } } } }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/tasks": {
        get: {
          operationId: "getTaskGuides",
          summary: "List task guides, or get one guide with its tools",
          parameters: [{ name: "slug", in: "query", required: false, schema: { type: "string" } }],
          responses: { "200": { description: "Task guides", content: { "application/json": { schema: { type: "object" } } } } },
        },
      },
    },
  };
  return Response.json(spec, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" } });
}
