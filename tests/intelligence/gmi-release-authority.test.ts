/* tests/intelligence/gmi-release-authority.test.ts — PHASE 10: Release Authority Tests */
import { describe, expect, it } from "vitest";
import {
  resolveGmiReleaseState,
  assertGmiEditionPublishable,
  buildGmiReleaseSnapshot,
} from "@/lib/intelligence/gmi-release-authority";

describe("GMI release authority", () => {
  it("releaseStatus is BLOCKED while any blocking issue remains", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.releaseStatus).toBe("BLOCKED");
  });

  it("primaryNextAction can be NEEDS_CALL_REVIEW while status is BLOCKED", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.releaseStatus).toBe("BLOCKED");
    expect(state.primaryNextAction).toBe("NEEDS_CALL_REVIEW");
  });

  it("blockerCategories includes CALL_REVIEW, SOURCE_APPENDIX, FALSIFICATION", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.blockerCategories).toContain("CALL_REVIEW");
    expect(state.blockerCategories).toContain("SOURCE_APPENDIX");
    expect(state.blockerCategories).toContain("FALSIFICATION");
  });

  it("canPublish is false until all blocker categories clear", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.canPublish).toBe(false);
  });

  it("assertGmiEditionPublishable returns not ok for Q2", () => {
    const result = assertGmiEditionPublishable("GMI-Q2-2026");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.blockers.length).toBeGreaterThan(0);
    }
  });

  it("buildGmiReleaseSnapshot creates a snapshot with all required fields", () => {
    const snapshot = buildGmiReleaseSnapshot("GMI-Q2-2026");
    expect(snapshot.editionId).toBe("GMI-Q2-2026");
    expect(snapshot.releaseStatus).toBe("BLOCKED");
    expect(snapshot.primaryNextAction).toBe("NEEDS_CALL_REVIEW");
    expect(snapshot.callLedgerHash).toBeTruthy();
    expect(snapshot.sourceAppendixHash).toBeTruthy();
    expect(snapshot.falsificationHash).toBeTruthy();
    expect(snapshot.boardPulseHash).toBeTruthy();
    expect(snapshot.blockerCategoriesJson).toContain("CALL_REVIEW");
    expect(snapshot.blockerCategoriesJson).toContain("SOURCE_APPENDIX");
    expect(snapshot.blockerCategoriesJson).toContain("FALSIFICATION");
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
    expect(state.requiredActions.length).toBeGreaterThan(0);
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

  it("criticalBlockerCount reflects only publication-blocking blockers", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    const actualCritical = state.blockers.filter((b) => b.blocksPublication).length;
    expect(state.criticalBlockerCount).toBe(actualCritical);
  });
});