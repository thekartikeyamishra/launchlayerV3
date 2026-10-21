// File: src/components/AdminOverview.tsx
// Purpose: Platform health dashboard — growth, content, moderation load. Uses count
// aggregation queries (cheap) and refreshes only on demand, never on a timer.

"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchHealthCounts, type HealthCounts } from "@/lib/db";
import { EDITORIAL_TOOLS } from "@/lib/tools-data";
import { TASKS } from "@/lib/tasks-data";
import { COMPARISONS } from "@/lib/comparisons-data";
import { Button, Skeleton } from "./ui";

function Tile({ label, value, hint, tone = "neutral" }: { label: string; value: number | string; hint?: string; tone?: "neutral" | "warn" | "good" }) {
  const ring = tone === "warn" ? "border-[var(--demand)]/40" : tone === "good" ? "border-[var(--trust)]/40" : "border-[var(--line)]";
  return (
    <div className={`rounded-2xl border ${ring} bg-white p-4`}>
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

export default function AdminOverview({ canModerate, canEdit }: { canModerate: boolean; canEdit: boolean }) {
  const [data, setData] = useState<HealthCounts | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setData(await fetchHealthCounts(canModerate, canEdit));
    } finally {
      setBusy(false);
    }
  }, [canModerate, canEdit]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) return <div className="grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>;

  const max = Math.max(1, ...data.signupsByDay.map((d) => d.count));
  const reviewed = [...EDITORIAL_TOOLS].sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
  const stale = reviewed.filter((t) => Date.now() - Date.parse(`${t.reviewedAt}T00:00:00Z`) > 90 * 86400_000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">Platform health</h2>
        <Button variant="secondary" onClick={() => void load()} disabled={busy}>{busy ? "Refreshing…" : "Refresh"}</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Members" value={data.users} hint={`+${data.users7d} in 7 days`} tone="good" />
        <Tile label="Active demand posts" value={data.activePosts} />
        <Tile label="Tool reviews" value={data.reviews} />
        <Tile label="Product events (7 days)" value={data.events7d} hint="Saves, reviews, posts, visits out" />
        <Tile label="Listed tools" value={EDITORIAL_TOOLS.length + data.communityTools} hint={`${data.communityTools} community`} />
        <Tile label="Content pages" value={TASKS.length + COMPARISONS.length} hint={`${TASKS.length} guides · ${COMPARISONS.length} comparisons`} />
        {data.pendingSubmissions !== null && <Tile label="Pending submissions" value={data.pendingSubmissions} tone={data.pendingSubmissions > 20 ? "warn" : "neutral"} hint="Target: clear within 3 days" />}
        {data.openReports !== null && <Tile label="Open reports" value={data.openReports} tone={data.openReports > 0 ? "warn" : "good"} hint="Target: clear within 24 hours" />}
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5" aria-labelledby="signups-h">
        <h3 id="signups-h" className="font-display font-semibold">New members per day (14 days)</h3>
        <div className="mt-4 flex h-40 items-end gap-1.5" role="img" aria-label={`Signups per day: ${data.signupsByDay.map((d) => `${d.day} ${d.count}`).join(", ")}`}>
          {data.signupsByDay.map((d) => (
            <div key={d.day} className="group flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] tabular-nums text-[var(--muted)] opacity-0 group-hover:opacity-100">{d.count}</span>
              <div className="w-full rounded-t-md bg-[var(--trust)] transition-all" style={{ height: `${Math.max(2, (d.count / max) * 100)}%`, opacity: d.count ? 1 : 0.25 }} />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-[var(--muted)]">
          <span>{data.signupsByDay[0]?.day}</span>
          <span>{data.signupsByDay[data.signupsByDay.length - 1]?.day}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5" aria-labelledby="fresh-h">
        <h3 id="fresh-h" className="font-display font-semibold">Content freshness</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {stale.length === 0
            ? "Every editorial listing was reviewed in the last 90 days."
            : `${stale.length} listing(s) not reviewed in 90+ days — re-check them and update reviewedAt in tools-data.ts.`}
        </p>
        {stale.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">{stale.slice(0, 30).map((t) => <li key={t.slug} className="rounded-full border border-[var(--line)] px-2 py-0.5">{t.name}</li>)}</ul>
        )}
        <p className="mt-3 text-xs text-[var(--muted)]">Run <code>npm run check:links</code> before each deploy to catch dead or moved tools.</p>
      </section>
    </div>
  );
}
