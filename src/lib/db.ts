// File: src/lib/db.ts
// Purpose: All Firestore reads/writes for the v1 Demand Board (data-access layer).
// Security: every operation is enforced server-side by firestore.rules.
// Performance: keyset pagination on lists; transactions for counter integrity.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getCountFromServer,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  type DocumentSnapshot,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  AppNotification,
  CategoryStat,
  DemandClaim,
  DemandComment,
  DemandPost,
  Report,
  SavedTool,
  ToolReview,
  ToolSubmission,
  UserProfile,
} from "./types";
import { asRole, type StaffRole } from "./roles";
import type { DemandPostInput, ToolReviewInput, ToolSubmissionInput } from "./schemas";

const PAGE_SIZE = 20;

function postFromSnap(snap: DocumentSnapshot): DemandPost {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    title: String(d.title ?? ""),
    description: String(d.description ?? ""),
    category: String(d.category ?? ""),
    budgetBand: (d.budgetBand ?? "unspecified") as DemandPost["budgetBand"],
    urgency: (d.urgency ?? "exploring") as DemandPost["urgency"],
    tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
    authorId: String(d.authorId ?? ""),
    authorName: String(d.authorName ?? ""),
    status: (d.status ?? "active") as DemandPost["status"],
    voteCount: Number(d.voteCount ?? 0),
    followCount: Number(d.followCount ?? 0),
    commentCount: Number(d.commentCount ?? 0),
    claimCount: Number(d.claimCount ?? 0),
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
  };
}

// ---------- users ----------

export async function ensureUserProfile(uid: string, displayName: string): Promise<void> {
  const ref = doc(db(), "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName,
      verifiedCreator: false,
      verifiedCreatorRequest: "none",
      createdAt: serverTimestamp(),
    });
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db(), "users", uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    displayName: String(d.displayName ?? ""),
    verifiedCreator: Boolean(d.verifiedCreator),
    verifiedCreatorRequest: (d.verifiedCreatorRequest ?? "none") as UserProfile["verifiedCreatorRequest"],
    createdAt: d.createdAt ?? null,
  };
}

export async function requestVerifiedCreator(uid: string): Promise<void> {
  await updateDoc(doc(db(), "users", uid), { verifiedCreatorRequest: "pending" });
}

export async function isAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db(), "admins", uid));
    return snap.exists();
  } catch {
    return false;
  }
}

// ---------- demand posts ----------

export async function createDemandPost(
  input: DemandPostInput,
  authorId: string,
  authorName: string,
): Promise<string> {
  const ref = await addDoc(collection(db(), "demandPosts"), {
    ...input,
    authorId,
    authorName,
    status: "active",
    voteCount: 0,
    followCount: 0,
    commentCount: 0,
    claimCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export interface PostPage {
  posts: DemandPost[];
  cursor: DocumentSnapshot | null;
  hasMore: boolean;
}

export async function fetchDemandPosts(opts: {
  category?: string;
  sort: "trending" | "new";
  cursor?: DocumentSnapshot | null;
}): Promise<PostPage> {
  const constraints: QueryConstraint[] = [where("status", "==", "active")];
  if (opts.category) constraints.push(where("category", "==", opts.category));
  constraints.push(
    opts.sort === "trending" ? orderBy("voteCount", "desc") : orderBy("createdAt", "desc"),
  );
  if (opts.cursor) constraints.push(startAfter(opts.cursor));
  constraints.push(limit(PAGE_SIZE + 1));

  const snap = await getDocs(query(collection(db(), "demandPosts"), ...constraints));
  const docs = snap.docs.slice(0, PAGE_SIZE);
  return {
    posts: docs.map(postFromSnap),
    cursor: docs.length > 0 ? (docs[docs.length - 1] ?? null) : null,
    hasMore: snap.docs.length > PAGE_SIZE,
  };
}

export async function fetchDemandPost(id: string): Promise<DemandPost | null> {
  const snap = await getDoc(doc(db(), "demandPosts", id));
  return snap.exists() ? postFromSnap(snap) : null;
}

export async function fetchMyPosts(uid: string): Promise<DemandPost[]> {
  const snap = await getDocs(
    query(collection(db(), "demandPosts"), where("authorId", "==", uid), orderBy("createdAt", "desc"), limit(50)),
  );
  return snap.docs.map(postFromSnap);
}

// ---------- votes & follows (idempotent toggles via transactions) ----------

async function toggleMembership(
  postId: string,
  sub: "votes" | "follows",
  counterField: "voteCount" | "followCount",
  uid: string,
): Promise<boolean> {
  const database = db();
  const postRef = doc(database, "demandPosts", postId);
  const memberRef = doc(database, "demandPosts", postId, sub, uid);
  return runTransaction(database, async (tx) => {
    const member = await tx.get(memberRef);
    if (member.exists()) {
      tx.delete(memberRef);
      tx.update(postRef, { [counterField]: increment(-1), updatedAt: serverTimestamp() });
      return false;
    }
    tx.set(memberRef, { createdAt: serverTimestamp() });
    tx.update(postRef, { [counterField]: increment(1), updatedAt: serverTimestamp() });
    return true;
  });
}

export function toggleVote(postId: string, uid: string): Promise<boolean> {
  return toggleMembership(postId, "votes", "voteCount", uid);
}

export function toggleFollow(postId: string, uid: string): Promise<boolean> {
  return toggleMembership(postId, "follows", "followCount", uid);
}

export async function hasMembership(postId: string, sub: "votes" | "follows", uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db(), "demandPosts", postId, sub, uid));
  return snap.exists();
}

// ---------- comments ----------

export async function fetchComments(postId: string): Promise<DemandComment[]> {
  const snap = await getDocs(
    query(collection(db(), "demandPosts", postId, "comments"), orderBy("createdAt", "asc"), limit(200)),
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      authorId: String(d.authorId ?? ""),
      authorName: String(d.authorName ?? ""),
      body: String(d.body ?? ""),
      createdAt: d.createdAt ?? null,
    };
  });
}

export async function addComment(
  post: { id: string; authorId: string; title: string },
  uid: string,
  authorName: string,
  body: string,
): Promise<void> {
  const database = db();
  await addDoc(collection(database, "demandPosts", post.id, "comments"), {
    authorId: uid,
    authorName,
    body,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(database, "demandPosts", post.id), {
    commentCount: increment(1),
    updatedAt: serverTimestamp(),
  });
  await notifyPostAuthor(post, uid, authorName, "comment");
}

// ---------- claims ----------

export async function fetchClaims(postId: string): Promise<DemandClaim[]> {
  const snap = await getDocs(
    query(collection(db(), "demandPosts", postId, "claims"), orderBy("createdAt", "desc"), limit(100)),
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      creatorId: String(d.creatorId ?? ""),
      creatorName: String(d.creatorName ?? ""),
      title: String(d.title ?? ""),
      description: String(d.description ?? ""),
      listingUrl: String(d.listingUrl ?? ""),
      createdAt: d.createdAt ?? null,
    };
  });
}

export async function addClaim(
  post: { id: string; authorId: string; title: string },
  uid: string,
  creatorName: string,
  input: { title: string; description: string; listingUrl: string },
): Promise<void> {
  const database = db();
  await addDoc(collection(database, "demandPosts", post.id, "claims"), {
    creatorId: uid,
    creatorName,
    ...input,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(database, "demandPosts", post.id), {
    claimCount: increment(1),
    updatedAt: serverTimestamp(),
  });
  await notifyPostAuthor(post, uid, creatorName, "claim");
}

// ---------- in-app notifications ----------

async function notifyPostAuthor(
  post: { id: string; authorId: string; title: string },
  actorUid: string,
  actorName: string,
  type: "claim" | "comment",
): Promise<void> {
  if (post.authorId === actorUid) return; // never notify yourself
  try {
    await addDoc(collection(db(), "users", post.authorId, "notifications"), {
      type,
      postId: post.id,
      postTitle: post.title,
      actorName,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch {
    // A failed notification must never fail the action itself.
  }
}

export async function fetchNotifications(uid: string): Promise<AppNotification[]> {
  const snap = await getDocs(
    query(collection(db(), "users", uid, "notifications"), orderBy("createdAt", "desc"), limit(20)),
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      type: (d.type ?? "comment") as AppNotification["type"],
      postId: String(d.postId ?? ""),
      postTitle: String(d.postTitle ?? ""),
      actorName: String(d.actorName ?? ""),
      read: Boolean(d.read),
      createdAt: d.createdAt ?? null,
    };
  });
}

/** Count aggregate: billed as 1 read per 1,000 matches instead of 1 read per document. */
export async function countUnreadNotifications(uid: string): Promise<number> {
  const snap = await getCountFromServer(
    query(collection(db(), "users", uid, "notifications"), where("read", "==", false)),
  );
  return snap.data().count;
}

export async function markAllNotificationsRead(uid: string, notes: AppNotification[]): Promise<void> {
  const database = db();
  await Promise.all(
    notes.filter((n) => !n.read).map((n) =>
      updateDoc(doc(database, "users", uid, "notifications", n.id), { read: true }),
    ),
  );
}

// ---------- keyword search (v1: client-side over recent active posts) ----------

/** Recent active posts for keyword search — served from a CDN-cached API, not per-visitor reads. */
export async function fetchPostsForSearch(): Promise<DemandPost[]> {
  const res = await fetch("/api/v1/demand/pool");
  if (!res.ok) throw new Error("pool unavailable");
  const { posts } = (await res.json()) as { posts: Array<Omit<DemandPost, "createdAt" | "updatedAt"> & { createdAt: unknown; updatedAt: unknown }> };
  // Only .seconds is read from these timestamps in the UI (DemandCard), so the plain shape is safe.
  return posts.map((p) => ({ ...p, createdAt: p.createdAt as DemandPost["createdAt"], updatedAt: p.updatedAt as DemandPost["updatedAt"] }) as DemandPost);
}

export function searchPosts(posts: DemandPost[], rawQuery: string): DemandPost[] {
  const tokens = rawQuery.toLowerCase().split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.length === 0) return [];
  return posts
    .map((p) => {
      const haystack = `${p.title} ${p.description} ${p.tags.join(" ")} ${p.category}`.toLowerCase();
      const hits = tokens.filter((t) => haystack.includes(t)).length;
      return { p, score: hits / tokens.length };
    })
    .filter((r) => r.score >= 0.5)
    .sort((a, b) => b.score - a.score || b.p.voteCount - a.p.voteCount)
    .map((r) => r.p);
}

// ---------- admin: user lookup ----------

export async function lookupUsers(term: string): Promise<Array<{ uid: string; profile: UserProfile }>> {
  const results = new Map<string, UserProfile>();
  const byId = await getUserProfile(term).catch(() => null);
  if (byId) results.set(term, byId);
  const snap = await getDocs(query(collection(db(), "users"), where("displayName", "==", term), limit(20)));
  for (const s of snap.docs) {
    const d = s.data();
    results.set(s.id, {
      displayName: String(d.displayName ?? ""),
      verifiedCreator: Boolean(d.verifiedCreator),
      verifiedCreatorRequest: (d.verifiedCreatorRequest ?? "none") as UserProfile["verifiedCreatorRequest"],
      createdAt: d.createdAt ?? null,
    });
  }
  return Array.from(results.entries()).map(([uid, profile]) => ({ uid, profile }));
}

// ---------- reports ----------

export async function reportContent(
  reporterId: string,
  targetType: Report["targetType"],
  targetPath: string,
  targetLabel: string,
  reason: string,
): Promise<void> {
  await addDoc(collection(db(), "reports"), {
    reporterId,
    targetType,
    targetPath,
    targetLabel,
    reason,
    status: "open",
    createdAt: serverTimestamp(),
  });
}

// ---------- opportunity stats (client-side aggregation, v1 scale) ----------

/** Category demand/supply stats — served from a CDN-cached API (one read per 15 min, not per visitor). */
export async function fetchCategoryStats(): Promise<CategoryStat[]> {
  const res = await fetch("/api/v1/demand/stats");
  if (!res.ok) throw new Error("stats unavailable");
  return ((await res.json()) as { stats: CategoryStat[] }).stats;
}

// ---------- admin ----------

export async function fetchOpenReports(): Promise<Report[]> {
  const snap = await getDocs(
    query(collection(db(), "reports"), where("status", "==", "open"), orderBy("createdAt", "desc"), limit(100)),
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      targetType: (d.targetType ?? "demandPost") as Report["targetType"],
      targetPath: String(d.targetPath ?? ""),
      targetLabel: String(d.targetLabel ?? ""),
      reason: String(d.reason ?? ""),
      reporterId: String(d.reporterId ?? ""),
      status: (d.status ?? "open") as Report["status"],
      createdAt: d.createdAt ?? null,
    };
  });
}

export async function resolveReport(reportId: string): Promise<void> {
  await updateDoc(doc(db(), "reports", reportId), { status: "resolved" });
}

export async function removeDemandPost(postId: string): Promise<void> {
  await updateDoc(doc(db(), "demandPosts", postId), { status: "removed", updatedAt: serverTimestamp() });
}

export async function setVerifiedCreator(uid: string, value: boolean): Promise<void> {
  await updateDoc(doc(db(), "users", uid), {
    verifiedCreator: value,
    verifiedCreatorRequest: "none",
  });
}

export async function fetchPendingCreatorRequests(): Promise<Array<{ uid: string; displayName: string }>> {
  const snap = await getDocs(
    query(collection(db(), "users"), where("verifiedCreatorRequest", "==", "pending"), limit(100)),
  );
  return snap.docs.map((s) => ({ uid: s.id, displayName: String(s.data().displayName ?? "") }));
}

export async function deleteOwnUserDoc(uid: string): Promise<void> {
  await deleteDoc(doc(db(), "users", uid));
}

// ---------- AI tools directory: saves (personal library), reviews, submissions ----------

export async function isToolSaved(uid: string, slug: string): Promise<boolean> {
  const snap = await getDoc(doc(db(), "users", uid, "savedTools", slug));
  return snap.exists();
}

/** Toggles a save and keeps the public save counter in step (transaction). Returns new state. */
export async function toggleToolSave(uid: string, tool: { slug: string; name: string }): Promise<boolean> {
  const database = db();
  const savedRef = doc(database, "users", uid, "savedTools", tool.slug);
  const statsRef = doc(database, "toolStats", tool.slug);
  return runTransaction(database, async (tx) => {
    const [saved, stats] = await Promise.all([tx.get(savedRef), tx.get(statsRef)]);
    const current = stats.exists() ? Number(stats.data().saveCount ?? 0) : 0;
    if (saved.exists()) {
      tx.delete(savedRef);
      if (stats.exists() && current > 0) tx.update(statsRef, { saveCount: current - 1 });
      return false;
    }
    tx.set(savedRef, { slug: tool.slug, name: tool.name, note: "", createdAt: serverTimestamp() });
    if (stats.exists()) tx.update(statsRef, { saveCount: current + 1 });
    else tx.set(statsRef, { saveCount: 1 });
    return true;
  });
}

export async function fetchToolSaveCount(slug: string): Promise<number> {
  const snap = await getDoc(doc(db(), "toolStats", slug));
  return snap.exists() ? Number(snap.data().saveCount ?? 0) : 0;
}

export async function fetchSavedTools(uid: string): Promise<SavedTool[]> {
  const snap = await getDocs(
    query(collection(db(), "users", uid, "savedTools"), orderBy("createdAt", "desc"), limit(200)),
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      slug: s.id,
      name: String(d.name ?? s.id),
      note: String(d.note ?? ""),
      createdAt: d.createdAt ?? null,
    };
  });
}

export async function updateSavedToolNote(uid: string, slug: string, note: string): Promise<void> {
  await updateDoc(doc(db(), "users", uid, "savedTools", slug), { note: note.slice(0, 500) });
}

export async function fetchToolReviews(slug: string): Promise<ToolReview[]> {
  const snap = await getDocs(
    query(collection(db(), "toolReviews"), where("toolSlug", "==", slug), orderBy("createdAt", "desc"), limit(100)),
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      toolSlug: String(d.toolSlug ?? ""),
      authorId: String(d.authorId ?? ""),
      authorName: String(d.authorName ?? ""),
      rating: Number(d.rating ?? 0),
      usedFor: String(d.usedFor ?? ""),
      pros: String(d.pros ?? ""),
      cons: String(d.cons ?? ""),
      createdAt: d.createdAt ?? null,
    };
  });
}

/** One review per person per tool — the document id enforces it (see firestore.rules). */
export async function upsertToolReview(
  slug: string,
  uid: string,
  authorName: string,
  input: ToolReviewInput,
): Promise<void> {
  const ref = doc(db(), "toolReviews", `${slug}__${uid}`);
  const existing = await getDoc(ref);
  await setDoc(ref, {
    toolSlug: slug,
    authorId: uid,
    authorName,
    ...input,
    createdAt: existing.exists() ? (existing.data().createdAt ?? serverTimestamp()) : serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function submitTool(uid: string, name: string, input: ToolSubmissionInput): Promise<void> {
  await addDoc(collection(db(), "toolSubmissions"), {
    ...input,
    submitterId: uid,
    submitterName: name,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function fetchPendingSubmissions(): Promise<ToolSubmission[]> {
  const snap = await getDocs(
    query(collection(db(), "toolSubmissions"), where("status", "==", "pending"), orderBy("createdAt", "asc"), limit(100)),
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      submitterId: String(d.submitterId ?? ""),
      submitterName: String(d.submitterName ?? ""),
      name: String(d.name ?? ""),
      url: String(d.url ?? ""),
      tagline: String(d.tagline ?? ""),
      description: String(d.description ?? ""),
      category: String(d.category ?? ""),
      pricing: String(d.pricing ?? ""),
      isMaker: Boolean(d.isMaker),
      status: (d.status ?? "pending") as ToolSubmission["status"],
      createdAt: d.createdAt ?? null,
    };
  });
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Admin: publish a submission as a live community listing. */
export async function approveSubmission(sub: ToolSubmission): Promise<string> {
  const slug = slugify(sub.name) || sub.id;
  const database = db();
  await setDoc(doc(database, "tools", slug), {
    name: sub.name,
    url: sub.url,
    maker: sub.isMaker ? sub.submitterName : "",
    tagline: sub.tagline,
    description: sub.description,
    category: sub.category,
    pricing: sub.pricing,
    tasks: [],
    api: false,
    openSource: false,
    platforms: ["Web"],
    pros: [],
    cons: [],
    bestFor: "",
    reviewedAt: new Date().toISOString().slice(0, 10),
    submissionId: sub.id,
  });
  await updateDoc(doc(database, "toolSubmissions", sub.id), { status: "approved", slug });
  return slug;
}

export async function rejectSubmission(id: string): Promise<void> {
  await updateDoc(doc(db(), "toolSubmissions", id), { status: "rejected" });
}

// ---------- personal data: export + erasure (DPDP Act 2023 / GDPR) ----------

export async function fetchMyReviews(uid: string): Promise<ToolReview[]> {
  const snap = await getDocs(query(collection(db(), "toolReviews"), where("authorId", "==", uid), limit(500)));
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      toolSlug: String(d.toolSlug ?? ""),
      authorId: String(d.authorId ?? ""),
      authorName: String(d.authorName ?? ""),
      rating: Number(d.rating ?? 0),
      usedFor: String(d.usedFor ?? ""),
      pros: String(d.pros ?? ""),
      cons: String(d.cons ?? ""),
      createdAt: d.createdAt ?? null,
    };
  });
}

/** Removes everything personal we can remove client-side: library, notes, notifications, reviews, profile. */
export async function deleteMyPersonalData(uid: string): Promise<void> {
  const database = db();
  const [saved, notes, reviews] = await Promise.all([
    getDocs(query(collection(database, "users", uid, "savedTools"), limit(500))),
    getDocs(query(collection(database, "users", uid, "notifications"), limit(500))),
    getDocs(query(collection(database, "toolReviews"), where("authorId", "==", uid), limit(500))),
  ]);
  await Promise.all([
    ...saved.docs.map((d) => deleteDoc(d.ref)),
    ...notes.docs.map((d) => deleteDoc(d.ref)),
    ...reviews.docs.map((d) => deleteDoc(d.ref)),
  ]);
  await deleteDoc(doc(database, "users", uid));
}

// ---------- staff (admin panel) ----------

export async function fetchStaffRole(uid: string): Promise<StaffRole | null> {
  try {
    const snap = await getDoc(doc(db(), "admins", uid));
    return snap.exists() ? asRole(snap.data().role) : null;
  } catch {
    return null;
  }
}

export interface StaffMember {
  uid: string;
  role: StaffRole;
  username: string;
  email: string;
}

export async function fetchTeam(): Promise<StaffMember[]> {
  const snap = await getDocs(query(collection(db(), "admins"), limit(100)));
  return snap.docs
    .map((s) => {
      const d = s.data();
      const role = asRole(d.role);
      return role ? { uid: s.id, role, username: String(d.username ?? ""), email: String(d.email ?? "") } : null;
    })
    .filter((m): m is StaffMember => m !== null);
}

export async function setStaffRole(uid: string, role: StaffRole, username: string, email: string): Promise<void> {
  await setDoc(doc(db(), "admins", uid), { role, username, email, updatedAt: serverTimestamp() }, { merge: true });
}

export async function removeStaff(uid: string): Promise<void> {
  await deleteDoc(doc(db(), "admins", uid));
}

export interface HealthCounts {
  users: number;
  users7d: number;
  activePosts: number;
  reviews: number;
  communityTools: number;
  pendingSubmissions: number | null;
  openReports: number | null;
  events7d: number;
  signupsByDay: Array<{ day: string; count: number }>;
}

/** Aggregation (count) queries: ~1 billed read per 1,000 matched entries — cheap at any scale. */
export async function fetchHealthCounts(canModerate: boolean, canEdit: boolean): Promise<HealthCounts> {
  const database = db();
  const now = Date.now();
  const since = (days: number) => Timestamp.fromMillis(now - days * 86400_000);
  const c = async (q: Parameters<typeof getCountFromServer>[0]) => {
    try {
      return (await getCountFromServer(q)).data().count;
    } catch {
      return 0;
    }
  };
  const days = Array.from({ length: 14 }, (_, i) => 13 - i);
  const [users, users7d, activePosts, reviews, communityTools, pendingSubmissions, openReports, events7d, ...signups] = await Promise.all([
    c(collection(database, "users")),
    c(query(collection(database, "users"), where("createdAt", ">=", since(7)))),
    c(query(collection(database, "demandPosts"), where("status", "==", "active"))),
    c(collection(database, "toolReviews")),
    c(collection(database, "tools")),
    canEdit || canModerate ? c(query(collection(database, "toolSubmissions"), where("status", "==", "pending"))) : Promise.resolve(-1),
    canModerate ? c(query(collection(database, "reports"), where("status", "==", "open"))) : Promise.resolve(-1),
    c(query(collection(database, "events"), where("createdAt", ">=", since(7)))),
    ...days.map((d) => {
      const start = new Date(now - d * 86400_000);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 86400_000);
      return c(query(collection(database, "users"), where("createdAt", ">=", Timestamp.fromDate(start)), where("createdAt", "<", Timestamp.fromDate(end))));
    }),
  ]);
  return {
    users,
    users7d,
    activePosts,
    reviews,
    communityTools,
    pendingSubmissions: pendingSubmissions === -1 ? null : pendingSubmissions,
    openReports: openReports === -1 ? null : openReports,
    events7d,
    signupsByDay: days.map((d, i) => {
      const day = new Date(now - d * 86400_000);
      return { day: day.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), count: signups[i] ?? 0 };
    }),
  };
}

// ---------- penalties: suspensions (moderators) ----------

export interface Suspension {
  reason: string;
  by: string;
  createdAt: Timestamp | null;
}

export async function getSuspension(uid: string): Promise<Suspension | null> {
  try {
    const snap = await getDoc(doc(db(), "suspensions", uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return { reason: String(d.reason ?? ""), by: String(d.by ?? ""), createdAt: d.createdAt ?? null };
  } catch {
    return null;
  }
}

export async function suspendUser(uid: string, reason: string, byUid: string): Promise<void> {
  await setDoc(doc(db(), "suspensions", uid), { reason: reason.trim().slice(0, 500), by: byUid, createdAt: serverTimestamp() });
}

export async function liftSuspension(uid: string): Promise<void> {
  await deleteDoc(doc(db(), "suspensions", uid));
}
