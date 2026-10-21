// File: src/app/api/v1/tools/[slug]/route.ts
import { apiGetTool, CORS_HEADERS } from "@/lib/public-api";

export const revalidate = 600;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await apiGetTool(slug);
  if (!tool) return Response.json({ error: "not_found" }, { status: 404, headers: CORS_HEADERS });
  return Response.json(tool, { headers: { ...CORS_HEADERS, "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" } });
}
