/**
 * lib/admin/retained-cadence-calendar.ts
 *
 * Week-banded calendar view for retained cadence review pressure.
 * Consumes RetainedCadenceTimelineItem (already computed by buildCadenceTimeline)
 * and re-slots items into calendar lanes without re-fetching data.
 *
 * Lanes:
 *   OVERDUE          — overdue or escalated items regardless of scheduled date
 *   THIS_WEEK        — daysOffset 0–6
 *   NEXT_WEEK        — daysOffset 7–13
 *   LATER            — daysOffset 14+
 *   UNSCHEDULED      — no due date, not terminal
 *   COMPLETED_RECENT — completed within the last 14 days (optional, shown when populated)
 */

import type { RetainedCadenceTimelineItem } from "@/lib/admin/retained-cadence-timeline";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarLane =
  | "OVERDUE"
  | "THIS_WEEK"
  | "NEXT_WEEK"
  | "LATER"
  | "UNSCHEDULED"
  | "COMPLETED_RECENT";

export type CalendarBand = {
  lane: CalendarLane;
  label: string;
  description: string;
  items: RetainedCadenceTimelineItem[];
};

// ─── Lane classification ──────────────────────────────────────────────────────

const COMPLETED_RECENT_DAYS = 14;

export function classifyCalendarLane(
  item: RetainedCadenceTimelineItem,
  now: Date,
): CalendarLane | null {
  // Overdue / escalated → always top lane
  if (item.status === "OVERDUE" || item.status === "ESCALATED") {
    return "OVERDUE";
  }

  // Terminal completions — only show if recent
  if (item.status === "COMPLETED") {
    if (!item.completedAt) return null;
    const completedMs = new Date(item.completedAt).getTime();
    const ageDays = (now.getTime() - completedMs) / (1000 * 60 * 60 * 24);
    return ageDays <= COMPLETED_RECENT_DAYS ? "COMPLETED_RECENT" : null;
  }

  // Skipped / unconfigured — not useful in calendar view
  if (item.status === "SKIPPED" || item.status === "UNKNOWN") {
    return null;
  }

  // No due date → unscheduled
  if (item.daysOffset == null) {
    return "UNSCHEDULED";
  }

  // Safety: negative offset without OVERDUE status (e.g. DUE items past date)
  if (item.daysOffset < 0) {
    return "OVERDUE";
  }

  if (item.daysOffset <= 6) return "THIS_WEEK";
  if (item.daysOffset <= 13) return "NEXT_WEEK";
  return "LATER";
}

// ─── Builder ──────────────────────────────────────────────────────────────────

const BAND_META: Record<CalendarLane, { label: string; description: string }> = {
  OVERDUE: {
    label: "Overdue",
    description: "Past due date or actively escalated — requires immediate action.",
  },
  THIS_WEEK: {
    label: "This week",
    description: "Due within the next 7 days.",
  },
  NEXT_WEEK: {
    label: "Next week",
    description: "Due 7–14 days from today.",
  },
  LATER: {
    label: "Later",
    description: "Due in more than 14 days.",
  },
  UNSCHEDULED: {
    label: "Unscheduled",
    description: "Active cycles with no due date set.",
  },
  COMPLETED_RECENT: {
    label: "Completed recently",
    description: `Cycles completed within the last ${COMPLETED_RECENT_DAYS} days.`,
  },
};

const LANE_ORDER: CalendarLane[] = [
  "OVERDUE",
  "THIS_WEEK",
  "NEXT_WEEK",
  "LATER",
  "UNSCHEDULED",
  "COMPLETED_RECENT",
];

export function buildCadenceCalendar(
  items: RetainedCadenceTimelineItem[],
  now?: Date,
): CalendarBand[] {
  const reference = now ?? new Date();

  const buckets = new Map<CalendarLane, RetainedCadenceTimelineItem[]>(
    LANE_ORDER.map((lane) => [lane, []]),
  );

  for (const item of items) {
    const lane = classifyCalendarLane(item, reference);
    if (lane !== null) {
      buckets.get(lane)!.push(item);
    }
  }

  return LANE_ORDER
    .map((lane): CalendarBand => ({
      lane,
      label: BAND_META[lane].label,
      description: BAND_META[lane].description,
      items: buckets.get(lane)!,
    }))
    .filter((band) => band.items.length > 0);
}
