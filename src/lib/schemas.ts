// File: src/lib/schemas.ts
// Purpose: Zod validation schemas shared by every form (single validation source).

import { z } from "zod";
import { CATEGORIES } from "./categories";
import { TOOL_CATEGORIES } from "./directory-types";

export const demandPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, "Give your request a clear title (at least 8 characters).")
    .max(120, "Keep the title under 120 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Describe what you need in at least 20 characters.")
    .max(4000, "Keep the description under 4,000 characters."),
  category: z.enum(CATEGORIES, { message: "Choose a category." }),
  budgetBand: z.enum(["unspecified", "under_5k", "5k_25k", "25k_1l", "above_1l"]),
  urgency: z.enum(["exploring", "this_quarter", "urgent"]),
  tags: z.array(z.string().trim().min(1).max(30)).max(6, "Up to 6 tags."),
});

export type DemandPostInput = z.infer<typeof demandPostSchema>;

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Write a comment first.").max(2000, "Keep comments under 2,000 characters."),
});

export const claimSchema = z.object({
  title: z.string().trim().min(3, "Name your solution.").max(120),
  description: z.string().trim().max(1000, "Keep it under 1,000 characters."),
  listingUrl: z
    .string()
    .trim()
    .url("Enter a full URL, starting with https://")
    .refine((u) => u.startsWith("https://"), "Links must use https://"),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Passwords are at least 8 characters."),
});

export const reportSchema = z.object({
  reason: z.string().trim().min(10, "Tell us what's wrong (at least 10 characters).").max(1000),
});

const TOOL_CATEGORY_SLUGS = TOOL_CATEGORIES.map((c) => c.slug) as [string, ...string[]];

export const toolSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Enter the tool's name.").max(60),
  url: z
    .string()
    .trim()
    .url("Enter the full website address, starting with https://")
    .refine((u) => u.startsWith("https://"), "The website must use https://"),
  tagline: z.string().trim().min(10, "Describe it in one line (at least 10 characters).").max(120),
  description: z
    .string()
    .trim()
    .min(60, "Explain what it does and who it's for (at least 60 characters).")
    .max(1200),
  category: z.enum(TOOL_CATEGORY_SLUGS, { message: "Choose a category." }),
  pricing: z.enum(["free", "freemium", "paid", "free-trial"]),
  isMaker: z.boolean(),
});

export type ToolSubmissionInput = z.infer<typeof toolSubmissionSchema>;

export const toolReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  usedFor: z.string().trim().min(10, "Tell others what you used it for (at least 10 characters).").max(200),
  pros: z.string().trim().max(500),
  cons: z.string().trim().max(500),
});

export type ToolReviewInput = z.infer<typeof toolReviewSchema>;
