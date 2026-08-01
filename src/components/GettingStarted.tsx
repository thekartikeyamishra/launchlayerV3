// File: src/components/GettingStarted.tsx
// Purpose: Activation checklist — guides new users to their first real success (Ch. 18.2).
// Honesty rule: account/email/creator steps come from live auth state; vote/post steps
// use local completion flags. Progress is never invented.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { dismissChecklist, hasMission, isChecklistDismissed } from "@/lib/missions";

interface Step {
  label: string;
  done: boolean;
  href: string;
  action: string;
}

export default function GettingStarted() {
  const { user, profile, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [flags, setFlags] = useState({ voted: false, posted: false });

  useEffect(() => {
    setFlags({ voted: hasMission("voted"), posted: hasMission("posted") });
    setVisible(!isChecklistDismissed());
  }, [user]);

  if (loading || !visible) return null;

  const steps: Step[] = [
    {
      label: "Create your account",
      done: Boolean(user),
      href: "/sign-in",
      action: "Sign up",
    },
    {
      label: "Verify your email",
      done: Boolean(user?.emailVerified),
      href: "/account",
      action: "Verify",
    },
    {
      label: "Vote on a request you also need",
      done: flags.voted,
      href: "/demand",
      action: "Browse the board",
    },
    {
      label: "Post your first demand request",
      done: flags.posted,
      href: "/demand/new",
      action: "Post a request",
    },
    {
      label: "Building solutions? Apply for Verified Creator",
      done: Boolean(profile?.verifiedCreator || profile?.verifiedCreatorRequest === "pending"),
      href: "/account",
      action: "Apply",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const next = steps.find((s) => !s.done);
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <section
      aria-labelledby="getting-started-heading"
      className="anim-rise rounded-2xl border border-[var(--trust)]/25 bg-white p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="getting-started-heading" className="font-display text-base font-bold">
            Getting started on LaunchLayer
          </h2>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            {doneCount === 0
              ? "Five small steps from browsing to shaping what creators build next."
              : `${doneCount} of ${steps.length} done — keep going.`}
          </p>
        </div>
        <button
          onClick={() => { dismissChecklist(); setVisible(false); }}
          className="press rounded-lg px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--ink)]"
          aria-label="Dismiss getting started checklist"
        >
          Dismiss
        </button>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--line)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Getting started progress">
        <div className="progress-fill h-full rounded-full bg-[var(--trust)]" style={{ width: `${pct}%` }} />
      </div>

      <ul className="mt-4 space-y-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
            <span className={`flex items-center gap-2 ${s.done ? "text-[var(--muted)] line-through decoration-[var(--trust)]/40" : "text-[var(--ink)]"}`}>
              <span
                aria-hidden="true"
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold ${
                  s.done ? "border-[var(--trust)] bg-[var(--trust)] text-white" : "border-[var(--line)] text-transparent"
                }`}
              >
                ✓
              </span>
              {s.label}
              <span className="sr-only">{s.done ? " — completed" : " — not completed"}</span>
            </span>
            {!s.done && s === next && (
              <Link href={s.href} className="press shrink-0 rounded-lg bg-[var(--trust)]/10 px-3 py-1 text-xs font-semibold text-[var(--trust-strong)] hover:bg-[var(--trust)]/20">
                {s.action}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
