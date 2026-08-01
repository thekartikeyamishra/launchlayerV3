// File: src/app/admin/page.tsx
// Purpose: Admin-lite — moderation queue, takedowns, Verified Creator approvals (Ch. 17.4 [v1]).
// Security: UI-gated by admin flag; enforced server-side by firestore.rules (admins collection).

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchOpenReports,
  fetchPendingCreatorRequests,
  lookupUsers,
  removeDemandPost,
  resolveReport,
  setVerifiedCreator,
} from "@/lib/db";
import type { Report, UserProfile } from "@/lib/types";
import { Button, EmptyState, ErrorNote, Skeleton, TextInput, VerifiedBadge } from "@/components/ui";

export default function AdminPage() {
  const { user, admin, loading } = useAuth();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [requests, setRequests] = useState<Array<{ uid: string; displayName: string }> | null>(null);
  const [error, setError] = useState("");
  const [lookupTerm, setLookupTerm] = useState("");
  const [lookupResults, setLookupResults] = useState<Array<{ uid: string; profile: UserProfile }> | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, q] = await Promise.all([fetchOpenReports(), fetchPendingCreatorRequests()]);
      setReports(r);
      setRequests(q);
    } catch {
      setError("Admin data couldn't load. Confirm your account is in the admins collection.");
      setReports([]);
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    if (admin) void load();
  }, [admin, load]);

  if (loading) return <Skeleton className="h-96" />;
  if (!user || !admin) {
    return (
      <EmptyState
        title="Admin access required"
        body="This console is limited to platform administrators. Admin membership is granted manually in the Firebase console (admins collection)."
      />
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold">Admin console</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Every action here is permanent for users — act with a reason, not a mood.
        </p>
      </div>

      {error && <ErrorNote message={error} />}

      <section aria-labelledby="reports-heading">
        <h2 id="reports-heading" className="font-display text-lg font-bold">
          Open reports <span className="text-[var(--muted)]">({reports?.length ?? "…"})</span>
        </h2>
        {reports === null ? (
          <Skeleton className="mt-3 h-32" />
        ) : reports.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">The moderation queue is clear.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-xl border border-[var(--line)] bg-white p-4 text-sm">
                <p className="font-semibold">{r.targetLabel || r.targetPath}</p>
                <p className="mt-1 text-[var(--muted)]">Reason: {r.reason}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Target: {r.targetPath}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.targetType === "demandPost" && (
                    <>
                      <Link
                        href={`/demand/${r.targetPath.split("/")[1] ?? ""}`}
                        className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm font-medium hover:border-[var(--trust)]"
                      >
                        View post
                      </Link>
                      <Button
                        variant="danger"
                        onClick={async () => {
                          const postId = r.targetPath.split("/")[1];
                          if (!postId) return;
                          if (!window.confirm("Remove this post from the board? It stays in the database with status 'removed' for the audit trail.")) return;
                          try {
                            await removeDemandPost(postId);
                            await resolveReport(r.id);
                            await load();
                          } catch {
                            setError("Takedown failed. Try again.");
                          }
                        }}
                      >
                        Take down post
                      </Button>
                    </>
                  )}
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await resolveReport(r.id);
                        await load();
                      } catch {
                        setError("Resolving failed. Try again.");
                      }
                    }}
                  >
                    Resolve — no action
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="creator-requests-heading">
        <h2 id="creator-requests-heading" className="font-display text-lg font-bold">
          Verified Creator applications <span className="text-[var(--muted)]">({requests?.length ?? "…"})</span>
        </h2>
        {requests === null ? (
          <Skeleton className="mt-3 h-24" />
        ) : requests.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">No pending applications.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {requests.map((q) => (
              <li key={q.uid} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white p-4 text-sm">
                <div>
                  <p className="font-semibold">{q.displayName || "Unnamed user"}</p>
                  <p className="text-xs text-[var(--muted)]">uid: {q.uid}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      try { await setVerifiedCreator(q.uid, true); await load(); }
                      catch { setError("Approval failed. Try again."); }
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try { await setVerifiedCreator(q.uid, false); await load(); }
                      catch { setError("Decline failed. Try again."); }
                    }}
                  >
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="lookup-heading">
        <h2 id="lookup-heading" className="font-display text-lg font-bold">User lookup</h2>
        <form
          className="mt-3 flex max-w-md gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const term = lookupTerm.trim();
            if (!term) return;
            try {
              setLookupResults(await lookupUsers(term));
            } catch {
              setError("Lookup failed. Try again.");
            }
          }}
        >
          <TextInput
            aria-label="User ID or exact display name"
            placeholder="UID or exact display name"
            value={lookupTerm}
            onChange={(e) => setLookupTerm(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>
        {lookupResults !== null && (
          lookupResults.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">No user found for that UID or display name.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {lookupResults.map(({ uid, profile }) => (
                <li key={uid} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white p-4 text-sm">
                  <div>
                    <p className="flex items-center gap-2 font-semibold">
                      {profile.displayName || "Unnamed user"}
                      {profile.verifiedCreator && <VerifiedBadge />}
                    </p>
                    <p className="text-xs text-[var(--muted)]">uid: {uid}</p>
                  </div>
                  <Button
                    variant={profile.verifiedCreator ? "danger" : "secondary"}
                    onClick={async () => {
                      try {
                        await setVerifiedCreator(uid, !profile.verifiedCreator);
                        setLookupResults(await lookupUsers(lookupTerm.trim()));
                      } catch {
                        setError("Badge change failed. Try again.");
                      }
                    }}
                  >
                    {profile.verifiedCreator ? "Revoke badge" : "Grant Verified Creator"}
                  </Button>
                </li>
              ))}
            </ul>
          )
        )}
      </section>
    </div>
  );
}
