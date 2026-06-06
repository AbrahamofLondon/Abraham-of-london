import { describe, expect, it } from "vitest";

import {
  GMI_CALL_SCORING_RUBRIC,
  GMI_METHODOLOGY,
  getGmiRubricLabel,
} from "@/lib/intelligence/gmi-methodology";
import {
  buildGmiBoardPackSnapshot,
  buildGmiOperatorDashboard,
  GMI_ESTATE_INTEGRATION_MAP,
  getPublicGmiCallLedger,
  validateGmiEditionInstrument,
  validateGmiRedTeamChallenge,
} from "@/lib/intelligence/gmi-instrument";
import { getCallScoreLabel } from "@/lib/intelligence/market-intelligence-call-ledger";

describe("GMI locked methodology", () => {
  it("publishes a versioned fixed 0-5 call scoring rubric", () => {
    expect(GMI_METHODOLOGY.methodologyVersion).toBe("GMI-METHOD-1.0.0");
    expect(GMI_METHODOLOGY.rubricVersion).toBe("GMI-RUBRIC-1.0.0");
    expect(GMI_CALL_SCORING_RUBRIC.map((item) => item.score)).toEqual([5, 4, 3, 2, 1, 0]);
    expect(getGmiRubricLabel(2)).toBe("Too early to assess");
    expect(getCallScoreLabel(2)).toBe("Too early to assess");
    expect(getGmiRubricLabel(1)).toBe("Weakly supported");
    expect(getCallScoreLabel(1)).toBe("Weakly supported");
  });
});

describe("GMI governed edition schema", () => {
  it("blocks release when prior-call review and source appendix are missing", () => {
    const result = validateGmiEditionInstrument({
      editionId: "GMI-Q2-2026",
      methodologyVersion: GMI_METHODOLOGY.methodologyVersion,
      rubricVersion: GMI_METHODOLOGY.rubricVersion,
      requiredSections: {
        COVER_METADATA: true,
        LEGAL_BOUNDARY: true,
        BOARD_SUMMARY: true,
      },
      priorCalls: [],
      sourceAppendixRows: [],
      hardClaims: [],
      scenarioProbabilities: [],
    });

    expect(result.releaseReady).toBe(false);
    expect(result.blockers).toContain("Prior quarter call review is missing.");
    expect(result.blockers).toContain("Source appendix is missing or contains pending/blocking rows.");
    expect(result.blockers.some((blocker) => blocker.includes("PRIOR_QUARTER_CALL_REVIEW"))).toBe(true);
  });

  it("blocks scored calls without evidence or too-early justification", () => {
    const result = validateGmiEditionInstrument({
      editionId: "GMI-Q2-2026",
      methodologyVersion: GMI_METHODOLOGY.methodologyVersion,
      rubricVersion: GMI_METHODOLOGY.rubricVersion,
      requiredSections: Object.fromEntries([
        "COVER_METADATA",
        "LEGAL_BOUNDARY",
        "PRIOR_QUARTER_CALL_REVIEW",
        "BOARD_SUMMARY",
        "OPERATOR_DECISION_INTERFACE",
        "EVIDENCE_POSTURE_INDEX",
        "CORE_THESIS",
        "FALSIFICATION_CONDITIONS",
        "MACRO_SNAPSHOT",
        "CROSS_MARKET_SIGNALS",
        "SCENARIO_FRAMEWORK",
        "SOURCE_APPENDIX",
        "INSTITUTIONAL_RECORD",
      ].map((section) => [section, true])),
      priorCalls: [
        {
          id: "GMI-Q1-2026-CALL-X",
          reportId: "GMI-Q1-2026",
          callType: "PREDICTION",
          statement: "A scored call.",
          originalConfidence: "MEDIUM",
          expectedReviewWindow: "Q2 2026",
          outcomeStatus: "DIRECTIONALLY_CONFIRMED",
          score: 4,
        },
      ],
      sourceAppendixRows: [{ id: "SRC-1", status: "VERIFIED" }],
      hardClaims: [],
      scenarioProbabilities: [],
    });

    expect(result.releaseReady).toBe(false);
    expect(result.blockers).toContain(
      "Call GMI-Q1-2026-CALL-X has a score without outcome evidence or a too-early justification.",
    );
  });

  it("blocks unsupported hard claims and unguided scenario probabilities", () => {
    const result = validateGmiEditionInstrument({
      editionId: "GMI-Q2-2026",
      methodologyVersion: GMI_METHODOLOGY.methodologyVersion,
      rubricVersion: GMI_METHODOLOGY.rubricVersion,
      requiredSections: Object.fromEntries([
        "COVER_METADATA",
        "LEGAL_BOUNDARY",
        "PRIOR_QUARTER_CALL_REVIEW",
        "BOARD_SUMMARY",
        "OPERATOR_DECISION_INTERFACE",
        "EVIDENCE_POSTURE_INDEX",
        "CORE_THESIS",
        "FALSIFICATION_CONDITIONS",
        "MACRO_SNAPSHOT",
        "CROSS_MARKET_SIGNALS",
        "SCENARIO_FRAMEWORK",
        "SOURCE_APPENDIX",
        "INSTITUTIONAL_RECORD",
      ].map((section) => [section, true])),
      priorCalls: [
        {
          id: "GMI-Q1-2026-CALL-Y",
          reportId: "GMI-Q1-2026",
          callType: "RISK_WARNING",
          statement: "Too early with justification.",
          originalConfidence: "HIGH",
          expectedReviewWindow: "Q2 2026",
          outcomeStatus: "TOO_EARLY_TO_ASSESS",
          score: 2,
          outcomeSummary: "Evidence window has not matured.",
        },
      ],
      sourceAppendixRows: [{ id: "SRC-1", status: "VERIFIED" }],
      hardClaims: [
        {
          claim: "A hard macro number without a source row.",
          type: "HARD_MACRO_NUMBER",
          posture: "HIGH",
        },
      ],
      scenarioProbabilities: [
        {
          label: "Base case",
          probability: 100,
          methodNote: "",
          keyAssumptions: [],
          triggerVariables: [],
          whatChangesThisProbability: "",
        },
      ],
    });

    expect(result.releaseReady).toBe(false);
    expect(result.blockers).toContain("Unsupported hard claim: A hard macro number without a source row.");
    expect(result.blockers.some((blocker) => blocker.includes("Scenario probability lacks method"))).toBe(true);
  });
});

describe("GMI public instrument surfaces", () => {
  it("serialises the public call ledger without private notes", () => {
    const calls = getPublicGmiCallLedger();
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0]).toHaveProperty("callId");
    expect(calls[0]).toHaveProperty("versionHistory");
    expect(calls[0]).not.toHaveProperty("privateNotes");
    expect(calls[0]).not.toHaveProperty("internalWorkflow");
  });

  it("builds a static operator dashboard before an interactive explorer", () => {
    const dashboard = buildGmiOperatorDashboard("GMI-Q2-2026");
    expect(dashboard.watchSignals).toHaveLength(3);
    expect(dashboard.boardDecisions).toHaveLength(5);
    expect(dashboard.scenarioProbabilities.map((scenario) => scenario.probability).reduce((a, b) => a + b, 0)).toBe(100);
    expect(dashboard.boardDecisions.some((decision) => decision.route === "/boardroom-brief")).toBe(true);
    expect(dashboard.boardDecisions.some((decision) => decision.route === "/strategy-room")).toBe(true);
    expect(dashboard.callLedgerHref).toBe("/intelligence/gmi/calls");
  });

  it("builds a board-pack export shell from edition data", () => {
    const pack = buildGmiBoardPackSnapshot("GMI-Q2-2026");
    expect(pack.title).toContain("Board Pack Snapshot");
    expect(pack.watchSignals).toHaveLength(3);
    expect(pack.boardDecisions).toHaveLength(5);
    expect(pack.legalBoundary).toContain("not investment advice");
  });

  it("declares the required public GMI estate routes", () => {
    const routes = GMI_ESTATE_INTEGRATION_MAP.map((item) => item.route);
    expect(routes).toContain("/intelligence/gmi");
    expect(routes).toContain("/intelligence/gmi/q2-2026");
    expect(routes).toContain("/intelligence/gmi/calls");
    expect(routes).toContain("/intelligence/gmi/methodology");
    expect(routes).toContain("/intelligence/gmi/operator-brief");
    expect(routes).toContain("/intelligence/gmi/red-team");
  });
});

describe("GMI Red Team challenge governance", () => {
  it("accepts a specific sourced challenge against a registered call", () => {
    const callId = getPublicGmiCallLedger()[0].callId;
    const result = validateGmiRedTeamChallenge({
      callId,
      counterThesis:
        "The stated call may be over-weighting fragmentation because the strongest observable data now points to durable policy relief.",
      evidence:
        "The evidence challenge cites a named policy implementation sequence and shows why it directly alters the falsification threshold.",
      sourceLinks: ["https://example.com/source"],
      submitterName: "Test Reviewer",
      submitterEmail: "reviewer@example.com",
      consentToPublishIfSelected: true,
    });

    expect(result.accepted).toBe(true);
  });

  it("rejects anonymous or unsourced challenges", () => {
    const result = validateGmiRedTeamChallenge({
      callId: "missing",
      counterThesis: "Too short",
      evidence: "No source",
      sourceLinks: [],
      submitterName: "",
      submitterEmail: "bad",
      consentToPublishIfSelected: false,
    });

    expect(result.accepted).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

