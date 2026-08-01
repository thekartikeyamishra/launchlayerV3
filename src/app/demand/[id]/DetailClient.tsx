// File: src/app/demand/[id]/DetailClient.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchDemandPost,
  fetchComments,
  fetchClaims,
  toggleVote,
  toggleFollow,
  hasMembership,
  addComment,
  addClaim,
} from "@/lib/db";
import { logEvent } from "@/lib/analytics";
import { consumeJustPosted } from "@/lib/missions";
import type { DemandPost, DemandComment, DemandClaim } from "@/lib/types";
import { URGENCY_LABELS, BUDGET_LABELS } from "@/lib/categories";
import { Button, Pill, Skeleton, EmptyState, Field, TextArea, TextInput, ErrorNote, LinkButton, VerifiedBadge } from "@/components/ui";
import ReportButton from "@/components/ReportButton";
import { commentSchema, claimSchema } from "@/lib/schemas";

export default function DetailClient({ id }: { id: string }) {
  const { user, profile } = useAuth();
  
  const [post, setPost] = useState<DemandPost | null>(null);
  const [comments, setComments] = useState<DemandComment[]>([]);
  const [claims, setClaims] = useState<DemandClaim[]>([]);
  
  const [hasVoted, setHasVoted] = useState(false);
  const [hasFollowed, setHasFollowed] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [celebrate, setCelebrate] = useState(false);

  // Forms state
  const [commentBody, setCommentBody] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentErr, setCommentErr] = useState("");

  const [claimForm, setClaimForm] = useState({ title: "", description: "", listingUrl: "" });
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimErr, setClaimErr] = useState("");
  const [showClaimForm, setShowClaimForm] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setCelebrate(consumeJustPosted());
    logEvent("page.viewed.v1", { page: "demand_detail", postId: id });

    async function loadData() {
      try {
        const [p, c, cl] = await Promise.all([
          fetchDemandPost(id),
          fetchComments(id),
          fetchClaims(id),
        ]);
        
        if (!isMounted) return;
        
        if (!p) {
          setError("This demand post could not be found or has been removed.");
          setLoading(false);
          return;
        }
        
        setPost(p);
        setComments(c);
        setClaims(cl);

        if (user) {
          const [v, f] = await Promise.all([
            hasMembership(id, "votes", user.uid),
            hasMembership(id, "follows", user.uid),
          ]);
          if (isMounted) {
            setHasVoted(v);
            setHasFollowed(f);
          }
        }
      } catch {
        if (isMounted) setError("Failed to load post data. Please check your connection.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    void loadData();
    return () => { isMounted = false; };
  }, [id, user]);

  const handleVote = async () => {
    if (!user) return alert("You must be signed in to vote.");
    const wasVoted = hasVoted;
    
    setHasVoted(!wasVoted);
    setPost((p) => p ? { ...p, voteCount: p.voteCount + (wasVoted ? -1 : 1) } : p);
    
    try {
      await toggleVote(id, user.uid);
      if (!wasVoted) logEvent("demand_post.voted.v1", { postId: id });
      else logEvent("demand_post.unvoted.v1", { postId: id });
    } catch {
      setHasVoted(wasVoted);
      setPost((p) => p ? { ...p, voteCount: p.voteCount + (wasVoted ? 1 : -1) } : p);
    }
  };

  const handleFollow = async () => {
    if (!user) return alert("You must be signed in to follow updates.");
    const wasFollowed = hasFollowed;
    
    setHasFollowed(!wasFollowed);
    setPost((p) => p ? { ...p, followCount: p.followCount + (wasFollowed ? -1 : 1) } : p);
    
    try {
      await toggleFollow(id, user.uid);
      if (!wasFollowed) logEvent("demand_post.followed.v1", { postId: id });
      else logEvent("demand_post.unfollowed.v1", { postId: id });
    } catch {
      setHasFollowed(wasFollowed);
      setPost((p) => p ? { ...p, followCount: p.followCount + (wasFollowed ? 1 : -1) } : p);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setCommentErr("");
    const parsed = commentSchema.safeParse({ body: commentBody });
    
    if (!parsed.success) {
      setCommentErr(parsed.error.issues[0]?.message ?? "Invalid comment.");
      return;
    }
    
    setCommentBusy(true);
    try {
      const authorName = user.displayName ?? user.email?.split("@")[0] ?? "Member";
      await addComment(id, user.uid, authorName, parsed.data.body);
      setComments((prev) => [
        ...prev, 
        { id: Date.now().toString(), authorId: user.uid, authorName, body: parsed.data.body, createdAt: null }
      ]);
      setPost((p) => p ? { ...p, commentCount: p.commentCount + 1 } : p);
      setCommentBody("");
      logEvent("demand_comment.created.v1", { postId: id });
    } catch {
      setCommentErr("Your comment couldn't be posted. Try again.");
    } finally {
      setCommentBusy(false);
    }
  };

  const submitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setClaimErr("");
    const parsed = claimSchema.safeParse(claimForm);
    
    if (!parsed.success) {
      setClaimErr(parsed.error.issues[0]?.message ?? "Please check your solution details.");
      return;
    }
    
    setClaimBusy(true);
    try {
      const creatorName = user.displayName ?? user.email?.split("@")[0] ?? "Verified Creator";
      await addClaim(id, user.uid, creatorName, parsed.data);
      setClaims((prev) => [
        { id: Date.now().toString(), creatorId: user.uid, creatorName, ...parsed.data, createdAt: null },
        ...prev
      ]);
      setPost((p) => p ? { ...p, claimCount: p.claimCount + 1 } : p);
      setShowClaimForm(false);
      setClaimForm({ title: "", description: "", listingUrl: "" });
      logEvent("demand_claim.created.v1", { postId: id });
    } catch {
      setClaimErr("Your solution couldn't be attached. Try again.");
    } finally {
      setClaimBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState title="Not Found" body={error || "This post is unavailable."} action={<LinkButton href="/demand">Back to Board</LinkButton>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {celebrate && (
        <div className="anim-pop rounded-xl border border-[var(--trust)]/30 bg-[var(--trust)]/5 px-6 py-4 text-center">
          <p className="font-display font-semibold text-[var(--trust-strong)]">Your request is live!</p>
          <p className="mt-1 text-sm text-[var(--trust-strong)]/80">
            Creators watching the board can now see your demand. Share the link to gather more votes.
          </p>
        </div>
      )}

      {/* Main Post Content */}
      <section className="anim-rise rounded-2xl border border-[var(--line)] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Pill tone="neutral">{post.category}</Pill>
          {post.urgency !== "exploring" && <Pill tone="demand">{URGENCY_LABELS[post.urgency]}</Pill>}
          {post.budgetBand !== "unspecified" && <Pill tone="neutral">{BUDGET_LABELS[post.budgetBand]}</Pill>}
        </div>
        
        <h1 className="font-display mt-5 text-3xl font-bold leading-tight text-[var(--ink)]">{post.title}</h1>
        
        <div className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-[var(--ink)]">
          {post.description}
        </div>
        
        {post.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span key={tag} className="rounded-md bg-[var(--bg)] px-2 py-1 text-xs font-medium text-[var(--muted)]">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="mt-8 flex flex-col justify-between gap-6 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
            <span>Posted by <strong className="font-medium text-[var(--ink)]">{post.authorName}</strong></span>
            <span>&bull;</span>
            <span>
              {post.createdAt 
                ? new Date(post.createdAt.seconds * 1000).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) 
                : "Just now"}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button variant={hasVoted ? "primary" : "secondary"} onClick={handleVote} className="min-w-[120px]">
              {hasVoted ? "Voted " : "Vote " } ({post.voteCount})
            </Button>
            <Button variant={hasFollowed ? "secondary" : "ghost"} onClick={handleFollow}>
              {hasFollowed ? "Following" : "Follow"}
            </Button>
            <ReportButton targetType="demandPost" targetPath={`demandPosts/${post.id}`} targetLabel={post.title} />
          </div>
        </div>
      </section>

      {/* Solutions / Claims Section */}
      <section aria-labelledby="solutions-heading" className="space-y-6">
        <div className="flex items-end justify-between border-b border-[var(--line)] pb-4">
          <h2 id="solutions-heading" className="font-display text-xl font-bold">
            Solutions <span className="text-[var(--muted)] font-normal text-base">({post.claimCount})</span>
          </h2>
          
          {profile?.verifiedCreator && !showClaimForm && (
            <Button onClick={() => setShowClaimForm(true)} size="sm">Offer your solution</Button>
          )}
        </div>

        {showClaimForm && (
          <form onSubmit={submitClaim} className="anim-rise rounded-xl border border-[var(--trust)]/30 bg-[var(--trust)]/5 p-6 space-y-4">
            <h3 className="font-display font-bold">Attach your solution</h3>
            <p className="text-sm text-[var(--muted)]">Provide the link and a brief pitch of why it solves this exact problem.</p>
            
            <Field label="Solution Name" htmlFor="claim-title" error={claimErr.includes("Name") ? claimErr : undefined}>
              <TextInput id="claim-title" value={claimForm.title} onChange={e => setClaimForm({...claimForm, title: e.target.value})} placeholder="e.g., InvoiceGenius AI" />
            </Field>
            <Field label="How it helps" htmlFor="claim-desc" error={claimErr.includes("characters") ? claimErr : undefined}>
              <TextArea id="claim-desc" rows={3} value={claimForm.description} onChange={e => setClaimForm({...claimForm, description: e.target.value})} placeholder="Describe how it meets the requirements..." />
            </Field>
            <Field label="Website / Link" htmlFor="claim-url" error={claimErr.includes("URL") || claimErr.includes("https") ? claimErr : undefined}>
              <TextInput id="claim-url" type="url" value={claimForm.listingUrl} onChange={e => setClaimForm({...claimForm, listingUrl: e.target.value})} placeholder="https://..." />
            </Field>
            
            {claimErr && <ErrorNote message={claimErr} />}
            
            <div className="flex gap-3">
              <Button type="submit" disabled={claimBusy}>{claimBusy ? "Submitting..." : "Submit solution"}</Button>
              <Button type="button" variant="ghost" onClick={() => setShowClaimForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {!profile?.verifiedCreator && (
          <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg)] p-6 text-center">
            <p className="text-sm text-[var(--muted)]">Have a product that solves this? Apply to become a Verified Creator to attach it here.</p>
            {!user ? (
              <Link href="/sign-in" className="mt-3 inline-block font-semibold text-[var(--trust-strong)] hover:underline">Sign in to apply</Link>
            ) : (
              <Link href="/account" className="mt-3 inline-block font-semibold text-[var(--trust-strong)] hover:underline">Apply in Account Settings</Link>
            )}
          </div>
        )}

        {claims.length === 0 ? (
          !showClaimForm && (
            <EmptyState 
              title="No solutions yet" 
              body="This request is wide open. The first verified creator to build a solution will capture all the demand." 
            />
          )
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <article key={claim.id} className="rounded-xl border border-[var(--line)] bg-white p-5 hover:border-[var(--trust)]/40 transition-colors">
                <div className="flex flex-col justify-between sm:flex-row sm:items-start">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-[var(--ink)]">{claim.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="text-[var(--muted)]">by {claim.creatorName}</span>
                      <VerifiedBadge />
                    </div>
                  </div>
                  <a 
                    href={claim.listingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-3 sm:mt-0 inline-flex items-center gap-2 rounded-lg bg-[var(--trust)]/10 px-4 py-2 text-sm font-semibold text-[var(--trust-strong)] hover:bg-[var(--trust)]/20 transition-colors"
                  >
                    View solution &rarr;
                  </a>
                </div>
                <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">{claim.description}</p>
                <div className="mt-4 flex justify-end">
                   <ReportButton targetType="claim" targetPath={`demandPosts/${id}/claims/${claim.id}`} targetLabel={`Claim: ${claim.title}`} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Comments Section */}
      <section aria-labelledby="comments-heading" className="space-y-6">
        <h2 id="comments-heading" className="font-display text-xl font-bold border-b border-[var(--line)] pb-4">
          Discussion <span className="text-[var(--muted)] font-normal text-base">({post.commentCount})</span>
        </h2>

        {user ? (
          <form onSubmit={submitComment} className="space-y-3">
            <Field label="Add a comment" htmlFor="comment-body" error={commentErr}>
              <TextArea 
                id="comment-body" 
                rows={3} 
                value={commentBody} 
                onChange={e => setCommentBody(e.target.value)} 
                placeholder="Ask for details, clarify requirements..." 
              />
            </Field>
            {commentErr && <ErrorNote message={commentErr} />}
            <Button type="submit" disabled={commentBusy || !commentBody.trim()}>
              {commentBusy ? "Posting..." : "Post comment"}
            </Button>
          </form>
        ) : (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--bg)] p-4 text-sm text-[var(--muted)]">
            <Link href="/sign-in" className="font-semibold text-[var(--trust-strong)] hover:underline">Sign in</Link> to join the discussion.
          </div>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--line)] font-bold text-[var(--muted)]">
                {comment.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 space-y-1 rounded-xl bg-white p-4 border border-[var(--line)]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{comment.authorName}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                  </span>
                </div>
                <p className="text-sm text-[var(--ink)] whitespace-pre-wrap">{comment.body}</p>
                <div className="mt-2 text-right">
                  <ReportButton targetType="comment" targetPath={`demandPosts/${id}/comments/${comment.id}`} targetLabel={`Comment by ${comment.authorName}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}