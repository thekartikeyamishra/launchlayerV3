// File: src/components/HeroAsk.tsx
// Purpose: Interactive hero — the visitor's first action happens before any account exists
// (Ch. 2.4 "aha within five minutes, without registering"). Typing a need searches real
// posts; a match converts them into a voter, a miss converts them into a poster.

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchPostsForSearch, searchPosts } from "@/lib/db";
import type { DemandPost } from "@/lib/types";
import { logEvent } from "@/lib/analytics";

const EXAMPLES = [
  "An AI that answers WhatsApp orders for my shop…",
  "Read invoices and push entries into Tally…",
  "Summarize legal notices in plain Hindi…",
  "Auto-reply to customer emails with my tone…",
  "Turn site visits into qualified sales leads…",
];

export default function HeroAsk() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [results, setResults] = useState<DemandPost[] | null>(null);
  const [searching, setSearching] = useState(false);
  const pool = useRef<DemandPost[] | null>(null);
  const typing = useRef({ example: 0, char: 0 });

  // Typewriter placeholder — motion that communicates what this box is for.
  useEffect(() => {
    const tick = setInterval(() => {
      const t = typing.current;
      const target = EXAMPLES[t.example] ?? "";
      if (t.char <= target.length) {
        setPlaceholder(target.slice(0, t.char));
        t.char += 1;
      } else if (t.char < target.length + 24) {
        t.char += 1; // hold the full sentence briefly
      } else {
        t.example = (t.example + 1) % EXAMPLES.length;
        t.char = 0;
      }
    }, 45);
    return () => clearInterval(tick);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3) return;
    setSearching(true);
    logEvent("hero.searched.v1", { length: q.length });
    try {
      if (!pool.current) pool.current = await fetchPostsForSearch();
      setResults(searchPosts(pool.current, q).slice(0, 3));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const postIt = () => {
    router.push(`/demand/new?title=${encodeURIComponent(query.trim().slice(0, 120))}`);
  };

  return (
    <div className="mx-auto mt-8 max-w-xl text-left">
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor="hero-ask" className="sr-only">What do you need AI to do?</label>
        <input
          id="hero-ask"
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (results) setResults(null); }}
          placeholder={placeholder || "What do you need AI to do?"}
          maxLength={120}
          className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[15px] text-[var(--ink)] shadow-sm placeholder:text-[var(--muted)] focus:border-[var(--trust)] focus:outline-none focus:ring-2 focus:ring-[var(--trust)]/20"
        />
        <button
          type="submit"
          disabled={searching || query.trim().length < 3}
          className="press shrink-0 rounded-xl bg-[var(--trust)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--trust-strong)] disabled:opacity-50"
        >
          {searching ? "Checking…" : "Check"}
        </button>
      </form>

      {results !== null && (
        <div className="anim-rise mt-3 rounded-xl border border-[var(--line)] bg-white p-4">
          {results.length > 0 ? (
            <>
              <p className="text-sm font-semibold text-[var(--ink)]">
                People are already asking for this — add your vote so builders see the demand:
              </p>
              <ul className="mt-2 space-y-1.5">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link href={`/demand/${p.id}`} className="text-sm font-medium text-[var(--trust-strong)] hover:underline">
                      {p.title} <span className="tabular-nums text-[var(--muted)]">({p.voteCount} votes)</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button onClick={postIt} className="mt-3 text-xs text-[var(--muted)] underline-offset-2 hover:underline">
                None of these match — post my own request
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-[var(--demand)]">
                Nobody has asked for this yet — you&apos;d be first.
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Post it and creators watching the board see it immediately. Your title is already filled in.
              </p>
              <button
                onClick={postIt}
                className="press mt-3 rounded-lg bg-[var(--demand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Post this request →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
