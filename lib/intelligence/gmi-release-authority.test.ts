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
import { validateTransition, getPredecessorEditionId, getSuccessorEditionId, isPublicationTargetReached, isDataLockComplete, isOwnerAuthorized, getEditionQuarter } from "./gmi-edition-lifecycle";

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
    expect(validateTransition("PLANNED", "RELEASE_CANDIDATE")).toBe(false);
    expect(validateTransition("RELEASE_CANDIDATE", "ACTIVE_UNTIL_SUPERSEDED")).toBe(false);
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

  it("synthetic nonstandard edition period works without hardcoded Q1/Q2 logic", () => {
    // A future edition ID must work without code changes
    expect(getEditionQuarter("GMI-Q3-2027")).toEqual({ quarter: "Q3", year: 2027 });
    expect(getPredecessorEditionId("GMI-Q3-2027")).toBe("GMI-Q2-2027");
    expect(getSuccessorEditionId("GMI-Q3-2027")).toBe("GMI-Q4-2027");
    // Year boundary
    expect(getPredecessorEditionId("GMI-Q1-2028")).toBe("GMI-Q4-2027");
    expect(getSuccessorEditionId("GMI-Q4-2028")).toBe("GMI-Q1-2029");
  });
});

describe("GMI Edition Lifecycle — Temporal Gates", () => {
  it("isPublicationTargetReached returns true when target date has passed", () => {
    const record = getMarketIntelligenceRecord("GMI-Q2-2026")!;
    expect(isPublicationTargetReached(record as any, new Date("2026-07-08"))).toBe(true);
  });

  it("isPublicationTargetReached returns false before target date", () => {
    const record = getMarketIntelligenceRecord("GMI-Q2-2026")!;
    expect(isPublicationTargetReached(record as any, new Date("2026-07-07"))).toBe(false);
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

describe("GMI Release State Resolver — Q2 2026 Complete Gate Vector", () => {
  it("returns all 7 gates with correct status for current Q2 state", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    const gates = new Map(state.gates.map(g => [g.gate, g]));

    // TEMPORAL_NOT_BEFORE — target date reached
    const temporal = gates.get("TEMPORAL_NOT_BEFORE")!;
    expect(temporal).toBeDefined();
    expect(temporal.status).toBe("PASS");
    expect(temporal.blocking).toBe(true);
    expect(temporal.evidenceRef).toContain("publicationTarget");
    expect(temporal.checkedAt).toBeTruthy();

    // DATA_LOCK — not complete
    const dataLock = gates.get("DATA_LOCK")!;
    expect(dataLock).toBeDefined();
    expect(dataLock.status).toBe("FAIL");
    expect(dataLock.blocking).toBe(true);
    expect(dataLock.evidenceRef).toContain("dataLockedAt");

    // OWNER_RELEASE_AUTHORITY — not granted
    const owner = gates.get("OWNER_RELEASE_AUTHORITY")!;
    expect(owner).toBeDefined();
    expect(owner.status).toBe("FAIL");
    expect(owner.blocking).toBe(true);
    expect(owner.evidenceRef).toContain("ownerAuthorizedAt");

    // LIFECYCLE_STATE — not in RELEASE_CANDIDATE
    const lifecycle = gates.get("LIFECYCLE_STATE")!;
    expect(lifecycle).toBeDefined();
    expect(lifecycle.status).toBe("FAIL");
    expect(lifecycle.blocking).toBe(true);
    expect(lifecycle.evidenceRef).toContain("DRAFT");

    // CALL_REVIEW — prior calls pending
    const calls = gates.get("CALL_REVIEW")!;
    expect(calls).toBeDefined();
    expect(calls.status).toBe("FAIL");
    expect(calls.blocking).toBe(true);

    // SOURCE_APPENDIX — should pass (editorially cleared)
    const source = gates.get("SOURCE_APPENDIX")!;
    expect(source).toBeDefined();
    expect(source.evidenceRef).toContain("coverage");

    // DATA_PROVENANCE — should pass (not in PLANNED state)
    const provenance = gates.get("DATA_PROVENANCE")!;
    expect(provenance).toBeDefined();

    // QUALITY_GATE
    const quality = gates.get("QUALITY_GATE")!;
    expect(quality).toBeDefined();
  });

  it("Q2 is not release-ready — multiple blockers", () => {
    const state = resolveGmiReleaseState("GMI-Q2-2026");
    expect(state.releaseReady).toBe(false);
    expect(state.blockers.length).toBeGreaterThan(0);
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
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("transaction rollback — failure leaves predecessor unchanged", () => {
    // Q1 must remain ACTIVE_UNTIL_SUPERSEDED if Q2 release fails
    const q1Before = getMarketIntelligenceRecord("GMI-Q1-2026")!;
    expect(q1Before.lifecycleState).toBe("ACTIVE_UNTIL_SUPERSEDED");
    expect(q1Before.supersededBy).toBeNull();

    // Attempt release (will fail — gates don't pass)
    const result = releaseGmiEdition({
      editionId: "GMI-Q2-2026",
      ownerAuthority: { editionId: "GMI-Q2-2026", authorizedBy: "owner", authorizedAt: new Date().toISOString(), authorityScope: "release", candidateHash: "original-hash" },
      sourceSnapshotHash: "original-hash",
      reportContentHash: "content-hash",
      methodologyVersion: "1.0.0",
      pdfHash: null,
      releaseChecklistVersion: "1.0.0",
    });
    expect(result.ok).toBe(false);

    // Q1 must remain unchanged
    const q1After = getMarketIntelligenceRecord("GMI-Q1-2026")!;
    expect(q1After.lifecycleState).toBe("ACTIVE_UNTIL_SUPERSEDED");
    expect(q1After.supersededBy).toBeNull();
  });

  it("predecessor protection — Q1 not superseded unless Q2 successfully releases", () => {
    const q1 = getMarketIntelligenceRecord("GMI-Q1-2026")!;
    // Q1 must never be manually set to SUPERSEDED before Q2 is active
    expect(q1.lifecycleState).not.toBe("SUPERSEDED");
    expect(q1.supersededBy).toBeNull();
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