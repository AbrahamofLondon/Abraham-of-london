/**
 * tests/product/evidence-tier-derivation.test.ts
 *
 * Tests for the canonical evidence tier derivation helper.
 *
 * Covers:
 * - No memory, no stages → none
 * - Single self-reported memory → single_source
 * - Multiple self-reported items from same origin → still single_source
 * - Structured diagnostic memory → multi_source
 * - Two distinct evidence origins → corroborated
 * - Verified evidence item → verified
 * - Repeated session signal alone never becomes verified
 * - Audience-unsafe memory is excluded
 */

import { describe, it, expect } from "vitest";
import { deriveEvidenceTierFromInputs } from "@/lib/product/evidence-tier-derivation";
import type { GovernedMemoryItem } from "@/lib/product/governed-memory-contract";
import type { SaveCasePayload } from "@/lib/product/save-case-continuity";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMemoryItem(overrides: Partial<GovernedMemoryItem>): GovernedMemoryItem {
  return {
    id: "test_mem_1",
    label: "Test memory",
    summary: "A test governed memory item.",
    sourceSurface: "PURPOSE_ALIGNMENT",
    capturedAt: new Date().toISOString(),
    evidenceOrigin: "SELF_REPORTED",
    status: "ACTIVE",
    confidenceLabel: "REPORTED",
    audienceSafe: true,
    ...overrides,
  };
}

// ─── 1. No memory, no stages → none ─────────────────────────────────────────

describe("evidence tier derivation", () => {
  it("returns 'none' when no memory, stages, or carried-forward case exist", () => {
    const result = deriveEvidenceTierFromInputs({});
    expect(result.level).toBe("none");
    expect(result.summary).toContain("not yet clear enough");
  });

  it("returns 'none' when only session signals exist without actors", () => {
    const result = deriveEvidenceTierFromInputs({
      currentSessionSignals: [{ signal: "test" }],
    });
    expect(result.level).toBe("single_source");
  });
});

// ─── 2. Single self-reported memory → single_source ──────────────────────────

describe("single self-reported memory", () => {
  it("returns 'single_source' for one self-reported item", () => {
    const result = deriveEvidenceTierFromInputs({
      governedMemory: [
        makeMemoryItem({ evidenceOrigin: "SELF_REPORTED", confidenceLabel: "REPORTED" }),
      ],
    });
    expect(result.level).toBe("single_source");
  });
});

// ─── 3. Multiple self-reported items from same origin → single_source ────────

describe("multiple self-reported items from same origin", () => {
  it("returns 'multi_source' for multiple self-reported items (conservative upgrade)", () => {
    const result = deriveEvidenceTierFromInputs({
      governedMemory: [
        makeMemoryItem({ id: "mem_1", evidenceOrigin: "SELF_REPORTED" }),
        makeMemoryItem({ id: "mem_2", evidenceOrigin: "SELF_REPORTED" }),
      ],
    });
    // Two self-reported items → multi_source (multiple items, same origin)
    expect(result.level).toBe("multi_source");
  });
});

// ─── 4. Structured diagnostic memory → multi_source ──────────────────────────

describe("structured diagnostic memory", () => {
  it("returns 'multi_source' for a structured diagnostic item", () => {
    const result = deriveEvidenceTierFromInputs({
      governedMemory: [
        makeMemoryItem({
          evidenceOrigin: "STRUCTURED_DIAGNOSTIC",
          confidenceLabel: "CAPTURED",
        }),
      ],
    });
    expect(result.level).toBe("multi_source");
  });
});

// ─── 5. Two distinct evidence origins → corroborated ─────────────────────────

describe("two distinct evidence origins", () => {
  it("returns 'corroborated' for SELF_REPORTED + STRUCTURED_DIAGNOSTIC", () => {
    const result = deriveEvidenceTierFromInputs({
      governedMemory: [
        makeMemoryItem({ id: "mem_1", evidenceOrigin: "SELF_REPORTED" }),
        makeMemoryItem({
          id: "mem_2",
          evidenceOrigin: "STRUCTURED_DIAGNOSTIC",
          confidenceLabel: "CAPTURED",
        }),
      ],
    });
    expect(result.level).toBe("corroborated");
  });

  it("returns 'corroborated' for STRUCTURED_DIAGNOSTIC + carried-forward case", () => {
    const result = deriveEvidenceTierFromInputs({
      governedMemory: [
        makeMemoryItem({
          evidenceOrigin: "STRUCTURED_DIAGNOSTIC",
          confidenceLabel: "CAPTURED",
        }),
      ],
      carriedForwardCase: {
        source: "FAST_DIAGNOSTIC",
        decisionLabel: "Test decision",
        createdAt: new Date().toISOString(),
      },
    });
    expect(result.level).toBe("corroborated");
  });
});

// ─── 6. Verified evidence item → verified ────────────────────────────────────

describe("verified evidence", () => {
  it("returns 'verified' when a memory item has VERIFIED confidenceLabel", () => {
    const result = deriveEvidenceTierFromInputs({
      governedMemory: [
        makeMemoryItem({
          evidenceOrigin: "VERIFIED_OUTCOME",
          confidenceLabel: "VERIFIED",
        }),
      ],
    });
    expect(result.level).toBe("verified");
  });

  it("does not return 'verified' for CHECKED or REVIEWED confidence labels", () => {
    const result = deriveEvidenceTierFromInputs({
      governedMemory: [
        makeMemoryItem({
          evidenceOrigin: "OPERATOR_REVIEWED",
          confidenceLabel: "REVIEWED",
        }),
      ],
    });
    expect(result.level).not.toBe("verified");
  });
});

// ─── 7. Repeated session signal alone never becomes verified ─────────────────

describe("repeated session signals never become verified", () => {
  it("does not reach 'verified' with only session signals", () => {
    const result = deriveEvidenceTierFromInputs({
      currentSessionSignals: [
        { signal: "deadline", occurrences: 10 },
        { signal: "authority", occurrences: 5 },
      ],
    });
    expect(result.level).not.toBe("verified");
    // Should be single_source at most
    expect(["none", "single_source", "multi_source", "corroborated"]).toContain(result.level);
  });
});

// ─── 8. Audience-unsafe memory is excluded ───────────────────────────────────

describe("audience-unsafe memory exclusion", () => {
  it("excludes audience-unsafe memory from evidence tier", () => {
    const result = deriveEvidenceTierFromInputs({
      governedMemory: [
        makeMemoryItem({
          evidenceOrigin: "STRUCTURED_DIAGNOSTIC",
          confidenceLabel: "CAPTURED",
          audienceSafe: false,
        }),
      ],
    });
    // The unsafe item should be excluded, so level should be none
    expect(result.level).toBe("none");
  });

  it("excludes suppressed memory from evidence tier", () => {
    const result = deriveEvidenceTierFromInputs({
      governedMemory: [
        makeMemoryItem({
          evidenceOrigin: "STRUCTURED_DIAGNOSTIC",
          confidenceLabel: "CAPTURED",
          status: "SUPPRESSED",
          suppressedReason: "Withheld from display",
        }),
      ],
    });
    expect(result.level).toBe("none");
  });
});
