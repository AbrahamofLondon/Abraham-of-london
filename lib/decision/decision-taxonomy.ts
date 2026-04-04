// lib/decision/decision-taxonomy.ts
// ============================================================================
// DECISION TAXONOMY — SINGLE SOURCE OF TRUTH
// ============================================================================

import type {
  AssetKind,
  AuthorityType,
  DecisionFailureMode,
  DecisionIntervention,
  DominantDomain,
  OrgState,
  ReadinessTier,
  RevenueBand,
  RiskBand,
  SectorTaxonomy,
  WorldviewAnchor,
  CommercialUseCase,
  DecisionAudience,
  TransformationStage,
} from "@/lib/decision/decision-metadata";

export const ASSET_KINDS: AssetKind[] = [
  "brief",
  "playbook",
  "doctrine",
  "framework",
  "report-module",
];

export const AUTHORITY_TYPES: AuthorityType[] = [
  "DIRECT",
  "PROXY",
  "UNCLEAR",
];

export const REVENUE_BANDS: RevenueBand[] = [
  "MICRO",
  "SMB",
  "MID",
  "ENTERPRISE",
  "WHALE",
];

export const ORG_STATES: OrgState[] = [
  "ORDERED",
  "DRIFTING",
  "MISALIGNED",
  "DISORDERED",
];

export const RISK_BANDS: RiskBand[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

export const READINESS_TIERS: ReadinessTier[] = [
  "UNQUALIFIED",
  "DIAGNOSTIC",
  "ADVISORY",
  "EXECUTION",
  "SOVEREIGN",
];

export const FAILURE_MODES: DecisionFailureMode[] = [
  "Strategic-operational misalignment",
  "Systemic structural disorder",
  "Execution fragility",
  "Decision-rights ambiguity",
  "Governance breakdown",
  "Execution inconsistency",
  "Narrative incoherence",
  "Capital allocation distortion",
  "Trust erosion",
  "Operating cadence decay",
];

export const REQUIRED_INTERVENTIONS: DecisionIntervention[] = [
  "Stabilize operating environment",
  "Clarify decision owner and sponsor",
  "Re-sequence strategic priorities",
  "Reduce execution strain before transformation load",
  "Adjust decision horizon for external volatility",
  "Escalate to strategy-room review",
  "Run guided diagnostic before escalation",
  "Protect advisory bandwidth",
  "Restore governance discipline",
  "Tighten operating cadence",
];

export const DOMINANT_DOMAINS: DominantDomain[] = [
  "STRATEGIC_INTENT",
  "OPERATIONAL_CLARITY",
  "LEADERSHIP_TRUST",
  "CULTURAL_COHESION",
  "EXECUTION",
  "GOVERNANCE",
  "ALIGNMENT",
  "BOARD",
  "OPERATING_CADENCE",
  "DECISION_QUALITY",
  "TRUST",
];

export const SECTOR_TAXONOMY: SectorTaxonomy[] = [
  "governance",
  "operations",
  "finance",
  "leadership",
  "infrastructure",
  "technology",
  "consumer",
  "education",
  "public-sector",
  "general",
];

export const SECTOR_ALIASES: Record<string, SectorTaxonomy> = {
  governance: "governance",
  board: "governance",
  institutional: "governance",

  operations: "operations",
  operating: "operations",
  execution: "operations",

  finance: "finance",
  investor: "finance",
  capital: "finance",

  leadership: "leadership",
  management: "leadership",
  executive: "leadership",

  infrastructure: "infrastructure",
  infra: "infrastructure",
  built: "infrastructure",

  technology: "technology",
  tech: "technology",
  software: "technology",
  digital: "technology",

  consumer: "consumer",
  retail: "consumer",
  brand: "consumer",

  education: "education",
  learning: "education",

  "public-sector": "public-sector",
  government: "public-sector",
  civic: "public-sector",

  general: "general",
};

// New enums for moral-philosophical layer
export const WORLDVIEW_ANCHORS: WorldviewAnchor[] = [
  "biblical-anthropology",
  "human-purpose",
  "moral-order",
  "stewardship",
  "covenantal-leadership",
  "truth-discipline",
];

export const COMMERCIAL_USE_CASES: CommercialUseCase[] = [
  "board-review",
  "founder-diagnostic",
  "executive-alignment",
  "operating-model-reset",
  "investor-readiness",
  "culture-realignment",
  "strategic-repositioning",
  "executive-reframing",
  "founder-formation",
  "mission-clarification",
  "institutional-realignment",
  "leadership-development",
];

export const DECISION_AUDIENCES: DecisionAudience[] = [
  "founders",
  "executives",
  "boards",
  "investors",
  "policy-makers",
  "institution-builders",
  "cultural-architects",
];

export const TRANSFORMATION_STAGES: TransformationStage[] = [
  "assess",
  "diagnose",
  "realign",
  "govern",
  "scale",
];

export function isInEnum<T extends string>(value: string, enumValues: readonly T[]): value is T {
  return enumValues.includes(value as T);
}