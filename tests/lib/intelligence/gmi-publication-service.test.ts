/**
 * tests/lib/intelligence/gmi-publication-service.test.ts
 *
 * Acceptance tests for Brief 4: GMI Intelligence Publishing & Verification Loop.
 * Proves: quality gate records events, call review validation, carry-forward,
 * lifecycle transition blocked when not release-ready, and approved when ready.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── hoisted mocks ──────────────────────────────────────────────────────────────

const {
  mockRecordGmiReleaseEventSafe,
  mockResolveGmiReleaseState,
  mockGetCallsForReport,
} = vi.hoisted(() => ({
  mockRecordGmiReleaseEventSafe: vi.fn(),
  mockResolveGmiReleaseState: vi.fn(),
  mockGetCallsForReport: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/intelligence/gmi-release-event-recorder", () => ({
  recordGmiReleaseEventSafe: mockRecordGmiReleaseEventSafe,
}));

vi.mock("@/lib/intelligence/gmi-release-state-resolver", () => ({
  resolveGmiReleaseState: mockResolveGmiReleaseState,
}));

vi.mock("@/lib/intelligence/market-intelligence-call-ledger", () => ({
  getCallsForReport: mockGetCallsForReport,
  getCallsPendingReview: vi.fn().mockReturnValue([]),
  summariseCallReview: vi.fn().mockReturnValue({ totalCalls: 0, reviewed: 0, pending: 0, averageScore: null, confirmed: 0, partiallyConfirmed: 0, notConfirmed: 0, tooEarly: 0 }),
  GMI_Q1_2026_CALLS: [],
}));

// ── imports ───────────────────────────────────────────────────────────────────

import {
  runGmiQualityGateAndRecord,
  recordGmiCallReview,
  recordGmiCallCarryForward,
  proposeGmiLifecycleTransition,
} from "@/lib/intelligence/gmi-publication-service";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeReleaseState(overrides: Partial<{
  releaseReady: boolean;
  blockers: string[];
  overallScore: number;
}> = {}) {
  return {
    reportId: "GMI-Q2-2026",
    state: "EVIDENCE_COLLECTION",
    releaseReady: overrides.releaseReady ?? true,
    blockers: overrides.blockers ?? [],
    requiredActions: [],
    nextEligibleTransition: "RELEASE_CANDIDATE",
    nextAction: "No action required",
    qualityGate: {
      overallScore: overrides.overallScore ?? 85,
      releaseReady: overrides.releaseReady ?? true,
      criticalFailures: [],
      blockers: overrides.blockers ?? [],
      scores: [],
      warnings: [],
    },
  };
}

const SAMPLE_CALL = {
  id: "GMI-Q1-2026-CALL-001",
  reportId: "GMI-Q1-2026",
  callType: "STRUCTURAL_THESIS" as const,
  statement: "Test call statement",
  originalConfidence: "HIGH" as const,
  expectedReviewWindow: "Q2 2026",
  outcomeStatus: "TOO_EARLY_TO_ASSESS" as const,
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe("runGmiQualityGateAndRecord", () => {
  beforeEach(() => {
    mockRecordGmiReleaseEventSafe.mockReset();
    mockResolveGmiReleaseState.mockReset();
  });

  it("records a GMI_QUALITY_GATE_RUN event on success", async () => {
    mockResolveGmiReleaseState.mockReturnValue(makeReleaseState({ releaseReady: true }));
    mockRecordGmiReleaseEventSafe.mockResolvedValue({ ok: true });

    const result = await runGmiQualityGateAndRecord("GMI-Q2-2026", "ADMIN");

    expect(mockRecordGmiReleaseEventSafe).toHaveBeenCalledOnce();
    const event = mockRecordGmiReleaseEventSafe.mock.calls[0][0];
    expect(event.eventType).toBe("GMI_QUALITY_GATE_RUN");
    expect(event.reportId).toBe("GMI-Q2-2026");
    expect(event.actor).toBe("ADMIN");
    expect(result.releaseReady).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("records both QUALITY_GATE_RUN and RELEASE_BLOCKED when gate fails", async () => {
    mockResolveGmiReleaseState.mockReturnValue(
      makeReleaseState({ releaseReady: false, blockers: ["Prior-quarter calls not reviewed"] }),
    );
    mockRecordGmiReleaseEventSafe.mockResolvedValue({ ok: true });

    await runGmiQualityGateAndRecord("GMI-Q2-2026", "ADMIN");

    expect(mockRecordGmiReleaseEventSafe).toHaveBeenCalledTimes(2);
    const eventTypes = mockRecordGmiReleaseEventSafe.mock.calls.map((c) => c[0].eventType);
    expect(eventTypes).toContain("GMI_QUALITY_GATE_RUN");
    expect(eventTypes).toContain("GMI_RELEASE_BLOCKED");
  });

  it("returns releaseReady false and exposes blockers on failed gate", async () => {
    const blockers = ["Prior-quarter calls not reviewed", "Source appendix incomplete"];
    mockResolveGmiReleaseState.mockReturnValue(makeReleaseState({ releaseReady: false, blockers }));
    mockRecordGmiReleaseEventSafe.mockResolvedValue({ ok: true });

    const result = await runGmiQualityGateAndRecord("GMI-Q2-2026");

    expect(result.releaseReady).toBe(false);
    expect(result.blockers).toEqual(blockers);
  });

  it("sets overallScore from the quality gate", async () => {
    mockResolveGmiReleaseState.mockReturnValue(makeReleaseState({ overallScore: 72, releaseReady: true }));
    mockRecordGmiReleaseEventSafe.mockResolvedValue({ ok: true });

    const result = await runGmiQualityGateAndRecord("GMI-Q2-2026");

    expect(result.overallScore).toBe(72);
  });
});

describe("recordGmiCallReview", () => {
  beforeEach(() => {
    mockRecordGmiReleaseEventSafe.mockReset();
    mockGetCallsForReport.mockReset();
  });

  it("records GMI_CALL_REVIEWED when call exists in the ledger", async () => {
    mockGetCallsForReport.mockReturnValue([SAMPLE_CALL]);
    mockRecordGmiReleaseEventSafe.mockResolvedValue({ ok: true });

    const result = await recordGmiCallReview({
      reportId: "GMI-Q2-2026",
      callId: "GMI-Q1-2026-CALL-001",
      outcomeStatus: "DIRECTIONALLY_CONFIRMED",
      score: 4,
      actor: "ADMIN",
    });

    expect(result.ok).toBe(true);
    expect(mockRecordGmiReleaseEventSafe).toHaveBeenCalledOnce();
    const event = mockRecordGmiReleaseEventSafe.mock.calls[0][0];
    expect(event.eventType).toBe("GMI_CALL_REVIEWED");
    expect(event.callId).toBe("GMI-Q1-2026-CALL-001");
    expect(event.safeMetadata.outcomeStatus).toBe("DIRECTIONALLY_CONFIRMED");
    expect(event.safeMetadata.score).toBe(4);
  });

  it("returns warning and does not record when call not found", async () => {
    mockGetCallsForReport.mockReturnValue([]);
    mockRecordGmiReleaseEventSafe.mockResolvedValue({ ok: true });

    const result = await recordGmiCallReview({
      reportId: "GMI-Q2-2026",
      callId: "GMI-NONEXISTENT-CALL",
      outcomeStatus: "NOT_CONFIRMED",
      score: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.warning).toMatch(/not found/i);
    expect(mockRecordGmiReleaseEventSafe).not.toHaveBeenCalled();
  });

  it("passes null score correctly", async () => {
    mockGetCallsForReport.mockReturnValue([SAMPLE_CALL]);
    mockRecordGmiReleaseEventSafe.mockResolvedValue({ ok: true });

    await recordGmiCallReview({
      reportId: "GMI-Q2-2026",
      callId: "GMI-Q1-2026-CALL-001",
      outcomeStatus: "TOO_EARLY_TO_ASSESS",
      score: null,
    });

    const event = mockRecordGmiReleaseEventSafe.mock.calls[0][0];
    expect(event.safeMetadata.score).toBeNull();
  });
});

describe("recordGmiCallCarryForward", () => {
  beforeEach(() => {
    mockRecordGmiReleaseEventSafe.mockReset();
  });

  it("records GMI_CALL_CARRIED_FORWARD event", async () => {
    mockRecordGmiReleaseEventSafe.mockResolvedValue({ ok: true });

    await recordGmiCallCarryForward({
      reportId: "GMI-Q2-2026",
      callId: "GMI-Q1-2026-CALL-008",
      nextReviewWindow: "Q3 2026",
      actor: "ADMIN",
    });

    expect(mockRecordGmiReleaseEventSafe).toHaveBeenCalledOnce();
    const event = mockRecordGmiReleaseEventSafe.mock.calls[0][0];
    expect(event.eventType).toBe("GMI_CALL_CARRIED_FORWARD");
    expect(event.safeMetadata.nextReviewWindow).toBe("Q3 2026");
  });
});

describe("proposeGmiLifecycleTransition", () => {
  beforeEach(() => {
    mockRecordGmiReleaseEventSafe.mockReset();
    mockResolveGmiReleaseState.mockReset();
  });

  it("records GMI_LIFECYCLE_TRANSITION_PROPOSED when release is ready", async () => {
    mockResolveGmiReleaseState.mockReturnValue(makeReleaseState({ releaseReady: true }));
    mockRecordGmiReleaseEventSafe.mockResolvedValue({ ok: true });

    const result = await proposeGmiLifecycleTransition(
      "GMI-Q2-2026",
      "EVIDENCE_COLLECTION",
      "RELEASE_CANDIDATE",
      "ADMIN",
    );

    expect(result.ok).toBe(true);
    expect(mockRecordGmiReleaseEventSafe).toHaveBeenCalledOnce();
    const event = mockRecordGmiReleaseEventSafe.mock.calls[0][0];
    expect(event.eventType).toBe("GMI_LIFECYCLE_TRANSITION_PROPOSED");
    expect(event.safeMetadata.fromState).toBe("EVIDENCE_COLLECTION");
    expect(event.safeMetadata.toState).toBe("RELEASE_CANDIDATE");
  });

  it("blocks transition and records RELEASE_BLOCKED when not release-ready", async () => {
    mockResolveGmiReleaseState.mockReturnValue(
      makeReleaseState({ releaseReady: false, blockers: ["Prior-quarter calls not reviewed"] }),
    );
    mockRecordGmiReleaseEventSafe.mockResolvedValue({ ok: true });

    const result = await proposeGmiLifecycleTransition(
      "GMI-Q2-2026",
      "EVIDENCE_COLLECTION",
      "RELEASE_CANDIDATE",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.warning).toMatch(/blocked/i);
    const event = mockRecordGmiReleaseEventSafe.mock.calls[0][0];
    expect(event.eventType).toBe("GMI_RELEASE_BLOCKED");
  });
});
