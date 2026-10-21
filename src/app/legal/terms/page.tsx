// File: src/app/legal/terms/page.tsx
// Purpose: Terms of Service. Draft for review by qualified counsel before public launch.

import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL, LEGAL_ENTITY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using LaunchLayer's AI tools directory, reviews and demand board.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 2026">
      <p>
        LaunchLayer (&ldquo;we&rdquo;) is operated by {LEGAL_ENTITY}, the owner of the LaunchLayer name, website, software and
        content. We operate launchlayer.me: a directory of third-party AI tools, user reviews, and a public board where people
        request AI solutions and independent creators respond. By using the site you agree to these terms.
      </p>
      <h2>1. Information, not advice</h2>
      <p>
        Listings, guides and reviews are general information to help you compare tools. They are not professional, legal, financial or
        security advice. Tools are made and sold by third parties, not by us. Features, prices and availability change — always confirm
        details on the official site before you buy or rely on a tool.
      </p>
      <h2>2. Third-party tools and links</h2>
      <p>
        Links lead to websites we don&apos;t control. Any purchase, subscription or data you share with a third-party tool or creator is
        between you and them, under their terms and privacy policy. We are not responsible for third-party products or services.
      </p>
      <h2>3. Accounts</h2>
      <p>You must be at least 18. Keep your credentials secure; you are responsible for activity under your account. Provide accurate information and do not impersonate anyone.</p>
      <h2>4. Your content</h2>
      <p>
        You keep ownership of what you post. You grant us a non-exclusive, worldwide, royalty-free licence to host, display and format it to
        operate and promote the service. You confirm you have the right to post it, that reviews reflect your genuine experience, and that you
        will disclose any connection to a product you review. We may remove content that breaks our <Link href="/legal/acceptable-use">Acceptable Use Policy</Link> or <Link href="/editorial-policy">editorial policy</Link>.
      </p>
      <h2>5. Listings and makers</h2>
      <p>Listing is free. We decide what to list and may edit descriptions for accuracy and clarity. Payment never buys a listing, ranking or review outcome.</p>
      <h2>6. Paid services</h2>
      <p>If we offer optional paid services, prices, inclusions and duration will be shown before you pay, and our <Link href="/legal/refund">Refund &amp; Cancellation Policy</Link> applies.</p>
      <h2>7. Verified Creator badges</h2>
      <p>Badges are granted after manual review, cannot be bought, and may be revoked with notice if criteria are no longer met.</p>
      <h2>8. Intellectual property</h2>
      <p>
        The LaunchLayer name and logo, the site&apos;s software, design, curated listings, task guides and other editorial content
        belong to us and are protected by copyright and other laws. You may link to and quote short excerpts with attribution; you
        may not copy, scrape in bulk, republish or create a competing database from our content without written permission. Our
        public API and MCP server may be used as described on the <Link href="/developers">developers page</Link>, with a link back
        to the listing.
      </p>
      <p>Product names and trademarks belong to their owners and are used only to identify the products. To report infringement, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the URL, proof of rights and your contact details.</p>
      <h2>9. Disclaimers and liability</h2>
      <p>
        The service is provided &ldquo;as is&rdquo; without warranties of accuracy, completeness or availability. To the maximum extent permitted by law,
        we are not liable for indirect or consequential losses, or for third-party tools, sites or transactions. Nothing here limits liability
        that cannot be limited by law, including your non-waivable consumer rights.
      </p>
      <h2>10. Termination and changes</h2>
      <p>You may delete your account at any time. We may suspend accounts that break these terms, with reasons and an appeal path. We may update these terms and will announce material changes before they take effect.</p>
      <h2>11. Governing law</h2>
      <p>These terms are governed by the laws of India; courts at Lucknow, Uttar Pradesh have jurisdiction, subject to any non-waivable consumer protections where you live.</p>
    </LegalPage>
  );
}
