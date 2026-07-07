/**
 * tests/product-estate/public-decision-learning-log.test.ts
 *
 * §11 — Learning Log tests: entry building, filtering, summary, edge cases.
 */
import { describe, it, expect } from "vitest";
import { getLearningLog, getLearningLogEntry, getLearningLogSummary, buildLearningLogEntry } from "../../lib/intelligence/accountability/public-decision-learning-log";
import { MARKET_CALL_LEDGER } from "../../lib/intelligence/market-intelligence-call-ledger";

describe("Public Decision Learning Log", () => {
  it("returns all entries when no filter is applied", () => {
    const log = getLearningLog();
    expect(log.length).toBeGreaterThan(0);
    expect(log.length).toBe(MARKET_CALL_LEDGER.length);
  });

  it("filters by edition", () => {
    const log = getLearningLog({ edition: "GMI-Q1-2026" });
    for (const entry of log) {
      expect(entry.edition).toBe("GMI-Q1-2026");
    }
  });

  it("filters by status", () => {
    const log = getLearningLog({ status: "PENDING_REVIEW" });
    for (const entry of log) {
      expect(entry.outcomeStatus).toBe("PENDING_REVIEW");
    }
  });

  it("getLearningLogEntry returns null for unknown call ID", () => {
    const entry = getLearningLogEntry("NONEXISTENT_CALL");
    expect(entry).toBeNull();
  });

  it("getLearningLogEntry returns entry for known call ID", () => {
    if (MARKET_CALL_LEDGER.length > 0) {
      const firstId = MARKET_CALL_LEDGER[0].id;
      const entry = getLearningLogEntry(firstId);
      expect(entry).not.toBeNull();
      expect(entry!.originalCallId).toBe(firstId);
    }
  });

  it("getLearningLogSummary returns aggregated counts", () => {
    const summary = getLearningLogSummary();
    expect(summary.totalEntries).toBeGreaterThan(0);
    expect(summary.confirmed + summary.partiallyConfirmed + summary.notConfirmed + summary.pendingReview)
      .toBe(summary.totalEntries);
    expect(summary.byEdition.length).toBeGreaterThan(0);
  });

  it("every entry has required fields", () => {
    const log = getLearningLog();
    for (const entry of log) {
      expect(entry.originalCallId).toBeTruthy();
      expect(entry.originalCall).toBeTruthy();
      expect(entry.edition).toBeTruthy();
      expect(entry.originalConfidence).toBeTruthy();
      expect(Array.isArray(entry.sourceReferences)).toBe(true);
    }
  });

  it("buildLearningLogEntry handles call with minimal fields", () => {
    const minimalCall = {
      id: "test-minimal",
      reportId: "TEST-EDITION",
      callType: "PREDICTION" as const,
      statement: "Test statement",
      originalConfidence: "LOW" as const,
      expectedReviewWindow: "2026-Q3",
    };
    const entry = buildLearningLogEntry(minimalCall as any);
    expect(entry.originalCallId).toBe("test-minimal");
    expect(entry.outcomeStatus).toBe("PENDING_REVIEW");
    expect(entry.score).toBeNull();
    expect(entry.whatChanged).toBe("No change recorded");
  });
});
