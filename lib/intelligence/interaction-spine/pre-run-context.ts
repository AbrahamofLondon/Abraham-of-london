/**
 * lib/intelligence/interaction-spine/pre-run-context.ts
 *
 * §4 — read-before-run. Writing to the twin is only half the moat; the compounding
 * advantage becomes visible only when a product READS the relevant prior state before
 * (or around) a run and explains which prior state informed it.
 *
 * This is a BOUNDED relevance-selection layer, not a twin dump. A run declares what it
 * is about (topicTags); we select only prior twin dimensions that overlap that topic,
 * order them by evidence weight (recurrence × severity × recency), and cap the count.
 * The customer-facing statement is derived only from evidence-backed fields — no hidden
 * reasoning is exposed, and every item is traceable (key + lastSeen + recurrence).
 *
 * Design guarantees (proven in the test):
 *   • same input + DIFFERENT relevant history → different context;
 *   • IRRELEVANT history (no topic overlap) → no artificial change;
 *   • insufficient history → an explicit "limited continuity" state (never fabricated).
 *
 * Ownership/tenant isolation is enforced UPSTREAM: buildPreRunContextForCase reads the
 * twin through the tenant-scoped getStrategicTwin, so a cross-tenant read yields null →
 * no continuity (it cannot leak another customer's decisions).
 */

import {
  getStrategicTwin,
  type SpineDeps,
  type StrategicTwinState,
  type Severity,
} from "./product-interaction-spine";

export interface PreRunRequest {
  productCode: string;
  /** what THIS run is about — the topics used to select relevant prior state. */
  topicTags: string[];
  /** bound on returned items (default 6) so this never dumps the whole twin. */
  maxItems?: number;
  /** minimum relevant items below which continuity is reported as "limited". */
  limitedThreshold?: number;
}

export type ContinuityKind = "commitment" | "contradiction" | "evidence_gap" | "exposure" | "signal";

export interface ContinuityItem {
  kind: ContinuityKind;
  key: string;
  detail: string;
  relevance: number;
  recurrence: number;
  severity?: Severity;
  lastSeen?: string;
}

export interface PreRunContext {
  hasContinuity: boolean;
  /** twin exists but too little RELEVANT prior state to compound meaningfully. */
  limited: boolean;
  items: ContinuityItem[];
  /** customer-facing, evidence-backed, no hidden reasoning. */
  customerStatement: string;
  informedByInteractionCount: number;
  provenance: { source: "strategic_twin"; twinVersion: number; selectedFrom: number };
}

const SEVERITY_WEIGHT: Record<Severity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2), // drop noise tokens
  );
}

/** relevance = topic-token overlap (the gate) scaled by evidence weight. 0 = irrelevant. */
function relevanceFor(key: string, topicTokens: Set<string>, weight: number): number {
  const kt = tokens(key);
  let overlap = 0;
  for (const t of kt) if (topicTokens.has(t)) overlap++;
  if (overlap === 0) return 0; // no topic overlap → excluded (irrelevant history causes no change)
  return overlap * 10 + weight;
}

/**
 * Select the bounded, relevance-ordered continuity for a run from an already-resolved
 * (tenant-owned) twin. Pure.
 */
export function resolvePreRunContext(twin: StrategicTwinState | null, req: PreRunRequest): PreRunContext {
  const maxItems = req.maxItems ?? 6;
  const limitedThreshold = req.limitedThreshold ?? 2;
  const topicTokens = new Set<string>();
  for (const tag of req.topicTags) for (const t of tokens(tag)) topicTokens.add(t);

  if (!twin) {
    return {
      hasContinuity: false, limited: false, items: [],
      customerStatement: "No prior related decision history informs this assessment yet — this is where your decision twin begins.",
      informedByInteractionCount: 0,
      provenance: { source: "strategic_twin", twinVersion: 0, selectedFrom: 0 },
    };
  }

  const candidates: ContinuityItem[] = [];

  for (const c of Object.values(twin.contradictions)) {
    if (c.status !== "active") continue;
    const sevWeight = c.lastSeverity ? SEVERITY_WEIGHT[c.lastSeverity] : 1;
    const rel = relevanceFor(c.key, topicTokens, sevWeight + c.count);
    if (rel > 0) candidates.push({ kind: "contradiction", key: c.key, detail: `active contradiction (seen ${c.count}×)`, relevance: rel, recurrence: c.count, severity: c.lastSeverity, lastSeen: c.lastSeen });
  }
  for (const g of Object.values(twin.evidenceGaps)) {
    const rel = relevanceFor(g.key, topicTokens, g.count);
    if (rel > 0) candidates.push({ kind: "evidence_gap", key: g.key, detail: `unresolved evidence gap (seen ${g.count}×)`, relevance: rel, recurrence: g.count, lastSeen: g.lastSeen });
  }
  for (const cm of Object.values(twin.commitments)) {
    const rel = relevanceFor(cm.key, topicTokens, 2);
    if (rel > 0) candidates.push({ kind: "commitment", key: cm.key, detail: `${cm.statement}${cm.owner ? ` — ${cm.owner}` : ""}`, relevance: rel, recurrence: 1, lastSeen: cm.recordedAt });
  }
  for (const s of Object.values(twin.signals)) {
    const kind: ContinuityKind = s.key.startsWith("exposure_") ? "exposure" : "signal";
    const rel = relevanceFor(s.key, topicTokens, s.count);
    if (rel > 0) candidates.push({ kind, key: s.key, detail: kind === "exposure" ? `external exposure recorded (${s.count}×)` : `signal ${s.trend ?? "tracked"} (${s.count}×)`, relevance: rel, recurrence: s.count });
  }

  candidates.sort((a, b) => b.relevance - a.relevance || b.recurrence - a.recurrence);
  const items = candidates.slice(0, maxItems);

  if (items.length === 0) {
    return {
      hasContinuity: false, limited: false, items: [],
      customerStatement: "No prior related decision history informs this assessment yet — this is where your decision twin begins.",
      informedByInteractionCount: twin.interactionLineage.length,
      provenance: { source: "strategic_twin", twinVersion: twin.version, selectedFrom: candidates.length },
    };
  }

  const limited = items.length < limitedThreshold;
  return {
    hasContinuity: true,
    limited,
    items,
    customerStatement: buildStatement(items, twin.interactionLineage.length, limited),
    informedByInteractionCount: twin.interactionLineage.length,
    provenance: { source: "strategic_twin", twinVersion: twin.version, selectedFrom: candidates.length },
  };
}

function buildStatement(items: ContinuityItem[], interactionCount: number, limited: boolean): string {
  const counts = items.reduce<Record<ContinuityKind, number>>((acc, i) => { acc[i.kind] = (acc[i.kind] ?? 0) + 1; return acc; }, {} as Record<ContinuityKind, number>);
  const parts: string[] = [];
  if (counts.contradiction) parts.push(`${counts.contradiction} active contradiction${counts.contradiction > 1 ? "s" : ""}`);
  if (counts.evidence_gap) parts.push(`${counts.evidence_gap} unresolved evidence gap${counts.evidence_gap > 1 ? "s" : ""}`);
  if (counts.commitment) parts.push(`${counts.commitment} prior commitment${counts.commitment > 1 ? "s" : ""}`);
  if (counts.exposure) parts.push(`${counts.exposure} external exposure${counts.exposure > 1 ? "s" : ""}`);
  if (counts.signal) parts.push(`${counts.signal} repeated signal${counts.signal > 1 ? "s" : ""}`);
  const basis = parts.join(", ").replace(/, ([^,]*)$/, " and $1");
  if (limited) return `This assessment is informed by limited prior history on related topics (${basis}).`;
  return `This assessment is informed by ${interactionCount} prior interaction${interactionCount > 1 ? "s" : ""} on related topics: ${basis}.`;
}

/**
 * Resolve continuity for a case through the tenant-isolated twin read. A cross-tenant
 * caseId yields a null twin → no continuity (cannot leak another customer's decisions).
 */
export function buildPreRunContextForCase(deps: SpineDeps, tenantId: string, caseId: string, req: PreRunRequest): PreRunContext {
  const twin = getStrategicTwin(deps, tenantId, caseId);
  return resolvePreRunContext(twin, req);
}

/** Derive topic tags from a product result's own dimension keys (what the run is about). */
export function topicTagsFromResultKeys(keys: Array<string | undefined | null>): string[] {
  return Array.from(new Set(keys.filter((k): k is string => Boolean(k))));
}
