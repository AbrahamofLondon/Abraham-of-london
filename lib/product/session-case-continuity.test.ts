import { describe, expect, it } from "vitest";

import {
  buildBoardSummaryCarryForwardPayload,
  buildDelayCalculatorCarryForwardPayload,
  buildFastDiagnosticCarryForwardPayload,
} from "./session-case-continuity";
import type { FastDiagnosticResult } from "@/lib/diagnostics/fast-diagnostic-dto";

describe("session case continuity payloads", () => {
  it("keeps calculator free text out of the carry-forward payload", () => {
    const payload = buildDelayCalculatorCarryForwardPayload({
      weeklyCost: 5000,
      delayWeeks: 3,
      exposureType: "revenue",
      estimateConfidence: "rough",
    });

    expect(payload.source).toBe("DECISION_DELAY_CALCULATOR");
    // decisionLabel is intentionally absent — calculator free text is display-only
    expect(payload.decisionLabel).toBeUndefined();
    // exposure figures are stored as raw inputs, not computed output
    expect(payload.weeklyCost).toBe(5000);
    expect(payload.delayWeeks).toBe(3);
  });

  it("carries fast diagnostic case reference and governance fields", () => {
    const result: FastDiagnosticResult = {
      caseRef: "case_fast_1",
      condition: "authority",
      conditionLabel: "Authority unclear",
      signalStrength: "high",
      fullAnalysis: true,
      recoveryQuestion: null,
      synthesis: {
        verdict: "Authority gap.",
        primaryContradiction: "No binding owner.",
        avoidedDecision: "Whether to restructure",
        whyPriorAttemptsFailed: "Shared ownership.",
        concreteMove: "Assign one owner.",
        defaultPathForecast: "Delay continues.",
        certaintyBoundary: "System inferred.",
        quotedUserLanguage: [],
      },
      forecast: null,
      contradictionText: null,
      reviewMessage: null,
      stateToken: "state",
      authorityIndex: {
        band: "weak",
        label: "Weak authority",
        boardMeaning: "Escalation risk",
        nextGovernanceMove: "Assign one accountable owner.",
      },
      comparisonBand: "Above observed median",
    };

    const payload = buildFastDiagnosticCarryForwardPayload({
      result,
      decisionLabel: "Whether to restructure",
    });

    expect(payload.caseRef).toBe("case_fast_1");
    expect(payload.decisionLabel).toBe("Whether to restructure");
    expect(payload.nextGovernanceMove).toBe("Assign one accountable owner.");
    expect(payload.comparisonBand).toBe("Above observed median");
  });

  it("marks board summary payloads as session-derived case summaries", () => {
    const payload = buildBoardSummaryCarryForwardPayload({
      title: "Whether to proceed",
      conditionLabel: "Authority unclear",
      severityBand: "ALERT",
      signalStrength: "high",
      primaryContradiction: "No owner",
      costOfInaction: {
        thirtyDays: "Delay grows",
        sixtyDays: "Cost rises",
        ninetyDays: "Options narrow",
      },
      requiredMove: "Assign one owner.",
      comparisonBand: "Above observed median",
      sourceLabel: "Fast Diagnostic",
      scenarioOnly: true,
    });

    expect(payload.source).toBe("BOARD_SUMMARY");
    expect(payload.decisionLabel).toBe("Whether to proceed");
    expect(payload.nextGovernanceMove).toBe("Assign one owner.");
  });
});
