// File: src/components/ConsentBanner.tsx
// Purpose: Cookie/analytics consent [v1 legal requirement, Ch. 21.2/22.3].
// GA4 loads only after explicit consent; declining keeps the product fully functional.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "ll.consent.v1";
export const CONSENT_EVENT = "ll-consent-changed";

export function getConsent(): "granted" | "denied" | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function setConsent(value: "granted" | "denied"): void {
  try {
    window.localStorage.setItem(KEY, value);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  } catch {
    // Storage unavailable — banner will reappear next visit.
  }
}

export function clearConsent(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  } catch {
    // ignore
  }
}

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(getConsent() === null);
    update();
    window.addEventListener(CONSENT_EVENT, update);
    return () => window.removeEventListener(CONSENT_EVENT, update);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="anim-rise fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-white p-4 shadow-[0_-4px_20px_-8px_rgba(20,33,61,0.15)]"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-[var(--muted)]">
          We use Google Analytics to understand aggregate usage, and Google AdSense to show
          clearly-labelled ads that keep the directory free. &ldquo;Allow&rdquo; enables
          personalised ads and analytics; &ldquo;Decline&rdquo; keeps analytics off and ads
          non-personalised. We never sell your data.{" "}
          <Link href="/legal/privacy" className="underline">Privacy Policy</Link>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setConsent("denied")}
            className="press rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:border-[var(--trust)]"
          >
            Decline
          </button>
          <button
            onClick={() => setConsent("granted")}
            className="press rounded-lg bg-[var(--trust)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--trust-strong)]"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
