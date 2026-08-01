// File: src/lib/missions.ts
// Purpose: Getting-started missions — completion flags for actions that are expensive
// to query live (votes, first post). Real account state (email verified, creator status)
// is always read from auth/profile, never from these flags. SSR-safe.

const KEY = "ll.missions.v1";

export type MissionFlag = "voted" | "posted" | "browsed";

function read(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function markMission(flag: MissionFlag): void {
  if (typeof window === "undefined") return;
  try {
    const flags = read();
    if (!flags[flag]) {
      flags[flag] = true;
      window.localStorage.setItem(KEY, JSON.stringify(flags));
    }
  } catch {
    // Storage unavailable (private mode) — missions degrade gracefully.
  }
}

export function hasMission(flag: MissionFlag): boolean {
  return read()[flag] === true;
}

const DISMISS_KEY = "ll.missions.dismissed.v1";

export function isChecklistDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return true;
  }
}

export function dismissChecklist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // ignore
  }
}

// One-time celebration handoff (post creation -> detail page), survives the redirect only.
const CELEBRATE_KEY = "ll.justPosted";

export function setJustPosted(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CELEBRATE_KEY, "1");
  } catch {
    // ignore
  }
}

export function consumeJustPosted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = window.sessionStorage.getItem(CELEBRATE_KEY) === "1";
    window.sessionStorage.removeItem(CELEBRATE_KEY);
    return v;
  } catch {
    return false;
  }
}
