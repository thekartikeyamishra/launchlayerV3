// File: src/app/saved/page.tsx
// Purpose: Personal AI library — saved tools with private notes ("what I use it for").
// This is the retention loop: one place for your stack instead of scattered bookmarks.

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchSavedTools, toggleToolSave, updateSavedToolNote } from "@/lib/db";
import type { SavedTool } from "@/lib/types";
import { Button, EmptyState, LinkButton, Skeleton, TextArea } from "@/components/ui";
import ToolLogo from "@/components/ToolLogo";

function NoteEditor({ uid, item }: { uid: string; item: SavedTool }) {
  const [note, setNote] = useState(item.note);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // Debounced autosave: one write after the user pauses, not one per keystroke.
  useEffect(() => {
    if (note === item.note) return;
    setState("saving");
    const t = setTimeout(() => {
      updateSavedToolNote(uid, item.slug, note)
        .then(() => setState("saved"))
        .catch(() => setState("error"));
    }, 800);
    return () => clearTimeout(t);
  }, [note, uid, item.slug, item.note]);
  return (
    <div>
      <label htmlFor={`note-${item.slug}`} className="sr-only">Private note for {item.name}</label>
      <TextArea id={`note-${item.slug}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Private note — what you use it for, your plan, login hints (not passwords)…" />
      <p className="mt-1 h-4 text-xs text-[var(--muted)]" aria-live="polite">
        {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "error" ? "Couldn't save — check your connection" : ""}
      </p>
    </div>
  );
}

export default function SavedPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<SavedTool[] | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setItems(await fetchSavedTools(user.uid));
    } catch {
      setItems([]);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Skeleton className="h-64" />;
  if (!user) {
    return (
      <EmptyState
        title="Your AI library"
        body="Save tools you use or want to try, add private notes, and keep your whole AI stack in one place — on every device."
        action={<LinkButton href="/sign-in?next=/saved">Sign in to start your library</LinkButton>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">My AI library</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Private to you. Notes autosave.</p>
        </div>
        {items && items.length >= 2 && (
          <LinkButton href={`/compare?tools=${items.slice(0, 4).map((i) => i.slug).join(",")}`} variant="secondary">Compare saved</LinkButton>
        )}
      </header>
      {items === null ? (
        <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : items.length === 0 ? (
        <EmptyState title="Nothing saved yet" body="Tap Save on any tool page to keep it here with your own notes." action={<LinkButton href="/tasks">Find tools by task</LinkButton>} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <li key={item.slug} className="rounded-2xl border border-[var(--line)] bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Link href={`/tools/${item.slug}`} className="flex items-center gap-3 font-display font-semibold hover:text-[var(--trust-strong)]">
                  <ToolLogo name={item.name} size={36} />{item.name}
                </Link>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await toggleToolSave(user.uid, { slug: item.slug, name: item.name });
                      setItems((list) => (list ?? []).filter((x) => x.slug !== item.slug));
                    } catch {
                      // Leave it in place; the user can retry.
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
              <NoteEditor uid={user.uid} item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
