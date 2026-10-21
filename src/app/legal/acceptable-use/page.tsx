// File: src/app/legal/acceptable-use/page.tsx
// Purpose: Acceptable Use Policy [v1].

export const metadata = {
  title: "Acceptable Use Policy",
  description: "What is and isn't allowed on LaunchLayer: genuine reviews, real demand, no spam, fake activity or misleading listings.",
  alternates: { canonical: "/legal/acceptable-use" },
};

export default function AupPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-[15px] leading-relaxed">
      <h1 className="font-display text-2xl font-bold">Acceptable Use Policy</h1>
      <p className="text-sm text-[var(--muted)]">Last updated: July 2026</p>
      <p>LaunchLayer exists on one promise: everything here is real. Protect that.</p>
      <p>This includes reviews: only review tools you have actually used, disclose any connection to a product, and never post or buy fake reviews, votes or saves.</p>
      <h2 className="font-display text-lg font-bold">Never allowed</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Fake activity of any kind: fabricated demand posts, vote manipulation, coordinated inauthentic engagement, or fake solutions.</li>
        <li>Requests for, or links to, illegal products or services; malware; content that violates others&apos; rights.</li>
        <li>Solutions designed to deceive, defraud, or harm the people who use them.</li>
        <li>Harassment, hate, or abuse directed at any person or group.</li>
        <li>Impersonating another person, business, or LaunchLayer itself.</li>
        <li>Scraping personal data of other members, or spam in posts and comments.</li>
      </ul>
      <h2 className="font-display text-lg font-bold">Enforcement</h2>
      <p>
        Violations lead to graduated responses: content removal, warnings, temporary
        restrictions, and — for severe or repeated abuse — permanent bans. Every enforcement
        action states the policy violated and includes an appeal path. Report violations with
        the Report link on any post.
      </p>
    </article>
  );
}
