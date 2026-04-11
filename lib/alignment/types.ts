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
  answers: Record<string, boolean>;
  domainScores: AlignmentDomainScore[];
  reportVersion: string;
  sourceInstrumentId: string;
  createdAt: string;
  updatedAt: string;
};