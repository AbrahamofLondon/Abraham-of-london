/**
 * Case Study Pipeline — Type Definitions
 *
 * Structures for generating anonymised evidence case studies
 * from verified outcome records.
 */

export type CaseDraft = {
  id: string;
  outcomeId: string;
  organisationId?: string;
  situation: string;
  contradiction: string;
  decision: string;
  intervention: string;
  outcome: string;
  verificationBasis: string;
  financialImpact: { amount: number; currency: string; period: string } | null;
  timeframeDays: number;
  confidence: number;
  anonymisationComplete: boolean;
  confidentialityNote: string;
  status: "draft" | "reviewed" | "approved" | "rejected";
  createdAt: string;
};

export type CaseEligibility = {
  eligible: boolean;
  reasons: string[];
};
