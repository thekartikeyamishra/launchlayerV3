// File: src/components/HomeDemand.tsx
// Purpose: Live demand section on the home page (client island). Shows real requests only;
// in the cold-start phase it invites the founding cohort instead of faking activity.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchDemandPosts } from "@/lib/db";
import type { DemandPost } from "@/lib/types";
import DemandCard from "./DemandCard";
import { EmptyState, LinkButton, Skeleton } from "./ui";
import HeroAsk from "./HeroAsk";
import GettingStarted from "./GettingStarted";
import { hasDraft } from "@/lib/useDraft";

export default function HomeDemand() {
  const [trending, setTrending] = useState<DemandPost[] | null>(null);
  const [draft, setDraft] = useState(false);

  useEffect(() => {
    setDraft(hasDraft("demand"));
  }, []);

  useEffect(() => {
    void fetchDemandPosts({ sort: "trending" })
      .then((p) => setTrending(p.posts.slice(0, 4)))
      .catch(() => setTrending([]));
  }, []);

  return (
    <section aria-labelledby="demand-heading" className="rounded-3xl border border-[var(--demand)]/20 bg-gradient-to-b from-[var(--demand)]/[0.06] to-white p-6 sm:p-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--demand)]">The part other directories don&apos;t have</p>
          <h2 id="demand-heading" className="font-display mt-2 text-2xl font-bold sm:text-3xl">No AI for that yet? Post it.</h2>
          <p className="mt-3 text-[15px] text-[var(--muted)]">
            Describe the task. Others vote if they need it too. Verified builders see the demand and reply with
            solutions — so the directory grows toward what people actually ask for.
          </p>
          {draft && (
            <Link href="/demand/new" className="anim-rise mt-5 flex items-center justify-between gap-3 rounded-xl border border-[var(--demand)]/30 bg-white px-4 py-3 text-sm font-medium hover:border-[var(--demand)]">
              <span>You have an unfinished request saved on this device.</span>
              <span className="shrink-0 font-semibold text-[var(--demand)]">Finish it →</span>
            </Link>
          )}
          <HeroAsk />
          <div className="mt-5 flex flex-wrap gap-2">
            <LinkButton href="/demand" variant="secondary">Browse the demand board</LinkButton>
            <LinkButton href="/opportunities" variant="secondary">For builders: opportunities</LinkButton>
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-end justify-between">
            <h3 className="font-display text-base font-semibold">Most-wanted right now</h3>
            <Link href="/demand" className="text-sm font-medium text-[var(--trust-strong)] hover:underline">All requests →</Link>
          </div>
          {trending === null ? (
            <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          ) : trending.length === 0 ? (
            <EmptyState
              title="Founding cohort is open"
              body="The board is new. The first requests posted here shape what builders make first — and the history shows who was early."
              action={<LinkButton href="/demand/new">Post the first request</LinkButton>}
            />
          ) : (
            <div className="space-y-3">{trending.map((p) => <DemandCard key={p.id} post={p} />)}</div>
          )}
        </div>
      </div>
      <div className="mt-8"><GettingStarted /></div>
    </section>
  );
}
