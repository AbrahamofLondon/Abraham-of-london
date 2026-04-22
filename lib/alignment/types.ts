export type AlignmentDomain =
  | "identity"
  | "decision"
  | "environment"
  | "behaviour"
  | "emotional_order"
  | "legacy";

export type AlignmentBand =
  | "aligned"
  | "drifting"
  | "misaligned"
  | "disordered";

export type AlignmentQuestion = {
  id: string;
  domain: AlignmentDomain;
  statement: string;
  weight?: number;
};

export type AlignmentAssessmentInput = {
  answers: Record<string, boolean>;
  notes?: string;
};

/** Dual-axis answer: resonance (how true, 0-10) x certainty (how confident, 0-10) */
export type DualAxisAnswer = {
  resonance: number;
  certainty: number;
};

export type DualAxisInput = {
  answers: Record<string, DualAxisAnswer>;
};

export type CanonicalPurposeResponse = {
  questionId: string;
  domain: AlignmentDomain;
  statement: string;
  resonance: number;
  certainty: number;
};

export type DomainStateKind =
  | "low_alignment"
  | "low_confidence"
  | "contradiction"
  | "compensating_strength"
  | "stable_strength"
  | "mixed";

export type DiagnosticSeverity = "low" | "medium" | "high" | "critical";

export type EvidenceQuestion = {
  questionId: string;
  domain: AlignmentDomain;
  statement: string;
  resonance: number;
  certainty: number;
  evidenceType: "weak" | "strong" | "contradiction";
};

export type DomainState = {
  domain: AlignmentDomain;
  label: string;
  resonanceMean: number;
  certaintyMean: number;
  alignmentScore: number;
  confidenceGap: number;
  severity: DiagnosticSeverity;
  state: DomainStateKind;
  evidenceQuestions: EvidenceQuestion[];
};

export type ContradictionType =
  | "false_alignment"
  | "acknowledged_failure"
  | "identity_strong_decision_weak"
  | "decision_strong_behaviour_weak"
  | "behaviour_strong_legacy_weak"
  | "environment_weak_behaviour_weak"
  | "emotional_weak_decision_weak"
  | "legacy_strong_execution_weak"
  | "globally_low_consistent"
  | "high_variance_split";

export type AlignmentContradiction = {
  type: ContradictionType;
  severity: DiagnosticSeverity;
  domains: AlignmentDomain[];
  evidence: string;
};

export type PurposePatternId =
  | "mandate_fracture"
  | "pressure_override"
  | "environmental_drag"
  | "operational_inconsistency"
  | "emotional_volatility"
  | "legacy_deferral"
  | "false_alignment"
  | "acknowledged_failure"
  | "distributed_drift"
  | "high_variance_split"
  | "compensatory_discipline"
  | "latent_coherence_under_pressure";

export type PatternScore = {
  id: PurposePatternId;
  label: string;
  score: number;
  reasons: string[];
  consequence: string;
  firstAction: string;
};

export type RoutingRecommendation = {
  label: string;
  href: string;
  reason: string;
  spilloverLikely: boolean;
};

export type PurposeReportNarrative = {
  conditionStatement: string;
  classificationExplanation: string;
  contradictionExplanation: string;
  consequenceBlock: string;
  firstActionBlock: string;
  nextStepBlock: string;
};

export type PurposeAlignmentEvidence = {
  sharpestWeakSignal: EvidenceQuestion | null;
  strongestStabilisingSignal: EvidenceQuestion | null;
  contradictionEvidence: EvidenceQuestion[];
};

export type CoherenceBand =
  | "SOVEREIGN"
  | "ALIGNED"
  | "DRIFTING"
  | "FRAGMENTED";

export type PurposeProfileResult = {
  totalScore: number;
  maxScore: number;
  percent: number;
  coherenceBand: CoherenceBand;
  domainProfiles: DomainProfile[];
  weakestDomains: AlignmentDomain[];
  strengths: string[];
  corrections: string[];
  narrative: string;
  nextActions: string[];
  createdAt: string;
  rawResponses?: CanonicalPurposeResponse[];
  domainStates?: DomainState[];
  contradictions?: AlignmentContradiction[];
  patternScores?: PatternScore[];
  primaryPattern?: PatternScore;
  secondaryPattern?: PatternScore | null;
  severity?: DiagnosticSeverity;
  consequenceLogic?: string;
  firstAction?: string;
  evidence?: PurposeAlignmentEvidence;
  routingRecommendation?: RoutingRecommendation;
  reportNarrative?: PurposeReportNarrative;
};

export type DomainProfile = {
  domain: AlignmentDomain;
  label: string;
  resonance: number;
  certainty: number;
  weighted: number;
  percent: number;
};

export type AlignmentDomainScore = {
  domain: AlignmentDomain;
  earned: number;
  possible: number;
  percent: number;
};

export type AlignmentAssessmentResult = {
  totalScore: number;
  possibleScore: number;
  percent: number;
  band: AlignmentBand;
  domainScores: AlignmentDomainScore[];
  weakestDomains: AlignmentDomain[];
  strengths: string[];
  corrections: string[];
  createdAt: string;
};

export type StoredPurposeAlignmentAssessment = {
  id: string;
  userId: string | null;
  sessionKey: string | null;
  title: string;
  notes: string | null;
  totalScore: number;
  possibleScore: number;
  percentScore: number;
  band: AlignmentBand;
  weakestDomains: AlignmentDomain[];
  strengths: string[];
  corrections: string[];
  answers: Record<string, boolean> | Record<string, DualAxisAnswer>;
  domainScores: AlignmentDomainScore[];
  canonicalResult: PurposeProfileResult | null;
  reportVersion: string;
  sourceInstrumentId: string;
  createdAt: string;
  updatedAt: string;
};
