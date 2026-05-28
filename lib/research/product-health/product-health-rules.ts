/**
 * lib/research/product-health/product-health-rules.ts
 *
 * Health rule engine for the Product Health Dashboard.
 * Each rule checks a specific aspect of product surface governance.
 *
 * Rules:
 * 1. Product surface exists in product-ladder-registry.
 * 2. Canonical record exists in canonical-record-registry.
 * 3. Admin owner route exists in admin-domain-registry.
 * 4. Foundry module/engine exists where required.
 * 5. Lineage simulation chain is COMPLETE where applicable.
 * 6. Governance event vocabulary covers declared events.
 * 7. Live governance event wiring exists for relevant domains.
 * 8. Entitlement requirement is declared for gated products.
 * 9. Outbound eligibility is declared where relevant.
 * 10. Open HIGH/CRITICAL ResearchRun findings affect status.
 *
 * Simulation-only Boardroom events must not be treated as real export coverage.
 */

import "server-only";

import { getProductLadderEntry, type ProductLadderEntry } from "@/lib/platform/product-ladder-registry";
import { getCanonicalRecord } from "@/lib/platform/canonical-record-registry";
import { getAdminRoute } from "@/lib/platform/admin-domain-registry";
import { getEventType } from "@/lib/platform/governance-event-types";
import { getEngine } from "@/lib/research/engine-registry";
import { getModule } from "@/lib/research/module-registry";
import { getAdapter } from "@/lib/research/adapter-registry";
import { computeModuleStatus } from "@/lib/research/module-status-computer";
import { routeExists } from "@/lib/platform/route-existence";
import { simulateLineageChain } from "@/lib/research/lineage/report-lineage-simulation";
import type { LineageSimulationChainId } from "@/lib/research/lineage/lineage-simulation-contract";

export type HealthStatus = "GREEN" | "AMBER" | "RED" | "GREY";

export type RuleResult = {
  status: HealthStatus;
  explanation: string;
};

// ─── Rule 1: Product surface exists ──────────────────────────────────────────

export function checkProductSurfaceExists(surfaceId: string): RuleResult {
  const surface = getProductLadderEntry(surfaceId);
  if (!surface) {
    return { status: "RED", explanation: `Product surface "${surfaceId}" not found in product-ladder-registry.` };
  }
  return { status: "GREEN", explanation: `Surface "${surface.label}" registered in product-ladder-registry.` };
}

// ─── Rule 1B: Product route exists ───────────────────────────────────────────

export function checkProductRoute(surface: ProductLadderEntry): RuleResult {
  if (surface.publicStatus === "RETIRED") {
    return { status: "GREY", explanation: "Retired surface — route existence not required." };
  }
  const result = routeExists(surface.route, { kind: surface.route.startsWith("/api/") ? "api" : "page" });
  if (!result.exists) {
    return { status: "RED", explanation: `Product route "${surface.route}" has no route file on disk.` };
  }
  return { status: "GREEN", explanation: `Product route exists: ${surface.route} (${result.router}).` };
}

// ─── Rule 2: Canonical record exists ─────────────────────────────────────────

export function checkCanonicalRecord(surface: ProductLadderEntry): RuleResult {
  const record = getCanonicalRecord(surface.canonicalRecord);
  if (!record) {
    return { status: "RED", explanation: `Canonical record "${surface.canonicalRecord}" not found in canonical-record-registry.` };
  }
  return { status: "GREEN", explanation: `Canonical record "${surface.canonicalRecord}" registered.` };
}

// ─── Rule 3: Admin owner route exists ────────────────────────────────────────

export function checkAdminOwner(surface: ProductLadderEntry): RuleResult {
  if (!surface.adminOwnerSurface) {
    return { status: "RED", explanation: "No admin owner surface declared." };
  }
  const route = getAdminRoute(surface.adminOwnerSurface);
  if (!route) {
    return { status: "AMBER", explanation: `Admin route "${surface.adminOwnerSurface}" declared but not found in admin-domain-registry.` };
  }
  const routeFile = routeExists(surface.adminOwnerSurface, { kind: "page" });
  if (!routeFile.exists) {
    return { status: "RED", explanation: `Admin route "${surface.adminOwnerSurface}" is registered but has no page on disk.` };
  }
  return { status: "GREEN", explanation: `Admin owner: ${surface.adminOwnerSurface} (${route.requiredRole}, risk: ${route.riskLevel}, ${routeFile.router}).` };
}

// ─── Rule 4: Foundry module, engine, and adapter exist ───────────────────────

export function checkFoundryCoverage(surface: ProductLadderEntry): RuleResult {
  const checks: string[] = [];
  let status: HealthStatus = "GREEN";

  if (surface.foundryModuleId) {
    const moduleEntry = getModule(surface.foundryModuleId);
    if (!moduleEntry) {
      return { status: "RED", explanation: `Foundry module "${surface.foundryModuleId}" not found in module-registry.` };
    }
    const computed = computeModuleStatus(moduleEntry);
    if (computed.computedStatus !== "WIRED" && moduleEntry.status === "WIRED") {
      status = "RED";
      checks.push(`module ${surface.foundryModuleId} declares WIRED but computes ${computed.computedStatus}: ${computed.reason}`);
    } else if (computed.computedStatus !== "WIRED") {
      status = "AMBER";
      checks.push(`module ${surface.foundryModuleId} computes ${computed.computedStatus}: ${computed.reason}`);
    } else {
      checks.push(`module ${surface.foundryModuleId} WIRED`);
    }
  } else {
    status = "AMBER";
    checks.push("no Foundry module declared");
  }

  if (surface.engineId) {
    const engine = getEngine(surface.engineId);
    if (!engine) {
      return { status: "RED", explanation: `Engine "${surface.engineId}" not found in engine-registry.` };
    }
    if (engine.status !== "PRODUCTION_CALLABLE") {
      status = status === "RED" ? "RED" : "AMBER";
      checks.push(`engine ${surface.engineId} status ${engine.status}`);
    } else {
      checks.push(`engine ${surface.engineId} PRODUCTION_CALLABLE`);
    }
  } else {
    status = surface.foundryModuleId ? "AMBER" : status;
    checks.push("no engine declared");
  }

  if (surface.adapterId) {
    const adapter = getAdapter(surface.adapterId);
    if (!adapter) {
      return { status: "RED", explanation: `Adapter "${surface.adapterId}" not found in adapter-registry.` };
    }
    if (surface.engineId && adapter.engineId !== surface.engineId) {
      status = status === "RED" ? "RED" : "AMBER";
      checks.push(`adapter ${surface.adapterId} targets ${adapter.engineId}, not ${surface.engineId}`);
    } else {
      checks.push(`adapter ${surface.adapterId} registered`);
    }
  } else if (surface.engineId) {
    status = status === "RED" ? "RED" : "AMBER";
    checks.push("no adapter declared for engine");
  }

  if (checks.every((check) => check.startsWith("no "))) {
    return { status: "GREY", explanation: "No Foundry module, engine, or adapter declared." };
  }

  return { status, explanation: checks.join("; ") };
}

// ─── Rule 5: Lineage simulation chain status ─────────────────────────────────

export function checkLineageCoverage(surface: ProductLadderEntry): RuleResult {
  // Map surface to relevant lineage chain
  const chainMap: Record<string, LineageSimulationChainId> = {
    "executive-reporting": "executive-reporting",
    "strategy-room": "strategy-room",
    "boardroom-mode": "executive-report-boardroom",
    "outbound-linkedin": "outbound-publishing",
    "outbound-facebook": "outbound-publishing",
    "outbound-x": "outbound-publishing",
    "editorials": "content-editorial",
    "blog": "content-editorial",
    "shorts": "content-editorial",
    "briefs": "content-editorial",
    "gmi": "gmi-release",
    "fast-diagnostic": "foundry-research-run",
  };

  const chainId = chainMap[surface.id];
  if (!chainId) {
    return { status: "GREY", explanation: "No lineage simulation chain mapped for this surface." };
  }

  const result = simulateLineageChain(chainId);
  if (result.status === "COMPLETE") {
    return { status: "GREEN", explanation: `Lineage chain "${result.title}" is COMPLETE.` };
  }
  if (result.status === "PARTIAL") {
    return { status: "AMBER", explanation: `Lineage chain "${result.title}" is PARTIAL (${result.gaps.length} gap(s)).` };
  }
  return { status: "RED", explanation: `Lineage chain "${result.title}" is BROKEN (${result.gaps.length} gap(s)).` };
}

// ─── Rule 6: Governance event vocabulary coverage ────────────────────────────
//
// GREEN requires all declared events to be:
//   (a) registered in GOVERNANCE_EVENT_TYPES, AND
//   (b) not marked reserved — i.e. wired to the governance bus in live code.
//
// Reserved events are registered vocabulary but have no live governance bus
// emitter yet. Reserved ≠ live. Reserved ≠ integrated. Reserved ≠ durable.
// A surface that declares only reserved events has documented intent, not
// working coverage — it must not receive a GREEN from this rule.

export function checkGovernanceEvents(surface: ProductLadderEntry): RuleResult {
  if (surface.lineageEvents.length === 0 && surface.auditEvents.length === 0) {
    return { status: "GREY", explanation: "No governance events declared for this surface." };
  }

  const allEvents = [...new Set([...surface.lineageEvents, ...surface.auditEvents])];
  const missing = allEvents.filter((e) => !getEventType(e));
  const reservedEvents = allEvents.filter((e) => getEventType(e)?.reserved === true);

  if (missing.length === allEvents.length) {
    return { status: "RED", explanation: `None of ${allEvents.length} declared events found in governance-event-types.` };
  }
  if (missing.length > 0) {
    return {
      status: "AMBER",
      explanation: `${missing.length}/${allEvents.length} declared events not in governance-event-types: ${missing.join(", ")}.`,
    };
  }
  if (reservedEvents.length > 0) {
    return {
      status: "AMBER",
      explanation:
        `${reservedEvents.length}/${allEvents.length} declared event(s) are reserved — ` +
        `registered in vocabulary but governance bus wiring is pending: ${reservedEvents.join(", ")}. ` +
        `Reserved ≠ integrated.`,
    };
  }
  return {
    status: "GREEN",
    explanation: `All ${allEvents.length} declared events are registered and have live governance bus wiring.`,
  };
}

// ─── Rule 7: Entitlement declared for gated products ─────────────────────────

export function checkEntitlement(surface: ProductLadderEntry): RuleResult {
  if (surface.publicStatus === "PUBLIC" || surface.publicStatus === "ADMIN_ONLY" || surface.publicStatus === "RETIRED") {
    return { status: "GREY", explanation: "Public or retired — no entitlement required." };
  }
  if (!surface.entitlementRequired) {
    return { status: "RED", explanation: `Surface is ${surface.publicStatus} but no entitlementRequired declared.` };
  }
  return { status: "GREEN", explanation: `Entitlement: ${surface.entitlementRequired}.` };
}

// ─── Rule 8: Outbound eligibility declared ───────────────────────────────────

export function checkOutbound(surface: ProductLadderEntry): RuleResult {
  if (!surface.outboundEligible) {
    return { status: "GREY", explanation: "Not outbound-eligible." };
  }
  // Check that outbound governance events exist
  const outboundEvents = surface.lineageEvents.filter(
    (e) => e.startsWith("OUTBOUND_") || e.startsWith("CONTENT_OUTBOUND_"),
  );
  if (outboundEvents.length === 0) {
    return { status: "AMBER", explanation: "Outbound-eligible but no OUTBOUND_ lineage events declared." };
  }
  return { status: "GREEN", explanation: `Outbound-eligible with ${outboundEvents.length} outbound event(s).` };
}

// ─── Rule 9: Simulation-only events not treated as real export coverage ──────

export function checkSimulationOnlyEvents(surface: ProductLadderEntry): RuleResult {
  // Boardroom simulation events must not count as real export coverage
  const simOnlyEvents = surface.lineageEvents.filter(
    (e) => e.includes("SIMULATED") || e === "BOARDROOM_DOSSIER_PREVIEWED",
  );
  if (simOnlyEvents.length > 0) {
    return { status: "AMBER", explanation: `${simOnlyEvents.length} simulation-only event(s) present. These support Foundry/lineage readiness, not production export readiness.` };
  }
  return { status: "GREEN", explanation: "No simulation-only events — real export coverage expected." };
}

// ─── Rule 10: Boardroom delivery truth ───────────────────────────────────────
// A boardroom surface cannot be GREEN for delivery until:
// (a) Secure token delivery infrastructure is in place (not email-query-param), and
// (b) Source provenance is tracked (not MANUAL_SYNTHETIC_SAMPLE for real deliveries).
// This rule checks the declared lineage events for the secure-link signals.

export function checkBoardroomDeliveryTruth(surface: ProductLadderEntry): RuleResult {
  if (surface.surfaceType !== "boardroom") {
    return { status: "GREY", explanation: "Not a boardroom surface — delivery truth rule not applicable." };
  }

  const allEvents = [...new Set([...surface.lineageEvents, ...surface.auditEvents])];

  const hasSecureLinkCreated = allEvents.includes("BOARDROOM_SECURE_LINK_CREATED");
  const hasSecureLinkRevoked = allEvents.includes("BOARDROOM_SECURE_LINK_REVOKED");

  if (!hasSecureLinkCreated) {
    return {
      status: "RED",
      explanation:
        "Boardroom surface is missing BOARDROOM_SECURE_LINK_CREATED event. " +
        "Delivery via email-query-param is insecure and does not qualify as governed delivery.",
    };
  }

  if (!hasSecureLinkRevoked) {
    return {
      status: "AMBER",
      explanation:
        "BOARDROOM_SECURE_LINK_CREATED is declared but BOARDROOM_SECURE_LINK_REVOKED is missing. " +
        "Token revocation must be wired for full delivery governance.",
    };
  }

  return {
    status: "GREEN",
    explanation:
      "Boardroom secure token delivery is wired: BOARDROOM_SECURE_LINK_CREATED and BOARDROOM_SECURE_LINK_REVOKED declared.",
  };
}

// ─── Run all rules for a surface ─────────────────────────────────────────────

export function runAllRules(surfaceId: string): RuleResult[] {
  const surface = getProductLadderEntry(surfaceId);
  if (!surface) {
    return [{ status: "RED", explanation: `Surface "${surfaceId}" not found.` }];
  }

  return [
    checkProductSurfaceExists(surfaceId),
    checkProductRoute(surface),
    checkCanonicalRecord(surface),
    checkAdminOwner(surface),
    checkFoundryCoverage(surface),
    checkLineageCoverage(surface),
    checkGovernanceEvents(surface),
    checkEntitlement(surface),
    checkOutbound(surface),
    checkSimulationOnlyEvents(surface),
    checkBoardroomDeliveryTruth(surface),
  ];
}

// ─── Aggregate status ────────────────────────────────────────────────────────

export function aggregateStatus(results: RuleResult[]): { status: HealthStatus; explanation: string } {
  if (results.some((r) => r.status === "RED")) {
    const redCount = results.filter((r) => r.status === "RED").length;
    return { status: "RED", explanation: `${redCount} rule(s) failing.` };
  }
  if (results.some((r) => r.status === "AMBER")) {
    const amberCount = results.filter((r) => r.status === "AMBER").length;
    return { status: "AMBER", explanation: `${amberCount} rule(s) at amber.` };
  }
  if (results.every((r) => r.status === "GREY")) {
    return { status: "GREY", explanation: "All rules are not applicable." };
  }
  if (results.every((r) => r.status === "GREEN" || r.status === "GREY")) {
    return { status: "GREEN", explanation: "All applicable rules pass." };
  }
  return { status: "GREEN", explanation: "All rules pass." };
}
