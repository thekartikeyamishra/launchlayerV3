// File: src/app/compare/[pair]/page.tsx
// Purpose: Editor-written "X vs Y" guide — targets high-intent searches like "chatgpt vs claude".

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CompareTable from "@/components/CompareTable";
import AdSlot from "@/components/AdSlot";
import { getAllTools } from "@/lib/directory";
import { COMPARISONS, getComparison, pairSlug } from "@/lib/comparisons-data";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = false;

interface Props {
  params: Promise<{ pair: string }>;
}

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ pair: pairSlug(c) }));
}

async function load(pair: string) {
  const c = getComparison(pair);
  if (!c) return null;
  const all = await getAllTools();
  const a = all.find((t) => t.slug === c.a);
  const b = all.find((t) => t.slug === c.b);
  const names = new Map(all.map((t) => [t.slug, t.name]));
  return a && b ? { c, a, b, names } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load((await params).pair);
  if (!data) return { title: "Comparison not found", robots: { index: false } };
  const { c, a, b } = data;
  const title = `${a.name} vs ${b.name}: which should you use? (${new Date().getFullYear()})`;
  const description = `${c.intro} Who should choose ${a.name}, who should choose ${b.name}, and a side-by-side comparison.`.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/compare/${pairSlug(c)}` },
    openGraph: { title, description, url: `${SITE_URL}/compare/${pairSlug(c)}`, type: "article" },
  };
}

export default async function PairPage({ params }: Props) {
  const data = await load((await params).pair);
  if (!data) notFound();
  const { c, a, b, names } = data;
  const url = `${SITE_URL}/compare/${pairSlug(c)}`;
  const others = COMPARISONS.filter((x) => x !== c && (x.a === c.a || x.b === c.a || x.a === c.b || x.b === c.b)).slice(0, 4);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${a.name} vs ${b.name}`,
      description: c.intro,
      url,
      author: { "@type": "Organization", name: "LaunchLayer", url: SITE_URL },
      publisher: { "@type": "Organization", name: "LaunchLayer", url: SITE_URL },
      about: [
        { "@type": "SoftwareApplication", name: a.name, url: a.url },
        { "@type": "SoftwareApplication", name: b.name, url: b.url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: `When should I choose ${a.name}?`, acceptedAnswer: { "@type": "Answer", text: c.chooseA.join(". ") + "." } },
        { "@type": "Question", name: `When should I choose ${b.name}?`, acceptedAnswer: { "@type": "Answer", text: c.chooseB.join(". ") + "." } },
        { "@type": "Question", name: `${a.name} or ${b.name}: which is better?`, acceptedAnswer: { "@type": "Answer", text: c.verdict } },
      ],
    },
  ];

  const Choose = ({ name, slug, items, tone }: { name: string; slug: string; items: string[]; tone: "trust" | "demand" }) => (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
      <h2 className={`font-display text-lg font-bold ${tone === "trust" ? "text-[var(--trust-strong)]" : "text-[var(--demand)]"}`}>Choose {name} if…</h2>
      <ul className="mt-3 space-y-2 text-sm">{items.map((x) => <li key={x} className="flex gap-2"><span aria-hidden="true">→</span>{x}</li>)}</ul>
      <Link href={`/tools/${slug}`} className="mt-4 inline-block text-sm font-semibold text-[var(--trust-strong)] hover:underline">Full {name} listing & reviews →</Link>
    </section>
  );

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="text-xs text-[var(--muted)]">
        <Link href="/compare" className="hover:text-[var(--ink)]">Comparisons</Link> <span aria-hidden="true">/</span> <span className="text-[var(--ink)]">{a.name} vs {b.name}</span>
      </nav>
      <header className="max-w-3xl">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{a.name} vs {b.name}</h1>
        <p className="mt-4 text-[15px] leading-relaxed">{c.intro}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Choose name={a.name} slug={a.slug} items={c.chooseA} tone="trust" />
        <Choose name={b.name} slug={b.slug} items={c.chooseB} tone="demand" />
      </div>
      <section className="rounded-2xl bg-[var(--ink)] p-6 text-white">
        <h2 className="font-display text-lg font-bold text-[#7ee0c6]">Bottom line</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-white/90">{c.verdict}</p>
      </section>
      <section aria-labelledby="side">
        <h2 id="side" className="font-display mb-4 text-xl font-bold">Side by side</h2>
        <CompareTable tools={[a, b]} />
        <p className="mt-2 text-xs text-[var(--muted)]">Pricing models only — confirm current prices on each official site. Written by LaunchLayer editors; no payment from either company.</p>
      </section>
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TASK} />
      {others.length > 0 && (
        <section aria-labelledby="more">
          <h2 id="more" className="font-display mb-3 text-lg font-bold">Related comparisons</h2>
          <div className="flex flex-wrap gap-2">
            {others.map((x) => (
              <Link key={pairSlug(x)} href={`/compare/${pairSlug(x)}`} className="press rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-sm hover:border-[var(--trust)] hover:text-[var(--trust-strong)]">
                {names.get(x.a) ?? x.a} vs {names.get(x.b) ?? x.b}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
