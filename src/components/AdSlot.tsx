// File: src/components/AdSlot.tsx
// Purpose: A single, clearly-labelled AdSense unit.
// Policy guardrails (AdSense programme policies + our editorial policy):
//  - Renders only when NEXT_PUBLIC_ADSENSE_CLIENT and a slot id are configured.
//  - Always labelled "Advertisement" and visually separated — never styled like a tool card.
//  - Never inside tool lists, forms, navigation, or next to buttons (no accidental clicks).
//  - Reserves height up front so it never causes layout shift (Core Web Vitals: CLS).
//  - Waits for a consent choice; if analytics/ads consent is declined, requests non-personalised ads.

"use client";

import { useEffect, useRef, useState } from "react";
import { CONSENT_EVENT, getConsent } from "./ConsentBanner";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>> & { requestNonPersonalizedAds?: number };
  }
}

export default function AdSlot({ slot, className = "" }: { slot?: string; className?: string }) {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);
  const pushed = useRef(false);

  useEffect(() => {
    const update = () => setConsent(getConsent());
    update();
    window.addEventListener(CONSENT_EVENT, update);
    return () => window.removeEventListener(CONSENT_EVENT, update);
  }, []);

  useEffect(() => {
    if (!CLIENT || !slot || consent === null || pushed.current) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      if (consent === "denied") window.adsbygoogle.requestNonPersonalizedAds = 1;
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // Ad blockers or a slow script must never break the page.
    }
  }, [consent, slot]);

  if (!CLIENT || !slot) return null;

  return (
    <aside aria-label="Advertisement" className={`my-8 ${className}`}>
      <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Advertisement</p>
      <div className="overflow-hidden rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg)]" style={{ minHeight: 280 }}>
        {consent !== null && (
          <ins
            className="adsbygoogle"
            style={{ display: "block", minHeight: 280 }}
            data-ad-client={CLIENT}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        )}
      </div>
    </aside>
  );
}
