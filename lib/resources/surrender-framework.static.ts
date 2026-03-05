/* lib/resources/surrender-framework.static.ts — SSOT (STATIC REGISTRY) */

import type { AccessTier } from "@/lib/access/tier-policy";

export const LIBRARY_HREF = "/resources/surrender-framework";

/** Registry item */
export type SurrenderFramework = {
  key: string;
  slug: string;
  title: string;
  oneLiner: string;
  tier: AccessTier | AccessTier[];
  tag?: string;
  audience?: string[];
  executiveSummary?: string[];
  useWhen?: string[];
  inputs?: string[];
  outputs?: string[];
  operatingLogic?: Array<{ title: string; body: string }>;
  applicationPlaybook?: Array<{ step: string; detail: string; deliverable: string }>;
  metrics?: Array<{ metric: string; whyItMatters: string; reviewCadence: string }>;
  failureModes?: string[];
  boardQuestions?: string[];
  whatToDoNext?: string[];
  artifactHref?: string;
  accent?: string;
  [k: string]: any;
};

const ORDER: AccessTier[] = [
  "public",
  "member",
  "inner-circle",
  "client",
  "legacy",
  "architect",
  "owner",
];

/** Minimum required tier for a framework (lowest in ORDER wins) */
export function requiredTier(framework: SurrenderFramework): AccessTier {
  const tiers = Array.isArray(framework.tier) ? framework.tier : [framework.tier];
  let min: AccessTier = (tiers[0] ?? "member") as AccessTier;

  for (const t of tiers) {
    if (ORDER.indexOf(t) >= 0 && ORDER.indexOf(t) < ORDER.indexOf(min)) min = t;
  }
  return min;
}

/** Static registry */
export const FRAMEWORKS: SurrenderFramework[] = [
  {
    key: "SF-001",
    slug: "surrender-protocol",
    title: "The Surrender Protocol",
    oneLiner: "A framework for voluntary submission to principle before consequence enforces it.",
    tier: "member",
    tag: "Protocol 01",
    audience: ["Founder", "Leader", "Operator"],
    accent: "gold",
    executiveSummary: [
      "You either choose discipline or life assigns it.",
      "Surrender is not weakness; it is governance of the self.",
    ],
  },
];

/* ---------------------------------------------------------------------------
  REQUIRED EXPORTS (match imports in surrender-framework.ts)
--------------------------------------------------------------------------- */
export function getAllSurrenderFrameworks(): SurrenderFramework[] {
  return FRAMEWORKS;
}

export function getSurrenderFrameworkBySlug(slug: string): SurrenderFramework | undefined {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!s) return undefined;
  return FRAMEWORKS.find((f) => f.slug === s);
}

export function getAllSurrenderFrameworkSlugs(): string[] {
  return FRAMEWORKS.map((f) => f.slug);
}

export const __internal = { ORDER };