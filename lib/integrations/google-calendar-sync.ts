/**
 * lib/integrations/google-calendar-sync.ts
 * Fetches calendar events via Google Calendar API v3 and extracts
 * behavioral signals (meeting completion, response patterns, etc.)
 * for the Pattern-Breaker Contract verification system.
 */

import { getAccessToken, touchIntegrationSync, expireIntegration } from "./token-store";
import type { BehavioralDataSource } from "@/lib/alignment/enhanced-types";

export interface CalendarEvent {
  id: string;
  summary: string;
  status: "confirmed" | "tentative" | "cancelled";
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string; responseStatus: string; self?: boolean }>;
  created: string;
  updated: string;
  organizer?: { email: string; self?: boolean };
  recurringEventId?: string;
}

export interface CalendarSyncResult {
  success: boolean;
  signals: BehavioralDataSource["signals"];
  eventCount: number;
  completedCount: number;
  cancelledCount: number;
  syncTimestamp: string;
  error?: string;
}

/**
 * Fetch calendar events for a user and extract behavioral signals.
 * Looks back `daysBack` days from today.
 */
export async function syncGoogleCalendar(
  userId: string,
  daysBack = 30,
): Promise<CalendarSyncResult> {
  const token = await getAccessToken(userId, "google");
  if (!token) {
    return {
      success: false,
      signals: {},
      eventCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      syncTimestamp: new Date().toISOString(),
      error: "No active Google Calendar connection. Reconnect via Settings > Integrations.",
    };
  }

  const timeMin = new Date(Date.now() - daysBack * 86400000).toISOString();
  const timeMax = new Date().toISOString();

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      }),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        await expireIntegration(userId, "google");
        return {
          success: false,
          signals: {},
          eventCount: 0,
          completedCount: 0,
          cancelledCount: 0,
          syncTimestamp: new Date().toISOString(),
          error: "Google token expired. Please reconnect.",
        };
      }
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    const events: CalendarEvent[] = data.items || [];

    // Extract behavioral signals
    const signals = extractCalendarSignals(events);

    // Update last sync timestamp
    await touchIntegrationSync(userId, "google");

    const completedCount = events.filter((e) => e.status === "confirmed").length;
    const cancelledCount = events.filter((e) => e.status === "cancelled").length;

    return {
      success: true,
      signals,
      eventCount: events.length,
      completedCount,
      cancelledCount,
      syncTimestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      signals: {},
      eventCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      syncTimestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown Calendar sync error",
    };
  }
}

/**
 * Extract behavioral signals from calendar events.
 * Used by the Pattern-Breaker Contract verification system.
 */
function extractCalendarSignals(events: CalendarEvent[]): BehavioralDataSource["signals"] {
  if (events.length === 0) return {};

  const totalEvents = events.length;
  const confirmedEvents = events.filter((e) => e.status === "confirmed");
  const cancelledEvents = events.filter((e) => e.status === "cancelled");

  // Meeting completion rate: confirmed / total
  const meetingCompletion = totalEvents > 0
    ? Math.round((confirmedEvents.length / totalEvents) * 100) / 100
    : 0;

  // Attendance rate from self-attendee status
  const eventsWithSelf = confirmedEvents.filter(
    (e) => e.attendees?.some((a) => a.self),
  );
  const acceptedEvents = eventsWithSelf.filter((e) =>
    e.attendees?.some((a) => a.self && a.responseStatus === "accepted"),
  );
  const attendanceRate = eventsWithSelf.length > 0
    ? Math.round((acceptedEvents.length / eventsWithSelf.length) * 100) / 100
    : undefined;

  // Cancellation rate
  const cancellationRate = totalEvents > 0
    ? Math.round((cancelledEvents.length / totalEvents) * 100) / 100
    : 0;

  // Recurring meeting stability (meetings that repeat)
  const recurringEvents = events.filter((e) => e.recurringEventId);
  const recurringCompletionRate = recurringEvents.length > 0
    ? Math.round(
        (recurringEvents.filter((e) => e.status === "confirmed").length /
          recurringEvents.length) *
          100,
      ) / 100
    : undefined;

  return {
    meetingCompletion,
    ...(attendanceRate !== undefined ? { emailResponsiveness: attendanceRate } : {}),
  };
}

/**
 * Build a BehavioralDataSource from the latest calendar sync.
 * Used to feed into the verifyWithBehavioralData function.
 */
export async function buildCalendarDataSource(
  userId: string,
): Promise<BehavioralDataSource | null> {
  const result = await syncGoogleCalendar(userId);

  if (!result.success) return null;

  return {
    type: "calendar",
    connectionId: `google_calendar_${userId}`,
    connectedAt: new Date().toISOString(),
    lastSyncAt: result.syncTimestamp,
    status: "active",
    signals: result.signals,
  };
}
