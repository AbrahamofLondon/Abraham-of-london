import type { MarketIntelligenceLifecycleState } from "@/lib/intelligence/market-intelligence-lifecycle";

export type GmiHeadlineSignal = {
  signal: string;
  observedEvidence: string;
  interpretation: string;
  businessConsequence: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
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
  lifecycleState: MarketIntelligenceLifecycleState;
  isCurrent: boolean;
  isPublic: boolean;
  isPurchasable: boolean;
  predecessorEditionId: string | null;
  successorEditionId: string | null;
  version: string;
  methodologyVersion: string;
  hero: {
    eyebrow: string;
    headline: string;
    deck: string;
    primaryBuyer: string;
  };
  executiveSummary: string;
  marketRegime: {
    label: string;
    summary: string;
  };
  headlineSignals: GmiHeadlineSignal[];
  boardConsequences: GmiBoardConsequence[];
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
  archiveContext: {
    previousEdition: GmiEditionLink | null;
    nextEdition: GmiEditionLink | null;
    currentEdition: GmiEditionLink;
  };
};