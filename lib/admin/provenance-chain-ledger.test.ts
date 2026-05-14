import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  provenanceChainAnchor: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
  },
}));

const auditMock = vi.hoisted(() => ({
  recordProvenanceAuditEvent: vi.fn(),
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/admin/provenance-audit-events", () => ({
  recordProvenanceAuditEvent: auditMock.recordProvenanceAuditEvent,
}));

import type { ProvenanceChainLeaf } from "./provenance-chain-anchor";
import {
  buildProvenanceChainHash,
  createProvenanceChainAnchor,
  listProvenanceChainAnchors,
  verifyProvenanceChainSequence,
  type ProvenanceChainAnchorRecord,
} from "./provenance-chain-ledger";

function leaf(overrides: Partial<ProvenanceChainLeaf> = {}): ProvenanceChainLeaf {
  return {
    subjectType: "OVERSIGHT_CYCLE",
    subjectId: "cycle_001",
    provenanceHash: "hash_001",
    computedAt: "2026-05-14T12:00:00.000Z",
    ...overrides,
  };
}

function chainHash(overrides: Partial<Parameters<typeof buildProvenanceChainHash>[0]> = {}) {
  return buildProvenanceChainHash({
    version: 1,
    scope: "DAILY",
    scopeId: "2026-05-14",
    merkleRoot: "root_001",
    previousRoot: null,
    computedAt: "2026-05-14T12:00:00.000Z",
    fromTimestamp: null,
    toTimestamp: null,
    ...overrides,
  });
}

function anchor(overrides: Partial<ProvenanceChainAnchorRecord> = {}): ProvenanceChainAnchorRecord {
  const base = {
    id: "anchor_001",
    version: 1 as const,
    scope: "DAILY",
    scopeId: "2026-05-14",
    leafCount: 1,
    merkleRoot: "root_001",
    previousRoot: null,
    computedAt: "2026-05-14T12:00:00.000Z",
    fromTimestamp: null,
    toTimestamp: null,
    ...overrides,
  };
  return {
    ...base,
    chainHash: overrides.chainHash ?? buildProvenanceChainHash(base),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-14T12:00:00.000Z"));
  prismaMock.provenanceChainAnchor.findFirst.mockReset();
  prismaMock.provenanceChainAnchor.create.mockReset();
  prismaMock.provenanceChainAnchor.findMany.mockReset();
  auditMock.recordProvenanceAuditEvent.mockReset();
  prismaMock.provenanceChainAnchor.create.mockImplementation(async ({ data }) => ({
    id: "anchor_created",
    version: data.version,
    scope: data.scope,
    scopeId: data.scopeId,
    leafCount: data.leafCount,
    merkleRoot: data.merkleRoot,
    previousRoot: data.previousRoot,
    chainHash: data.chainHash,
    computedAt: data.computedAt,
    fromTimestamp: data.fromTimestamp,
    toTimestamp: data.toTimestamp,
    metadata: data.metadata,
    createdAt: new Date("2026-05-14T12:00:00.000Z"),
  }));
});

describe("buildProvenanceChainHash", () => {
  it("is deterministic", () => {
    expect(chainHash()).toBe(chainHash());
  });

  it("changes when merkleRoot changes", () => {
    expect(chainHash({ merkleRoot: "root_001" })).not.toBe(chainHash({ merkleRoot: "root_002" }));
  });

  it("changes when previousRoot changes", () => {
    expect(chainHash({ previousRoot: "root_previous" })).not.toBe(chainHash({ previousRoot: "root_other" }));
  });
});

describe("createProvenanceChainAnchor", () => {
  it("rejects empty leaves", async () => {
    await expect(createProvenanceChainAnchor({
      scope: "DAILY",
      scopeId: "2026-05-14",
      leaves: [],
    })).rejects.toThrow("no leaves");
    expect(prismaMock.provenanceChainAnchor.create).not.toHaveBeenCalled();
  });

  it("creates a first anchor with previousRoot null", async () => {
    prismaMock.provenanceChainAnchor.findFirst.mockResolvedValueOnce(null);
    const created = await createProvenanceChainAnchor({
      scope: "DAILY",
      scopeId: "2026-05-14",
      leaves: [leaf()],
    });
    expect(created.previousRoot).toBeNull();
    expect(prismaMock.provenanceChainAnchor.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        previousRoot: null,
      }),
    }));
  });

  it("second anchor references first merkleRoot", async () => {
    prismaMock.provenanceChainAnchor.findFirst.mockResolvedValueOnce({ merkleRoot: "first_root" });
    const created = await createProvenanceChainAnchor({
      scope: "DAILY",
      scopeId: "2026-05-14",
      leaves: [leaf({ subjectId: "cycle_002", provenanceHash: "hash_002" })],
    });
    expect(created.previousRoot).toBe("first_root");
    expect(prismaMock.provenanceChainAnchor.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        previousRoot: "first_root",
      }),
    }));
  });

  it("same leaves in different order produce same merkleRoot", async () => {
    prismaMock.provenanceChainAnchor.findFirst.mockResolvedValue(null);
    const leavesA = [
      leaf({ subjectId: "cycle_001", provenanceHash: "hash_a" }),
      leaf({ subjectId: "cycle_002", provenanceHash: "hash_b" }),
    ];
    const leavesB = [...leavesA].reverse();
    const first = await createProvenanceChainAnchor({ scope: "DAILY", scopeId: "2026-05-14", leaves: leavesA });
    const second = await createProvenanceChainAnchor({ scope: "DAILY", scopeId: "2026-05-14", leaves: leavesB });
    expect(first.merkleRoot).toBe(second.merkleRoot);
  });

  it("metadata does not contain raw governance events or leaves", async () => {
    prismaMock.provenanceChainAnchor.findFirst.mockResolvedValueOnce(null);
    await createProvenanceChainAnchor({
      scope: "DAILY",
      scopeId: "2026-05-14",
      leaves: [leaf()],
    });
    const metadata = prismaMock.provenanceChainAnchor.create.mock.calls[0]?.[0].data.metadata;
    expect(metadata).toEqual({
      subjectCount: 1,
      subjectTypes: ["OVERSIGHT_CYCLE"],
      hasRawPayloads: false,
    });
    expect(JSON.stringify(metadata)).not.toContain("governanceEvents");
    expect(JSON.stringify(metadata)).not.toContain("provenanceHash");
    expect(JSON.stringify(metadata)).not.toContain("cycle_001");
  });

  it("records a safe anchor-created audit event", async () => {
    prismaMock.provenanceChainAnchor.findFirst.mockResolvedValueOnce(null);
    const created = await createProvenanceChainAnchor({
      scope: "DAILY",
      scopeId: "2026-05-14",
      leaves: [leaf()],
    });
    expect(auditMock.recordProvenanceAuditEvent).toHaveBeenCalledWith({
      action: "PROVENANCE_ANCHOR_CREATED",
      scope: "DAILY",
      scopeId: "2026-05-14",
      merkleRoot: created.merkleRoot,
      chainHash: created.chainHash,
    });
  });
});

describe("listProvenanceChainAnchors", () => {
  it("returns mapped anchors in stored order", async () => {
    prismaMock.provenanceChainAnchor.findMany.mockResolvedValueOnce([
      {
        id: "anchor_001",
        version: 1,
        scope: "DAILY",
        scopeId: "2026-05-14",
        leafCount: 1,
        merkleRoot: "root_001",
        previousRoot: null,
        chainHash: chainHash(),
        computedAt: new Date("2026-05-14T12:00:00.000Z"),
        fromTimestamp: null,
        toTimestamp: null,
      },
    ]);
    const anchors = await listProvenanceChainAnchors({ scope: "DAILY", scopeId: "2026-05-14" });
    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.computedAt).toBe("2026-05-14T12:00:00.000Z");
  });
});

describe("verifyProvenanceChainSequence", () => {
  it("first anchor can have previousRoot null", () => {
    const result = verifyProvenanceChainSequence([anchor()]);
    expect(result.valid).toBe(true);
  });

  it("detects broken previousRoot", () => {
    const first = anchor({ id: "anchor_001", merkleRoot: "root_001" });
    const second = anchor({
      id: "anchor_002",
      merkleRoot: "root_002",
      previousRoot: "wrong_root",
      computedAt: "2026-05-14T13:00:00.000Z",
    });
    const result = verifyProvenanceChainSequence([first, second]);
    expect(result.valid).toBe(false);
    expect(result.failures.some((failure) => failure.reason.includes("previousRoot"))).toBe(true);
  });

  it("detects recomputed chainHash mismatch", () => {
    const result = verifyProvenanceChainSequence([anchor({ chainHash: "tampered" })]);
    expect(result.valid).toBe(false);
    expect(result.failures.some((failure) => failure.reason.includes("chainHash"))).toBe(true);
  });
});
