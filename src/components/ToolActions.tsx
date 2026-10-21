// File: src/components/ToolActions.tsx
// Purpose: Tool page actions — save to your personal library (with live public save count),
// visit the official site, and report outdated info (free, self-serve corrections).

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchToolSaveCount, isToolSaved, toggleToolSave } from "@/lib/db";
import { logEvent } from "@/lib/analytics";
import { markMission } from "@/lib/missions";

export default function ToolActions({ slug, name, url }: { slug: string; name: string; url: string }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchToolSaveCount(slug).then(setCount).catch(() => setCount(null));
  }, [slug]);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    void isToolSaved(user.uid, slug).then(setSaved).catch(() => undefined);
  }, [user, slug]);

  const toggle = async () => {
    if (!user) return;
    setBusy(true);
    setError("");
    const next = !saved;
    setSaved(next); // optimistic
    setCount((c) => (c === null ? c : Math.max(0, c + (next ? 1 : -1))));
    try {
      const result = await toggleToolSave(user.uid, { slug, name });
      setSaved(result);
      logEvent(result ? "tool.saved.v1" : "tool.unsaved.v1", { slug });
      if (result) markMission("browsed");
    } catch {
      setSaved(!next);
      setCount((c) => (c === null ? c : Math.max(0, c + (next ? -1 : 1))));
      setError("Couldn't update your library. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={url}
        target="_blank"
        rel="noopener"
        onClick={() => logEvent("tool.visited.v1", { slug })}
        className="press inline-flex items-center gap-2 rounded-xl bg-[var(--trust)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--trust-strong)]"
      >
        Visit {name}
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
      </a>
      {user ? (
        <button
          onClick={() => void toggle()}
          disabled={busy}
          aria-pressed={saved}
          className={`press inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
            saved ? "border-[var(--trust)] bg-[var(--trust)]/10 text-[var(--trust-strong)]" : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--trust)]"
          }`}
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>
          {saved ? "Saved" : "Save"}
          {count !== null && count > 0 && <span className="tabular-nums text-[var(--muted)]">· {count}</span>}
        </button>
      ) : (
        <Link
          href={`/sign-in?next=/tools/${slug}`}
          className="press inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] hover:border-[var(--trust)]"
        >
          Save to my library
          {count !== null && count > 0 && <span className="tabular-nums text-[var(--muted)]">· {count}</span>}
        </Link>
      )}
      {error && <p role="alert" className="w-full text-xs text-red-700">{error}</p>}
    </div>
  );
}
