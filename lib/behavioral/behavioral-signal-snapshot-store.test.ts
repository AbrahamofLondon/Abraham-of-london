import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BehavioralDataSource } from "@/lib/alignment/enhanced-types";

const { createMock, findManyMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    behavioralSignalSnapshot: {
      create: createMock,
      findMany: findManyMock,
    },
  },
}));

import {
  hydrateBehavioralSourcesFromSnapshots,
  loadLatestBehavioralSignalSnapshots,
  persistBehavioralSignalSnapshots,
} from "./behavioral-signal-snapshot-store";

describe("behavioral signal snapshot store", () => {
  beforeEach(() => {
    createMock.mockReset();
    findManyMock.mockReset();
  });

  it("persists calendar metrics as snapshots without raw provider content", async () => {
    createMock.mockImplementation(async ({ data }) => ({
      id: `snap_${data.signalKey}`,
      ...data,
      createdAt: new Date("2026-05-13T00:00:00.000Z"),
      updatedAt: new Date("2026-05-13T00:00:00.000Z"),
    }));

    const sources: BehavioralDataSource[] = [{
      type: "calendar",
      connectionId: "google_calendar_user_1",
      connectedAt: "2026-05-01T00:00:00.000Z",
      integrationConnectedAt: "2026-05-01T00:00:00.000Z",
      lastSyncAt: "2026-05-13T10:00:00.000Z",
      status: "active",
      sourceLabel: "Google Calendar Integration",
      evidencePosture: "integrated",
      evidenceWindowStart: "2026-04-13T10:00:00.000Z",
      evidenceWindowEnd: "2026-05-13T10:00:00.000Z",
      rawCountBasis: {
        eventCount: 42,
        completedCount: 30,
        windowDays: 30,
        title: "Quarterly pipeline review",
        attendees: ["private@example.com"],
      },
      metadata: {
        freshness: "live",
        provider: "google",
        generatedAt: "2026-05-13T10:00:00.000Z",
        payload: { secret: true },
        descriptions: ["Should not persist"],
      },
      signals: {
        meetingCompletion: 0.71,
        meetingAttendanceRate: 0.83,
      },
    }];

    const persisted = await persistBehavioralSignalSnapshots({
      userId: "user_1",
      sources,
    });

    expect(persisted).toHaveLength(2);
    expect(createMock).toHaveBeenCalledTimes(2);
    for (const call of createMock.mock.calls) {
      const data = call[0].data;
      expect(data.rawCountBasisJson).toEqual({
        eventCount: 42,
        completedCount: 30,
        windowDays: 30,
      });
      expect(data.metadataJson).toEqual({
        freshness: "live",
        provider: "google",
        generatedAt: "2026-05-13T10:00:00.000Z",
      });
    }
  });

  it("drops unknown metadata keys by default, including nested provider-like payload content", async () => {
    createMock.mockImplementation(async ({ data }) => ({
      id: `snap_${data.signalKey}`,
      ...data,
      createdAt: new Date("2026-05-13T00:00:00.000Z"),
      updatedAt: new Date("2026-05-13T00:00:00.000Z"),
    }));

    const sources: BehavioralDataSource[] = [{
      type: "slack",
      connectionId: "slack_user_1",
      connectedAt: "2026-05-01T00:00:00.000Z",
      lastSyncAt: "2026-05-13T10:00:00.000Z",
      status: "active",
      metadata: {
        freshness: "live",
        source: "slack",
        body: "do not keep",
        text: "do not keep",
        providerPayload: {
          messages: ["secret"],
          thread: "private thread",
        },
        generatedAt: {
          text: "nested object should be stripped because shape is unsafe",
        },
      },
      signals: {
        slackResponsiveness: 4,
      },
    }];

    await persistBehavioralSignalSnapshots({
      userId: "user_1",
      sources,
    });

    const firstCreateCall = createMock.mock.calls[0];
    expect(firstCreateCall?.[0].data.metadataJson).toEqual({
      freshness: "live",
      source: "slack",
    });
  });

  it("preserves only allowlisted metric and context fields in metadata", async () => {
    createMock.mockImplementation(async ({ data }) => ({
      id: `snap_${data.signalKey}`,
      ...data,
      createdAt: new Date("2026-05-13T00:00:00.000Z"),
      updatedAt: new Date("2026-05-13T00:00:00.000Z"),
    }));

    const sources: BehavioralDataSource[] = [{
      type: "calendar",
      connectionId: "google_calendar_user_1",
      connectedAt: "2026-05-01T00:00:00.000Z",
      lastSyncAt: "2026-05-13T10:00:00.000Z",
      status: "active",
      metadata: {
        freshness: "live",
        sourceType: "calendar",
        provider: "google",
        integrationType: "oauth",
        signalCount: 4,
        sampleSize: 42,
        windowDays: 30,
        version: "1",
        schemaVersion: "2026-05",
        unknown: "drop me",
      },
      signals: {
        meetingCompletion: 0.75,
      },
    }];

    await persistBehavioralSignalSnapshots({
      userId: "user_1",
      sources,
    });

    const firstCreateCall = createMock.mock.calls[0];
    expect(firstCreateCall?.[0].data.metadataJson).toEqual({
      freshness: "live",
      sourceType: "calendar",
      provider: "google",
      integrationType: "oauth",
      signalCount: 4,
      sampleSize: 42,
      windowDays: 30,
      version: "1",
      schemaVersion: "2026-05",
    });
  });

  it("preserves only safe count, rate, and window fields in rawCountBasis", async () => {
    createMock.mockImplementation(async ({ data }) => ({
      id: `snap_${data.signalKey}`,
      ...data,
      createdAt: new Date("2026-05-13T00:00:00.000Z"),
      updatedAt: new Date("2026-05-13T00:00:00.000Z"),
    }));

    const sources: BehavioralDataSource[] = [{
      type: "calendar",
      connectionId: "google_calendar_user_1",
      connectedAt: "2026-05-01T00:00:00.000Z",
      lastSyncAt: "2026-05-13T10:00:00.000Z",
      status: "active",
      rawCountBasis: {
        totalEvents: 42,
        confirmedEvents: 30,
        cancelledEvents: 12,
        tentativeEvents: 5,
        recurringEvents: 7,
        attendedEvents: 20,
        missedEvents: 3,
        responseWindowHours: 24,
        rate: 0.7,
        sampleSize: 42,
        windowDays: 30,
        payload: { keep: false },
        content: "drop me",
        attendees: ["drop me"],
      },
      signals: {
        meetingCompletion: 0.71,
      },
    }];

    await persistBehavioralSignalSnapshots({
      userId: "user_1",
      sources,
    });

    const firstCreateCall = createMock.mock.calls[0];
    expect(firstCreateCall?.[0].data.rawCountBasisJson).toEqual({
      totalEvents: 42,
      confirmedEvents: 30,
      cancelledEvents: 12,
      tentativeEvents: 5,
      recurringEvents: 7,
      attendedEvents: 20,
      missedEvents: 3,
      responseWindowHours: 24,
      rate: 0.7,
      sampleSize: 42,
      windowDays: 30,
    });
  });

  it("handles undefined and null signal fields safely", async () => {
    createMock.mockImplementation(async ({ data }) => ({
      id: `snap_${data.signalKey}`,
      ...data,
      createdAt: new Date("2026-05-13T00:00:00.000Z"),
      updatedAt: new Date("2026-05-13T00:00:00.000Z"),
    }));

    const sources: BehavioralDataSource[] = [{
      type: "slack",
      connectionId: "slack_user_1",
      connectedAt: "2026-05-01T00:00:00.000Z",
      lastSyncAt: "2026-05-13T10:00:00.000Z",
      status: "active",
      signals: {
        slackResponsiveness: 4,
        emailResponsiveness: undefined,
        meetingCompletion: null as unknown as number,
      },
    }];

    const persisted = await persistBehavioralSignalSnapshots({
      userId: "user_1",
      sources,
    });

    expect(persisted).toHaveLength(1);
    expect(createMock).toHaveBeenCalledTimes(1);
    const firstCreateCall = createMock.mock.calls[0];
    expect(firstCreateCall?.[0].data.signalKey).toBe("slackResponsiveness");
  });

  it("loads latest snapshots by user and normalizes records", async () => {
    findManyMock.mockResolvedValue([{
      id: "snap_1",
      userId: "user_1",
      organisationId: null,
      accountId: null,
      source: "calendar",
      sourceLabel: "Google Calendar Integration",
      evidencePosture: "integrated",
      signalKey: "meetingCompletion",
      signalValueJson: 0.8,
      confidence: null,
      evidenceWindowStart: new Date("2026-04-13T00:00:00.000Z"),
      evidenceWindowEnd: new Date("2026-05-13T00:00:00.000Z"),
      generatedAt: new Date("2026-05-13T00:00:00.000Z"),
      integrationConnectedAt: new Date("2026-05-01T00:00:00.000Z"),
      rawCountBasisJson: { eventCount: 12 },
      metadataJson: { freshness: "live" },
      createdAt: new Date("2026-05-13T00:00:00.000Z"),
      updatedAt: new Date("2026-05-13T00:00:00.000Z"),
    }]);

    const records = await loadLatestBehavioralSignalSnapshots({
      userId: "user_1",
      source: "calendar",
      signalKeys: ["meetingCompletion"],
      maxAgeMinutes: 60,
      limit: 10,
    });

    expect(findManyMock).toHaveBeenCalledTimes(1);
    expect(records).toEqual([{
      id: "snap_1",
      userId: "user_1",
      organisationId: null,
      accountId: null,
      source: "calendar",
      sourceLabel: "Google Calendar Integration",
      evidencePosture: "integrated",
      signalKey: "meetingCompletion",
      signalValue: 0.8,
      confidence: null,
      evidenceWindowStart: "2026-04-13T00:00:00.000Z",
      evidenceWindowEnd: "2026-05-13T00:00:00.000Z",
      generatedAt: "2026-05-13T00:00:00.000Z",
      integrationConnectedAt: "2026-05-01T00:00:00.000Z",
      rawCountBasis: { eventCount: 12 },
      metadata: { freshness: "live" },
    }]);
  });

  it("rehydrates snapshots as persisted behavioral sources", () => {
    const sources = hydrateBehavioralSourcesFromSnapshots("user_1", [
      {
        id: "snap_1",
        userId: "user_1",
        source: "calendar",
        sourceLabel: "Google Calendar Integration",
        evidencePosture: "integrated",
        signalKey: "meetingCompletion",
        signalValue: 0.8,
        generatedAt: "2026-05-13T00:00:00.000Z",
        evidenceWindowStart: "2026-04-13T00:00:00.000Z",
        evidenceWindowEnd: "2026-05-13T00:00:00.000Z",
        integrationConnectedAt: "2026-05-01T00:00:00.000Z",
        rawCountBasis: { eventCount: 12 },
        metadata: { freshness: "live" },
      },
    ]);

    expect(sources).toHaveLength(1);
    expect(sources[0]?.evidencePosture).toBe("persisted");
    expect(sources[0]?.metadata).toMatchObject({
      freshness: "snapshot",
      originalEvidencePosture: "integrated",
    });
    expect(sources[0]?.signals.meetingCompletion).toBe(0.8);
  });
});
