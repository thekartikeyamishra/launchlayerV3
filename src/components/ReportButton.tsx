// File: src/components/ReportButton.tsx
// Purpose: Report inappropriate content; feeds the admin moderation queue.

"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { reportContent } from "@/lib/db";
import { reportSchema } from "@/lib/schemas";
import { logEvent } from "@/lib/analytics";
import type { Report } from "@/lib/types";
import { Button, TextArea, Field, ErrorNote } from "./ui";

export default function ReportButton({
  targetType,
  targetPath,
  targetLabel,
}: {
  targetType: Report["targetType"];
  targetPath: string;
  targetLabel: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  if (done) return <p className="text-xs text-[var(--trust-strong)]">Report received. Our moderation queue will review it.</p>;

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-xs text-[var(--muted)] underline-offset-2 hover:underline">
          Report this {targetType === "demandPost" ? "post" : targetType}
        </button>
      ) : (
        <form
          className="mt-2 max-w-md space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const parsed = reportSchema.safeParse({ reason });
            if (!parsed.success) {
              setError(parsed.error.issues[0]?.message ?? "Check the report reason.");
              return;
            }
            setBusy(true);
            try {
              await reportContent(user.uid, targetType, targetPath, targetLabel, parsed.data.reason);
              logEvent("content.reported.v1", { targetType });
              setDone(true);
            } catch {
              setError("The report couldn't be sent. Check your connection and try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="What's wrong with this content?" htmlFor="report-reason" error={error || undefined}>
            <TextArea id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
          </Field>
          {error && !reason && <ErrorNote message={error} />}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send report"}</Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}
