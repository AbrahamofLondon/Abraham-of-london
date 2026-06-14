/**
 * Product Memory Adapter
 *
 * Wraps decision memory recording with product-specific context.
 * Every event must carry governance state, readiness state, and evidence boundaries.
 *
 * Hard requirement: No event without governance context.
 */

import { DecisionMemoryEvent } from "./decision-memory-contract";
import decisionMemoryStore from "./decision-memory-store";

export interface ProductMemoryEventArgs {
  productCode: string;
  caseId: string;
  actorType?: "individual" | "team" | "organisation" | "operator";
  eventType: DecisionMemoryEvent["eventType"];
  authorityStateAtEvent: string;
  readinessStatusAtEvent: string;
  evidenceBoundaryAccepted?: boolean;
  claimBoundary: string;
  sourceSurface: string;
  summary: string;
  contradictionKeys?: string[];
  evidenceGapKeys?: string[];
  commitmentKeys?: string[];
  consequenceKeys?: string[];
}

export interface ProductMemoryContext {
  productCode: string;
  caseId: string;
  authorityStateAtEvent: string;
  readinessStatusAtEvent: string;
  evidenceBoundaryAccepted: string;
  claimBoundary: string;
  sourceSurface: string;
  memoryAvailable: boolean;
  lastEventAt?: string;
  recentEventCount: number;
}

/**
 * Record a memory event for a product interaction
 */
export function recordProductMemoryEvent(
  args: ProductMemoryEventArgs
): boolean {
  // Hard requirement: validate all required fields
  if (!args.productCode) {
    console.error("Cannot record memory: productCode missing");
    return false;
  }
  if (!args.caseId) {
    console.error("Cannot record memory: caseId missing");
    return false;
  }
  if (!args.authorityStateAtEvent) {
    console.error("Cannot record memory: authorityStateAtEvent missing");
    return false;
  }
  if (!args.readinessStatusAtEvent) {
    console.error("Cannot record memory: readinessStatusAtEvent missing");
    return false;
  }
  if (!args.evidenceBoundaryAccepted) {
    console.error("Cannot record memory: evidenceBoundaryAccepted missing");
    return false;
  }

  const event: DecisionMemoryEvent = {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    caseId: args.caseId,
    productCode: args.productCode,
    actorType: args.actorType || "operator",
    timestamp: new Date().toISOString(),
    eventType: args.eventType,
    sourceSurface: args.sourceSurface,
    authorityStateAtEvent: args.authorityStateAtEvent,
    readinessStatusAtEvent: args.readinessStatusAtEvent,
    evidenceBoundaryAccepted: args.evidenceBoundaryAccepted ?? true,
    claimBoundary: args.claimBoundary,
    summary: args.summary,
    contradictionKeys: args.contradictionKeys || [],
    evidenceGapKeys: args.evidenceGapKeys || [],
    commitmentKeys: args.commitmentKeys || [],
    consequenceKeys: args.consequenceKeys || [],
  };

  // Record in memory store
  const success = decisionMemoryStore.appendEvent(event);

  if (!success) {
    console.error(
      `Failed to record memory event for product ${args.productCode}, case ${args.caseId}`
    );
    return false;
  }

  // Log the governance context for audit trail
  console.log(
    `[MEMORY] ${args.productCode} | ${args.caseId} | ${args.eventType} | Authority: ${args.authorityStateAtEvent} | Readiness: ${args.readinessStatusAtEvent}`
  );

  return true;
}

/**
 * Load memory context for a case
 */
export function loadProductMemoryContext(
  caseId: string
): ProductMemoryContext | null {
  try {
    const events = decisionMemoryStore.getEventsByCaseId(caseId);

    if (events.length === 0) {
      return null;
    }

    const lastEvent = events[events.length - 1];
    const recentEvents = events.slice(Math.max(0, events.length - 5));

    if (!lastEvent) {
      return null;
    }

    return {
      productCode: lastEvent.productCode,
      caseId: lastEvent.caseId,
      authorityStateAtEvent: lastEvent.authorityStateAtEvent,
      readinessStatusAtEvent: lastEvent.readinessStatusAtEvent,
      evidenceBoundaryAccepted:
        "See recent events for evidence boundary context",
      claimBoundary: "See recent events for claim boundary context",
      sourceSurface: lastEvent.sourceSurface || lastEvent.eventType,
      memoryAvailable: true,
      lastEventAt: lastEvent.timestamp,
      recentEventCount: recentEvents.length,
    };
  } catch (error) {
    console.error(
      `Failed to load memory context for case ${caseId}:`,
      error
    );
    return null;
  }
}

/**
 * Build complete memory context for a product's decision
 */
export function buildMemoryContextForProduct(
  productCode: string,
  caseId: string
): {
  hasMemory: boolean;
  recentEvents: DecisionMemoryEvent[];
  contradictions: string[];
  evidenceGaps: string[];
  unresolvedCommitments: string[];
  repeatedPatterns: string[];
  lastActivityAt: string | null;
} {
  try {
    const events = decisionMemoryStore.getEventsByCaseId(caseId);
    const recentEvents = events.filter((e) => e.productCode === productCode);

    const allContradictions = new Set<string>();
    const allEvidenceGaps = new Set<string>();
    const allCommitments = new Set<string>();
    const allPatterns = new Set<string>();

    events.forEach((event) => {
      event.contradictionKeys.forEach((k) => allContradictions.add(k));
      event.evidenceGapKeys.forEach((k) => allEvidenceGaps.add(k));
      event.commitmentKeys.forEach((k) => allCommitments.add(k));
    });

    const lastEvent = events.length > 0 ? events[events.length - 1] : null;
    const lastActivity = lastEvent ? lastEvent.timestamp : null;

    return {
      hasMemory: events.length > 0,
      recentEvents: recentEvents.slice(-10),
      contradictions: Array.from(allContradictions),
      evidenceGaps: Array.from(allEvidenceGaps),
      unresolvedCommitments: Array.from(allCommitments),
      repeatedPatterns: Array.from(allPatterns),
      lastActivityAt: lastActivity,
    };
  } catch (error) {
    console.error(
      `Failed to build memory context for ${productCode}/${caseId}:`,
      error
    );
    return {
      hasMemory: false,
      recentEvents: [],
      contradictions: [],
      evidenceGaps: [],
      unresolvedCommitments: [],
      repeatedPatterns: [],
      lastActivityAt: null,
    };
  }
}
