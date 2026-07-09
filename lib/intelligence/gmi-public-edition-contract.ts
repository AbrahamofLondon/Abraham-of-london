import type { MarketIntelligenceLifecycleState } from "@/lib/intelligence/market-intelligence-lifecycle";


export type GmiEvidencePosture = "OBSERVED" | "DIRECTIONAL" | "CONFIRMED" | "MONITORING" | "SCENARIO_ASSUMPTION";

export type GmiReaderAccessState = "PUBLIC_SUMMARY" | "ACQUISITION_VISITOR" | "ENTITLED_READER" | "INTERNAL_REVIEWER";

export type GmiRegimeFingerprintAxis = {
  axis: string;
  value: number;
  previousValue: number | null;
  direction: "RISING" | "FALLING" | "STABLE";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  definition: string;
};

export type GmiQuarterDelta = {
  whatChanged: string;
  whatHeld: string;
  whatSurprisedUs: string;
  whatNowMatters: string;
};

export type GmiBriefCitation = {
  ref: string;
  title: string;
  relationship: string;
  publicationState: "PUBLIC" | "LICENSED" | "INTERNAL" | "UNAVAILABLE";
  href: string | null;
};

export type GmiConsequenceMatrixRow = {
  decisionDomain: string;
  publicDiagnostic: string;
  publicImplication: string;
  operatorImplication: string;
  actionVector: string;
  timeHorizon: string;
  monitoringSignal: string;
  trigger: string;
  riskOfInaction: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  reviewHorizon: string;
  evidenceRefs: string[];
  briefRefs: string[];
  accessLevel: "PUBLIC" | "LICENSED";
  publicDecisionToReconsider: string | null;
};

export type GmiCrossEditionDelta = {
  priorPosition: string;
  priorConfidence: "LOW" | "MEDIUM" | "HIGH";
  priorTrigger: string;
  whatHappened: string;
  currentPosition: string;
  currentConfidence: "LOW" | "MEDIUM" | "HIGH";
  movement: "HELD" | "STRENGTHENED" | "WEAKENED" | "REVISED" | "CONTRADICTED" | "UNRESOLVED";
  reason: string;
  decisionImplication: string | null;
};
export type GmiHeadlineSignal = {
  signal: string;
  observedEvidence: string;
  interpretation: string;
  businessConsequence: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  evidencePosture: GmiEvidencePosture;
  reviewHorizon: string | null;
  falsificationTrigger: string;
};

export type GmiBoardConsequence = {
  area: string;
  consequence: string;
  timing: string;
};

export type GmiThesisCard = {
  thesis: string;
  evidence: string;
  implication: string;
  reviewTrigger: string;
};

export type GmiFalsificationSummary = {
  currentBelief: string;
  evidenceBasis: string;
  wouldChangeIf: string;
  reviewCadence: string;
};

export type GmiMethodologySummary = {
  version: string;
  callReview: string;
  falsification: string;
  boundary: string;
};

export type GmiEditionLink = {
  editionId: string;
  title: string;
  slug: string;
  href: string;
  status: "current" | "superseded" | "draft";
};

/**
 * A geographic or thematic regional layer in the Regime Map.
 * Designed for extension: future editions can add subregions and strategic corridors
 * without changing the component.
 */
export type GmiRegionalLayer = {
  /** Canonical region identifier, e.g. "AFRICA", "LATIN_AMERICA", "MIDDLE_EAST" */
  region: string;
  /** Public-facing display label */
  label: string;
  /** Evidence-development state. "ACTIVE" where sufficient Q2 evidence exists. */
  evidenceState: "ACTIVE" | "DEVELOPING" | "UNAVAILABLE";
  /** Directional assessment where evidence supports it */
  direction: "RISING" | "FALLING" | "STABLE" | null;
  /** Confidence where evidence supports it */
  confidence: "LOW" | "MEDIUM" | "HIGH" | null;
  /** Evidence posture for the regional assessment */
  evidencePosture: GmiEvidencePosture | null;
  /** Public-facing summary of the regional assessment */
  publicSummary: string;
  /** Operating implication for boards and operators, where evidence supports it */
  operatingImplication: string | null;
  /** Trigger to monitor, where evidence supports it */
  triggerToMonitor: string | null;
  /** Subregions for future extension — empty until populated by later editions */
  subregions: GmiRegionalSubregion[];
  /** Strategic corridors for future extension — empty until populated by later editions */
  strategicCorridors: GmiStrategicCorridor[];
};

/**
 * A subregion within a regional layer.
 * Future editions can populate these without component changes.
 */
export type GmiRegionalSubregion = {
  label: string;
  direction: "RISING" | "FALLING" | "STABLE" | null;
  confidence: "LOW" | "MEDIUM" | "HIGH" | null;
  summary: string;
};

/**
 * A strategic corridor connecting regions.
 * Future editions can populate these without component changes.
 */
export type GmiStrategicCorridor = {
  label: string;
  direction: "RISING" | "FALLING" | "STABLE" | null;
  confidence: "LOW" | "MEDIUM" | "HIGH" | null;
  summary: string;
};


export type GmiChronologyEntry = {
  editionId: string;
  title: string;
  shortTitle: string;
  lifecycleState: MarketIntelligenceLifecycleState;
  publicationRole: "CURRENT" | "REFERENCE" | "UPCOMING";
  isViewed: boolean;
  publishedAt: string | null;
  publicationTarget: string | null;
  href: string | null;
  publicVisible: boolean;
  purchasable: boolean;
};

export type GmiFamilyChronology = {
  viewedEdition: GmiChronologyEntry;
  currentEdition: GmiChronologyEntry;
  previousPublishedEdition: GmiChronologyEntry | null;
  upcomingEdition: GmiChronologyEntry | null;
};

export type GmiEditionPublicContract = {
  editionId: string;
  familyId: "gmi-quarterly";
  title: string;
  shortTitle: string;
  slug: string;
  periodStart: string;
  periodEnd: string;
  publicationTarget: string;
  publishedAt: string | null;
  dataLockedAt: string | null;
  lifecycleState: MarketIntelligenceLifecycleState;
  isCurrent: boolean;
  isPublic: boolean;
  isPurchasable: boolean;
  predecessorEditionId: string | null;
  successorEditionId: string | null;
  editionVersion: string;
  methodologyVersion: string;
  releaseMethodologyRef: string | null;
  reviewMethodologyVersion: string | null;
  readerAccessState: GmiReaderAccessState;
  hero: {
    eyebrow: string;
    headline: string;
    deck: string;
    primaryBuyer: string;
  };
  executiveSummary: string;
  quarterInOneSentence: string;
  quarterDelta: GmiQuarterDelta;
  regimeFingerprint: GmiRegimeFingerprintAxis[];
  regionalLayers: GmiRegionalLayer[];
  marketRegime: {
    label: string;
    summary: string;
  };
  headlineSignals: GmiHeadlineSignal[];
  boardConsequences: GmiBoardConsequence[];
  consequenceMatrix: GmiConsequenceMatrixRow[];
  crossEditionDeltas: GmiCrossEditionDelta[];
  supportingBriefs: GmiBriefCitation[];
  thesisCards: GmiThesisCard[];
  falsificationSummary: GmiFalsificationSummary;
  methodology: GmiMethodologySummary;
  evidenceSummary: {
    sourceCount: number;
    coverageState: string;
    sourceSnapshotHash?: string;
  };
  releaseProof: {
    receiptRef: string | null;
    candidateHash: string | null;
    reportContentHash: string | null;
    pdfHash: string | null;
  };
  commerce: {
    commercialState: string;
    priceLabel: string | null;
    currency: string | null;
    checkoutEligible: boolean;
    productId: string | null;
    priceAuthorityRef: string | null;
    productCode: string;
  };
  pdf: {
    available: boolean;
    downloadPath: string | null;
  };
  familyChronology: GmiFamilyChronology;
};
