// File: src/app/legal/terms/page.tsx
// Purpose: Terms of Service [v1]. Draft for review by qualified counsel before public launch.

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="prose-sm mx-auto max-w-2xl space-y-4 text-[15px] leading-relaxed">
      <h1 className="font-display text-2xl font-bold">Terms of Service</h1>
      <p className="text-sm text-[var(--muted)]">Last updated: July 2026</p>
      <p>
        LaunchLayer is a platform where people post requests for AI solutions and independent
        creators respond with links to their solutions. By creating an account or using the
        platform you agree to these terms.
      </p>
      <h2 className="font-display text-lg font-bold">1. What LaunchLayer is — and isn&apos;t</h2>
      <p>
        LaunchLayer is a marketplace and infrastructure provider. Solutions attached to demand
        posts are created, hosted, sold, and supported by independent third-party creators, not
        by LaunchLayer. Links to solutions lead off-platform; any transaction you enter into with
        a creator is between you and that creator. LaunchLayer does not process payments in this
        version of the platform.
      </p>
      <h2 className="font-display text-lg font-bold">2. Accounts</h2>
      <p>
        You must be at least 18 years old. You are responsible for your account credentials and
        for activity under your account. Provide accurate information; impersonation is
        prohibited.
      </p>
      <h2 className="font-display text-lg font-bold">3. Your content</h2>
      <p>
        You retain ownership of content you post. You grant LaunchLayer a non-exclusive,
        worldwide licence to host and display it for the purpose of operating the platform. You
        are responsible for having the rights to what you post. We may remove content that
        violates the Acceptable Use Policy, with a documented takedown process and an appeal
        path.
      </p>
      <h2 className="font-display text-lg font-bold">4. Verified Creator badges</h2>
      <p>
        Badges are granted after manual review, remain LaunchLayer&apos;s property, may be
        revoked with notice if criteria are no longer met, and cannot be bought.
      </p>
      <h2 className="font-display text-lg font-bold">5. Copyright and trademark complaints</h2>
      <p>
        Report infringement to the platform&apos;s designated contact with the content URL, proof
        of your rights, and your contact details. We follow a takedown-and-appeal process and may
        terminate repeat infringers.
      </p>
      <h2 className="font-display text-lg font-bold">6. Disclaimers and liability</h2>
      <p>
        The platform is provided &quot;as is&quot; without warranties. To the maximum extent
        permitted by law, LaunchLayer is not liable for third-party solutions, off-platform
        transactions, or indirect damages. Nothing in these terms limits liability that cannot be
        limited under applicable law.
      </p>
      <h2 className="font-display text-lg font-bold">7. Termination and changes</h2>
      <p>
        You may delete your account at any time from the Account page. We may suspend accounts
        that violate these terms, with reasons stated and an appeal path. We may update these
        terms; material changes will be announced on the platform before taking effect.
      </p>
      <h2 className="font-display text-lg font-bold">8. Governing law</h2>
      <p>
        These terms are governed by the laws of India, with courts at Lucknow, Uttar Pradesh
        having jurisdiction, subject to any non-waivable consumer protections in your place of
        residence.
      </p>
    </article>
  );
}
