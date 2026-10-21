// File: src/lib/roles.ts
// Purpose: Staff roles and what each may do. UI gating only — firestore.rules is the real lock.

export const STAFF_ROLES = ["superadmin", "admin", "moderator", "editor", "analyst"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_INFO: Record<StaffRole, { label: string; summary: string }> = {
  superadmin: { label: "Super admin", summary: "Everything, plus managing the team" },
  admin: { label: "Admin", summary: "All moderation, listings, creator approvals and user lookup" },
  moderator: { label: "Moderator", summary: "Reports, reviews, comments, demand posts, submissions" },
  editor: { label: "Editor", summary: "Tool submissions and listings" },
  analyst: { label: "Analyst", summary: "Read-only platform health dashboard" },
};

export type Permission = "dashboard" | "submissions" | "reports" | "creators" | "users" | "team";

const GRANTS: Record<StaffRole, Permission[]> = {
  superadmin: ["dashboard", "submissions", "reports", "creators", "users", "team"],
  admin: ["dashboard", "submissions", "reports", "creators", "users"],
  moderator: ["dashboard", "submissions", "reports"],
  editor: ["dashboard", "submissions"],
  analyst: ["dashboard"],
};

export function can(role: StaffRole | null, p: Permission): boolean {
  return role !== null && GRANTS[role].includes(p);
}

export function asRole(v: unknown): StaffRole | null {
  return typeof v === "string" && (STAFF_ROLES as readonly string[]).includes(v) ? (v as StaffRole) : null;
}
