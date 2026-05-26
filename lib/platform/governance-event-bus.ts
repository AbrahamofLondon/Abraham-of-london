/**
 * lib/platform/governance-event-bus.ts
 *
 * Hardened governance event bus — the bloodstream of the governed operating system.
 *
 * Every wired flow emits standardised GovernanceEvents into audit, lineage,
 * and Foundry improvement flows. No subsystem may invent its own event shape.
 *
 * Routing behaviour:
 *   - shouldWriteAudit = true → writes audit event
 *   - shouldWriteLineage = true → writes lineage event
 *   - shouldCreateResearchRun = true → signals intent; bus marks SKIPPED (caller must create ResearchRun via Foundry service)
 *
 * Status semantics:
 *   RECORDED — all requested writes succeeded
 *   PARTIAL  — at least one write succeeded, at least one failed or was skipped when required
 *   FAILED   — validation error or no required write succeeded
 *
 * No silent event drops. No raw stack traces.
 */

import "server-only";

import { getEventType, type GovernanceEvent } from "./governance-event-types";
import { auditLogger } from "@/lib/audit/audit-logger";
import { prisma } from "@/lib/prisma.server";

// ─── Result Types ─────────────────────────────────────────────────────────────

export type GovernanceEventResult = {
  ok: boolean;
  status: "RECORDED" | "PARTIAL" | "FAILED";
  auditStatus?: "RECORDED" | "SKIPPED" | "FAILED";
  lineageStatus?: "RECORDED" | "SKIPPED" | "FAILED";
  researchRunStatus?: "CREATED" | "SKIPPED" | "FAILED";
  eventId: string;
  errors?: string[];
};

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateGovernanceEvent(event: GovernanceEvent): string[] {
  const errors: string[] = [];

  if (!event.eventType) errors.push("eventType is required");
  if (!event.sourceSurface) errors.push("sourceSurface is required");
  if (!event.canonicalRecordType) errors.push("canonicalRecordType is required");

  const eventTypeDef = getEventType(event.eventType);
  if (!eventTypeDef) {
    errors.push(`Unknown event type: "${event.eventType}". Must be registered in GOVERNANCE_EVENT_TYPES.`);
  }

  return errors;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapSeverity(sev?: string): string {
  if (sev === "CRITICAL") return "critical";
  if (sev === "HIGH") return "error";
  if (sev === "MEDIUM") return "warn";
  return "info";
}

// ─── Emit ─────────────────────────────────────────────────────────────────────

/**
 * Emit a governance event with full routing.
 * Returns structured result — never throws.
 * No silent event drops.
 */
export async function emitGovernanceEvent(event: GovernanceEvent): Promise<GovernanceEventResult> {
  const errors = validateGovernanceEvent(event);
  const eventId = event.eventId;

  if (errors.length > 0) {
    return { ok: false, status: "FAILED", eventId, errors };
  }

  const results: GovernanceEventResult = {
    ok: true,
    status: "RECORDED",
    eventId,
    auditStatus: "SKIPPED",
    lineageStatus: "SKIPPED",
    researchRunStatus: "SKIPPED",
  };

  // ── Route: Audit ──
  if (event.shouldWriteAudit) {
    try {
      await auditLogger.log({
        action: event.eventType,
        actorId: event.actorId,
        actorEmail: event.actorEmail,
        actorType: event.actorRole ?? "system",
        resourceType: event.canonicalRecordType,
        resourceId: event.canonicalRecordId,
        severity: mapSeverity(event.severity),
        status: "success",
        category: "system",
        metadata: {
          sourceSurface: event.sourceSurface,
          eventId: event.eventId,
          emittedAt: event.emittedAt,
          ...event.payload,
        },
      });
      results.auditStatus = "RECORDED";
    } catch (err) {
      results.auditStatus = "FAILED";
      results.errors = [...(results.errors ?? []), `Audit write failed: ${err instanceof Error ? err.message : String(err)}`];
      results.status = "PARTIAL";
      results.ok = false;
    }
  }

  // ── Route: Lineage ──
  if (event.shouldWriteLineage) {
    try {
      await prisma.governanceLog.create({
        data: {
          action: event.eventType,
          performedBy: event.actorId ?? event.sourceSurface,
          target: event.canonicalRecordId ?? event.canonicalRecordType,
          details: JSON.stringify({
            eventId: event.eventId,
            sourceSurface: event.sourceSurface,
            severity: event.severity,
            emittedAt: event.emittedAt,
            payload: event.payload,
          }),
        },
      });
      results.lineageStatus = "RECORDED";
    } catch (err) {
      results.lineageStatus = "FAILED";
      results.errors = [...(results.errors ?? []), `Lineage write failed: ${err instanceof Error ? err.message : String(err)}`];
      results.status = "PARTIAL";
      results.ok = false;
    }
  }

  // ── Route: ResearchRun ──
  // ResearchRun creation requires module context unavailable in the event bus.
  // Callers must create ResearchRuns directly via the Foundry service.
  if (event.shouldCreateResearchRun) {
    results.researchRunStatus = "SKIPPED";
    // A requested but skipped write is a partial outcome.
    if (results.status === "RECORDED") {
      results.status = "PARTIAL";
      results.ok = false;
    }
  }

  // ── Resolve final status ──
  // Escalate PARTIAL → FAILED when every bus-executable write explicitly errored.
  // ResearchRun is always SKIPPED by the bus (caller handles creation) and is
  // excluded from this check — SKIPPED is already captured as PARTIAL above.
  const busWrites: Array<"RECORDED" | "SKIPPED" | "FAILED" | undefined> = [];
  if (event.shouldWriteAudit) busWrites.push(results.auditStatus);
  if (event.shouldWriteLineage) busWrites.push(results.lineageStatus);

  if (busWrites.length > 0 && busWrites.every((s) => s === "FAILED")) {
    results.status = "FAILED";
    results.ok = false;
  }

  // Log in dev
  if (process.env.NODE_ENV !== "production") {
    const status = results.status;
    console.log(`[GovernanceEventBus] ${status} | ${event.eventType} | source=${event.sourceSurface} | record=${event.canonicalRecordType}${event.canonicalRecordId ? ` | id=${event.canonicalRecordId}` : ""} | severity=${event.severity}`);
  }

  return results;
}

// ─── Route ────────────────────────────────────────────────────────────────────

/**
 * Route a governance event to its destinations based on event type definition.
 * Convenience wrapper that creates the event from params and emits it.
 */
export async function routeGovernanceEvent(params: {
  eventType: string;
  sourceSurface: string;
  canonicalRecordType: GovernanceEvent["canonicalRecordType"];
  canonicalRecordId?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  severity?: GovernanceEvent["severity"];
  payload?: Record<string, unknown>;
  shouldWriteAudit?: boolean;
  shouldWriteLineage?: boolean;
  shouldCreateResearchRun?: boolean;
}): Promise<GovernanceEventResult> {
  const event = createGovernanceEvent(params);
  return emitGovernanceEvent(event);
}

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Create a governance event with sensible defaults from the event type registry.
 */
export function createGovernanceEvent(params: {
  eventType: string;
  sourceSurface: string;
  canonicalRecordType: GovernanceEvent["canonicalRecordType"];
  canonicalRecordId?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  severity?: GovernanceEvent["severity"];
  payload?: Record<string, unknown>;
  shouldWriteAudit?: boolean;
  shouldWriteLineage?: boolean;
  shouldCreateResearchRun?: boolean;
}): GovernanceEvent {
  const eventTypeDef = getEventType(params.eventType);

  return {
    eventId: `gov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventType: params.eventType,
    sourceSurface: params.sourceSurface,
    canonicalRecordType: params.canonicalRecordType,
    canonicalRecordId: params.canonicalRecordId,
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    severity: params.severity ?? eventTypeDef?.defaultSeverity ?? "LOW",
    payload: params.payload ?? {},
    shouldWriteAudit: params.shouldWriteAudit ?? eventTypeDef?.writesAudit ?? false,
    shouldWriteLineage: params.shouldWriteLineage ?? eventTypeDef?.writesLineage ?? false,
    shouldCreateResearchRun: params.shouldCreateResearchRun ?? eventTypeDef?.canCreateResearchRun ?? false,
    emittedAt: new Date().toISOString(),
  };
}

// ─── Coverage Validation ──────────────────────────────────────────────────────

/**
 * Validate governance event coverage against the event type registry.
 * Used by the lineage simulator to avoid duplicating event vocabulary manually.
 */
export function validateGovernanceEventCoverage(eventType: string): {
  exists: boolean;
  auditRequired: boolean;
  lineageRequired: boolean;
  canonicalRecord?: string;
  sourceSurface?: string;
} {
  const eventTypeDef = getEventType(eventType);

  if (!eventTypeDef) {
    return { exists: false, auditRequired: false, lineageRequired: false };
  }

  return {
    exists: true,
    auditRequired: eventTypeDef.writesAudit,
    lineageRequired: eventTypeDef.writesLineage,
    canonicalRecord: eventTypeDef.canonicalRecordType,
    sourceSurface: eventTypeDef.sourceSurface,
  };
}
