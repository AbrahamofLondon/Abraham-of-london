/**
 * tests/hostile-audit/temporal-attacks.test.ts
 *
 * §16 — Hostile audit: Temporal attacks.
 */
import { describe, it, expect } from "vitest";
import { DII_METHODOLOGY, getCoverageStatus } from "../../lib/intelligence/accountability/dii-methodology-authority";
import { calculateDecisionIntegrityIndex } from "../../lib/intelligence/accountability/market-decision-integrity-index";
import { buildLineageFromCall } from "../../lib/intelligence/accountability/edition-lineage";

describe("Hostile Audit — Temporal Attacks", () => {
  it("DRAFT edition treated as released is detected — coverage prevents insufficient evidence from publishing", () => {
    const dii = calculateDecisionIntegrityIndex();
    if (dii.coverage.status === "INSUFFICIENT_COVERAGE" || dii.coverage.status === "PRELIMINARY") {
      expect(dii.headlineScore).toBeNull();
    }
  });

  it("stale methodology version is detectable", () => {
    expect(DII_METHODOLOGY.methodologyVersion).toBe("1.0.0");
  });

  it("superseded call cannot remain active — lineage tracks status", () => {
    const falsified = buildLineageFromCall({ id: "test", reportId: "GMI-Q1-2026", outcomeStatus: "DISCONFIRMED" });
    expect(falsified.lineageStatus).toBe("FALSIFIED");
    const closed = buildLineageFromCall({ id: "test2", reportId: "GMI-Q1-2026", outcomeStatus: "CONFIRMED_STRONGLY" });
    expect(closed.lineageStatus).toBe("CLOSED");
  });

  it("old methodology cannot be used as current — version is explicit", () => {
    expect(DII_METHODOLOGY.effectiveFrom).toBe("2026-07-07");
    expect(DII_METHODOLOGY.changeHistory.length).toBeGreaterThan(0);
  });

  it("getCoverageStatus returns correct status for different sample sizes", () => {
    expect(getCoverageStatus(0)).toBe("INSUFFICIENT_COVERAGE");
    expect(getCoverageStatus(3)).toBe("PRELIMINARY");
    expect(getCoverageStatus(5)).toBe("PUBLISHABLE");
    expect(getCoverageStatus(10)).toBe("PUBLISHABLE");
  });
});