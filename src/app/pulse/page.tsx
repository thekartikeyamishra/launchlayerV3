// File: src/app/pulse/page.tsx
// Purpose: Marketplace Pulse — a transparent weekly snapshot built only from real activity (Ch. 26.3).

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCategoryStats, fetchDemandPosts } from "@/lib/db";
import type { CategoryStat, DemandPost } from "@/lib/types";
import DemandCard from "@/components/DemandCard";
import { EmptyState, LinkButton, Skeleton } from "@/components/ui";
import { logEvent } from "@/lib/analytics";

const WEEK_SECONDS = 7 * 24 * 3600;

export default function PulsePage() {
  const [weekPosts, setWeekPosts] = useState<DemandPost[] | null>(null);
  const [topThisWeek, setTopThisWeek] = useState<DemandPost[]>([]);
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    logEvent("page.viewed.v1", { page: "pulse" });
    void (async () => {
      try {
        const [newest, s] = await Promise.all([
          fetchDemandPosts({ sort: "new" }),
          fetchCategoryStats(),
        ]);
        const cutoff = Date.now() / 1000 - WEEK_SECONDS;
        const thisWeek = newest.posts.filter((p) => (p.createdAt?.seconds ?? 0) >= cutoff);
        setWeekPosts(thisWeek);
        setTopThisWeek([...thisWeek].sort((a, b) => b.voteCount - a.voteCount).slice(0, 5));
        setStats(s.filter((c) => c.demandPosts > 0).slice(0, 5));
      } catch {
        setError("Pulse data couldn't load. Refresh to try again.");
        setWeekPosts([]);
      }
    })();
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold">Marketplace Pulse</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
          A live snapshot of what the AI-demand market is asking for this week.
          Every figure is measured from real board activity.
        </p>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {weekPosts === null ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--line)] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">New requests this week</p>
              <p className="font-display mt-1 text-3xl font-bold tabular-nums">{weekPosts.length}</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Votes cast this week</p>
              <p className="font-display mt-1 text-3xl font-bold tabular-nums">{weekPosts.reduce((n, p) => n + p.voteCount, 0)}</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Most active category</p>
              <p className="font-display mt-1 truncate text-xl font-bold">{stats[0]?.category ?? "—"}</p>
            </div>
          </section>

          <section aria-labelledby="pulse-top">
            <h2 id="pulse-top" className="font-display mb-4 text-lg font-bold">Top requests this week</h2>
            {topThisWeek.length === 0 ? (
              <EmptyState
                title="A quiet week so far"
                body="No new requests were posted in the last 7 days. The next one posted leads this list."
                action={<LinkButton href="/demand/new">Post a request</LinkButton>}
              />
            ) : (
              <div className="space-y-3">
                {topThisWeek.map((p) => (<DemandCard key={p.id} post={p} />))}
              </div>
            )}
          </section>

          <section aria-labelledby="pulse-categories">
            <h2 id="pulse-categories" className="font-display mb-4 text-lg font-bold">Categories with the most open demand</h2>
            {stats.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Category momentum appears once requests are posted.</p>
            ) : (
              <ul className="space-y-2">
                {stats.map((s) => (
                  <li key={s.category} className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm">
                    <Link href={`/demand?category=${encodeURIComponent(s.category)}`} className="font-medium hover:text-[var(--trust-strong)] hover:underline">
                      {s.category}
                    </Link>
                    <span className="tabular-nums text-[var(--muted)]">
                      {s.demandPosts} requests · {s.claims} solutions
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
