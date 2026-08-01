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
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
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
  UserProfile,
} from "./types";
import type { DemandPostInput } from "./schemas";
import { CATEGORIES } from "./categories";

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

export async function countUnreadNotifications(uid: string): Promise<number> {
  const snap = await getDocs(
    query(collection(db(), "users", uid, "notifications"), where("read", "==", false), limit(100)),
  );
  return snap.size;
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

export async function fetchPostsForSearch(): Promise<DemandPost[]> {
  const snap = await getDocs(
    query(collection(db(), "demandPosts"), where("status", "==", "active"), orderBy("createdAt", "desc"), limit(300)),
  );
  return snap.docs.map(postFromSnap);
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

export async function fetchCategoryStats(): Promise<CategoryStat[]> {
  const snap = await getDocs(
    query(collection(db(), "demandPosts"), where("status", "==", "active"), limit(1000)),
  );
  const byCategory = new Map<string, CategoryStat>();
  for (const c of CATEGORIES) {
    byCategory.set(c, { category: c, demandPosts: 0, totalVotes: 0, claims: 0, gapScore: 0 });
  }
  for (const s of snap.docs) {
    const p = postFromSnap(s);
    const stat = byCategory.get(p.category);
    if (!stat) continue;
    stat.demandPosts += 1;
    stat.totalVotes += p.voteCount;
    stat.claims += p.claimCount;
  }
  const stats = Array.from(byCategory.values());
  for (const s of stats) {
    s.gapScore = s.demandPosts === 0 ? 0 : (s.demandPosts + s.totalVotes) / (s.claims + 1);
  }
  return stats.sort((a, b) => b.gapScore - a.gapScore);
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
