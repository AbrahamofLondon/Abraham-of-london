/**
 * lib/research/lineage/report-lineage-simulation.ts
 *
 * Report Lineage Simulation Engine.
 *
 * Proves that the Pass 1 registries can generate, validate, simulate,
 * and expose expected governance flows across the product ladder.
 *
 * Rules:
 * - Every event validates against governance-event-types.
 * - Every record validates against canonical-record-registry.
 * - Every surface validates against product-ladder-registry.
 * - Every admin owner validates against admin-domain-registry.
 * - Any missing registry relationship becomes a gap.
 * - Any HIGH/CRITICAL gap becomes a FoundryFinding.
 * - A chain cannot be marked COMPLETE if any required registry link is missing.
 */

import "server-only";

import { getProductLadderEntry } from "@/lib/platform/product-ladder-registry";
import { getCanonicalRecord } from "@/lib/platform/canonical-record-registry";
import { getAdminRoute } from "@/lib/platform/admin-domain-registry";
import { getEventType } from "@/lib/platform/governance-event-types";
import { getSpineEntry } from "@/lib/platform/operating-spine-registry";
import { getChainDefinition, getAllChainIds, type ChainDefinition } from "./lineage-chain-definitions";
import type {
  LineageSimulationChainId,
  LineageSimulationResult,
  SimulatedLineageEvent,
  LineageSimulationGap,
  LineageSimulationFinding,
  ChainStatus,
} from "./lineage-simulation-contract";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateGap(
  gapType: LineageSimulationGap["gapType"],
  severity: LineageSimulationGap["severity"],
  eventType: string,
  explanation: string,
  recommendation: string,
  sourceRule: string,
): LineageSimulationGap {
  return { gapType, severity, eventType, explanation, recommendation, sourceRule };
}

function generateFinding(
  title: string,
  description: string,
  severity: LineageSimulationFinding["severity"],
  source: string,
  recommendation: string,
): LineageSimulationFinding {
  return { title, description, severity, source, recommendation };
}

// ─── Core Simulation ─────────────────────────────────────────────────────────

export function simulateLineageChain(chainId: LineageSimulationChainId): LineageSimulationResult {
  const chainDef = getChainDefinition(chainId);
  if (!chainDef) {
    return {
      chainId,
      title: `Unknown chain: ${chainId}`,
      status: "BROKEN",
      events: [],
      gaps: [generateGap("MISSING_GOVERNANCE_EVENT", "CRITICAL", "unknown", `Chain definition not found for "${chainId}".`, "Register the chain in lineage-chain-definitions.ts.", "lineage-chain-definitions.ts::getChainDefinition")],
      findings: [generateFinding("Chain definition missing", `Chain "${chainId}" is not defined in lineage-chain-definitions.ts.`, "CRITICAL", "report-lineage-simulation.ts::simulateLineageChain", "Add the chain definition to LINEAGE_CHAIN_DEFINITIONS.")],
      researchRunRecommended: true,
    };
  }

  const gaps: LineageSimulationGap[] = [];
  const findings: LineageSimulationFinding[] = [];
  const events: SimulatedLineageEvent[] = [];

  // Validate source surface
  const productSurface = getProductLadderEntry(chainDef.sourceSurface);
  if (!productSurface) {
    gaps.push(generateGap("MISSING_PRODUCT_SURFACE", "CRITICAL", chainDef.sourceSurface, `Product surface "${chainDef.sourceSurface}" not found in product-ladder-registry.`, `Add "${chainDef.sourceSurface}" to PRODUCT_LADDER in product-ladder-registry.ts.`, "product-ladder-registry.ts::PRODUCT_LADDER"));
  }

  // Validate canonical record
  const canonicalRecord = getCanonicalRecord(chainDef.expectedCanonicalRecord);
  if (!canonicalRecord) {
    gaps.push(generateGap("MISSING_CANONICAL_RECORD", "CRITICAL", chainDef.expectedCanonicalRecord, `Canonical record "${chainDef.expectedCanonicalRecord}" not found in canonical-record-registry.`, `Add "${chainDef.expectedCanonicalRecord}" to CANONICAL_RECORDS in canonical-record-registry.ts.`, "canonical-record-registry.ts::CANONICAL_RECORDS"));
  }

  // Validate operating spine entry
  const spineEntry = getSpineEntry(chainDef.sourceSurface);

  // Process each event in the chain
  for (const eventDef of chainDef.events) {
    const govEvent = getEventType(eventDef.eventType);
    const eventRecord = getCanonicalRecord(eventDef.expectedCanonicalRecord);
    const eventSurface = getProductLadderEntry(chainDef.sourceSurface);
    const eventAdminRoute = getAdminRoute(productSurface?.adminOwnerSurface ?? "");

    const simulatedEvent: SimulatedLineageEvent = {
      eventType: eventDef.eventType,
      canonicalRecord: eventDef.expectedCanonicalRecord,
      sourceSurface: chainDef.sourceSurface,
      adminOwnerSurface: productSurface?.adminOwnerSurface ?? "unknown",
      foundryModuleId: productSurface?.foundryModuleId,
      engineId: productSurface?.engineId,
      adapterId: productSurface?.adapterId,
      requiredActorRole: "SYSTEM",
      downstreamEffects: [],
      auditRequired: govEvent?.writesAudit ?? false,
      lineageRequired: govEvent?.writesLineage ?? false,
      registrySource: {
        productSurface: productSurface ? `product-ladder-registry.ts::${chainDef.sourceSurface}` : undefined,
        canonicalRecord: eventRecord ? `canonical-record-registry.ts::${eventDef.expectedCanonicalRecord}` : undefined,
        governanceEvent: govEvent ? `governance-event-types.ts::${eventDef.eventType}` : undefined,
        operatingSpineEntry: spineEntry ? `operating-spine-registry.ts::${chainDef.sourceSurface}` : undefined,
      },
    };

    // Determine required actor role based on event type
    if (eventDef.eventType.includes("REVOKED") || eventDef.eventType.includes("APPROVED")) {
      simulatedEvent.requiredActorRole = "ADMIN";
    } else if (eventDef.eventType.includes("FAILED") || eventDef.eventType.includes("ESCALATION")) {
      simulatedEvent.requiredActorRole = "SYSTEM";
    }

    // Determine downstream effects
    const downstreamEffects: string[] = [];
    const nextEvents = chainDef.events.slice(chainDef.events.indexOf(eventDef) + 1);
    if (nextEvents.length > 0) {
      downstreamEffects.push(...nextEvents.slice(0, 2).map((e) => e.eventType));
    }
    simulatedEvent.downstreamEffects = downstreamEffects;

    // ── Validate governance event ──
    if (!govEvent) {
      gaps.push(generateGap(
        "MISSING_GOVERNANCE_EVENT",
        "HIGH",
        eventDef.eventType,
        `Governance event "${eventDef.eventType}" not found in governance-event-types.`,
        `Add "${eventDef.eventType}" to GOVERNANCE_EVENT_TYPES in governance-event-types.ts.`,
        "governance-event-types.ts::GOVERNANCE_EVENT_TYPES",
      ));
    }

    // ── Validate canonical record ──
    if (!eventRecord) {
      gaps.push(generateGap(
        "MISSING_CANONICAL_RECORD",
        "CRITICAL",
        eventDef.eventType,
        `Canonical record "${eventDef.expectedCanonicalRecord}" not found in canonical-record-registry.`,
        `Add "${eventDef.expectedCanonicalRecord}" to CANONICAL_RECORDS in canonical-record-registry.ts.`,
        "canonical-record-registry.ts::CANONICAL_RECORDS",
      ));
    }

    // ── Validate admin owner surface ──
    if (!eventAdminRoute && productSurface?.adminOwnerSurface) {
      gaps.push(generateGap(
        "MISSING_ADMIN_OWNER",
        "HIGH",
        eventDef.eventType,
        `Admin route "${productSurface.adminOwnerSurface}" not found in admin-domain-registry.`,
        `Add "${productSurface.adminOwnerSurface}" to ADMIN_ROUTES in admin-domain-registry.ts.`,
        "admin-domain-registry.ts::ADMIN_ROUTES",
      ));
    }

    // ── Validate Foundry module link ──
    if (productSurface?.foundryModuleId && !spineEntry?.foundryModuleId) {
      gaps.push(generateGap(
        "MISSING_FOUNDRY_MODULE",
        "MEDIUM",
        eventDef.eventType,
        `Foundry module "${productSurface.foundryModuleId}" for surface "${chainDef.sourceSurface}" not linked in operating-spine-registry.`,
        `Add foundryModuleId to operating-spine-registry.ts for "${chainDef.sourceSurface}".`,
        "operating-spine-registry.ts::OPERATING_SPINE",
      ));
    }

    // ── Validate lineage requirement ──
    if (govEvent && !govEvent.writesLineage) {
      gaps.push(generateGap(
        "MISSING_LINEAGE_EVENT",
        "MEDIUM",
        eventDef.eventType,
        `Event "${eventDef.eventType}" is in a lineage chain but governance-event-types says writesLineage=false.`,
        `Set writesLineage=true for "${eventDef.eventType}" in governance-event-types.ts.`,
        "governance-event-types.ts::GOVERNANCE_EVENT_TYPES",
      ));
    }

    events.push(simulatedEvent);
  }

  // ── Convert HIGH/CRITICAL gaps to findings ──
  for (const gap of gaps) {
    if (gap.severity === "HIGH" || gap.severity === "CRITICAL") {
      findings.push(generateFinding(
        `Lineage gap: ${gap.gapType}`,
        gap.explanation,
        gap.severity,
        `report-lineage-simulation.ts::simulateLineageChain::${gap.sourceRule}`,
        gap.recommendation,
      ));
    }
  }

  // ── Determine status ──
  let status: ChainStatus = "COMPLETE";
  const criticalGaps = gaps.filter((g) => g.severity === "CRITICAL");
  const highGaps = gaps.filter((g) => g.severity === "HIGH");

  if (criticalGaps.length > 0) {
    status = "BROKEN";
  } else if (highGaps.length > 0 || gaps.length > 0) {
    status = "PARTIAL";
  }

  return {
    chainId: chainDef.chainId,
    title: chainDef.title,
    status,
    events,
    gaps,
    findings,
    researchRunRecommended: findings.length > 0,
  };
}

export function simulateAllLineageChains(): LineageSimulationResult[] {
  return getAllChainIds().map(simulateLineageChain);
}
