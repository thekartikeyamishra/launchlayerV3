// File: src/app/submit/page.tsx
import type { Metadata } from "next";
import SubmitToolForm from "@/components/SubmitToolForm";

export const metadata: Metadata = {
  title: "Submit an AI tool — free listing",
  description: "List your AI tool on LaunchLayer for free. Every submission is reviewed by a person; corrections are always free.",
  alternates: { canonical: "/submit" },
};

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Submit an AI tool</h1>
        <p className="mt-2 text-[var(--muted)]">
          Listing is free and always will be. A person reviews each submission — usually within a few days — against our
          editorial policy. There is no paid fast-track and no fee to update your listing later.
        </p>
      </header>
      <ul className="grid gap-3 text-sm sm:grid-cols-3">
        {[
          ["Free forever", "No submission fee, no update fee."],
          ["Human review", "We check the site works and the description is accurate."],
          ["Fair ranking", "Payment never changes organic order."],
        ].map(([t, d]) => (
          <li key={t} className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="font-semibold">{t}</p><p className="mt-1 text-[var(--muted)]">{d}</p></li>
        ))}
      </ul>
      <SubmitToolForm />
    </div>
  );
}
