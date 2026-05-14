/**
 * Admin Navigation Registry
 *
 * Single source of truth for all admin surfaces, grouped by operational domain.
 * Used by the canonical admin layout sidebar.
 */

export type AdminNavItem = {
  id: string;
  label: string;
  href: string;
  router: "pages" | "app";
  visibility: "admin" | "operator" | "sponsor_safe" | "internal" | "owner";
  status: "active" | "rough" | "stub" | "broken" | "deprecated";
  description?: string;
};

export type AdminNavSection = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAVIGATION: AdminNavSection[] = [
  {
    id: "command",
    label: "Command Centre",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/admin", router: "pages", visibility: "admin", status: "active", description: "Command centre overview with deal flow and system status" },
      { id: "operator", label: "Operator Command Centre", href: "/admin/operator", router: "pages", visibility: "operator", status: "active", description: "Operational queue cockpit for overdue, blocked, approval, and escalation work" },
      { id: "command-wall", label: "Command Wall", href: "/admin/command-wall", router: "pages", visibility: "admin", status: "active", description: "System control surface with live context registry" },
      { id: "command", label: "Command (App)", href: "/admin/command", router: "app", visibility: "admin", status: "active", description: "App router command surface" },
      { id: "authority-center", label: "Authority Center", href: "/admin/authority-center", router: "pages", visibility: "admin", status: "active", description: "Decision authority hub with contradiction and stakeholder audit" },
    ],
  },
  {
    id: "decision-intelligence",
    label: "Decision Intelligence",
    items: [
      { id: "decision-intelligence", label: "Decision Intelligence", href: "/admin/decision-intelligence", router: "app", visibility: "admin", status: "active", description: "Funnel progression, conversion, escalation metrics" },
      { id: "intelligence-stream", label: "Intelligence Stream", href: "/admin/intelligence", router: "pages", visibility: "admin", status: "active", description: "Real-time deal flow audit stream" },
      { id: "decision-efficacy", label: "Decision Efficacy", href: "/admin/decision/efficacy", router: "app", visibility: "admin", status: "active", description: "Decision efficacy panel with contextual ranking and rebuild controls" },
      { id: "decision-governance", label: "Decision Governance", href: "/admin/decision/governance", router: "app", visibility: "admin", status: "active", description: "Governance alerts and authority violation tracking" },
      { id: "decision-performance", label: "Decision Performance", href: "/admin/decision/performance", router: "app", visibility: "admin", status: "active", description: "Decision performance table with rebuild controls" },
      { id: "contextual-efficacy", label: "Contextual Efficacy", href: "/admin/decision/contextual-efficacy", router: "app", visibility: "admin", status: "active", description: "Per-row contextual efficacy drill-down with ranked asset table" },
      { id: "contextual-ranking", label: "Contextual Ranking", href: "/admin/decision/contextual-ranking", router: "app", visibility: "admin", status: "active", description: "Live session contextual ranking for active decision surfaces" },
      { id: "metadata-audit", label: "Metadata Audit", href: "/admin/decision/metadata-audit", router: "app", visibility: "admin", status: "active", description: "Asset metadata coverage and confidence audit. API: /api/decision/metadata-audit — no admin guard (public content metadata only; contains no user or decision data)." },
    ],
  },
  {
    id: "diagnostics",
    label: "Diagnostics & Assessments",
    items: [
      { id: "calibration", label: "Calibration", href: "/admin/calibration", router: "pages", visibility: "admin", status: "rough", description: "Calibration state viewer — live data only populated once calibration model is seeded" },
      { id: "institutional-analytics", label: "Institutional Analytics", href: "/admin/institutional-analytics", router: "pages", visibility: "admin", status: "active", description: "Institutional analytics dashboard" },
    ],
  },
  {
    id: "reporting",
    label: "Executive Reporting",
    items: [
      { id: "reports", label: "Reports", href: "/admin/reports", router: "app", visibility: "admin", status: "active", description: "Executive intelligence briefs — completed campaign alignment reports by organisation" },
      { id: "reporting-executive", label: "Executive Reports", href: "/admin/reporting/executive", router: "app", visibility: "admin", status: "active", description: "Governance hub linking to intelligence briefs and decision analytics — index page now live." },
    ],
  },
  {
    id: "retained-oversight",
    label: "Retained Oversight",
    items: [
      { id: "retained-cadence", label: "Retained Cadence", href: "/admin/retained-cadence", router: "pages", visibility: "operator", status: "active", description: "Cadence cycle management and run-now" },
      { id: "retainer-readiness", label: "Retainer Readiness", href: "/admin/retainer-readiness", router: "pages", visibility: "operator", status: "active", description: "Contract readiness scorecard" },
      { id: "oversight-review", label: "Oversight Review", href: "/admin/oversight-review", router: "pages", visibility: "operator", status: "active", description: "Governed review bench with suppression controls" },
      { id: "outcome-ledger", label: "Outcome Ledger", href: "/admin/outcome-ledger", router: "pages", visibility: "operator", status: "active", description: "Decision-to-outcome tracking" },
      { id: "suppression-ledger", label: "Suppression Ledger", href: "/admin/suppression-ledger", router: "pages", visibility: "operator", status: "active", description: "Suppression audit trail" },
    ],
  },
  {
    id: "counsel",
    label: "Counsel Review",
    items: [
      { id: "counsel-review", label: "Counsel Review", href: "/admin/counsel-review", router: "pages", visibility: "admin", status: "active", description: "Internal counsel brief review and suppression controls" },
    ],
  },
  {
    id: "boardroom",
    label: "Boardroom",
    items: [
      { id: "boardroom-archive", label: "Boardroom Archive", href: "/admin/boardroom-archive", router: "pages", visibility: "admin", status: "active", description: "Boardroom dossier history" },
    ],
  },
  {
    id: "delivery",
    label: "Delivery & Proof",
    items: [
      { id: "delivery-queue", label: "Delivery Queue", href: "/admin/delivery-queue", router: "pages", visibility: "operator", status: "active", description: "Delivery item approve/fail queue" },
      { id: "proof", label: "Proof Queue", href: "/admin/proof", router: "pages", visibility: "admin", status: "active", description: "Evidence review, approve, anonymise" },
      { id: "outcome-verification", label: "Outcome Verification", href: "/admin/outcome-verification", router: "pages", visibility: "operator", status: "active", description: "Operator review queue for disputed, blocked, or insufficient-evidence outcome verification records." },
      { id: "pdf-dashboard", label: "PDF Analytics", href: "/admin/pdf-dashboard", router: "pages", visibility: "admin", status: "active", description: "PDF asset analytics dashboard with hook-driven metrics" },
      { id: "pdf-status", label: "PDF Status", href: "/admin/pdf-status", router: "pages", visibility: "admin", status: "active", description: "Filesystem scan of PDF asset sync state" },
    ],
  },
  {
    id: "campaigns",
    label: "Campaigns & Organisations",
    items: [
      { id: "campaigns", label: "Campaigns", href: "/admin/campaigns", router: "app", visibility: "admin", status: "active", description: "Alignment campaign registry with organisation links and status badges" },
      { id: "campaigns-new", label: "New Campaign", href: "/admin/campaigns/new", router: "app", visibility: "admin", status: "active", description: "Create a new alignment campaign" },
      { id: "organisations", label: "Organisations", href: "/admin/organisations", router: "app", visibility: "admin", status: "active", description: "Organisation registry with sector, size, region, and campaign counts" },
      { id: "organisations-new", label: "New Organisation", href: "/admin/organisations/new", router: "app", visibility: "admin", status: "active", description: "Register a new client organisation" },
      { id: "enterprise-pipeline", label: "Enterprise Pipeline", href: "/admin/enterprise-pipeline", router: "pages", visibility: "admin", status: "active", description: "Lead pipeline with predictive win probability and journey progress" },
      { id: "enterprise-foundation", label: "Enterprise Foundation", href: "/admin/enterprise-foundation", router: "pages", visibility: "admin", status: "active", description: "Executive risk snapshot and foundation telemetry summary" },
    ],
  },
  {
    id: "content",
    label: "Content & Canon",
    items: [
      { id: "assets", label: "Asset Registry", href: "/admin/assets", router: "pages", visibility: "admin", status: "rough", description: "PDF sync dashboard — rough, labels may overstate sensitivity" },
      { id: "inner-circle", label: "Inner Circle", href: "/admin/inner-circle", router: "pages", visibility: "admin", status: "active", description: "Inner circle member management — key issuance and status updates" },
      { id: "snapshot", label: "Snapshot", href: "/admin/snapshot", router: "app", visibility: "admin", status: "rough", description: "Alignment snapshot — currently renders hardcoded mock data, not wired to live API" },
    ],
  },
  {
    id: "commercial",
    label: "Commercial & Entitlements",
    items: [
      { id: "commercial", label: "Commercial", href: "/admin/commercial", router: "app", visibility: "admin", status: "active", description: "Commercial entitlements — email lookup, catalog products, failed grants" },
      { id: "validation", label: "Validation", href: "/admin/validation", router: "pages", visibility: "admin", status: "active", description: "Product readiness and commercial integrity" },
      { id: "conversion-dashboard", label: "Conversion Dashboard", href: "/admin/conversion-dashboard", router: "pages", visibility: "admin", status: "active", description: "Conversion intelligence metrics across A1–A5 funnel stages" },
      { id: "launch-dashboard", label: "Launch Dashboard", href: "/admin/launch-dashboard", router: "pages", visibility: "admin", status: "active", description: "Launch funnel drop-off and GA4 event tracking" },
    ],
  },
  {
    id: "system",
    label: "System Health",
    items: [
      { id: "redis", label: "Redis Diagnostics", href: "/admin/redis", router: "pages", visibility: "admin", status: "active", description: "Redis connection status, metrics, and asset registry sync state" },
    ],
  },
  {
    id: "security",
    label: "Security & Audit",
    items: [
      { id: "access-keys", label: "Access Keys", href: "/admin/access-keys", router: "pages", visibility: "admin", status: "active", description: "Issue and revoke access keys" },
      { id: "audit", label: "Audit Log", href: "/admin/audit", router: "app", visibility: "admin", status: "active", description: "System forensic ledger — Prisma systemAuditLog with graceful fallback" },
    ],
  },
];

/**
 * Get all navigation items flat.
 */
export function getAllAdminNavItems(): AdminNavItem[] {
  return ADMIN_NAVIGATION.flatMap((section) => section.items);
}

/**
 * Get items visible to a given role.
 */
export function getNavItemsForRole(role: "admin" | "operator" | "sponsor_safe"): AdminNavSection[] {
  // owner = highest privilege (above admin); internal = hidden from all roles via this helper
  const roleOrder: Record<string, number> = { owner: 4, admin: 3, operator: 2, sponsor_safe: 1, internal: 0 };
  const maxLevel = roleOrder[role] ?? 0;

  return ADMIN_NAVIGATION
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => (roleOrder[item.visibility] ?? 0) <= maxLevel),
    }))
    .filter((section) => section.items.length > 0);
}
