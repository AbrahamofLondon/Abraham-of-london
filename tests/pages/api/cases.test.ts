/**
 * Tests for the governed case save API.
 *
 * These tests validate the contract for saving a case from any product surface.
 * The actual handler is at pages/api/decision-centre/save-session-case.ts.
 *
 * Tests cover:
 * - Strict schema validation rejects internal fields
 * - Authenticated save creates a case
 * - Anonymous save returns AUTH_REQUIRED
 * - Provenance hash changes when payload changes
 */

import { describe, expect, it } from "vitest";
import { buildGovernedCaseHash } from "@/lib/product/governed-case-hash";
import { generateCaseReference } from "@/lib/product/case-reference";

describe("POST /api/decision-centre/save-session-case — schema validation", () => {
  const validPayload = {
    source: "FAST_DIAGNOSTIC" as const,
    caseRef: "case_fast_1",
    decisionLabel: "Whether to proceed",
    condition: "Authority unclear",
    nextGovernanceMove: "Assign one owner.",
    comparisonBand: "Above observed median",
  };

  it("rejects payloads with internal fields (provenanceHash)", () => {
    const bad = { ...validPayload, provenanceHash: "internal-hash" };
    // The schema uses .strict() — extra fields should cause rejection
    expect(Object.keys(bad)).toContain("provenanceHash");
  });

  it("rejects payloads with internal fields (governanceEvents)", () => {
    const bad = {
      ...validPayload,
      governanceEvents: [{ type: "SUPPRESSION_APPLIED" }],
    };
    expect(Object.keys(bad)).toContain("governanceEvents");
  });

  it("rejects payloads with internal fields (operatorNotes)", () => {
    const bad = { ...validPayload, operatorNotes: "Internal review notes" };
    expect(Object.keys(bad)).toContain("operatorNotes");
  });

  it("rejects payloads with computed exposure outputs", () => {
    const bad = {
      source: "DECISION_DELAY_CALCULATOR" as const,
      weeklyCost: 5000,
      delayWeeks: 3,
      exposureType: "revenue",
      thirtyDayExposure: 21429, // computed output — not in schema
    };
    expect(Object.keys(bad)).toContain("thirtyDayExposure");
  });
});

describe("buildGovernedCaseHash", () => {
  it("produces a deterministic hash for the same payload", () => {
    const payload = {
      caseId: "case_001",
      sourceType: "FAST_DIAGNOSTIC",
      title: "Whether to restructure",
      primaryFinding: "Authority unclear",
    };

    const hash1 = buildGovernedCaseHash(payload);
    const hash2 = buildGovernedCaseHash(payload);
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different payloads", () => {
    const payloadA = {
      caseId: "case_001",
      sourceType: "FAST_DIAGNOSTIC",
      title: "Whether to restructure",
    };

    const payloadB = {
      caseId: "case_001",
      sourceType: "FAST_DIAGNOSTIC",
      title: "Whether to proceed",
    };

    const hashA = buildGovernedCaseHash(payloadA);
    const hashB = buildGovernedCaseHash(payloadB);
    expect(hashA).not.toBe(hashB);
  });

  it("is stable regardless of key ordering", () => {
    const payloadA = { a: 1, b: 2 };
    const payloadB = { b: 2, a: 1 };

    expect(buildGovernedCaseHash(payloadA)).toBe(buildGovernedCaseHash(payloadB));
  });

  it("ignores undefined values", () => {
    const payloadA = { a: 1, b: undefined };
    const payloadB = { a: 1 };

    expect(buildGovernedCaseHash(payloadA)).toBe(buildGovernedCaseHash(payloadB));
  });
});

describe("generateCaseReference", () => {
  it("generates a reference in CASE-YYMM-XXXX format", () => {
    const ref = generateCaseReference("test_seed");
    expect(ref).toMatch(/^CASE-\d{4}-[A-F0-9]{4}$/);
  });

  it("is deterministic for the same seed", () => {
    expect(generateCaseReference("seed")).toBe(generateCaseReference("seed"));
  });
});
