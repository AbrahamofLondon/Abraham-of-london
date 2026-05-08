export type PortfolioPatternStatus =
  | "NO_SHARED_PATTERN"
  | "POSSIBLE_PORTFOLIO_PATTERN"
  | "VERIFIED_PORTFOLIO_PATTERN"
  | "ESCALATING_PORTFOLIO_PATTERN"
  | "SUPPRESSED_PRIVACY_RISK"
  | "INSUFFICIENT_SAMPLE";

export type PortfolioOrganisationSnapshot = {
  organisationId: string;
  organisationName?: string;
  deterioratingDecisionCount: number;
  boardroomExposureCount: number;
  unresolvedCounselCount: number;
  recurringPatternCount: number;
  decisionCreditTrend?: "improving" | "stable" | "declining" | null;
  worseningDivergenceCount: number;
  sponsorInterventionsOverdue: number;
  allowNamedComparison?: boolean;
};

export type PortfolioPatternFinding = {
  label: string;
  status: PortfolioPatternStatus;
  organisationCount: number;
  anonymisedSummary: string;
  namedOrganisations?: string[];
};

export type PortfolioRiskAggregate = {
  fastestDeterioratingOrganisations: string[];
  boardExposureOrganisations: string[];
  overdueSponsorInterventionCount: number;
  recurringCounselEscalationCount: number;
  improvingDecisionCreditCount: number;
  spreadingGovernanceRiskCount: number;
};
