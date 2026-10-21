// File: src/app/api/v1/tasks/route.ts
// GET /api/v1/tasks            → list of task guides
// GET /api/v1/tasks?slug=...   → one guide with its tools
import { apiGetTask, apiListTasks, CORS_HEADERS } from "@/lib/public-api";

export const revalidate = 600;

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  const headers = { ...CORS_HEADERS, "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" };
  if (!slug) return Response.json({ tasks: apiListTasks() }, { headers });
  const task = await apiGetTask(slug);
  return task ? Response.json(task, { headers }) : Response.json({ error: "not_found" }, { status: 404, headers: CORS_HEADERS });
}
