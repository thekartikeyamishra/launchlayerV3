// File: src/components/LegalPage.tsx
// Purpose: Shared layout for policy/legal/trust pages (one H1, readable measure, updated date).

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="prose-ll mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      <p className="!mt-2 text-sm !text-[var(--muted)]">Last updated: {updated}</p>
      {children}
    </article>
  );
}
