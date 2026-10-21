// File: src/app/compare/page.tsx
// Purpose: Comparison hub. Without params: indexable list of editor-written comparisons.
// With ?tools=a,b[,c,d]: an ad-hoc side-by-side table (noindex — parameter pages stay out of search).

import type { Metadata } from "next";
import Link from "next/link";
import CompareTable from "@/components/CompareTable";
import { getAllTools } from "@/lib/directory";
import { COMPARISONS, getComparison, pairSlug } from "@/lib/comparisons-data";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parse(v: string | string[] | undefined): string[] {
  const raw = (Array.isArray(v) ? v[0] : v) ?? "";
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 4);
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const slugs = parse((await searchParams).tools);
  if (slugs.length >= 2) return { title: "Compare AI tools side by side", robots: { index: false, follow: true }, alternates: { canonical: "/compare" } };
  return {
    title: "AI tool comparisons — which one should you use?",
    description: "Editor-written head-to-head comparisons of popular AI tools: who should choose which, strengths, limits and pricing models side by side.",
    alternates: { canonical: "/compare" },
  };
}

export default async function ComparePage({ searchParams }: Props) {
  const slugs = parse((await searchParams).tools);
  const all = await getAllTools();
  const byslug = new Map(all.map((t) => [t.slug, t]));
  const tools = slugs.map((s) => byslug.get(s)).filter((t) => t !== undefined);

  if (tools.length >= 2) {
    const curated = tools.length === 2 ? getComparison(`${tools[0]!.slug}-vs-${tools[1]!.slug}`) ?? getComparison(`${tools[1]!.slug}-vs-${tools[0]!.slug}`) : null;
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">{tools.map((t) => t.name).join(" vs ")}</h1>
        {curated && (
          <p className="rounded-xl border border-[var(--trust)]/25 bg-[var(--trust)]/5 px-4 py-3 text-sm">
            We have a full guide for this pair: <Link href={`/compare/${pairSlug(curated)}`} className="font-semibold text-[var(--trust-strong)] hover:underline">read who should choose which →</Link>
          </p>
        )}
        <CompareTable tools={tools} />
        <p className="text-xs text-[var(--muted)]">Pricing models only — confirm current prices on each official site.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">AI tool comparisons</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">Head-to-head guides written by our editors: who should pick which, and why. Want a different pair? Use “Compare side by side” on any tool page.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COMPARISONS.map((c) => {
          const a = byslug.get(c.a);
          const b = byslug.get(c.b);
          if (!a || !b) return null;
          return (
            <Link key={pairSlug(c)} href={`/compare/${pairSlug(c)}`} className="card-lift group rounded-2xl border border-[var(--line)] bg-white p-5 hover:border-[var(--trust)]/50">
              <p className="font-display font-semibold group-hover:text-[var(--trust-strong)]">{a.name} <span className="text-[var(--muted)]">vs</span> {b.name}</p>
              <p className="mt-1.5 line-clamp-2 text-sm text-[var(--muted)]">{c.intro}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
