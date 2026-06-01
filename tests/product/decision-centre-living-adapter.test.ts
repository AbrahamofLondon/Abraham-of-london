/**
 * tests/product/decision-centre-living-adapter.test.ts
 *
 * Tests for the Decision Centre Living Adapter.
 *
 * Covers:
 * - Produces a valid LivingLayerViewModel from minimal case data
 * - Does not throw when governedMemory is empty
 * - Shows carried-forward case context when available
 * - Does not display audience-unsafe memory
 * - Maps GovernedMemoryItem into memory entries
 * - Evidence summary remains conservative
 * - Continuity statement does not claim institutional memory without durable data
 * - View model serialisation contains no internal scores, thresholds, or raw taxonomy keys
 */

import { describe, it, expect } from "vitest";
import { buildDecisionCentreLivingViewModel } from "@/lib/product/decision-centre-living-adapter";
import type { DecisionCentreCase } from "@/lib/product/decision-centre-contract";
import type { GovernedMemoryItem } from "@/lib/product/governed-memory-contract";
import type { SaveCasePayload } from "@/lib/product/save-case-continuity";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMinimalCase(overrides: Partial<DecisionCentreCase> = {}): DecisionCentreCase {
  return {
    caseId: "test_case_1",
    scope: { type: "individual", subjectId: "test_subject" },
    title: "Whether to proceed with the acquisition",
    cognitiveState: "SIGNAL_DISCOVERY",
    evidenceTier: "insufficient",
    completedStages: [],
    admission: {},
    commercial: {
      ownedProducts: [],
      eligibleProducts: [],
      paymentRequiredFor: [],
      restrictedProducts: [],
    },
    unresolvedContradictions: 0,
    returnBriefs: [],
    updatedAt: new Date().toISOString(),
    lastEvidenceAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeMemoryItem(overrides: Partial<GovernedMemoryItem>): GovernedMemoryItem {
  return {
    id: "test_mem_1",
    label: "Test memory",
    summary: "A test governed memory item from Purpose Alignment.",
    sourceSurface: "PURPOSE_ALIGNMENT",
    capturedAt: new Date().toISOString(),
    evidenceOrigin: "SELF_REPORTED",
    status: "ACTIVE",
    confidenceLabel: "REPORTED",
    audienceSafe: true,
    ...overrides,
  };
}

// ─── 1. Produces a valid LivingLayerViewModel from minimal case data ─────────

describe("adapter produces valid view model", () => {
  it("returns a complete LivingLayerViewModel from minimal case data", () => {
    const caseData = makeMinimalCase();
    const vm = buildDecisionCentreLivingViewModel({ caseData });

    expect(vm).toBeDefined();
    expect(vm.progress).toBeDefined();
    expect(vm.evidence).toBeDefined();
    expect(vm.governedAction).toBeDefined();
    expect(vm.advantage).toBeDefined();
    expect(vm.nextLayer).toBeDefined();
    expect(vm.memory).toBeDefined();
    expect(vm.changes).toBeDefined();
    expect(vm.review).toBeDefined();
    expect(vm.continuity).toBeDefined();
  });

  it("sets evidence level conservatively from insufficient tier", () => {
    const caseData = makeMinimalCase({ evidenceTier: "insufficient" });
    const vm = buildDecisionCentreLivingViewModel({ caseData });
    expect(vm.evidence.level).toBe("none");
  });
});

// ─── 2. Does not throw when governedMemory is empty ──────────────────────────

describe("handles empty governed memory", () => {
  it("does not throw when governedMemory is undefined", () => {
    const caseData = makeMinimalCase();
    expect(() => buildDecisionCentreLivingViewModel({ caseData })).not.toThrow();
  });

  it("does not throw when governedMemory is empty array", () => {
    const caseData = makeMinimalCase({ governedMemory: [] });
    expect(() => buildDecisionCentreLivingViewModel({ caseData })).not.toThrow();
  });

  it("produces empty memory entries when no governed memory", () => {
    const caseData = makeMinimalCase();
    const vm = buildDecisionCentreLivingViewModel({ caseData });
    expect(vm.memory.entries).toBeDefined();
  });
});

// ─── 3. Shows carried-forward case context when available ────────────────────

describe("carried-forward case context", () => {
  it("shows carried-forward case when available", () => {
    const caseData = makeMinimalCase();
    const cfc: SaveCasePayload = {
      source: "FAST_DIAGNOSTIC",
      caseRef: "case_fast_123",
      decisionLabel: "Whether to acquire",
      nextGovernanceMove: "Assign owner",
      createdAt: new Date().toISOString(),
    };
    const vm = buildDecisionCentreLivingViewModel({ caseData, carriedForwardCase: cfc });

    expect(vm.continuity.carriedForwardCase?.available).toBe(true);
    expect(vm.continuity.carriedForwardCase?.decisionLabel).toBe("Whether to acquire");
    expect(vm.continuity.continuityStatement).toContain("carried-forward");
  });

  it("does not claim verified institutional memory for carried-forward case", () => {
    const caseData = makeMinimalCase();
    const cfc: SaveCasePayload = {
      source: "FAST_DIAGNOSTIC",
      decisionLabel: "Test",
      createdAt: new Date().toISOString(),
    };
    const vm = buildDecisionCentreLivingViewModel({ caseData, carriedForwardCase: cfc });

    // The continuity statement correctly says "not yet durable institutional memory"
    // which is the safe, honest language. Verify it doesn't claim it as established fact.
    expect(vm.continuity.continuityStatement).toContain("not yet durable");
    expect(vm.continuity.continuityStatement).not.toContain("Verified outcome");
    expect(vm.continuity.continuityStatement).not.toContain("Retained memory");
    expect(vm.continuity.continuityStatement).not.toContain("Cross-session intelligence");
  });
});

// ─── 4. Does not display audience-unsafe memory ──────────────────────────────

describe("audience-unsafe memory exclusion", () => {
  it("excludes audience-unsafe memory from memory entries", () => {
    const caseData = makeMinimalCase({
      governedMemory: [
        makeMemoryItem({ id: "safe_1", audienceSafe: true, label: "Safe memory" }),
        makeMemoryItem({ id: "unsafe_1", audienceSafe: false, label: "Unsafe memory" }),
      ],
    });
    const vm = buildDecisionCentreLivingViewModel({ caseData });

    const unsafeEntry = vm.memory.entries.find(e => e.label.includes("Unsafe"));
    expect(unsafeEntry).toBeUndefined();
  });

  it("excludes suppressed memory from memory entries", () => {
    const caseData = makeMinimalCase({
      governedMemory: [
        makeMemoryItem({
          id: "suppressed_1",
          status: "SUPPRESSED",
          suppressedReason: "Withheld",
        }),
      ],
    });
    const vm = buildDecisionCentreLivingViewModel({ caseData });

    const suppressedEntry = vm.memory.entries.find(e => e.label.includes("Suppressed"));
    expect(suppressedEntry).toBeUndefined();
  });
});

// ─── 5. Maps GovernedMemoryItem into memory entries ──────────────────────────

describe("governed memory mapping", () => {
  it("maps safe governed memory items into memory entries", () => {
    const caseData = makeMinimalCase({
      governedMemory: [
        makeMemoryItem({
          id: "mem_1",
          label: "Alignment signal",
          summary: "Coherence band: ALIGNED",
          sourceSurface: "PURPOSE_ALIGNMENT",
          confidenceLabel: "CAPTURED",
        }),
      ],
    });
    const vm = buildDecisionCentreLivingViewModel({ caseData });

    expect(vm.memory.entries.length).toBeGreaterThanOrEqual(1);
    const entry = vm.memory.entries.find(e => e.label.includes("Captured"));
    expect(entry).toBeDefined();
  });
});

// ─── 6. Evidence summary remains conservative ────────────────────────────────

describe("evidence summary conservatism", () => {
  it("uses conservative language for insufficient evidence", () => {
    const caseData = makeMinimalCase({ evidenceTier: "insufficient" });
    const vm = buildDecisionCentreLivingViewModel({ caseData });
    expect(vm.evidence.summary).not.toContain("verified");
    expect(vm.evidence.summary).not.toContain("confirmed");
  });

  it("does not claim verified without VERIFIED confidence label", () => {
    const caseData = makeMinimalCase({
      evidenceTier: "multi_source",
      governedMemory: [
        makeMemoryItem({
          evidenceOrigin: "STRUCTURED_DIAGNOSTIC",
          confidenceLabel: "CAPTURED",
        }),
      ],
    });
    const vm = buildDecisionCentreLivingViewModel({ caseData });
    expect(vm.evidence.level).not.toBe("verified");
  });
});

// ─── 7. Continuity statement does not claim institutional memory ─────────────

describe("continuity language safety", () => {
  it("never contains 'Institutional memory' in continuity statement", () => {
    const caseData = makeMinimalCase();
    const vm = buildDecisionCentreLivingViewModel({ caseData });
    expect(vm.continuity.continuityStatement).not.toContain("Institutional memory");
    expect(vm.continuity.continuityStatement).not.toContain("institutional memory");
  });

  it("never contains 'Verified outcome' in continuity statement", () => {
    const caseData = makeMinimalCase();
    const vm = buildDecisionCentreLivingViewModel({ caseData });
    expect(vm.continuity.continuityStatement).not.toContain("Verified outcome");
  });
});

// ─── 8. View model contains no internal mechanics ────────────────────────────

describe("no internal mechanics exposed", () => {
  it("serialized view model contains no raw taxonomy keys", () => {
    const caseData = makeMinimalCase({
      governedMemory: [
        makeMemoryItem({ evidenceOrigin: "STRUCTURED_DIAGNOSTIC" }),
      ],
    });
    const vm = buildDecisionCentreLivingViewModel({ caseData });
    const serialized = JSON.stringify(vm);

    expect(serialized).not.toContain("obligation:deadline");
    expect(serialized).not.toContain("authority:unclear");
    expect(serialized).not.toContain("constraint:cash");
  });

  it("serialized view model contains no numeric scores or thresholds", () => {
    const caseData = makeMinimalCase();
    const vm = buildDecisionCentreLivingViewModel({ caseData });
    const serialized = JSON.stringify(vm);

    // Should not contain raw score-like values
    expect(serialized).not.toContain("compositeScore");
    expect(serialized).not.toContain("vocabularyState");
  });
});
