// File: src/components/SharePost.tsx
// Purpose: One-tap sharing with a ready-made ask (Web Share API + clipboard fallback).
// The template asks people who genuinely share the need to vote — signal, not brigading.

"use client";

import { useState } from "react";
import { logEvent } from "@/lib/analytics";
import { Button } from "./ui";

export default function SharePost({ postId, title, voteCount }: { postId: string; title: string; voteCount: number }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/demand/${postId}`;
    const text = `I'm asking AI builders for this: "${title}" — ${voteCount} ${voteCount === 1 ? "person needs" : "people need"} it so far. If you need it too, add your vote so builders see the real demand:`;
    logEvent("demand_post.shared.v1", { method: typeof navigator.share === "function" ? "native" : "clipboard" });
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "LaunchLayer demand request", text, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable — the URL bar is still there; do nothing loud.
    }
  };

  return (
    <Button variant="secondary" onClick={share} aria-live="polite">
      {copied ? "Copied — paste it anywhere" : "Share this request"}
    </Button>
  );
}
