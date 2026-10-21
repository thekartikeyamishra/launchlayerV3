// File: src/app/contact/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Contact LaunchLayer for listing corrections, partnerships, privacy requests or support.",
  alternates: { canonical: "/contact" },
};

const GRIEVANCE = process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER || "Kartikeya Mishra";

export default function ContactPage() {
  const mail = (subject: string) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
  return (
    <LegalPage title="Contact us" updated="October 2026">
      <p>We read every message. Typical reply time is 2–3 working days (India time, IST).</p>
      <div className="not-prose mt-6 grid gap-3 sm:grid-cols-2">
        {[
          ["Listing corrections", "Wrong price model, dead link, changed features.", "Listing correction"],
          ["Makers & partnerships", "Claiming a listing, sponsorships, API access.", "Partnership"],
          ["Privacy & data requests", "Access, correction or deletion of your data.", "Privacy request"],
          ["Support", "Account, sign-in or anything else.", "Support"],
        ].map(([t, d, s = "Support"]) => (
          <a key={t} href={mail(s)} className="card-lift block rounded-2xl border border-[var(--line)] bg-white p-4 !no-underline hover:border-[var(--trust)]/50">
            <span className="block font-semibold !text-[var(--ink)]">{t}</span>
            <span className="mt-1 block text-sm !text-[var(--muted)]">{d}</span>
          </a>
        ))}
      </div>
      <h2>Email</h2>
      <p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
      <h2>Grievance Officer</h2>
      <p>
        In accordance with the Information Technology Act, 2000, the rules made under it, and the Digital Personal Data
        Protection Act, 2023: {GRIEVANCE}, reachable at <a href={mail("Grievance")}>{CONTACT_EMAIL}</a>. We acknowledge
        grievances within 24 hours and aim to resolve them within 15 days.
      </p>
      <p>Signed-in users can also report any listing, review or post directly from its page. See our <Link href="/legal/privacy">Privacy Policy</Link>.</p>
    </LegalPage>
  );
}
