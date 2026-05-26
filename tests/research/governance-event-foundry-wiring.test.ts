/**
 * tests/research/governance-event-foundry-wiring.test.ts
 *
 * Tests for Foundry ResearchRun governance event wiring.
 * Verifies that ResearchRun lifecycle events emit standard GovernanceEvents.
 */

import { describe, it, expect, vi } from "vitest";

const { mockAuditLog, mockGovernanceLogCreate } = vi.hoisted(() => ({
  mockAuditLog: vi.fn().mockResolvedValue(null),
  mockGovernanceLogCreate: vi.fn().mockResolvedValue({ id: "log-id" }),
}));

vi.mock("@/lib/audit/audit-logger", () => ({ auditLogger: { log: mockAuditLog } }));
vi.mock("@/lib/prisma.server", () => ({ prisma: { governanceLog: { create: mockGovernanceLogCreate } } }));

import { createGovernanceEvent, emitGovernanceEvent } from "@/lib/platform/governance-event-bus";

// ─── ResearchRun lifecycle events ────────────────────────────────────────────

describe("ResearchRun lifecycle governance events", () => {
  it("RESEARCH_RUN_CREATED emits with ResearchRun canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "RESEARCH_RUN_CREATED",
      sourceSurface: "foundry",
      canonicalRecordType: "ResearchRun",
      canonicalRecordId: "run-123",
    });
    expect(event.canonicalRecordType).toBe("ResearchRun");
    expect(event.canonicalRecordId).toBe("run-123");
  });

  it("FINDING_CREATED emits with FoundryFinding canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "FINDING_CREATED",
      sourceSurface: "foundry",
      canonicalRecordType: "FoundryFinding",
      canonicalRecordId: "finding-456",
    });
    expect(event.canonicalRecordType).toBe("FoundryFinding");
  });

  it("ACTION_BRIEF_EXPORTED emits with ActionBrief canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "ACTION_BRIEF_EXPORTED",
      sourceSurface: "foundry",
      canonicalRecordType: "ActionBrief",
    });
    expect(event.canonicalRecordType).toBe("ActionBrief");
  });

  it("FOUNDRY_ACTION_REQUIRED emits with ResearchRun canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "FOUNDRY_ACTION_REQUIRED",
      sourceSurface: "foundry",
      canonicalRecordType: "ResearchRun",
    });
    expect(event.canonicalRecordType).toBe("ResearchRun");
    expect(event.eventType).toBe("FOUNDRY_ACTION_REQUIRED");
  });

  it("IMPLEMENTED emits with ResearchRun canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "IMPLEMENTED",
      sourceSurface: "foundry",
      canonicalRecordType: "ResearchRun",
    });
    expect(event.canonicalRecordType).toBe("ResearchRun");
  });

  it("ARCHIVED emits with ResearchRun canonical record", async () => {
    const event = createGovernanceEvent({
      eventType: "ARCHIVED",
      sourceSurface: "foundry",
      canonicalRecordType: "ResearchRun",
    });
    expect(event.canonicalRecordType).toBe("ResearchRun");
  });
});

// ─── Foundry event emission ──────────────────────────────────────────────────

describe("Foundry event emission", () => {
  it("RESEARCH_RUN_CREATED emits successfully", async () => {
    const event = createGovernanceEvent({
      eventType: "RESEARCH_RUN_CREATED",
      sourceSurface: "foundry",
      canonicalRecordType: "ResearchRun",
    });
    const result = await emitGovernanceEvent(event);
    expect(result.ok).toBe(true);
    expect(result.status).toBe("RECORDED");
  });

  it("FOUNDRY_ACTION_REQUIRED with shouldCreateResearchRun emits as PARTIAL", async () => {
    const event = createGovernanceEvent({
      eventType: "FOUNDRY_ACTION_REQUIRED",
      sourceSurface: "foundry",
      canonicalRecordType: "ResearchRun",
      severity: "HIGH",
      shouldCreateResearchRun: true,
    });
    const result = await emitGovernanceEvent(event);
    // Bus always SKIPs ResearchRun creation (caller must use Foundry service directly).
    // Audit and lineage writes succeed, but the skipped ResearchRun makes this PARTIAL.
    expect(result.ok).toBe(false);
    expect(result.status).toBe("PARTIAL");
    expect(result.researchRunStatus).toBe("SKIPPED");
  });
});
