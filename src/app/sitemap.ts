// File: src/app/sitemap.ts
// Purpose: sitemap.xml — canonical, indexable URLs only (no query-string variants).
// Regenerates hourly; falls back to static routes if Firestore is unreachable.

import type { MetadataRoute } from "next";
import { SITE_URL, fetchRecentPostMetas } from "@/lib/site";
import { getAllTools, TASKS, TOOL_CATEGORIES } from "@/lib/directory";
import { COMPARISONS, pairSlug } from "@/lib/comparisons-data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const r = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], lastModified: Date = now) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    r("/", 1, "daily"),
    r("/tools", 0.9, "daily"),
    r("/tasks", 0.9, "weekly"),
    r("/compare", 0.7, "weekly"),
    r("/demand", 0.8, "hourly"),
    r("/opportunities", 0.6, "daily"),
    r("/pulse", 0.5, "weekly"),
    r("/submit", 0.5, "monthly"),
    r("/developers", 0.5, "monthly"),
    r("/editorial-policy", 0.4, "monthly"),
    r("/about", 0.4, "monthly"),
    r("/contact", 0.3, "yearly"),
    r("/legal/terms", 0.2, "yearly"),
    r("/legal/privacy", 0.2, "yearly"),
    r("/legal/refund", 0.2, "yearly"),
    r("/legal/acceptable-use", 0.2, "yearly"),
  ];

  const [tools, posts] = await Promise.all([getAllTools(), fetchRecentPostMetas(500)]);

  return [
    ...staticRoutes,
    ...TASKS.map((t) => r(`/tasks/${t.slug}`, 0.8, "weekly")),
    ...COMPARISONS.map((c) => r(`/compare/${pairSlug(c)}`, 0.8, "monthly")),
    ...TOOL_CATEGORIES.map((c) => r(`/categories/${c.slug}`, 0.7, "weekly")),
    ...tools.map((t) => r(`/tools/${t.slug}`, 0.8, "weekly", new Date(`${t.reviewedAt}T00:00:00Z`))),
    ...posts.map((p) => r(`/demand/${p.id}`, 0.6, "daily", p.updatedAt ? new Date(p.updatedAt) : now)),
  ];
}
