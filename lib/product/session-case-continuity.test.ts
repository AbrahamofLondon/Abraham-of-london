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
      result: {
        sevenDayExposure: 5000,
        thirtyDayExposure: 21429,
        ninetyDayExposure: 64286,
        sevenDayFormatted: "£5,000",
        thirtyDayFormatted: "£21,429",
        ninetyDayFormatted: "£64,286",
        exposureStatement: "Scenario estimate.",
        structuralConsequence: "Delay compounds.",
        recommendedNextMove: "Run the Fast Diagnostic.",
        disclaimer: "Scenario only.",
        ctaHref: "/diagnostics/fast",
      },
    });

    expect(payload.source).toBe("DELAY_CALCULATOR");
    expect(payload.decisionLabel).toBeUndefined();
    expect(payload.costOfDelay?.thirtyDayExposure).toBe(21429);
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
