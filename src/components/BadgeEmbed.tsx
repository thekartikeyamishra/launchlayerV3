// File: src/components/BadgeEmbed.tsx
// Purpose: Copy-paste "Listed on LaunchLayer" badge for makers (backlinks + referral traffic).

"use client";

import { useState } from "react";

export default function BadgeEmbed({ slug, name, siteUrl }: { slug: string; name: string; siteUrl: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [copied, setCopied] = useState(false);
  const src = `${siteUrl}/badge/${slug}${theme === "dark" ? "?theme=dark" : ""}`;
  const code = `<a href="${siteUrl}/tools/${slug}" target="_blank" rel="noopener"><img src="${src}" alt="${name.replace(/"/g, "&quot;")} — listed on LaunchLayer" width="220" height="54" /></a>`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <details className="group rounded-2xl border border-[var(--line)] bg-white p-5 text-sm">
      <summary className="cursor-pointer list-none font-semibold">
        Is this your product? Add a badge <span aria-hidden="true" className="text-[var(--muted)] group-open:hidden">+</span>
      </summary>
      <p className="mt-2 text-[var(--muted)]">Show visitors you&apos;re listed and reviewed. Corrections to your listing are always free.</p>
      <div className={`mt-3 flex items-center justify-center rounded-xl p-4 ${theme === "dark" ? "bg-[var(--ink)]" : "bg-[var(--bg)]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/badge/${slug}${theme === "dark" ? "?theme=dark" : ""}`} alt={`${name} — listed on LaunchLayer`} width={220} height={54} />
      </div>
      <div className="mt-3 flex gap-2" role="group" aria-label="Badge theme">
        {(["light", "dark"] as const).map((t) => (
          <button key={t} onClick={() => setTheme(t)} aria-pressed={theme === t} className={`press rounded-full border px-3 py-1 text-xs font-medium ${theme === t ? "border-[var(--trust)] bg-[var(--trust)]/10 text-[var(--trust-strong)]" : "border-[var(--line)] text-[var(--muted)]"}`}>
            {t === "light" ? "Light" : "Dark"}
          </button>
        ))}
      </div>
      <label htmlFor={`badge-${slug}`} className="sr-only">Badge HTML</label>
      <textarea id={`badge-${slug}`} readOnly value={code} rows={3} className="mt-3 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] p-2 font-mono text-[11px]" onFocus={(e) => e.currentTarget.select()} />
      <button onClick={() => void copy()} className="press mt-2 rounded-lg bg-[var(--trust)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--trust-strong)]">
        {copied ? "Copied" : "Copy HTML"}
      </button>
    </details>
  );
}
