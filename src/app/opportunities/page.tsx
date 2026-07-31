// File: src/app/opportunities/page.tsx
// Purpose: Creator Opportunity view — real demand-vs-supply gaps per category (Ch. 15.6).

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCategoryStats, fetchDemandPosts } from "@/lib/db";
import type { CategoryStat, DemandPost } from "@/lib/types";
import DemandCard from "@/components/DemandCard";
import { EmptyState, LinkButton, Skeleton } from "@/components/ui";
import { logEvent } from "@/lib/analytics";

export default function OpportunitiesPage() {
  const [stats, setStats] = useState<CategoryStat[] | null>(null);
  const [unclaimed, setUnclaimed] = useState<DemandPost[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    logEvent("page.viewed.v1", { page: "opportunities" });
    void (async () => {
      try {
        const [s, page] = await Promise.all([
          fetchCategoryStats(),
          fetchDemandPosts({ sort: "trending" }),
        ]);
        setStats(s);
        setUnclaimed(page.posts.filter((p) => p.claimCount === 0).slice(0, 6));
      } catch {
        setError("Opportunity data couldn't load. Refresh to try again.");
        setStats([]);
        setUnclaimed([]);
      }
    })();
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold">Creator opportunities</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
          Every number below comes from live board activity — requests posted, votes cast,
          and solutions offered. Nothing is estimated or simulated.
        </p>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <section aria-labelledby="gap-heading">
        <h2 id="gap-heading" className="font-display mb-4 text-lg font-bold">Demand vs. supply by category</h2>
        {stats === null ? (
          <Skeleton className="h-64" />
        ) : stats.every((s) => s.demandPosts === 0) ? (
          <EmptyState
            title="The board is just getting started"
            body="Once demand requests are posted, this table shows exactly which categories are underserved."
            action={<LinkButton href="/demand">Visit the Demand Board</LinkButton>}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white">
            <table className="w-full text-sm">
              <caption className="sr-only">Demand versus supply per category</caption>
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                  <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Requests</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Votes</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Solutions</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {stats.filter((s) => s.demandPosts > 0).map((s) => (
                  <tr key={s.category} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/demand?category=${encodeURIComponent(s.category)}`} className="hover:text-[var(--trust-strong)] hover:underline">
                        {s.category}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.demandPosts}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.totalVotes}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.claims}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${s.claims === 0 ? "text-[var(--demand)]" : "text-[var(--muted)]"}`}>
                        {s.claims === 0 ? "Wide open" : s.gapScore > 3 ? "Underserved" : "Competitive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="unclaimed-heading">
        <h2 id="unclaimed-heading" className="font-display mb-4 text-lg font-bold">Most-voted requests with no solution yet</h2>
        {unclaimed === null ? (
          <Skeleton className="h-48" />
        ) : unclaimed.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Every trending request currently has at least one solution — check the full board for more.</p>
        ) : (
          <div className="space-y-3">
            {unclaimed.map((p) => (<DemandCard key={p.id} post={p} />))}
          </div>
        )}
      </section>
    </div>
  );
}
