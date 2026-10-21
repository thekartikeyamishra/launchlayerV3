// File: src/components/AssistantLoader.tsx
// Purpose: Loads Lumi only after the page is idle, so the assistant never competes with page
// content for bandwidth or main-thread time (protects LCP and INP).

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Assistant = dynamic(() => import("./Assistant"), { ssr: false });

export default function AssistantLoader() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) {
      w.requestIdleCallback(() => setReady(true), { timeout: 3000 });
    } else {
      const id = setTimeout(() => setReady(true), 1500);
      return () => clearTimeout(id);
    }
  }, []);
  return ready ? <Assistant /> : null;
}
