import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BehavioralDataSource } from "@/lib/alignment/enhanced-types";
import type { BehavioralSignalSnapshotRecord } from "@/lib/behavioral/behavioral-signal-snapshot-contract";

const {
  buildCalendarDataSourceMock,
  buildSlackDataSourceMock,
  persistBehavioralSignalSnapshotsMock,
  loadLatestBehavioralSignalSnapshotsMock,
  hydrateBehavioralSourcesFromSnapshotsMock,
} = vi.hoisted(() => ({
  buildCalendarDataSourceMock: vi.fn(),
  buildSlackDataSourceMock: vi.fn(),
  persistBehavioralSignalSnapshotsMock: vi.fn(),
  loadLatestBehavioralSignalSnapshotsMock: vi.fn(),
  hydrateBehavioralSourcesFromSnapshotsMock: vi.fn(),
}));

vi.mock("./google-calendar-sync", () => ({
  buildCalendarDataSource: buildCalendarDataSourceMock,
}));

vi.mock("./slack-sync", () => ({
  buildSlackDataSource: buildSlackDataSourceMock,
}));

vi.mock("@/lib/behavioral/behavioral-signal-snapshot-store", () => ({
  persistBehavioralSignalSnapshots: persistBehavioralSignalSnapshotsMock,
  loadLatestBehavioralSignalSnapshots: loadLatestBehavioralSignalSnapshotsMock,
  hydrateBehavioralSourcesFromSnapshots: hydrateBehavioralSourcesFromSnapshotsMock,
}));

import { fetchUserBehavioralData } from "./index";

describe("fetchUserBehavioralData", () => {
  beforeEach(() => {
    buildCalendarDataSourceMock.mockReset();
    buildSlackDataSourceMock.mockReset();
    persistBehavioralSignalSnapshotsMock.mockReset();
    loadLatestBehavioralSignalSnapshotsMock.mockReset();
    hydrateBehavioralSourcesFromSnapshotsMock.mockReset();
  });

  it("persists snapshots after successful live fetch and returns live sources", async () => {
    const liveCalendar: BehavioralDataSource = {
      type: "calendar",
      connectionId: "google_calendar_user_1",
      connectedAt: "2026-05-01T00:00:00.000Z",
      lastSyncAt: "2026-05-13T10:00:00.000Z",
      status: "active",
      evidencePosture: "integrated",
      signals: { meetingCompletion: 0.82 },
    };

    buildCalendarDataSourceMock.mockResolvedValue(liveCalendar);
    buildSlackDataSourceMock.mockResolvedValue(null);
    persistBehavioralSignalSnapshotsMock.mockResolvedValue([]);

    const result = await fetchUserBehavioralData("user_1");

    expect(result).toEqual([liveCalendar]);
    expect(persistBehavioralSignalSnapshotsMock).toHaveBeenCalledWith({
      userId: "user_1",
      sources: [liveCalendar],
    });
    expect(loadLatestBehavioralSignalSnapshotsMock).not.toHaveBeenCalled();
  });

  it("falls back to snapshots when live fetch is unavailable", async () => {
    const snapshotRows: BehavioralSignalSnapshotRecord[] = [{
      id: "snap_1",
      userId: "user_1",
      source: "calendar",
      signalKey: "meetingCompletion",
      signalValue: 0.8,
      generatedAt: "2026-05-13T00:00:00.000Z",
    }];
    const persistedCalendar: BehavioralDataSource = {
      type: "calendar",
      connectionId: "calendar_snapshot_user_1",
      connectedAt: "2026-05-01T00:00:00.000Z",
      lastSyncAt: "2026-05-13T00:00:00.000Z",
      status: "active",
      evidencePosture: "persisted",
      metadata: { freshness: "snapshot" },
      signals: { meetingCompletion: 0.8 },
    };

    buildCalendarDataSourceMock.mockResolvedValue(null);
    buildSlackDataSourceMock.mockResolvedValue(null);
    loadLatestBehavioralSignalSnapshotsMock.mockResolvedValue(snapshotRows);
    hydrateBehavioralSourcesFromSnapshotsMock.mockReturnValue([persistedCalendar]);

    const result = await fetchUserBehavioralData("user_1");

    expect(loadLatestBehavioralSignalSnapshotsMock).toHaveBeenCalledWith({
      userId: "user_1",
      maxAgeMinutes: 1440,
    });
    expect(result).toEqual([persistedCalendar]);
    expect(result[0]?.evidencePosture).toBe("persisted");
    expect(result[0]?.metadata).toMatchObject({ freshness: "snapshot" });
  });

  it("does not fail the caller when snapshot persistence fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const liveCalendar: BehavioralDataSource = {
      type: "calendar",
      connectionId: "google_calendar_user_1",
      connectedAt: "2026-05-01T00:00:00.000Z",
      lastSyncAt: "2026-05-13T10:00:00.000Z",
      status: "active",
      evidencePosture: "integrated",
      signals: { meetingCompletion: 0.82 },
    };

    buildCalendarDataSourceMock.mockResolvedValue(liveCalendar);
    buildSlackDataSourceMock.mockResolvedValue(null);
    persistBehavioralSignalSnapshotsMock.mockRejectedValue(new Error("write failed"));

    const result = await fetchUserBehavioralData("user_1");
    await Promise.resolve();

    expect(result).toEqual([liveCalendar]);
    expect(warnSpy).toHaveBeenCalledWith(
      "[behavioral] snapshot persistence failed",
      expect.objectContaining({
        userIdPresent: true,
        sourceCount: 1,
        errorName: "Error",
      }),
    );

    warnSpy.mockRestore();
  });
});
