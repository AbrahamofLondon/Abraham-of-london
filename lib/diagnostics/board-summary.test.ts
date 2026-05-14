import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildBoardSummaryFromFastDiagnostic,
  buildBoardSummaryFromExecutiveReport,
  buildBoardSummaryFromSessionStorage,
} from "./board-summary";
import type { FastDiagnosticResult } from "./fast-diagnostic-dto";
import type { ExecutiveReport } from "@/lib/admin/reporting/executive-report-contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function fastResult(overrides: Partial<FastDiagnosticResult> = {}): FastDiagnosticResult {
  return {
    caseRef: "case_001",
    condition: "UNRESOLVED",
    conditionLabel: "Unresolved decision exposure",
    signalStrength: "high",
    fullAnalysis: true,
    recoveryQuestion: null,
    synthesis: {
      verdict: "Decision structure failure.",
      primaryContradiction: "Authority and accountability are separated.",
      avoidedDecision: "Whether to restructure the leadership team",
      whyPriorAttemptsFailed: "No single owner.",
      concreteMove: "Appoint one accountable decision-maker.",
      defaultPathForecast: "Delay becomes the default position.",
      certaintyBoundary: "System-inferred.",
      quotedUserLanguage: [],
    },
    forecast: {
      sevenDays: "No progress without structure.",
      thirtyDays: "Workarounds replace decisions.",
      ninetyDays: "Structural damage.",
      controlShiftSummary: "Control is drifting.",
    },
    contradictionText: null,
    reviewMessage: null,
    stateToken: "tok_abc",
    anchorNarrative: {
      opening: "The decision has been deferred.",
      condition: "Structural avoidance",
      whyItExists: "No binding authority was assigned.",
      pattern: "Repeated deferral",
      costOfInaction: {
        thirtyDays: "30-day narrative",
        sixtyDays: "60-day narrative",
        ninetyDays: "90-day narrative",
      },
      perspective: "External view.",
      requiredMove: "Assign one owner with binding authority.",
      cta: "Run the fast diagnostic.",
    },
    highestSignalSeverity: "ALERT",
    comparisonBand: "Above median delay exposure",
    ...overrides,
  };
}

function execReport(overrides: Partial<ExecutiveReport> = {}): ExecutiveReport {
  return {
    headline: "Governance drift — authority collapse imminent",
    route: "DIAGNOSE",
    seriousness: "HIGH",
    governanceRisk: 78,
    topPressurePoints: ["Authority unclear", "No resolution timeline", "Escalation stalled"],
    domainBreakdown: { strategic: 40, financial: 30, operational: 20, humanCapital: 5, governance: 5 },
    decisionOptions: ["Restructure", "Delegate"],
    tradeOffMap: ["Speed vs completeness"],
    correctionPriorities: ["Re-establish clear authority"],
    executionSequence: {
      next7Days: ["Identify authority owner"],
      next30Days: ["Formal ownership assignment"],
      next90Days: ["Governance review"],
    },
    escalationRecommendation: "Escalate to board within 14 days.",
    ...overrides,
  };
}

// ─── buildBoardSummaryFromFastDiagnostic ──────────────────────────────────────

describe("buildBoardSummaryFromFastDiagnostic", () => {
  it("maps title from answers.decision when available", () => {
    const data = buildBoardSummaryFromFastDiagnostic(fastResult(), { decision: "Custom decision text" });
    expect(data.title).toBe("Custom decision text");
  });

  it("falls back to synthesis.avoidedDecision when answers.decision is absent", () => {
    const data = buildBoardSummaryFromFastDiagnostic(fastResult(), {});
    expect(data.title).toBe("Whether to restructure the leadership team");
  });

  it("falls back to default title when both are absent", () => {
    const data = buildBoardSummaryFromFastDiagnostic(
      fastResult({ synthesis: null }),
      {},
    );
    expect(data.title).toBe("Unresolved decision");
  });

  it("maps conditionLabel from result", () => {
    const data = buildBoardSummaryFromFastDiagnostic(fastResult());
    expect(data.conditionLabel).toBe("Unresolved decision exposure");
  });

  it("maps anchorNarrative costOfInaction when available", () => {
    const data = buildBoardSummaryFromFastDiagnostic(fastResult());
    expect(data.costOfInaction.thirtyDays).toBe("30-day narrative");
    expect(data.costOfInaction.sixtyDays).toBe("60-day narrative");
    expect(data.costOfInaction.ninetyDays).toBe("90-day narrative");
  });

  it("falls back to costOfInaction.horizon* when anchorNarrative absent", () => {
    const result = fastResult({
      anchorNarrative: undefined,
      costOfInaction: {
        exposureBand: "high",
        horizon30: "horizon 30",
        horizon60: "horizon 60",
        horizon90: "horizon 90",
        executiveWarning: "warning",
      },
    });
    const data = buildBoardSummaryFromFastDiagnostic(result);
    expect(data.costOfInaction.thirtyDays).toBe("horizon 30");
    expect(data.costOfInaction.sixtyDays).toBe("horizon 60");
    expect(data.costOfInaction.ninetyDays).toBe("horizon 90");
  });

  it("provenanceHash is always null — never faked", () => {
    const data = buildBoardSummaryFromFastDiagnostic(fastResult());
    expect(data.provenanceHash).toBeNull();
  });

  it("scenarioOnly is always true", () => {
    const data = buildBoardSummaryFromFastDiagnostic(fastResult());
    expect(data.scenarioOnly).toBe(true);
  });

  it("sourceLabel is 'Fast Diagnostic'", () => {
    const data = buildBoardSummaryFromFastDiagnostic(fastResult());
    expect(data.sourceLabel).toBe("Fast Diagnostic");
  });

  it("maps detectedSignals when present", () => {
    const result = fastResult({
      detectedSignals: [
        {
          signalName: "Authority vacuum",
          severityBand: "ALERT",
          narrativeSummary: "No binding authority assigned.",
        } as FastDiagnosticResult["detectedSignals"] extends Array<infer T> | undefined ? T : never,
      ],
    });
    const data = buildBoardSummaryFromFastDiagnostic(result);
    expect(data.detectedSignals).toHaveLength(1);
    expect(data.detectedSignals?.[0]?.signalName).toBe("Authority vacuum");
  });

  it("handles missing synthesis gracefully", () => {
    const data = buildBoardSummaryFromFastDiagnostic(fastResult({ synthesis: null }));
    expect(data.primaryContradiction).toBeTruthy();
  });

  it("comparisonBand is passed through from result", () => {
    const data = buildBoardSummaryFromFastDiagnostic(fastResult());
    expect(data.comparisonBand).toBe("Above median delay exposure");
  });

  it("null comparisonBand stays null", () => {
    const data = buildBoardSummaryFromFastDiagnostic(fastResult({ comparisonBand: null }));
    expect(data.comparisonBand).toBeNull();
  });
});

// ─── buildBoardSummaryFromExecutiveReport ─────────────────────────────────────

describe("buildBoardSummaryFromExecutiveReport", () => {
  it("maps headline as title", () => {
    const data = buildBoardSummaryFromExecutiveReport(execReport());
    expect(data.title).toBe("Governance drift — authority collapse imminent");
  });

  it("maps route as conditionLabel", () => {
    const data = buildBoardSummaryFromExecutiveReport(execReport());
    expect(data.conditionLabel).toBe("DIAGNOSE");
  });

  it("maps seriousness as severityBand", () => {
    const data = buildBoardSummaryFromExecutiveReport(execReport());
    expect(data.severityBand).toBe("HIGH");
  });

  it("HIGH seriousness maps to high signalStrength", () => {
    const data = buildBoardSummaryFromExecutiveReport(execReport({ seriousness: "HIGH" }));
    expect(data.signalStrength).toBe("high");
  });

  it("CRITICAL seriousness maps to high signalStrength", () => {
    const data = buildBoardSummaryFromExecutiveReport(execReport({ seriousness: "CRITICAL" }));
    expect(data.signalStrength).toBe("high");
  });

  it("LOW seriousness maps to moderate signalStrength", () => {
    const data = buildBoardSummaryFromExecutiveReport(execReport({ seriousness: "LOW" }));
    expect(data.signalStrength).toBe("moderate");
  });

  it("maps first correctionPriority as requiredMove", () => {
    const data = buildBoardSummaryFromExecutiveReport(execReport());
    expect(data.requiredMove).toBe("Re-establish clear authority");
  });

  it("provenanceHash is always null — never faked", () => {
    const data = buildBoardSummaryFromExecutiveReport(execReport());
    expect(data.provenanceHash).toBeNull();
  });

  it("scenarioOnly is always true", () => {
    const data = buildBoardSummaryFromExecutiveReport(execReport());
    expect(data.scenarioOnly).toBe(true);
  });

  it("sourceLabel is 'Executive Reporting'", () => {
    const data = buildBoardSummaryFromExecutiveReport(execReport());
    expect(data.sourceLabel).toBe("Executive Reporting");
  });
});

// ─── buildBoardSummaryFromSessionStorage ──────────────────────────────────────

describe("buildBoardSummaryFromSessionStorage", () => {
  const storageMock = new Map<string, string>();
  const localMock = new Map<string, string>();

  beforeEach(() => {
    storageMock.clear();
    localMock.clear();

    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => storageMock.get(key) ?? null,
      setItem: (key: string, value: string) => storageMock.set(key, value),
    });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => localMock.get(key) ?? null,
      setItem: (key: string, value: string) => localMock.set(key, value),
    });
  });

  it("returns null when sessionStorage is empty", () => {
    const result = buildBoardSummaryFromSessionStorage();
    expect(result).toBeNull();
  });

  it("uses Fast result when available", () => {
    const result = fastResult();
    storageMock.set("aol_fast_result", JSON.stringify(result));
    const data = buildBoardSummaryFromSessionStorage();
    expect(data).not.toBeNull();
    expect(data?.sourceLabel).toBe("Fast Diagnostic");
  });

  it("includes completedSurfaces from detected session keys", () => {
    storageMock.set("aol_fast_result", JSON.stringify(fastResult()));
    storageMock.set("team-assessment-result", JSON.stringify({ patternTitle: "Drift" }));
    const data = buildBoardSummaryFromSessionStorage();
    expect(data?.completedSurfaces).toContain("Fast Diagnostic");
    expect(data?.completedSurfaces).toContain("Team Assessment");
  });

  it("provenanceHash is null from Fast result — never faked", () => {
    storageMock.set("aol_fast_result", JSON.stringify(fastResult()));
    const data = buildBoardSummaryFromSessionStorage();
    expect(data?.provenanceHash).toBeNull();
  });

  it("falls back to Enterprise result when Fast is absent", () => {
    storageMock.set("enterprise-assessment-result", JSON.stringify({
      recentDecision: "Whether to proceed",
      band: "HIGH",
      primaryReading: "Governance drift detected.",
    }));
    const data = buildBoardSummaryFromSessionStorage();
    expect(data).not.toBeNull();
    expect(data?.sourceLabel).toBe("Enterprise Assessment");
    expect(data?.title).toBe("Whether to proceed");
  });

  it("Enterprise result exposes provenanceHash when present", () => {
    storageMock.set("enterprise-assessment-result", JSON.stringify({
      recentDecision: "Whether to proceed",
      band: "HIGH",
      provenanceHash: "abc123def456789012",
    }));
    const data = buildBoardSummaryFromSessionStorage();
    expect(data?.provenanceHash).toBe("abc123def456789012");
  });

  it("returns null when Enterprise result has no meaningful data", () => {
    storageMock.set("enterprise-assessment-result", JSON.stringify({}));
    const data = buildBoardSummaryFromSessionStorage();
    expect(data).toBeNull();
  });

  it("degrades safely on malformed JSON without throwing", () => {
    storageMock.set("aol_fast_result", "NOT_VALID_JSON{{{");
    expect(() => buildBoardSummaryFromSessionStorage()).not.toThrow();
  });

  it("scenarioOnly is always true", () => {
    storageMock.set("aol_fast_result", JSON.stringify(fastResult()));
    const data = buildBoardSummaryFromSessionStorage();
    expect(data?.scenarioOnly).toBe(true);
  });
});

// ─── Scenario disclaimer always present ───────────────────────────────────────

describe("scenario disclaimer always present", () => {
  it("Fast builder includes scenarioOnly flag", () => {
    const data = buildBoardSummaryFromFastDiagnostic(fastResult());
    expect(data.scenarioOnly).toBe(true);
  });

  it("Executive builder includes scenarioOnly flag", () => {
    const data = buildBoardSummaryFromExecutiveReport(execReport());
    expect(data.scenarioOnly).toBe(true);
  });
});
