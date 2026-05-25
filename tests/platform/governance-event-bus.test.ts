/**
 * tests/platform/governance-event-bus.test.ts
 *
 * Tests for the hardened governance event bus.
 * Verifies: emit, validate, route, structured results, no silent drops.
 */

import { describe, it, expect } from "vitest";
import {
  emitGovernanceEvent,
  createGovernanceEvent,
  validateGovernanceEvent,
  routeGovernanceEvent,
} from "@/lib/platform/governance-event-bus";

// ─── 1. Valid event records audit when required ──────────────────────────────

describe("emitGovernanceEvent — audit routing", () => {
  it("valid event with audit required returns RECORDED", async () => {
    const event = createGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_GENERATED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
      shouldWriteAudit: true,
    });
    const result = await emitGovernanceEvent(event);
    expect(result.ok).toBe(true);
    expect(result.status).toBe("RECORDED");
    expect(result.auditStatus).toBe("RECORDED");
  });

  it("valid event without audit returns SKIPPED audit status", async () => {
    const event = createGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_STARTED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
      shouldWriteAudit: false,
    });
    const result = await emitGovernanceEvent(event);
    expect(result.ok).toBe(true);
    expect(result.auditStatus).toBe("SKIPPED");
  });
});

// ─── 2. Lineage routing ──────────────────────────────────────────────────────

describe("emitGovernanceEvent — lineage routing", () => {
  it("valid event with lineage required returns RECORDED lineage status", async () => {
    const event = createGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_GENERATED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
      shouldWriteLineage: true,
    });
    const result = await emitGovernanceEvent(event);
    expect(result.ok).toBe(true);
    expect(result.lineageStatus).toBe("RECORDED");
  });
});

// ─── 3. Invalid event type ───────────────────────────────────────────────────

describe("emitGovernanceEvent — invalid event", () => {
  it("unknown event type returns FAILED", async () => {
    const event = createGovernanceEvent({
      eventType: "NONEXISTENT_EVENT_TYPE",
      sourceSurface: "test",
      canonicalRecordType: "ResearchRun",
    });
    const result = await emitGovernanceEvent(event);
    expect(result.ok).toBe(false);
    expect(result.status).toBe("FAILED");
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("missing required fields returns FAILED", async () => {
    const event = createGovernanceEvent({
      eventType: "",
      sourceSurface: "",
      canonicalRecordType: "ResearchRun",
    });
    const result = await emitGovernanceEvent(event);
    expect(result.ok).toBe(false);
    expect(result.status).toBe("FAILED");
  });
});

// ─── 4. Validation ───────────────────────────────────────────────────────────

describe("validateGovernanceEvent", () => {
  it("valid event returns no errors", () => {
    const event = createGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_GENERATED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
    });
    const errors = validateGovernanceEvent(event);
    expect(errors.length).toBe(0);
  });

  it("invalid event type returns error", () => {
    const event = createGovernanceEvent({
      eventType: "INVALID_TYPE",
      sourceSurface: "test",
      canonicalRecordType: "ResearchRun",
    });
    const errors = validateGovernanceEvent(event);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("Unknown event type");
  });
});

// ─── 5. routeGovernanceEvent convenience ─────────────────────────────────────

describe("routeGovernanceEvent", () => {
  it("routes valid event with params", async () => {
    const result = await routeGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_GENERATED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
      payload: { test: true },
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe("RECORDED");
  });
});

// ─── 6. No silent drops ──────────────────────────────────────────────────────

describe("no silent event drops", () => {
  it("emitGovernanceEvent never returns undefined or throws", async () => {
    const event = createGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_GENERATED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
    });
    const result = await emitGovernanceEvent(event);
    expect(result).toBeDefined();
    expect(typeof result.ok).toBe("boolean");
    expect(["RECORDED", "PARTIAL", "FAILED"]).toContain(result.status);
  });

  it("invalid event returns FAILED not thrown exception", async () => {
    const event = createGovernanceEvent({
      eventType: "",
      sourceSurface: "",
      canonicalRecordType: "ResearchRun",
    });
    const result = await emitGovernanceEvent(event);
    expect(result.ok).toBe(false);
    expect(result.status).toBe("FAILED");
  });
});
