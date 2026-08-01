// File: src/app/demand/[id]/DetailClient.tsx
// Purpose: Client half of the demand detail page — votes, follows, comments, claims, reporting.
// The server half (page.tsx) provides per-post SEO metadata and JSON-LD.

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  addClaim,
  addComment,
  fetchClaims,
  fetchComments,
  fetchDemandPost,
  hasMembership,
  toggleFollow,
  toggleVote,
} from "@/lib/db";
import type { DemandClaim, DemandComment, DemandPost } from "@/lib/types";
import { BUDGET_LABELS, URGENCY_LABELS } from "@/lib/categories";
import { claimSchema, commentSchema } from "@/lib/schemas";
import { logEvent } from "@/lib/analytics";
import { consumeJustPosted, markMission } from "@/lib/missions";
import ReportButton from "@/components/ReportButton";
import SharePost from "@/components/SharePost";
import { Button, EmptyState, ErrorNote, Field, Pill, Skeleton, TextArea, TextInput, VerifiedBadge } from "@/components/ui";

export default function DetailClient({ id }: { id: string }) {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [post, setPost] = useState<DemandPost | null | undefined>(undefined);
  const [comments, setComments] = useState<DemandComment[]>([]);
  const [claims, setClaims] = useState<DemandClaim[]>([]);
  const [voted, setVoted] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [claimForm, setClaimForm] = useState({ title: "", description: "", listingUrl: "" });
  const [claimOpen, setClaimOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const load = useCallback(async () => {
    try {
      const p = await fetchDemandPost(id);
      setPost(p);
      if (p) {
        const [c, cl] = await Promise.all([fetchComments(id), fetchClaims(id)]);
        setComments(c);
        setClaims(cl);
      }
    } catch {
      setError("This post couldn't be loaded. Refresh to try again.");
      setPost(null);
    }
  }, [id]);

  useEffect(() => {
    logEvent("page.viewed.v1", { page: "demand_detail" });
    setCelebrate(consumeJustPosted());
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) { setVoted(false); setFollowed(false); return; }
    void (async () => {
      try {
        const [v, f] = await Promise.all([
          hasMembership(id, "votes", user.uid),
          hasMembership(id, "follows", user.uid),
        ]);
        setVoted(v);
        setFollowed(f);
      } catch { /* non-blocking */ }
    })();
  }, [id, user]);

  if (post === undefined) return <Skeleton className="h-96" />;
  if (post === null || post.status !== "active") {
    return (
      <EmptyState
        title="This demand post isn't available"
        body="It may have been removed by moderation or the link may be wrong."
        action={<Link className="text-sm font-semibold text-[var(--trust-strong)] hover:underline" href="/demand">Back to the board</Link>}
      />
    );
  }

  const onVote = async () => {
    if (!user) { router.push(`/sign-in?next=/demand/${id}`); return; }
    if (!user.emailVerified) {
      setError("Votes count only from verified accounts — that's what keeps demand signals real. Verify your email from the Account page, then vote.");
      return;
    }
    setError("");
    const previous = { voted, count: post.voteCount };
    const nextVoted = !voted;
    setVoted(nextVoted);
    setPost({ ...post, voteCount: post.voteCount + (nextVoted ? 1 : -1) });
    try {
      const result = await toggleVote(post.id, user.uid);
      if (result) markMission("voted");
      logEvent(result ? "demand_post.voted.v1" : "demand_post.unvoted.v1", { category: post.category });
    } catch {
      setVoted(previous.voted);
      setPost({ ...post, voteCount: previous.count });
      setError("Your vote didn't save. Try again.");
    }
  };

  const onFollow = async () => {
    if (!user) { router.push(`/sign-in?next=/demand/${id}`); return; }
    if (!user.emailVerified) {
      setError("Following requires a verified email. Verify from the Account page first.");
      return;
    }
    setError("");
    const previous = { followed, count: post.followCount };
    const next = !followed;
    setFollowed(next);
    setPost({ ...post, followCount: post.followCount + (next ? 1 : -1) });
    try {
      const result = await toggleFollow(post.id, user.uid);
      logEvent(result ? "demand_post.followed.v1" : "demand_post.unfollowed.v1", { category: post.category });
    } catch {
      setFollowed(previous.followed);
      setPost({ ...post, followCount: previous.count });
      setError("Follow didn't save. Try again.");
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push(`/sign-in?next=/demand/${id}`); return; }
    if (!user.emailVerified) { setError("Commenting requires a verified email. Verify from the Account page first."); return; }
    const parsed = commentSchema.safeParse({ body: commentBody });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your comment."); return; }
    setBusy(true);
    setError("");
    try {
      await addComment({ id: post.id, authorId: post.authorId, title: post.title }, user.uid, user.displayName ?? "Member", parsed.data.body);
      logEvent("demand_comment.created.v1", { category: post.category });
      setCommentBody("");
      await load();
    } catch {
      setError("Your comment couldn't be posted. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.verifiedCreator) return;
    const parsed = claimSchema.safeParse(claimForm);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the solution details."); return; }
    setBusy(true);
    setError("");
    try {
      await addClaim({ id: post.id, authorId: post.authorId, title: post.title }, user.uid, user.displayName ?? "Creator", parsed.data);
      logEvent("demand_claim.created.v1", { category: post.category });
      setClaimForm({ title: "", description: "", listingUrl: "" });
      setClaimOpen(false);
      await load();
    } catch {
      setError("Your solution couldn't be attached. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {celebrate && (
        <div className="anim-pop rounded-xl border border-[var(--trust)]/30 bg-[var(--trust)]/5 p-4" role="status">
          <p className="font-display text-sm font-bold text-[var(--trust-strong)]">Your request is live on the board.</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Creators watching this category can now see it. Every vote it collects is a real
            signal of demand — share the link to gather more.
          </p>
        </div>
      )}
      <article>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="neutral">{post.category}</Pill>
          <Pill tone="neutral">{BUDGET_LABELS[post.budgetBand]}</Pill>
          {post.urgency !== "exploring" && <Pill tone="demand">{URGENCY_LABELS[post.urgency]}</Pill>}
        </div>
        <h1 className="font-display mt-3 text-2xl font-bold leading-snug">{post.title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Requested by {post.authorName}</p>
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{post.description}</p>
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((t) => (<Pill key={t} tone="neutral">#{t}</Pill>))}
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={onVote} variant={voted ? "secondary" : "primary"} aria-pressed={voted}>
            {voted ? "Voted" : "I need this too"} · <span className="tabular-nums">{post.voteCount}</span>
          </Button>
          <Button onClick={onFollow} variant="secondary" aria-pressed={followed}>
            {followed ? "Following" : "Follow"} · <span className="tabular-nums">{post.followCount}</span>
          </Button>
        </div>
        <MilestoneMeter voteCount={post.voteCount} />
        <div className="mt-4">
          <SharePost postId={post.id} title={post.title} voteCount={post.voteCount} />
        </div>
        {error && <div className="mt-4"><ErrorNote message={error} /></div>}
        <div className="mt-4">
          <ReportButton targetType="demandPost" targetPath={`demandPosts/${post.id}`} targetLabel={post.title} />
        </div>
      </article>

      <section aria-labelledby="claims-heading" className="rounded-xl border border-[var(--line)] bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 id="claims-heading" className="font-display text-lg font-bold">
            Solutions offered <span className="text-[var(--muted)]">({claims.length})</span>
          </h2>
          {profile?.verifiedCreator ? (
            <Button variant="secondary" onClick={() => setClaimOpen((v) => !v)}>
              {claimOpen ? "Close" : "I built this"}
            </Button>
          ) : user ? (
            <Link href="/account" className="text-xs text-[var(--muted)] hover:underline">
              Apply for Verified Creator to offer solutions
            </Link>
          ) : null}
        </div>

        {claimOpen && profile?.verifiedCreator && (
          <form onSubmit={submitClaim} className="mt-4 space-y-4 rounded-lg border border-[var(--line)] p-4">
            <Field label="Solution name" htmlFor="claim-title">
              <TextInput id="claim-title" value={claimForm.title} maxLength={120} onChange={(e) => setClaimForm({ ...claimForm, title: e.target.value })} />
            </Field>
            <Field label="How it solves this request" htmlFor="claim-desc">
              <TextArea id="claim-desc" rows={3} value={claimForm.description} maxLength={1000} onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })} />
            </Field>
            <Field label="Link to your solution" htmlFor="claim-url" hint="https:// link to your product, demo, or docs.">
              <TextInput id="claim-url" type="url" value={claimForm.listingUrl} onChange={(e) => setClaimForm({ ...claimForm, listingUrl: e.target.value })} />
            </Field>
            <Button type="submit" disabled={busy}>{busy ? "Attaching…" : "Attach solution"}</Button>
          </form>
        )}

        {claims.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            No solutions yet — this request is an open opportunity for creators.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {claims.map((c) => (
              <li key={c.id} className="rounded-lg border border-[var(--line)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{c.title}</span>
                  <VerifiedBadge />
                </div>
                {c.description && <p className="mt-1 text-sm text-[var(--muted)]">{c.description}</p>}
                <p className="mt-2 text-xs text-[var(--muted)]">
                  by {c.creatorName} ·{" "}
                  <a href={c.listingUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--trust-strong)] hover:underline">
                    View solution ↗
                  </a>{" "}
                  <span className="text-[var(--muted)]">(external link — transaction happens off LaunchLayer)</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="comments-heading">
        <h2 id="comments-heading" className="font-display text-lg font-bold">
          Discussion <span className="text-[var(--muted)]">({comments.length})</span>
        </h2>
        <ul className="mt-4 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-[var(--line)] bg-white p-4">
              <p className="text-sm font-semibold">{c.authorName}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--ink)]">{c.body}</p>
            </li>
          ))}
        </ul>
        {user ? (
          <form onSubmit={submitComment} className="mt-4 space-y-3">
            <Field label="Add to the discussion" htmlFor="comment">
              <TextArea id="comment" rows={3} value={commentBody} maxLength={2000} onChange={(e) => setCommentBody(e.target.value)} placeholder="Clarify the need, share constraints, or ask the requester a question." />
            </Field>
            <Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post comment"}</Button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            <Link href="/sign-in" className="font-semibold text-[var(--trust-strong)] hover:underline">Sign in</Link> to join the discussion.
          </p>
        )}
      </section>
    </div>
  );
}

const MILESTONES = [10, 25, 50, 100, 250, 500];

function MilestoneMeter({ voteCount }: { voteCount: number }) {
  const next = MILESTONES.find((m) => m > voteCount);
  if (!next || voteCount === 0) return null;
  const pct = Math.min(100, Math.round((voteCount / next) * 100));
  return (
    <div className="mt-5 max-w-sm">
      <div className="flex items-baseline justify-between text-xs text-[var(--muted)]">
        <span className="tabular-nums">
          <strong className="text-[var(--ink)]">{voteCount}</strong> of {next} votes to the next milestone
        </span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--line)]" role="progressbar" aria-valuenow={voteCount} aria-valuemin={0} aria-valuemax={next} aria-label="Votes toward next milestone">
        <div className="progress-fill h-full rounded-full bg-[var(--demand)]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-[var(--muted)]">
        Milestones are real vote counts — share this request with people who genuinely need it.
      </p>
    </div>
  );
}
