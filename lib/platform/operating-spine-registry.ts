/**
 * lib/platform/operating-spine-registry.ts
 *
 * Core Operating Spine — maps the full lifecycle from user-facing product action
 * through to audit, Foundry testability, and action/escalation.
 *
 * Every product surface must be traceable through this spine.
 */

import type { AdminDomain } from "./admin-domain-registry";
import type { CanonicalRecordType, SurfaceType, PublicStatus } from "./product-ladder-registry";

export type SpineStage =
  | "user_action"
  | "product_event"
  | "canonical_record"
  | "access_state"
  | "audit_event"
  | "lineage_event"
  | "admin_visibility"
  | "foundry_testability"
  | "action_escalation";

export type OperatingSpineEntry = {
  surfaceId: string;
  surfaceLabel: string;
  surfaceType: SurfaceType;
  publicStatus: PublicStatus;
  canonicalRecord: CanonicalRecordType;
  adminDomain: AdminDomain;
  adminRoute: string;
  foundryModuleId?: string;
  engineId?: string;
  adapterId?: string;
  emitsAudit: boolean;
  emitsLineage: boolean;
  entitlementGated: boolean;
  outboundEligible: boolean;
  canCreateResearchRun: boolean;
};

export const OPERATING_SPINE: OperatingSpineEntry[] = [
  {
    surfaceId: "editorials",
    surfaceLabel: "Editorials",
    surfaceType: "content",
    publicStatus: "PUBLIC",
    canonicalRecord: "ContentAsset",
    adminDomain: "content",
    adminRoute: "/admin/content",
    foundryModuleId: "content-category-lab",
    engineId: "editorial-style-checker",
    adapterId: "editorial-style-checker",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: false,
    outboundEligible: true,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "blog",
    surfaceLabel: "Blog / Essays",
    surfaceType: "content",
    publicStatus: "PUBLIC",
    canonicalRecord: "ContentAsset",
    adminDomain: "content",
    adminRoute: "/admin/content",
    foundryModuleId: "content-category-lab",
    engineId: "editorial-style-checker",
    adapterId: "editorial-style-checker",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: false,
    outboundEligible: true,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "shorts",
    surfaceLabel: "Shorts",
    surfaceType: "content",
    publicStatus: "PUBLIC",
    canonicalRecord: "ContentAsset",
    adminDomain: "content",
    adminRoute: "/admin/content",
    foundryModuleId: "content-category-lab",
    engineId: "editorial-style-checker",
    adapterId: "editorial-style-checker",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: false,
    outboundEligible: true,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "briefs",
    surfaceLabel: "Briefs",
    surfaceType: "content",
    publicStatus: "PUBLIC",
    canonicalRecord: "ContentAsset",
    adminDomain: "content",
    adminRoute: "/admin/content",
    foundryModuleId: "content-red-team",
    engineId: "editorial-style-checker",
    adapterId: "editorial-style-checker",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: false,
    outboundEligible: false,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "canon",
    surfaceLabel: "Canon",
    surfaceType: "content",
    publicStatus: "PUBLIC",
    canonicalRecord: "ContentAsset",
    adminDomain: "content",
    adminRoute: "/admin/content",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: false,
    outboundEligible: false,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "fast-diagnostic",
    surfaceLabel: "Fast Diagnostic",
    surfaceType: "diagnostic",
    publicStatus: "PUBLIC",
    canonicalRecord: "DiagnosticRun",
    adminDomain: "foundry",
    adminRoute: "/admin/intelligence-foundry/simulation/fast-diagnostic",
    foundryModuleId: "fast-diagnostic-sim",
    engineId: "fast-diagnostic",
    adapterId: "fast-diagnostic",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: false,
    outboundEligible: false,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "purpose-alignment",
    surfaceLabel: "Purpose Alignment",
    surfaceType: "diagnostic",
    publicStatus: "GATED",
    canonicalRecord: "DiagnosticRun",
    adminDomain: "foundry",
    adminRoute: "/admin/intelligence-foundry/simulation/fast-diagnostic",
    foundryModuleId: "fast-diagnostic-sim",
    engineId: "purpose-alignment",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: true,
    outboundEligible: false,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "constitutional-diagnostic",
    surfaceLabel: "Constitutional Diagnostic",
    surfaceType: "diagnostic",
    publicStatus: "GATED",
    canonicalRecord: "DiagnosticRun",
    adminDomain: "foundry",
    adminRoute: "/admin/intelligence-foundry/simulation/constitutional-diagnostic",
    engineId: "constitutional-diagnostic",
    adapterId: "constitutional-diagnostic",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: true,
    outboundEligible: false,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "executive-reporting",
    surfaceLabel: "Executive Reporting",
    surfaceType: "report",
    publicStatus: "GATED",
    canonicalRecord: "ExecutiveReport",
    adminDomain: "product-operations",
    adminRoute: "/admin/reporting/executive",
    foundryModuleId: "executive-reporting-sim",
    engineId: "executive-reporting",
    adapterId: "executive-reporting",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: true,
    outboundEligible: false,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "strategy-room",
    surfaceLabel: "Strategy Room",
    surfaceType: "room",
    publicStatus: "GATED",
    canonicalRecord: "StrategyRoomCase",
    adminDomain: "product-operations",
    adminRoute: "/admin/strategy-room",
    foundryModuleId: "strategy-room-sim",
    engineId: "strategy-room",
    adapterId: "strategy-room",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: true,
    outboundEligible: false,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "boardroom-mode",
    surfaceLabel: "Boardroom Mode",
    surfaceType: "boardroom",
    publicStatus: "GATED",
    canonicalRecord: "BoardroomDossier",
    adminDomain: "product-operations",
    adminRoute: "/admin/intelligence-foundry/simulation/boardroom-mode",
    foundryModuleId: "boardroom-mode-sim",
    engineId: "boardroom-dossier",
    adapterId: "boardroom-dossier",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: true,
    outboundEligible: false,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "enterprise-decision-authority",
    surfaceLabel: "Enterprise Decision Authority",
    surfaceType: "enterprise",
    publicStatus: "GATED",
    canonicalRecord: "EnterpriseCampaign",
    adminDomain: "product-operations",
    adminRoute: "/admin/enterprise",
    engineId: "enterprise-decision-authority",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: true,
    outboundEligible: false,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "gmi",
    surfaceLabel: "Global Market Intelligence",
    surfaceType: "intelligence",
    publicStatus: "GATED",
    canonicalRecord: "GmiRelease",
    adminDomain: "intelligence",
    adminRoute: "/admin/intelligence/gmi-release-console",
    engineId: "gmi",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: true,
    outboundEligible: false,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "outbound-linkedin",
    surfaceLabel: "LinkedIn Publishing",
    surfaceType: "outbound",
    publicStatus: "ADMIN_ONLY",
    canonicalRecord: "OutboundPost",
    adminDomain: "outbound",
    adminRoute: "/admin/outbound/linkedin",
    foundryModuleId: "outbound-narrative-range",
    engineId: "outbound-policy-gate",
    adapterId: "outbound-policy-gate",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: false,
    outboundEligible: true,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "outbound-facebook",
    surfaceLabel: "Facebook Publishing",
    surfaceType: "outbound",
    publicStatus: "ADMIN_ONLY",
    canonicalRecord: "OutboundPost",
    adminDomain: "outbound",
    adminRoute: "/admin/outbound/facebook",
    foundryModuleId: "outbound-narrative-range",
    engineId: "outbound-policy-gate",
    adapterId: "outbound-policy-gate",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: false,
    outboundEligible: true,
    canCreateResearchRun: true,
  },
  {
    surfaceId: "outbound-x",
    surfaceLabel: "X Publishing",
    surfaceType: "outbound",
    publicStatus: "ADMIN_ONLY",
    canonicalRecord: "OutboundPost",
    adminDomain: "outbound",
    adminRoute: "/admin/outbound/x",
    foundryModuleId: "outbound-narrative-range",
    engineId: "outbound-policy-gate",
    adapterId: "outbound-policy-gate",
    emitsAudit: true,
    emitsLineage: true,
    entitlementGated: false,
    outboundEligible: true,
    canCreateResearchRun: true,
  },
];

export function getSpineEntry(surfaceId: string): OperatingSpineEntry | undefined {
  return OPERATING_SPINE.find((e) => e.surfaceId === surfaceId);
}

export function getSpineEntriesByDomain(domain: AdminDomain): OperatingSpineEntry[] {
  return OPERATING_SPINE.filter((e) => e.adminDomain === domain);
}

export function getSpineEntriesByFoundryModule(moduleId: string): OperatingSpineEntry[] {
  return OPERATING_SPINE.filter((e) => e.foundryModuleId === moduleId);
}

export function getOrphanedSurfaces(): OperatingSpineEntry[] {
  return OPERATING_SPINE.filter((e) => !e.foundryModuleId || !e.adminRoute);
}
