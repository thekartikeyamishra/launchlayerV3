// File: src/app/robots.ts
// Purpose: robots.txt — crawl everything public (including AI crawlers, so LLMs can cite us),
// keep private and parameterised surfaces out.

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/v1/", "/llms.txt", "/llms-full.txt", "/openapi.json"],
        disallow: ["/admin", "/account", "/sign-in", "/saved", "/compare?", "/api/mcp", "/api/telegram"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
