import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  diagnosticJourney: {
    findUnique: vi.fn(),
  },
  organisation: {
    findFirst: vi.fn(),
  },
  organisationMembership: {
    findFirst: vi.fn(),
  },
  caseShareInvite: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  provenanceChainAnchor: {
    findFirst: vi.fn(),
  },
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: mocks,
}));

const {
  createCaseShare,
  hashCaseShareToken,
  loadSharedCaseByToken,
} = await import("./case-sharing");

function shareRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "share_001",
    caseId: "case_001",
    ownerEmail: "owner@example.com",
    recipientEmail: null,
    role: "VIEWER",
    tokenHash: "hash_001",
    status: "ACTIVE",
    allowExport: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date("2026-05-16T12:00:00.000Z"),
    revokedAt: null,
    ...overrides,
  };
}

function journey(overrides: Record<string, unknown> = {}) {
  return {
    journeyKey: "case_001",
    email: "owner@example.com",
    organisationKey: null,
    organisation: null,
    status: "active",
    stages: [{ stage: "purpose_alignment" }],
    evidenceNodes: [
      { kind: "contradiction", summary: "Authority remains unclear.", severity: "high" },
    ],
    decisionObjects: [
      { decisionText: "Approve the operating model change", constraintText: "Authority is unresolved." },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.diagnosticJourney.findUnique.mockResolvedValue(journey());
  mocks.caseShareInvite.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    ...shareRow(),
    ...data,
  }));
  mocks.caseShareInvite.findUnique.mockResolvedValue(shareRow());
  mocks.caseShareInvite.update.mockResolvedValue(shareRow({ status: "EXPIRED" }));
  mocks.provenanceChainAnchor.findFirst.mockResolvedValue(null);
});

describe("case sharing service", () => {
  it("stores only a hashed token when creating a share", async () => {
    const result = await createCaseShare({
      caseId: "case_001",
      requesterEmail: "owner@example.com",
      role: "VIEWER",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected share creation");

    const createArg = mocks.caseShareInvite.create.mock.calls[0]?.[0] as { data: { tokenHash: string } };
    expect(createArg.data.tokenHash).toBe(hashCaseShareToken(result.token));
    expect(createArg.data.tokenHash).not.toBe(result.token);
  });

  it("loads a valid token into a client-safe viewer view without export access", async () => {
    const result = await loadSharedCaseByToken("case_token");

    expect(result.state).toBe("ACTIVE");
    if (result.state !== "ACTIVE") throw new Error("expected active share");
    expect(result.view.canVerify).toBe(false);
    expect(result.view.canExport).toBe(false);
    expect(JSON.stringify(result.view)).not.toContain("raw evidence");
    expect(JSON.stringify(result.view)).not.toContain("suppression");
    expect(JSON.stringify(result.view)).not.toContain("actor_");
  });

  it("marks expired links unavailable", async () => {
    mocks.caseShareInvite.findUnique.mockResolvedValueOnce(shareRow({
      expiresAt: new Date("2026-05-01T00:00:00.000Z"),
    }));

    const result = await loadSharedCaseByToken("expired_token");

    expect(result.state).toBe("EXPIRED");
    expect(result.view).toBeNull();
  });

  it("marks revoked links unavailable", async () => {
    mocks.caseShareInvite.findUnique.mockResolvedValueOnce(shareRow({
      status: "REVOKED",
      revokedAt: new Date("2026-05-16T12:00:00.000Z"),
    }));

    const result = await loadSharedCaseByToken("revoked_token");

    expect(result.state).toBe("REVOKED");
    expect(result.view).toBeNull();
  });

  it("allows auditors to verify and export only when enabled", async () => {
    mocks.caseShareInvite.findUnique.mockResolvedValueOnce(shareRow({
      role: "AUDITOR",
      allowExport: true,
    }));
    mocks.provenanceChainAnchor.findFirst.mockResolvedValueOnce({ id: "anchor_001" });

    const result = await loadSharedCaseByToken("auditor_token");

    expect(result.state).toBe("ACTIVE");
    if (result.state !== "ACTIVE") throw new Error("expected active auditor share");
    expect(result.view.canVerify).toBe(true);
    expect(result.view.canExport).toBe(true);
  });
});
