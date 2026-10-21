// File: src/components/AdminSubmissions.tsx
// Purpose: Admin moderation for free tool submissions — approve (publishes to /tools) or reject.

"use client";

import { useCallback, useEffect, useState } from "react";
import { approveSubmission, fetchPendingSubmissions, rejectSubmission } from "@/lib/db";
import type { ToolSubmission } from "@/lib/types";
import { Button, EmptyState, ErrorNote, Skeleton } from "./ui";

export default function AdminSubmissions() {
  const [items, setItems] = useState<ToolSubmission[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await fetchPendingSubmissions());
    } catch {
      setError("Submissions couldn't load. Deploy the latest Firestore rules and indexes.");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    setError("");
    try {
      await fn();
      setItems((list) => (list ?? []).filter((s) => s.id !== id));
    } catch {
      setError("That action failed. Check your admin access and try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="subs-heading">
      <h2 id="subs-heading" className="font-display text-lg font-bold">Tool submissions {items && <span className="text-[var(--muted)] tabular-nums">({items.length})</span>}</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Open the site before approving: it must be live, do what it claims, and follow the Acceptable Use Policy. Approved tools appear on /tools within ~10 minutes.</p>
      {error && <div className="mt-3"><ErrorNote message={error} /></div>}
      <div className="mt-4 space-y-3">
        {items === null ? (
          <Skeleton className="h-28" />
        ) : items.length === 0 ? (
          <EmptyState title="No pending submissions" body="New free submissions will appear here." />
        ) : (
          items.map((s) => (
            <article key={s.id} className="rounded-xl border border-[var(--line)] bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display font-semibold">{s.name} <span className="text-xs font-normal text-[var(--muted)]">· {s.category} · {s.pricing}{s.isMaker ? " · submitted by maker" : ""}</span></p>
                <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="text-sm text-[var(--trust-strong)] hover:underline">{s.url}</a>
              </div>
              <p className="mt-1 text-sm font-medium">{s.tagline}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-[var(--muted)]">{s.description}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">By {s.submitterName} ({s.submitterId})</p>
              <div className="mt-3 flex gap-2">
                <Button disabled={busy === s.id} onClick={() => void act(s.id, () => approveSubmission(s))}>Approve & publish</Button>
                <Button variant="danger" disabled={busy === s.id} onClick={() => void act(s.id, () => rejectSubmission(s.id))}>Reject</Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
