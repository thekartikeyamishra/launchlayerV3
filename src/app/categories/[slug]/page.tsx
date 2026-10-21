// File: src/app/categories/[slug]/page.tsx
// Purpose: Category landing pages with clean, canonical URLs (replaces ?category= params).

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToolCard from "@/components/ToolCard";
import { getAllTools, getCategory, TASKS, TOOL_CATEGORIES } from "@/lib/directory";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = false;

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TOOL_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCategory(slug);
  if (!c) return { title: "Category not found", robots: { index: false } };
  return {
    title: `${c.name} AI tools`,
    description: `${c.blurb} Compare hand-reviewed ${c.name.toLowerCase()} AI tools by pricing model, API access and real-use reviews.`,
    alternates: { canonical: `/categories/${c.slug}` },
    openGraph: { url: `${SITE_URL}/categories/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const c = getCategory(slug);
  if (!c) notFound();
  const tools = (await getAllTools()).filter((t) => t.category === c.slug).sort((a, b) => a.name.localeCompare(b.name));
  const taskSlugs = new Set(tools.flatMap((t) => t.tasks));
  const tasks = TASKS.filter((t) => taskSlugs.has(t.slug));

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-xs text-[var(--muted)]">
        <Link href="/tools" className="hover:text-[var(--ink)]">AI tools</Link> <span aria-hidden="true">/</span> <span className="text-[var(--ink)]">{c.name}</span>
      </nav>
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">{c.name} AI tools</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">{c.blurb} <span className="tabular-nums">{tools.length}</span> tools, each reviewed by an editor.</p>
      </header>
      {tasks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-sm text-[var(--muted)]">Guides:</span>
          {tasks.map((t) => <Link key={t.slug} href={`/tasks/${t.slug}`} className="press rounded-full border border-[var(--line)] bg-white px-3 py-1 text-sm hover:border-[var(--trust)] hover:text-[var(--trust-strong)]">{t.title}</Link>)}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tools.map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
      <nav aria-label="Other categories" className="border-t border-[var(--line)] pt-6">
        <p className="mb-3 text-sm font-semibold">Other categories</p>
        <div className="flex flex-wrap gap-2">
          {TOOL_CATEGORIES.filter((x) => x.slug !== c.slug).map((x) => (
            <Link key={x.slug} href={`/categories/${x.slug}`} className="text-sm text-[var(--muted)] hover:text-[var(--trust-strong)]">{x.name}</Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
