/**
 * lib/platform/product-event-contract.ts
 *
 * Product event contract — every user-facing product action that creates
 * a record, triggers an audit, or requires Foundry testability must
 * conform to this shape.
 */

import type { CanonicalRecordType } from "./product-ladder-registry";
import type { GovernanceSeverity } from "./governance-event-types";

export type ProductEvent = {
  /** Unique event identifier */
  eventId: string;
  /** Human-readable event name */
  eventType: string;
  /** Which product surface generated this event */
  sourceSurface: string;
  /** The canonical record type this event relates to */
  canonicalRecordType: CanonicalRecordType;
  /** The specific record ID, if available */
  canonicalRecordId?: string;
  /** Who performed the action */
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  /** Severity of the event */
  severity: GovernanceSeverity;
  /** Event-specific data */
  payload: Record<string, unknown>;
  /** ISO timestamp */
  occurredAt: string;
};

/**
 * Create a product event with auto-generated ID and timestamp.
 */
export function createProductEvent(params: {
  eventType: string;
  sourceSurface: string;
  canonicalRecordType: CanonicalRecordType;
  canonicalRecordId?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  severity?: GovernanceSeverity;
  payload?: Record<string, unknown>;
}): ProductEvent {
  return {
    eventId: `pe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventType: params.eventType,
    sourceSurface: params.sourceSurface,
    canonicalRecordType: params.canonicalRecordType,
    canonicalRecordId: params.canonicalRecordId,
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    severity: params.severity ?? "LOW",
    payload: params.payload ?? {},
    occurredAt: new Date().toISOString(),
  };
}
