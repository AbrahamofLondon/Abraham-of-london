import type { PortfolioOrganisationSnapshot, PortfolioRiskAggregate } from "@/lib/product/portfolio-command-contract";

export function aggregatePortfolioRisk(organisations: PortfolioOrganisationSnapshot[]): PortfolioRiskAggregate {
  const orderedByDeterioration = [...organisations].sort((a, b) => b.deterioratingDecisionCount - a.deterioratingDecisionCount);
  return {
    fastestDeterioratingOrganisations: orderedByDeterioration.slice(0, 3).map((item) => item.organisationName || item.organisationId),
    boardExposureOrganisations: organisations.filter((item) => item.boardroomExposureCount > 0).map((item) => item.organisationName || item.organisationId),
    overdueSponsorInterventionCount: organisations.reduce((sum, item) => sum + item.sponsorInterventionsOverdue, 0),
    recurringCounselEscalationCount: organisations.filter((item) => item.unresolvedCounselCount > 0).length,
    improvingDecisionCreditCount: organisations.filter((item) => item.decisionCreditTrend === "improving").length,
    spreadingGovernanceRiskCount: organisations.filter((item) => item.worseningDivergenceCount > 0 || item.deterioratingDecisionCount > 0).length,
  };
}
