// File: src/components/SubmitToolForm.tsx
// Purpose: Free tool submission. Human-reviewed; no fees, no paid "fast track".

"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { submitTool } from "@/lib/db";
import { toolSubmissionSchema } from "@/lib/schemas";
import { TOOL_CATEGORIES, PRICING_LABELS, type PricingModel } from "@/lib/directory-types";
import { logEvent } from "@/lib/analytics";
import { useDraft } from "@/lib/useDraft";
import DraftNotice from "./DraftNotice";
import { Button, EmptyState, Field, LinkButton, Select, Skeleton, TextArea, TextInput } from "./ui";

const EMPTY = { name: "", url: "https://", tagline: "", description: "", category: "", pricing: "freemium", isMaker: false, website: "" };
type SubmitForm = typeof EMPTY;
const submitEmpty = (v: SubmitForm) => !v.name.trim() && !v.tagline.trim() && !v.description.trim();

export default function SubmitToolForm() {
  const { user, profile, loading } = useAuth();
  const [form, setForm] = useState<SubmitForm>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [failure, setFailure] = useState("");
  const draft = useDraft<SubmitForm>("submit-tool", form, (v) => setForm({ ...EMPTY, ...v, website: "" }), submitEmpty);

  if (loading) return <Skeleton className="h-96" />;
  if (!user) {
    return (
      <EmptyState
        title="Sign in to submit — it's free"
        body="A free account lets us contact you if we need details, and stops spam submissions."
        action={<LinkButton href="/sign-in?next=/submit">Sign in or create account</LinkButton>}
      />
    );
  }
  if (done) {
    return (
      <EmptyState
        title="Thanks — your submission is in the review queue"
        body="A person reviews every submission against our editorial policy. Approved tools go live with your details; we may edit for clarity."
        action={<LinkButton href="/tools" variant="secondary">Back to the directory</LinkButton>}
      />
    );
  }

  const set = (k: keyof SubmitForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailure("");
    // Honeypot: real people never see or fill the hidden "website" field; bots usually do.
    if (form.website) {
      setDone(true);
      return;
    }
    const { website: _hp, ...fields } = form;
    void _hp;
    const parsed = toolSubmissionSchema.safeParse(fields);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await submitTool(user.uid, profile?.displayName ?? "Member", parsed.data);
      logEvent("tool.submitted.v1", { category: parsed.data.category });
      draft.clear();
      setDone(true);
    } catch {
      setFailure("Your submission couldn't be sent. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-5 rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6" noValidate>
      {draft.restored && <DraftNotice onKeep={draft.dismiss} onDiscard={() => { draft.clear(); setForm(EMPTY); }} />}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="s-website">Leave this empty</label>
        <input id="s-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tool name" htmlFor="s-name" error={errors.name}>
          <TextInput id="s-name" value={form.name} onChange={set("name")} maxLength={60} required />
        </Field>
        <Field label="Website" htmlFor="s-url" error={errors.url}>
          <TextInput id="s-url" type="url" inputMode="url" value={form.url} onChange={set("url")} required />
        </Field>
      </div>
      <Field label="One-line description" htmlFor="s-tag" error={errors.tagline} hint="What it does, in plain words.">
        <TextInput id="s-tag" value={form.tagline} onChange={set("tagline")} maxLength={120} required />
      </Field>
      <Field label="What it does and who it's for" htmlFor="s-desc" error={errors.description} hint="Specifics beat adjectives. Avoid “revolutionary”, “best-in-class”.">
        <TextArea id="s-desc" value={form.description} onChange={set("description")} maxLength={1200} required />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="s-cat" error={errors.category}>
          <Select id="s-cat" value={form.category} onChange={set("category")} required>
            <option value="">Choose…</option>
            {TOOL_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Pricing model" htmlFor="s-price" error={errors.pricing}>
          <Select id="s-price" value={form.pricing} onChange={set("pricing")}>
            {(Object.keys(PRICING_LABELS) as PricingModel[]).map((p) => <option key={p} value={p}>{PRICING_LABELS[p]}</option>)}
          </Select>
        </Field>
      </div>
      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" checked={form.isMaker} onChange={set("isMaker")} className="mt-0.5 h-4 w-4 accent-[var(--trust)]" />
        <span>I work on this product. <span className="text-[var(--muted)]">(Makers are welcome — we just disclose it.)</span></span>
      </label>
      {failure && <p role="alert" className="text-sm font-medium text-red-700">{failure}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit for review"}</Button>
        <p className="text-xs text-[var(--muted)]">Free. By submitting you agree to our <Link href="/editorial-policy" className="underline">editorial policy</Link>.</p>
      </div>
    </form>
  );
}
