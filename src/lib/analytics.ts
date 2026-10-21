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
  | "verified_creator.requested.v1"
  | "tool.saved.v1"
  | "tool.unsaved.v1"
  | "tool.visited.v1"
  | "tool.reviewed.v1"
  | "tool.submitted.v1"
  | "tool.reported.v1"
  | "pwa.install_clicked.v1";

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
    // Page views go to GA only. Writing one Firestore doc per page view is the fastest way to
    // grow the database bill with no product value; we keep first-party events for actions.
    if (name === "page.viewed.v1") return;
    void addDoc(collection(db(), "events"), {
      name,
      props,
      createdAt: serverTimestamp(),
    }).catch(() => undefined);
  } catch {
    // Analytics must never break the product.
  }
}
