// File: src/lib/directory-types.ts
// Purpose: Types for the AI tools directory (server + client safe — no Firebase imports).

export type PricingModel = "free" | "freemium" | "paid" | "free-trial";

export const TOOL_CATEGORIES = [
  { slug: "chat-assistants", name: "Chat Assistants", blurb: "General-purpose assistants you talk to in plain language." },
  { slug: "writing", name: "Writing & Editing", blurb: "Drafting, rewriting, grammar and tone." },
  { slug: "image-generation", name: "Image Generation", blurb: "Create and edit images from text prompts." },
  { slug: "video", name: "Video", blurb: "Generate, edit, clip and dub video." },
  { slug: "audio-voice", name: "Audio & Voice", blurb: "Transcription, text-to-speech, voice and music." },
  { slug: "coding", name: "Coding & App Building", blurb: "AI pair programmers and prompt-to-app builders." },
  { slug: "research", name: "Research & Search", blurb: "Answers with sources, papers and document Q&A." },
  { slug: "productivity", name: "Productivity & Meetings", blurb: "Notes, meetings, slides and everyday work." },
  { slug: "design", name: "Design", blurb: "Graphics, logos, photos and UI." },
  { slug: "marketing", name: "Marketing & SEO", blurb: "Copy, content optimisation and growth." },
  { slug: "automation", name: "Automation & Agents", blurb: "Connect apps and run multi-step AI workflows." },
  { slug: "customer-support", name: "Customer Support", blurb: "AI agents and chatbots for support teams." },
  { slug: "education", name: "Learning", blurb: "Tutors and study tools." },
] as const;

export type ToolCategorySlug = (typeof TOOL_CATEGORIES)[number]["slug"];

export interface Tool {
  slug: string;
  name: string;
  url: string;
  maker: string;
  tagline: string;
  description: string;
  category: ToolCategorySlug;
  tasks: string[];
  pricing: PricingModel;
  api: boolean;
  openSource: boolean;
  platforms: string[];
  pros: string[];
  cons: string[];
  bestFor: string;
  /** ISO date the listing text was last reviewed by an editor. */
  reviewedAt: string;
  source: "editorial" | "community";
}

export interface Task {
  slug: string;
  title: string; // "Generate images"
  query: string; // "AI image generators"
  intro: string;
  lookFor: string[];
  pitfalls: string[];
  related: string[];
}

export const PRICING_LABELS: Record<PricingModel, string> = {
  free: "Free",
  freemium: "Free plan + paid",
  paid: "Paid",
  "free-trial": "Free trial",
};
