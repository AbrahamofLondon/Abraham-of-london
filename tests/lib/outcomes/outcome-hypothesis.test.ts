/**
 * tests/lib/outcomes/outcome-hypothesis.test.ts
 *
 * Unit tests for outcome hypothesis lifecycle.
 * All Prisma calls are mocked — no DB connection required.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Prisma ───────────────────────────────────────────────────────────────

const { mockOutcomeHypothesis, mockReturnBriefRequest } = vi.hoisted(() => ({
  mockOutcomeHypothesis: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  mockReturnBriefRequest: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    outcomeHypothesis: mockOutcomeHypothesis,
    returnBriefRequest: mockReturnBriefRequest,
  },
}));

import {
  createOutcomeHypothesis,
  exemptFromHypothesis,
  requestReturnBrief,
  closeHypothesis,
  getOverdueHypotheses,
  getUpcomingHypotheses,
  getHypothesisSummaryForUser,
  HYPOTHESIS_TEMPLATES,
} from "@/lib/outcomes/outcome-hypothesis";

// ── Helpers ───────────────────────────────────────────────────────────────────

const KNOWN_PRODUCT_CODES = [
  "boardroom_brief",
  "decision_instruments",
  "strategy_room",
  "executive_reporting",
  "retainer_oversight",
];

function makeDbHypothesis(overrides: Record<string, unknown> = {}) {
  const reviewDate = new Date("2026-09-07");
  const returnBriefDueAt = new Date("2026-09-14");
  return {
    id: "db-id-001",
    hypothesisId: "HYP-AABBCC112233",
    productCode: "boardroom_brief",
    sourceRunId: "order-001",
    productArtifactId: null,
    userId: null,
    userEmail: "user@example.com",
    predictedDecisionMove: "Decision-maker takes position on primary exposure",
    expectedObservableChange: "Governance decision documented within review window",
    observationWindowDays: 60,
    reviewDate,
    successIndicators: ["Decision documented"],
    failureIndicators: ["No decision within window"],
    ownerRole: "Board Chair",
    returnBriefDueAt,
    status: "OPEN",
    outcomeRecordId: null,
    exemptionReason: null,
    createdAt: new Date("2026-06-07"),
    updatedAt: new Date("2026-06-07"),
    ...overrides,
  };
}

// ── HYPOTHESIS_TEMPLATES ──────────────────────────────────────────────────────

describe("HYPOTHESIS_TEMPLATES", () => {
  it("contains templates for all five products", () => {
    for (const code of KNOWN_PRODUCT_CODES) {
      expect(HYPOTHESIS_TEMPLATES[code]).toBeDefined();
    }
  });

  it("every template has required fields", () => {
    for (const code of KNOWN_PRODUCT_CODES) {
      const template = HYPOTHESIS_TEMPLATES[code]!;
      expect(template.predictedDecisionMove).toBeTruthy();
      expect(template.expectedObservableChange).toBeTruthy();
      expect(template.observationWindowDays).toBeGreaterThan(0);
      expect(template.successIndicators!.length).toBeGreaterThan(0);
      expect(template.failureIndicators!.length).toBeGreaterThan(0);
      expect(template.ownerRole).toBeTruthy();
    }
  });

  it("boardroom_brief observation window is 60 days", () => {
    expect(HYPOTHESIS_TEMPLATES["boardroom_brief"]!.observationWindowDays).toBe(60);
  });

  it("decision_instruments observation window is 90 days", () => {
    expect(HYPOTHESIS_TEMPLATES["decision_instruments"]!.observationWindowDays).toBe(90);
  });

  it("strategy_room observation window is 45 days", () => {
    expect(HYPOTHESIS_TEMPLATES["strategy_room"]!.observationWindowDays).toBe(45);
  });

  it("retainer_oversight observation window is 35 days", () => {
    expect(HYPOTHESIS_TEMPLATES["retainer_oversight"]!.observationWindowDays).toBe(35);
  });
});

// ── createOutcomeHypothesis ───────────────────────────────────────────────────

describe("createOutcomeHypothesis", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an OPEN hypothesis with correct fields", async () => {
    const dbRecord = makeDbHypothesis();
    mockOutcomeHypothesis.create.mockResolvedValue(dbRecord);

    const result = await createOutcomeHypothesis({
      productCode: "boardroom_brief",
      sourceRunId: "order-001",
      userEmail: "user@example.com",
      predictedDecisionMove: "Decision-maker takes position on primary exposure",
      expectedObservableChange: "Governance decision documented within review window",
      observationWindowDays: 60,
    });

    expect(result.status).toBe("OPEN");
    expect(result.productCode).toBe("boardroom_brief");
    expect(result.hypothesisId).toMatch(/^HYP-/);
  });

  it("generates a HYP- prefixed hypothesisId", async () => {
    const dbRecord = makeDbHypothesis();
    mockOutcomeHypothesis.create.mockResolvedValue(dbRecord);

    await createOutcomeHypothesis({
      productCode: "decision_instruments",
      predictedDecisionMove: "Address governance gap",
      expectedObservableChange: "Observable change in decision process",
    });

    const createCall = mockOutcomeHypothesis.create.mock.calls[0][0].data;
    expect(createCall.hypothesisId).toMatch(/^HYP-[A-F0-9]{12}$/);
  });

  it("calculates reviewDate as now + observationWindowDays", async () => {
    const dbRecord = makeDbHypothesis();
    mockOutcomeHypothesis.create.mockResolvedValue(dbRecord);

    const before = Date.now();
    await createOutcomeHypothesis({
      productCode: "boardroom_brief",
      predictedDecisionMove: "Take position",
      expectedObservableChange: "Observable change",
      observationWindowDays: 60,
    });
    const after = Date.now();

    const createCall = mockOutcomeHypothesis.create.mock.calls[0][0].data;
    const reviewDate = createCall.reviewDate as Date;
    const expectedMin = before + 60 * 24 * 60 * 60 * 1000;
    const expectedMax = after + 60 * 24 * 60 * 60 * 1000;

    expect(reviewDate.getTime()).toBeGreaterThanOrEqual(expectedMin - 1000);
    expect(reviewDate.getTime()).toBeLessThanOrEqual(expectedMax + 1000);
  });

  it("sets returnBriefDueAt to reviewDate + 7 days", async () => {
    const dbRecord = makeDbHypothesis();
    mockOutcomeHypothesis.create.mockResolvedValue(dbRecord);

    await createOutcomeHypothesis({
      productCode: "boardroom_brief",
      predictedDecisionMove: "Take position",
      expectedObservableChange: "Observable change",
      observationWindowDays: 60,
    });

    const createCall = mockOutcomeHypothesis.create.mock.calls[0][0].data;
    const reviewDate = createCall.reviewDate as Date;
    const returnBriefDueAt = createCall.returnBriefDueAt as Date;
    const diffDays =
      (returnBriefDueAt.getTime() - reviewDate.getTime()) /
      (1000 * 60 * 60 * 24);

    expect(Math.round(diffDays)).toBe(7);
  });

  it("defaults observationWindowDays to 90 when not provided", async () => {
    mockOutcomeHypothesis.create.mockResolvedValue(makeDbHypothesis({ observationWindowDays: 90 }));

    await createOutcomeHypothesis({
      productCode: "decision_instruments",
      predictedDecisionMove: "Take position",
      expectedObservableChange: "Observable change",
    });

    const createCall = mockOutcomeHypothesis.create.mock.calls[0][0].data;
    expect(createCall.observationWindowDays).toBe(90);
  });
});

// ── exemptFromHypothesis ──────────────────────────────────────────────────────

describe("exemptFromHypothesis", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status EXEMPTED with reason", async () => {
    mockOutcomeHypothesis.update.mockResolvedValue(
      makeDbHypothesis({ status: "EXEMPTED", exemptionReason: "Internal review only" }),
    );

    const result = await exemptFromHypothesis("HYP-AABBCC112233", "Internal review only");

    expect(result.status).toBe("EXEMPTED");
    const updateCall = mockOutcomeHypothesis.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe("EXEMPTED");
    expect(updateCall.data.exemptionReason).toBe("Internal review only");
  });
});

// ── requestReturnBrief ────────────────────────────────────────────────────────

describe("requestReturnBrief", () => {
  beforeEach(() => vi.clearAllMocks());

  it("transitions status to RETURN_BRIEF_REQUESTED", async () => {
    mockOutcomeHypothesis.update.mockResolvedValue(
      makeDbHypothesis({ status: "RETURN_BRIEF_REQUESTED" }),
    );

    const result = await requestReturnBrief("HYP-AABBCC112233");

    expect(result.status).toBe("RETURN_BRIEF_REQUESTED");
    const updateCall = mockOutcomeHypothesis.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe("RETURN_BRIEF_REQUESTED");
  });
});

// ── closeHypothesis ───────────────────────────────────────────────────────────

describe("closeHypothesis", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status CLOSED and links outcomeRecordId", async () => {
    mockOutcomeHypothesis.update.mockResolvedValue(
      makeDbHypothesis({ status: "CLOSED", outcomeRecordId: "outcome-001" }),
    );

    const result = await closeHypothesis("HYP-AABBCC112233", "outcome-001");

    expect(result.status).toBe("CLOSED");
    expect(result.outcomeRecordId).toBe("outcome-001");

    const updateCall = mockOutcomeHypothesis.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe("CLOSED");
    expect(updateCall.data.outcomeRecordId).toBe("outcome-001");
  });
});

// ── getOverdueHypotheses ──────────────────────────────────────────────────────

describe("getOverdueHypotheses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries for OPEN hypotheses where reviewDate is in the past", async () => {
    const overdue = [
      makeDbHypothesis({ reviewDate: new Date("2026-04-01") }),
      makeDbHypothesis({ id: "db-id-002", reviewDate: new Date("2026-05-01") }),
    ];
    mockOutcomeHypothesis.findMany.mockResolvedValue(overdue);

    const result = await getOverdueHypotheses();

    expect(result).toHaveLength(2);
    const queryArg = mockOutcomeHypothesis.findMany.mock.calls[0][0];
    expect(queryArg.where.status).toBe("OPEN");
    expect(queryArg.where.reviewDate.lte).toBeTruthy();
    // lte should be ≤ now
    expect((queryArg.where.reviewDate.lte as Date).getTime()).toBeLessThanOrEqual(
      Date.now() + 100,
    );
  });

  it("returns empty array when no overdue hypotheses", async () => {
    mockOutcomeHypothesis.findMany.mockResolvedValue([]);
    const result = await getOverdueHypotheses();
    expect(result).toHaveLength(0);
  });
});

// ── getUpcomingHypotheses ─────────────────────────────────────────────────────

describe("getUpcomingHypotheses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries for OPEN hypotheses within the next N days", async () => {
    mockOutcomeHypothesis.findMany.mockResolvedValue([
      makeDbHypothesis({ reviewDate: new Date(Date.now() + 5 * 86400000) }),
    ]);

    const result = await getUpcomingHypotheses("user@example.com", 14);

    expect(result).toHaveLength(1);
    const queryArg = mockOutcomeHypothesis.findMany.mock.calls[0][0];
    expect(queryArg.where.userEmail).toBe("user@example.com");
    expect(queryArg.where.status).toBe("OPEN");
    expect(queryArg.where.reviewDate.lte).toBeTruthy();
  });

  it("defaults to 14 days when withinDays not provided", async () => {
    mockOutcomeHypothesis.findMany.mockResolvedValue([]);

    await getUpcomingHypotheses("user@example.com");

    const queryArg = mockOutcomeHypothesis.findMany.mock.calls[0][0];
    const cutoff = queryArg.where.reviewDate.lte as Date;
    const diffDays = (cutoff.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(Math.round(diffDays)).toBe(14);
  });
});

// ── getHypothesisSummaryForUser ───────────────────────────────────────────────

describe("getHypothesisSummaryForUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("counts statuses correctly", async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 86400000);
    const future = new Date(now.getTime() + 86400000 * 30);

    mockOutcomeHypothesis.findMany.mockResolvedValue([
      { hypothesisId: "HYP-001", status: "OPEN", reviewDate: future },
      { hypothesisId: "HYP-002", status: "OPEN", reviewDate: past }, // overdue
      { hypothesisId: "HYP-003", status: "CLOSED", reviewDate: past },
      { hypothesisId: "HYP-004", status: "RETURN_BRIEF_REQUESTED", reviewDate: past },
      { hypothesisId: "HYP-005", status: "EXEMPTED", reviewDate: future },
    ]);

    const summary = await getHypothesisSummaryForUser("user@example.com");

    expect(summary.total).toBe(5);
    expect(summary.open).toBe(2);
    expect(summary.closed).toBe(1);
    expect(summary.returnBriefRequested).toBe(1);
    expect(summary.exempted).toBe(1);
    expect(summary.overdue).toBe(1);
    expect(summary.overdueIds).toContain("HYP-002");
  });

  it("returns zero counts for user with no hypotheses", async () => {
    mockOutcomeHypothesis.findMany.mockResolvedValue([]);

    const summary = await getHypothesisSummaryForUser("new@example.com");

    expect(summary.total).toBe(0);
    expect(summary.open).toBe(0);
    expect(summary.overdue).toBe(0);
    expect(summary.overdueIds).toHaveLength(0);
  });
});
