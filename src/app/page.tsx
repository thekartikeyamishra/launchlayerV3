// File: src/app/page.tsx
// Purpose: Home — cold-start homepage emphasizing Learn/Build/Discover (Ch. 2.5),
// with real trending demand and honest momentum only.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchDemandPosts, fetchCategoryStats } from "@/lib/db";
import type { CategoryStat, DemandPost } from "@/lib/types";
import DemandCard from "@/components/DemandCard";
import { EmptyState, LinkButton, Skeleton } from "@/components/ui";
import { logEvent } from "@/lib/analytics";
import GettingStarted from "@/components/GettingStarted";

export default function HomePage() {
  const [trending, setTrending] = useState<DemandPost[] | null>(null);
  const [gaps, setGaps] = useState<CategoryStat[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    logEvent("page.viewed.v1", { page: "home" });
    void (async () => {
      try {
        const [page, stats] = await Promise.all([
          fetchDemandPosts({ sort: "trending" }),
          fetchCategoryStats(),
        ]);
        setTrending(page.posts.slice(0, 5));
        setGaps(stats.filter((s) => s.demandPosts > 0).slice(0, 4));
      } catch {
        setError("Live demand couldn't be loaded. Refresh to try again.");
        setTrending([]);
        setGaps([]);
      }
    })();
  }, []);

  return (
    <div className="space-y-14">
      <section className="anim-rise pt-6 text-center sm:pt-12">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--trust)]/30 bg-[var(--trust)]/5 px-3 py-1 text-xs font-semibold text-[var(--trust-strong)]">
          Every signal here is real — no fake activity, ever
        </p>
        <h1 className="anim-rise anim-d-1 font-display mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Post what you need.
          <br />
          Build what&apos;s <span className="text-[var(--trust)]">actually wanted.</span>
        </h1>
        <p className="anim-rise anim-d-2 mx-auto mt-4 max-w-xl text-base text-[var(--muted)]">
          LaunchLayer is a public board of real demand for AI solutions. Buyers describe the
          problem; creators see genuine market signals before writing a line of code.
        </p>
        <div className="anim-rise anim-d-3 mt-7 flex flex-wrap justify-center gap-3">
          <LinkButton href="/demand/new">Post a demand request</LinkButton>
          <LinkButton href="/opportunities" variant="secondary">Explore creator opportunities</LinkButton>
        </div>
      </section>

      <GettingStarted />

      <section aria-labelledby="trending-heading">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="trending-heading" className="font-display text-xl font-bold">Trending demand</h2>
          <Link href="/demand" className="text-sm font-medium text-[var(--trust-strong)] hover:underline">
            View the full board →
          </Link>
        </div>
        {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
        {trending === null ? (
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : trending.length === 0 ? (
          <EmptyState
            title="Be the first to post demand"
            body="The board is brand new. The first demand requests posted here will shape what creators build first."
            action={<LinkButton href="/demand/new">Post the first request</LinkButton>}
          />
        ) : (
          <div className="space-y-3">
            {trending.map((p) => (
              <DemandCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>

      {gaps !== null && gaps.length > 0 && (
        <section aria-labelledby="gaps-heading">
          <h2 id="gaps-heading" className="font-display mb-4 text-xl font-bold">Where demand outpaces supply</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {gaps.map((g) => (
              <Link
                key={g.category}
                href={`/demand?category=${encodeURIComponent(g.category)}`}
                className="rounded-xl border border-[var(--line)] bg-white p-4 transition-colors hover:border-[var(--demand)]/50"
              >
                <p className="font-display font-semibold">{g.category}</p>
                <p className="mt-1 text-sm text-[var(--muted)] tabular-nums">
                  {g.demandPosts} request{g.demandPosts === 1 ? "" : "s"} · {g.totalVotes} votes · {g.claims} solution{g.claims === 1 ? "" : "s"} offered
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 rounded-2xl border border-[var(--line)] bg-white p-6 sm:grid-cols-3 sm:p-8">
        {[
          { t: "Discover", d: "Browse real requests from people who need AI solutions — with votes showing how many others share the need." },
          { t: "Trust", d: "Verified Creator badges are granted after manual review. Reputation here is earned, never bought." },
          { t: "Build", d: "Claim a demand post, link your solution, and reach buyers who already told you what they want." },
        ].map((item) => (
          <div key={item.t}>
            <h3 className="font-display text-base font-semibold text-[var(--trust-strong)]">{item.t}</h3>
            <p className="mt-1.5 text-sm text-[var(--muted)]">{item.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
