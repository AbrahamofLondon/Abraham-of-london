/**
 * tests/lib/intelligence/generate-gmi-digest.test.ts
 *
 * Proves: digest pulls from call ledger, uses canonical verification phrasing,
 * includes release state, and does NOT contain certainty or prediction language.
 */

import { describe, it, expect, vi } from "vitest";

// ── mocks ──────────────────────────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("@/lib/intelligence/gmi-event-store", () => ({
  getGmiEventsForReport: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/intelligence/market-intelligence-call-ledger", () => ({
  getCallsForReport: vi.fn().mockReturnValue([
    {
      id: "GMI-Q1-2026-CALL-001",
      reportId: "GMI-Q1-2026",
      callType: "STRUCTURAL_THESIS",
      statement: "Test structural thesis",
      originalConfidence: "HIGH",
      expectedReviewWindow: "Q2 2026",
      outcomeStatus: "TOO_EARLY_TO_ASSESS",
      outcomeSummary: "Needs Q2 data",
    },
  ]),
  summariseCallReview: vi.fn().mockReturnValue({
    totalCalls: 1,
    reviewed: 0,
    pending: 1,
    averageScore: null,
    confirmed: 0,
    partiallyConfirmed: 0,
    notConfirmed: 0,
    tooEarly: 1,
  }),
  getMarketLearningSignals: vi.fn().mockReturnValue([]),
  getCallsPendingReview: vi.fn().mockReturnValue([
    {
      id: "GMI-Q1-2026-CALL-001",
      reportId: "GMI-Q1-2026",
      callType: "STRUCTURAL_THESIS",
      statement: "Test structural thesis",
      originalConfidence: "HIGH",
      expectedReviewWindow: "Q2 2026",
      outcomeStatus: "TOO_EARLY_TO_ASSESS",
    },
  ]),
}));

vi.mock("@/lib/intelligence/gmi-quarterly-review-pack", () => ({
  buildGmiQuarterlyReviewPack: vi.fn(),
}));

vi.mock("@/lib/intelligence/gmi-release-state-resolver", () => ({
  resolveGmiReleaseState: vi.fn().mockReturnValue({
    reportId: "GMI-Q2-2026",
    state: "EVIDENCE_COLLECTION",
    releaseReady: false,
    blockers: ["Prior-quarter calls not reviewed"],
    qualityGate: { overallScore: 62, releaseReady: false, criticalFailures: [], blockers: [], scores: [] },
    requiredActions: [],
    nextAction: "Complete Q1 call review",
    nextEligibleTransition: null,
  }),
}));

vi.mock("@/lib/intelligence/market-intelligence-lifecycle", () => ({
  getMarketIntelligenceRecord: vi.fn().mockReturnValue({
    id: "GMI-Q2-2026",
    title: "Global Market Intelligence Q2 2026",
    replaces: "GMI-Q1-2026",
    lifecycleState: "DRAFT",
    purchasable: false,
    publicVisible: false,
  }),
}));

vi.mock("@/lib/intelligence/gmi-release-event-summary", () => ({
  buildGmiReleaseEventSummary: vi.fn().mockReturnValue({
    reportId: "GMI-Q2-2026",
    totalEvents: 0,
    lastQualityGateRun: null,
    lastReleaseBlockedReason: null,
    lastSourceVerification: null,
    lastCallReview: null,
    lastOutboundGateCheck: null,
    emptyState: "No release events recorded yet.",
  }),
}));

// ── tests ─────────────────────────────────────────────────────────────────────

import { generateGmiIntelligenceDigest } from "@/lib/intelligence/generate-gmi-digest";

describe("generateGmiIntelligenceDigest", () => {
  it("returns a digest with generatedAt timestamp", async () => {
    const digest = await generateGmiIntelligenceDigest("GMI-Q2-2026");
    expect(digest.generatedAt).toBeTruthy();
    expect(new Date(digest.generatedAt).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("includes the reportId and priorReportId", async () => {
    const digest = await generateGmiIntelligenceDigest("GMI-Q2-2026");
    expect(digest.reportId).toBe("GMI-Q2-2026");
    expect(digest.priorReportId).toBe("GMI-Q1-2026");
  });

  it("includes pending calls list from the call ledger", async () => {
    const digest = await generateGmiIntelligenceDigest("GMI-Q2-2026");
    expect(digest.pendingCallsList.length).toBeGreaterThan(0);
    expect(digest.pendingCallsList[0].callId).toBe("GMI-Q1-2026-CALL-001");
  });

  it("includes call summary with correct totals", async () => {
    const digest = await generateGmiIntelligenceDigest("GMI-Q2-2026");
    expect(digest.callSummary.totalCalls).toBe(1);
    expect(digest.callSummary.pending).toBe(1);
    expect(digest.callSummary.reviewed).toBe(0);
  });

  it("includes release status from the state resolver", async () => {
    const digest = await generateGmiIntelligenceDigest("GMI-Q2-2026");
    expect(digest.releaseStatus.state).toBe("EVIDENCE_COLLECTION");
    expect(digest.releaseStatus.releaseReady).toBe(false);
    expect(digest.releaseStatus.qualityScore).toBe(62);
  });

  it("carries the canonical verification discipline statement verbatim", async () => {
    const digest = await generateGmiIntelligenceDigest("GMI-Q2-2026");
    expect(digest.verificationDisciplineStatement).toBe(
      "Every quarterly report reviews the material calls from the previous quarter before issuing the next one. This intelligence line compounds through verification, not just publication.",
    );
  });

  it("does NOT contain prediction-certainty language", async () => {
    const digest = await generateGmiIntelligenceDigest("GMI-Q2-2026");
    const serialized = JSON.stringify(digest).toLowerCase();
    // These phrases are forbidden per brief
    expect(serialized).not.toMatch(/ai predicts/);
    expect(serialized).not.toMatch(/we predict with certainty/);
    expect(serialized).not.toMatch(/guaranteed/);
    expect(serialized).not.toMatch(/will certainly/);
  });

  it("sets reviewWindow to Q2 2026 for GMI-Q2-2026", async () => {
    const digest = await generateGmiIntelligenceDigest("GMI-Q2-2026");
    expect(digest.reviewWindow).toBe("Q2 2026");
  });
});
