// File: src/components/AppDownload.tsx
// Purpose: "Get the app" — installable web app today; store buttons switch from
// "Coming soon" to live links the moment NEXT_PUBLIC_PLAY_STORE_URL / NEXT_PUBLIC_APP_STORE_URL are set.

"use client";

import { useEffect, useState } from "react";
import { logEvent } from "@/lib/analytics";

const PLAY = process.env.NEXT_PUBLIC_PLAY_STORE_URL;
const IOS = process.env.NEXT_PUBLIC_APP_STORE_URL;

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function StoreButton({ href, label, sub, icon }: { href?: string; label: string; sub: string; icon: React.ReactNode }) {
  const inner = (
    <>
      {icon}
      <span className="text-left leading-tight">
        <span className="block text-[10px] opacity-80">{href ? sub : "Coming soon"}</span>
        <span className="block text-sm font-semibold">{label}</span>
      </span>
    </>
  );
  const cls = "press inline-flex min-w-40 items-center gap-2.5 rounded-xl px-4 py-2.5";
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} bg-[var(--ink)] text-white hover:opacity-90`}>{inner}</a>
  ) : (
    <span aria-disabled="true" className={`${cls} cursor-not-allowed border border-[var(--line)] bg-white text-[var(--muted)]`}>{inner}</span>
  );
}

export default function AppDownload({ compact = false }: { compact?: boolean }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    logEvent("pwa.install_clicked.v1");
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setPrompt(null);
      return;
    }
    // iOS Safari and some browsers have no install prompt — show the manual steps.
    setIosHint(true);
  };

  return (
    <div className={compact ? "" : "rounded-2xl border border-[var(--line)] bg-white p-6"}>
      {!compact && (
        <>
          <h2 className="font-display text-lg font-bold">Take LaunchLayer with you</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Install the web app now — it opens like an app, works on any device, and needs no store download.</p>
        </>
      )}
      <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-4"}`}>
        <button
          onClick={() => void install()}
          disabled={installed}
          className="press inline-flex items-center gap-2 rounded-xl bg-[var(--trust)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--trust-strong)] disabled:opacity-60"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>
          {installed ? "Installed" : "Install web app"}
        </button>
        <StoreButton
          href={PLAY}
          label="Google Play"
          sub="Get it on"
          icon={<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3.6 2.2 13.4 12l-9.8 9.8c-.4-.2-.6-.6-.6-1.1V3.3c0-.5.2-.9.6-1.1Zm10.9 10.9 2.6 2.6-11 6.3 8.4-8.9Zm3.6-3.6 3 1.7c.8.5.8 1.6 0 2.1l-3 1.7-2.9-2.9 2.9-2.6ZM6.1 1.9l11 6.3-2.6 2.6-8.4-8.9Z" /></svg>}
        />
        <StoreButton
          href={IOS}
          label="App Store"
          sub="Download on the"
          icon={<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.1 2.5-1.8 3.1-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.4-.9-2.4-3.7ZM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4Z" /></svg>}
        />
      </div>
      {iosHint && (
        <p role="status" className="anim-rise mt-3 text-xs text-[var(--muted)]">
          On iPhone/iPad: tap <strong>Share</strong> → <strong>Add to Home Screen</strong>. On desktop Chrome/Edge: use the install icon in the address bar.
        </p>
      )}
    </div>
  );
}
