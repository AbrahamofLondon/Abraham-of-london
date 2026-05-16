import type { GovernedCaseStatus } from "@/lib/product/case-status";

export type TrialExpiryCaseSummary = {
  caseId: string;
  title: string;
  status: GovernedCaseStatus;
  updatedAt: string;
  createdAt: string;
};

export type TrialExpiryResolutionState = {
  required: boolean;
  autoResolved: boolean;
  maxActiveCases: number;
  activeCaseIds: string[];
  cases: TrialExpiryCaseSummary[];
};
