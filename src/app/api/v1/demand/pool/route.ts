// File: src/app/api/v1/demand/pool/route.ts
// Purpose: Cached pool of recent active demand posts for client-side duplicate checks and
// hero search. CDN-cached for 5 minutes — replaces a 300-document Firestore read per visitor.
import { fetchActivePosts } from "@/lib/demand-server";

export const revalidate = 300;

export async function GET() {
  const posts = await fetchActivePosts(300, 300);
  return Response.json(
    { posts },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
