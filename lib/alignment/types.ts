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