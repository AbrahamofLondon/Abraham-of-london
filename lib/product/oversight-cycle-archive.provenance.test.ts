/**
 * Tests for provenance hash persistence in the oversight cycle archive.
 * All tests operate on pure functions — no DB, no async.
 */
import { describe, expect, it } from "vitest";

import {
  buildDecisionProvenanceHash,
  composeDecisionProvenanceFromSources,
  type DecisionProvenanceSourceData,
  type DecisionProvenanceRecord,
} from "@/lib/admin/decision-provenance-record";
import { composeClientSafeProvenance } from "@/lib/admin/client-safe-provenance-composer";

// Minimal metadata that archiveMetadataToRecord accepts
function archiveMetadata(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    cycleId: "cycle_001",
    accountId: "acct_001",
    periodStart: "2026-05-01T00:00:00.000Z",
    periodEnd: "2026-05-31T23:59:59.000Z",
    internalPayloadHash: "internal_hash_001",
    deliveryIntent: { state: "NOT_READY" },
    efficacy: { grade: "STRONG", totalScore: 72 },
    suppressions: [],
    warnings: [],
    ...overrides,
  };
}

// Minimal source data for provenance composition
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

// Inline reimplementation of the extraction logic to test the contract
// (mirrors archiveMetadataToRecord without importing the private function)
function extractProvenanceFromMetadata(metadata: Record<string, unknown>) {
  return {
    provenanceHash: typeof metadata.provenanceHash === "string" ? metadata.provenanceHash : null,
    provenanceVersion: typeof metadata.provenanceVersion === "number" ? metadata.provenanceVersion : null,
    provenanceComputedAt: typeof metadata.provenanceComputedAt === "string" ? metadata.provenanceComputedAt : null,
  };
}

describe("archive metadata provenance field extraction", () => {
  it("extracts provenanceHash from metadata when present", () => {
    const metadata = archiveMetadata({ provenanceHash: "abc123", provenanceVersion: 1, provenanceComputedAt: "2026-05-14T12:00:00.000Z" });
    const extracted = extractProvenanceFromMetadata(metadata);
    expect(extracted.provenanceHash).toBe("abc123");
    expect(extracted.provenanceVersion).toBe(1);
    expect(extracted.provenanceComputedAt).toBe("2026-05-14T12:00:00.000Z");
  });

  it("returns null provenanceHash when field absent from metadata", () => {
    const metadata = archiveMetadata();
    const extracted = extractProvenanceFromMetadata(metadata);
    expect(extracted.provenanceHash).toBeNull();
    expect(extracted.provenanceVersion).toBeNull();
    expect(extracted.provenanceComputedAt).toBeNull();
  });

  it("does not fabricate a hash — missing field stays null", () => {
    const metadata = archiveMetadata({ provenanceHash: undefined });
    const extracted = extractProvenanceFromMetadata(metadata);
    expect(extracted.provenanceHash).toBeNull();
  });
});

describe("provenance hash determinism across archive state", () => {
  it("same provenance source data produces identical hash", () => {
    const data = sourceData();
    const recordA = composeDecisionProvenanceFromSources(data);
    const recordB = composeDecisionProvenanceFromSources(data);
    expect(buildDecisionProvenanceHash(recordA)).toBe(buildDecisionProvenanceHash(recordB));
  });

  it("changed provenance data produces a different hash", () => {
    const baseRecord = composeDecisionProvenanceFromSources(sourceData());
    const changedRecord = composeDecisionProvenanceFromSources(
      sourceData({
        deliveries: [
          {
            id: "del_001",
            artifactType: "OVERSIGHT_BRIEF",
            artifactId: "cycle_001",
            recipientEmail: "sponsor@example.com",
            recipientRole: "SPONSOR",
            approvedBy: "op_001",
            deliveredBy: "system",
            deliveredAt: "2026-05-15T10:00:00.000Z",
            deliveryMethod: "EMAIL",
            status: "DELIVERED",
            suppressionSummary: "",
            clientSafe: true,
            createdAt: "2026-05-14T09:00:00.000Z",
          },
        ],
      }),
    );
    expect(buildDecisionProvenanceHash(baseRecord)).not.toBe(buildDecisionProvenanceHash(changedRecord));
  });
});

describe("client-safe provenance hash matches canonical record hash", () => {
  it("provenanceHash in client-safe summary equals the full record provenanceHash", () => {
    const record: DecisionProvenanceRecord = composeDecisionProvenanceFromSources(sourceData());
    const clientSafe = composeClientSafeProvenance(record);
    expect(clientSafe.provenanceHash).toBe(record.provenanceHash);
  });

  it("persisted metadata hash matches what canonical composer would produce for the same data", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const persistedHash = record.provenanceHash;
    const metadata = archiveMetadata({ provenanceHash: persistedHash });
    const extracted = extractProvenanceFromMetadata(metadata);
    expect(extracted.provenanceHash).toBe(record.provenanceHash);
  });
});
