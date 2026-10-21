// File: src/lib/demand-server.ts
// Purpose: Server-side, cached reads of the public demand board via the Firestore REST API.
// Cost: one batched read per cache window per server region, instead of hundreds of document
// reads per visitor. This is the single biggest lever on our Firestore bill.

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

type V = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  arrayValue?: { values?: V[] };
};

export interface PublicPost {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetBand: string;
  urgency: string;
  tags: string[];
  authorId: string;
  authorName: string;
  status: string;
  voteCount: number;
  followCount: number;
  commentCount: number;
  claimCount: number;
  createdAt: { seconds: number; nanoseconds: number } | null;
  updatedAt: { seconds: number; nanoseconds: number } | null;
}

const num = (v?: V) => Number(v?.integerValue ?? v?.doubleValue ?? 0);
const ts = (v?: V) => {
  if (!v?.timestampValue) return null;
  const ms = Date.parse(v.timestampValue);
  return Number.isNaN(ms) ? null : { seconds: Math.floor(ms / 1000), nanoseconds: 0 };
};

export async function fetchActivePosts(max: number, revalidate: number): Promise<PublicPost[]> {
  if (!PROJECT_ID || !API_KEY) return [];
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "demandPosts" }],
            where: { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "active" } } },
            orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
            limit: max,
          },
        }),
        next: { revalidate },
      },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ document?: { name?: string; fields?: Record<string, V> } }>;
    const out: PublicPost[] = [];
    for (const r of rows) {
      const f = r.document?.fields;
      const id = r.document?.name?.split("/").pop();
      if (!f || !id) continue;
      out.push({
        id,
        title: f.title?.stringValue ?? "",
        description: f.description?.stringValue ?? "",
        category: f.category?.stringValue ?? "",
        budgetBand: f.budgetBand?.stringValue ?? "unspecified",
        urgency: f.urgency?.stringValue ?? "exploring",
        tags: (f.tags?.arrayValue?.values ?? []).map((x) => x.stringValue ?? "").filter(Boolean),
        authorId: f.authorId?.stringValue ?? "",
        authorName: f.authorName?.stringValue ?? "",
        status: "active",
        voteCount: num(f.voteCount),
        followCount: num(f.followCount),
        commentCount: num(f.commentCount),
        claimCount: num(f.claimCount),
        createdAt: ts(f.createdAt),
        updatedAt: ts(f.updatedAt),
      });
    }
    return out;
  } catch {
    return [];
  }
}
