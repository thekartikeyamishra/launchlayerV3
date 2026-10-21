// File: src/app/page.tsx
// Purpose: Home — server-rendered, crawlable directory front door. Task-first search,
// browse by job-to-be-done, editor picks, our ranking commitments, and the demand board.

import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import ToolCard from "@/components/ToolCard";
import HomeDemand from "@/components/HomeDemand";
import AppDownload from "@/components/AppDownload";
import PointerGlow from "@/components/PointerGlow";
import { getAllTools, TASKS, TOOL_CATEGORIES, toolsForTask } from "@/lib/directory";
import { SITE_URL } from "@/lib/site";
import { COMPARISONS, pairSlug } from "@/lib/comparisons-data";

export const revalidate = 3600;

const POPULAR = ["summarize-documents", "generate-images", "write-code", "transcribe-audio", "make-presentations", "take-meeting-notes", "text-to-speech", "create-videos"];
const PICKS = ["chatgpt", "claude", "perplexity", "notebooklm", "canva", "elevenlabs", "cursor", "gamma"];

const FAQ = [
  {
    q: "How does LaunchLayer rank AI tools?",
    a: "By relevance to the task you searched, then by real signals from signed-in people — saves and reviews that state what the tool was used for. Payment never changes organic ranking. Sponsored placements, if any, are labelled and kept separate.",
  },
  {
    q: "Is it free to list an AI tool?",
    a: "Yes. Listing is free, reviewed by a person, and makers can request corrections at no cost. We never charge to update your own listing.",
  },
  {
    q: "Do I need an account to browse?",
    a: "No. Every listing, task guide and the full demand board are readable without signing in. An account is only needed to save tools, write reviews or post requests.",
  },
  {
    q: "What if there's no AI tool for my task?",
    a: "Post it on the demand board. Others can vote if they need the same thing, and verified builders can respond with a solution.",
  },
  {
    q: "How current is the information?",
    a: "Each listing shows when an editor last reviewed it, and anyone can flag outdated details. Prices change often, so we list the pricing model and link to the official pricing page rather than quoting numbers that go stale.",
  },
];

export default async function HomePage() {
  const tools = await getAllTools();
  const picks = PICKS.map((s) => tools.find((t) => t.slug === s)).filter((t) => t !== undefined);
  const popular = POPULAR.map((s) => TASKS.find((t) => t.slug === s)).filter((t) => t !== undefined);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Editor picks: AI tools to start with",
    itemListElement: picks.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/tools/${t.slug}`, name: t.name })),
  };

  return (
    <div className="space-y-16 sm:space-y-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([faqLd, listLd]) }} />

      {/* Hero */}
      <section id="hero" className="hero-glow relative isolate -mx-4 overflow-hidden px-4 pb-4 pt-6 text-center sm:pt-14">
        <p className="anim-rise mx-auto inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-[var(--trust)]/25 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[var(--trust-strong)] backdrop-blur">
          <span>No pay-to-rank</span><span aria-hidden="true">·</span><span>No login walls</span><span aria-hidden="true">·</span><span>Free listings</span>
        </p>
        <h1 className="anim-rise anim-d-1 font-display mx-auto mt-6 max-w-3xl text-[2.35rem] font-bold leading-[1.08] tracking-tight sm:text-6xl">
          Find the right AI <span className="text-gradient">for the job.</span>
        </h1>
        <p className="anim-rise anim-d-2 mx-auto mt-5 max-w-xl text-base text-[var(--muted)] sm:text-lg">
          Describe the task in your own words. Get a short, honest list of tools that do it — with what they cost, what they&apos;re best at, and reviews from people who actually used them.
        </p>
        <div className="anim-rise anim-d-3 mx-auto mt-8 max-w-2xl">
          <SearchBox />
        </div>
        <nav aria-label="Popular tasks" className="anim-rise anim-d-4 mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
          {popular.map((t) => (
            <Link key={t.slug} href={`/tasks/${t.slug}`} className="press rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-sm text-[var(--ink)] hover:border-[var(--trust)] hover:text-[var(--trust-strong)]">
              {t.title}
            </Link>
          ))}
        </nav>
        <PointerGlow targetId="hero" />
        <p className="anim-rise anim-d-4 mt-6 text-sm text-[var(--muted)]">
          <strong className="tabular-nums text-[var(--ink)]">{tools.length}</strong> hand-reviewed tools ·{" "}
          <strong className="tabular-nums text-[var(--ink)]">{TASKS.length}</strong> task guides · updated continuously
        </p>
      </section>

      {/* Tasks */}
      <section aria-labelledby="tasks-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 id="tasks-heading" className="font-display text-2xl font-bold">Start from the job, not the tool</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Each guide explains what to look for and the mistakes to avoid — then shows the tools.</p>
          </div>
          <Link href="/tasks" className="hidden shrink-0 text-sm font-medium text-[var(--trust-strong)] hover:underline sm:block">All task guides →</Link>
        </div>
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {TASKS.slice(0, 12).map((t) => (
            <Link key={t.slug} href={`/tasks/${t.slug}`} className="card-lift group rounded-2xl border border-[var(--line)] bg-white p-4 hover:border-[var(--trust)]/50">
              <p className="font-display font-semibold group-hover:text-[var(--trust-strong)]">{t.title}</p>
              <p className="mt-1 text-xs text-[var(--muted)] tabular-nums">{toolsForTask(tools, t.slug).length} tools compared</p>
            </Link>
          ))}
        </div>
        <Link href="/tasks" className="mt-4 block text-sm font-medium text-[var(--trust-strong)] hover:underline sm:hidden">All task guides →</Link>
      </section>

      {/* Picks */}
      <section aria-labelledby="picks-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="picks-heading" className="font-display text-2xl font-bold">Good places to start</h2>
          <Link href="/tools" className="shrink-0 text-sm font-medium text-[var(--trust-strong)] hover:underline">Browse all tools →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {picks.map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      </section>

      {/* Comparisons */}
      <section aria-labelledby="vs-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="vs-heading" className="font-display text-2xl font-bold">Stuck between two?</h2>
          <Link href="/compare" className="shrink-0 text-sm font-medium text-[var(--trust-strong)] hover:underline">All comparisons →</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {COMPARISONS.slice(0, 8).map((c) => {
            const a = tools.find((t) => t.slug === c.a);
            const b = tools.find((t) => t.slug === c.b);
            return a && b ? (
              <Link key={pairSlug(c)} href={`/compare/${pairSlug(c)}`} className="press rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium hover:border-[var(--trust)] hover:text-[var(--trust-strong)]">
                {a.name} <span className="text-[var(--muted)]">vs</span> {b.name}
              </Link>
            ) : null;
          })}
        </div>
      </section>

      {/* Commitments */}
      <section aria-labelledby="why-heading" className="rounded-3xl bg-[var(--ink)] p-6 text-white sm:p-10">
        <h2 id="why-heading" className="font-display text-2xl font-bold sm:text-3xl">A directory you can actually trust</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/70">The four things people most often complain about in AI directories — and what we do instead.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Ranking you can't buy", d: "Organic order comes from relevance and real use. Ads are labelled “Advertisement” and never mixed into results." },
            { t: "No login walls", d: "Every listing, guide and request is readable without an account. Sign in only to save or review." },
            { t: "Free listings & fixes", d: "Makers list for free and correct their details for free. No paid “update” fees." },
            { t: "Freshness you can see", d: "Every listing shows its last review date. Dead or changed tools get flagged and fixed." },
          ].map((c) => (
            <div key={c.t}>
              <h3 className="font-display font-semibold text-[#7ee0c6]">{c.t}</h3>
              <p className="mt-1.5 text-sm text-white/75">{c.d}</p>
            </div>
          ))}
        </div>
        <Link href="/editorial-policy" className="mt-8 inline-block text-sm font-semibold text-white underline-offset-4 hover:underline">Read our editorial &amp; ranking policy →</Link>
      </section>

      <HomeDemand />

      {/* Categories */}
      <section aria-labelledby="cat-heading">
        <h2 id="cat-heading" className="font-display mb-5 text-2xl font-bold">Browse by category</h2>
        <div className="flex flex-wrap gap-2">
          {TOOL_CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/categories/${c.slug}`} className="press rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium hover:border-[var(--trust)] hover:text-[var(--trust-strong)]">
              {c.name} <span className="tabular-nums text-[var(--muted)]">{tools.filter((t) => t.category === c.slug).length}</span>
            </Link>
          ))}
        </div>
      </section>

      <AppDownload />

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="mx-auto max-w-3xl">
        <h2 id="faq-heading" className="font-display mb-5 text-2xl font-bold">Questions people ask</h2>
        <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-white">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <span aria-hidden="true" className="text-[var(--muted)] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-[var(--muted)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
