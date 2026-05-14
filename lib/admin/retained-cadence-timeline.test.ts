import { describe, expect, it } from "vitest";

import {
  buildCadenceTimeline,
  groupCadenceTimeline,
} from "@/lib/admin/retained-cadence-timeline";
import type { RetainedCadenceState } from "@/lib/product/retained-cadence-contract";

const NOW = new Date("2026-05-14T12:00:00.000Z");

function item(
  overrides: {
    cycleId?: string | null;
    accountId?: string | null;
    organisationId?: string | null;
    organisationLabel?: string;
    scheduledFor?: string | null;
    completedAt?: string | null;
    cadenceState: RetainedCadenceState;
  },
) {
  return {
    cycleId: overrides.cycleId ?? `cycle_${Math.random()}`,
    accountId: overrides.accountId ?? null,
    organisationId: overrides.organisationId ?? "org_test",
    organisationLabel: overrides.organisationLabel ?? "Test Organisation",
    scheduledFor: overrides.scheduledFor ?? null,
    completedAt: overrides.completedAt ?? null,
    cadenceState: overrides.cadenceState,
  };
}

describe("buildCadenceTimeline", () => {
  it("OVERDUE cadenceState produces OVERDUE status", () => {
    const result = buildCadenceTimeline(
      [item({ cadenceState: "OVERDUE", scheduledFor: "2026-05-07T00:00:00.000Z" })],
      NOW,
    );
    expect(result[0]!.status).toBe("OVERDUE");
    expect(result[0]!.severity).toBe("CRITICAL");
  });

  it("CADENCE_BROKEN produces OVERDUE status with CRITICAL severity", () => {
    const result = buildCadenceTimeline(
      [item({ cadenceState: "CADENCE_BROKEN", scheduledFor: "2026-05-01T00:00:00.000Z" })],
      NOW,
    );
    expect(result[0]!.status).toBe("OVERDUE");
    expect(result[0]!.severity).toBe("CRITICAL");
  });

  it("DUE_SOON within current week produces DUE status", () => {
    const result = buildCadenceTimeline(
      [item({ cadenceState: "DUE_SOON", scheduledFor: "2026-05-16T00:00:00.000Z" })],
      NOW,
    );
    expect(result[0]!.status).toBe("DUE");
    expect(result[0]!.severity).toBe("HIGH");
  });

  it("REVIEW_DUE produces DUE status with HIGH severity", () => {
    const result = buildCadenceTimeline(
      [item({ cadenceState: "REVIEW_DUE", scheduledFor: "2026-05-14T00:00:00.000Z" })],
      NOW,
    );
    expect(result[0]!.status).toBe("DUE");
  });

  it("SCHEDULED with future date produces UPCOMING status", () => {
    const result = buildCadenceTimeline(
      [item({ cadenceState: "SCHEDULED", scheduledFor: "2026-06-15T00:00:00.000Z" })],
      NOW,
    );
    expect(result[0]!.status).toBe("UPCOMING");
    expect(result[0]!.severity).toBe("LOW");
  });

  it("COMPLETED state remains COMPLETED", () => {
    const result = buildCadenceTimeline(
      [item({ cadenceState: "COMPLETED", completedAt: "2026-05-01T00:00:00.000Z" })],
      NOW,
    );
    expect(result[0]!.status).toBe("COMPLETED");
    expect(result[0]!.severity).toBe("LOW");
  });

  it("REVIEW_COMPLETED is mapped to COMPLETED", () => {
    const result = buildCadenceTimeline(
      [item({ cadenceState: "REVIEW_COMPLETED", completedAt: "2026-05-10T00:00:00.000Z" })],
      NOW,
    );
    expect(result[0]!.status).toBe("COMPLETED");
  });

  it("SKIPPED_WITH_REASON produces SKIPPED status", () => {
    const result = buildCadenceTimeline(
      [item({ cadenceState: "SKIPPED_WITH_REASON" })],
      NOW,
    );
    expect(result[0]!.status).toBe("SKIPPED");
    expect(result[0]!.severity).toBe("MEDIUM");
  });

  it("ESCALATED produces ESCALATED status with CRITICAL severity", () => {
    const result = buildCadenceTimeline(
      [item({ cadenceState: "ESCALATED" })],
      NOW,
    );
    expect(result[0]!.status).toBe("ESCALATED");
    expect(result[0]!.severity).toBe("CRITICAL");
  });

  it("NOT_CONFIGURED produces UNKNOWN status", () => {
    const result = buildCadenceTimeline(
      [item({ cadenceState: "NOT_CONFIGURED", scheduledFor: null })],
      NOW,
    );
    expect(result[0]!.status).toBe("UNKNOWN");
  });

  it("missing scheduledFor on NOT_CONFIGURED produces null daysOffset", () => {
    const result = buildCadenceTimeline(
      [item({ cadenceState: "NOT_CONFIGURED", scheduledFor: null })],
      NOW,
    );
    expect(result[0]!.daysOffset).toBeNull();
    expect(result[0]!.dueAt).toBeNull();
  });

  it("daysOffset is negative for overdue items", () => {
    const result = buildCadenceTimeline(
      [item({ cadenceState: "OVERDUE", scheduledFor: "2026-05-07T12:00:00.000Z" })],
      NOW,
    );
    expect(result[0]!.daysOffset).toBe(-7);
  });

  it("daysOffset is positive for upcoming items", () => {
    const result = buildCadenceTimeline(
      [item({ cadenceState: "SCHEDULED", scheduledFor: "2026-05-21T12:00:00.000Z" })],
      NOW,
    );
    expect(result[0]!.daysOffset).toBe(7);
  });

  it("severity ordering places CRITICAL items before LOW items", () => {
    const input = [
      item({ cadenceState: "SCHEDULED", scheduledFor: "2026-06-01T00:00:00.000Z", cycleId: "upcoming" }),
      item({ cadenceState: "OVERDUE", scheduledFor: "2026-05-01T00:00:00.000Z", cycleId: "overdue" }),
      item({ cadenceState: "COMPLETED", cycleId: "completed" }),
    ];
    const result = buildCadenceTimeline(input, NOW);
    expect(result[0]!.id).toBe("overdue");
    expect(result[result.length - 1]!.status).toBe("COMPLETED");
  });

  it("within OVERDUE band, most-overdue item sorts first", () => {
    const input = [
      item({ cadenceState: "OVERDUE", scheduledFor: "2026-05-10T12:00:00.000Z", cycleId: "4days" }),
      item({ cadenceState: "OVERDUE", scheduledFor: "2026-05-01T12:00:00.000Z", cycleId: "13days" }),
    ];
    const result = buildCadenceTimeline(input, NOW);
    expect(result[0]!.id).toBe("13days");
    expect(result[1]!.id).toBe("4days");
  });
});

describe("groupCadenceTimeline", () => {
  it("groups items into correct bands", () => {
    const items = buildCadenceTimeline(
      [
        item({ cadenceState: "OVERDUE", scheduledFor: "2026-05-01T00:00:00.000Z", cycleId: "a" }),
        item({ cadenceState: "DUE_SOON", scheduledFor: "2026-05-15T00:00:00.000Z", cycleId: "b" }),
        item({ cadenceState: "SCHEDULED", scheduledFor: "2026-06-01T00:00:00.000Z", cycleId: "c" }),
        item({ cadenceState: "COMPLETED", cycleId: "d" }),
        item({ cadenceState: "NOT_CONFIGURED", scheduledFor: null, cycleId: "e" }),
      ],
      NOW,
    );
    const groups = groupCadenceTimeline(items);
    const bands = groups.map((g) => g.band);
    expect(bands).toContain("Overdue");
    expect(bands).toContain("Due now");
    expect(bands).toContain("Upcoming");
    expect(bands).toContain("Completed recently");
    expect(bands).toContain("Not configured");
  });

  it("omits empty bands", () => {
    const items = buildCadenceTimeline(
      [item({ cadenceState: "OVERDUE", scheduledFor: "2026-05-01T00:00:00.000Z" })],
      NOW,
    );
    const groups = groupCadenceTimeline(items);
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
  });
});
