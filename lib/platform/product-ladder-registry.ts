/**
 * lib/platform/product-ladder-registry.ts
 *
 * Canonical product ladder — one governed sequence from public content
 * through diagnostics, reports, rooms, boardroom, enterprise, and outbound.
 *
 * Every product surface must answer:
 * - What record does it create?
 * - What admin surface sees it?
 * - What Foundry module can test it?
 * - What audit/lineage event does it emit?
 * - What entitlement governs it?
 * - What outbound/content pathway can surface it?
 * - What ResearchRun can improve it?
 * - What happens if it fails?
 */

export type SurfaceType =
  | "content"
  | "diagnostic"
  | "report"
  | "room"
  | "boardroom"
  | "enterprise"
  | "intelligence"
  | "outbound";

export type CanonicalRecordType =
  | "ContentAsset"
  | "DiagnosticRun"
  | "ExecutiveReport"
  | "StrategyRoomCase"
  | "BoardroomDossier"
  | "EnterpriseCampaign"
  | "GmiRelease"
  | "OutboundPost"
  | "ResearchRun"
  | "FoundryFinding"
  | "DecisionActionLog"
  | "ActionBrief"
  | "AccessGrant"
  | "Entitlement"
  | "AuditEvent"
  | "LineageEvent";

export type PublicStatus = "PUBLIC" | "GATED" | "ADMIN_ONLY" | "RETIRED";

export type ProductLadderEntry = {
  id: string;
  label: string;
  route: string;
  surfaceType: SurfaceType;
  canonicalRecord: CanonicalRecordType;
  entitlementRequired?: string;
  adminOwnerSurface: string;
  foundryModuleId?: string;
  engineId?: string;
  adapterId?: string;
  lineageEvents: string[];
  auditEvents: string[];
  outboundEligible: boolean;
  publicStatus: PublicStatus;
};

export const PRODUCT_LADDER: ProductLadderEntry[] = [
  // ── 1. Public content surfaces ──────────────────────────────────────────
  {
    id: "editorials",
    label: "Editorials",
    route: "/editorials",
    surfaceType: "content",
    canonicalRecord: "ContentAsset",
    adminOwnerSurface: "/admin/content",
    foundryModuleId: "content-category-lab",
    engineId: "editorial-style-checker",
    adapterId: "editorial-style-checker",
    lineageEvents: ["CONTENT_PUBLISHED", "CONTENT_UPDATED", "CONTENT_ARCHIVED"],
    auditEvents: ["CONTENT_PUBLISHED", "CONTENT_UPDATED"],
    outboundEligible: true,
    publicStatus: "PUBLIC",
  },
  {
    id: "blog",
    label: "Blog / Essays",
    route: "/blog",
    surfaceType: "content",
    canonicalRecord: "ContentAsset",
    adminOwnerSurface: "/admin/content",
    foundryModuleId: "content-category-lab",
    engineId: "editorial-style-checker",
    adapterId: "editorial-style-checker",
    lineageEvents: ["CONTENT_PUBLISHED", "CONTENT_UPDATED", "CONTENT_ARCHIVED"],
    auditEvents: ["CONTENT_PUBLISHED", "CONTENT_UPDATED"],
    outboundEligible: true,
    publicStatus: "PUBLIC",
  },
  {
    id: "shorts",
    label: "Shorts",
    route: "/shorts",
    surfaceType: "content",
    canonicalRecord: "ContentAsset",
    adminOwnerSurface: "/admin/content",
    foundryModuleId: "content-category-lab",
    engineId: "editorial-style-checker",
    adapterId: "editorial-style-checker",
    lineageEvents: ["CONTENT_PUBLISHED", "CONTENT_UPDATED"],
    auditEvents: ["CONTENT_PUBLISHED"],
    outboundEligible: true,
    publicStatus: "PUBLIC",
  },
  {
    id: "briefs",
    label: "Briefs",
    route: "/briefs",
    surfaceType: "content",
    canonicalRecord: "ContentAsset",
    adminOwnerSurface: "/admin/content",
    foundryModuleId: "content-red-team",
    engineId: "editorial-style-checker",
    adapterId: "editorial-style-checker",
    lineageEvents: ["CONTENT_PUBLISHED", "CONTENT_UPDATED"],
    auditEvents: ["CONTENT_PUBLISHED"],
    outboundEligible: false,
    publicStatus: "PUBLIC",
  },
  {
    id: "canon",
    label: "Canon",
    route: "/canon",
    surfaceType: "content",
    canonicalRecord: "ContentAsset",
    adminOwnerSurface: "/admin/content",
    foundryModuleId: undefined,
    engineId: undefined,
    adapterId: undefined,
    lineageEvents: ["CONTENT_PUBLISHED", "CONTENT_UPDATED"],
    auditEvents: ["CONTENT_PUBLISHED"],
    outboundEligible: false,
    publicStatus: "PUBLIC",
  },

  // ── 2. Free/entry diagnostics ──────────────────────────────────────────
  {
    id: "fast-diagnostic",
    label: "Fast Diagnostic",
    route: "/diagnostic",
    surfaceType: "diagnostic",
    canonicalRecord: "DiagnosticRun",
    adminOwnerSurface: "/admin/intelligence-foundry/simulation/fast-diagnostic",
    foundryModuleId: "fast-diagnostic-sim",
    engineId: "fast-diagnostic",
    adapterId: "fast-diagnostic",
    lineageEvents: ["DIAGNOSTIC_STARTED", "DIAGNOSTIC_COMPLETED", "DIAGNOSTIC_REVIEWED"],
    auditEvents: ["DIAGNOSTIC_COMPLETED"],
    outboundEligible: false,
    publicStatus: "PUBLIC",
  },
  {
    id: "purpose-alignment",
    label: "Purpose Alignment",
    route: "/purpose-alignment",
    surfaceType: "diagnostic",
    canonicalRecord: "DiagnosticRun",
    adminOwnerSurface: "/admin/intelligence-foundry/simulation/fast-diagnostic",
    foundryModuleId: "fast-diagnostic-sim",
    engineId: "purpose-alignment",
    adapterId: undefined,
    lineageEvents: ["PURPOSE_ALIGNMENT_STARTED", "PURPOSE_ALIGNMENT_COMPLETED"],
    auditEvents: ["PURPOSE_ALIGNMENT_COMPLETED"],
    outboundEligible: false,
    publicStatus: "GATED",
  },
  {
    id: "constitutional-diagnostic",
    label: "Constitutional Diagnostic",
    route: "/diagnostics/constitutional-diagnostic",
    surfaceType: "diagnostic",
    canonicalRecord: "DiagnosticRun",
    adminOwnerSurface: "/admin/intelligence-foundry/simulation/constitutional-diagnostic",
    foundryModuleId: undefined,
    engineId: "constitutional-diagnostic",
    adapterId: "constitutional-diagnostic",
    lineageEvents: ["CONSTITUTIONAL_STARTED", "CONSTITUTIONAL_COMPLETED"],
    auditEvents: ["CONSTITUTIONAL_COMPLETED"],
    outboundEligible: false,
    publicStatus: "GATED",
  },

  // ── 3. Executive Reporting ──────────────────────────────────────────────
  {
    id: "executive-reporting",
    label: "Executive Reporting",
    route: "/admin/reporting/executive",
    surfaceType: "report",
    canonicalRecord: "ExecutiveReport",
    entitlementRequired: "professional",
    adminOwnerSurface: "/admin/reporting/executive",
    foundryModuleId: "executive-reporting-sim",
    engineId: "executive-reporting",
    adapterId: "executive-reporting",
    lineageEvents: [
      "EXECUTIVE_REPORT_STARTED",
      "EXECUTIVE_REPORT_GENERATED",
      "EXECUTIVE_REPORT_REVIEWED",
      "EXECUTIVE_REPORT_EXPORTED",
      "EXECUTIVE_REPORT_REVOKED",
    ],
    auditEvents: [
      "EXECUTIVE_REPORT_GENERATED",
      "EXECUTIVE_REPORT_EXPORTED",
      "EXECUTIVE_REPORT_REVOKED",
    ],
    outboundEligible: false,
    publicStatus: "GATED",
  },

  // ── 4. Strategy Room ────────────────────────────────────────────────────
  {
    id: "strategy-room",
    label: "Strategy Room",
    route: "/strategy-room",
    surfaceType: "room",
    canonicalRecord: "StrategyRoomCase",
    entitlementRequired: "professional",
    adminOwnerSurface: "/admin/strategy-room",
    foundryModuleId: "strategy-room-sim",
    engineId: "strategy-room",
    adapterId: "strategy-room",
    lineageEvents: [
      "STRATEGY_ROOM_CASE_OPENED",
      "EVIDENCE_REVIEWED",
      "DIRECTIVE_DERIVED",
      "ESCALATION_TRIGGERED",
      "ACTION_REQUIRED",
    ],
    auditEvents: [
      "STRATEGY_ROOM_CASE_OPENED",
      "DIRECTIVE_DERIVED",
      "ESCALATION_TRIGGERED",
    ],
    outboundEligible: false,
    publicStatus: "GATED",
  },

  // ── 5. Boardroom Mode ───────────────────────────────────────────────────
  {
    id: "boardroom-mode",
    label: "Boardroom Mode",
    route: "/boardroom",
    surfaceType: "boardroom",
    canonicalRecord: "BoardroomDossier",
    entitlementRequired: "enterprise",
    adminOwnerSurface: "/admin/intelligence-foundry/simulation/boardroom-mode",
    foundryModuleId: "boardroom-mode-sim",
    engineId: "boardroom-dossier",
    adapterId: "boardroom-dossier",
    lineageEvents: [
      "BOARDROOM_QUALIFICATION_EVALUATED",
      "BOARDROOM_DOSSIER_GENERATED",
      "BOARDROOM_DOSSIER_EXPORTED",
      "BOARDROOM_DOSSIER_REVIEWED",
    ],
    auditEvents: [
      "BOARDROOM_DOSSIER_GENERATED",
      "BOARDROOM_DOSSIER_EXPORTED",
    ],
    outboundEligible: false,
    publicStatus: "GATED",
  },

  // ── 6. Enterprise Decision Authority ────────────────────────────────────
  {
    id: "enterprise-decision-authority",
    label: "Enterprise Decision Authority",
    route: "/enterprise-decision-authority",
    surfaceType: "enterprise",
    canonicalRecord: "EnterpriseCampaign",
    entitlementRequired: "enterprise",
    adminOwnerSurface: "/admin/enterprise",
    foundryModuleId: undefined,
    engineId: "enterprise-decision-authority",
    adapterId: undefined,
    lineageEvents: [
      "ENTERPRISE_CAMPAIGN_CREATED",
      "ENTERPRISE_CAMPAIGN_EXECUTED",
      "ENTERPRISE_CAMPAIGN_COMPLETED",
    ],
    auditEvents: [
      "ENTERPRISE_CAMPAIGN_CREATED",
      "ENTERPRISE_CAMPAIGN_EXECUTED",
    ],
    outboundEligible: false,
    publicStatus: "GATED",
  },

  // ── 7. GMI / Market Intelligence ────────────────────────────────────────
  {
    id: "gmi",
    label: "Global Market Intelligence",
    route: "/intelligence/market",
    surfaceType: "intelligence",
    canonicalRecord: "GmiRelease",
    entitlementRequired: "enterprise",
    adminOwnerSurface: "/admin/intelligence/gmi-release-console",
    foundryModuleId: undefined,
    engineId: "gmi",
    adapterId: undefined,
    lineageEvents: [
      "GMI_RELEASE_DRAFTED",
      "GMI_RELEASE_REVIEWED",
      "GMI_RELEASE_PUBLISHED",
    ],
    auditEvents: [
      "GMI_RELEASE_REVIEWED",
      "GMI_RELEASE_PUBLISHED",
    ],
    outboundEligible: false,
    publicStatus: "GATED",
  },

  // ── 8. Outbound Publishing ──────────────────────────────────────────────
  {
    id: "outbound-linkedin",
    label: "LinkedIn Publishing",
    route: "/admin/outbound/linkedin",
    surfaceType: "outbound",
    canonicalRecord: "OutboundPost",
    adminOwnerSurface: "/admin/outbound/linkedin",
    foundryModuleId: "outbound-narrative-range",
    engineId: "outbound-policy-gate",
    adapterId: "outbound-policy-gate",
    lineageEvents: [
      "OUTBOUND_DRAFT_CREATED",
      "OUTBOUND_POLICY_CHECKED",
      "OUTBOUND_APPROVED",
      "OUTBOUND_PUBLISHED",
      "OUTBOUND_SYNCED",
      "OUTBOUND_FAILED",
    ],
    auditEvents: [
      "OUTBOUND_APPROVED",
      "OUTBOUND_PUBLISHED",
      "OUTBOUND_FAILED",
    ],
    outboundEligible: true,
    publicStatus: "ADMIN_ONLY",
  },
  {
    id: "outbound-facebook",
    label: "Facebook Publishing",
    route: "/admin/outbound/facebook",
    surfaceType: "outbound",
    canonicalRecord: "OutboundPost",
    adminOwnerSurface: "/admin/outbound/facebook",
    foundryModuleId: "outbound-narrative-range",
    engineId: "outbound-policy-gate",
    adapterId: "outbound-policy-gate",
    lineageEvents: [
      "OUTBOUND_DRAFT_CREATED",
      "OUTBOUND_POLICY_CHECKED",
      "OUTBOUND_APPROVED",
      "OUTBOUND_PUBLISHED",
      "OUTBOUND_SYNCED",
      "OUTBOUND_FAILED",
    ],
    auditEvents: [
      "OUTBOUND_APPROVED",
      "OUTBOUND_PUBLISHED",
      "OUTBOUND_FAILED",
    ],
    outboundEligible: true,
    publicStatus: "ADMIN_ONLY",
  },
  {
    id: "outbound-x",
    label: "X Publishing",
    route: "/admin/outbound/x",
    surfaceType: "outbound",
    canonicalRecord: "OutboundPost",
    adminOwnerSurface: "/admin/outbound/x",
    foundryModuleId: "outbound-narrative-range",
    engineId: "outbound-policy-gate",
    adapterId: "outbound-policy-gate",
    lineageEvents: [
      "OUTBOUND_DRAFT_CREATED",
      "OUTBOUND_POLICY_CHECKED",
      "OUTBOUND_APPROVED",
      "OUTBOUND_PUBLISHED",
      "OUTBOUND_SYNCED",
      "OUTBOUND_FAILED",
    ],
    auditEvents: [
      "OUTBOUND_APPROVED",
      "OUTBOUND_PUBLISHED",
      "OUTBOUND_FAILED",
    ],
    outboundEligible: true,
    publicStatus: "ADMIN_ONLY",
  },
];

export function getProductLadderEntry(id: string): ProductLadderEntry | undefined {
  return PRODUCT_LADDER.find((e) => e.id === id);
}

export function getSurfacesByType(type: SurfaceType): ProductLadderEntry[] {
  return PRODUCT_LADDER.filter((e) => e.surfaceType === type);
}

export function getSurfacesByFoundryModule(moduleId: string): ProductLadderEntry[] {
  return PRODUCT_LADDER.filter((e) => e.foundryModuleId === moduleId);
}

export function getSurfacesByEngine(engineId: string): ProductLadderEntry[] {
  return PRODUCT_LADDER.filter((e) => e.engineId === engineId);
}

export function getSurfacesByAdapter(adapterId: string): ProductLadderEntry[] {
  return PRODUCT_LADDER.filter((e) => e.adapterId === adapterId);
}
