// File: src/components/AdsenseLoader.tsx
// Purpose: Loads the AdSense library once, only after the visitor has made a consent choice,
// and only when a publisher id is configured. Lazy so it never competes with page content.

"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { CONSENT_EVENT, getConsent } from "./ConsentBanner";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default function AdsenseLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const update = () => setReady(getConsent() !== null);
    update();
    window.addEventListener(CONSENT_EVENT, update);
    return () => window.removeEventListener(CONSENT_EVENT, update);
  }, []);

  if (!CLIENT || !ready) return null;
  return (
    <Script
      id="adsense"
      async
      strategy="lazyOnload"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
    />
  );
}
