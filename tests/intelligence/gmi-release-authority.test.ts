import { describe, expect, it } from "vitest";

import {
  assertGmiEditionPublishable,
  buildGmiReleaseSnapshot,
  resolveGmiReleaseState,
} from "@/lib/intelligence/gmi-release-authority";

describe("GMI release authority", () => {
  it("uses DATA_PROVENANCE only when required runtime state is not data-derived", async () => {
    const state = await resolveGmiReleaseState("GMI-Q2-2026");

    if (state.provenance.isDataDerived) {
      expect(state.blockerCategories).not.toContain("DATA_PROVENANCE");
    } else {
      expect(state.releaseStatus).toBe("BLOCKED");
      expect(state.canPublish).toBe(false);
      expect(state.blockerCategories).toContain("DATA_PROVENANCE");
    }
  });

  it("never treats static fallback as production-safe release provenance", async () => {
    const state = await resolveGmiReleaseState("GMI-Q2-2026");

    expect(state.provenance.calls.sourceType).not.toBe("FALLBACK_STATIC");
    expect(state.provenance.sources.sourceType).not.toBe("FALLBACK_STATIC");
    expect(state.provenance.falsificationRules.sourceType).not.toBe("FALLBACK_STATIC");
    expect(state.provenance.performance.sourceName).toBe("gmi_call_ledger_entries:derived-performance");
  });

  it("assertGmiEditionPublishable agrees with resolved release state", async () => {
    const [state, result] = await Promise.all([
      resolveGmiReleaseState("GMI-Q2-2026"),
      assertGmiEditionPublishable("GMI-Q2-2026"),
    ]);

    expect(result.ok).toBe(state.canPublish);
    if (!result.ok && state.releaseStatus !== "PUBLISHED") {
      expect(result.blockers.length).toBeGreaterThan(0);
    }
  });

  it("buildGmiReleaseSnapshot records the current release decision", async () => {
    const [state, snapshot] = await Promise.all([
      resolveGmiReleaseState("GMI-Q2-2026"),
      buildGmiReleaseSnapshot("GMI-Q2-2026"),
    ]);

    expect(snapshot.editionId).toBe("GMI-Q2-2026");
    expect(snapshot.releaseStatus).toBe(state.releaseStatus);
    expect(snapshot.blockerCategoriesJson).toEqual(state.blockerCategories);
    expect(snapshot.callLedgerHash).toBeTruthy();
    expect(snapshot.sourceAppendixHash).toBeTruthy();
    expect(snapshot.falsificationHash).toBeTruthy();
    expect(snapshot.boardPulseHash).toBeTruthy();
    expect(snapshot.methodologyVersion).toBeTruthy();
    expect(snapshot.rubricVersion).toBeTruthy();
  });

  it("release state keeps required metrics and blocker fields stable", async () => {
    const state = await resolveGmiReleaseState("GMI-Q2-2026");

    expect(state.metrics.totalCalls).toBeGreaterThanOrEqual(0);
    expect(state.metrics.reviewedCalls).toBeGreaterThanOrEqual(0);
    expect(typeof state.metrics.boardPulseComplete).toBe("boolean");
    expect(state.generatedAt).toBeTruthy();

    for (const blocker of state.blockers) {
      expect(blocker.id).toBeTruthy();
      expect(blocker.severity).toBeTruthy();
      expect(blocker.category).toBeTruthy();
      expect(blocker.message).toBeTruthy();
      expect(typeof blocker.blocksPublication).toBe("boolean");
    }
  });
});
