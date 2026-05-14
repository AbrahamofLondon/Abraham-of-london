import { describe, it, expect } from "vitest";
import { classifyCalendarLane, buildCadenceCalendar } from "./retained-cadence-calendar";
import type { RetainedCadenceTimelineItem } from "@/lib/admin/retained-cadence-timeline";

const NOW = new Date("2025-06-01T12:00:00Z");

function item(
  overrides: Partial<RetainedCadenceTimelineItem> & { status: RetainedCadenceTimelineItem["status"] },
): RetainedCadenceTimelineItem {
  const { status, severity, daysOffset, cadenceState, dueAt, completedAt, ...rest } = overrides;
  return {
    id: "cycle_test",
    label: "Test Org",
    status,
    severity: severity ?? "LOW",
    daysOffset: daysOffset ?? null,
    cadenceState: cadenceState ?? "SCHEDULED",
    dueAt: dueAt ?? null,
    completedAt: completedAt ?? null,
    accountId: null,
    organisationId: null,
    ...rest,
  };
}

// ─── classifyCalendarLane ────────────────────────────────────────────────────

describe("classifyCalendarLane — OVERDUE", () => {
  it("OVERDUE status → OVERDUE lane", () => {
    expect(classifyCalendarLane(item({ status: "OVERDUE", daysOffset: -5 }), NOW)).toBe("OVERDUE");
  });

  it("ESCALATED status → OVERDUE lane", () => {
    expect(classifyCalendarLane(item({ status: "ESCALATED", daysOffset: null }), NOW)).toBe("OVERDUE");
  });

  it("DUE status with negative offset → OVERDUE lane", () => {
    expect(classifyCalendarLane(item({ status: "DUE", daysOffset: -1 }), NOW)).toBe("OVERDUE");
  });
});

describe("classifyCalendarLane — THIS_WEEK", () => {
  it("daysOffset 0 → THIS_WEEK", () => {
    expect(classifyCalendarLane(item({ status: "DUE", daysOffset: 0 }), NOW)).toBe("THIS_WEEK");
  });

  it("daysOffset 3 → THIS_WEEK", () => {
    expect(classifyCalendarLane(item({ status: "UPCOMING", daysOffset: 3 }), NOW)).toBe("THIS_WEEK");
  });

  it("daysOffset 6 → THIS_WEEK", () => {
    expect(classifyCalendarLane(item({ status: "UPCOMING", daysOffset: 6 }), NOW)).toBe("THIS_WEEK");
  });
});

describe("classifyCalendarLane — NEXT_WEEK", () => {
  it("daysOffset 7 → NEXT_WEEK", () => {
    expect(classifyCalendarLane(item({ status: "UPCOMING", daysOffset: 7 }), NOW)).toBe("NEXT_WEEK");
  });

  it("daysOffset 13 → NEXT_WEEK", () => {
    expect(classifyCalendarLane(item({ status: "UPCOMING", daysOffset: 13 }), NOW)).toBe("NEXT_WEEK");
  });
});

describe("classifyCalendarLane — LATER", () => {
  it("daysOffset 14 → LATER", () => {
    expect(classifyCalendarLane(item({ status: "UPCOMING", daysOffset: 14 }), NOW)).toBe("LATER");
  });

  it("daysOffset 60 → LATER", () => {
    expect(classifyCalendarLane(item({ status: "UPCOMING", daysOffset: 60 }), NOW)).toBe("LATER");
  });
});

describe("classifyCalendarLane — UNSCHEDULED", () => {
  it("DUE with null daysOffset → UNSCHEDULED", () => {
    expect(classifyCalendarLane(item({ status: "DUE", daysOffset: null }), NOW)).toBe("UNSCHEDULED");
  });

  it("UPCOMING with null daysOffset → UNSCHEDULED", () => {
    expect(classifyCalendarLane(item({ status: "UPCOMING", daysOffset: null }), NOW)).toBe("UNSCHEDULED");
  });
});

describe("classifyCalendarLane — COMPLETED_RECENT", () => {
  it("COMPLETED within 14 days → COMPLETED_RECENT", () => {
    const completedAt = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(classifyCalendarLane(item({ status: "COMPLETED", completedAt }), NOW)).toBe("COMPLETED_RECENT");
  });

  it("COMPLETED exactly 14 days ago → COMPLETED_RECENT", () => {
    const completedAt = new Date(NOW.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(classifyCalendarLane(item({ status: "COMPLETED", completedAt }), NOW)).toBe("COMPLETED_RECENT");
  });

  it("COMPLETED older than 14 days → null (excluded)", () => {
    const completedAt = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(classifyCalendarLane(item({ status: "COMPLETED", completedAt }), NOW)).toBeNull();
  });

  it("COMPLETED with no completedAt → null", () => {
    expect(classifyCalendarLane(item({ status: "COMPLETED", completedAt: null }), NOW)).toBeNull();
  });
});

describe("classifyCalendarLane — excluded statuses", () => {
  it("SKIPPED → null", () => {
    expect(classifyCalendarLane(item({ status: "SKIPPED" }), NOW)).toBeNull();
  });

  it("UNKNOWN → null", () => {
    expect(classifyCalendarLane(item({ status: "UNKNOWN" }), NOW)).toBeNull();
  });
});

// ─── buildCadenceCalendar ─────────────────────────────────────────────────────

describe("buildCadenceCalendar — basic", () => {
  it("returns only populated bands", () => {
    const items = [
      item({ id: "a", status: "OVERDUE", daysOffset: -3 }),
      item({ id: "b", status: "UPCOMING", daysOffset: 4 }),
    ];
    const bands = buildCadenceCalendar(items, NOW);
    expect(bands.map((b) => b.lane)).toEqual(["OVERDUE", "THIS_WEEK"]);
  });

  it("items land in correct bands", () => {
    const items = [
      item({ id: "a", status: "OVERDUE", daysOffset: -2, severity: "CRITICAL" }),
      item({ id: "b", status: "DUE", daysOffset: 0 }),
      item({ id: "c", status: "UPCOMING", daysOffset: 10 }),
      item({ id: "d", status: "UPCOMING", daysOffset: 20 }),
      item({ id: "e", status: "DUE", daysOffset: null }),
    ];
    const bands = buildCadenceCalendar(items, NOW);
    const byLane = Object.fromEntries(bands.map((b) => [b.lane, b.items.length]));
    expect(byLane["OVERDUE"]).toBe(1);
    expect(byLane["THIS_WEEK"]).toBe(1);
    expect(byLane["NEXT_WEEK"]).toBe(1);
    expect(byLane["LATER"]).toBe(1);
    expect(byLane["UNSCHEDULED"]).toBe(1);
  });

  it("returns empty array when all items are excluded", () => {
    const items = [
      item({ status: "SKIPPED" }),
      item({ status: "UNKNOWN" }),
    ];
    expect(buildCadenceCalendar(items, NOW)).toHaveLength(0);
  });

  it("uses current time when no 'now' provided", () => {
    const bands = buildCadenceCalendar([item({ status: "OVERDUE", daysOffset: -1 })]);
    expect(bands[0]?.lane).toBe("OVERDUE");
  });

  it("band label and description are set", () => {
    const bands = buildCadenceCalendar([item({ status: "OVERDUE", daysOffset: -1 })], NOW);
    expect(bands[0]?.label).toBe("Overdue");
    expect(bands[0]?.description).toContain("immediate");
  });

  it("lane order: OVERDUE before THIS_WEEK before LATER", () => {
    const items = [
      item({ id: "a", status: "UPCOMING", daysOffset: 20 }),
      item({ id: "b", status: "DUE", daysOffset: 2 }),
      item({ id: "c", status: "OVERDUE", daysOffset: -1 }),
    ];
    const bands = buildCadenceCalendar(items, NOW);
    const lanes = bands.map((b) => b.lane);
    expect(lanes.indexOf("OVERDUE")).toBeLessThan(lanes.indexOf("THIS_WEEK"));
    expect(lanes.indexOf("THIS_WEEK")).toBeLessThan(lanes.indexOf("LATER"));
  });

  it("COMPLETED_RECENT appears last", () => {
    const completedAt = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const items = [
      item({ id: "a", status: "OVERDUE", daysOffset: -1 }),
      item({ id: "b", status: "COMPLETED", completedAt }),
    ];
    const bands = buildCadenceCalendar(items, NOW);
    const lanes = bands.map((b) => b.lane);
    expect(lanes[0]).toBe("OVERDUE");
    expect(lanes[lanes.length - 1]).toBe("COMPLETED_RECENT");
  });

  it("ESCALATED items land in OVERDUE lane", () => {
    const bands = buildCadenceCalendar(
      [item({ status: "ESCALATED", daysOffset: null })],
      NOW,
    );
    expect(bands[0]?.lane).toBe("OVERDUE");
  });
});
