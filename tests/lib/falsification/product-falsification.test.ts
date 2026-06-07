/**
 * tests/lib/falsification/product-falsification.test.ts
 *
 * Unit tests for the generalised falsification panel.
 * All Prisma calls are mocked — no DB connection required.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Prisma ───────────────────────────────────────────────────────────────

const { mockFalsificationEntry } = vi.hoisted(() => ({
  mockFalsificationEntry: {
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    falsificationEntry: mockFalsificationEntry,
  },
}));

import {
  validateClaimConfidence,
  createFalsificationEntry,
  updateFalsificationStatus,
  getFalsificationPanel,
  getUncoveredHighConfidenceClaims,
  buildInlineFalsificationPanel,
} from "@/lib/falsification/product-falsification";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDbEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: "entry-001",
    productCode: "boardroom_brief",
    artifactId: "ART-001",
    sourceEntityType: null,
    sourceEntityId: null,
    claimOrRecommendation: "The market is contracting in Q3",
    confidenceLevel: "HIGH",
    whatWouldChangeThisView: "If Q3 shipment data shows growth > 5%",
    observableIndicator: "Shipment index published monthly",
    threshold: "5% growth",
    reviewDate: new Date("2026-09-07"),
    evidenceCurrentlyMissing: null,
    strongestCounterargument: null,
    responseToCounterargument: null,
    status: "MONITORING",
    overturnedAt: null,
    confirmedAt: null,
    createdAt: new Date("2026-06-07"),
    updatedAt: new Date("2026-06-07"),
    ...overrides,
  };
}

// ── validateClaimConfidence ───────────────────────────────────────────────────

describe("validateClaimConfidence", () => {
  it("HIGH + falsification condition + no pending source → valid", () => {
    const result = validateClaimConfidence({
      confidenceLevel: "HIGH",
      hasSourcePending: false,
      hasFalsificationCondition: true,
    });
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("HIGH without falsification condition → violation", () => {
    const result = validateClaimConfidence({
      confidenceLevel: "HIGH",
      hasSourcePending: false,
      hasFalsificationCondition: false,
    });
    expect(result.valid).toBe(false);
    expect(result.violations[0]).toContain("HIGH confidence claims require a falsification condition");
  });

  it("MEDIUM without falsification condition → violation", () => {
    const result = validateClaimConfidence({
      confidenceLevel: "MEDIUM",
      hasSourcePending: false,
      hasFalsificationCondition: false,
    });
    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(1);
  });

  it("HIGH + SOURCE_PENDING → violation for confidence level", () => {
    const result = validateClaimConfidence({
      confidenceLevel: "HIGH",
      hasSourcePending: true,
      hasFalsificationCondition: true,
    });
    expect(result.valid).toBe(false);
    expect(result.violations[0]).toContain("SOURCE_PENDING");
    expect(result.violations[0]).toContain("HIGH");
  });

  it("MEDIUM + SOURCE_PENDING → violation", () => {
    const result = validateClaimConfidence({
      confidenceLevel: "MEDIUM",
      hasSourcePending: true,
      hasFalsificationCondition: true,
    });
    expect(result.valid).toBe(false);
    expect(result.violations[0]).toContain("SOURCE_PENDING");
  });

  it("LOW + SOURCE_PENDING → valid (low confidence permitted with pending source)", () => {
    const result = validateClaimConfidence({
      confidenceLevel: "LOW",
      hasSourcePending: true,
      hasFalsificationCondition: false,
    });
    expect(result.valid).toBe(true);
  });

  it("MONITORING + no conditions → valid (monitoring does not require falsification)", () => {
    const result = validateClaimConfidence({
      confidenceLevel: "MONITORING",
      hasSourcePending: false,
      hasFalsificationCondition: false,
    });
    expect(result.valid).toBe(true);
  });

  it("HIGH + SOURCE_PENDING + no falsification → two violations", () => {
    const result = validateClaimConfidence({
      confidenceLevel: "HIGH",
      hasSourcePending: true,
      hasFalsificationCondition: false,
    });
    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(2);
  });
});

// ── createFalsificationEntry ──────────────────────────────────────────────────

describe("createFalsificationEntry", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates entry for valid HIGH confidence claim", async () => {
    const dbEntry = makeDbEntry();
    mockFalsificationEntry.create.mockResolvedValue(dbEntry);

    const result = await createFalsificationEntry({
      productCode: "boardroom_brief",
      artifactId: "ART-001",
      claimOrRecommendation: "The market is contracting in Q3",
      confidenceLevel: "HIGH",
      whatWouldChangeThisView: "If Q3 shipment data shows growth > 5%",
      observableIndicator: "Shipment index published monthly",
    });

    expect(mockFalsificationEntry.create).toHaveBeenCalledOnce();
    expect(result.confidenceLevel).toBe("HIGH");
    expect(result.status).toBe("MONITORING");
  });

  it("throws for HIGH confidence without falsification condition", async () => {
    await expect(
      createFalsificationEntry({
        productCode: "boardroom_brief",
        claimOrRecommendation: "Market is contracting",
        confidenceLevel: "HIGH",
        whatWouldChangeThisView: "",
        observableIndicator: "Some indicator",
      }),
    ).rejects.toThrow("Falsification validation failed");

    expect(mockFalsificationEntry.create).not.toHaveBeenCalled();
  });

  it("throws for HIGH confidence with pending evidence source", async () => {
    await expect(
      createFalsificationEntry({
        productCode: "boardroom_brief",
        claimOrRecommendation: "Market is contracting",
        confidenceLevel: "HIGH",
        whatWouldChangeThisView: "If growth > 5%",
        observableIndicator: "Shipment index",
        evidenceCurrentlyMissing: "Q2 shipment data not yet published",
      }),
    ).rejects.toThrow("Falsification validation failed");
  });

  it("creates LOW confidence entry without falsification condition", async () => {
    const dbEntry = makeDbEntry({ confidenceLevel: "LOW" });
    mockFalsificationEntry.create.mockResolvedValue(dbEntry);

    await createFalsificationEntry({
      productCode: "decision_instruments",
      claimOrRecommendation: "Authority gap may exist",
      confidenceLevel: "LOW",
      whatWouldChangeThisView: "",
      observableIndicator: "Post-decision review",
    });

    expect(mockFalsificationEntry.create).toHaveBeenCalledOnce();
  });
});

// ── updateFalsificationStatus ─────────────────────────────────────────────────

describe("updateFalsificationStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets confirmedAt when status = CONFIRMED", async () => {
    mockFalsificationEntry.update.mockResolvedValue(
      makeDbEntry({ status: "CONFIRMED", confirmedAt: new Date() }),
    );

    const result = await updateFalsificationStatus("entry-001", "CONFIRMED");
    expect(result.status).toBe("CONFIRMED");

    const updateCall = mockFalsificationEntry.update.mock.calls[0][0];
    expect(updateCall.data.confirmedAt).toBeTruthy();
    expect(updateCall.data.overturnedAt).toBeUndefined();
  });

  it("sets overturnedAt when status = OVERTURNED", async () => {
    mockFalsificationEntry.update.mockResolvedValue(
      makeDbEntry({ status: "OVERTURNED", overturnedAt: new Date() }),
    );

    const result = await updateFalsificationStatus("entry-001", "OVERTURNED");
    expect(result.status).toBe("OVERTURNED");

    const updateCall = mockFalsificationEntry.update.mock.calls[0][0];
    expect(updateCall.data.overturnedAt).toBeTruthy();
    expect(updateCall.data.confirmedAt).toBeUndefined();
  });

  it("sets neither timestamp when status = EXPIRED", async () => {
    mockFalsificationEntry.update.mockResolvedValue(
      makeDbEntry({ status: "EXPIRED" }),
    );

    await updateFalsificationStatus("entry-001", "EXPIRED");

    const updateCall = mockFalsificationEntry.update.mock.calls[0][0];
    expect(updateCall.data.confirmedAt).toBeUndefined();
    expect(updateCall.data.overturnedAt).toBeUndefined();
  });
});

// ── getFalsificationPanel ─────────────────────────────────────────────────────

describe("getFalsificationPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns complete panel when all HIGH claims are falsified", async () => {
    const entries = [
      makeDbEntry({ confidenceLevel: "HIGH", whatWouldChangeThisView: "If growth > 5%" }),
      makeDbEntry({
        id: "entry-002",
        confidenceLevel: "MEDIUM",
        whatWouldChangeThisView: "If competitor exits market",
      }),
    ];
    mockFalsificationEntry.findMany.mockResolvedValue(entries);

    const panel = await getFalsificationPanel("ART-001");

    expect(panel.panelComplete).toBe(true);
    expect(panel.hasHighConfidenceClaims).toBe(true);
    expect(panel.allHighClaimsFalsified).toBe(true);
    expect(panel.hasUncoveredHighClaims).toBe(false);
    expect(panel.warnings).toHaveLength(0);
  });

  it("reports warning when HIGH claim lacks falsification condition", async () => {
    const entries = [
      makeDbEntry({ confidenceLevel: "HIGH", whatWouldChangeThisView: "" }),
    ];
    mockFalsificationEntry.findMany.mockResolvedValue(entries);

    const panel = await getFalsificationPanel("ART-001");

    expect(panel.panelComplete).toBe(false);
    expect(panel.hasUncoveredHighClaims).toBe(true);
    expect(panel.warnings.length).toBeGreaterThan(0);
    expect(panel.warnings[0]).toContain("lack falsification conditions");
  });

  it("reports warning when any entry has pending evidence", async () => {
    const entries = [
      makeDbEntry({
        confidenceLevel: "LOW",
        evidenceCurrentlyMissing: "Q3 data not published",
      }),
    ];
    mockFalsificationEntry.findMany.mockResolvedValue(entries);

    const panel = await getFalsificationPanel("ART-001");

    expect(panel.hasPendingEvidence).toBe(true);
    expect(panel.warnings[0]).toContain("pending evidence");
  });

  it("reports warning when overturned entries exist", async () => {
    const entries = [
      makeDbEntry({
        status: "OVERTURNED",
        overturnedAt: new Date(),
        whatWouldChangeThisView: "Something changed",
      }),
    ];
    mockFalsificationEntry.findMany.mockResolvedValue(entries);

    const panel = await getFalsificationPanel("ART-001");

    expect(panel.warnings.some((w) => w.includes("overturned"))).toBe(true);
  });

  it("returns empty panel with no entries", async () => {
    mockFalsificationEntry.findMany.mockResolvedValue([]);

    const panel = await getFalsificationPanel("ART-001");

    expect(panel.entries).toHaveLength(0);
    expect(panel.panelComplete).toBe(false);
    expect(panel.hasHighConfidenceClaims).toBe(false);
  });
});

// ── getUncoveredHighConfidenceClaims ──────────────────────────────────────────

describe("getUncoveredHighConfidenceClaims", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns entries missing whatWouldChangeThisView", async () => {
    const entries = [
      makeDbEntry({ whatWouldChangeThisView: "" }),
      makeDbEntry({ id: "entry-002", whatWouldChangeThisView: "If growth > 5%" }),
    ];
    mockFalsificationEntry.findMany.mockResolvedValue(entries);

    const uncovered = await getUncoveredHighConfidenceClaims("ART-001");
    expect(uncovered).toHaveLength(1);
    expect(uncovered[0]!.id).toBe("entry-001");
  });

  it("returns empty when all HIGH claims are covered", async () => {
    mockFalsificationEntry.findMany.mockResolvedValue([
      makeDbEntry({ whatWouldChangeThisView: "If growth > 5%" }),
    ]);

    const uncovered = await getUncoveredHighConfidenceClaims("ART-001");
    expect(uncovered).toHaveLength(0);
  });
});

// ── buildInlineFalsificationPanel ────────────────────────────────────────────

describe("buildInlineFalsificationPanel", () => {
  it("returns complete=true when all HIGH claims have conditions", () => {
    const result = buildInlineFalsificationPanel([
      {
        claim: "Market is contracting",
        confidence: "HIGH",
        whatWouldChangeThisView: "If Q3 data shows growth",
        observableIndicator: "Shipment index",
      },
      {
        claim: "Competitor is exiting",
        confidence: "MEDIUM",
        whatWouldChangeThisView: "If competitor announces expansion",
        observableIndicator: "Press release",
      },
    ]);

    expect(result.panelComplete).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("returns complete=false and warning when HIGH claim lacks condition", () => {
    const result = buildInlineFalsificationPanel([
      {
        claim: "Market is contracting",
        confidence: "HIGH",
        whatWouldChangeThisView: "",
        observableIndicator: "Shipment index",
      },
    ]);

    expect(result.panelComplete).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("warns about pending evidence", () => {
    const result = buildInlineFalsificationPanel([
      {
        claim: "Claim with missing evidence",
        confidence: "LOW",
        whatWouldChangeThisView: "Something",
        observableIndicator: "Something else",
        evidenceCurrentlyMissing: "Q2 data not published",
      },
    ]);

    expect(result.panelComplete).toBe(false);
    expect(result.warnings[0]).toContain("pending evidence");
  });

  it("returns complete=false for empty entry list", () => {
    const result = buildInlineFalsificationPanel([]);
    expect(result.panelComplete).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("LOW confidence without condition is valid (does not require falsification)", () => {
    const result = buildInlineFalsificationPanel([
      {
        claim: "Tentative observation",
        confidence: "LOW",
        whatWouldChangeThisView: "",
        observableIndicator: "To be determined",
      },
    ]);
    // No HIGH/MEDIUM claims — panel cannot be "complete" (no high claims to falsify)
    // but no warnings about missing conditions for LOW
    expect(result.warnings.some((w) => w.includes("lack falsification"))).toBe(false);
  });
});
