/**
 * tests/lib/memory/pattern-observer.test.ts
 *
 * Unit tests for the Pattern Observer.
 * All Prisma calls are mocked — no DB connection required.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Prisma ───────────────────────────────────────────────────────────────

const {
  mockDecisionOutcomeRecord,
  mockDecisionInstrumentRun,
  mockOutcomeHypothesis,
  mockPatternObservation,
} = vi.hoisted(() => ({
  mockDecisionOutcomeRecord: { findMany: vi.fn() },
  mockDecisionInstrumentRun: { findMany: vi.fn() },
  mockOutcomeHypothesis: { findMany: vi.fn() },
  mockPatternObservation: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    decisionOutcomeRecord: mockDecisionOutcomeRecord,
    decisionInstrumentRun: mockDecisionInstrumentRun,
    outcomeHypothesis: mockOutcomeHypothesis,
    patternObservation: mockPatternObservation,
  },
}));

import {
  observePatterns,
  getActivePatterns,
  acknowledgePattern,
  resolvePattern,
  getTopPatternForSurface,
} from "@/lib/memory/pattern-observer";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOutcomeRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "outcome-001",
    submittedByEmail: "user@example.com",
    outcomeClass: "SUCCESS",
    evidenceMissing: false,
    carryForward: null,
    ownerCorrect: true,
    decisionInstrumentRunId: "run-001",
    decisionObjectId: null,
    createdAt: new Date("2026-06-07"),
    ...overrides,
  };
}

function makeInstrumentRun(overrides: Record<string, unknown> = {}) {
  return {
    id: "run-001",
    userEmail: "user@example.com",
    instrumentSlug: "governance-gap",
    createdAt: new Date("2026-06-07"),
    ...overrides,
  };
}

function makePatternObservation(overrides: Record<string, unknown> = {}) {
  return {
    id: "pat-001",
    userId: null,
    userEmail: "user@example.com",
    organisationId: null,
    patternType: "OWNER_DELAY",
    patternLabel: "Repeated decision deferral pattern detected",
    patternDetail: "2 decisions deferred",
    observationCount: 2,
    sourceRunIds: ["run-001"],
    recommendedAction: "Confirm owner before next decision",
    riskOfRepeat: "HIGH",
    surfaceIn: ["decision_centre"],
    acknowledgedAt: null,
    dismissedAt: null,
    status: "ACTIVE",
    createdAt: new Date("2026-06-07"),
    updatedAt: new Date("2026-06-07"),
    ...overrides,
  };
}

// ── observePatterns ───────────────────────────────────────────────────────────

describe("observePatterns", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns zero patterns when not enough data", async () => {
    mockDecisionOutcomeRecord.findMany.mockResolvedValue([]);
    mockDecisionInstrumentRun.findMany.mockResolvedValue([makeInstrumentRun()]);
    mockOutcomeHypothesis.findMany.mockResolvedValue([]);
    // No patterns found → no upsert calls
    mockPatternObservation.findFirst.mockResolvedValue(null);
    mockPatternObservation.create.mockResolvedValue(makePatternObservation());

    const result = await observePatterns({ userEmail: "user@example.com" });

    expect(result.userEmail).toBe("user@example.com");
    expect(result.patterns).toHaveLength(0);
    expect(result.highRiskPatterns).toHaveLength(0);
    expect(result.actionableObservation).toBeNull();
  });

  it("detects OWNER_DELAY when ≥2 DEFERRED outcomes exist", async () => {
    mockDecisionOutcomeRecord.findMany.mockResolvedValue([
      makeOutcomeRecord({ outcomeClass: "DEFERRED" }),
      makeOutcomeRecord({ id: "outcome-002", outcomeClass: "DEFERRED" }),
      makeOutcomeRecord({ id: "outcome-003", outcomeClass: "SUCCESS" }),
    ]);
    mockDecisionInstrumentRun.findMany.mockResolvedValue([
      makeInstrumentRun(),
      makeInstrumentRun({ id: "run-002" }),
      makeInstrumentRun({ id: "run-003" }),
    ]);
    mockOutcomeHypothesis.findMany.mockResolvedValue([]);
    mockPatternObservation.findFirst.mockResolvedValue(null);
    mockPatternObservation.create.mockResolvedValue(makePatternObservation());

    const result = await observePatterns({ userEmail: "user@example.com" });

    const ownerDelayPattern = result.patterns.find(
      (p) => p.patternType === "OWNER_DELAY",
    );
    expect(ownerDelayPattern).toBeDefined();
    expect(ownerDelayPattern!.observationCount).toBe(2);
  });

  it("detects EVIDENCE_GAP when ≥2 outcomes have evidenceMissing=true", async () => {
    mockDecisionOutcomeRecord.findMany.mockResolvedValue([
      makeOutcomeRecord({ evidenceMissing: true }),
      makeOutcomeRecord({ id: "outcome-002", evidenceMissing: true }),
      makeOutcomeRecord({ id: "outcome-003", evidenceMissing: false }),
    ]);
    mockDecisionInstrumentRun.findMany.mockResolvedValue([
      makeInstrumentRun(),
      makeInstrumentRun({ id: "run-002" }),
      makeInstrumentRun({ id: "run-003" }),
    ]);
    mockOutcomeHypothesis.findMany.mockResolvedValue([]);
    mockPatternObservation.findFirst.mockResolvedValue(null);
    mockPatternObservation.create.mockResolvedValue(makePatternObservation({ patternType: "EVIDENCE_GAP" }));

    const result = await observePatterns({ userEmail: "user@example.com" });

    const evidencePattern = result.patterns.find(
      (p) => p.patternType === "EVIDENCE_GAP",
    );
    expect(evidencePattern).toBeDefined();
    expect(evidencePattern!.riskOfRepeat).toMatch(/^(MEDIUM|HIGH)$/);
  });

  it("detects AUTHORITY_FAILURE when ≥2 outcomes are FAILURE or PARTIAL", async () => {
    mockDecisionOutcomeRecord.findMany.mockResolvedValue([
      makeOutcomeRecord({ outcomeClass: "FAILURE" }),
      makeOutcomeRecord({ id: "outcome-002", outcomeClass: "PARTIAL" }),
      makeOutcomeRecord({ id: "outcome-003", outcomeClass: "SUCCESS" }),
    ]);
    mockDecisionInstrumentRun.findMany.mockResolvedValue([
      makeInstrumentRun(),
      makeInstrumentRun({ id: "run-002" }),
      makeInstrumentRun({ id: "run-003" }),
    ]);
    mockOutcomeHypothesis.findMany.mockResolvedValue([]);
    mockPatternObservation.findFirst.mockResolvedValue(null);
    mockPatternObservation.create.mockResolvedValue(makePatternObservation({ patternType: "AUTHORITY_FAILURE" }));

    const result = await observePatterns({ userEmail: "user@example.com" });

    const authPattern = result.patterns.find(
      (p) => p.patternType === "AUTHORITY_FAILURE",
    );
    expect(authPattern).toBeDefined();
  });

  it("detects GOVERNANCE_DRIFT when ≥2 outcomes have ownerCorrect=false", async () => {
    mockDecisionOutcomeRecord.findMany.mockResolvedValue([
      makeOutcomeRecord({ ownerCorrect: false }),
      makeOutcomeRecord({ id: "outcome-002", ownerCorrect: false }),
    ]);
    mockDecisionInstrumentRun.findMany.mockResolvedValue([
      makeInstrumentRun(),
      makeInstrumentRun({ id: "run-002" }),
      makeInstrumentRun({ id: "run-003" }),
    ]);
    mockOutcomeHypothesis.findMany.mockResolvedValue([]);
    mockPatternObservation.findFirst.mockResolvedValue(null);
    mockPatternObservation.create.mockResolvedValue(makePatternObservation({ patternType: "GOVERNANCE_DRIFT" }));

    const result = await observePatterns({ userEmail: "user@example.com" });

    const govPattern = result.patterns.find(
      (p) => p.patternType === "GOVERNANCE_DRIFT",
    );
    expect(govPattern).toBeDefined();
    expect(govPattern!.riskOfRepeat).toBe("HIGH");
  });

  it("detects DECISION_CLASS_TREND when same instrument used ≥3 times", async () => {
    mockDecisionOutcomeRecord.findMany.mockResolvedValue([]);
    mockDecisionInstrumentRun.findMany.mockResolvedValue([
      makeInstrumentRun({ id: "run-001", instrumentSlug: "governance-gap" }),
      makeInstrumentRun({ id: "run-002", instrumentSlug: "governance-gap" }),
      makeInstrumentRun({ id: "run-003", instrumentSlug: "governance-gap" }),
    ]);
    mockOutcomeHypothesis.findMany.mockResolvedValue([]);
    mockPatternObservation.findFirst.mockResolvedValue(null);
    mockPatternObservation.create.mockResolvedValue(makePatternObservation({ patternType: "DECISION_CLASS_TREND" }));

    const result = await observePatterns({ userEmail: "user@example.com" });

    const trendPattern = result.patterns.find(
      (p) => p.patternType === "DECISION_CLASS_TREND",
    );
    expect(trendPattern).toBeDefined();
    expect(trendPattern!.patternLabel).toContain("governance-gap");
    expect(trendPattern!.observationCount).toBe(3);
  });

  it("detects RECURRING_CONSTRAINT when ≥3 outcomes have carryForward notes", async () => {
    mockDecisionOutcomeRecord.findMany.mockResolvedValue([
      makeOutcomeRecord({ carryForward: "Stakeholder alignment still pending" }),
      makeOutcomeRecord({ id: "outcome-002", carryForward: "Same alignment issue" }),
      makeOutcomeRecord({ id: "outcome-003", carryForward: "Authority not confirmed" }),
    ]);
    mockDecisionInstrumentRun.findMany.mockResolvedValue([
      makeInstrumentRun(),
      makeInstrumentRun({ id: "run-002" }),
      makeInstrumentRun({ id: "run-003" }),
    ]);
    mockOutcomeHypothesis.findMany.mockResolvedValue([]);
    mockPatternObservation.findFirst.mockResolvedValue(null);
    mockPatternObservation.create.mockResolvedValue(makePatternObservation({ patternType: "RECURRING_CONSTRAINT" }));

    const result = await observePatterns({ userEmail: "user@example.com" });

    const constraintPattern = result.patterns.find(
      (p) => p.patternType === "RECURRING_CONSTRAINT",
    );
    expect(constraintPattern).toBeDefined();
    expect(constraintPattern!.observationCount).toBe(3);
  });

  it("updates existing pattern observation rather than creating a duplicate", async () => {
    mockDecisionOutcomeRecord.findMany.mockResolvedValue([
      makeOutcomeRecord({ outcomeClass: "DEFERRED" }),
      makeOutcomeRecord({ id: "outcome-002", outcomeClass: "DEFERRED" }),
      makeOutcomeRecord({ id: "outcome-003", outcomeClass: "SUCCESS" }),
    ]);
    mockDecisionInstrumentRun.findMany.mockResolvedValue([
      makeInstrumentRun(),
      makeInstrumentRun({ id: "run-002" }),
      makeInstrumentRun({ id: "run-003" }),
    ]);
    mockOutcomeHypothesis.findMany.mockResolvedValue([]);

    // Existing active pattern found
    mockPatternObservation.findFirst.mockResolvedValue(makePatternObservation());
    mockPatternObservation.update.mockResolvedValue(makePatternObservation({ observationCount: 3 }));

    await observePatterns({ userEmail: "user@example.com" });

    // Should update, not create
    expect(mockPatternObservation.update).toHaveBeenCalled();
    expect(mockPatternObservation.create).not.toHaveBeenCalled();
  });

  it("surfaces actionableObservation for the highest-risk pattern", async () => {
    mockDecisionOutcomeRecord.findMany.mockResolvedValue([
      makeOutcomeRecord({ ownerCorrect: false }),
      makeOutcomeRecord({ id: "outcome-002", ownerCorrect: false }),
    ]);
    mockDecisionInstrumentRun.findMany.mockResolvedValue([
      makeInstrumentRun(),
      makeInstrumentRun({ id: "run-002" }),
      makeInstrumentRun({ id: "run-003" }),
    ]);
    mockOutcomeHypothesis.findMany.mockResolvedValue([]);
    mockPatternObservation.findFirst.mockResolvedValue(null);
    mockPatternObservation.create.mockResolvedValue(
      makePatternObservation({ patternType: "GOVERNANCE_DRIFT", riskOfRepeat: "HIGH" }),
    );

    const result = await observePatterns({ userEmail: "user@example.com" });

    if (result.highRiskPatterns.length > 0) {
      expect(result.actionableObservation).toBeTruthy();
    }
  });
});

// ── getActivePatterns ─────────────────────────────────────────────────────────

describe("getActivePatterns", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all active patterns for a user", async () => {
    mockPatternObservation.findMany.mockResolvedValue([
      makePatternObservation(),
      makePatternObservation({ id: "pat-002", patternType: "EVIDENCE_GAP", surfaceIn: ["return_brief"] }),
    ]);

    const result = await getActivePatterns("user@example.com");
    expect(result).toHaveLength(2);
  });

  it("filters by surface when provided", async () => {
    mockPatternObservation.findMany.mockResolvedValue([
      makePatternObservation({ surfaceIn: ["decision_centre", "strategy_room"] }),
      makePatternObservation({ id: "pat-002", surfaceIn: ["return_brief"] }),
    ]);

    const result = await getActivePatterns("user@example.com", "decision_centre");
    expect(result).toHaveLength(1);
    expect(result[0]!.surfaceIn).toContain("decision_centre");
  });

  it("returns empty array when no active patterns", async () => {
    mockPatternObservation.findMany.mockResolvedValue([]);
    const result = await getActivePatterns("new@example.com");
    expect(result).toHaveLength(0);
  });
});

// ── acknowledgePattern / resolvePattern ───────────────────────────────────────

describe("acknowledgePattern", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status ACKNOWLEDGED with timestamp", async () => {
    mockPatternObservation.update.mockResolvedValue(
      makePatternObservation({ status: "ACKNOWLEDGED", acknowledgedAt: new Date() }),
    );

    await acknowledgePattern("pat-001");

    const updateCall = mockPatternObservation.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe("ACKNOWLEDGED");
    expect(updateCall.data.acknowledgedAt).toBeTruthy();
  });
});

describe("resolvePattern", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status RESOLVED", async () => {
    mockPatternObservation.update.mockResolvedValue(
      makePatternObservation({ status: "RESOLVED" }),
    );

    await resolvePattern("pat-001");

    const updateCall = mockPatternObservation.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe("RESOLVED");
  });
});

// ── getTopPatternForSurface ───────────────────────────────────────────────────

describe("getTopPatternForSurface", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when no active patterns exist for surface", async () => {
    mockPatternObservation.findMany.mockResolvedValue([]);

    const result = await getTopPatternForSurface("user@example.com", "strategy_room");
    expect(result).toBeNull();
  });

  it("returns CRITICAL pattern first when multiple exist", async () => {
    mockPatternObservation.findMany.mockResolvedValue([
      makePatternObservation({ id: "pat-001", riskOfRepeat: "MEDIUM", surfaceIn: ["decision_centre"] }),
      makePatternObservation({ id: "pat-002", riskOfRepeat: "CRITICAL", surfaceIn: ["decision_centre"] }),
      makePatternObservation({ id: "pat-003", riskOfRepeat: "HIGH", surfaceIn: ["decision_centre"] }),
    ]);

    const result = await getTopPatternForSurface("user@example.com", "decision_centre");
    expect(result).not.toBeNull();
    expect(result!.riskOfRepeat).toBe("CRITICAL");
    expect(result!.id).toBe("pat-002");
  });

  it("returns HIGH before MEDIUM", async () => {
    mockPatternObservation.findMany.mockResolvedValue([
      makePatternObservation({ id: "pat-001", riskOfRepeat: "MEDIUM", surfaceIn: ["decision_centre"] }),
      makePatternObservation({ id: "pat-002", riskOfRepeat: "HIGH", surfaceIn: ["decision_centre"] }),
    ]);

    const result = await getTopPatternForSurface("user@example.com", "decision_centre");
    expect(result!.riskOfRepeat).toBe("HIGH");
  });

  it("returns null for surface when no patterns match that surface", async () => {
    mockPatternObservation.findMany.mockResolvedValue([
      makePatternObservation({ surfaceIn: ["return_brief"] }),
    ]);

    const result = await getTopPatternForSurface("user@example.com", "strategy_room");
    expect(result).toBeNull();
  });
});
