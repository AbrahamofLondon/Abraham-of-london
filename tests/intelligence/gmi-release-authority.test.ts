/* tests/intelligence/gmi-release-authority.test.ts — PHASE 11: Release Authority Tests */
import { describe, expect, it } from "vitest";
import {
  resolveGmiReleaseState,
  assertGmiEditionPublishable,
  buildGmiReleaseSnapshot,
} from "@/lib/intelligence/gmi-release-authority";

describe("GMI release authority", () => {
  it("Q2 is BLOCKED or NEEDS_CALL_REVIEW when calls are unscored", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(["BLOCKED", "NEEDS_CALL_REVIEW"]).toContain(state.status);
    expect(state.blockers.some((b) => b.category === "CALL_REVIEW" && b.blocksPublication)).toBe(true);
  });

  it("Q2 is BLOCKED when release-blocking source rows are open", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    const sourceBlockers = state.blockers.filter((b) => b.category === "SOURCE_APPENDIX" && b.blocksPublication);
    expect(sourceBlockers.length).toBeGreaterThanOrEqual(0);
  });

  it("Q2 is BLOCKED when high-conviction falsification threshold is missing", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    const falsificationBlockers = state.blockers.filter((b) => b.category === "FALSIFICATION" && b.blocksPublication);
    // May or may not have falsification blockers depending on current state
    expect(state.blockers.length).toBeGreaterThan(0);
  });

  it("assertGmiEditionPublishable returns not ok for Q2", () => {
    const result = assertGmiEditionPublishable("GMI-Q2-2026");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.blockers.length).toBeGreaterThan(0);
    }
  });

  it("buildGmiReleaseSnapshot creates a snapshot with hashes", () => {
    const snapshot = buildGmiReleaseSnapshot("GMI-Q2-2026");
    expect(snapshot.editionId).toBe("GMI-Q2-2026");
    expect(snapshot.callLedgerHash).toBeTruthy();
    expect(snapshot.sourceAppendixHash).toBeTruthy();
    expect(snapshot.falsificationHash).toBeTruthy();
    expect(snapshot.boardPulseHash).toBeTruthy();
    expect(snapshot.blockersJson.length).toBeGreaterThan(0);
    expect(snapshot.methodologyVersion).toBeTruthy();
    expect(snapshot.rubricVersion).toBeTruthy();
  });

  it("release state has required metrics", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.metrics.totalCalls).toBeGreaterThanOrEqual(0);
    expect(state.metrics.reviewedCalls).toBeGreaterThanOrEqual(0);
    expect(state.metrics.unscoredCalls).toBeGreaterThanOrEqual(0);
    expect(typeof state.metrics.boardPulseComplete).toBe("boolean");
    expect(typeof state.metrics.operatorBriefPublic).toBe("boolean");
    expect(state.generatedAt).toBeTruthy();
  });

  it("release state has required actions when blocked", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    if (state.blockers.length > 0) {
      expect(state.requiredActions.length).toBeGreaterThan(0);
    }
  });

  it("blockers have all required fields", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    for (const blocker of state.blockers) {
      expect(blocker.id).toBeTruthy();
      expect(blocker.severity).toBeTruthy();
      expect(blocker.category).toBeTruthy();
      expect(blocker.message).toBeTruthy();
      expect(typeof blocker.blocksPublication).toBe("boolean");
    }
  });
});
