// File: src/app/tools/[slug]/page.tsx
// Purpose: Tool page — the core content unit. Server-rendered editorial content (what it is,
// best for, strengths, limits, facts), alternatives, real-use reviews and a correction path.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToolLogo from "@/components/ToolLogo";
import ToolCard, { formatReviewed } from "@/components/ToolCard";
import ToolActions from "@/components/ToolActions";
import ToolReviews from "@/components/ToolReviews";
import ReportButton from "@/components/ReportButton";
import AdSlot from "@/components/AdSlot";
import BadgeEmbed from "@/components/BadgeEmbed";
import { comparisonsFor, pairSlug } from "@/lib/comparisons-data";
import { alternativesFor, getAllTools, getCategory, getTask, hostOf } from "@/lib/directory";
import { EDITORIAL_TOOLS } from "@/lib/tools-data";
import { PRICING_LABELS } from "@/lib/directory-types";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return EDITORIAL_TOOLS.map((t) => ({ slug: t.slug }));
}

async function load(slug: string) {
  const all = await getAllTools();
  const tool = all.find((t) => t.slug === slug) ?? null;
  return { all, tool };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { tool } = await load(slug);
  if (!tool) return { title: "Tool not found", robots: { index: false } };
  const title = `${tool.name}: ${tool.tagline.replace(/\.$/, "")}`;
  const description = `${tool.name} by ${tool.maker || "an independent maker"} — ${PRICING_LABELS[tool.pricing].toLowerCase()}. What it's best for, strengths, limits, alternatives and real-use reviews.`.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: { title, description, url: `${SITE_URL}/tools/${tool.slug}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const { all, tool } = await load(slug);
  if (!tool) notFound();

  const category = getCategory(tool.category);
  const alternatives = alternativesFor(all, tool);
  const tasks = tool.tasks.map(getTask).filter((t) => t !== null);
  const url = `${SITE_URL}/tools/${tool.slug}`;
  const names = new Map(all.map((t) => [t.slug, t.name]));
  const pairs = comparisonsFor(tool.slug);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.name,
      description: tool.description,
      url: tool.url,
      applicationCategory: "BusinessApplication",
      operatingSystem: tool.platforms.join(", "),
      ...(tool.maker ? { author: { "@type": "Organization", name: tool.maker } } : {}),
      ...(tool.pricing === "free" ? { offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } } : {}),
      mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "AI tools", item: `${SITE_URL}/tools` },
        ...(category ? [{ "@type": "ListItem", position: 2, name: category.name, item: `${SITE_URL}/categories/${category.slug}` }] : []),
        { "@type": "ListItem", position: category ? 3 : 2, name: tool.name, item: url },
      ],
    },
  ];

  const facts: Array<[string, React.ReactNode]> = [
    ["Pricing model", PRICING_LABELS[tool.pricing]],
    ["API", tool.api ? "Available" : "Not offered"],
    ["Open weights / source", tool.openSource ? "Yes" : "No"],
    ["Platforms", tool.platforms.join(", ")],
    ["Category", category ? <Link key="c" href={`/categories/${category.slug}`} className="text-[var(--trust-strong)] hover:underline">{category.name}</Link> : "—"],
    ["Official site", <a key="u" href={tool.url} target="_blank" rel="noopener" className="text-[var(--trust-strong)] hover:underline">{hostOf(tool.url)}</a>],
    ["Listing reviewed", formatReviewed(tool.reviewedAt)],
  ];

  return (
    <div className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="text-xs text-[var(--muted)]">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/tools" className="hover:text-[var(--ink)]">AI tools</Link></li>
          {category && (<><li aria-hidden="true">/</li><li><Link href={`/categories/${category.slug}`} className="hover:text-[var(--ink)]">{category.name}</Link></li></>)}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-[var(--ink)]">{tool.name}</li>
        </ol>
      </nav>

      <header className="anim-rise flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <ToolLogo name={tool.name} size={64} />
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{tool.name}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">by {tool.maker || "an independent maker"}{tool.source === "community" ? " · Community listing" : ""}</p>
            <p className="mt-3 max-w-xl text-base">{tool.tagline}</p>
          </div>
        </div>
        <div className="shrink-0"><ToolActions slug={tool.slug} name={tool.name} url={tool.url} /></div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <article className="space-y-8">
          <section aria-labelledby="about">
            <h2 id="about" className="font-display text-lg font-bold">What it does</h2>
            <p className="mt-2 text-[15px] leading-relaxed">{tool.description}</p>
            {tool.bestFor && (
              <p className="mt-4 rounded-xl border border-[var(--trust)]/25 bg-[var(--trust)]/5 px-4 py-3 text-sm">
                <strong className="text-[var(--trust-strong)]">Best for:</strong> {tool.bestFor}
              </p>
            )}
          </section>

          {(tool.pros.length > 0 || tool.cons.length > 0) && (
            <section aria-labelledby="procon" className="grid gap-4 sm:grid-cols-2">
              <h2 id="procon" className="sr-only">Strengths and limits</h2>
              <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
                <h3 className="font-display font-semibold text-[var(--trust-strong)]">Strengths</h3>
                <ul className="mt-2 space-y-1.5 text-sm">{tool.pros.map((p) => <li key={p} className="flex gap-2"><span aria-hidden="true" className="text-[var(--trust)]">+</span>{p}</li>)}</ul>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
                <h3 className="font-display font-semibold text-[var(--demand)]">Limits to know</h3>
                <ul className="mt-2 space-y-1.5 text-sm">{tool.cons.map((c) => <li key={c} className="flex gap-2"><span aria-hidden="true" className="text-[var(--demand)]">−</span>{c}</li>)}</ul>
              </div>
            </section>
          )}

          {tasks.length > 0 && (
            <section aria-labelledby="tasks">
              <h2 id="tasks" className="font-display text-lg font-bold">Use it for</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {tasks.map((t) => (
                  <Link key={t.slug} href={`/tasks/${t.slug}`} className="press rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm hover:border-[var(--trust)] hover:text-[var(--trust-strong)]">{t.title}</Link>
                ))}
              </div>
            </section>
          )}

          <ToolReviews slug={tool.slug} name={tool.name} />
        </article>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <h2 className="font-display font-semibold">Key facts</h2>
            <dl className="mt-3 divide-y divide-[var(--line)] text-sm">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2">
                  <dt className="text-[var(--muted)]">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-[var(--muted)]">
              Prices change often, so we list the pricing model, not numbers. Confirm current plans on the official site.
            </p>
            <div className="mt-3">
              <ReportButton
                targetType="tool"
                targetPath={`tools/${tool.slug}`}
                targetLabel={tool.name}
                label="Something outdated? Suggest a correction"
                prompt="What's changed? (pricing, features, link, or anything else)"
              />
            </div>
          </div>
          {pairs.length > 0 && (
            <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
              <h2 className="font-display font-semibold">Head-to-head guides</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {pairs.map((c) => (
                  <li key={pairSlug(c)}>
                    <Link href={`/compare/${pairSlug(c)}`} className="text-[var(--trust-strong)] hover:underline">
                      {names.get(c.a) ?? c.a} vs {names.get(c.b) ?? c.b}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <BadgeEmbed slug={tool.slug} name={tool.name} siteUrl={SITE_URL} />
        </aside>
      </div>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL} />

      {alternatives.length > 0 && (
        <section aria-labelledby="alts">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 id="alts" className="font-display text-xl font-bold">{tool.name} alternatives</h2>
            <Link href={`/compare?tools=${[tool.slug, ...alternatives.slice(0, 2).map((a) => a.slug)].join(",")}`} className="text-sm font-medium text-[var(--trust-strong)] hover:underline">
              Compare side by side →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((t) => <ToolCard key={t.slug} tool={t} />)}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-dashed border-[var(--demand)]/40 bg-white p-6 text-center">
        <p className="font-display font-semibold">Need something {tool.name} can&apos;t do?</p>
        <p className="mt-1 text-sm text-[var(--muted)]">Describe it on the demand board — builders reply with solutions.</p>
        <Link href="/demand/new" className="press mt-4 inline-block rounded-xl bg-[var(--demand)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">Post a request</Link>
      </section>
    </div>
  );
}
