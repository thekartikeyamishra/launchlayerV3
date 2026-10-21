// File: src/components/ToolCard.tsx
// Purpose: Directory card. Server-renderable (no client JS) for fast, crawlable lists.
// Every card shows the pricing *model*, capabilities, and when the listing was last reviewed.

import Link from "next/link";
import type { Tool } from "@/lib/directory-types";
import { PRICING_LABELS } from "@/lib/directory-types";
import ToolLogo from "./ToolLogo";

export function formatReviewed(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
}

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <article className="card-lift group relative flex h-full flex-col rounded-2xl border border-[var(--line)] bg-white p-4 hover:border-[var(--trust)]/50">
      <div className="flex items-start gap-3">
        <ToolLogo name={tool.name} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold leading-tight text-[var(--ink)]">
            <Link
              href={`/tools/${tool.slug}`}
              className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none group-focus-within:text-[var(--trust-strong)]"
            >
              {tool.name}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{tool.maker || "Independent"}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 flex-1 text-sm text-[var(--muted)]">{tool.tagline}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[var(--ink)]">{PRICING_LABELS[tool.pricing]}</span>
        {tool.api && <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[var(--muted)]">API</span>}
        {tool.openSource && <span className="rounded-full border border-[var(--trust)]/30 bg-[var(--trust)]/5 px-2 py-0.5 text-[var(--trust-strong)]">Open weights/source</span>}
        <span className="ml-auto text-[var(--muted)]" title="When an editor last reviewed this listing">
          {tool.source === "community" ? "Community · " : ""}Reviewed {formatReviewed(tool.reviewedAt)}
        </span>
      </div>
    </article>
  );
}
