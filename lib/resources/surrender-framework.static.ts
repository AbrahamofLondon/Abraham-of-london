/* lib/resources/strategic-frameworks.static.ts — SSOT ALIGNED (STATIC REGISTRY) */

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier } from "@/lib/access/tier-policy";

export const LIBRARY_HREF = "/resources/strategic-frameworks";

export type Framework = {
  key: string;
  slug: string;
  title: string;
  oneLiner: string;
  tier: AccessTier | AccessTier[];
  audience?: string[];
  tag?: string;
  canonRoot?: string;
  executiveSummary?: string[];
  useWhen?: string[];
  inputs?: string[];
  outputs?: string[];
  operatingLogic?: Array<{ title: string; body: string }>;
  applicationPlaybook?: Array<{ step: string; detail: string; deliverable: string }>;
  metrics?: Array<{ metric: string; whyItMatters: string; reviewCadence: string }>;
  boardQuestions?: string[];
  failureModes?: string[];
  whatToDoNext?: string[];
  artifactHref?: string;
  accent?: string;
  [k: string]: any;
};

const ORDER: AccessTier[] = ["public", "member", "inner-circle", "client", "legacy", "architect", "owner"];

export function requiredTier(framework: Framework): AccessTier {
  const tiers = Array.isArray(framework.tier) ? framework.tier : [framework.tier];
  let min = tiers[0] ?? "member";
  for (const t of tiers) {
    if (ORDER.indexOf(t) < ORDER.indexOf(min)) min = t;
  }
  return min;
}

export const FRAMEWORKS: Framework[] = [
  {
    key: "S-001",
    slug: "sovereignty-index",
    title: "The Sovereignty Index",
    oneLiner: "A diagnostic tool for measuring institutional autonomy against external volatility.",
    tier: "architect",
    audience: ["Founder", "Board"],
    tag: "Protocol 01",
    canonRoot: "The Architecture of Human Purpose",
    executiveSummary: [
      "Sovereignty is not isolation; it is the strategic management of dependencies.",
      "This framework quantifies agency relative to external market nodes.",
    ],
    accent: "gold",
  },
  // Add more frameworks as needed
];

export function getAllFrameworks(): Framework[] {
  return FRAMEWORKS;
}

export function getFrameworkBySlug(slug: string): Framework | undefined {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!s) return undefined;
  return FRAMEWORKS.find((f) => f.slug === s);
}

export function getAllFrameworkSlugs(): string[] {
  return FRAMEWORKS.map((f) => f.slug);
}

export const __internal = {
  ORDER,
};