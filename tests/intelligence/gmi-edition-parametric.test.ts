/**
 * P10 — Edition-Parametric Architecture Proof
 * Proves Q2 and Q3 resolve through the same services without Q-specific hardcoding.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock prisma before importing resolver
vi.mock("@/lib/prisma", () => ({
  prisma: {
    gmiReleaseSnapshot: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    gmiEditionGovernanceState: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  assertEditionExists,
  GmiEditionNotFoundError,
  getCurrentDraftGmiEdition,
  getGmiEditionRoute,
  getLatestPublishedGmiEdition,
  resolveGmiEditionById,
  resolveGmiEditionBySlug,
} from "@/lib/intelligence/gmi-edition-resolver";

const mockQ2Snapshot = {
  id: "snap_q2",
  editionId: "GMI-Q2-2026",
  editionSlug: "gmi-q2-2026",
  releaseStatus: "PUBLISHED",
  publishedAt: new Date("2026-06-06T10:00:00Z"),
  createdAt: new Date("2026-06-06T09:00:00Z"),
};

const mockQ3Snapshot = {
  id: "snap_q3",
  editionId: "GMI-Q3-2026",
  editionSlug: "gmi-q3-2026",
  releaseStatus: "DRAFT",
  publishedAt: null,
  createdAt: new Date("2026-06-07T00:00:00Z"),
};

const mockGovernance = {
  publicationStatus: "published",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveGmiEditionBySlug", () => {
  it("resolves Q2 by slug", async () => {
    vi.mocked(prisma.gmiReleaseSnapshot.findFirst)
      .mockResolvedValueOnce(mockQ2Snapshot as any)
      .mockResolvedValueOnce(mockQ2Snapshot as any);
    vi.mocked(prisma.gmiEditionGovernanceState.findFirst).mockResolvedValueOnce(
      mockGovernance as any
    );

    const result = await resolveGmiEditionBySlug("gmi-q2-2026");
    expect(result).not.toBeNull();
    expect(result!.editionId).toBe("GMI-Q2-2026");
    expect(result!.editionSlug).toBe("gmi-q2-2026");
  });

  it("resolves Q3 by slug through the same code path", async () => {
    vi.mocked(prisma.gmiReleaseSnapshot.findFirst)
      .mockResolvedValueOnce(mockQ3Snapshot as any)
      .mockResolvedValueOnce(mockQ3Snapshot as any);
    vi.mocked(prisma.gmiEditionGovernanceState.findFirst).mockResolvedValueOnce(
      null
    );

    const result = await resolveGmiEditionBySlug("gmi-q3-2026");
    expect(result).not.toBeNull();
    expect(result!.editionId).toBe("GMI-Q3-2026");
    expect(result!.releaseStatus).toBe("DRAFT");
  });

  it("returns null for unknown slug", async () => {
    vi.mocked(prisma.gmiReleaseSnapshot.findFirst).mockResolvedValueOnce(null);
    const result = await resolveGmiEditionBySlug("gmi-q99-2099");
    expect(result).toBeNull();
  });
});

describe("resolveGmiEditionById", () => {
  it("resolves any valid editionId — not Q2-specific", async () => {
    vi.mocked(prisma.gmiReleaseSnapshot.findFirst).mockResolvedValueOnce(
      mockQ2Snapshot as any
    );
    vi.mocked(prisma.gmiEditionGovernanceState.findFirst).mockResolvedValueOnce(
      mockGovernance as any
    );

    const result = await resolveGmiEditionById("GMI-Q2-2026");
    expect(result!.editionId).toBe("GMI-Q2-2026");
  });
});

describe("getGmiEditionRoute", () => {
  it("builds the correct route for any edition slug", () => {
    expect(getGmiEditionRoute({ editionSlug: "gmi-q2-2026" })).toBe(
      "/intelligence/gmi/gmi-q2-2026"
    );
    expect(getGmiEditionRoute({ editionSlug: "gmi-q3-2026" })).toBe(
      "/intelligence/gmi/gmi-q3-2026"
    );
    expect(getGmiEditionRoute({ editionSlug: "gmi-q4-2026" })).toBe(
      "/intelligence/gmi/gmi-q4-2026"
    );
  });
});

describe("getLatestPublishedGmiEdition", () => {
  it("returns the most recently published edition", async () => {
    vi.mocked(prisma.gmiReleaseSnapshot.findFirst)
      .mockResolvedValueOnce(mockQ2Snapshot as any)
      .mockResolvedValueOnce(mockQ2Snapshot as any);
    vi.mocked(prisma.gmiEditionGovernanceState.findFirst).mockResolvedValueOnce(
      mockGovernance as any
    );

    const result = await getLatestPublishedGmiEdition();
    expect(result!.releaseStatus).toBe("PUBLISHED");
  });

  it("returns null when no published editions exist", async () => {
    vi.mocked(prisma.gmiReleaseSnapshot.findFirst).mockResolvedValueOnce(null);
    const result = await getLatestPublishedGmiEdition();
    expect(result).toBeNull();
  });
});

describe("getCurrentDraftGmiEdition", () => {
  it("returns a draft edition (Q3) without touching published editions logic", async () => {
    vi.mocked(prisma.gmiReleaseSnapshot.findMany).mockResolvedValueOnce([
      { editionId: "GMI-Q3-2026" } as any,
    ]);
    vi.mocked(prisma.gmiReleaseSnapshot.findFirst).mockResolvedValueOnce(
      mockQ3Snapshot as any
    );
    vi.mocked(prisma.gmiEditionGovernanceState.findFirst).mockResolvedValueOnce(
      null
    );

    const result = await getCurrentDraftGmiEdition();
    expect(result!.editionId).toBe("GMI-Q3-2026");
    expect(result!.releaseStatus).toBe("DRAFT");
  });
});

describe("assertEditionExists", () => {
  it("throws GmiEditionNotFoundError for missing editions", async () => {
    vi.mocked(prisma.gmiReleaseSnapshot.findFirst).mockResolvedValueOnce(null);

    await expect(assertEditionExists("GMI-Q99-2099")).rejects.toThrow(
      GmiEditionNotFoundError
    );
  });

  it("returns the edition record when it exists", async () => {
    vi.mocked(prisma.gmiReleaseSnapshot.findFirst).mockResolvedValueOnce(
      mockQ2Snapshot as any
    );
    vi.mocked(prisma.gmiEditionGovernanceState.findFirst).mockResolvedValueOnce(
      mockGovernance as any
    );

    const result = await assertEditionExists("GMI-Q2-2026");
    expect(result.editionId).toBe("GMI-Q2-2026");
  });
});

describe("Q3 draft is correctly blocked", () => {
  it("Q3 draft resolves with non-PUBLISHED releaseStatus", async () => {
    vi.mocked(prisma.gmiReleaseSnapshot.findFirst).mockResolvedValueOnce(
      mockQ3Snapshot as any
    );
    vi.mocked(prisma.gmiEditionGovernanceState.findFirst).mockResolvedValueOnce(
      { publicationStatus: "draft" } as any
    );

    const result = await resolveGmiEditionById("GMI-Q3-2026");
    expect(result!.releaseStatus).not.toBe("PUBLISHED");
    expect(result!.publishedAt).toBeNull();
  });
});
