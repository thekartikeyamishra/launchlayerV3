// File: src/app/legal/refund/page.tsx
// Purpose: Refund & cancellation policy (required by payment gateways such as Razorpay).
// Review with counsel before enabling payments.

import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund & cancellation policy",
  description: "Refund and cancellation terms for any paid services offered on LaunchLayer.",
  alternates: { canonical: "/legal/refund" },
};

export default function RefundPage() {
  return (
    <LegalPage title="Refund & cancellation policy" updated="October 2026">
      <p>
        LaunchLayer is free to use. Browsing, listing a tool, saving tools, reviewing and posting requests cost nothing.
        This policy applies only if you buy an optional paid service from us (for example a labelled sponsored placement
        or a paid plan). The specific terms shown at checkout form part of this policy.
      </p>
      <h2>Payments</h2>
      <p>Payments are processed by our payment partners (such as Razorpay). We never see or store your full card or bank details.</p>
      <h2>Cancellations</h2>
      <ul>
        <li><strong>Subscriptions:</strong> cancel any time from your account or by emailing us. Cancellation stops the next renewal; you keep access until the end of the period you paid for.</li>
        <li><strong>One-off services</strong> (such as a scheduled sponsored placement): cancel any time before the service starts.</li>
      </ul>
      <h2>Refunds</h2>
      <ul>
        <li>A service that has not started is refunded in full on request.</li>
        <li>If we fail to deliver a paid service as described, we refund the undelivered portion.</li>
        <li>Duplicate or erroneous charges are refunded in full.</li>
        <li>Otherwise, fees for a period or service already delivered are non-refundable, except where the law requires a refund.</li>
      </ul>
      <h2>How to request a refund</h2>
      <p>
        Email <a href={`mailto:${CONTACT_EMAIL}?subject=Refund%20request`}>{CONTACT_EMAIL}</a> with your payment reference within 30 days
        of the charge. We respond within 3 working days. Approved refunds are issued to the original payment method and
        usually reach you within 5–7 working days, depending on your bank.
      </p>
      <p>See also our <Link href="/legal/terms">Terms of Service</Link>.</p>
    </LegalPage>
  );
}
