import { describe, expect, it, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    auditEvent: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/admin/provenance-operation-audit", () => ({
  recordProvenanceOperationAudit: vi.fn().mockResolvedValue({ ok: true }),
  createProvenanceRequestId: vi.fn(() => "prv_test_req"),
}));

import { prisma } from "@/lib/prisma.server";
import { recordProvenanceOperationAudit } from "@/lib/admin/provenance-operation-audit";
import {
  buildPublicRootMetadata,
  publishPublicRoot,
  type PublicRootMetadata,
} from "./publish-public-root";
import type { ProvenanceChainAnchorRecord } from "@/lib/admin/provenance-chain-ledger";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ANCHOR: ProvenanceChainAnchorRecord = {
  id: "anchor_001",
  version: 1,
  scope: "DAILY",
  scopeId: "internal-scope-id-xz9q",  // SENSITIVE — must never appear in public metadata
  leafCount: 12,
  merkleRoot: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  previousRoot: null,
  chainHash: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
  computedAt: "2026-05-15T12:00:00.000Z",
};

const ACTOR = { id: "admin_1", email: "admin@example.com" };

// ── buildPublicRootMetadata ───────────────────────────────────────────────────

describe("buildPublicRootMetadata", () => {
  it("includes only safe public fields", () => {
    const meta = buildPublicRootMetadata(ANCHOR);

    expect(meta).toEqual<PublicRootMetadata>({
      version: 1,
      scope: "DAILY",
      merkleRoot: ANCHOR.merkleRoot,
      leafCount: 12,
      computedAt: "2026-05-15T12:00:00.000Z",
      chainHash: ANCHOR.chainHash,
    });
  });

  it("never includes scopeId in the public metadata", () => {
    const meta = buildPublicRootMetadata(ANCHOR);
    const serialised = JSON.stringify(meta);

    expect(serialised).not.toContain("scopeId");
    expect(serialised).not.toContain(ANCHOR.scopeId);
  });

  it("never includes the internal anchor id in the public metadata", () => {
    const meta = buildPublicRootMetadata(ANCHOR);
    const serialised = JSON.stringify(meta);

    expect(serialised).not.toContain(ANCHOR.id);
  });

  it("never includes previousRoot in the public metadata", () => {
    const withPrev: ProvenanceChainAnchorRecord = {
      ...ANCHOR,
      previousRoot: "prev_root_hash",
    };
    const meta = buildPublicRootMetadata(withPrev);
    const serialised = JSON.stringify(meta);

    expect(serialised).not.toContain("previousRoot");
    expect(serialised).not.toContain("prev_root_hash");
  });
});

// ── publishPublicRoot ─────────────────────────────────────────────────────────

describe("publishPublicRoot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: not already published
    vi.mocked((prisma as any).auditEvent.findFirst).mockResolvedValue(null);
    // Default: create succeeds
    vi.mocked((prisma as any).auditEvent.create).mockResolvedValue({ id: "audit_event_001" });
  });

  it("writes AuditEvent with objectType PROVENANCE_ANCHOR and safe metadata only", async () => {
    const result = await publishPublicRoot({ anchor: ANCHOR, actor: ACTOR });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.auditEventId).toBe("audit_event_001");

    const createCall = vi.mocked((prisma as any).auditEvent.create).mock.calls[0]![0];
    expect(createCall.data.objectType).toBe("PROVENANCE_ANCHOR");
    expect(createCall.data.actionType).toBe("PROVENANCE_PUBLIC_ROOT_PUBLISHED");
    expect(createCall.data.objectId).toBe(ANCHOR.merkleRoot);

    const metadata = createCall.data.metadata as Record<string, unknown>;
    expect(metadata.merkleRoot).toBe(ANCHOR.merkleRoot);
    expect(metadata.scope).toBe("DAILY");
    expect(metadata.leafCount).toBe(12);
    expect(metadata.chainHash).toBe(ANCHOR.chainHash);
    // scopeId must NEVER appear in public metadata
    expect(JSON.stringify(metadata)).not.toContain("scopeId");
    expect(JSON.stringify(metadata)).not.toContain(ANCHOR.scopeId);
  });

  it("uses merkleRoot (not scopeId) as the objectId in the AuditEvent", async () => {
    await publishPublicRoot({ anchor: ANCHOR, actor: ACTOR });

    const createCall = vi.mocked((prisma as any).auditEvent.create).mock.calls[0]![0];
    expect(createCall.data.objectId).toBe(ANCHOR.merkleRoot);
    expect(createCall.data.objectId).not.toBe(ANCHOR.scopeId);
    expect(createCall.data.objectId).not.toBe(ANCHOR.id);
  });

  it("records PROVENANCE_PUBLIC_ROOT_PUBLISHED to the internal operation audit trail", async () => {
    await publishPublicRoot({ anchor: ANCHOR, actor: ACTOR });

    expect(recordProvenanceOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "PROVENANCE_PUBLIC_ROOT_PUBLISHED",
        status: "SUCCESS",
        merkleRoot: ANCHOR.merkleRoot,
        chainHash: ANCHOR.chainHash,
        actorId: ACTOR.id,
        actorEmail: ACTOR.email,
      }),
    );

    // scopeId is deliberately NOT passed to operation audit metadata
    const auditCall = vi.mocked(recordProvenanceOperationAudit).mock.calls[0]![0];
    expect(auditCall).not.toHaveProperty("scopeId");
  });

  it("returns ALREADY_PUBLISHED when the same merkleRoot is in the public log", async () => {
    vi.mocked((prisma as any).auditEvent.findFirst).mockResolvedValue({ id: "existing_event" });

    const result = await publishPublicRoot({ anchor: ANCHOR, actor: ACTOR });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("ALREADY_PUBLISHED");
    expect(vi.mocked((prisma as any).auditEvent.create)).not.toHaveBeenCalled();
  });

  it("returns WRITE_FAILED if the AuditEvent create throws", async () => {
    vi.mocked((prisma as any).auditEvent.create).mockRejectedValue(new Error("DB write error"));

    const result = await publishPublicRoot({ anchor: ANCHOR, actor: ACTOR });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("WRITE_FAILED");
  });

  it("actorType is ADMIN when actor has an id or email", async () => {
    await publishPublicRoot({ anchor: ANCHOR, actor: ACTOR });

    const createCall = vi.mocked((prisma as any).auditEvent.create).mock.calls[0]![0];
    expect(createCall.data.actorType).toBe("ADMIN");
  });

  it("actorType is SYSTEM when actor has no id and no email", async () => {
    await publishPublicRoot({ anchor: ANCHOR, actor: { id: null, email: null } });

    const createCall = vi.mocked((prisma as any).auditEvent.create).mock.calls[0]![0];
    expect(createCall.data.actorType).toBe("SYSTEM");
  });
});
