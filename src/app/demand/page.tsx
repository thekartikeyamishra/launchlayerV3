// File: src/app/demand/page.tsx
// Purpose: The Demand Board — filterable, sortable, paginated list of real demand.

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchDemandPosts, type PostPage } from "@/lib/db";
import type { DemandPost } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import DemandCard from "@/components/DemandCard";
import { Button, EmptyState, LinkButton, Select, Skeleton } from "@/components/ui";
import { logEvent } from "@/lib/analytics";
import type { DocumentSnapshot } from "firebase/firestore";

function Board() {
  const router = useRouter();
  const params = useSearchParams();
  const category = params.get("category") ?? "";
  const sort = params.get("sort") === "new" ? "new" : "trending";

  const [posts, setPosts] = useState<DemandPost[] | null>(null);
  const [cursor, setCursor] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setPosts(null);
    setError("");
    try {
      const page: PostPage = await fetchDemandPosts({ category: category || undefined, sort });
      setPosts(page.posts);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch {
      setError("The board couldn't load. Refresh to try again.");
      setPosts([]);
    }
  }, [category, sort]);

  useEffect(() => {
    logEvent("page.viewed.v1", { page: "demand_board", category: category || "all", sort });
    void load();
  }, [load, category, sort]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/demand?${next.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Demand Board</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Real requests for AI solutions, ranked by real votes.</p>
        </div>
        <LinkButton href="/demand/new">Post a demand request</LinkButton>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-56">
          <label htmlFor="filter-category" className="sr-only">Filter by category</label>
          <Select id="filter-category" value={category} onChange={(e) => setParam("category", e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <label htmlFor="sort" className="sr-only">Sort</label>
          <Select id="sort" value={sort} onChange={(e) => setParam("sort", e.target.value)}>
            <option value="trending">Most voted</option>
            <option value="new">Newest</option>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {posts === null ? (
        <div className="space-y-3">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title={category ? `No requests yet in ${category}` : "No demand posts match"}
          body="That's a real gap — the first request posted here sets the agenda for creators watching this category."
          action={<LinkButton href="/demand/new">Post the first request</LinkButton>}
        />
      ) : (
        <>
          <div className="space-y-3">
            {posts.map((p, i) => (
              <div key={p.id} className={i < 5 ? `anim-rise anim-d-${Math.min(i, 4)}` : undefined}>
                <DemandCard post={p} />
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                disabled={loadingMore}
                onClick={async () => {
                  setLoadingMore(true);
                  try {
                    const page = await fetchDemandPosts({ category: category || undefined, sort, cursor });
                    setPosts((prev) => [...(prev ?? []), ...page.posts]);
                    setCursor(page.cursor);
                    setHasMore(page.hasMore);
                  } catch {
                    setError("More posts couldn't load. Try again.");
                  } finally {
                    setLoadingMore(false);
                  }
                }}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DemandBoardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Board />
    </Suspense>
  );
}
