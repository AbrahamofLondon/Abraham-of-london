import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    systemAuditLog: {
      findMany: mocks.findMany,
    },
  },
}));

import { getProvenanceOperationHistory } from "./provenance-operation-history";

function row(overrides: {
  id?: string;
  action?: string;
  status?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
}) {
  return {
    id: overrides.id ?? "log_001",
    action: overrides.action ?? "PROVENANCE_ANCHOR_CREATED",
    status: overrides.status ?? "success",
    requestId: overrides.requestId ?? "prv_anchor_abc123",
    metadata: overrides.metadata !== undefined
      ? JSON.stringify({ ...overrides.metadata, _ext: { service: "test", at: "2026-05-14T12:00:00.000Z" } })
      : JSON.stringify({
          eventType: overrides.action ?? "PROVENANCE_ANCHOR_CREATED",
          eventVersion: 1,
          source: "PROVENANCE_CREATE_ANCHOR_API",
          scope: "DAILY",
          scopeId: "2026-05-14",
          merkleRoot: "root_001",
          chainHash: "chain_001",
          status: "SUCCESS",
          _ext: { service: "test", at: "2026-05-14T12:00:00.000Z" },
        }),
    createdAt: overrides.createdAt ?? new Date("2026-05-14T12:00:00.000Z"),
  };
}

beforeEach(() => {
  mocks.findMany.mockReset();
});

describe("getProvenanceOperationHistory", () => {
  it("extracts safe provenance audit event fields from metadata", async () => {
    mocks.findMany.mockResolvedValueOnce([
      row({ action: "PROVENANCE_ANCHOR_CREATED" }),
    ]);
    const result = await getProvenanceOperationHistory();
    expect(result.unavailable).toBeFalsy();
    expect(result.recent).toHaveLength(1);
    const item = result.recent[0]!;
    expect(item.eventType).toBe("PROVENANCE_ANCHOR_CREATED");
    expect(item.source).toBe("PROVENANCE_CREATE_ANCHOR_API");
    expect(item.scope).toBe("DAILY");
    expect(item.scopeId).toBe("2026-05-14");
    expect(item.merkleRoot).toBe("root_001");
    expect(item.occurredAt).toBe("2026-05-14T12:00:00.000Z");
  });

  it("ignores non-provenance audit events", async () => {
    mocks.findMany.mockResolvedValueOnce([
      row({ action: "LOGIN_SUCCESS" }),
      row({ action: "PROVENANCE_ANCHOR_CREATED" }),
    ]);
    const result = await getProvenanceOperationHistory();
    // findMany is already filtered by action IN provenance types,
    // but extractItem also guards against unknown actions
    expect(result.recent.every((i) => i.eventType !== "LOGIN_SUCCESS")).toBe(true);
  });

  it("returns empty recent list when no events have been recorded", async () => {
    mocks.findMany.mockResolvedValueOnce([]);
    const result = await getProvenanceOperationHistory();
    expect(result.unavailable).toBeFalsy();
    expect(result.recent).toHaveLength(0);
    expect(result.latestAnchorCreatedAt).toBeNull();
    expect(result.latestChainVerifiedAt).toBeNull();
    expect(result.manualRunnerStatus).toBe("NOT_OBSERVED");
    expect(result.scheduledRunnerStatus).toBe("NOT_OBSERVED");
  });

  it("returns unavailable when the audit log query throws", async () => {
    mocks.findMany.mockRejectedValueOnce(new Error("db connection refused"));
    const result = await getProvenanceOperationHistory();
    expect(result.unavailable).toBe(true);
    expect(result.unavailableReason).toBeTruthy();
    expect(result.recent).toHaveLength(0);
    expect(result.manualRunnerStatus).toBe("NOT_OBSERVED");
    expect(result.scheduledRunnerStatus).toBe("NOT_OBSERVED");
  });

  it("derives latestAnchorCreatedAt from the most recent PROVENANCE_ANCHOR_CREATED event", async () => {
    mocks.findMany.mockResolvedValueOnce([
      row({ action: "PROVENANCE_ANCHOR_CREATED", createdAt: new Date("2026-05-14T14:00:00.000Z") }),
      row({ action: "PROVENANCE_CHAIN_VERIFIED", createdAt: new Date("2026-05-14T13:00:00.000Z") }),
    ]);
    const result = await getProvenanceOperationHistory();
    expect(result.latestAnchorCreatedAt).toBe("2026-05-14T14:00:00.000Z");
    expect(result.latestChainVerifiedAt).toBe("2026-05-14T13:00:00.000Z");
  });

  it("derives latestChainVerifiedAt from the most recent PROVENANCE_CHAIN_VERIFIED event", async () => {
    mocks.findMany.mockResolvedValueOnce([
      row({ action: "PROVENANCE_CHAIN_VERIFIED", createdAt: new Date("2026-05-14T15:00:00.000Z") }),
    ]);
    const result = await getProvenanceOperationHistory();
    expect(result.latestChainVerifiedAt).toBe("2026-05-14T15:00:00.000Z");
    expect(result.latestAnchorCreatedAt).toBeNull();
  });

  it("surfaces PROVENANCE_HASH_MISMATCH event in latestHashMismatchAt", async () => {
    mocks.findMany.mockResolvedValueOnce([
      row({ action: "PROVENANCE_HASH_MISMATCH", createdAt: new Date("2026-05-14T11:00:00.000Z") }),
    ]);
    const result = await getProvenanceOperationHistory();
    expect(result.latestHashMismatchAt).toBe("2026-05-14T11:00:00.000Z");
  });

  it("marks manual runner activity active when a non-scheduled anchor event is observed", async () => {
    mocks.findMany.mockResolvedValueOnce([
      row({
        action: "PROVENANCE_ANCHOR_CREATED",
        metadata: {
          eventType: "PROVENANCE_ANCHOR_CREATED",
          source: "PROVENANCE_CREATE_ANCHOR_API",
        },
      }),
    ]);

    const result = await getProvenanceOperationHistory();
    expect(result.manualRunnerStatus).toBe("ACTIVE");
    expect(result.scheduledRunnerStatus).toBe("NOT_OBSERVED");
  });

  it("marks scheduled runner activity active only when scheduled-source events are observed", async () => {
    mocks.findMany.mockResolvedValueOnce([
      row({
        action: "PROVENANCE_ANCHOR_CREATED",
        metadata: {
          eventType: "PROVENANCE_ANCHOR_CREATED",
          source: "PROVENANCE_SCHEDULED_ANCHOR_RUNNER",
        },
      }),
    ]);

    const result = await getProvenanceOperationHistory();
    expect(result.manualRunnerStatus).toBe("NOT_OBSERVED");
    expect(result.scheduledRunnerStatus).toBe("ACTIVE");
  });

  it("does not expose raw governance events, suppression details, or _ext internal fields", async () => {
    mocks.findMany.mockResolvedValueOnce([
      row({
        action: "PROVENANCE_ANCHOR_CREATED",
        metadata: {
          eventType: "PROVENANCE_ANCHOR_CREATED",
          scope: "DAILY",
          scopeId: "2026-05-14",
          governanceEvents: [{ label: "Suppressed field" }],
          suppression: { reason: "internal" },
          actorNotes: "some note",
          clientEvidence: { file: "evidence.pdf" },
          _ext: { service: "test" },
        },
      }),
    ]);
    const result = await getProvenanceOperationHistory();
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("governanceEvents");
    expect(serialized).not.toContain("Suppressed field");
    expect(serialized).not.toContain("suppression");
    expect(serialized).not.toContain("actorNotes");
    expect(serialized).not.toContain("clientEvidence");
    // Internal logger extension should be stripped
    expect(serialized).not.toContain("_ext");
  });

  it("handles malformed metadata JSON without throwing", async () => {
    mocks.findMany.mockResolvedValueOnce([
      {
        id: "log_bad",
        action: "PROVENANCE_ANCHOR_CREATED",
        status: "success",
        requestId: null,
        metadata: "NOT_VALID_JSON{{{",
        createdAt: new Date("2026-05-14T12:00:00.000Z"),
      },
    ]);
    const result = await getProvenanceOperationHistory();
    expect(result.unavailable).toBeFalsy();
    expect(result.recent).toHaveLength(1);
    const item = result.recent[0]!;
    // Falls back to row.action when metadata can't be parsed
    expect(item.eventType).toBe("PROVENANCE_ANCHOR_CREATED");
  });
});
