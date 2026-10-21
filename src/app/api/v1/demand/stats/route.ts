// File: src/app/api/v1/demand/stats/route.ts
// Purpose: Cached category demand/supply stats (opportunities + pulse). Replaces a
// 1,000-document read per visitor with one read per 15 minutes.
import { fetchActivePosts } from "@/lib/demand-server";
import { computeCategoryStats } from "@/lib/demand-stats";

export const revalidate = 900;

export async function GET() {
  const posts = await fetchActivePosts(1000, 900);
  return Response.json(
    { stats: computeCategoryStats(posts), sampled: posts.length },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
  );
}
