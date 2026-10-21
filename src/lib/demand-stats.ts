// File: src/lib/demand-stats.ts
// Purpose: Pure demand-board aggregation shared by server and client (no Firebase imports).

import { CATEGORIES } from "./categories";
import type { CategoryStat } from "./types";

export function computeCategoryStats(posts: Array<{ category: string; voteCount: number; claimCount: number }>): CategoryStat[] {
  const byCategory = new Map<string, CategoryStat>();
  for (const c of CATEGORIES) byCategory.set(c, { category: c, demandPosts: 0, totalVotes: 0, claims: 0, gapScore: 0 });
  for (const p of posts) {
    const stat = byCategory.get(p.category);
    if (!stat) continue;
    stat.demandPosts += 1;
    stat.totalVotes += p.voteCount;
    stat.claims += p.claimCount;
  }
  const stats = Array.from(byCategory.values());
  for (const s of stats) s.gapScore = s.demandPosts === 0 ? 0 : (s.demandPosts + s.totalVotes) / (s.claims + 1);
  return stats.sort((a, b) => b.gapScore - a.gapScore);
}
