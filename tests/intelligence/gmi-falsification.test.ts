import { describe, expect, it } from "vitest";

import {
  buildGmiControlPlane,
  buildGmiFalsificationRegister,
  type GmiFalsificationRuleRecord,
} from "@/lib/intelligence/gmi-control-plane";
import type { PublicGmiCallLedgerEntry } from "@/lib/intelligence/gmi-instrument";
import type { GmiSourceAppendixRow } from "@/lib/intelligence/gmi-source-appendix-registry";

const highConvictionCall: PublicGmiCallLedgerEntry = {
  callId: "GMI-Q1-2026-CALL-001",
  editionId: "GMI-Q1-2026",
  publicationDate: "2026-04-08",
  thesis: "High conviction thesis.",
  category: "STRUCTURAL_THESIS",
  assetClass: "Macro",
  region: "Global",
  theme: "Falsification",
  confidenceBand: "HIGH",
  scenarioLink: null,
  reviewWindow: "Q2 2026",
  currentStatus: "DIRECTIONALLY_CONFIRMED",
  currentScore: 4,
  scoreLabel: "Directionally confirmed",
  evidenceSources: ["SRC-1"],
  lastReviewedAt: "2026-06-30T00:00:00.000Z",
  nextReviewDue: "2026-09-30T00:00:00.000Z",
  versionHistory: [{ version: "1", changedAt: "2026-06-30", note: "Reviewed." }],
};

const sourceRow: GmiSourceAppendixRow = {
  id: "SRC-1",
  reportId: "GMI-Q2-2026",
  claim: "Supported claim.",
  evidenceClass: "INSTITUTIONAL_SOURCE",
  sourceOrBasis: "Institutional source.",
  observationWindow: "Q2 2026",
  confidence: "MEDIUM",
  reportSection: "Test",
  status: "VERIFIED",
  releaseBlocker: false,
};

function rule(overrides: Partial<GmiFalsificationRuleRecord> = {}): GmiFalsificationRuleRecord {
  return {
    id: "RULE-1",
    editionId: "GMI-Q2-2026",
    thesisId: "test-thesis",
    thesisStatement: "High conviction thesis.",
    falsificationCondition: "Observable evidence reverses the thesis.",
    observableIndicator: "Named observable signal.",
    thresholdType: "qualitative",
    thresholdValue: "Clear reversal by review date.",
    currentStatus: "monitoring",
    evidenceSourceRows: ["SRC-1"],
    nextReviewDue: "2026-09-30",
    lastReviewedAt: null,
    publicExplanation: "Public rule.",
    ...overrides,
  };
}

describe("GMI falsification register", () => {
  it("requires a falsification rule for high conviction thesis publication", () => {
    const plane = buildGmiControlPlane("GMI-Q2-2026", {
      calls: [highConvictionCall],
      sourceRows: [sourceRow],
      falsificationRules: [],
    });

    expect(plane.publicationReadiness.finalVerdict).toBe("BLOCKED");
    expect(plane.publicationReadiness.falsificationThresholdsMissing).toBe(1);
  });

  it("shows breached thresholds in the public register", () => {
    const register = buildGmiFalsificationRegister("GMI-Q2-2026", [
      rule({ currentStatus: "breached", publicExplanation: "Threshold breached and under admin review." }),
    ]);

    expect(register).toHaveLength(1);
    expect(register[0].currentStatus).toBe("breached");
    expect(register[0].publicExplanation).toContain("Threshold breached");
  });

  it("blocks publication when threshold value is missing", () => {
    const plane = buildGmiControlPlane("GMI-Q2-2026", {
      calls: [highConvictionCall],
      sourceRows: [sourceRow],
      falsificationRules: [rule({ thresholdValue: "" })],
    });

    expect(plane.falsificationIntegrity.thesesWithFalsificationThresholds).toBe(0);
    expect(plane.publicationReadiness.finalVerdict).toBe("BLOCKED");
  });
});
