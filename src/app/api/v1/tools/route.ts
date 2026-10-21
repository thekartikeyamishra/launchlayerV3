// File: src/app/api/v1/tools/route.ts
// Purpose: Public read API — search AI tools. GET /api/v1/tools?q=&category=&pricing=&api=1&openSource=1&limit=
import { apiSearch, clientIp, CORS_HEADERS, rateLimited } from "@/lib/public-api";

export const revalidate = 600;

export async function GET(req: Request) {
  if (rateLimited(clientIp(req))) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { ...CORS_HEADERS, "Retry-After": "30" } });
  }
  const p = new URL(req.url).searchParams;
  const data = await apiSearch({
    query: p.get("q") ?? undefined,
    category: p.get("category") ?? undefined,
    pricing: p.get("pricing") ?? undefined,
    api: p.get("api") === "1",
    openSource: p.get("openSource") === "1",
    limit: Number(p.get("limit") ?? 10),
  });
  return Response.json(data, {
    headers: { ...CORS_HEADERS, "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
