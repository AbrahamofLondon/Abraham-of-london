/* lib/resources/strategic-frameworks.static.ts — SSOT STATIC (BUILD-SAFE)
   - No prisma, no fs, no node APIs
   - Exports Framework + helpers + requiredTier (used by server layer)
*/

import type { AccessTier } from "@/lib/access/tier-policy";

export const LIBRARY_HREF = "/resources/strategic-frameworks";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export interface OperatingLogic {
  title: string;
  body: string;
}

export interface PlaybookStep {
  step: number;
  detail: string;
  deliverable: string;
}

export interface Metric {
  metric: string;
  whyItMatters: string;
  reviewCadence: string;
}

/**
 * NOTE:
 * - `tier` here is brand-language labels (Founder/Board/etc).
 * - Access policy maps these labels to SSOT AccessTier for gating.
 */
export interface Framework {
  slug: string;
  title: string;
  oneLiner: string;

  /** Brand-language labels (UI + policy input) */
  tier: string[];

  tag?: string;
  accent?: "gold" | "emerald" | "blue" | "rose" | "indigo";
  canonRoot?: string;

  executiveSummary?: string[];
  operatingLogic?: OperatingLogic[];
  applicationPlaybook?: PlaybookStep[];
  metrics?: Metric[];
  boardQuestions?: string[];
  failureModes?: string[];
  whatToDoNext?: string[];

  artifactHref?: string;

  [k: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/* REGISTRY                                                                    */
/* -------------------------------------------------------------------------- */

const FOUNDATION_TRACK: Framework[] = [
  {
    slug: "sovereignty-index",
    title: "The Sovereignty Index",
    oneLiner: "A diagnostic tool for measuring institutional autonomy against external volatility.",
    tier: ["Founder", "Board"],
    tag: "Protocol 01",
    accent: "gold",
    canonRoot: "The Architecture of Human Purpose",
    executiveSummary: [
      "Sovereignty is the ratio of internal agency to external dependency.",
      "This index benchmarks your 'Survival Horizon'—the time your institution can operate if external nodes are severed.",
    ],
    operatingLogic: [
      {
        title: "The Dependency Axial",
        body: "Identify critical nodes (Vendors, Talent, Capital) that lack immediate redundancy.",
      },
    ],
    applicationPlaybook: [
      { step: 1, detail: "Map primary external dependencies.", deliverable: "Dependency Map" },
      { step: 2, detail: "Calculate cost of node failure.", deliverable: "Risk Assessment" },
    ],
    metrics: [{ metric: "Autonomy Ratio", whyItMatters: "Measures independence.", reviewCadence: "Quarterly" }],
    boardQuestions: ["If our primary cloud provider pivots, do we exist?"],
    failureModes: ["Treating sovereignty as isolationism rather than resilience."],
    whatToDoNext: ["Execute a 'Dark Node' simulation with your executive team."],
    artifactHref: "/artifacts/sovereignty-index-v1.pdf",
  },
];

export const FRAMEWORKS: readonly Framework[] = FOUNDATION_TRACK;

/* -------------------------------------------------------------------------- */
/* ACCESS POLICY (STATIC, DETERMINISTIC)                                      */
/* -------------------------------------------------------------------------- */

/**
 * Maps brand-language labels -> SSOT AccessTier.
 * Deterministic, build-safe, and shared by server & API layers.
 */
export function requiredTier(fw: Framework): AccessTier {
  const labels = (fw?.tier ?? []).map((x) => String(x).toLowerCase().trim());
  const set = new Set(labels);

  if (set.has("owner")) return "owner";
  if (set.has("architect") || set.has("founder") || set.has("board")) return "architect";
  if (set.has("legacy")) return "legacy";
  if (set.has("client")) return "client";
  if (set.has("inner-circle") || set.has("inner circle")) return "inner-circle";
  if (set.has("member")) return "member";
  return "public";
}

/* -------------------------------------------------------------------------- */
/* PURE HELPERS                                                                */
/* -------------------------------------------------------------------------- */

export function getAllFrameworks(): Framework[] {
  return [...FOUNDATION_TRACK];
}

export function getAllFrameworkSlugs(): string[] {
  return FOUNDATION_TRACK.map((f) => f.slug);
}

export function getFrameworkBySlug(slug: string): Framework | undefined {
  const s = String(slug || "").trim();
  return FOUNDATION_TRACK.find((f) => f.slug === s);
}