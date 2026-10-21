// File: src/lib/useDraft.ts
// Purpose: Autosave unfinished forms on this device and offer to restore them — people who
// leave halfway don't lose their work, and come back to finish. Per-viewer only, so it lives
// in localStorage (wrapped in try/catch: private windows and blocked storage just skip it).

"use client";

import { useEffect, useRef, useState } from "react";

const TTL = 30 * 86400_000; // drafts older than 30 days are discarded

export function useDraft<T extends Record<string, unknown>>(key: string, value: T, restore: (v: T) => void, isEmpty: (v: T) => boolean) {
  const storageKey = `ll.draft.${key}`;
  const [restored, setRestored] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { at: number; v: T };
      if (Date.now() - parsed.at > TTL || isEmpty(parsed.v)) {
        window.localStorage.removeItem(storageKey);
        return;
      }
      restore(parsed.v);
      setRestored(true);
    } catch {
      // ignore unreadable drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!loaded.current) return;
    const id = setTimeout(() => {
      try {
        if (isEmpty(value)) window.localStorage.removeItem(storageKey);
        else window.localStorage.setItem(storageKey, JSON.stringify({ at: Date.now(), v: value }));
      } catch {
        // storage full or blocked — autosave is best-effort
      }
    }, 600);
    return () => clearTimeout(id);
  }, [value, storageKey, isEmpty]);

  const clear = () => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setRestored(false);
  };

  return { restored, clear, dismiss: () => setRestored(false) };
}

/** True if this device has an unfinished draft for `key` (used for "finish your request" nudges). */
export function hasDraft(key: string): boolean {
  try {
    const raw = window.localStorage.getItem(`ll.draft.${key}`);
    if (!raw) return false;
    return Date.now() - (JSON.parse(raw) as { at: number }).at < TTL;
  } catch {
    return false;
  }
}
