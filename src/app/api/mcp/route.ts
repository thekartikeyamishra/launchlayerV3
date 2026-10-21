// File: src/app/api/mcp/route.ts
// Purpose: Remote MCP server (Streamable HTTP transport, stateless JSON responses).
// Connect from Claude (Settings → Connectors → Add custom connector) or ChatGPT
// (connectors / developer mode) with the URL https://launchlayer.me/api/mcp.
// Read-only, no auth, no LLM calls on our side — cheap to serve and safe to expose.

import { apiGetTask, apiGetTool, apiListTasks, apiSearch, CATEGORY_SLUGS, clientIp, CORS_HEADERS, rateLimited } from "@/lib/public-api";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];

const TOOLS = [
  {
    name: "search_ai_tools",
    title: "Search AI tools",
    description:
      "Find AI tools for a task described in plain language (e.g. 'summarise PDFs', 'Hindi voiceover', 'meeting notes without a bot'). Returns hand-reviewed listings with pricing model, API availability, strengths, limits and links. If nothing matches, returns a link where the user can post the need on LaunchLayer's demand board.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The task or tool name to search for." },
        category: { type: "string", enum: CATEGORY_SLUGS, description: "Optional category filter." },
        pricing: { type: "string", enum: ["free", "freemium", "paid", "free-trial", "has-free"], description: "Optional pricing filter. 'has-free' = free or free plan." },
        api: { type: "boolean", description: "Only tools with a developer API." },
        openSource: { type: "boolean", description: "Only tools with open weights or open source." },
        limit: { type: "integer", minimum: 1, maximum: 25, default: 8 },
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_ai_tool",
    title: "Get AI tool details",
    description: "Get the full LaunchLayer listing for one tool by its slug (from search_ai_tools).",
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "list_task_guides",
    title: "List task guides",
    description: "List LaunchLayer's task guides (jobs people use AI for), each with a slug.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_task_guide",
    title: "Get task guide",
    description: "Get a task guide: how to choose, mistakes to avoid, and the tools that do the job.",
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

type Json = Record<string, unknown>;
interface RpcRequest { jsonrpc?: string; id?: string | number | null; method?: string; params?: Json }

const ok = (id: RpcRequest["id"], result: unknown) => ({ jsonrpc: "2.0", id, result });
const fail = (id: RpcRequest["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

function toolResult(data: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
    isError: false,
  };
}

async function callTool(name: string, args: Json) {
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  switch (name) {
    case "search_ai_tools":
      return toolResult(
        await apiSearch({
          query: str(args.query),
          category: str(args.category),
          pricing: str(args.pricing),
          api: args.api === true,
          openSource: args.openSource === true,
          limit: Math.min(Number(args.limit) || 8, 25),
        }),
      );
    case "get_ai_tool": {
      const t = await apiGetTool(str(args.slug) ?? "");
      return t ? toolResult(t) : { content: [{ type: "text", text: "No tool with that slug. Use search_ai_tools first." }], isError: true };
    }
    case "list_task_guides":
      return toolResult({ tasks: apiListTasks() });
    case "get_task_guide": {
      const g = await apiGetTask(str(args.slug) ?? "");
      return g ? toolResult(g) : { content: [{ type: "text", text: "No guide with that slug. Use list_task_guides first." }], isError: true };
    }
    default:
      return null;
  }
}

async function handle(msg: RpcRequest): Promise<unknown | null> {
  const isNotification = msg.id === undefined || msg.id === null;
  if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return isNotification ? null : fail(msg.id, -32600, "Invalid Request");
  if (msg.method.startsWith("notifications/")) return null;

  switch (msg.method) {
    case "initialize": {
      const requested = String(msg.params?.protocolVersion ?? "");
      return ok(msg.id, {
        protocolVersion: SUPPORTED.includes(requested) ? requested : SUPPORTED[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "launchlayer", title: "LaunchLayer AI Tools Directory", version: "1.0.0", websiteUrl: SITE_URL },
        instructions:
          "Use search_ai_tools when the user wants an AI tool for a task. Present the pricing model (not prices), link the launchLayerUrl for details, and mention limits honestly. If nothing fits, offer the postRequestUrl so the user can request it.",
      });
    }
    case "ping":
      return ok(msg.id, {});
    case "tools/list":
      return ok(msg.id, { tools: TOOLS });
    case "tools/call": {
      const name = String(msg.params?.name ?? "");
      const args = (msg.params?.arguments ?? {}) as Json;
      const result = await callTool(name, args);
      return result ? ok(msg.id, result) : fail(msg.id, -32602, `Unknown tool: ${name}`);
    }
    case "resources/list":
      return ok(msg.id, { resources: [] });
    case "prompts/list":
      return ok(msg.id, { prompts: [] });
    default:
      return isNotification ? null : fail(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  if (rateLimited(clientIp(req), 240)) {
    return Response.json(fail(null, -32000, "Rate limited — retry shortly."), { status: 429, headers: { ...CORS_HEADERS, "Retry-After": "30" } });
  }
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 64_000) return Response.json(fail(null, -32600, "Payload too large"), { status: 413, headers: CORS_HEADERS });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(fail(null, -32700, "Parse error"), { status: 400, headers: CORS_HEADERS });
  }

  const batch = Array.isArray(body);
  const messages = ((batch ? body : [body]) as unknown[]).slice(0, 20).map((m) => (m && typeof m === "object" ? m : {}) as RpcRequest);
  const responses = (await Promise.all(messages.map((m) => handle(m).catch(() => fail(m.id, -32603, "Internal error"))))).filter((r) => r !== null);

  if (responses.length === 0) return new Response(null, { status: 202, headers: CORS_HEADERS });
  return Response.json(batch ? responses : responses[0], { headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } });
}

export function GET() {
  // Stateless server: no server-initiated SSE stream.
  return new Response(JSON.stringify({ name: "LaunchLayer MCP", transport: "streamable-http", endpoint: `${SITE_URL}/api/mcp`, docs: `${SITE_URL}/developers` }), {
    status: 405,
    headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS", "Content-Type": "application/json" },
  });
}

export function DELETE() {
  return new Response(null, { status: 405, headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS" } });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
