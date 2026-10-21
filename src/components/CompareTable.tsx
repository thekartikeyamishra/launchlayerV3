// File: src/components/CompareTable.tsx
// Purpose: Side-by-side attribute table shared by /compare and /compare/[pair]. Server component.

import Link from "next/link";
import ToolLogo from "./ToolLogo";
import { formatReviewed } from "./ToolCard";
import { getCategory, getTask } from "@/lib/directory";
import { PRICING_LABELS, type Tool } from "@/lib/directory-types";

export default function CompareTable({ tools }: { tools: Tool[] }) {
  const rows: Array<[string, (t: Tool) => React.ReactNode]> = [
    ["Best for", (t) => t.bestFor || "—"],
    ["Pricing model", (t) => PRICING_LABELS[t.pricing]],
    ["API", (t) => (t.api ? "Yes" : "No")],
    ["Open weights / source", (t) => (t.openSource ? "Yes" : "No")],
    ["Platforms", (t) => t.platforms.join(", ")],
    ["Category", (t) => getCategory(t.category)?.name ?? "—"],
    ["Strengths", (t) => <ul className="space-y-1">{t.pros.map((p) => <li key={p}>+ {p}</li>)}</ul>],
    ["Limits", (t) => <ul className="space-y-1">{t.cons.map((p) => <li key={p}>− {p}</li>)}</ul>],
    ["Tasks", (t) => t.tasks.map((x) => getTask(x)?.title).filter(Boolean).join(", ")],
    ["Listing reviewed", (t) => formatReviewed(t.reviewedAt)],
  ];
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--line)]">
            <th scope="col" className="w-40 p-4"><span className="sr-only">Attribute</span></th>
            {tools.map((t) => (
              <th key={t.slug} scope="col" className="p-4 align-top">
                <div className="flex items-center gap-2.5">
                  <ToolLogo name={t.name} size={36} />
                  <Link href={`/tools/${t.slug}`} className="font-display font-semibold text-[var(--trust-strong)] hover:underline">{t.name}</Link>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {rows.map(([label, cell]) => (
            <tr key={label}>
              <th scope="row" className="p-4 align-top font-medium text-[var(--muted)]">{label}</th>
              {tools.map((t) => <td key={t.slug} className="p-4 align-top">{cell(t)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
