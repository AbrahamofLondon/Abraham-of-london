/**
 * tests/intelligence/gmi-governance-events.test.ts
 *
 * Tests for GMI release governance event wiring.
 * Verifies that GMI release events emit standard GovernanceEvents.
 */

import { describe, it, expect } from "vitest";
import { createGovernanceEvent, emitGovernanceEvent } from "@/lib/platform/governance-event-bus";

// ─── GMI lifecycle events ────────────────────────────────────────────────────

describe("GMI release governance events", () => {
  it("GMI_RELEASE_DRAFTED emits with GmiRelease canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "GMI_RELEASE_DRAFTED",
      sourceSurface: "gmi",
      canonicalRecordType: "GmiRelease",
    });
    expect(event.canonicalRecordType).toBe("GmiRelease");
  });

  it("GMI_PRIOR_CALLS_REVIEWED emits with GmiRelease canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "GMI_PRIOR_CALLS_REVIEWED",
      sourceSurface: "gmi",
      canonicalRecordType: "GmiRelease",
    });
    expect(event.canonicalRecordType).toBe("GmiRelease");
  });

  it("GMI_QUALITY_GATE_RUN emits with GmiRelease canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "GMI_QUALITY_GATE_RUN",
      sourceSurface: "gmi",
      canonicalRecordType: "GmiRelease",
    });
    expect(event.canonicalRecordType).toBe("GmiRelease");
  });

  it("GMI_RELEASE_APPROVED emits with GmiRelease canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "GMI_RELEASE_APPROVED",
      sourceSurface: "gmi",
      canonicalRecordType: "GmiRelease",
    });
    expect(event.canonicalRecordType).toBe("GmiRelease");
  });

  it("GMI_RELEASE_PUBLISHED emits with GmiRelease canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "GMI_RELEASE_PUBLISHED",
      sourceSurface: "gmi",
      canonicalRecordType: "GmiRelease",
    });
    expect(event.canonicalRecordType).toBe("GmiRelease");
  });

  it("GMI_CALL_CARRIED_FORWARD emits with GmiRelease canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "GMI_CALL_CARRIED_FORWARD",
      sourceSurface: "gmi",
      canonicalRecordType: "GmiRelease",
    });
    expect(event.canonicalRecordType).toBe("GmiRelease");
  });
});

// ─── GMI event emission ──────────────────────────────────────────────────────

describe("GMI event emission", () => {
  it("GMI_QUALITY_GATE_RUN emits successfully", async () => {
    const event = createGovernanceEvent({
      eventType: "GMI_QUALITY_GATE_RUN",
      sourceSurface: "gmi",
      canonicalRecordType: "GmiRelease",
      severity: "HIGH",
      payload: { gatePassed: true, signalCount: 12 },
    });
    const result = await emitGovernanceEvent(event);
    expect(result.ok).toBe(true);
    expect(result.status).toBe("RECORDED");
  });

  it("GMI_RELEASE_PUBLISHED emits successfully", async () => {
    const event = createGovernanceEvent({
      eventType: "GMI_RELEASE_PUBLISHED",
      sourceSurface: "gmi",
      canonicalRecordType: "GmiRelease",
    });
    const result = await emitGovernanceEvent(event);
    expect(result.ok).toBe(true);
  });
});

// ─── Canonical phrasing preservation ─────────────────────────────────────────

describe("GMI canonical phrasing", () => {
  it("GMI_PRIOR_CALLS_REVIEWED description preserves canonical phrasing", async () => {
    const mod = await import("@/lib/platform/governance-event-types");
    const eventDef = mod.getEventType("GMI_PRIOR_CALLS_REVIEWED");
    expect(eventDef).toBeDefined();
    expect(eventDef!.description).toContain("previous quarter");
  });

  it("GMI events do not claim prediction certainty", async () => {
    const mod = await import("@/lib/platform/governance-event-types");
    const gmiEvents = mod.GOVERNANCE_EVENT_TYPES.filter((e: { sourceSurface: string }) => e.sourceSurface === "gmi");
    for (const event of gmiEvents) {
      expect(event.description.toLowerCase()).not.toMatch(/predict|forecast|certain/i);
    }
  });
});
