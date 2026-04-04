// lib/decision/decision-metadata.ts
// ============================================================================
// DECISION METADATA — CANONICAL TYPES
// Explicit metadata for repo-backed decision intelligence
// ============================================================================

export type AssetKind = "brief" | "playbook" | "doctrine" | "framework" | "report-module";

export type AuthorityType = "DIRECT" | "PROXY" | "UNCLEAR";
export type RevenueBand = "MICRO" | "SMB" | "MID" | "ENTERPRISE" | "WHALE";
export type OrgState = "ORDERED" | "DRIFTING" | "MISALIGNED" | "DISORDERED";
export type RiskBand = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ReadinessTier = "UNQUALIFIED" | "DIAGNOSTIC" | "ADVISORY" | "EXECUTION" | "SOVEREIGN";

export type DecisionFailureMode =
  | "Strategic-operational misalignment"
  | "Systemic structural disorder"
  | "Execution fragility"
  | "Decision-rights ambiguity"
  | "Governance breakdown"
  | "Execution inconsistency"
  | "Narrative incoherence"
  | "Capital allocation distortion"
  | "Trust erosion"
  | "Operating cadence decay";

export type DecisionIntervention =
  | "Stabilize operating environment"
  | "Clarify decision owner and sponsor"
  | "Re-sequence strategic priorities"
  | "Reduce execution strain before transformation load"
  | "Adjust decision horizon for external volatility"
  | "Escalate to strategy-room review"
  | "Run guided diagnostic before escalation"
  | "Protect advisory bandwidth"
  | "Restore governance discipline"
  | "Tighten operating cadence";

export type DominantDomain =
  | "STRATEGIC_INTENT"
  | "OPERATIONAL_CLARITY"
  | "LEADERSHIP_TRUST"
  | "CULTURAL_COHESION"
  | "EXECUTION"
  | "GOVERNANCE"
  | "ALIGNMENT"
  | "BOARD"
  | "OPERATING_CADENCE"
  | "DECISION_QUALITY"
  | "TRUST";

export type SectorTaxonomy =
  | "governance"
  | "operations"
  | "finance"
  | "leadership"
  | "infrastructure"
  | "technology"
  | "consumer"
  | "education"
  | "public-sector"
  | "general";

// New types for moral-philosophical layer
export type WorldviewAnchor =
  | "biblical-anthropology"
  | "human-purpose"
  | "moral-order"
  | "stewardship"
  | "covenantal-leadership"
  | "truth-discipline";

export type CommercialUseCase =
  | "board-review"
  | "founder-diagnostic"
  | "executive-alignment"
  | "operating-model-reset"
  | "investor-readiness"
  | "culture-realignment"
  | "strategic-repositioning"
  | "executive-reframing"
  | "founder-formation"
  | "mission-clarification"
  | "institutional-realignment"
  | "leadership-development";

export type DecisionAudience =
  | "founders"
  | "executives"
  | "boards"
  | "investors"
  | "policy-makers"
  | "institution-builders"
  | "cultural-architects";

export type TransformationStage =
  | "assess"
  | "diagnose"
  | "realign"
  | "govern"
  | "scale";

export interface DecisionMetadata {
  assetKind?: AssetKind;
  appliesTo?: string[];
  sectors?: SectorTaxonomy[];
  revenueBands?: RevenueBand[];
  orgStates?: OrgState[];
  readinessTiers?: ReadinessTier[];
  failureModes?: DecisionFailureMode[];
  dominantDomains?: DominantDomain[];
  requiredInterventions?: DecisionIntervention[];
  marketRiskBands?: RiskBand[];
  priorityWeight?: number;
  confidenceWeight?: number;
  decisionTags?: string[];
  sponsorTypes?: AuthorityType[];
  // New fields for moral-philosophical layer
  worldviewAnchors?: WorldviewAnchor[];
  commercialUseCases?: CommercialUseCase[];
  audience?: DecisionAudience[];
  transformationStage?: TransformationStage[];
  notes?: string;
}

export interface NormalizedDecisionMetadata {
  assetKind?: AssetKind;
  appliesTo: string[];
  sectors: SectorTaxonomy[];
  revenueBands: RevenueBand[];
  orgStates: OrgState[];
  readinessTiers: ReadinessTier[];
  failureModes: DecisionFailureMode[];
  dominantDomains: DominantDomain[];
  requiredInterventions: DecisionIntervention[];
  marketRiskBands: RiskBand[];
  priorityWeight: number;
  confidenceWeight: number;
  decisionTags: string[];
  sponsorTypes: AuthorityType[];
  // New fields for moral-philosophical layer
  worldviewAnchors: WorldviewAnchor[];
  commercialUseCases: CommercialUseCase[];
  audience: DecisionAudience[];
  transformationStage: TransformationStage[];
  notes?: string;
}

export interface DecisionMetadataValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DecisionMetadataParseResult {
  metadata: NormalizedDecisionMetadata;
  validation: DecisionMetadataValidation;
}