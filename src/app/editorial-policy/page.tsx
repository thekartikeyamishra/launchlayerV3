// File: src/app/editorial-policy/page.tsx
// Purpose: Public editorial, ranking, review and advertising policy — our core trust promise
// and the transparency page AdSense reviewers and users look for.

import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Editorial, ranking & advertising policy",
  description: "How LaunchLayer chooses, describes and ranks AI tools, how reviews work, and how ads and sponsorships are kept separate from organic results.",
  alternates: { canonical: "/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <LegalPage title="Editorial, ranking & advertising policy" updated="October 2026">
      <h2 id="listing">How tools get listed</h2>
      <ul>
        <li>Editors add tools that are live, publicly available and do what they claim. Anyone can <Link href="/submit">submit a tool for free</Link>.</li>
        <li>Every submission is reviewed by a person. We reject dead sites, tools that mislead users, and anything that breaks our <Link href="/legal/acceptable-use">Acceptable Use Policy</Link>.</li>
        <li>Descriptions are written in our own words. We list the <em>pricing model</em> rather than prices, because prices change faster than any directory can track.</li>
        <li>Each listing shows the date an editor last reviewed it. We periodically check every link and fix or remove tools that are dead or materially changed.</li>
      </ul>
      <h2 id="ranking">How ranking works</h2>
      <ul>
        <li>Search results are ordered by relevance to the task you described: name, description and the tasks the tool is known for.</li>
        <li>Browsing lists without a search are alphabetical, or ordered by genuine signals from signed-in people (saves and reviews) where shown.</li>
        <li><strong>Payment never changes organic order.</strong> There is no paid “boost”, “highlight” or “fast-track”.</li>
      </ul>
      <h2 id="reviews">How reviews work</h2>
      <ul>
        <li>One review per person per tool, and every review must say what the reviewer used the tool for.</li>
        <li>Averages only appear once a tool has at least three reviews.</li>
        <li>Makers cannot pay to remove, hide or reorder reviews. We remove reviews only for policy violations (spam, abuse, conflicts of interest, personal data).</li>
      </ul>
      <h2 id="ads">Advertising and sponsorships</h2>
      <ul>
        <li>We show ads served by Google AdSense. Every ad is labelled “Advertisement”, sits outside tool lists, and is never styled to look like a listing.</li>
        <li>If we offer sponsored placements in future, they will be labelled “Sponsored”, shown separately from organic results, and will not affect rankings or reviews.</li>
        <li>If we ever use affiliate links, the link will be marked and the listing will say so. An affiliate relationship never changes what we write.</li>
      </ul>
      <h2 id="corrections">Corrections</h2>
      <p>
        Spot something wrong? Use “Suggest a correction” on any tool page or <Link href="/contact">contact us</Link>. Corrections are
        free for everyone, including makers.
      </p>
      <h2 id="ai">Use of AI</h2>
      <p>We use AI to help draft and check content, but a person reviews every listing and guide before it is published.</p>
    </LegalPage>
  );
}
