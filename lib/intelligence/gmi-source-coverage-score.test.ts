import { describe, expect, it } from "vitest";

import { calculateGmiSourceCoverageScore } from "./gmi-source-coverage-score";
import type { GmiSourceAppendixRow } from "./gmi-source-appendix-registry";

const row = (
  status: GmiSourceAppendixRow["status"],
  releaseBlocker = true,
): GmiSourceAppendixRow => ({
  id: `row-${status}-${String(releaseBlocker)}`,
  reportId: "TEST",
  claim: "Test claim",
  evidenceClass: "INSTITUTIONAL_SOURCE",
  sourceOrBasis: "Test source",
  observationWindow: "Q2 2026",
  confidence: "HIGH",
  reportSection: "Test",
  status,
  releaseBlocker,
});

describe("calculateGmiSourceCoverageScore", () => {
  it("reports pending blocker rows for Q2", () => {
    const score = calculateGmiSourceCoverageScore("GMI-Q2-2026");
    expect(score.totalRows).toBeGreaterThan(10);
    expect(score.pendingRows).toBeGreaterThan(0);
    expect(score.blockerRows).toBeGreaterThan(0);
    expect(score.releaseSafe).toBe(false);
  });

  it("returns releaseSafe false if any release-blocker row is source pending", () => {
    const score = calculateGmiSourceCoverageScore("TEST", [
      row("VERIFIED"),
      row("SOURCE_PENDING"),
    ]);
    expect(score.releaseSafe).toBe(false);
  });

  it("returns releaseSafe false below 80 coverage", () => {
    const score = calculateGmiSourceCoverageScore("TEST", [
      row("VERIFIED"),
      row("EVIDENCE_COLLECTED", false),
    ]);
    expect(score.coverageScore).toBe(50);
    expect(score.releaseSafe).toBe(false);
  });

  it("warns below 90 by exposing the coverage score even when release-safe", () => {
    const rows = [
      row("VERIFIED"),
      row("VERIFIED"),
      row("VERIFIED"),
      row("VERIFIED"),
      row("CARRIED_FORWARD"),
      row("CARRIED_FORWARD"),
      row("CARRIED_FORWARD"),
      row("CARRIED_FORWARD"),
      row("EVIDENCE_COLLECTED", false),
      row("VERIFIED"),
    ];
    const score = calculateGmiSourceCoverageScore("TEST", rows);
    expect(score.coverageScore).toBe(90);
    expect(score.releaseSafe).toBe(true);
  });
});
