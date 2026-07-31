// File: src/lib/categories.ts
// Purpose: Fixed v1 category taxonomy for demand posts and opportunity stats.

export const CATEGORIES = [
  "Customer Support",
  "Sales & CRM",
  "Marketing & Content",
  "Legal & Compliance",
  "Finance & Accounting",
  "Healthcare",
  "Education",
  "Developer Tools",
  "Data & Research",
  "Voice & Assistants",
  "Document Processing",
  "Workflow Automation",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const BUDGET_LABELS: Record<string, string> = {
  unspecified: "Budget not specified",
  under_5k: "Under \u20B95,000 / mo",
  "5k_25k": "\u20B95,000\u2013\u20B925,000 / mo",
  "25k_1l": "\u20B925,000\u2013\u20B91,00,000 / mo",
  above_1l: "Above \u20B91,00,000 / mo",
};

export const URGENCY_LABELS: Record<string, string> = {
  exploring: "Exploring options",
  this_quarter: "Needed this quarter",
  urgent: "Urgent",
};
