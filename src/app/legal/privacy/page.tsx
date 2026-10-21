// File: src/app/legal/privacy/page.tsx
// Purpose: Privacy Policy — DPDP Act 2023 + GDPR aligned, with the third-party advertising
// disclosures Google AdSense requires. Review with qualified counsel before launch.

import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What LaunchLayer collects, why, how ads and analytics cookies work, and your rights under India's DPDP Act and the GDPR.",
  alternates: { canonical: "/legal/privacy" },
};

const GRIEVANCE = process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER || "Kartikeya Mishra";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <p>We collect the minimum we need to run LaunchLayer. We do not sell your personal data.</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email and sign-in provider when you create an account.</li>
        <li><strong>Content you create:</strong> reviews, requests, comments, tool submissions and the tools you save. Saved tools and their notes are private to you; reviews, requests and comments are public under your display name.</li>
        <li><strong>Usage events:</strong> pages viewed and actions taken (for example “saved a tool”), without the content of your notes.</li>
        <li><strong>Technical data:</strong> standard server logs (IP address, browser type) kept for security and abuse prevention.</li>
      </ul>
      <h2>Why we use it</h2>
      <p>To operate the directory and demand board, prevent spam and abuse, keep listings accurate, understand which features help people, and show ads that fund the free service.</p>
      <h2>Cookies, analytics and advertising</h2>
      <ul>
        <li>We ask for your choice before loading Google Analytics or ads. Essential features work either way.</li>
        <li>
          We use <strong>Google AdSense</strong> to show ads. Third-party vendors, including Google, use cookies to serve ads based on your
          prior visits to this and other websites. Google&apos;s use of advertising cookies enables it and its partners to serve ads
          based on your visits to our site and/or other sites on the internet.
        </li>
        <li>
          You can opt out of personalised advertising in <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ads Settings</a>,
          and learn more at <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">how Google uses information from sites that use its services</a>.
          You can also opt out of some third-party vendors&apos; personalised ads at <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener">aboutads.info</a>.
        </li>
        <li>If you choose “Decline”, analytics stay off and we request non-personalised ads only. You can change your choice any time via “Cookie preferences” in the footer.</li>
      </ul>
      <h2>Lumi assistant and Telegram bot</h2>
      <ul>
        <li>Questions you type to Lumi are sent to our search to find matching tools. We don&apos;t store the text of your questions; we record only that a search happened and its length.</li>
        <li>If you use the microphone, your browser&apos;s own speech service (for example Google in Chrome, or Apple in Safari) turns speech into text under that provider&apos;s privacy terms. We receive only the resulting text.</li>
        <li>If you message our Telegram bot, Telegram delivers your message to us so we can reply. We use it only to answer and don&apos;t store it. Telegram&apos;s own privacy policy applies to your use of Telegram.</li>
      </ul>
      <h2>Drafts on your device</h2>
      <p>Unfinished requests and submissions are autosaved in your browser&apos;s local storage on that device only, so you can finish later. They are deleted after 30 days, when you submit, or when you choose “Start over”.</p>
      <h2>Who processes data for us</h2>
      <p>Google Firebase (authentication and database), our hosting provider (such as Vercel), Google Analytics and Google AdSense. If you buy a paid service in future, our payment processor (such as Razorpay) handles payment data; we never store full card details.</p>
      <h2>Your rights</h2>
      <p>
        Under India&apos;s Digital Personal Data Protection Act 2023 and, where applicable, the GDPR, you can access, correct, export
        and delete your data, and withdraw consent. Deletion is self-serve on your <Link href="/account">Account</Link> page or by
        email; we complete requests within 30 days, subject to legal retention obligations.
      </p>
      <h2>Retention</h2>
      <p>Account data is kept while your account exists. Usage events are kept for up to 25 months, then aggregated. Moderation records are kept as required by law.</p>
      <h2>Children</h2>
      <p>LaunchLayer is not directed at children. Accounts are for people aged 18 and over.</p>
      <h2>Grievance Officer and contact</h2>
      <p>
        {GRIEVANCE} — <a href={`mailto:${CONTACT_EMAIL}?subject=Privacy%20grievance`}>{CONTACT_EMAIL}</a>. We acknowledge grievances within
        24 hours and aim to resolve them within 15 days.
      </p>
      <h2>Changes</h2>
      <p>We will post changes here and update the date above. Material changes will be announced on the site before they take effect.</p>
    </LegalPage>
  );
}
