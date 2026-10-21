// File: src/components/ToolReviews.tsx
// Purpose: Real-use reviews. One per person per tool, and every review must say what the
// reviewer actually used the tool for — the context TAAFT-style "saves" never give you.
// Averages are only shown once there are 3+ reviews, so one opinion never looks like consensus.

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchToolReviews, upsertToolReview } from "@/lib/db";
import { toolReviewSchema } from "@/lib/schemas";
import { logEvent } from "@/lib/analytics";
import type { ToolReview } from "@/lib/types";
import { Button, Field, Skeleton, TextArea, TextInput } from "./ui";
import ReportButton from "./ReportButton";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={i <= Math.round(value) ? "text-amber-500" : "text-[var(--line)]"} fill="currentColor">
          <path d="m12 2 3 6.6 7 .7-5.3 4.7 1.6 7-6.3-3.8L5.7 21l1.6-7L2 9.3l7-.7L12 2Z" />
        </svg>
      ))}
    </span>
  );
}

export default function ToolReviews({ slug, name }: { slug: string; name: string }) {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<ToolReview[] | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [usedFor, setUsedFor] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      setReviews(await fetchToolReviews(slug));
      setLoadError(false);
    } catch {
      setReviews([]);
      setLoadError(true);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const mine = reviews?.find((r) => r.authorId === user?.uid);
  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setUsedFor(mine.usedFor);
      setPros(mine.pros);
      setCons(mine.cons);
    }
  }, [mine]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    const parsed = toolReviewSchema.safeParse({ rating, usedFor, pros, cons });
    if (!parsed.success) {
      setError(rating === 0 ? "Choose a star rating." : parsed.error.issues[0]?.message ?? "Check your review.");
      return;
    }
    setBusy(true);
    try {
      await upsertToolReview(slug, user.uid, profile?.displayName ?? "Member", parsed.data);
      logEvent("tool.reviewed.v1", { slug, rating });
      setOpen(false);
      await load();
    } catch {
      setError("Your review couldn't be saved. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const avg = reviews && reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;

  return (
    <section aria-labelledby="reviews-heading" className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reviews-heading" className="font-display text-lg font-bold">Reviews from real use</h2>
          {reviews && reviews.length >= 3 ? (
            <p className="mt-1 flex items-center gap-2 text-sm text-[var(--muted)]">
              <Stars value={avg} /> <strong className="tabular-nums text-[var(--ink)]">{avg.toFixed(1)}</strong> from {reviews.length} reviews
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--muted)]">We show an average once 3 people have reviewed — one opinion isn&apos;t a consensus.</p>
          )}
        </div>
        {user ? (
          !open && <Button variant="secondary" onClick={() => setOpen(true)}>{mine ? "Edit my review" : `Review ${name}`}</Button>
        ) : (
          <Link href={`/sign-in?next=/tools/${slug}`} className="text-sm font-semibold text-[var(--trust-strong)] hover:underline">Sign in to review</Link>
        )}
      </div>

      {open && user && (
        <form onSubmit={(e) => void submit(e)} className="anim-rise mt-5 space-y-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
          <fieldset>
            <legend className="text-sm font-medium">Your rating</legend>
            <div className="mt-1.5 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} star${i > 1 ? "s" : ""}`} aria-pressed={rating === i} className="press rounded p-0.5">
                  <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" className={i <= rating ? "text-amber-500" : "text-[var(--line)]"} fill="currentColor"><path d="m12 2 3 6.6 7 .7-5.3 4.7 1.6 7-6.3-3.8L5.7 21l1.6-7L2 9.3l7-.7L12 2Z" /></svg>
                </button>
              ))}
            </div>
          </fieldset>
          <Field label="What did you use it for?" htmlFor="rv-used" hint="E.g. “Transcribing Hindi client calls for 3 months”">
            <TextInput id="rv-used" value={usedFor} onChange={(e) => setUsedFor(e.target.value)} maxLength={200} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What worked" htmlFor="rv-pros">
              <TextArea id="rv-pros" value={pros} onChange={(e) => setPros(e.target.value)} maxLength={500} />
            </Field>
            <Field label="What didn't" htmlFor="rv-cons">
              <TextArea id="rv-cons" value={cons} onChange={(e) => setCons(e.target.value)} maxLength={500} />
            </Field>
          </div>
          {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Publish review"}</Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
          <p className="text-xs text-[var(--muted)]">Reviews are public under your display name. Makers can&apos;t pay to remove or reorder them.</p>
        </form>
      )}

      <div className="mt-5 space-y-3">
        {reviews === null ? (
          <><Skeleton className="h-20" /><Skeleton className="h-20" /></>
        ) : loadError ? (
          <p className="text-sm text-[var(--muted)]">Reviews couldn&apos;t load right now. Refresh to try again.</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No reviews yet. If you&apos;ve used {name}, yours will help the next person decide.</p>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className="rounded-xl border border-[var(--line)] p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Stars value={r.rating} />
                <span className="font-semibold">{r.authorName}</span>
              </div>
              <p className="mt-1.5 text-sm"><span className="text-[var(--muted)]">Used for:</span> {r.usedFor}</p>
              {r.pros && <p className="mt-1 text-sm"><span className="font-medium text-[var(--trust-strong)]">+</span> {r.pros}</p>}
              {r.cons && <p className="mt-1 text-sm"><span className="font-medium text-[var(--demand)]">−</span> {r.cons}</p>}
              <div className="mt-2">
                <ReportButton targetType="tool" targetPath={`toolReviews/${r.id}`} targetLabel={`Review of ${name}`} label="Report review" />
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
