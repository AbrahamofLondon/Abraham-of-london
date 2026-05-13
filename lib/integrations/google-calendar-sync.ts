/**
 * lib/integrations/google-calendar-sync.ts
 * Fetches calendar events via Google Calendar API v3 and extracts
 * behavioral signals (meeting completion, response patterns, etc.)
 * for the Pattern-Breaker Contract verification system.
 */

import { getAccessToken, touchIntegrationSync, expireIntegration, getIntegrationStatus } from "./token-store";
import { nowISO, daysAgoISO } from "@/utils/dates";
import type { BehavioralDataSource } from "@/lib/alignment/enhanced-types";

// Google Calendar API returns at most 250 events per page.
// Pagination via nextPageToken is required to retrieve all events in the date range.
// Safety cap: 20 pages × 250 events = 5,000 events maximum per sync.
const EVENTS_PER_PAGE = 250;
const MAX_PAGES = 20;

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
 * Paginates through all API pages to retrieve the full event set.
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
      syncTimestamp: nowISO(),
      error: "No active Google Calendar connection. Reconnect via Settings > Integrations.",
    };
  }

  const timeMin = daysAgoISO(daysBack);
  const timeMax = nowISO();

  try {
    const allEvents: CalendarEvent[] = [];
    let pageToken: string | undefined;
    let pagesFetched = 0;

    // Paginate through all result pages. The API caps each page at 250 events;
    // a busy calendar over 30 days will exceed this in a single request.
    do {
      const params: Record<string, string> = {
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: String(EVENTS_PER_PAGE),
      };
      if (pageToken) params.pageToken = pageToken;

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        new URLSearchParams(params),
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
            syncTimestamp: nowISO(),
            error: "Google token expired. Please reconnect.",
          };
        }
        throw new Error(`Google Calendar API error: ${response.status}`);
      }

      const data = await response.json();
      allEvents.push(...(data.items || []));
      pageToken = data.nextPageToken;
      pagesFetched++;
    } while (pageToken && pagesFetched < MAX_PAGES);

    // Extract behavioral signals
    const signals = extractCalendarSignals(allEvents);

    // Update last sync timestamp
    await touchIntegrationSync(userId, "google");

    const completedCount = allEvents.filter((e) => e.status === "confirmed").length;
    const cancelledCount = allEvents.filter((e) => e.status === "cancelled").length;

    return {
      success: true,
      signals,
      eventCount: allEvents.length,
      completedCount,
      cancelledCount,
      syncTimestamp: nowISO(),
    };
  } catch (error) {
    return {
      success: false,
      signals: {},
      eventCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      syncTimestamp: nowISO(),
      error: error instanceof Error ? error.message : "Unknown Calendar sync error",
    };
  }
}

/**
 * Extract behavioral signals from calendar events.
 * Used by the Pattern-Breaker Contract verification system.
 *
 * Tentative events (status === "tentative") represent decision ambiguity —
 * not failure. They are excluded from outcome-based denominators so they
 * do not artificially depress completion or cancellation rates.
 */
function extractCalendarSignals(events: CalendarEvent[]): BehavioralDataSource["signals"] {
  if (events.length === 0) return {};

  const confirmedEvents = events.filter((e) => e.status === "confirmed");
  const cancelledEvents = events.filter((e) => e.status === "cancelled");
  const tentativeEvents = events.filter((e) => e.status === "tentative");

  // Internal tentative analysis — not exported publicly; no field in BehavioralDataSource.signals.
  // Tentative attendance is decision instability, not misconduct.
  // These metrics inform internal signal quality but do not pollute attendance rates.
  const tentativeMeetingCount = tentativeEvents.length;
  const tentativeMeetingRate = events.length > 0
    ? Math.round((tentativeMeetingCount / events.length) * 100) / 100
    : 0;
  // Suppress unused variable warnings — values are computed for internal analysis.
  void tentativeMeetingCount;
  void tentativeMeetingRate;

  // Definite events are those with a resolved outcome: confirmed or cancelled.
  // Tentative events are still pending and must not inflate the denominator for
  // outcome-based rates, which would misrepresent actual execution performance.
  const definiteEvents = confirmedEvents.length + cancelledEvents.length;

  // Meeting completion rate: confirmed / definite (excludes pending tentatives)
  const meetingCompletion = definiteEvents > 0
    ? Math.round((confirmedEvents.length / definiteEvents) * 100) / 100
    : 0;

  // Attendance rate from self-attendee status on confirmed events only.
  // Declined and tentative self-responses are intentionally excluded from the
  // accepted denominator — only meetings the user was present for count.
  const eventsWithSelf = confirmedEvents.filter(
    (e) => e.attendees?.some((a) => a.self),
  );
  const acceptedEvents = eventsWithSelf.filter((e) =>
    e.attendees?.some((a) => a.self && a.responseStatus === "accepted"),
  );
  const attendanceRate = eventsWithSelf.length > 0
    ? Math.round((acceptedEvents.length / eventsWithSelf.length) * 100) / 100
    : undefined;

  // Cancellation rate: cancelled / definite (excludes pending tentatives)
  const cancellationRate = definiteEvents > 0
    ? Math.round((cancelledEvents.length / definiteEvents) * 100) / 100
    : 0;

  // Recurring meeting stability: confirmed recurring / all recurring
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
    ...(attendanceRate !== undefined ? { meetingAttendanceRate: attendanceRate } : {}),
    meetingCancellationRate: cancellationRate,
    ...(recurringCompletionRate !== undefined ? { recurringMeetingStability: recurringCompletionRate } : {}),
  };
}

/**
 * Build a BehavioralDataSource from the latest calendar sync.
 * Used to feed into the verifyWithBehavioralData function.
 */
export async function buildCalendarDataSource(
  userId: string,
): Promise<BehavioralDataSource | null> {
  // Fetch connection metadata before syncing so connectedAt reflects the actual
  // time the user authorised Google Calendar, not the time of this function call.
  const integrationStatus = await getIntegrationStatus(userId, "google");
  if (!integrationStatus?.connected) return null;

  const result = await syncGoogleCalendar(userId);
  if (!result.success) return null;

  return {
    type: "calendar",
    connectionId: `google_calendar_${userId}`,
    connectedAt: integrationStatus.connectedAt.toISOString(),
    lastSyncAt: result.syncTimestamp,
    status: "active",
    signals: result.signals,
  };
}
