// File: src/lib/types.ts
// Purpose: Shared domain types for the LaunchLayer v1 Demand Board.

import type { Timestamp } from "firebase/firestore";

export type Urgency = "exploring" | "this_quarter" | "urgent";
export type BudgetBand = "unspecified" | "under_5k" | "5k_25k" | "25k_1l" | "above_1l";
export type PostStatus = "active" | "removed";

export interface UserProfile {
  displayName: string;
  verifiedCreator: boolean;
  verifiedCreatorRequest: "none" | "pending";
  createdAt: Timestamp | null;
}

export interface DemandPost {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetBand: BudgetBand;
  urgency: Urgency;
  tags: string[];
  authorId: string;
  authorName: string;
  status: PostStatus;
  voteCount: number;
  followCount: number;
  commentCount: number;
  claimCount: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface DemandComment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: Timestamp | null;
}

export interface DemandClaim {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  listingUrl: string;
  createdAt: Timestamp | null;
}

export interface Report {
  id: string;
  targetType: "demandPost" | "comment" | "claim" | "tool";
  targetPath: string;
  targetLabel: string;
  reason: string;
  reporterId: string;
  status: "open" | "resolved";
  createdAt: Timestamp | null;
}

export interface CategoryStat {
  category: string;
  demandPosts: number;
  totalVotes: number;
  claims: number;
  gapScore: number;
}

export interface AppNotification {
  id: string;
  type: "claim" | "comment";
  postId: string;
  postTitle: string;
  actorName: string;
  read: boolean;
  createdAt: Timestamp | null;
}

export interface ToolReview {
  id: string;
  toolSlug: string;
  authorId: string;
  authorName: string;
  rating: number;
  usedFor: string;
  pros: string;
  cons: string;
  createdAt: Timestamp | null;
}

export interface SavedTool {
  slug: string;
  name: string;
  note: string;
  createdAt: Timestamp | null;
}

export interface ToolSubmission {
  id: string;
  submitterId: string;
  submitterName: string;
  name: string;
  url: string;
  tagline: string;
  description: string;
  category: string;
  pricing: string;
  isMaker: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp | null;
}
