// File: src/app/tools/page.tsx
// Purpose: Directory index + search. Server-rendered; filters are plain links (no JS needed).
// SEO: the unfiltered list is indexable; search and filter permutations are noindex,follow
// so thin parameter pages never dilute the site (Google thin-content / AdSense low-value).

import type { Metadata } from "next";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import ToolCard from "@/components/ToolCard";
import { findNamedTools, fetchSaveCounts, filterTools, getAllTools, matchTasks, searchTools, TOOL_CATEGORIES } from "@/lib/directory";
import { getComparison, pairSlug } from "@/lib/comparisons-data";
import { PRICING_LABELS, type PricingModel } from "@/lib/directory-types";

export const revalidate = 600;

const PAGE = 24;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.slice(0, 100) ?? "";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const q = one(sp.q);
  const filtered = Boolean(q || one(sp.category) || one(sp.pricing) || one(sp.api) || one(sp.os) || one(sp.page) || one(sp.sort));
  return {
    title: q ? `AI tools for “${q}”` : "All AI tools — searchable directory",
    description: "Search hand-reviewed AI tools by the task you need done. Filter by free plan, API access and open source. No login wall, no pay-to-rank.",
    alternates: { canonical: "/tools" },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ToolsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const category = one(sp.category);
  const pricing = one(sp.pricing);
  const api = one(sp.api) === "1";
  const os = one(sp.os) === "1";
  const sort = one(sp.sort) === "saved" ? "saved" : "";
  const page = Math.max(1, Number.parseInt(one(sp.page) || "1", 10) || 1);

  const [all, saves] = await Promise.all([getAllTools(), sort ? fetchSaveCounts() : Promise.resolve(new Map<string, number>())]);
  const base = q
    ? searchTools(all, q)
    : [...all].sort((a, b) => (sort ? (saves.get(b.slug) ?? 0) - (saves.get(a.slug) ?? 0) : 0) || a.name.localeCompare(b.name));
  const results = filterTools(base, { category: category || undefined, pricing: pricing || undefined, api, openSource: os });
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE));
  const shown = results.slice((page - 1) * PAGE, page * PAGE);
  const tasks = q ? matchTasks(q).slice(0, 3) : [];
  const named = q ? findNamedTools(all, q) : [];
  const vs = named.length >= 2 ? getComparison(`${named[0]!.slug}-vs-${named[1]!.slug}`) ?? getComparison(`${named[1]!.slug}-vs-${named[0]!.slug}`) : null;

  const href = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const cur: Record<string, string> = { q, category, pricing, api: api ? "1" : "", os: os ? "1" : "", sort };
    for (const [k, v] of Object.entries({ ...cur, ...patch })) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/tools?${s}` : "/tools";
  };

  const chip = (active: boolean) =>
    `press whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
      active ? "border-[var(--trust)] bg-[var(--trust)]/10 text-[var(--trust-strong)]" : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
    }`;

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">{q ? <>AI tools for &ldquo;{q}&rdquo;</> : "AI tools directory"}</h1>
        <div className="max-w-2xl"><SearchBox defaultValue={q} /></div>
        {vs && (
          <p className="rounded-xl border border-[var(--trust)]/25 bg-[var(--trust)]/5 px-4 py-3 text-sm">
            Comparing these two? <Link href={`/compare/${pairSlug(vs)}`} className="font-semibold text-[var(--trust-strong)] hover:underline">Read our head-to-head guide →</Link>
          </p>
        )}
        {tasks.length > 0 && (
          <p className="text-sm text-[var(--muted)]">
            Read the guide first:{" "}
            {tasks.map((t, i) => (
              <span key={t.slug}>
                {i > 0 && " · "}
                <Link href={`/tasks/${t.slug}`} className="font-medium text-[var(--trust-strong)] hover:underline">{t.title}</Link>
              </span>
            ))}
          </p>
        )}
      </header>

      <nav aria-label="Filters" className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link href={href({ category: null, page: null })} className={chip(!category)}>All categories</Link>
          {TOOL_CATEGORIES.map((c) => (
            <Link key={c.slug} href={href({ category: c.slug, page: null })} className={chip(category === c.slug)}>{c.name}</Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={href({ pricing: null, page: null })} className={chip(!pricing)}>Any price</Link>
          <Link href={href({ pricing: "has-free", page: null })} className={chip(pricing === "has-free")}>Has a free plan</Link>
          {(Object.keys(PRICING_LABELS) as PricingModel[]).map((p) => (
            <Link key={p} href={href({ pricing: p, page: null })} className={chip(pricing === p)}>{PRICING_LABELS[p]}</Link>
          ))}
          <span className="mx-1 hidden w-px bg-[var(--line)] sm:block" aria-hidden="true" />
          <Link href={href({ api: api ? null : "1", page: null })} className={chip(api)} aria-pressed={api}>API available</Link>
          <Link href={href({ os: os ? null : "1", page: null })} className={chip(os)} aria-pressed={os}>Open weights/source</Link>
          {!q && (
            <>
              <span className="mx-1 hidden w-px bg-[var(--line)] sm:block" aria-hidden="true" />
              <Link href={href({ sort: null, page: null })} className={chip(!sort)}>A–Z</Link>
              <Link href={href({ sort: "saved", page: null })} className={chip(sort === "saved")}>Most saved</Link>
            </>
          )}
        </div>
      </nav>

      <p className="text-sm text-[var(--muted)]" aria-live="polite">
        <strong className="tabular-nums text-[var(--ink)]">{results.length}</strong> tool{results.length === 1 ? "" : "s"}
        {q ? " ranked by relevance to your task" : sort ? " ordered by how many people saved them" : " in alphabetical order"} — <Link href="/editorial-policy#ranking" className="underline-offset-2 hover:underline">how ranking works</Link>
      </p>

      {shown.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--demand)]/40 bg-white p-8 text-center">
          <h2 className="font-display text-lg font-semibold">We don&apos;t list an AI for that yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Try fewer words or remove a filter. If it really doesn&apos;t exist, post it on the demand board — builders watch it for exactly this.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href={`/demand/new?title=${encodeURIComponent(q.slice(0, 120))}`} className="press rounded-xl bg-[var(--demand)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">Post this as a request</Link>
            <Link href="/submit" className="press rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-semibold hover:border-[var(--trust)]">Know a tool? Submit it free</Link>
          </div>
        </div>
      )}

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && <Link rel="prev" href={href({ page: String(page - 1) })} className={chip(false)}>← Previous</Link>}
          <span className="text-xs text-[var(--muted)] tabular-nums">Page {page} of {pageCount}</span>
          {page < pageCount && <Link rel="next" href={href({ page: String(page + 1) })} className={chip(false)}>Next →</Link>}
        </nav>
      )}

      {q && shown.length > 0 && (
        <p className="pt-4 text-center text-sm text-[var(--muted)]">
          Not quite it?{" "}
          <Link href={`/demand/new?title=${encodeURIComponent(q.slice(0, 120))}`} className="font-medium text-[var(--demand)] hover:underline">Post “{q}” as a request</Link>{" "}
          and let builders respond.
        </p>
      )}
    </div>
  );
}
