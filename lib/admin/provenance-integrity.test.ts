/**
 * Tests for ProvenanceIntegrityCheck helper and hash contract hardening.
 *
 * Verifies:
 * - checkProvenanceHashIntegrity returns MATCH for matching hashes
 * - checkProvenanceHashIntegrity returns MISMATCH for differing hashes
 * - checkProvenanceHashIntegrity returns UNAVAILABLE when no stored hash
 * - verifyClientSafeHashMatch returns MATCH for matching hashes
 * - verifyClientSafeHashMatch returns MISMATCH for differing hashes
 * - Hash changes when provenance gap changes (new test)
 * - Panel displayed hash is a prefix of the full provenance hash
 */

import { describe, expect, it } from "vitest";

import {
  checkProvenanceHashIntegrity,
  verifyClientSafeHashMatch,
} from "./provenance-integrity";
import {
  composeDecisionProvenanceFromSources,
  buildDecisionProvenanceHash,
  type DecisionProvenanceRecord,
  type DecisionProvenanceSourceData,
} from "./decision-provenance-record";
import { composeClientSafeProvenance } from "./client-safe-provenance-composer";
import { buildProvenanceSummaryPanelModel } from "../../components/product/ProvenanceSummaryPanel";

function sourceData(overrides: Partial<DecisionProvenanceSourceData> = {}): DecisionProvenanceSourceData {
  return {
    subjectType: "OVERSIGHT_CYCLE",
    subjectId: "cycle_001",
    cycles: [
      {
        cycleId: "cycle_001",
        accountId: "acct_001",
        organisationId: "org_001",
        sponsorUserId: null,
        sponsorEmail: null,
        cadenceState: "COMPLETED",
        cadenceSource: "manual",
        cadenceType: "quarterly",
        scheduledFor: "2026-05-01T09:00:00.000Z",
        completedAt: "2026-05-14T09:00:00.000Z",
        skippedAt: null,
        skippedReason: null,
        escalationReason: null,
        operatorId: "op_001",
        evidencePosture: "OPERATOR_RECORDED",
        createdAt: "2026-05-01T09:00:00.000Z",
        updatedAt: "2026-05-14T09:00:00.000Z",
      },
    ],
    cadenceHistory: [],
    suppressions: [],
    deliveries: [],
    outcomes: [],
    counselEntries: [],
    boardroomEntries: [],
    decisionRecords: [],
    archiveRecords: [],
    memorySummary: null,
    unavailableSources: [],
    ...overrides,
  };
}

function clientSafeSummary(record: DecisionProvenanceRecord) {
  return composeClientSafeProvenance(record);
}

describe("checkProvenanceHashIntegrity", () => {
  it("returns MATCH when stored hash equals recomputed hash", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const result = checkProvenanceHashIntegrity(record.provenanceHash, record);
    expect(result.status).toBe("MATCH");
  });

  it("returns MISMATCH when stored hash differs from recomputed hash", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const result = checkProvenanceHashIntegrity("different_hash_value", record);
    expect(result.status).toBe("MISMATCH");
    expect(result.storedHash).toBe("different_hash_value");
    expect(result.recomputedHash).toBe(record.provenanceHash);
  });

  it("returns UNAVAILABLE when no stored hash exists", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const result = checkProvenanceHashIntegrity(null, record);
    expect(result.status).toBe("UNAVAILABLE");
    expect(result.storedHash).toBeNull();
    expect(result.recomputedHash).toBe(record.provenanceHash);
  });

  it("returns UNAVAILABLE when stored hash is undefined", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const result = checkProvenanceHashIntegrity(undefined, record);
    expect(result.status).toBe("UNAVAILABLE");
  });

  it("MISMATCH message requires operator review, not silent resolution", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const result = checkProvenanceHashIntegrity("different_hash", record);
    expect(result.message.toLowerCase()).toContain("operator review");
    expect(result.message.toLowerCase()).not.toContain("automatically resolved");
    expect(result.message.toLowerCase()).not.toContain("silently corrected");
  });

  it("MATCH message confirms consistency", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const result = checkProvenanceHashIntegrity(record.provenanceHash, record);
    expect(result.message.toLowerCase()).toContain("match");
    expect(result.message.toLowerCase()).toContain("consistent");
  });
});

describe("verifyClientSafeHashMatch", () => {
  it("returns MATCH when client-safe hash equals internal hash", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const safe = clientSafeSummary(record);
    const result = verifyClientSafeHashMatch(record.provenanceHash, safe.provenanceHash);
    expect(result.status).toBe("MATCH");
  });

  it("returns MISMATCH when client-safe hash differs from internal hash", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const result = verifyClientSafeHashMatch(record.provenanceHash, "different_hash");
    expect(result.status).toBe("MISMATCH");
  });

  it("MISMATCH message identifies structural integrity failure", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const result = verifyClientSafeHashMatch(record.provenanceHash, "different_hash");
    expect(result.message.toLowerCase()).toContain("structural integrity failure");
  });
});

describe("hash changes when provenance gap changes", () => {
  it("adding a gap changes the hash", () => {
    const withoutGap = composeDecisionProvenanceFromSources(sourceData());
    const withGap = composeDecisionProvenanceFromSources(
      sourceData({
        suppressions: [
          {
            eventId: "sup_001",
            scopeId: "cycle_001",
            scopeType: "CYCLE",
            surface: "oversight-brief",
            fieldName: "commercialExposure",
            evidenceSource: "system",
            originalPosture: "SYSTEM_INFERRED",
            evidencePosture: "SYSTEM_INFERRED",
            suppressionReason: "Commercial sensitivity",
            suppressionRule: "COMMERCIAL_SENSITIVITY",
            operatorReviewAvailable: true,
            suppressedAt: "2026-05-02T09:00:00.000Z",
            suppressedBySystem: true,
            reviewedByOperator: null,
            reviewedAt: null,
            overrideStatus: "NONE",
            overrideReason: null,
          },
        ],
      }),
    );
    expect(withoutGap.provenanceHash).not.toBe(withGap.provenanceHash);
    // The gap should appear in the record with gap
    expect(withGap.provenanceGaps.length).toBeGreaterThan(0);
  });

  it("removing a gap changes the hash", () => {
    const withGap = composeDecisionProvenanceFromSources(
      sourceData({
        suppressions: [
          {
            eventId: "sup_001",
            scopeId: "cycle_001",
            scopeType: "CYCLE",
            surface: "oversight-brief",
            fieldName: "commercialExposure",
            evidenceSource: "system",
            originalPosture: "SYSTEM_INFERRED",
            evidencePosture: "SYSTEM_INFERRED",
            suppressionReason: "Commercial sensitivity",
            suppressionRule: "COMMERCIAL_SENSITIVITY",
            operatorReviewAvailable: true,
            suppressedAt: "2026-05-02T09:00:00.000Z",
            suppressedBySystem: true,
            reviewedByOperator: null,
            reviewedAt: null,
            overrideStatus: "NONE",
            overrideReason: null,
          },
        ],
      }),
    );
    const withoutGap = composeDecisionProvenanceFromSources(sourceData());
    expect(withGap.provenanceHash).not.toBe(withoutGap.provenanceHash);
  });
});

describe("panel hash display integrity", () => {
  it("panel displayed hash is a prefix of the full provenance hash", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const safe = clientSafeSummary(record);
    const model = buildProvenanceSummaryPanelModel(safe);

    // The panel truncates to 12 chars with ellipsis
    const expectedPrefix = record.provenanceHash.slice(0, 12);
    expect(model.hashDisplay).toBe(`${expectedPrefix}…`);
  });

  it("panel hash display derives from the same hash as internal record", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const safe = clientSafeSummary(record);
    const model = buildProvenanceSummaryPanelModel(safe);

    // The full hash is preserved in the client-safe summary
    expect(safe.provenanceHash).toBe(record.provenanceHash);
    // The display is a truncated form of the same hash
    expect(model.hashDisplay).toBe(`${record.provenanceHash.slice(0, 12)}…`);
  });

  it("panel model preserves accountability statement verbatim from client-safe summary", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const safe = clientSafeSummary(record);
    const model = buildProvenanceSummaryPanelModel(safe);
    expect(model.accountabilityStatement).toBe(safe.accountabilityStatement);
  });
});
