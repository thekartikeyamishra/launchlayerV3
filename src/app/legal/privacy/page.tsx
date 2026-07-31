// File: src/app/legal/privacy/page.tsx
// Purpose: Privacy Policy [v1] — DPDP Act + GDPR aligned. Review by counsel before launch.

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-[15px] leading-relaxed">
      <h1 className="font-display text-2xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-[var(--muted)]">Last updated: July 2026</p>
      <p>
        We use product analytics to improve recommendations, detect fraud, enhance security, and
        make the platform easier to use. We do not sell your personal data.
      </p>
      <h2 className="font-display text-lg font-bold">What we collect</h2>
      <p>
        Account data (name, email), content you post (demand requests, comments, solution
        links), and product analytics events (pages viewed, actions taken — without message
        content). Authentication and hosting are provided by Google Firebase and Vercel, which
        process data on our behalf.
      </p>
      <h2 className="font-display text-lg font-bold">Why we collect it</h2>
      <p>
        To operate the board, show real demand signals, prevent abuse, and improve the product.
        Analytics events carry no personal data payloads. We collect the minimum needed for each
        purpose.
      </p>
      <h2 className="font-display text-lg font-bold">Your rights</h2>
      <p>
        Under India&apos;s DPDP Act 2023 and the GDPR you can access, export, correct, and delete
        your data. Export and deletion are self-serve on your Account page; deletion requests are
        completed within 30 days, subject to legal holds. For grievances, contact the Grievance
        Officer at the address published on this page after launch.
      </p>
      <h2 className="font-display text-lg font-bold">Retention</h2>
      <p>
        Account data is kept while your account exists. Analytics events are retained for up to
        25 months, then aggregated. Moderation and takedown records are retained as required for
        legal compliance.
      </p>
      <h2 className="font-display text-lg font-bold">Public content</h2>
      <p>
        Demand posts, comments, and solutions are public by design, shown with your display
        name. Don&apos;t include personal or confidential information in public posts.
      </p>
    </article>
  );
}
