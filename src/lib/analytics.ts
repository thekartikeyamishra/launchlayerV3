// File: src/lib/analytics.ts
// Purpose: Versioned first-party analytics events (Ch. 16) + GA4 forwarding.
// Privacy: no personal data in payloads; fire-and-forget, never blocks UX.

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

type EventName =
  | "page.viewed.v1"
  | "demand_post.created.v1"
  | "demand_post.voted.v1"
  | "demand_post.unvoted.v1"
  | "demand_post.followed.v1"
  | "demand_post.shared.v1"
  | "hero.searched.v1"
  | "demand_post.unfollowed.v1"
  | "demand_comment.created.v1"
  | "demand_claim.created.v1"
  | "content.reported.v1"
  | "auth.signed_up.v1"
  | "auth.signed_in.v1"
  | "verified_creator.requested.v1";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function logEvent(name: EventName, props: Record<string, string | number | boolean> = {}): void {
  try {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", name, props);
    }
    void addDoc(collection(db(), "events"), {
      name,
      props,
      createdAt: serverTimestamp(),
    }).catch(() => undefined);
  } catch {
    // Analytics must never break the product.
  }
}
