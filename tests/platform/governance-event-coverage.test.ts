/**
 * tests/platform/governance-event-coverage.test.ts
 *
 * Tests for governance event coverage validation.
 * Ensures the validateGovernanceEventCoverage helper works correctly
 * and that the lineage simulator uses it properly.
 */

import { describe, it, expect } from "vitest";
import { validateGovernanceEventCoverage } from "@/lib/platform/governance-event-bus";
import { getEventType, GOVERNANCE_EVENT_TYPES } from "@/lib/platform/governance-event-types";

// ─── validateGovernanceEventCoverage ─────────────────────────────────────────

describe("validateGovernanceEventCoverage", () => {
  it("returns exists=true for registered event", () => {
    const result = validateGovernanceEventCoverage("EXECUTIVE_REPORT_GENERATED");
    expect(result.exists).toBe(true);
  });

  it("returns exists=false for unregistered event", () => {
    const result = validateGovernanceEventCoverage("NONEXISTENT_EVENT_TYPE");
    expect(result.exists).toBe(false);
  });

  it("returns auditRequired from event type definition", () => {
    const result = validateGovernanceEventCoverage("EXECUTIVE_REPORT_GENERATED");
    const eventDef = getEventType("EXECUTIVE_REPORT_GENERATED");
    expect(result.auditRequired).toBe(eventDef?.writesAudit ?? false);
  });

  it("returns lineageRequired from event type definition", () => {
    const result = validateGovernanceEventCoverage("EXECUTIVE_REPORT_GENERATED");
    const eventDef = getEventType("EXECUTIVE_REPORT_GENERATED");
    expect(result.lineageRequired).toBe(eventDef?.writesLineage ?? false);
  });

  it("returns canonicalRecord for registered event", () => {
    const result = validateGovernanceEventCoverage("EXECUTIVE_REPORT_GENERATED");
    expect(result.canonicalRecord).toBe("ExecutiveReport");
  });

  it("returns sourceSurface for registered event", () => {
    const result = validateGovernanceEventCoverage("EXECUTIVE_REPORT_GENERATED");
    expect(result.sourceSurface).toBe("executive-reporting");
  });

  it("does not return canonicalRecord for unregistered event", () => {
    const result = validateGovernanceEventCoverage("NONEXISTENT_EVENT_TYPE");
    expect(result.canonicalRecord).toBeUndefined();
  });
});

// ─── New Boardroom events ────────────────────────────────────────────────────

describe("new Boardroom governance events", () => {
  it("BOARDROOM_DOSSIER_PREVIEWED is registered", () => {
    const event = getEventType("BOARDROOM_DOSSIER_PREVIEWED");
    expect(event).toBeDefined();
    expect(event!.canonicalRecordType).toBe("BoardroomDossier");
    expect(event!.writesLineage).toBe(true);
  });

  it("BOARDROOM_DOSSIER_EXPORTED_SIMULATED is registered", () => {
    const event = getEventType("BOARDROOM_DOSSIER_EXPORTED_SIMULATED");
    expect(event).toBeDefined();
    expect(event!.canonicalRecordType).toBe("BoardroomDossier");
    expect(event!.writesAudit).toBe(false); // simulated — no real export
    expect(event!.writesLineage).toBe(true);
  });
});

// ─── New Content / Editorial events ──────────────────────────────────────────

describe("new Content / Editorial governance events", () => {
  it("CONTENT_ASSET_CREATED is registered", () => {
    const event = getEventType("CONTENT_ASSET_CREATED");
    expect(event).toBeDefined();
    expect(event!.canonicalRecordType).toBe("ContentAsset");
  });

  it("CONTENT_STYLE_CHECKED is registered", () => {
    const event = getEventType("CONTENT_STYLE_CHECKED");
    expect(event).toBeDefined();
    expect(event!.writesAudit).toBe(true);
  });

  it("CONTENT_METADATA_VALIDATED is registered", () => {
    const event = getEventType("CONTENT_METADATA_VALIDATED");
    expect(event).toBeDefined();
    expect(event!.writesAudit).toBe(true);
  });

  it("CONTENT_OUTBOUND_ELIGIBLE is registered", () => {
    const event = getEventType("CONTENT_OUTBOUND_ELIGIBLE");
    expect(event).toBeDefined();
    expect(event!.canonicalRecordType).toBe("ContentAsset");
    // Description clarifies this is not a social publish event
    expect(event!.description).toContain("outbound-eligible");
    expect(event!.description).toContain("internal eligibility");
  });
});

// ─── New GMI events ──────────────────────────────────────────────────────────

describe("new GMI governance events", () => {
  it("GMI_PRIOR_CALLS_REVIEWED is registered", () => {
    const event = getEventType("GMI_PRIOR_CALLS_REVIEWED");
    expect(event).toBeDefined();
    expect(event!.canonicalRecordType).toBe("GmiRelease");
    expect(event!.writesAudit).toBe(true);
  });

  it("GMI_QUALITY_GATE_RUN is registered", () => {
    const event = getEventType("GMI_QUALITY_GATE_RUN");
    expect(event).toBeDefined();
    expect(event!.canonicalRecordType).toBe("GmiRelease");
    expect(event!.canCreateResearchRun).toBe(true);
  });

  it("GMI_CALL_CARRIED_FORWARD is registered", () => {
    const event = getEventType("GMI_CALL_CARRIED_FORWARD");
    expect(event).toBeDefined();
    expect(event!.canonicalRecordType).toBe("GmiRelease");
    expect(event!.writesAudit).toBe(true);
  });

  it("GMI_RELEASE_APPROVED is registered", () => {
    const event = getEventType("GMI_RELEASE_APPROVED");
    expect(event).toBeDefined();
    expect(event!.canonicalRecordType).toBe("GmiRelease");
  });
});

// ─── FOUNDRY_ACTION_REQUIRED ─────────────────────────────────────────────────

describe("FOUNDRY_ACTION_REQUIRED", () => {
  it("is registered as a Foundry event", () => {
    const event = getEventType("FOUNDRY_ACTION_REQUIRED");
    expect(event).toBeDefined();
    expect(event!.sourceSurface).toBe("foundry");
    expect(event!.canonicalRecordType).toBe("ResearchRun");
    expect(event!.canCreateResearchRun).toBe(true);
  });

  it("is distinct from Strategy Room ACTION_REQUIRED", () => {
    const foundryEvent = getEventType("FOUNDRY_ACTION_REQUIRED");
    const strategyEvent = getEventType("ACTION_REQUIRED");
    expect(foundryEvent).toBeDefined();
    expect(strategyEvent).toBeDefined();
    expect(foundryEvent!.eventType).not.toBe(strategyEvent!.eventType);
    expect(foundryEvent!.sourceSurface).toBe("foundry");
    expect(strategyEvent!.sourceSurface).toBe("strategy-room");
  });
});

// ─── Governance event type registry integrity ────────────────────────────────

describe("governance event type registry integrity", () => {
  it("every event type has a unique eventType", () => {
    const eventTypes = GOVERNANCE_EVENT_TYPES.map((e) => e.eventType);
    const unique = new Set(eventTypes);
    expect(unique.size).toBe(eventTypes.length);
  });

  it("every event type has description, sourceSurface, canonicalRecordType", () => {
    for (const event of GOVERNANCE_EVENT_TYPES) {
      expect(typeof event.description).toBe("string");
      expect(event.description.length).toBeGreaterThan(0);
      expect(typeof event.sourceSurface).toBe("string");
      expect(event.sourceSurface.length).toBeGreaterThan(0);
      expect(typeof event.canonicalRecordType).toBe("string");
      expect(event.canonicalRecordType.length).toBeGreaterThan(0);
    }
  });

  it("every event type has a valid defaultSeverity", () => {
    const valid = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    for (const event of GOVERNANCE_EVENT_TYPES) {
      expect(valid).toContain(event.defaultSeverity);
    }
  });

  it("every event type has a valid adminDomain", () => {
    const valid = ["command", "product-operations", "foundry", "content", "outbound", "access", "audit", "intelligence"];
    for (const event of GOVERNANCE_EVENT_TYPES) {
      expect(valid).toContain(event.adminDomain);
    }
  });
});
