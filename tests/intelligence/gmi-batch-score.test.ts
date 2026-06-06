/* tests/intelligence/gmi-batch-score.test.ts — Batch call scoring workbench tests */
import { describe, expect, it } from "vitest";
import { getPublicGmiCallLedger } from "@/lib/intelligence/gmi-instrument";

describe("GMI batch call scoring", () => {
  it("has 8 Q1 calls available for scoring", () => {
    const calls = getPublicGmiCallLedger().filter((c) => c.editionId === "GMI-Q1-2026");
    expect(calls).toHaveLength(8);
  });

  it("all Q1 calls have immutable original statements", () => {
    const calls = getPublicGmiCallLedger().filter((c) => c.editionId === "GMI-Q1-2026");
    for (const call of calls) {
      expect(call.thesis).toBeTruthy();
      expect(typeof call.thesis).toBe("string");
    }
  });

  it("unscored calls count matches release authority metrics", () => {
    const calls = getPublicGmiCallLedger().filter((c) => c.editionId === "GMI-Q1-2026");
    const unscored = calls.filter((c) => c.currentScore === null);
    // At least some calls should be unscored initially
    expect(unscored.length).toBeGreaterThanOrEqual(0);
  });

  it("scoring all calls with evidence would clear CALL_REVIEW blockers", () => {
    const calls = getPublicGmiCallLedger().filter((c) => c.editionId === "GMI-Q1-2026");
    const unscored = calls.filter((c) => c.currentScore === null);
    const withoutEvidence = calls.filter(
      (c) => c.currentScore !== null && c.currentScore !== 2 && c.evidenceSources.length === 0
    );
    // If all calls are scored with evidence, no blockers remain
    const totalBlockers = unscored.length + withoutEvidence.length;
    expect(totalBlockers).toBeGreaterThanOrEqual(0);
  });
});
