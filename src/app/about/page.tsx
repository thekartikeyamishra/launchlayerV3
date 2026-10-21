// File: src/app/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About LaunchLayer",
  description: "Why LaunchLayer exists: an AI tools directory with honest ranking, free listings, real-use reviews and a demand board for tools that don't exist yet.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <LegalPage title="About LaunchLayer" updated="October 2026">
      <p>
        There are tens of thousands of AI tools and new ones every day. The hard part isn&apos;t finding <em>an</em> AI
        tool — it&apos;s finding the right one for a specific job, knowing what it really costs, and trusting that the list
        you&apos;re reading wasn&apos;t ordered by whoever paid the most.
      </p>
      <p>LaunchLayer is our answer. It is independently built, owned and run from India by Kartikeya Mishra, a full-stack applied-AI engineer, for people everywhere. It has no outside investors and no paid placement deals that influence what you read.</p>
      <h2>What we do differently</h2>
      <ul>
        <li><strong>Task-first.</strong> You describe the job; we show tools that do it, with a short guide on how to choose.</li>
        <li><strong>Ranking you can&apos;t buy.</strong> Organic order is relevance and genuine use. Ads are always labelled and separate.</li>
        <li><strong>No login walls.</strong> Everything is readable without an account.</li>
        <li><strong>Free listings, free corrections.</strong> Makers never pay to be listed or to fix their own details.</li>
        <li><strong>Visible freshness.</strong> Every listing shows when an editor last reviewed it.</li>
        <li><strong>A demand board.</strong> If no tool exists for your task, post it — others vote, builders respond.</li>
      </ul>
      <h2>How we make money</h2>
      <p>
        We show a limited number of clearly-labelled ads through Google AdSense. In future we may offer clearly-labelled
        sponsored placements and optional paid features for makers. None of these change organic ranking or reviews — see
        our <Link href="/editorial-policy">editorial &amp; ranking policy</Link>.
      </p>
      <h2>Contact</h2>
      <p>Questions, corrections or partnerships: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or the <Link href="/contact">contact page</Link>.</p>
    </LegalPage>
  );
}
