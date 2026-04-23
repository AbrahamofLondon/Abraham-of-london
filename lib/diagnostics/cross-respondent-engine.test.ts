import { describe, expect, it } from "vitest";

import { aggregateCrossRespondentDiagnostics } from "./cross-respondent-engine";

describe("aggregateCrossRespondentDiagnostics", () => {
  it("separates shared agreement from authority divergence and emits evidence nodes", () => {
    const result = aggregateCrossRespondentDiagnostics([
      {
        respondentId: "exec-1",
        respondentType: "executive",
        isExecutive: true,
        scores: {
          authority: 22,
          execution: 61,
          governance: 38,
        },
      },
      {
        respondentId: "lead-1",
        respondentType: "department_lead",
        scores: {
          authority: 78,
          execution: 64,
          governance: 42,
        },
      },
      {
        respondentId: "lead-2",
        respondentType: "department_lead",
        scores: {
          authority: 73,
          execution: 60,
          governance: 40,
        },
      },
    ]);

    expect(result.payload.primaryDivergence).toBe("authority");
    expect(result.payload.authorityDisagreement).toBe(56);
    expect(result.payload.sharedAgreementCluster).toContain("execution");
    expect(result.payload.routedNextStep).toBe("strategy_room");
    expect(result.evidenceNodes.some((node) => node.kind === "respondent_divergence")).toBe(true);
    expect(result.evidenceNodes.some((node) => node.kind === "respondent_agreement")).toBe(true);
    expect(result.evidenceNodes.some((node) => node.kind === "leadership_gap")).toBe(true);
    expect(result.evidenceNodes.some((node) => node.kind === "stakeholder_conflict")).toBe(true);
  });
});
