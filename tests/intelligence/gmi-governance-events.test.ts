/**
 * tests/intelligence/gmi-governance-events.test.ts
 *
 * Tests for GMI release governance event wiring.
 * Verifies that GMI release events emit standard GovernanceEvents.
 */

import { describe, it, expect, vi } from "vitest";

const { mockAuditLog, mockGovernanceLogCreate } = vi.hoisted(() => ({
  mockAuditLog: vi.fn().mockResolvedValue(null),
  mockGovernanceLogCreate: vi.fn().mockResolvedValue({ id: "log-id" }),
}));

vi.mock("@/lib/audit/audit-logger", () => ({ auditLogger: { log: mockAuditLog } }));
vi.mock("@/lib/prisma.server", () => ({ prisma: { governanceLog: { create: mockGovernanceLogCreate } } }));

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
  it("GMI_QUALITY_GATE_RUN emits as PARTIAL (ResearchRun deferred to caller)", async () => {
    const event = createGovernanceEvent({
      eventType: "GMI_QUALITY_GATE_RUN",
      sourceSurface: "gmi",
      canonicalRecordType: "GmiRelease",
      severity: "HIGH",
      payload: { gatePassed: true, signalCount: 12 },
    });
    const result = await emitGovernanceEvent(event);
    // canCreateResearchRun=true for GMI_QUALITY_GATE_RUN; bus always SKIPs.
    expect(result.ok).toBe(false);
    expect(result.status).toBe("PARTIAL");
    expect(result.researchRunStatus).toBe("SKIPPED");
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
