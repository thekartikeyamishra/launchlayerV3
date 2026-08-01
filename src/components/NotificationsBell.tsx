// File: src/components/NotificationsBell.tsx
// Purpose: In-app notifications (claims and comments on your posts) — Ch. 2.7:
// notifications exist only to help users succeed; all real events, no engagement bait.

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { countUnreadNotifications, fetchNotifications, markAllNotificationsRead } from "@/lib/db";
import type { AppNotification } from "@/lib/types";

export default function NotificationsBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<AppNotification[] | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    void countUnreadNotifications(user.uid).then(setUnread).catch(() => setUnread(0));
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const openPanel = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      try {
        const fetched = await fetchNotifications(user.uid);
        setNotes(fetched);
        await markAllNotificationsRead(user.uid, fetched);
        setUnread(0);
      } catch {
        setNotes([]);
      }
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={openPanel}
        className="press relative grid h-9 w-9 place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:border-[var(--trust)] hover:text-[var(--ink)]"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <span className="anim-pop absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--demand)] px-1 text-[10px] font-bold text-white tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="anim-pop absolute right-0 top-11 z-50 w-80 rounded-xl border border-[var(--line)] bg-white p-2 shadow-lg" role="region" aria-label="Notifications">
          {notes === null ? (
            <p className="p-3 text-sm text-[var(--muted)]">Loading…</p>
          ) : notes.length === 0 ? (
            <p className="p-3 text-sm text-[var(--muted)]">
              Nothing yet. When someone comments on or builds a solution for your requests, it shows up here.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-[var(--line)] overflow-y-auto">
              {notes.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/demand/${n.postId}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg p-3 text-sm hover:bg-[var(--bg)]"
                  >
                    <span className="font-semibold">{n.actorName}</span>{" "}
                    {n.type === "claim" ? "built a solution for" : "commented on"}{" "}
                    <span className="font-medium text-[var(--trust-strong)]">{n.postTitle}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
