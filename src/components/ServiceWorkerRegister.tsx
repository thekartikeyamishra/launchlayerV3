// File: src/components/ServiceWorkerRegister.tsx
// Purpose: Registers the service worker (production only) to enable install on Android/iOS.

"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failure never breaks the app; the site still works as a normal website.
    });
  }, []);
  return null;
}
