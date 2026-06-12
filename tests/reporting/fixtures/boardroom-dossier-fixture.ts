import type { BoardroomDossier } from "@/lib/boardroom/dossier-types";

export function buildBoardroomDossierFixture(
  overrides: Partial<BoardroomDossier> = {},
): BoardroomDossier {
  const longDecisionText = [
    "The organisation is deciding whether to continue a major operating change while authority is split across finance, delivery, and client leadership.",
    "The intake indicates that the decision has accumulated delay, unresolved ownership, and reputational exposure.",
    "The reviewer should treat this as a boardroom decision only if the unresolved evidence confirms material downside.",
  ].join(" ").repeat(4);

  return {
    organisationId: "org-boardroom-001",
    generatedAt: "2026-06-12T10:00:00.000Z",
    period: {
      from: "2026-05-01T00:00:00.000Z",
      to: "2026-06-12T00:00:00.000Z",
    },
    executiveSummary:
      "The decision should not proceed as currently framed. The material issue is not appetite, but authority: the organisation has not yet established who can own the downside if execution fails.",
    decisionPortfolio: [
      {
        decisionId: "decision-001",
        decisionText: longDecisionText,
        sourceStage: "intake",
        affectedDomain: "governance",
        confidence: 0.82,
        aiExposureLevel: "moderate",
        decisionVelocityScore: 42,
        forwardTerrainState: "constrained",
        createdAt: "2026-06-10T09:00:00.000Z",
      },
    ],
    topContradictions: [
      {
        type: "Authority split",
        severity: "high",
        userA: { role: "Finance", claim: "Budget control is the deciding constraint." },
        userB: { role: "Delivery", claim: "Execution capacity is the deciding constraint." },
        message:
          "The organisation is treating budget and execution capacity as separate questions, but the two claims collide at the decision point.",
      },
    ],
    authorityMap: [],
    riskExposure: [
      {
        contractId: "risk-001",
        commitment: "Resolve executive ownership before authorising implementation.",
        breachCount: 2,
        escalationLevel: "high",
        dueAt: "2026-06-20T00:00:00.000Z",
        status: "open",
      },
    ],
    openCommitments: [],
    breaches: [
      {
        contractId: "breach-001",
        commitment: "Previous escalation date passed without a named accountable owner.",
        breachCount: 3,
        escalationLevel: "critical",
        consequenceOfInaction: "Further delay increases cost and makes the eventual decision harder to reverse.",
        dueAt: "2026-06-01T00:00:00.000Z",
      },
    ],
    verifiedOutcomes: [
      {
        outcomeId: "outcome-001",
        outcomeClassification: "early warning confirmed",
        magnitudeOfChange: 3,
        effectivenessScore: 71,
        decisionVelocityDelta: 8,
        competitivePositionShift: 2,
        createdAt: "2026-06-11T00:00:00.000Z",
      },
    ],
    financialImpact: {
      totalCostOfDelay: 185000,
      totalRecovered: 46000,
      currency: "GBP",
    },
    recommendedBoardActions: [
      {
        priority: "critical",
        category: "authority",
        description:
          "Name a single accountable owner for the downside case before approving the next delivery milestone.",
        relatedEntityId: "decision-001",
      },
    ],
    dataCompleteness: {
      score: 84,
      missingFields: ["Final client impact estimate", "Named executive downside owner"],
    },
    sovereignSignalAssessment: null,
    ...overrides,
  };
}
