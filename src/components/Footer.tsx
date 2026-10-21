// File: src/components/Footer.tsx
// Purpose: Global footer — sitewide internal links (crawl paths), trust pages, legal, app install.

"use client";

import Link from "next/link";
import { clearConsent } from "./ConsentBanner";
import AppDownload from "./AppDownload";
import { LEGAL_ENTITY } from "@/lib/site";

const COLS: Array<{ title: string; links: Array<[string, string]> }> = [
  { title: "Explore", links: [["/tools", "All AI tools"], ["/tasks", "Tools by task"], ["/compare", "Comparisons"], ["/demand", "Demand board"], ["/pulse", "AI demand pulse"]] },
  { title: "For makers", links: [["/submit", "Submit a tool (free)"], ["/opportunities", "Builder opportunities"], ["/developers", "API & AI integrations"], ["/editorial-policy", "Ranking policy"]] },
  { title: "Company", links: [["/about", "About"], ["/contact", "Contact"], ["/editorial-policy#ads", "Advertising policy"]] },
  { title: "Legal", links: [["/legal/terms", "Terms of Service"], ["/legal/privacy", "Privacy Policy"], ["/legal/refund", "Refund & cancellation"], ["/legal/acceptable-use", "Acceptable use"]] },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--line)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-sm">
            <p className="font-display text-lg font-bold text-[var(--ink)]">LaunchLayer</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              An honest AI tools directory. Ranking can&apos;t be bought, listings are free, and every number is real.
            </p>
            <div className="mt-5"><AppDownload compact /></div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLS.map((c) => (
              <nav key={c.title} aria-label={c.title} className="flex flex-col gap-2 text-sm">
                <p className="font-semibold text-[var(--ink)]">{c.title}</p>
                {c.links.map(([href, label]) => (
                  <Link key={href} href={href} className="text-[var(--muted)] hover:text-[var(--ink)]">{label}</Link>
                ))}
                {c.title === "Legal" && (
                  <button onClick={clearConsent} className="text-left text-[var(--muted)] hover:text-[var(--ink)]">Cookie preferences</button>
                )}
              </nav>
            ))}
          </div>
        </div>
        {/*
          Future payments (disabled until needed):
          - India: Razorpay checkout (see README → "Payments").
          - International: PayPal payment link via Squarespace. To enable, set the URL and uncomment:
          <a href={process.env.NEXT_PUBLIC_PAYPAL_LINK} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">Pay with PayPal</a>
        */}
        <p className="mt-10 border-t border-[var(--line)] pt-6 text-xs text-[var(--muted)]">
          © {new Date().getFullYear()} LaunchLayer™ — operated by {LEGAL_ENTITY}. All rights reserved. Built in India, for the world.
          Third-party product names are trademarks of their respective owners.
        </p>
      </div>
    </footer>
  );
}
