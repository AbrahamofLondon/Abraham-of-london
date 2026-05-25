/**
 * tests/platform/governance-event-no-silent-drop.test.ts
 *
 * Canary: Must fail if emitGovernanceEvent() catches and ignores an error
 * without returning FAILED or PARTIAL.
 */

import { describe, it, expect } from "vitest";
import { emitGovernanceEvent, createGovernanceEvent } from "@/lib/platform/governance-event-bus";

describe("governance event no silent drop", () => {
  it("emitGovernanceEvent always returns a result with ok, status, eventId", async () => {
    const event = createGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_GENERATED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
    });
    const result = await emitGovernanceEvent(event);
    expect(result).toHaveProperty("ok");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("eventId");
  });

  it("invalid event never returns RECORDED", async () => {
    const event = createGovernanceEvent({
      eventType: "",
      sourceSurface: "",
      canonicalRecordType: "ResearchRun",
    });
    const result = await emitGovernanceEvent(event);
    expect(result.status).not.toBe("RECORDED");
  });

  it("every result has a valid status", async () => {
    const event = createGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_GENERATED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
    });
    const result = await emitGovernanceEvent(event);
    expect(["RECORDED", "PARTIAL", "FAILED"]).toContain(result.status);
  });

  it("every result has errors array when FAILED", async () => {
    const event = createGovernanceEvent({
      eventType: "",
      sourceSurface: "",
      canonicalRecordType: "ResearchRun",
    });
    const result = await emitGovernanceEvent(event);
    if (result.status === "FAILED") {
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors!.length).toBeGreaterThan(0);
    }
  });
});
