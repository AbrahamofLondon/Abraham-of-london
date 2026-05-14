/**
 * lib/admin/product-surface-registry.ts
 *
 * Canonical product estate registry — single source of truth for all
 * client-facing diagnostics, assessments, reports, escalation surfaces,
 * and retained oversight surfaces.
 *
 * v1: Static typed registry. Dynamic route scanning can come later.
 *
 * Each surface documents:
 * - what it does
 * - who it is for
 * - what data it captures
 * - what outputs it produces
 * - where it escalates
 * - what admin surface monitors it
 * - whether it is live, rough, experimental, or internal
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export type ProductSurfaceCategory =
  | "DIAGNOSTIC"
  | "ASSESSMENT"
  | "REPORT"
  | "INTERVENTION"
  | "RETAINER"
  | "ESCALATION"
  | "CLIENT_PORTAL"
  | "CONTENT";

export type ProductSurfaceStatus = "live" | "rough" | "internal" | "experimental" | "deprecated";

export type ProductSurfaceAudience =
  | "individual"
  | "sponsor"
  | "operator"
  | "organisation"
  | "board"
  | "counsel";

export type ProductSurfaceMonitoringPriority = "low" | "medium" | "high" | "critical";

export type ProductSurfaceOperationalOwner = "admin" | "operator" | "founder" | "future-team";

export type AdminProductSurface = {
  id: string;
  label: string;
  category: ProductSurfaceCategory;
  clientRoute: string;
  adminRoute?: string;
  status: ProductSurfaceStatus;
  audience: ProductSurfaceAudience;
  entryRequirement: string;
  captures: string[];
  outputs: string[];
  downstream: string[];
  monitoringPriority: ProductSurfaceMonitoringPriority;
  operationalOwner: ProductSurfaceOperationalOwner;
  previewAvailable: boolean;
  description: string;
};

// ─── Registry ──────────────────────────────────────────────────────────────

export const PRODUCT_SURFACE_REGISTRY: AdminProductSurface[] = [
  // ── DIAGNOSTICS ──────────────────────────────────────────────────────────
  {
    id: "fast-diagnostic",
    label: "Fast Diagnostic",
    category: "DIAGNOSTIC",
    clientRoute: "/diagnostics/fast",
    adminRoute: "/admin",
    status: "live",
    audience: "individual",
    entryRequirement: "None — public start point. User describes an unresolved decision.",
    captures: [
      "Decision text",
      "Claimed owner",
      "Consequence description",
      "Optional evidence strengthener fields",
      "Commitment to act within 48 hours",
    ],
    outputs: [
      "Condition classification",
      "Anchor narrative",
      "Cost of inaction (30/60/90 day horizons)",
      "Detected institutional signals",
      "Comparison band",
      "Checkpoint creation",
    ],
    downstream: [
      "Personal Decision Audit",
      "Constitutional Diagnostic",
      "Executive Reporting",
    ],
    monitoringPriority: "high",
    operationalOwner: "admin",
    previewAvailable: true,
    description: "Public entry point. Three-step interrogation (decision → authority → consequence) with live typing hints, challenge engine, and optional evidence strengthener. Produces a condition classification, cost projection, and checkpoint commitment.",
  },
  {
    id: "purpose-alignment",
    label: "Purpose Alignment",
    category: "DIAGNOSTIC",
    clientRoute: "/diagnostics/purpose-alignment",
    adminRoute: "/admin",
    status: "live",
    audience: "individual",
    entryRequirement: "Fast Diagnostic completion recommended but not required.",
    captures: [
      "Purpose alignment responses",
      "Domain scores",
      "Pattern detection",
    ],
    outputs: [
      "Purpose alignment profile",
      "Primary pattern identification",
      "Domain breakdown",
    ],
    downstream: [
      "Executive Reporting",
      "Strategy Room",
    ],
    monitoringPriority: "medium",
    operationalOwner: "admin",
    previewAvailable: true,
    description: "Assesses alignment between personal purpose and organisational mandate. Feeds into Executive Reporting and Strategy Room evidence carry-forward.",
  },
  {
    id: "constitutional-diagnostic",
    label: "Constitutional Diagnostic",
    category: "DIAGNOSTIC",
    clientRoute: "/diagnostics/constitutional-diagnostic",
    adminRoute: "/admin",
    status: "live",
    audience: "individual",
    entryRequirement: "Fast Diagnostic completion recommended. Tests governance readiness and authority structure.",
    captures: [
      "Governance structure assessment",
      "Authority clarity evaluation",
      "Decision mandate mapping",
    ],
    outputs: [
      "Governance readiness score",
      "Authority structure finding",
      "Route determination (PROCEED / DIAGNOSE / REJECT)",
    ],
    downstream: [
      "Executive Reporting",
    ],
    monitoringPriority: "medium",
    operationalOwner: "admin",
    previewAvailable: true,
    description: "Tests governance readiness and authority structure before pricing consequences. Intermediate step between Fast Diagnostic and Executive Reporting.",
  },

  // ── ASSESSMENTS ──────────────────────────────────────────────────────────
  {
    id: "team-assessment",
    label: "Team Assessment",
    category: "ASSESSMENT",
    clientRoute: "/diagnostics/team-assessment",
    adminRoute: "/admin",
    status: "live",
    audience: "organisation",
    entryRequirement: "Campaign invitation or organisation access.",
    captures: [
      "Team sentiment responses",
      "Domain scores per respondent",
      "Aggregate team alignment data",
    ],
    outputs: [
      "Team alignment score",
      "Domain breakdown with deltas",
      "Trust score",
      "Claim level",
    ],
    downstream: [
      "Executive Reporting",
      "Strategy Room",
      "Organisation Divergence",
    ],
    monitoringPriority: "medium",
    operationalOwner: "operator",
    previewAvailable: false,
    description: "Multi-respondent team assessment. Captures alignment across domains, produces aggregate scores with leader deltas. Feeds into organisation-level intelligence.",
  },
  {
    id: "enterprise-assessment",
    label: "Enterprise Assessment",
    category: "ASSESSMENT",
    clientRoute: "/diagnostics/enterprise-assessment",
    adminRoute: "/admin",
    status: "live",
    audience: "organisation",
    entryRequirement: "Campaign invitation or organisation access. Multiple respondents recommended.",
    captures: [
      "Enterprise-wide diagnostic responses",
      "Fragility signals",
      "Weakest domains",
    ],
    outputs: [
      "Enterprise fragility score",
      "Weakest domain identification",
      "Fragility signal classification",
    ],
    downstream: [
      "Executive Reporting",
      "Strategy Room",
    ],
    monitoringPriority: "medium",
    operationalOwner: "operator",
    previewAvailable: false,
    description: "Enterprise-wide diagnostic assessing organisational fragility, domain health, and systemic risk. Requires multiple respondents for meaningful output.",
  },

  // ── REPORTS ──────────────────────────────────────────────────────────────
  {
    id: "executive-reporting",
    label: "Executive Reporting",
    category: "REPORT",
    clientRoute: "/diagnostics/executive-reporting",
    adminRoute: "/admin/reporting/executive",
    status: "live",
    audience: "sponsor",
    entryRequirement: "Evidence gate: Fast Diagnostic + at least one assessment. Paid access required.",
    captures: [
      "Decision evidence from prior diagnostics",
      "Financial exposure estimates",
      "Governance constraint mapping",
    ],
    outputs: [
      "Executive report with priority stack",
      "Cost of inaction pricing",
      "Governance correction identification",
      "Intervention sequencing (7/30/90 day)",
      "Escalation recommendation",
    ],
    downstream: [
      "Strategy Room",
      "Boardroom",
      "Counsel Review",
    ],
    monitoringPriority: "high",
    operationalOwner: "admin",
    previewAvailable: true,
    description: "Consequence interpretation layer. Prices cost of delay, identifies governance correction, sequences first intervention, and prepares board-ready decision object. Paid product.",
  },
  {
    id: "executive-reporting-run",
    label: "Executive Reporting Run/Intake",
    category: "REPORT",
    clientRoute: "/diagnostics/executive-reporting/run",
    adminRoute: "/admin/reporting/executive",
    status: "live",
    audience: "sponsor",
    entryRequirement: "Executive Reporting purchase completed.",
    captures: [
      "Structured intake form data",
      "Constitutional guidance assembly",
      "Canonical report contract",
    ],
    outputs: [
      "Generated executive report PDF",
      "Serialized report data",
    ],
    downstream: [
      "Strategy Room",
    ],
    monitoringPriority: "high",
    operationalOwner: "admin",
    previewAvailable: false,
    description: "Post-purchase intake and report generation pipeline. Assembles constitutional guidance, canonical report contract, and produces the final executive report.",
  },

  // ── INTERVENTION ─────────────────────────────────────────────────────────
  {
    id: "strategy-room",
    label: "Strategy Room",
    category: "INTERVENTION",
    clientRoute: "/strategy-room",
    adminRoute: "/admin/command",
    status: "live",
    audience: "sponsor",
    entryRequirement: "Executive Reporting completion + paid access. Evidence-qualified via decision authority gate.",
    captures: [
      "Execution flow qualification (decision, authority, first action)",
      "Decision log entries",
      "Status changes (pending/executed/blocked)",
      "Block reasons",
      "Enforcement state",
    ],
    outputs: [
      "Execution environment with decision log",
      "Intervention stack",
      "Constraint map",
      "Escalation triggers",
      "Exit classification (stabilised/monitoring/further intervention)",
    ],
    downstream: [
      "Counsel Review",
      "Boardroom",
      "Oversight",
    ],
    monitoringPriority: "critical",
    operationalOwner: "operator",
    previewAvailable: false,
    description: "Execution intervention environment. Forces the decision, assigns ownership, tracks whether it happens. Three states: GATE (locked) → ENTRY BRIEF (paid) → EXECUTION CHAMBER (active). Highest-consequence surface on the platform.",
  },
  {
    id: "decision-centre",
    label: "Decision Centre",
    category: "INTERVENTION",
    clientRoute: "/decision-centre",
    adminRoute: "/admin",
    status: "live",
    audience: "sponsor",
    entryRequirement: "At least one completed diagnostic or assessment.",
    captures: [
      "Decision velocity data",
      "Checkpoint status",
      "Active cases",
    ],
    outputs: [
      "Decision velocity summary",
      "Checkpoint queue",
      "Active case list",
    ],
    downstream: [
      "Return Brief",
      "Oversight",
    ],
    monitoringPriority: "medium",
    operationalOwner: "operator",
    previewAvailable: true,
    description: "Central hub for tracking decision velocity, checkpoint responses, and active cases. Shows what needs attention across the user's decision estate.",
  },

  // ── RETAINER ──────────────────────────────────────────────────────────────
  {
    id: "oversight",
    label: "Oversight",
    category: "RETAINER",
    clientRoute: "/oversight",
    adminRoute: "/admin/retained-cadence",
    status: "live",
    audience: "sponsor",
    entryRequirement: "Active retainer contract with oversight cadence configured.",
    captures: [
      "Cadence posture and history",
      "Cycle archive records",
      "Sponsor-safe command summary",
    ],
    outputs: [
      "Retained Oversight Command view",
      "Cadence health status",
      "Cycle history timeline",
      "Institutional case summary",
    ],
    downstream: [
      "Oversight Brief",
      "Boardroom",
    ],
    monitoringPriority: "high",
    operationalOwner: "operator",
    previewAvailable: true,
    description: "Sponsor-safe retained oversight command visibility. Shows cadence posture, cycle history, institutional case summary, and portfolio memory.",
  },
  {
    id: "oversight-brief",
    label: "Oversight Brief",
    category: "RETAINER",
    clientRoute: "/oversight/brief/[cycleId]",
    adminRoute: "/admin/oversight-review",
    status: "live",
    audience: "sponsor",
    entryRequirement: "Completed and archived oversight cycle with appropriate role access.",
    captures: [
      "Full oversight cycle data",
      "Retainer cycle memory",
      "Behavioral trends",
      "Signal data",
    ],
    outputs: [
      "Governed oversight brief with 20+ sections",
      "Client-safe and board-level variants",
      "PDF export",
      "Structured actions",
    ],
    downstream: [
      "Boardroom",
      "Counsel Review",
    ],
    monitoringPriority: "high",
    operationalOwner: "operator",
    previewAvailable: true,
    description: "Full governed oversight brief. Includes executive summary, cadence posture, retainer cycle memory, pattern recurrence, cost of inaction, irreversibility, strategic options, value protected, and structured actions. The richest client-facing document.",
  },

  // ── ESCALATION ───────────────────────────────────────────────────────────
  {
    id: "counsel-review",
    label: "Counsel Review",
    category: "ESCALATION",
    clientRoute: "/counsel",
    adminRoute: "/admin/counsel-review",
    status: "live",
    audience: "counsel",
    entryRequirement: "Qualified escalation from Strategy Room or Oversight. Evidence-gated access state machine.",
    captures: [
      "Counsel intake form data",
      "Evidence package",
      "Review workflow status",
    ],
    outputs: [
      "Counsel review record",
      "Evidence package for counsel",
      "Resolution outcome",
    ],
    downstream: [
      "Boardroom",
      "Oversight",
    ],
    monitoringPriority: "critical",
    operationalOwner: "admin",
    previewAvailable: false,
    description: "Qualified escalation surface for conditions the system cannot responsibly model alone. Access state machine: NO_EVIDENCE → ELIGIBLE → ACTIVE → RESOLVED. Reserved for counsel-level handling.",
  },
  {
    id: "boardroom",
    label: "Boardroom",
    category: "ESCALATION",
    clientRoute: "/boardroom",
    adminRoute: "/admin/boardroom-archive",
    status: "live",
    audience: "board",
    entryRequirement: "Institutional case qualification. Boardroom-earned status from evidence accumulation.",
    captures: [
      "Boardroom dossier data",
      "Stakeholder exposure mapping",
      "Scenario pressure analysis",
    ],
    outputs: [
      "Boardroom archive summary",
      "Board-ready decision dossier",
      "Signal exposure report",
    ],
    downstream: [
      "Oversight",
    ],
    monitoringPriority: "high",
    operationalOwner: "admin",
    previewAvailable: true,
    description: "Board-level strategic memory. Not a one-off PDF — shows whether board-level dossiers exist, when generated, and whether current record is boardroom-ready. Institutional cases only.",
  },

  // ── CLIENT PORTAL ────────────────────────────────────────────────────────
  {
    id: "return-brief",
    label: "Return Brief",
    category: "CLIENT_PORTAL",
    clientRoute: "/return-brief",
    adminRoute: "/admin",
    status: "live",
    audience: "sponsor",
    entryRequirement: "Triggered by record when commitments are missed, delayed, or unresolved.",
    captures: [
      "Commitment status data",
      "Prior cycle findings",
      "Retained memory",
    ],
    outputs: [
      "Return brief confronting commitment gaps",
      "Governed memory update",
    ],
    downstream: [
      "Oversight",
    ],
    monitoringPriority: "medium",
    operationalOwner: "operator",
    previewAvailable: false,
    description: "Triggered by record when commitments are missed, delayed, or unresolved. Confronts the gap between what was committed and what happened. Governed memory mechanism, not a standalone page.",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    category: "CLIENT_PORTAL",
    clientRoute: "/oversight/portfolio",
    adminRoute: "/admin",
    status: "live",
    audience: "sponsor",
    entryRequirement: "Active retainer with portfolio-level access.",
    captures: [
      "Portfolio memory data",
      "Cross-cycle trends",
    ],
    outputs: [
      "Portfolio-level trend view",
      "Cross-cycle comparison",
    ],
    downstream: [
      "Oversight",
      "Boardroom",
    ],
    monitoringPriority: "medium",
    operationalOwner: "operator",
    previewAvailable: true,
    description: "Portfolio-level view across multiple oversight cycles. Shows trends, cross-cycle comparisons, and accumulated institutional memory.",
  },

  // ── CONTENT ──────────────────────────────────────────────────────────────
  {
    id: "proof-pack",
    label: "Proof Pack / Evidence",
    category: "CONTENT",
    clientRoute: "/account/proof-pack",
    adminRoute: "/admin/proof",
    status: "live",
    audience: "sponsor",
    entryRequirement: "Completed diagnostic with approved evidence.",
    captures: [
      "Proof evidence records",
      "Anonymised summaries",
    ],
    outputs: [
      "Published proof evidence",
      "Anonymised case studies",
    ],
    downstream: [],
    monitoringPriority: "low",
    operationalOwner: "admin",
    previewAvailable: false,
    description: "Evidence proof pack — reviewed, approved, anonymised diagnostic evidence for publication. Managed via admin Proof Queue.",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

export function getProductSurfacesByCategory(): Map<ProductSurfaceCategory, AdminProductSurface[]> {
  const grouped = new Map<ProductSurfaceCategory, AdminProductSurface[]>();
  for (const surface of PRODUCT_SURFACE_REGISTRY) {
    const existing = grouped.get(surface.category) ?? [];
    existing.push(surface);
    grouped.set(surface.category, existing);
  }
  return grouped;
}

export function getProductSurfacesByStatus(): Map<ProductSurfaceStatus, AdminProductSurface[]> {
  const grouped = new Map<ProductSurfaceStatus, AdminProductSurface[]>();
  for (const surface of PRODUCT_SURFACE_REGISTRY) {
    const existing = grouped.get(surface.status) ?? [];
    existing.push(surface);
    grouped.set(surface.status, existing);
  }
  return grouped;
}

export function getProductSurfacesByPriority(): Map<ProductSurfaceMonitoringPriority, AdminProductSurface[]> {
  const grouped = new Map<ProductSurfaceMonitoringPriority, AdminProductSurface[]>();
  for (const surface of PRODUCT_SURFACE_REGISTRY) {
    const existing = grouped.get(surface.monitoringPriority) ?? [];
    existing.push(surface);
    grouped.set(surface.monitoringPriority, existing);
  }
  return grouped;
}

export function getProductSurfaceById(id: string): AdminProductSurface | undefined {
  return PRODUCT_SURFACE_REGISTRY.find((s) => s.id === id);
}

export function getProductSurfacesByAudience(audience: ProductSurfaceAudience): AdminProductSurface[] {
  return PRODUCT_SURFACE_REGISTRY.filter((s) => s.audience === audience);
}
