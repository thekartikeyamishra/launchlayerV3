// File: src/components/Footer.tsx
// Purpose: Global footer with legal links and the platform's trust commitment.

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col justify-between gap-6 sm:flex-row">
          <div className="max-w-sm">
            <p className="font-display text-base font-bold text-[var(--ink)]">LaunchLayer</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              The trust layer for the AI economy. Every number on this platform is real —
              we never fake demand, activity, or reviews.
            </p>
          </div>
          <nav aria-label="Explore" className="flex flex-col gap-2 text-sm">
            <Link href="/demand" className="text-[var(--muted)] hover:text-[var(--ink)]">Demand Board</Link>
            <Link href="/opportunities" className="text-[var(--muted)] hover:text-[var(--ink)]">Creator Opportunities</Link>
            <Link href="/pulse" className="text-[var(--muted)] hover:text-[var(--ink)]">Marketplace Pulse</Link>
          </nav>
          <nav aria-label="Legal" className="flex flex-col gap-2 text-sm">
            <Link href="/legal/terms" className="text-[var(--muted)] hover:text-[var(--ink)]">Terms of Service</Link>
            <Link href="/legal/privacy" className="text-[var(--muted)] hover:text-[var(--ink)]">Privacy Policy</Link>
            <Link href="/legal/acceptable-use" className="text-[var(--muted)] hover:text-[var(--ink)]">Acceptable Use Policy</Link>
          </nav>
        </div>
        <p className="mt-8 text-xs text-[var(--muted)]">
          © {new Date().getFullYear()} LaunchLayer. Built in India, for the world.
        </p>
      </div>
    </footer>
  );
}
