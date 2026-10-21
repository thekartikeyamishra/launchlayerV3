// File: src/app/tasks/page.tsx
// Purpose: Index of task guides — browse AI by the job you need done.

import type { Metadata } from "next";
import Link from "next/link";
import { getAllTools, TASKS, toolsForTask } from "@/lib/directory";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "AI tools by task — guides for every job",
  description: "Pick the job you need done and get a short guide: what to look for, mistakes to avoid, and the AI tools that do it well.",
  alternates: { canonical: "/tasks" },
};

export default async function TasksPage() {
  const tools = await getAllTools();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">What do you need AI to do?</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">Every guide starts with how to choose — then lists the tools, so you pick on facts rather than hype.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TASKS.map((t) => (
          <Link key={t.slug} href={`/tasks/${t.slug}`} className="card-lift group rounded-2xl border border-[var(--line)] bg-white p-5 hover:border-[var(--trust)]/50">
            <h2 className="font-display text-base font-semibold group-hover:text-[var(--trust-strong)]">{t.title}</h2>
            <p className="mt-1.5 line-clamp-2 text-sm text-[var(--muted)]">{t.intro}</p>
            <p className="mt-3 text-xs font-medium text-[var(--trust-strong)] tabular-nums">{toolsForTask(tools, t.slug).length} tools →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
