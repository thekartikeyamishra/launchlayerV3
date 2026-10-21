// File: src/components/AdminTeam.tsx
// Purpose: Super-admin team management — grant, change and revoke staff roles.
// Rules prevent a super admin from changing or removing their own role (no accidental lock-out).

"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchTeam, removeStaff, setStaffRole, type StaffMember } from "@/lib/db";
import { ROLE_INFO, STAFF_ROLES, type StaffRole } from "@/lib/roles";
import { Button, ErrorNote, Field, Select, Skeleton, TextInput } from "./ui";

export default function AdminTeam({ selfUid }: { selfUid: string }) {
  const [team, setTeam] = useState<StaffMember[] | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ uid: "", username: "", email: "", role: "moderator" as StaffRole });

  const load = useCallback(async () => {
    try {
      setTeam(await fetchTeam());
    } catch {
      setError("Team couldn't load. Deploy the latest firestore.rules.");
      setTeam([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (uid: string, role: StaffRole, username: string, email: string) => {
    setError("");
    try {
      await setStaffRole(uid, role, username, email);
      await load();
    } catch {
      setError("That change was refused. Only super admins can manage the team, and nobody can change their own role.");
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-lg font-bold">Team & permissions</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {STAFF_ROLES.map((r) => (
            <li key={r} className="rounded-xl border border-[var(--line)] bg-white p-3"><p className="font-semibold">{ROLE_INFO[r].label}</p><p className="text-[var(--muted)]">{ROLE_INFO[r].summary}</p></li>
          ))}
        </ul>
      </section>

      {error && <ErrorNote message={error} />}

      <section className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
        {team === null ? (
          <Skeleton className="m-4 h-24" />
        ) : (
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--bg)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr><th className="px-4 py-2.5">Member</th><th className="px-4 py-2.5">Role</th><th className="px-4 py-2.5"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {team.map((m) => (
                <tr key={m.uid}>
                  <td className="px-4 py-3"><p className="font-medium">{m.username ? `@${m.username.replace(/^@/, "")}` : "—"}</p><p className="text-xs text-[var(--muted)]">{m.email || m.uid}</p></td>
                  <td className="px-4 py-3">
                    {m.uid === selfUid ? (
                      <span className="font-medium">{ROLE_INFO[m.role].label} (you)</span>
                    ) : (
                      <Select aria-label={`Role for ${m.username || m.uid}`} value={m.role} onChange={(e) => void save(m.uid, e.target.value as StaffRole, m.username, m.email)}>
                        {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_INFO[r].label}</option>)}
                      </Select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.uid !== selfUid && (
                      <Button variant="danger" onClick={async () => {
                        if (!window.confirm(`Remove ${m.username || m.uid} from the team?`)) return;
                        try { await removeStaff(m.uid); await load(); } catch { setError("Removal was refused."); }
                      }}>Remove</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <form
        className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (form.uid.trim().length < 10) return setError("Paste the person's Firebase UID (Authentication → Users). They must sign up first.");
          void save(form.uid.trim(), form.role, form.username.trim(), form.email.trim()).then(() => setForm({ uid: "", username: "", email: "", role: "moderator" }));
        }}
      >
        <h3 className="font-display font-semibold">Add a team member</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Firebase UID" htmlFor="t-uid"><TextInput id="t-uid" value={form.uid} onChange={(e) => setForm({ ...form, uid: e.target.value })} required /></Field>
          <Field label="Role" htmlFor="t-role">
            <Select id="t-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}>
              {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_INFO[r].label}</option>)}
            </Select>
          </Field>
          <Field label="Username" htmlFor="t-user"><TextInput id="t-user" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
          <Field label="Email (for your records)" htmlFor="t-email"><TextInput id="t-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        </div>
        <Button type="submit">Grant role</Button>
        <p className="text-xs text-[var(--muted)]">Give people the lowest role that lets them do their job. Remove access the day someone leaves.</p>
      </form>
    </div>
  );
}
