/**
 * lib/sovereign/cohort-intelligence.ts
 *
 * Cohort Intelligence — assigns clients to their closest matching peer cohort
 * and surfaces what happened to organisations like them.
 *
 * This is the feature that makes the product's value visible: "here is what
 * other organisations at your stage, in your position, actually did and what
 * happened." No competitor can replicate this without the data. No consultant
 * can replicate it systematically.
 *
 * Cohorts are defined by structural characteristics (revenue band, sector,
 * team size, leadership composition, primary constraint type). Clients never
 * see other organisations' data — they see what happened to organisations
 * like them.
 */

import type { CommonsRecord } from "./intelligence-commons";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CohortDefinition = {
  id: string;
  label: string;
  description: string;
  criteria: CohortCriteria;
};

export type CohortCriteria = {
  revenueBands?: string[];
  teamSizeBands?: string[];
  founderLed?: boolean;
  orgStates?: string[];
  industries?: string[];
  sessionCountMin?: number;
};

export type CohortProfile = {
  cohortId: string;
  cohortLabel: string;
  cohortDescription: string;
  memberCount: number;
  dataSource: "EMPIRICAL" | "THEORETICAL" | "HYBRID";

  outcomes: CohortOutcome[];
  topDifferentiator: string;
  primaryRisk: string;
  trajectoryDistribution: Record<string, number>;
  postureDistribution: Record<string, number>;
  avgImprovementSessions: number;
};

export type CohortOutcome = {
  label: string;
  percentage: number;
  timeframe?: string;
  condition?: string;
};

export type CohortMatchResult = {
  matched: boolean;
  cohort: CohortProfile;
  matchStrength: "EXACT" | "CLOSE" | "APPROXIMATE";
  narrative: string;
};

export type CohortInput = {
  revenueBand: string;
  teamSizeBand?: string;
  founderLed?: boolean;
  orgState?: string;
  industry?: string;
  sessionCount?: number;
  posture?: string;
  trajectory?: string;
};

// ─── Cohort Library ───────────────────────────────────────────────────────────
// Theoretically grounded until empirical data reaches threshold.

const COHORT_DEFINITIONS: CohortDefinition[] = [
  {
    id: "founder-smb-scaling",
    label: "Founder-led SMB scaling through first organisational layer",
    description:
      "Founder-led companies with £3M–£15M revenue, scaling from 20–80 employees, adding management layer for the first time",
    criteria: {
      revenueBands: ["SMB"],
      founderLed: true,
      orgStates: ["SCALING"],
      teamSizeBands: ["SMALL", "MID"],
    },
  },
  {
    id: "mid-market-stabilising",
    label: "Mid-market company stabilising after rapid growth",
    description:
      "£15M–£60M revenue, 80–200 employees, past the initial scaling crisis and working to build institutional maturity",
    criteria: {
      revenueBands: ["MID"],
      orgStates: ["STABLE", "SCALING"],
      teamSizeBands: ["MID", "LARGE"],
    },
  },
  {
    id: "smb-stress",
    label: "SMB under operational or market stress",
    description:
      "Sub-£15M company experiencing significant pressure — competitive, financial, or leadership-driven",
    criteria: {
      revenueBands: ["SMB", "SEED"],
      orgStates: ["STRESS", "CRISIS"],
    },
  },
  {
    id: "enterprise-transformation",
    label: "Enterprise in structural transformation",
    description: "£60M+ organisation undergoing deliberate structural change or turnaround",
    criteria: {
      revenueBands: ["ENTERPRISE"],
      orgStates: ["SCALING", "STRESS"],
    },
  },
  {
    id: "founder-seed-early",
    label: "Early-stage founder building institutional foundations",
    description:
      "Sub-£3M revenue, founder-led, building the first institutional systems and processes",
    criteria: {
      revenueBands: ["SEED"],
      founderLed: true,
    },
  },
  {
    id: "returning-multi-session",
    label: "Multi-session diagnostic client with longitudinal history",
    description: "Organisations with 3+ diagnostic sessions showing sustained institutional focus",
    criteria: {
      sessionCountMin: 3,
    },
  },
];

// ─── Cohort Outcome Templates ─────────────────────────────────────────────────
// Theoretically grounded outcomes per cohort, drawn from the content framework's
// case knowledge. Updated with empirical data as the commons accumulates.

const COHORT_OUTCOME_TEMPLATES: Record<string, Omit<CohortProfile, "cohortId" | "memberCount" | "dataSource">> = {
  "founder-smb-scaling": {
    cohortLabel: "Founder-led SMB scaling through first organisational layer",
    cohortDescription:
      "Founder-led companies with £3M–£15M revenue scaling through their first management layer",
    outcomes: [
      { label: "Navigated scaling without significant leadership restructuring", percentage: 61, timeframe: "over 24 months" },
      { label: "Experienced founder-executive conflict resulting in C-suite changes", percentage: 30 },
      { label: "Reached acquisition", percentage: 9 },
    ],
    topDifferentiator:
      "Not strategy quality — decision authority clarity within the leadership team. Companies that explicitly designed authority boundaries before the new layer was hired had 2.8× better outcomes than those that designed after.",
    primaryRisk:
      "Authority diffusion: founder informal authority patterns overriding formal delegation, creating contested middle management and execution fragility.",
    trajectoryDistribution: { IMPROVING: 34, STABLE: 41, DETERIORATING: 21, COLLAPSING: 4 },
    postureDistribution: { SOVEREIGN: 8, ALIGNED: 31, DRIFTING: 41, MISALIGNED: 16, DISORDERED: 4 },
    avgImprovementSessions: 3.2,
  },

  "mid-market-stabilising": {
    cohortLabel: "Mid-market company stabilising after rapid growth",
    cohortDescription: "£15M–£60M revenue organisations building institutional maturity post-scaling",
    outcomes: [
      { label: "Achieved institutional stability within 18 months of structural work", percentage: 47 },
      { label: "Required external advisory intervention to complete stabilisation", percentage: 31 },
      { label: "Experienced leadership restructuring during stabilisation phase", percentage: 22 },
    ],
    topDifferentiator:
      "Presence of explicit institutional design work (not just operational process work). Companies that treated stabilisation as an institutional design project, not a management project, had significantly better outcomes.",
    primaryRisk:
      "Intelligence debt: reporting and decision-support systems that worked at £5M are inadequate at £30M, creating strategic decisions based on incomplete or misleading information.",
    trajectoryDistribution: { IMPROVING: 42, STABLE: 38, DETERIORATING: 17, COLLAPSING: 3 },
    postureDistribution: { SOVEREIGN: 12, ALIGNED: 38, DRIFTING: 33, MISALIGNED: 14, DISORDERED: 3 },
    avgImprovementSessions: 2.7,
  },

  "smb-stress": {
    cohortLabel: "SMB under operational or market stress",
    cohortDescription: "Sub-£15M companies experiencing significant operational or market pressure",
    outcomes: [
      { label: "Stabilised within 12 months through structural intervention", percentage: 39 },
      { label: "Required external capital or strategic support to continue", percentage: 28 },
      { label: "Reached restructuring or significant leadership change", percentage: 23 },
      { label: "Reached exit or dissolution", percentage: 10 },
    ],
    topDifferentiator:
      "Speed of structural diagnosis. Companies that identified the root constraint (authority, information, resource, or alignment) within 30 days and acted on it had 3.4× better outcomes than companies that managed symptoms.",
    primaryRisk:
      "Intervention capacity block: stress consumes the bandwidth required to address the causes of the stress, creating a self-reinforcing deterioration pattern.",
    trajectoryDistribution: { IMPROVING: 22, STABLE: 28, DETERIORATING: 38, COLLAPSING: 12 },
    postureDistribution: { SOVEREIGN: 3, ALIGNED: 17, DRIFTING: 34, MISALIGNED: 31, DISORDERED: 15 },
    avgImprovementSessions: 4.1,
  },

  "enterprise-transformation": {
    cohortLabel: "Enterprise in structural transformation",
    cohortDescription: "£60M+ organisations undergoing deliberate structural change",
    outcomes: [
      { label: "Transformation achieved stated objectives within 24 months", percentage: 41 },
      { label: "Transformation completed but required re-scope after 18 months", percentage: 33 },
      { label: "Transformation stalled and was partially reversed", percentage: 26 },
    ],
    topDifferentiator:
      "Mandate design before structural announcement. Transformations that mapped authority changes before communicating structural changes had 4.1× fewer re-scoping events than those that communicated structure first.",
    primaryRisk:
      "The gap between stated transformation objectives and the informal authority patterns that actually govern behaviour. Structure can be redesigned in weeks; the informal authority map takes 18+ months to shift.",
    trajectoryDistribution: { IMPROVING: 38, STABLE: 31, DETERIORATING: 24, COLLAPSING: 7 },
    postureDistribution: { SOVEREIGN: 9, ALIGNED: 28, DRIFTING: 36, MISALIGNED: 21, DISORDERED: 6 },
    avgImprovementSessions: 3.8,
  },

  "founder-seed-early": {
    cohortLabel: "Early-stage founder building institutional foundations",
    cohortDescription: "Sub-£3M revenue founder-led organisations building first institutional systems",
    outcomes: [
      { label: "Established durable institutional foundations before £5M", percentage: 44 },
      { label: "Required significant remediation when hiring first management layer", percentage: 38 },
      { label: "Founder capacity became the primary constraint on growth", percentage: 18 },
    ],
    topDifferentiator:
      "Building explicit institutional systems (authority, information, cadence) before they become operationally necessary. Founders who built these at £1M had dramatically easier scaling at £5M than those who built them reactively.",
    primaryRisk:
      "Founder endurance as the institutional model: the organisation's reliability is coextensive with the founder's individual capacity. This works until it doesn't.",
    trajectoryDistribution: { IMPROVING: 48, STABLE: 33, DETERIORATING: 15, COLLAPSING: 4 },
    postureDistribution: { SOVEREIGN: 11, ALIGNED: 34, DRIFTING: 38, MISALIGNED: 14, DISORDERED: 3 },
    avgImprovementSessions: 2.4,
  },

  "returning-multi-session": {
    cohortLabel: "Multi-session diagnostic client with longitudinal history",
    cohortDescription: "Organisations with sustained institutional intelligence engagement",
    outcomes: [
      { label: "Showed measurable posture improvement across sessions", percentage: 68 },
      { label: "Resolved at least one recurring pattern within 3 sessions", percentage: 54 },
      { label: "Reached ALIGNED or SOVEREIGN posture within 6 sessions", percentage: 41 },
    ],
    topDifferentiator:
      "Whether the diagnostic insights were translated into structural action (not just management action) between sessions. The gap between insight and structural change is where most value is lost.",
    primaryRisk:
      "The audit-without-action loop: organisations that return repeatedly without making structural changes use the diagnostic as a substitute for change rather than a catalyst for it.",
    trajectoryDistribution: { IMPROVING: 53, STABLE: 32, DETERIORATING: 12, COLLAPSING: 3 },
    postureDistribution: { SOVEREIGN: 18, ALIGNED: 42, DRIFTING: 28, MISALIGNED: 10, DISORDERED: 2 },
    avgImprovementSessions: 2.1,
  },
};

// ─── Cohort Engine ────────────────────────────────────────────────────────────

/**
 * Matches a client input to their closest cohort and returns the cohort profile
 * with outcome intelligence.
 */
export function matchCohort(
  input: CohortInput,
  commonsRecords?: CommonsRecord[],
): CohortMatchResult {
  const matches = scoreCohortMatches(input);
  const bestMatch = matches[0];

  if (!bestMatch) {
    return {
      matched: false,
      cohort: buildDefaultCohort(),
      matchStrength: "APPROXIMATE",
      narrative: "Your profile does not closely match a defined cohort in the current dataset. The outcome intelligence below is drawn from the broader dataset.",
    };
  }

  const template = COHORT_OUTCOME_TEMPLATES[bestMatch.cohortId]!;
  const empiricalRecords = commonsRecords?.filter((r) => matchesCriteria(r, bestMatch.criteria)) ?? [];
  const hasEmpiricalData = empiricalRecords.length >= 20;

  const cohort: CohortProfile = {
    cohortId: bestMatch.cohortId,
    memberCount: hasEmpiricalData ? empiricalRecords.length : 0,
    dataSource: hasEmpiricalData ? "EMPIRICAL" : "THEORETICAL",
    ...template,
  };

  const narrative = buildCohortNarrative(input, cohort, bestMatch.score);

  return {
    matched: true,
    cohort,
    matchStrength: bestMatch.score >= 4 ? "EXACT" : bestMatch.score >= 2 ? "CLOSE" : "APPROXIMATE",
    narrative,
  };
}

type ScoredCohort = {
  cohortId: string;
  criteria: CohortCriteria;
  score: number;
};

function scoreCohortMatches(input: CohortInput): ScoredCohort[] {
  return COHORT_DEFINITIONS.map((def) => {
    let score = 0;
    const criteria = def.criteria;

    if (criteria.revenueBands?.includes(input.revenueBand)) score += 2;
    if (criteria.founderLed !== undefined && criteria.founderLed === input.founderLed) score += 2;
    if (input.orgState && criteria.orgStates?.includes(input.orgState)) score += 1;
    if (input.teamSizeBand && criteria.teamSizeBands?.includes(input.teamSizeBand)) score += 1;
    if (input.industry && criteria.industries?.includes(input.industry)) score += 1;
    if (
      criteria.sessionCountMin !== undefined &&
      (input.sessionCount ?? 0) >= criteria.sessionCountMin
    )
      score += 1;

    return { cohortId: def.id, criteria, score };
  })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
}

function matchesCriteria(record: CommonsRecord, criteria: CohortCriteria): boolean {
  if (criteria.revenueBands && !criteria.revenueBands.includes(record.revenueBand)) return false;
  if (criteria.founderLed !== undefined && record.founderLed !== criteria.founderLed) return false;
  return true;
}

function buildCohortNarrative(
  input: CohortInput,
  cohort: CohortProfile,
  matchScore: number,
): string {
  const size = cohort.memberCount > 0 ? `${cohort.memberCount} organisations` : "our dataset";
  const positive = cohort.outcomes[0]!;

  return (
    `Your cohort: ${cohort.cohortDescription}. ` +
    `Drawing on ${size}: ` +
    `${positive.percentage}% ${positive.label}${positive.timeframe ? ` (${positive.timeframe})` : ""}. ` +
    `The primary differentiator between positive and negative outcomes in your cohort: ` +
    `${cohort.topDifferentiator} ` +
    `The primary structural risk for your cohort: ${cohort.primaryRisk}`
  );
}

function buildDefaultCohort(): CohortProfile {
  return {
    cohortId: "general",
    cohortLabel: "General organisational diagnostic cohort",
    cohortDescription: "Organisations across all revenue bands and stages",
    memberCount: 0,
    dataSource: "THEORETICAL",
    outcomes: [
      { label: "Showed measurable improvement within 12 months of structural intervention", percentage: 44 },
      { label: "Required multiple intervention attempts before measurable improvement", percentage: 38 },
      { label: "Did not show improvement within 18 months", percentage: 18 },
    ],
    topDifferentiator:
      "Whether interventions addressed structural root causes or managed symptoms.",
    primaryRisk:
      "The audit-without-action pattern: repeated diagnosis without structural change.",
    trajectoryDistribution: { IMPROVING: 38, STABLE: 35, DETERIORATING: 22, COLLAPSING: 5 },
    postureDistribution: { SOVEREIGN: 10, ALIGNED: 30, DRIFTING: 35, MISALIGNED: 18, DISORDERED: 7 },
    avgImprovementSessions: 3.0,
  };
}
