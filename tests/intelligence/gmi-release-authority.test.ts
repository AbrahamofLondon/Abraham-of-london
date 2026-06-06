/* tests/intelligence/gmi-release-authority.test.ts — Release Authority Tests */
/* Updated for Q2 editorial unblocking — Q2 is now READY_FOR_PUBLICATION */
import { describe, expect, it } from "vitest";
import {
  resolveGmiReleaseState,
  assertGmiEditionPublishable,
  buildGmiReleaseSnapshot,
} from "@/lib/intelligence/gmi-release-authority";

describe("GMI release authority", () => {
  it("Q2 is READY_FOR_PUBLICATION after editorial unblocking", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.releaseStatus).toBe("READY_FOR_PUBLICATION");
  });

  it("primaryNextAction is READY_FOR_PUBLICATION when all blockers clear", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.releaseStatus).toBe("READY_FOR_PUBLICATION");
    expect(state.primaryNextAction).toBe("READY_FOR_PUBLICATION");
  });

  it("blockerCategories is empty when all blockers are resolved", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.blockerCategories).toHaveLength(0);
  });

  it("canPublish is true when all blocker categories clear", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.canPublish).toBe(true);
  });

  it("assertGmiEditionPublishable returns ok for Q2 after unblocking", () => {
    const result = assertGmiEditionPublishable("GMI-Q2-2026");
    expect(result.ok).toBe(true);
  });

  it("buildGmiReleaseSnapshot creates a snapshot with READY_FOR_PUBLICATION status", () => {
    const snapshot = buildGmiReleaseSnapshot("GMI-Q2-2026");
    expect(snapshot.editionId).toBe("GMI-Q2-2026");
    expect(snapshot.releaseStatus).toBe("READY_FOR_PUBLICATION");
    expect(snapshot.primaryNextAction).toBe("READY_FOR_PUBLICATION");
    expect(snapshot.callLedgerHash).toBeTruthy();
    expect(snapshot.sourceAppendixHash).toBeTruthy();
    expect(snapshot.falsificationHash).toBeTruthy();
    expect(snapshot.boardPulseHash).toBeTruthy();
    expect(snapshot.blockerCategoriesJson).toHaveLength(0);
    expect(snapshot.methodologyVersion).toBeTruthy();
    expect(snapshot.rubricVersion).toBeTruthy();
  });

  it("release state has required metrics", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.metrics.totalCalls).toBeGreaterThanOrEqual(0);
    expect(state.metrics.reviewedCalls).toBeGreaterThanOrEqual(0);
    expect(state.metrics.unscoredCalls).toBe(0);
    expect(state.metrics.releaseBlockingSourcesOpen).toBe(0);
    expect(state.metrics.falsificationRulesMissing).toBe(0);
    expect(typeof state.metrics.boardPulseComplete).toBe("boolean");
    expect(state.generatedAt).toBeTruthy();
  });

  it("release state has no required actions when ready", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.requiredActions).toHaveLength(0);
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

  it("criticalBlockerCount is 0 when ready", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.criticalBlockerCount).toBe(0);
  });
});
