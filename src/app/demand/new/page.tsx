// File: src/app/demand/new/page.tsx
// Purpose: Create a demand post. Requires a signed-in account with a verified email (Trust v0).

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { createDemandPost, fetchPostsForSearch, searchPosts } from "@/lib/db";
import { demandPostSchema } from "@/lib/schemas";
import { BUDGET_LABELS, CATEGORIES, URGENCY_LABELS } from "@/lib/categories";
import { logEvent } from "@/lib/analytics";
import { markMission, setJustPosted } from "@/lib/missions";
import { Button, ErrorNote, Field, Select, TextArea, TextInput } from "@/components/ui";
import type { DemandPost } from "@/lib/types";
import { useDraft } from "@/lib/useDraft";
import DraftNotice from "@/components/DraftNotice";

type DemandForm = { title: string; description: string; category: string; budgetBand: string; urgency: string; tags: string };
const demandEmpty = (v: DemandForm) => !v.title.trim() && !v.description.trim() && !v.tags.trim();

export default function NewDemandPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    budgetBand: "unspecified",
    urgency: "exploring",
    tags: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [similar, setSimilar] = useState<DemandPost[]>([]);

  // Prefill from the homepage hero handoff (?title=...)
  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get("title");
      if (t) setForm((f) => (f.title ? f : { ...f, title: t.slice(0, 120) }));
    } catch {
      // no-op
    }
  }, []);
  // Autosave: people who leave halfway get their request back when they return.
  const draft = useDraft<DemandForm>("demand", form, (v) => setForm((f) => ({ ...v, title: f.title || v.title })), demandEmpty);
  const searchPool = useRef<DemandPost[] | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Duplicate suggestion (Ch. 10.2): before posting, surface similar existing requests.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const title = form.title.trim();
    if (title.length < 12) { setSimilar([]); return; }
    debounce.current = setTimeout(async () => {
      try {
        if (!searchPool.current) searchPool.current = await fetchPostsForSearch();
        setSimilar(searchPosts(searchPool.current, title).slice(0, 3));
      } catch {
        setSimilar([]);
      }
    }, 400);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [form.title]);

  if (loading) return <p className="text-sm text-[var(--muted)]">Loading…</p>;

  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-[var(--line)] bg-white p-8 text-center">
        <h1 className="font-display text-xl font-bold">Sign in to post demand</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Posting requires an account so every request on the board is accountable to a real person.
        </p>
        <Link href="/sign-in" className="mt-5 inline-block rounded-lg bg-[var(--trust)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--trust-strong)]">
          Sign in or create an account
        </Link>
      </div>
    );
  }

  if (!user.emailVerified) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-[var(--line)] bg-white p-8 text-center">
        <h1 className="font-display text-xl font-bold">Verify your email first</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Verified email is the first step on the trust ladder. Check your inbox for the verification
          link, then reload this page.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button
            variant="secondary"
            disabled={verifySent}
            onClick={async () => {
              try {
                await sendEmailVerification(user);
                setVerifySent(true);
              } catch {
                setError("The verification email couldn't be sent right now. Try again in a minute.");
              }
            }}
          >
            {verifySent ? "Verification email sent" : "Resend verification email"}
          </Button>
          <Button onClick={() => window.location.reload()}>I&apos;ve verified — reload</Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const parsed = demandPostSchema.safeParse({ ...form, tags });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }
    setBusy(true);
    try {
      const id = await createDemandPost(parsed.data, user.uid, user.displayName ?? user.email?.split("@")[0] ?? "Member");
      logEvent("demand_post.created.v1", { category: parsed.data.category, urgency: parsed.data.urgency });
      markMission("posted");
      setJustPosted();
      draft.clear();
      router.push(`/demand/${id}`);
    } catch {
      setError("Your request couldn't be posted. Check your connection and try again — nothing was saved.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold">Post a demand request</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Describe the AI solution you need. Creators watching this board build from real requests like yours.
      </p>
      {draft.restored && (
        <div className="mt-4">
          <DraftNotice
            onKeep={draft.dismiss}
            onDiscard={() => {
              draft.clear();
              setForm({ title: "", description: "", category: "", budgetBand: "unspecified", urgency: "exploring", tags: "" });
            }}
          />
        </div>
      )}
      <form onSubmit={submit} className="mt-6 space-y-5">
        <Field label="What do you need?" htmlFor="title" error={fieldErrors.title} hint="One clear sentence, e.g. “An AI agent that reads invoices in German and exports to Tally.”">
          <TextInput id="title" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        {similar.length > 0 && (
          <div className="anim-rise rounded-lg border border-[var(--demand)]/30 bg-[var(--demand)]/5 p-4">
            <p className="text-sm font-semibold text-[var(--demand)]">Similar requests already exist</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Voting on an existing request concentrates the demand signal — consider these before posting a duplicate:
            </p>
            <ul className="mt-2 space-y-1">
              {similar.map((s) => (
                <li key={s.id}>
                  <Link href={`/demand/${s.id}`} target="_blank" className="text-sm font-medium text-[var(--trust-strong)] hover:underline">
                    {s.title} <span className="tabular-nums text-[var(--muted)]">({s.voteCount} votes)</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Field label="Describe the problem" htmlFor="description" error={fieldErrors.description} hint="What it should do, what you use today, what success looks like.">
          <TextArea id="description" rows={6} value={form.description} maxLength={4000} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Category" htmlFor="category" error={fieldErrors.category}>
            <Select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Choose…</option>
              {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </Select>
          </Field>
          <Field label="Budget band" htmlFor="budget" error={fieldErrors.budgetBand}>
            <Select id="budget" value={form.budgetBand} onChange={(e) => setForm({ ...form, budgetBand: e.target.value })}>
              {Object.entries(BUDGET_LABELS).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
            </Select>
          </Field>
          <Field label="Urgency" htmlFor="urgency" error={fieldErrors.urgency}>
            <Select id="urgency" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
              {Object.entries(URGENCY_LABELS).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
            </Select>
          </Field>
        </div>
        <Field label="Tags (optional)" htmlFor="tags" error={fieldErrors.tags} hint="Comma-separated, up to 6 — e.g. hindi, whatsapp, gst">
          <TextInput id="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        </Field>
        {error && <ErrorNote message={error} />}
        <Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post request"}</Button>
      </form>
    </div>
  );
}
