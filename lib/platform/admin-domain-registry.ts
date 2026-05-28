/**
 * lib/platform/admin-domain-registry.ts
 *
 * Admin Operating Structure — the admin area is an Operator Console
 * with clear domains, not a list of admin pages.
 *
 * Each admin route declares its domain, required role, product surface,
 * canonical record, risk level, and audit requirement.
 */

export type AdminDomain =
  | "command"
  | "product-operations"
  | "foundry"
  | "content"
  | "outbound"
  | "access"
  | "audit"
  | "intelligence";

export type AdminRole = "ADMIN" | "OWNER";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AdminRouteEntry = {
  route: string;
  domain: AdminDomain;
  requiredRole: AdminRole;
  productSurface?: string;
  canonicalRecord?: string;
  riskLevel: RiskLevel;
  emitsAudit: boolean;
};

export const ADMIN_ROUTES: AdminRouteEntry[] = [
  // ── Command Centre ──────────────────────────────────────────────────────
  { route: "/admin", domain: "command", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/operator", domain: "command", requiredRole: "ADMIN", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/command-wall", domain: "command", requiredRole: "ADMIN", riskLevel: "CRITICAL", emitsAudit: true },
  { route: "/admin/command", domain: "command", requiredRole: "ADMIN", riskLevel: "CRITICAL", emitsAudit: true },
  { route: "/admin/authority-center", domain: "command", requiredRole: "ADMIN", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/product-surfaces", domain: "command", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },

  // ── Product Operations ──────────────────────────────────────────────────
  { route: "/admin/reporting/executive", domain: "product-operations", requiredRole: "ADMIN", productSurface: "executive-reporting", canonicalRecord: "ExecutiveReport", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/reports", domain: "product-operations", requiredRole: "ADMIN", productSurface: "executive-reporting", canonicalRecord: "ExecutiveReport", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/reporting/lineage", domain: "product-operations", requiredRole: "ADMIN", canonicalRecord: "LineageEvent", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/strategy-room", domain: "product-operations", requiredRole: "ADMIN", productSurface: "strategy-room", canonicalRecord: "StrategyRoomCase", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/enterprise", domain: "product-operations", requiredRole: "OWNER", productSurface: "enterprise-decision-authority", canonicalRecord: "EnterpriseCampaign", riskLevel: "CRITICAL", emitsAudit: true },
  { route: "/admin/campaign", domain: "product-operations", requiredRole: "ADMIN", canonicalRecord: "EnterpriseCampaign", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/calibration", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/institutional-analytics", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },

  // ── Intelligence Foundry ────────────────────────────────────────────────
  { route: "/admin/intelligence-foundry", domain: "foundry", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/intelligence-foundry/runs", domain: "foundry", requiredRole: "ADMIN", canonicalRecord: "ResearchRun", riskLevel: "MEDIUM", emitsAudit: true },
  { route: "/admin/intelligence-foundry/scenario", domain: "foundry", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/intelligence-foundry/simulation/fast-diagnostic", domain: "foundry", requiredRole: "ADMIN", productSurface: "fast-diagnostic", canonicalRecord: "DiagnosticRun", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/intelligence-foundry/simulation/executive-reporting", domain: "foundry", requiredRole: "ADMIN", productSurface: "executive-reporting", canonicalRecord: "ExecutiveReport", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/intelligence-foundry/simulation/boardroom-mode", domain: "foundry", requiredRole: "ADMIN", productSurface: "boardroom-mode", canonicalRecord: "BoardroomDossier", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/intelligence-foundry/simulation/executive-report-boardroom-bridge", domain: "foundry", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/intelligence-foundry/simulation/strategy-room", domain: "foundry", requiredRole: "ADMIN", productSurface: "strategy-room", canonicalRecord: "StrategyRoomCase", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/intelligence-foundry/engines", domain: "foundry", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/intelligence-foundry/performance", domain: "foundry", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/intelligence-foundry/chaos", domain: "foundry", requiredRole: "OWNER", riskLevel: "CRITICAL", emitsAudit: true },
  { route: "/admin/intelligence-foundry/data-poisoning", domain: "foundry", requiredRole: "OWNER", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/intelligence-foundry/health", domain: "foundry", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/intelligence-foundry/trash-day", domain: "foundry", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: true },
  { route: "/admin/intelligence-foundry/red-team/content", domain: "foundry", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/intelligence-foundry/red-team/security", domain: "foundry", requiredRole: "OWNER", riskLevel: "CRITICAL", emitsAudit: true },
  { route: "/admin/intelligence-foundry/outbound", domain: "foundry", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/intelligence-foundry/product-health", domain: "foundry", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },

  // ── Content & Editorial ─────────────────────────────────────────────────
  { route: "/admin/content", domain: "content", requiredRole: "ADMIN", canonicalRecord: "ContentAsset", riskLevel: "MEDIUM", emitsAudit: true },
  { route: "/admin/content-vault", domain: "content", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },

  // ── Outbound Publishing ─────────────────────────────────────────────────
  { route: "/admin/outbound/linkedin", domain: "outbound", requiredRole: "ADMIN", productSurface: "outbound-linkedin", canonicalRecord: "OutboundPost", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/outbound/facebook", domain: "outbound", requiredRole: "ADMIN", productSurface: "outbound-facebook", canonicalRecord: "OutboundPost", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/outbound/x", domain: "outbound", requiredRole: "ADMIN", productSurface: "outbound-x", canonicalRecord: "OutboundPost", riskLevel: "HIGH", emitsAudit: true },

  // ── Access & Entitlements ───────────────────────────────────────────────
  { route: "/admin/access", domain: "access", requiredRole: "OWNER", canonicalRecord: "AccessGrant", riskLevel: "CRITICAL", emitsAudit: true },
  { route: "/admin/users", domain: "access", requiredRole: "OWNER", canonicalRecord: "Entitlement", riskLevel: "CRITICAL", emitsAudit: true },

  // ── Audit & Lineage ─────────────────────────────────────────────────────
  { route: "/admin/audit", domain: "audit", requiredRole: "OWNER", canonicalRecord: "AuditEvent", riskLevel: "HIGH", emitsAudit: false },
  { route: "/admin/reporting/lineage", domain: "audit", requiredRole: "ADMIN", canonicalRecord: "LineageEvent", riskLevel: "MEDIUM", emitsAudit: false },

  // ── Decision Intelligence ───────────────────────────────────────────────
  { route: "/admin/decision-intelligence", domain: "intelligence", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/intelligence", domain: "intelligence", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/intelligence/gmi-release-console", domain: "intelligence", requiredRole: "ADMIN", productSurface: "gmi", canonicalRecord: "GmiRelease", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/intelligence/gmi-signal-monitor", domain: "intelligence", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/intelligence/gmi-event-log", domain: "intelligence", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/decision/efficacy", domain: "intelligence", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/decision/governance", domain: "intelligence", requiredRole: "ADMIN", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/decision/performance", domain: "intelligence", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/decision/metadata-audit", domain: "intelligence", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },

  // ── Retained Oversight ──────────────────────────────────────────────────
  { route: "/admin/retained-cadence", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: true },
  { route: "/admin/retainer-readiness", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/oversight-review", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/outcome-ledger", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/suppression-ledger", domain: "product-operations", requiredRole: "OWNER", riskLevel: "CRITICAL", emitsAudit: true },

  // ── Delivery & Proof ────────────────────────────────────────────────────
  { route: "/admin/report-state", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/delivery-queue", domain: "product-operations", requiredRole: "ADMIN", canonicalRecord: "LineageEvent", riskLevel: "MEDIUM", emitsAudit: true },
  { route: "/admin/proof", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/outcome-verification", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: true },
  { route: "/admin/pdf-dashboard", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/pdf-status", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/boardroom-delivery", domain: "product-operations", requiredRole: "ADMIN", productSurface: "boardroom-mode", canonicalRecord: "BoardroomDossier", riskLevel: "CRITICAL", emitsAudit: true },
  { route: "/admin/boardroom-archive", domain: "product-operations", requiredRole: "ADMIN", canonicalRecord: "BoardroomDossier", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/counsel-review", domain: "audit", requiredRole: "ADMIN", riskLevel: "HIGH", emitsAudit: true },

  // ── Campaigns & Organisations ───────────────────────────────────────────
  { route: "/admin/campaigns", domain: "product-operations", requiredRole: "ADMIN", canonicalRecord: "EnterpriseCampaign", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/campaigns/new", domain: "product-operations", requiredRole: "ADMIN", canonicalRecord: "EnterpriseCampaign", riskLevel: "MEDIUM", emitsAudit: true },
  { route: "/admin/organisations", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/organisations/new", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: true },
  { route: "/admin/enterprise-pipeline", domain: "product-operations", requiredRole: "ADMIN", productSurface: "enterprise-decision-authority", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/enterprise-foundation", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/snapshot", domain: "product-operations", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/commercial", domain: "access", requiredRole: "ADMIN", canonicalRecord: "Entitlement", riskLevel: "HIGH", emitsAudit: true },

  // ── Content & Canon ─────────────────────────────────────────────────────
  { route: "/admin/assets", domain: "content", requiredRole: "ADMIN", canonicalRecord: "ContentAsset", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/inner-circle", domain: "access", requiredRole: "OWNER", canonicalRecord: "AccessGrant", riskLevel: "HIGH", emitsAudit: true },

  // ── Outbound (index & scheduler) ────────────────────────────────────────
  { route: "/admin/outbound", domain: "outbound", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/outbound/scheduler", domain: "outbound", requiredRole: "OWNER", riskLevel: "HIGH", emitsAudit: true },

  // ── Commercial & Launch ─────────────────────────────────────────────────
  { route: "/admin/validation", domain: "command", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/conversion-dashboard", domain: "intelligence", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/launch-dashboard", domain: "intelligence", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },

  // ── Decision Intelligence (extended) ────────────────────────────────────
  { route: "/admin/decision/contextual-efficacy", domain: "intelligence", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/decision/contextual-ranking", domain: "intelligence", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },

  // ── Intelligence Foundry (extended modules) ─────────────────────────────
  { route: "/admin/intelligence-foundry/simulation/constitutional-diagnostic", domain: "foundry", requiredRole: "ADMIN", productSurface: "constitutional-diagnostic", canonicalRecord: "DiagnosticRun", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/intelligence-foundry/content", domain: "foundry", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/intelligence-foundry/market", domain: "foundry", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/intelligence-foundry/reference", domain: "foundry", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },
  { route: "/admin/intelligence-foundry/debug", domain: "foundry", requiredRole: "ADMIN", riskLevel: "LOW", emitsAudit: false },

  // ── System ──────────────────────────────────────────────────────────────
  { route: "/admin/redis", domain: "command", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },

  // ── Security & Audit (extended) ─────────────────────────────────────────
  { route: "/admin/command-centre", domain: "command", requiredRole: "OWNER", riskLevel: "CRITICAL", emitsAudit: true },
  { route: "/admin/access-keys", domain: "access", requiredRole: "ADMIN", canonicalRecord: "AccessGrant", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/events", domain: "audit", requiredRole: "ADMIN", canonicalRecord: "AuditEvent", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/provenance-chain", domain: "audit", requiredRole: "OWNER", canonicalRecord: "LineageEvent", riskLevel: "HIGH", emitsAudit: true },
  { route: "/admin/access-diagnostics", domain: "access", requiredRole: "ADMIN", riskLevel: "MEDIUM", emitsAudit: false },
  { route: "/admin/security-assurance-requests", domain: "audit", requiredRole: "ADMIN", canonicalRecord: "AuditEvent", riskLevel: "HIGH", emitsAudit: true },
];

export function getAdminRoute(route: string): AdminRouteEntry | undefined {
  return ADMIN_ROUTES.find((r) => r.route === route);
}

export function getRoutesByDomain(domain: AdminDomain): AdminRouteEntry[] {
  return ADMIN_ROUTES.filter((r) => r.domain === domain);
}

export function getRoutesByProductSurface(surfaceId: string): AdminRouteEntry[] {
  return ADMIN_ROUTES.filter((r) => r.productSurface === surfaceId);
}

export function getHighRiskRoutes(): AdminRouteEntry[] {
  return ADMIN_ROUTES.filter((r) => r.riskLevel === "HIGH" || r.riskLevel === "CRITICAL");
}

export function getOwnerRoutes(): AdminRouteEntry[] {
  return ADMIN_ROUTES.filter((r) => r.requiredRole === "OWNER");
}
