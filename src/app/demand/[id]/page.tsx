// File: src/app/demand/[id]/page.tsx
// Purpose: Server wrapper for the demand detail page — per-post SEO metadata
// (title, description, OpenGraph, canonical) and DiscussionForumPosting JSON-LD.
// Interactivity lives in DetailClient.tsx; nothing about the UX changes.

import type { Metadata } from "next";
import { fetchPostMeta } from "@/lib/site";
import { SITE_URL } from "@/lib/site";
import DetailClient from "./DetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await fetchPostMeta(id);
  if (!post) {
    return { title: "Demand request", robots: { index: false } };
  }
  const description = post.description.slice(0, 155).trim() + (post.description.length > 155 ? "…" : "");
  const url = `${SITE_URL}/demand/${post.id}`;
  return {
    title: `${post.title} — ${post.category} demand`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      type: "article",
      siteName: "LaunchLayer",
    },
    twitter: {
      card: "summary",
      title: post.title,
      description,
    },
  };
}

export default async function DemandDetailPage({ params }: Props) {
  const { id } = await params;
  const post = await fetchPostMeta(id);

  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "DiscussionForumPosting",
        headline: post.title,
        text: post.description.slice(0, 500),
        url: `${SITE_URL}/demand/${post.id}`,
        interactionStatistic: {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: post.voteCount,
        },
        about: post.category,
        isPartOf: { "@type": "WebSite", name: "LaunchLayer", url: SITE_URL },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <DetailClient id={id} />
    </>
  );
}
