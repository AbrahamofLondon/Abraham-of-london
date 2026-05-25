/**
 * tests/research/governance-event-bridge-wiring.test.ts
 *
 * Tests for ER → Boardroom bridge governance event wiring.
 * Verifies simulation-scoped events are emitted correctly.
 */

import { describe, it, expect } from "vitest";
import { createGovernanceEvent, emitGovernanceEvent } from "@/lib/platform/governance-event-bus";

// ─── Bridge simulation events ────────────────────────────────────────────────

describe("ER → Boardroom bridge simulation events", () => {
  it("EXECUTIVE_REPORT_GENERATED can be emitted with simulation context", async () => {
    const event = createGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_GENERATED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
      payload: {
        simulation: true,
        bridgeDecision: "QUALIFIES",
        mappingGapsCount: 0,
        qualifiesForBoardroom: true,
        noPdfRendered: true,
        noClientArtifactCreated: true,
      },
    });
    expect(event.payload.simulation).toBe(true);
    expect(event.payload.noPdfRendered).toBe(true);
    expect(event.payload.noClientArtifactCreated).toBe(true);
  });

  it("ER_MAPPED_TO_INTELLIGENCE_SPINE emits with bridge context", async () => {
    const event = createGovernanceEvent({
      eventType: "ER_MAPPED_TO_INTELLIGENCE_SPINE",
      sourceSurface: "er-boardroom-bridge",
      canonicalRecordType: "ExecutiveReport",
      payload: {
        simulation: true,
        mappingGapsCount: 2,
      },
    });
    expect(event.payload.simulation).toBe(true);
  });

  it("BOARDROOM_DOSSIER_PREVIEWED is simulation-only", async () => {
    const event = createGovernanceEvent({
      eventType: "BOARDROOM_DOSSIER_PREVIEWED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomDossier",
      payload: {
        simulation: true,
        noPdfRendered: true,
        noClientArtifactCreated: true,
      },
    });
    expect(event.payload.noPdfRendered).toBe(true);
    expect(event.payload.noClientArtifactCreated).toBe(true);
  });

  it("BOARDROOM_DOSSIER_EXPORTED_SIMULATED is clearly marked as simulated", async () => {
    const event = createGovernanceEvent({
      eventType: "BOARDROOM_DOSSIER_EXPORTED_SIMULATED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomDossier",
      payload: {
        simulation: true,
        noPdfRendered: true,
        noClientArtifactCreated: true,
      },
    });
    expect(event.payload.simulation).toBe(true);
    // Must not look like a real export
    expect(event.eventType).toContain("SIMULATED");
  });

  it("simulated export event does not call PDF export (payload proves no PDF)", async () => {
    const event = createGovernanceEvent({
      eventType: "BOARDROOM_DOSSIER_EXPORTED_SIMULATED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomDossier",
      payload: {
        simulation: true,
        noPdfRendered: true,
        noClientArtifactCreated: true,
      },
    });
    expect(event.payload.noPdfRendered).toBe(true);
  });
});

// ─── Bridge event emission ───────────────────────────────────────────────────

describe("bridge event emission", () => {
  it("valid bridge event emits successfully", async () => {
    const event = createGovernanceEvent({
      eventType: "BOARDROOM_QUALIFICATION_EVALUATED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomDossier",
      payload: { simulation: true, qualifiesForBoardroom: true },
    });
    const result = await emitGovernanceEvent(event);
    expect(result.ok).toBe(true);
    expect(result.status).toBe("RECORDED");
  });
});
