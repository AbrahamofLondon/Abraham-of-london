import { describe, expect, it } from "vitest";

import {
  buildGmiControlPlane,
  type GmiFalsificationRuleRecord,
} from "@/lib/intelligence/gmi-control-plane";
import type { PublicGmiCallLedgerEntry } from "@/lib/intelligence/gmi-instrument";
import type { GmiSourceAppendixRow } from "@/lib/intelligence/gmi-source-appendix-registry";

function call(overrides: Partial<PublicGmiCallLedgerEntry> = {}): PublicGmiCallLedgerEntry {
  return {
    callId: "GMI-Q1-2026-CALL-001",
    editionId: "GMI-Q1-2026",
    publicationDate: "2026-04-08",
    thesis: "High conviction test thesis.",
    category: "STRUCTURAL_THESIS",
    assetClass: "Macro",
    region: "Global",
    theme: "Fragmentation",
    confidenceBand: "HIGH",
    scenarioLink: null,
    reviewWindow: "Q2 2026",
    currentStatus: "DIRECTIONALLY_CONFIRMED",
    currentScore: 4,
    scoreLabel: "Directionally confirmed",
    evidenceSources: ["SRC-1", "SRC-2"],
    lastReviewedAt: "2026-06-30T00:00:00.000Z",
    nextReviewDue: "2026-09-30T00:00:00.000Z",
    versionHistory: [{ version: "1", changedAt: "2026-06-30", note: "Reviewed." }],
    ...overrides,
  };
}

function source(overrides: Partial<GmiSourceAppendixRow> = {}): GmiSourceAppendixRow {
  return {
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
    ...overrides,
  };
}

function rule(overrides: Partial<GmiFalsificationRuleRecord> = {}): GmiFalsificationRuleRecord {
  return {
    id: "RULE-1",
    editionId: "GMI-Q2-2026",
    thesisId: "test-thesis",
    thesisStatement: "High conviction test thesis.",
    falsificationCondition: "Observed evidence reverses the thesis.",
    observableIndicator: "Named observable signal.",
    thresholdType: "qualitative",
    thresholdValue: "Clear reversal by review date.",
    currentStatus: "monitoring",
    evidenceSourceRows: ["SRC-1"],
    nextReviewDue: "2026-09-30",
    lastReviewedAt: null,
    publicExplanation: "Public test rule.",
    ...overrides,
  };
}

describe("GMI control plane", () => {
  it("blocks publication if calls are unscored", () => {
    const plane = buildGmiControlPlane("GMI-Q2-2026", {
      calls: [call({ currentScore: null, currentStatus: "PENDING_REVIEW", evidenceSources: [] })],
      sourceRows: [source()],
      falsificationRules: [rule()],
    });

    expect(plane.publicationReadiness.finalVerdict).toBe("BLOCKED");
    expect(plane.publicationReadiness.callsPendingReviewCount).toBe(1);
  });

  it("blocks publication if release-blocking source is missing", () => {
    const plane = buildGmiControlPlane("GMI-Q2-2026", {
      calls: [call()],
      sourceRows: [source({ status: "SOURCE_PENDING", releaseBlocker: true })],
      falsificationRules: [rule()],
    });

    expect(plane.publicationReadiness.finalVerdict).toBe("BLOCKED");
    expect(plane.publicationReadiness.releaseBlockingSourcesOpen).toBe(1);
  });

  it("blocks publication if falsification threshold is missing", () => {
    const plane = buildGmiControlPlane("GMI-Q2-2026", {
      calls: [call()],
      sourceRows: [source()],
      falsificationRules: [],
    });

    expect(plane.publicationReadiness.finalVerdict).toBe("BLOCKED");
    expect(plane.publicationReadiness.falsificationThresholdsMissing).toBe(1);
  });

  it("returns READY only when all gates pass", () => {
    const plane = buildGmiControlPlane("GMI-Q2-2026", {
      calls: [call()],
      sourceRows: [source()],
      falsificationRules: [rule()],
    });

    expect(plane.publicationReadiness.finalVerdict).toBe("READY");
    expect(plane.publicationReadiness.blockerReasons).toHaveLength(0);
  });
});
