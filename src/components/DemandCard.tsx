// File: src/components/DemandCard.tsx
// Purpose: Demand post summary card used on the board, home, and pulse pages.

"use client";

import Link from "next/link";
import type { DemandPost } from "@/lib/types";
import { URGENCY_LABELS } from "@/lib/categories";
import { Pill } from "./ui";

function timeAgo(ts: DemandPost["createdAt"]): string {
  if (!ts) return "just now";
  const seconds = Math.max(1, Math.floor(Date.now() / 1000 - ts.seconds));
  if (seconds < 3600) return `${Math.floor(seconds / 60) || 1}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function DemandCard({ post }: { post: DemandPost }) {
  return (
    <article className="group rounded-xl border border-[var(--line)] bg-white p-4 transition-colors hover:border-[var(--trust)]/50">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="neutral">{post.category}</Pill>
            {post.urgency !== "exploring" && <Pill tone="demand">{URGENCY_LABELS[post.urgency]}</Pill>}
            {post.claimCount > 0 && <Pill tone="trust">{post.claimCount} solution{post.claimCount === 1 ? "" : "s"}</Pill>}
          </div>
          <h3 className="mt-2 font-display text-base font-semibold leading-snug text-[var(--ink)]">
            <Link href={`/demand/${post.id}`} className="hover:text-[var(--trust-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--trust)]">
              {post.title}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{post.description}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            by {post.authorName} · {timeAgo(post.createdAt)} · {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center rounded-lg border border-[var(--line)] px-3 py-2 tabular-nums" aria-label={`${post.voteCount} votes`}>
          <span className="text-lg font-bold text-[var(--ink)]">{post.voteCount}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">votes</span>
        </div>
      </div>
    </article>
  );
}
