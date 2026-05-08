import type { PortfolioOrganisationSnapshot, PortfolioPatternFinding } from "@/lib/product/portfolio-command-contract";

function anonymisedOrganisationCount(count: number) {
  return `${count} organisation${count === 1 ? "" : "s"}`;
}

export function buildPortfolioPatternMemory(input: {
  organisations: PortfolioOrganisationSnapshot[];
  allowNamedComparison?: boolean;
}): PortfolioPatternFinding[] {
  const organisations = input.organisations.filter((item) => item.recurringPatternCount > 0 || item.worseningDivergenceCount > 0 || item.unresolvedCounselCount > 0);
  if (organisations.length < 2) {
    return [{
      label: "Shared contradiction pattern",
      status: "INSUFFICIENT_SAMPLE",
      organisationCount: organisations.length,
      anonymisedSummary: "Insufficient sample to claim a portfolio-level recurring pattern.",
    }];
  }

  const named = input.allowNamedComparison
    ? organisations.map((item) => item.organisationName || item.organisationId)
    : undefined;

  const recurrenceHeavy = organisations.filter((item) => item.recurringPatternCount > 0);
  const divergenceHeavy = organisations.filter((item) => item.worseningDivergenceCount > 0);
  const counselHeavy = organisations.filter((item) => item.unresolvedCounselCount > 0);

  return [
    {
      label: "Shared contradiction pattern",
      status: recurrenceHeavy.length >= 3 ? "VERIFIED_PORTFOLIO_PATTERN" : "POSSIBLE_PORTFOLIO_PATTERN",
      organisationCount: recurrenceHeavy.length,
      anonymisedSummary: `${anonymisedOrganisationCount(recurrenceHeavy.length)} show recurring decision-pattern pressure.`,
      namedOrganisations: named?.slice(0, recurrenceHeavy.length),
    },
    {
      label: "Leadership failure mode spread",
      status: divergenceHeavy.length >= 3 ? "ESCALATING_PORTFOLIO_PATTERN" : divergenceHeavy.length > 0 ? "POSSIBLE_PORTFOLIO_PATTERN" : "NO_SHARED_PATTERN",
      organisationCount: divergenceHeavy.length,
      anonymisedSummary: divergenceHeavy.length > 0
        ? `${anonymisedOrganisationCount(divergenceHeavy.length)} show worsening organisational divergence.`
        : "No shared divergence pattern is verified across the current portfolio sample.",
      namedOrganisations: named?.slice(0, divergenceHeavy.length),
    },
    {
      label: "Counsel recurrence",
      status: counselHeavy.length >= 2 ? "VERIFIED_PORTFOLIO_PATTERN" : counselHeavy.length === 1 ? "POSSIBLE_PORTFOLIO_PATTERN" : "NO_SHARED_PATTERN",
      organisationCount: counselHeavy.length,
      anonymisedSummary: counselHeavy.length > 0
        ? `${anonymisedOrganisationCount(counselHeavy.length)} have unresolved counsel escalation pressure.`
        : "No shared counsel recurrence is verified across the current sample.",
      namedOrganisations: named?.slice(0, counselHeavy.length),
    },
  ];
}
