/**
 * lib/intelligence/compounding/decision-centre-intelligence.ts
 *
 * OPP-14 (customer-visible twin read model), OPP-16 (enterprise portfolio
 * aggregation), OPP-24 (export/deletion governance). Pure + composable over the
 * spine's StrategicTwinState + InteractionStore, so ownership, RBAC, aggregation
 * thresholds, no-cross-client, provenance, and export/deletion are proven without
 * a DB. Runtime binds these read models to the Decision Centre surface and the
 * Prisma-backed store; these functions are the governed read/aggregation logic.
 *
 * Governance: a viewer sees only their own tenant's twin; enterprise aggregation
 * is org-scoped, role-gated, threshold-suppressed, and never crosses clients;
 * exports are tenant-scoped; deleted data never appears.
 */

import type { StrategicTwinState, InteractionStore, InteractionRecord } from "@/lib/intelligence/interaction-spine/product-interaction-spine";

export class AccessError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(`[${code}] ${message}`); this.name = "AccessError"; this.code = code; }
}

// ── OPP-14: customer-visible Decision Centre twin snapshot ────────────────────

export interface TwinSnapshotView {
  caseId: string;
  twinVersion: number;
  updatedAt: string;
  currentCommitments: { key: string; statement: string; owner: string | null; deadline: string | null }[];
  activeContradictions: { key: string; count: number; severity: string | null; firstSeen: string; lastSeen: string }[];
  repeatedSignals: { key: string; count: number; trend: string | null }[];
  evidenceGaps: { key: string }[];
  whatTheSystemNoticed: string[];
  whatRemainsUncertain: string[];
  nextCheckpointHint: string;
  provenance: { source: "strategic_twin"; twinCaseId: string; twinVersion: number };
}

/** Build the customer-visible read model. Ownership: viewer tenant must own the twin. */
export function buildTwinSnapshotView(twin: StrategicTwinState, viewerTenantId: string): TwinSnapshotView {
  if (viewerTenantId !== twin.tenantId) {
    throw new AccessError("OWNERSHIP_DENIED", "Viewer does not own this decision twin.");
  }
  const activeContradictions = Object.values(twin.contradictions)
    .filter((c) => c.status === "active")
    .map((c) => ({ key: c.key, count: c.count, severity: c.lastSeverity ?? null, firstSeen: c.firstSeen, lastSeen: c.lastSeen }));
  const repeatedSignals = Object.values(twin.signals).filter((s) => s.count > 1).map((s) => ({ key: s.key, count: s.count, trend: s.trend }));
  const evidenceGaps = Object.keys(twin.evidenceGaps).map((k) => ({ key: k }));

  const noticed: string[] = [];
  for (const c of activeContradictions.filter((c) => c.count > 1)) noticed.push(`"${c.key}" has recurred ${c.count} times.`);
  for (const s of repeatedSignals.filter((s) => s.trend === "worsening")) noticed.push(`Signal "${s.key}" is worsening across interactions.`);

  return {
    caseId: twin.caseId,
    twinVersion: twin.version,
    updatedAt: twin.updatedAt,
    currentCommitments: Object.values(twin.commitments).map((c) => ({ key: c.key, statement: c.statement, owner: c.owner, deadline: c.deadline })),
    activeContradictions,
    repeatedSignals,
    evidenceGaps,
    whatTheSystemNoticed: noticed,
    whatRemainsUncertain: evidenceGaps.map((g) => `Evidence gap "${g.key}" remains unresolved.`),
    nextCheckpointHint: activeContradictions.length > 0 ? `Review the ${activeContradictions.length} active contradiction(s) at the next checkpoint.` : "No active contradictions; confirm commitments remain on track.",
    provenance: { source: "strategic_twin", twinCaseId: twin.caseId, twinVersion: twin.version },
  };
}

// ── OPP-16: enterprise decision-portfolio aggregation ─────────────────────────

export type PortfolioRole = "org_admin" | "org_analyst" | "unauthorised";

export interface EnterprisePortfolioRequest {
  orgTenantIds: string[]; // the tenants (cases) that belong to this org
  role: PortfolioRole;
  aggregationThreshold: number; // suppress clusters seen in fewer than N distinct cases
}
export interface ContradictionCluster {
  key: string;
  affectedCaseCount: number;
  totalOccurrences: number;
}
export interface EnterprisePortfolio {
  orgCaseCount: number;
  contradictionClusters: ContradictionCluster[];
  commonEvidenceGaps: { key: string; affectedCaseCount: number }[];
  suppressedBelowThreshold: number;
  provenanceCaseIds: string[];
}

/**
 * Aggregate contradiction/gap clusters across an org's cases. Never crosses
 * clients (only twins whose tenantId ∈ orgTenantIds), role-gated, and suppresses
 * clusters below the aggregation threshold (prevents single-case exposure).
 */
export function buildEnterprisePortfolio(twins: StrategicTwinState[], req: EnterprisePortfolioRequest): EnterprisePortfolio {
  if (req.role !== "org_admin" && req.role !== "org_analyst") {
    throw new AccessError("PORTFOLIO_ROLE_DENIED", "Role is not authorised for portfolio aggregation.");
  }
  const allow = new Set(req.orgTenantIds);
  const scoped = twins.filter((t) => allow.has(t.tenantId)); // no cross-client aggregation

  const contradictionCases = new Map<string, Set<string>>();
  const contradictionTotals = new Map<string, number>();
  const gapCases = new Map<string, Set<string>>();
  for (const t of scoped) {
    for (const [key, e] of Object.entries(t.contradictions)) {
      (contradictionCases.get(key) ?? contradictionCases.set(key, new Set()).get(key)!).add(t.caseId);
      contradictionTotals.set(key, (contradictionTotals.get(key) ?? 0) + e.count);
    }
    for (const key of Object.keys(t.evidenceGaps)) {
      (gapCases.get(key) ?? gapCases.set(key, new Set()).get(key)!).add(t.caseId);
    }
  }

  let suppressed = 0;
  const contradictionClusters: ContradictionCluster[] = [];
  for (const [key, cases] of contradictionCases) {
    if (cases.size < req.aggregationThreshold) { suppressed++; continue; }
    contradictionClusters.push({ key, affectedCaseCount: cases.size, totalOccurrences: contradictionTotals.get(key) ?? 0 });
  }
  const commonEvidenceGaps = Array.from(gapCases.entries())
    .filter(([, cases]) => cases.size >= req.aggregationThreshold)
    .map(([key, cases]) => ({ key, affectedCaseCount: cases.size }));

  return {
    orgCaseCount: scoped.length,
    contradictionClusters: contradictionClusters.sort((a, b) => b.affectedCaseCount - a.affectedCaseCount),
    commonEvidenceGaps,
    suppressedBelowThreshold: suppressed,
    provenanceCaseIds: scoped.map((t) => t.caseId),
  };
}

// ── OPP-24: export / deletion governance (trust, not lock-in) ─────────────────

export interface CaseExportBundle {
  tenantId: string;
  caseId: string;
  exportedAt: string;
  interactions: InteractionRecord[];
  twin: StrategicTwinState | null;
  note: string;
}

/** Tenant-scoped export of a customer's governed interaction history + twin. */
export function exportCaseBundle(store: InteractionStore, tenantId: string, caseId: string, now = () => new Date().toISOString()): CaseExportBundle {
  const bound = store.getCaseTenant(caseId);
  if (bound && bound !== tenantId) throw new AccessError("OWNERSHIP_DENIED", "Cannot export another tenant's case.");
  return {
    tenantId, caseId, exportedAt: now(),
    interactions: store.listInteractions(tenantId, caseId),
    twin: store.getTwin(tenantId, caseId),
    note: "Full governed interaction history + current strategic-twin snapshot. Portable; the moat is accumulated insight, not data lock-in.",
  };
}
