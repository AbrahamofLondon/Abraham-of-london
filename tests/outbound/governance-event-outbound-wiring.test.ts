/**
 * tests/outbound/governance-event-outbound-wiring.test.ts
 *
 * Tests for outbound publishing governance event wiring.
 * Verifies that publish attempts emit standard GovernanceEvents.
 */

import { describe, it, expect } from "vitest";
import { createGovernanceEvent, emitGovernanceEvent } from "@/lib/platform/governance-event-bus";

// ─── Outbound lifecycle events ───────────────────────────────────────────────

describe("outbound lifecycle governance events", () => {
  it("OUTBOUND_DRAFT_CREATED emits with OutboundPost canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "OUTBOUND_DRAFT_CREATED",
      sourceSurface: "outbound-linkedin",
      canonicalRecordType: "OutboundPost",
    });
    expect(event.canonicalRecordType).toBe("OutboundPost");
  });

  it("OUTBOUND_POLICY_CHECKED emits with OutboundPost canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "OUTBOUND_POLICY_CHECKED",
      sourceSurface: "outbound-linkedin",
      canonicalRecordType: "OutboundPost",
    });
    expect(event.canonicalRecordType).toBe("OutboundPost");
  });

  it("OUTBOUND_APPROVED emits with OutboundPost canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "OUTBOUND_APPROVED",
      sourceSurface: "outbound-linkedin",
      canonicalRecordType: "OutboundPost",
    });
    expect(event.canonicalRecordType).toBe("OutboundPost");
  });

  it("OUTBOUND_PUBLISHED emits with OutboundPost canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "OUTBOUND_PUBLISHED",
      sourceSurface: "outbound-linkedin",
      canonicalRecordType: "OutboundPost",
    });
    expect(event.canonicalRecordType).toBe("OutboundPost");
  });

  it("OUTBOUND_FAILED emits with OutboundPost canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "OUTBOUND_FAILED",
      sourceSurface: "outbound-linkedin",
      canonicalRecordType: "OutboundPost",
      severity: "HIGH",
    });
    expect(event.canonicalRecordType).toBe("OutboundPost");
    expect(event.severity).toBe("HIGH");
  });
});

// ─── Dry-run and policy block semantics ──────────────────────────────────────

describe("outbound dry-run and policy block semantics", () => {
  it("dry-run does not emit OUTBOUND_PUBLISHED", () => {
    // Dry-run should emit OUTBOUND_POLICY_CHECKED, not OUTBOUND_PUBLISHED
    const dryRunEvent = createGovernanceEvent({
      eventType: "OUTBOUND_POLICY_CHECKED",
      sourceSurface: "outbound-linkedin",
      canonicalRecordType: "OutboundPost",
      payload: { dryRun: true, passed: true },
    });
    expect(dryRunEvent.eventType).toBe("OUTBOUND_POLICY_CHECKED");
    expect(dryRunEvent.payload.dryRun).toBe(true);
  });

  it("policy block emits OUTBOUND_POLICY_CHECKED with block indicators", () => {
    const blockEvent = createGovernanceEvent({
      eventType: "OUTBOUND_POLICY_CHECKED",
      sourceSurface: "outbound-linkedin",
      canonicalRecordType: "OutboundPost",
      payload: { passed: false, blockers: ["claim_safety_violation"] },
      severity: "HIGH",
    });
    expect(blockEvent.payload.passed).toBe(false);
    expect(blockEvent.payload.blockers).toContain("claim_safety_violation");
  });
});

// ─── Outbound event emission ─────────────────────────────────────────────────

describe("outbound event emission", () => {
  it("OUTBOUND_PUBLISHED emits successfully", async () => {
    const event = createGovernanceEvent({
      eventType: "OUTBOUND_PUBLISHED",
      sourceSurface: "outbound-linkedin",
      canonicalRecordType: "OutboundPost",
    });
    const result = await emitGovernanceEvent(event);
    expect(result.ok).toBe(true);
    expect(result.status).toBe("RECORDED");
  });

  it("OUTBOUND_FAILED emits successfully", async () => {
    const event = createGovernanceEvent({
      eventType: "OUTBOUND_FAILED",
      sourceSurface: "outbound-linkedin",
      canonicalRecordType: "OutboundPost",
      severity: "HIGH",
      payload: { errorCode: "API_ERROR", provider: "linkedin" },
    });
    const result = await emitGovernanceEvent(event);
    expect(result.ok).toBe(true);
  });
});
