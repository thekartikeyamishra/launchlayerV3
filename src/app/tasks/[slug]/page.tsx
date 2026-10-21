// File: src/app/tasks/[slug]/page.tsx
// Purpose: Task guide — original guidance (how to choose, pitfalls) + matching tools.
// These are the pages people search for ("AI for summarising PDFs"); the guidance is what
// makes them genuinely useful rather than a thin list.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToolCard from "@/components/ToolCard";
import AdSlot from "@/components/AdSlot";
import { getAllTools, getTask, TASKS, toolsForTask } from "@/lib/directory";
import { PRICING_LABELS } from "@/lib/directory-types";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = false;

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TASKS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const task = getTask(slug);
  if (!task) return { title: "Task not found", robots: { index: false } };
  const year = new Date().getFullYear();
  const title = `Best ${task.query} (${year}) — how to choose`;
  const description = task.intro.slice(0, 155).replace(/\s\S*$/, "") + "…";
  return {
    title,
    description,
    alternates: { canonical: `/tasks/${task.slug}` },
    openGraph: { title, description, url: `${SITE_URL}/tasks/${task.slug}`, type: "article" },
  };
}

export default async function TaskPage({ params }: Props) {
  const { slug } = await params;
  const task = getTask(slug);
  if (!task) notFound();
  const tools = toolsForTask(await getAllTools(), task.slug);
  const free = tools.filter((t) => t.pricing === "free" || t.pricing === "freemium");
  const related = task.related.map(getTask).filter((t) => t !== null);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `AI tools to ${task.title.toLowerCase()}`,
      numberOfItems: tools.length,
      itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/tools/${t.slug}`, name: t.name })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Tasks", item: `${SITE_URL}/tasks` },
        { "@type": "ListItem", position: 2, name: task.title, item: `${SITE_URL}/tasks/${task.slug}` },
      ],
    },
  ];

  return (
    <div className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="text-xs text-[var(--muted)]">
        <Link href="/tasks" className="hover:text-[var(--ink)]">Tasks</Link> <span aria-hidden="true">/</span> <span className="text-[var(--ink)]">{task.title}</span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">AI tools to {task.title.toLowerCase()}</h1>
        <p className="mt-4 text-[15px] leading-relaxed">{task.intro}</p>
        <p className="mt-3 text-sm text-[var(--muted)] tabular-nums">
          {tools.length} tools compared · {free.length} with a free option
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-display font-semibold text-[var(--trust-strong)]">What to look for</h2>
          <ul className="mt-2 space-y-2 text-sm">{task.lookFor.map((x) => <li key={x} className="flex gap-2"><span aria-hidden="true" className="text-[var(--trust)]">✓</span>{x}</li>)}</ul>
        </section>
        <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-display font-semibold text-[var(--demand)]">Mistakes to avoid</h2>
          <ul className="mt-2 space-y-2 text-sm">{task.pitfalls.map((x) => <li key={x} className="flex gap-2"><span aria-hidden="true" className="text-[var(--demand)]">!</span>{x}</li>)}</ul>
        </section>
      </div>

      <section aria-labelledby="tools">
        <h2 id="tools" className="font-display mb-4 text-xl font-bold">The tools</h2>
        {tools.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tools.map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
        ) : (
          <p className="text-sm text-[var(--muted)]">No tools listed yet. <Link href="/submit" className="text-[var(--trust-strong)] hover:underline">Suggest one</Link>.</p>
        )}
      </section>

      {tools.length > 1 && (
        <section aria-labelledby="quick" className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
          <h2 id="quick" className="font-display px-5 pt-5 text-lg font-bold">At a glance</h2>
          <table className="mt-3 w-full min-w-[560px] text-left text-sm">
            <thead className="border-y border-[var(--line)] bg-[var(--bg)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr><th scope="col" className="px-5 py-2.5">Tool</th><th scope="col" className="px-3 py-2.5">Best for</th><th scope="col" className="px-3 py-2.5">Pricing</th><th scope="col" className="px-3 py-2.5">API</th></tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {tools.map((t) => (
                <tr key={t.slug}>
                  <th scope="row" className="px-5 py-2.5 font-medium"><Link href={`/tools/${t.slug}`} className="text-[var(--trust-strong)] hover:underline">{t.name}</Link></th>
                  <td className="px-3 py-2.5 text-[var(--muted)]">{t.bestFor}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{PRICING_LABELS[t.pricing]}</td>
                  <td className="px-3 py-2.5">{t.api ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TASK} />

      {related.length > 0 && (
        <section aria-labelledby="related">
          <h2 id="related" className="font-display mb-3 text-lg font-bold">Related guides</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((t) => <Link key={t.slug} href={`/tasks/${t.slug}`} className="press rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-sm hover:border-[var(--trust)] hover:text-[var(--trust-strong)]">{t.title}</Link>)}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-dashed border-[var(--demand)]/40 bg-white p-6 text-center">
        <p className="font-display font-semibold">None of these fit your exact need?</p>
        <p className="mt-1 text-sm text-[var(--muted)]">Post it on the demand board. Others vote; builders respond.</p>
        <Link href={`/demand/new?title=${encodeURIComponent(`AI to ${task.title.toLowerCase()} that…`)}`} className="press mt-4 inline-block rounded-xl bg-[var(--demand)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">Post a request</Link>
      </section>
    </div>
  );
}
