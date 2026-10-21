// File: src/components/SuspendControl.tsx
// Purpose: Penalty control for moderators — suspend (with a recorded reason) or lift a suspension.
// Enforced by firestore.rules (suspensions/{uid}); suspended users can still read and export/delete their data.

"use client";

import { useEffect, useState } from "react";
import { getSuspension, liftSuspension, suspendUser, type Suspension } from "@/lib/db";
import { Button, TextInput } from "./ui";

export default function SuspendControl({ uid, actorUid }: { uid: string; actorUid: string }) {
  const [state, setState] = useState<Suspension | null | undefined>(undefined);
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void getSuspension(uid).then(setState);
  }, [uid]);

  if (state === undefined) return null;
  if (uid === actorUid) return <span className="text-xs text-[var(--muted)]">(you)</span>;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      setState(await getSuspension(uid));
      setOpen(false);
      setReason("");
    } catch {
      setError("Action failed — check your role.");
    } finally {
      setBusy(false);
    }
  };

  if (state) {
    return (
      <div className="text-right">
        <p className="text-xs font-semibold text-red-700">Suspended: {state.reason}</p>
        <Button variant="secondary" disabled={busy} onClick={() => void run(() => liftSuspension(uid))}>Lift suspension</Button>
        {error && <p className="text-xs text-red-700">{error}</p>}
      </div>
    );
  }
  return open ? (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (reason.trim().length < 5) return setError("Give a reason (5+ characters) — it's shown to the user and kept for appeals.");
        void run(() => suspendUser(uid, reason, actorUid));
      }}
    >
      <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (fake reviews, spam…)" maxLength={500} aria-label="Suspension reason" />
      <Button variant="danger" type="submit" disabled={busy}>Confirm</Button>
      <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button>
      {error && <p className="w-full text-xs text-red-700">{error}</p>}
    </form>
  ) : (
    <Button variant="danger" onClick={() => setOpen(true)}>Suspend</Button>
  );
}
