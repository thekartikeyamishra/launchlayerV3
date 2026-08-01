// File: src/lib/site.ts
// Purpose: Canonical site URL + server-side public reads over the Firestore REST API
// (used by sitemap and per-post metadata; reads are public per firestore.rules).

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://launchlayer.example.com").replace(/\/$/, "");

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

interface RestDoc {
  name?: string;
  fields?: Record<string, { stringValue?: string; integerValue?: string; timestampValue?: string }>;
}

export interface PublicPostMeta {
  id: string;
  title: string;
  description: string;
  category: string;
  voteCount: number;
  status: string;
  updatedAt: string | null;
}

function docToMeta(doc: RestDoc): PublicPostMeta | null {
  const f = doc.fields;
  const id = doc.name?.split("/").pop();
  if (!f || !id) return null;
  return {
    id,
    title: f.title?.stringValue ?? "",
    description: f.description?.stringValue ?? "",
    category: f.category?.stringValue ?? "",
    voteCount: Number(f.voteCount?.integerValue ?? 0),
    status: f.status?.stringValue ?? "active",
    updatedAt: f.updatedAt?.timestampValue ?? null,
  };
}

export async function fetchPostMeta(id: string): Promise<PublicPostMeta | null> {
  if (!PROJECT_ID || !API_KEY) return null;
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/demandPosts/${encodeURIComponent(id)}?key=${API_KEY}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const meta = docToMeta((await res.json()) as RestDoc);
    return meta && meta.status === "active" ? meta : null;
  } catch {
    return null;
  }
}

export async function fetchRecentPostMetas(max = 500): Promise<PublicPostMeta[]> {
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
            where: {
              fieldFilter: {
                field: { fieldPath: "status" },
                op: "EQUAL",
                value: { stringValue: "active" },
              },
            },
            orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
            limit: max,
          },
        }),
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ document?: RestDoc }>;
    return rows
      .map((r) => (r.document ? docToMeta(r.document) : null))
      .filter((m): m is PublicPostMeta => m !== null);
  } catch {
    return [];
  }
}
