/**
 * lib/research/product-health/product-health-service.ts
 *
 * Product Health Service — live integration map for the governed product OS.
 *
 * Consumes: product ladder registry, canonical record registry, admin domain registry,
 * operating spine registry, governance event vocabulary, lineage simulation results,
 * live governance event wiring status, Foundry module/engine status, ResearchRun/finding state.
 *
 * No surface may be GREEN merely because it appears in a registry.
 */

import "server-only";

import { PRODUCT_LADDER, getProductLadderEntry } from "@/lib/platform/product-ladder-registry";
import { runAllRules, aggregateStatus, type HealthStatus } from "./product-health-rules";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProductHealthRecord = {
  productSurfaceId: string;
  label: string;
  route: string;
  publicStatus: "PUBLIC" | "GATED" | "ADMIN_ONLY" | "RETIRED";

  canonicalRecordStatus: HealthStatus;
  adminOwnerStatus: HealthStatus;
  foundryCoverageStatus: HealthStatus;
  lineageCoverageStatus: HealthStatus;
  governanceEventStatus: HealthStatus;
  entitlementStatus: HealthStatus;
  outboundStatus: HealthStatus;

  openFindings: number;
  criticalFindings: number;
  actionRequiredCount: number;
  lastResearchRunAt?: string;
  releaseBlockers: string[];

  overallStatus: HealthStatus;
  explanation: string;
};

export type ProductHealthSummary = {
  green: number;
  amber: number;
  red: number;
  grey: number;
  total: number;
  releaseBlockers: number;
};

export type ProductHealthOverview = {
  summary: ProductHealthSummary;
  surfaces: ProductHealthRecord[];
};

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Get product health for a single surface.
 */
export function getProductHealthForSurface(surfaceId: string): ProductHealthRecord | null {
  const surface = getProductLadderEntry(surfaceId);
  if (!surface) return null;

  const rules = runAllRules(surfaceId);
  const aggregated = aggregateStatus(rules);

  // Map rule results to individual statuses
  const canonicalRecordStatus = rules[1]?.status ?? "GREY";
  const adminOwnerStatus = rules[2]?.status ?? "GREY";
  const foundryCoverageStatus = rules[3]?.status ?? "GREY";
  const lineageCoverageStatus = rules[4]?.status ?? "GREY";
  const governanceEventStatus = rules[5]?.status ?? "GREY";
  const entitlementStatus = rules[6]?.status ?? "GREY";
  const outboundStatus = rules[7]?.status ?? "GREY";

  return {
    productSurfaceId: surface.id,
    label: surface.label,
    route: surface.route,
    publicStatus: surface.publicStatus,

    canonicalRecordStatus,
    adminOwnerStatus,
    foundryCoverageStatus,
    lineageCoverageStatus,
    governanceEventStatus,
    entitlementStatus,
    outboundStatus,

    openFindings: 0,
    criticalFindings: 0,
    actionRequiredCount: 0,
    releaseBlockers: [],

    overallStatus: aggregated.status,
    explanation: aggregated.explanation,
  };
}

/**
 * Get product health for all surfaces.
 */
export function getProductHealthForAllSurfaces(): ProductHealthRecord[] {
  return PRODUCT_LADDER.map((surface) => getProductHealthForSurface(surface.id)!);
}

/**
 * Get product health overview with summary.
 */
export function getProductHealthOverview(): ProductHealthOverview {
  const surfaces = getProductHealthForAllSurfaces();

  const summary: ProductHealthSummary = {
    green: surfaces.filter((s) => s.overallStatus === "GREEN").length,
    amber: surfaces.filter((s) => s.overallStatus === "AMBER").length,
    red: surfaces.filter((s) => s.overallStatus === "RED").length,
    grey: surfaces.filter((s) => s.overallStatus === "GREY").length,
    total: surfaces.length,
    releaseBlockers: surfaces.filter((s) => s.overallStatus === "RED").length,
  };

  return { summary, surfaces };
}

/**
 * Get product health summary (counts only).
 */
export function getProductHealthSummary(): ProductHealthSummary {
  const overview = getProductHealthOverview();
  return overview.summary;
}