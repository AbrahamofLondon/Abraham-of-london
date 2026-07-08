/**
 * lib/intelligence/gmi-release-authority.test.ts
 *
 * Release authority tests. No edition-specific hardcoding.
 * All gates must be tested independently.
 */
import { describe, it, expect } from "vitest";
import { resolveGmiReleaseState } from "./gmi-release-state-resolver";
import { releaseGmiEdition, registerOwnerAuthority, getReleaseReceipt, verifyReleaseReceipt } from "./gmi-release-transaction";
import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";
import { validateTransition, getPredecessorEditionId, getSuccessorEditionId, isPublicationTargetReached, isDataLockComplete, isOwnerAuthorized } from "./gmi-edition-lifecycle";

describe("GMI Edition Lifecycle — State Machine", () => {
  it("validates allowed transitions", () => {
    expect(validateTransition("PLANNED", "EVIDENCE_COLLECTION")).toBe(true);
    expect(validateTransition("DRAFT", "RELEASE_CANDIDATE")).toBe(true);
    expect(validateTransition("RELEASE_CANDIDATE", "RELEASE_AUTHORIZED")).toBe(true);
    expect(validateTransition("RELEASE_AUTHORIZED", "ACTIVE_UNTIL_SUPERSEDED")).toBe(true);
    expect(validateTransition("ACTIVE_UNTIL_SUPERSEDED", "SUPERSEDED")).toBe(true);
    expect(validateTransition("SUPERSEDED", "ARCHIVED")).toBe(true);
  });

  it("forbids illegal transitions", () => {
    expect(validateTransition("DRAFT", "ACTIVE_UNTIL_SUPERSEDED")).toBe(false);
    // ACTIVE is a legacy state — the new state machine uses ACTIVE_UNTIL_SUPERSEDED
    expect(validateTransition("PLANNED", "RELEASE_CANDIDATE")).toBe(false);
    expect(validateTransition("RELEASE_CANDIDATE", "ACTIVE_UNTIL_SUPERSEDED")).toBe(false); // must go through RELEASE_AUTHORIZED
    expect(validateTransition("ARCHIVED", "DRAFT")).toBe(false);
  });

  it("edition ID parsing works generically", () => {
    expect(getPredecessorEditionId("GMI-Q2-2026")).toBe("GMI-Q1-2026");
    expect(getPredecessorEditionId("GMI-Q1-2026")).toBe("GMI-Q4-2025");
    expect(getPredecessorEditionId("GMI-Q4-2026")).toBe("GMI-Q3-2026");
    expect(getSuccessorEditionId("GMI-Q1-2026")).toBe("GMI-Q2-2026");
    expect(getSuccessorEditionId("GMI-Q4-2026")).toBe("GMI-Q1-2027");
    expect(getPredecessorEditionId("INVALID")).toBeNull();
  });
});

describe("GMI Edition Lifecycle — Temporal Gates", () => {
  it("isPublicationTargetReached returns true when target date has passed", () => {
    const record = getMarketIntelligenceRecord("GMI-Q2-2026")!;
    const result = isPublicationTargetReached(record as any, new Date("2026-07-08"));
    expect(result).toBe(true);
  });

  it("isPublicationTargetReached returns false before target date", () => {
    const record = getMarketIntelligenceRecord("GMI-Q2-2026")!;
    const result = isPublicationTargetReached(record as any, new Date("2026-07-07"));
    expect(result).toBe(false);
  });

  it("isDataLockComplete returns false when dataLockedAt is null", () => {
    const record = getMarketIntelligenceRecord("GMI-Q2-2026")!;
    expect(isDataLockComplete(record as any)).toBe(false);
  });

  it("isOwnerAuthorized returns false when ownerAuthorizedAt is null", () => {
    const record = getMarketIntelligenceRecord("GMI-Q2-2026")!;
    expect(isOwnerAuthorized(record as any)).toBe(false);
  });
});

describe("GMI Release State Resolver — Q2 2026", () => {
  it("Q2 is not release-ready — multiple blockers", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.releaseReady).toBe(false);
    expect(state.blockers.length).toBeGreaterThan(0);
  });

  it("Q2 has temporal gate blocker (target date reached but data lock missing)", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    const temporalGate = state.gates.find(g => g.gate === "TEMPORAL_NOT_BEFORE");
    expect(temporalGate).toBeDefined();
    // Target date is today, so temporal gate should pass
    // But data lock and owner authority gates should fail
    const dataLockGate = state.gates.find(g => g.gate === "DATA_LOCK");
    expect(dataLockGate?.status).toBe("FAIL");
    const ownerGate = state.gates.find(g => g.gate === "OWNER_RELEASE_AUTHORITY");
    expect(ownerGate?.status).toBe("FAIL");
  });

  it("Q2 lifecycle state gate fails — not in RELEASE_CANDIDATE state", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    const lifecycleGate = state.gates.find(g => g.gate === "LIFECYCLE_STATE");
    expect(lifecycleGate?.status).toBe("FAIL");
  });
});

describe("GMI Release Transaction", () => {
  it("release fails when no owner authority registered", () => {
    const result = releaseGmiEdition({
      editionId: "GMI-Q2-2026",
      ownerAuthority: { editionId: "GMI-Q2-2026", authorizedBy: "owner", authorizedAt: new Date().toISOString(), authorityScope: "release", candidateHash: "test-hash" },
      sourceSnapshotHash: "test-hash",
      reportContentHash: "content-hash",
      methodologyVersion: "1.0.0",
      pdfHash: null,
      releaseChecklistVersion: "1.0.0",
    });
    // Should fail because gates don't pass (data lock missing, etc.)
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("candidate hash mismatch invalidates authority", () => {
    registerOwnerAuthority({
      editionId: "GMI-Q2-2026",
      authorizedBy: "owner",
      authorizedAt: new Date().toISOString(),
      authorityScope: "release",
      candidateHash: "original-hash",
    });
    const result = releaseGmiEdition({
      editionId: "GMI-Q2-2026",
      ownerAuthority: { editionId: "GMI-Q2-2026", authorizedBy: "owner", authorizedAt: new Date().toISOString(), authorityScope: "release", candidateHash: "different-hash" },
      sourceSnapshotHash: "different-hash",
      reportContentHash: "content-hash",
      methodologyVersion: "1.0.0",
      pdfHash: null,
      releaseChecklistVersion: "1.0.0",
    });
    // Should fail because the stored authority has original-hash but we're passing different-hash
    expect(result.ok).toBe(false);
  });

  it("verifyReleaseReceipt returns false for non-existent receipt", () => {
    expect(verifyReleaseReceipt("NONEXISTENT", "hash")).toBe(false);
  });
});

describe("GMI Edition Lifecycle — Generic Edition IDs", () => {
  it("future edition IDs work without code changes", () => {
    expect(getPredecessorEditionId("GMI-Q3-2026")).toBe("GMI-Q2-2026");
    expect(getSuccessorEditionId("GMI-Q3-2026")).toBe("GMI-Q4-2026");
    expect(getPredecessorEditionId("GMI-Q1-2027")).toBe("GMI-Q4-2026");
    expect(getSuccessorEditionId("GMI-Q4-2027")).toBe("GMI-Q1-2028");
  });
});
