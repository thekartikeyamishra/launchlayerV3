// File: src/app/demand/[id]/page.tsx
// Purpose: Demand post detail — votes, follows, comments, creator claims, reporting.

"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import ReportButton from "@/components/ReportButton";
import { Button, EmptyState, ErrorNote, Field, Pill, Skeleton, TextArea, TextInput, VerifiedBadge } from "@/components/ui";

export default function DemandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();

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
    if (!user) { setError("Sign in to vote — votes are one per verified account."); return; }
    setError("");
    const previous = { voted, count: post.voteCount };
    const nextVoted = !voted;
    setVoted(nextVoted);
    setPost({ ...post, voteCount: post.voteCount + (nextVoted ? 1 : -1) });
    try {
      const result = await toggleVote(post.id, user.uid);
      logEvent(result ? "demand_post.voted.v1" : "demand_post.unvoted.v1", { category: post.category });
    } catch {
      setVoted(previous.voted);
      setPost({ ...post, voteCount: previous.count });
      setError("Your vote didn't save. Try again.");
    }
  };

  const onFollow = async () => {
    if (!user) { setError("Sign in to follow this request."); return; }
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
    if (!user) { setError("Sign in to comment."); return; }
    const parsed = commentSchema.safeParse({ body: commentBody });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your comment."); return; }
    setBusy(true);
    setError("");
    try {
      await addComment(post.id, user.uid, user.displayName ?? "Member", parsed.data.body);
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
      await addClaim(post.id, user.uid, user.displayName ?? "Creator", parsed.data);
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
