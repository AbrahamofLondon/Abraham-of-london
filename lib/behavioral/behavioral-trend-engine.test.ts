import { describe, expect, it } from "vitest";
import { buildBehavioralTrendSummaryFromSnapshots } from "./behavioral-trend-engine";
import type { BehavioralSignalSnapshotRecord } from "./behavioral-signal-snapshot-contract";

function makeSnap(
  signalKey: string,
  signalValue: number,
  generatedAt: string,
  evidencePosture = "integrated",
): BehavioralSignalSnapshotRecord {
  return {
    id: `snap_${signalKey}_${generatedAt}`,
    userId: "user_1",
    source: "calendar",
    signalKey,
    signalValue,
    generatedAt,
    evidencePosture,
    organisationId: null,
    accountId: null,
    sourceLabel: null,
    confidence: null,
    evidenceWindowStart: null,
    evidenceWindowEnd: null,
    integrationConnectedAt: null,
    rawCountBasis: null,
    metadata: null,
  };
}

// Window definitions used across most tests
const CURRENT_START = "2026-04-14T00:00:00.000Z";
const CURRENT_END = "2026-05-13T23:59:59.000Z";
const PREV_START = "2026-03-15T00:00:00.000Z";
// previous window is [PREV_START, CURRENT_START)

describe("behavioral trend engine", () => {
  it("returns null when no snapshots are provided", () => {
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      [],
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    expect(result).toBeNull();
  });

  it("returns null when all snapshots fall outside both windows", () => {
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      [makeSnap("meetingCompletion", 0.8, "2026-01-01T00:00:00.000Z")],
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    expect(result).toBeNull();
  });

  it("detects IMPROVING direction when meetingCompletion increases by >= 0.10", () => {
    const snapshots = [
      makeSnap("meetingCompletion", 0.65, "2026-04-01T00:00:00.000Z"),
      makeSnap("meetingCompletion", 0.80, "2026-05-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    expect(result).not.toBeNull();
    const metric = result!.metrics.find((m) => m.signalKey === "meetingCompletion");
    expect(metric?.direction).toBe("IMPROVING");
    expect(metric?.delta).toBeCloseTo(0.15, 5);
    expect(result!.overallDirection).toBe("IMPROVING");
    expect(result!.hasDeterioration).toBe(false);
  });

  it("detects DETERIORATING direction when meetingCompletion drops by >= 0.10", () => {
    const snapshots = [
      makeSnap("meetingCompletion", 0.85, "2026-04-01T00:00:00.000Z"),
      makeSnap("meetingCompletion", 0.70, "2026-05-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    expect(result).not.toBeNull();
    const metric = result!.metrics.find((m) => m.signalKey === "meetingCompletion");
    expect(metric?.direction).toBe("DETERIORATING");
    expect(result!.overallDirection).toBe("DETERIORATING");
    expect(result!.hasDeterioration).toBe(true);
  });

  it("returns STABLE when delta is below the 0.10 threshold", () => {
    const snapshots = [
      makeSnap("meetingCompletion", 0.80, "2026-04-01T00:00:00.000Z"),
      makeSnap("meetingCompletion", 0.85, "2026-05-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    expect(result).not.toBeNull();
    const metric = result!.metrics.find((m) => m.signalKey === "meetingCompletion");
    expect(metric?.direction).toBe("STABLE");
    expect(result!.overallDirection).toBe("STABLE");
  });

  it("inverts direction for meetingCancellationRate — higher cancellation is DETERIORATING", () => {
    const snapshots = [
      makeSnap("meetingCancellationRate", 0.10, "2026-04-01T00:00:00.000Z"),
      makeSnap("meetingCancellationRate", 0.30, "2026-05-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    const metric = result!.metrics.find((m) => m.signalKey === "meetingCancellationRate");
    expect(metric?.direction).toBe("DETERIORATING");
    expect(result!.hasDeterioration).toBe(true);
  });

  it("inverts direction for meetingCancellationRate — lower cancellation is IMPROVING", () => {
    const snapshots = [
      makeSnap("meetingCancellationRate", 0.40, "2026-04-01T00:00:00.000Z"),
      makeSnap("meetingCancellationRate", 0.15, "2026-05-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    const metric = result!.metrics.find((m) => m.signalKey === "meetingCancellationRate");
    expect(metric?.direction).toBe("IMPROVING");
  });

  it("returns INSUFFICIENT_EVIDENCE when only current window has data", () => {
    const snapshots = [
      makeSnap("meetingCompletion", 0.80, "2026-05-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    expect(result).not.toBeNull();
    const metric = result!.metrics.find((m) => m.signalKey === "meetingCompletion");
    expect(metric?.direction).toBe("INSUFFICIENT_EVIDENCE");
    expect(metric?.previousValue).toBeNull();
    expect(metric?.currentValue).toBe(0.80);
    expect(result!.overallDirection).toBe("INSUFFICIENT_EVIDENCE");
    expect(result!.insufficientDataKeys).toContain("meetingCompletion");
  });

  it("returns INSUFFICIENT_EVIDENCE when only previous window has data", () => {
    const snapshots = [
      makeSnap("meetingCompletion", 0.80, "2026-04-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    const metric = result!.metrics.find((m) => m.signalKey === "meetingCompletion");
    expect(metric?.direction).toBe("INSUFFICIENT_EVIDENCE");
    expect(metric?.currentValue).toBeNull();
    expect(metric?.previousValue).toBe(0.80);
  });

  it("picks the most recent value when multiple snapshots exist in a window", () => {
    // CURRENT_START = 2026-04-14, so 2026-04-15 is inside the CURRENT window
    const snapshots = [
      makeSnap("meetingCompletion", 0.60, "2026-04-15T00:00:00.000Z"),
      makeSnap("meetingCompletion", 0.65, "2026-04-01T00:00:00.000Z"),
      makeSnap("meetingCompletion", 0.90, "2026-05-10T00:00:00.000Z"),
      makeSnap("meetingCompletion", 0.88, "2026-05-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    const metric = result!.metrics.find((m) => m.signalKey === "meetingCompletion");
    // current window [Apr-14, May-13]: picks 2026-05-10 (most recent of 0.60, 0.90, 0.88) = 0.90
    // previous window [Mar-15, Apr-14): only 2026-04-01 = 0.65
    expect(metric?.currentValue).toBe(0.90);
    expect(metric?.previousValue).toBe(0.65);
    expect(metric?.direction).toBe("IMPROVING");
  });

  it("handles multiple signal keys and sets overallDirection to DETERIORATING if any deteriorate", () => {
    const snapshots = [
      makeSnap("meetingCompletion", 0.75, "2026-04-01T00:00:00.000Z"),
      makeSnap("meetingCompletion", 0.90, "2026-05-01T00:00:00.000Z"),
      makeSnap("meetingAttendanceRate", 0.85, "2026-04-01T00:00:00.000Z"),
      makeSnap("meetingAttendanceRate", 0.65, "2026-05-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    expect(result!.overallDirection).toBe("DETERIORATING");
    expect(result!.hasDeterioration).toBe(true);
    expect(result!.metrics).toHaveLength(2);
    expect(
      result!.metrics.find((m) => m.signalKey === "meetingCompletion")?.direction,
    ).toBe("IMPROVING");
    expect(
      result!.metrics.find((m) => m.signalKey === "meetingAttendanceRate")?.direction,
    ).toBe("DETERIORATING");
  });

  it("populates evidencePosture from snapshot records", () => {
    const snapshots = [
      makeSnap("meetingCompletion", 0.60, "2026-04-01T00:00:00.000Z", "persisted"),
      makeSnap("meetingCompletion", 0.80, "2026-05-01T00:00:00.000Z", "integrated"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    const metric = result!.metrics.find((m) => m.signalKey === "meetingCompletion");
    expect(metric?.evidencePosture).toBe("mixed");
  });

  it("explanation text describes the movement direction and values", () => {
    const snapshots = [
      makeSnap("meetingCompletion", 0.60, "2026-04-01T00:00:00.000Z"),
      makeSnap("meetingCompletion", 0.80, "2026-05-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    const metric = result!.metrics.find((m) => m.signalKey === "meetingCompletion");
    expect(metric?.explanation).toMatch(/improved/i);
    expect(metric?.explanation).toMatch(/0\.60/);
    expect(metric?.explanation).toMatch(/0\.80/);
  });

  it("recurringMeetingStability — increase is IMPROVING (rule 8)", () => {
    const snapshots = [
      makeSnap("recurringMeetingStability", 0.55, "2026-04-01T00:00:00.000Z"),
      makeSnap("recurringMeetingStability", 0.80, "2026-05-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    const metric = result!.metrics.find((m) => m.signalKey === "recurringMeetingStability");
    expect(metric?.direction).toBe("IMPROVING");
    expect(metric?.delta).toBeCloseTo(0.25, 5);
  });

  it("recurringMeetingStability — decrease is DETERIORATING (rule 8)", () => {
    const snapshots = [
      makeSnap("recurringMeetingStability", 0.85, "2026-04-01T00:00:00.000Z"),
      makeSnap("recurringMeetingStability", 0.60, "2026-05-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    const metric = result!.metrics.find((m) => m.signalKey === "recurringMeetingStability");
    expect(metric?.direction).toBe("DETERIORATING");
  });

  it("slackResponsiveness — higher response time is DETERIORATING (inverted scale)", () => {
    // slackResponsiveness is measured in hours; more hours = worse
    const snapshots = [
      makeSnap("slackResponsiveness", 2, "2026-04-01T00:00:00.000Z"),
      makeSnap("slackResponsiveness", 6, "2026-05-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "slack",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    const metric = result!.metrics.find((m) => m.signalKey === "slackResponsiveness");
    expect(metric?.direction).toBe("DETERIORATING");
  });

  it("conflicting directions across metrics produce conservative DETERIORATING overall (rule 10)", () => {
    const snapshots = [
      makeSnap("meetingAttendanceRate", 0.60, "2026-04-01T00:00:00.000Z"),
      makeSnap("meetingAttendanceRate", 0.85, "2026-05-01T00:00:00.000Z"),
      makeSnap("recurringMeetingStability", 0.90, "2026-04-01T00:00:00.000Z"),
      makeSnap("recurringMeetingStability", 0.65, "2026-05-01T00:00:00.000Z"),
    ];
    const result = buildBehavioralTrendSummaryFromSnapshots(
      "user_1",
      "calendar",
      snapshots,
      CURRENT_START,
      CURRENT_END,
      PREV_START,
    );
    expect(
      result!.metrics.find((m) => m.signalKey === "meetingAttendanceRate")?.direction,
    ).toBe("IMPROVING");
    expect(
      result!.metrics.find((m) => m.signalKey === "recurringMeetingStability")?.direction,
    ).toBe("DETERIORATING");
    // Conservative: one deteriorating metric overrides overall
    expect(result!.overallDirection).toBe("DETERIORATING");
    expect(result!.hasDeterioration).toBe(true);
  });
});
