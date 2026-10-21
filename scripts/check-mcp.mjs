// File: scripts/check-mcp.mjs
// Purpose: Smoke-test the MCP endpoint. Usage: npm run check:mcp [-- https://launchlayer.me]
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const rpc = async (method, params, id = 1) => {
  const res = await fetch(`${base}/api/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  return res.json();
};
const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "check", version: "1" } });
console.log("initialize →", init.result?.serverInfo?.name, init.result?.protocolVersion);
const list = await rpc("tools/list", {}, 2);
console.log("tools/list →", list.result?.tools?.map((t) => t.name).join(", "));
const call = await rpc("tools/call", { name: "search_ai_tools", arguments: { query: "summarise pdfs", limit: 3 } }, 3);
console.log("search_ai_tools →", call.result?.structuredContent?.tools?.map((t) => t.name).join(", "));
if (!call.result?.structuredContent?.tools?.length) process.exitCode = 1;
