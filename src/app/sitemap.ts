// File: src/app/sitemap.ts
// Purpose: sitemap.xml — static routes, category board views, and every active demand post.
// Regenerates hourly; falls back to static routes if Firestore is unreachable.

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { fetchRecentPostMetas } from "@/lib/site";
import { CATEGORIES } from "@/lib/categories";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/demand`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/opportunities`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/pulse`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/acceptable-use`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE_URL}/demand?category=${encodeURIComponent(c)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const posts = await fetchRecentPostMetas(500);
  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/demand/${p.id}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...postRoutes];
}
