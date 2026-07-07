/**
 * lib/intelligence/interaction-spine/product-interaction-spine.ts
 *
 * OPP-01/02/03 — the canonical interaction spine. ONE governed entry point that
 * every interactive product calls after producing a structured result, so no
 * product invents its own memory-write logic (brief §6).
 *
 * It adds the governance the existing stack lacks (census GOVERNANCE_GAP): the
 * DecisionMemoryEvent contract has NO tenantId, so the spine owns the tenant↔case
 * binding and enforces isolation, consent, idempotency, provenance, correction
 * (versioning), and deletion/retention. It composes — it does not fork — the
 * governed memory + strategic-twin: at runtime the ports delegate to
 * governed-product-memory + governed-strategic-twin; tests inject in-memory ports
 * so compounding + isolation are proven deterministically without a DB.
 *
 * Invariant (from decision-memory-contract): memory informs; it never grants
 * authority. The spine is fail-closed: unknown product, cross-tenant, denied
 * governance, or withdrawn consent all abort the write.
 */

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface StructuredResult {
  summary: string;
  contradictions?: { key: string; detail?: string; severity?: Severity }[];
  evidenceGaps?: { key: string; detail?: string }[];
  commitments?: { key: string; statement: string; owner?: string | null; deadline?: string | null }[];
  signals?: { key: string; value?: number; trend?: "worsening" | "improving" | "flat" }[];
  confidence?: number;
}

export interface ProductInteractionInput {
  tenantId: string;
  caseId: string;
  productCode: string;
  interactionType: string; // e.g. "playbook_run", "instrument_run", "reporting_cycle"
  actorType: "individual" | "team" | "organisation" | "operator";
  occurredAt?: string;
  structuredResult: StructuredResult;
  provenance: { sourceSurface: string; sourceRunId?: string; inputHash?: string };
  consentContext?: { consentGranted: boolean };
  /** explicit dedupe key; otherwise derived deterministically. */
  idempotencyKey?: string;
  /** if set, this interaction corrects/supersedes a prior one (versioning). */
  correctsInteractionId?: string;
}

export interface InteractionRecord {
  interactionId: string;
  tenantId: string;
  caseId: string;
  productCode: string;
  interactionType: string;
  occurredAt: string;
  idempotencyKey: string;
  schemaVersion: string;
  provenance: ProductInteractionInput["provenance"];
  structuredResult: StructuredResult;
  supersedes: string | null;
  supersededBy: string | null;
}

export interface TwinDimensionEntry {
  key: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  status: "active" | "resolved";
  lastSeverity?: Severity;
}

export interface StrategicTwinState {
  tenantId: string;
  caseId: string;
  version: number;
  updatedAt: string;
  contradictions: Record<string, TwinDimensionEntry>;
  evidenceGaps: Record<string, TwinDimensionEntry>;
  commitments: Record<string, { key: string; statement: string; owner: string | null; deadline: string | null; recordedAt: string }>;
  signals: Record<string, { key: string; count: number; lastValue: number | null; trend: string | null }>;
  interactionLineage: string[];
}

export const SPINE_SCHEMA_VERSION = "1.0.0";

export class SpineError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = "SpineError";
    this.code = code;
  }
}

// ── Injectable ports (runtime → governed adapters; tests → in-memory) ─────────

export interface InteractionStore {
  /** tenant bound to a case (first writer wins); null if unbound. */
  getCaseTenant(caseId: string): string | null;
  bindCaseTenant(caseId: string, tenantId: string): void;
  getByIdempotencyKey(tenantId: string, key: string): InteractionRecord | null;
  putInteraction(record: InteractionRecord): void;
  getInteraction(tenantId: string, interactionId: string): InteractionRecord | null;
  getTwin(tenantId: string, caseId: string): StrategicTwinState | null;
  putTwin(twin: StrategicTwinState): void;
  listInteractions(tenantId: string, caseId: string): InteractionRecord[];
  /** deletion/retention: remove all data for a case + tombstone its idempotency keys. */
  deleteCase(tenantId: string, caseId: string): void;
  isTombstoned(tenantId: string, key: string): boolean;
}

export interface SpineDeps {
  store: InteractionStore;
  /** canonical product identity check (runtime: resolveProductCode). */
  isCanonicalProduct: (productCode: string) => boolean;
  /** governance gate (runtime: product-moat-adapter). Default allow for tests. */
  governanceGate?: (productCode: string) => { allowed: boolean; reason?: string };
  hash?: (input: string) => string;
  now?: () => string;
}

function defaultHash(input: string): string {
  // small deterministic hash (djb2) — provenance/idempotency only, not crypto.
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

function deriveIdempotencyKey(input: ProductInteractionInput, hash: (s: string) => string): string {
  if (input.idempotencyKey) return input.idempotencyKey;
  const basis = JSON.stringify({
    t: input.tenantId, c: input.caseId, p: input.productCode, k: input.interactionType,
    o: input.occurredAt ?? "", r: input.structuredResult,
  });
  return `idem_${hash(basis)}`;
}

export interface RecordResult {
  record: InteractionRecord;
  twin: StrategicTwinState;
  deduplicated: boolean;
}

/**
 * Record a governed product interaction. Fail-closed: aborts on unknown product,
 * missing tenant/case, cross-tenant, withdrawn consent, or denied governance.
 * Idempotent by idempotencyKey. Updates the versioned strategic twin.
 */
export function recordProductInteraction(deps: SpineDeps, input: ProductInteractionInput): RecordResult {
  const hash = deps.hash ?? defaultHash;
  const now = deps.now ?? (() => new Date().toISOString());
  const gate = deps.governanceGate ?? (() => ({ allowed: true }));

  // (1) canonical identity
  if (!input.productCode || !deps.isCanonicalProduct(input.productCode)) {
    throw new SpineError("INVALID_PRODUCT", `"${input.productCode}" is not a canonical product identity.`);
  }
  // (2) tenant + case present
  if (!input.tenantId) throw new SpineError("MISSING_TENANT", "tenantId is required.");
  if (!input.caseId) throw new SpineError("MISSING_CASE", "caseId is required.");
  // (3) consent fail-closed
  if (input.consentContext && input.consentContext.consentGranted === false) {
    throw new SpineError("CONSENT_DENIED", "Consent has not been granted for this interaction.");
  }
  // (4) governance gate
  const g = gate(input.productCode);
  if (!g.allowed) throw new SpineError("GOVERNANCE_DENIED", g.reason ?? "Governance denied the interaction.");

  // (5) tenant↔case binding — cross-tenant contamination prevention
  const boundTenant = deps.store.getCaseTenant(input.caseId);
  if (boundTenant && boundTenant !== input.tenantId) {
    throw new SpineError("CROSS_TENANT_DENIED", `Case "${input.caseId}" belongs to another tenant.`);
  }
  if (!boundTenant) deps.store.bindCaseTenant(input.caseId, input.tenantId);

  // (6) idempotency — replay safety + deletion tombstone
  const idempotencyKey = deriveIdempotencyKey(input, hash);
  if (deps.store.isTombstoned(input.tenantId, idempotencyKey)) {
    throw new SpineError("DELETED_CASE_REPLAY_BLOCKED", "This interaction was deleted; replay is refused.");
  }
  const existing = deps.store.getByIdempotencyKey(input.tenantId, idempotencyKey);
  if (existing && !input.correctsInteractionId) {
    const twin = deps.store.getTwin(input.tenantId, input.caseId)!;
    return { record: existing, twin, deduplicated: true };
  }

  const occurredAt = input.occurredAt ?? now();
  const interactionId = `int_${hash(`${idempotencyKey}:${occurredAt}:${input.correctsInteractionId ?? ""}`)}`;

  // (7) correction / versioning — supersede prior, never silently rewrite
  let supersedes: string | null = null;
  if (input.correctsInteractionId) {
    const prior = deps.store.getInteraction(input.tenantId, input.correctsInteractionId);
    if (!prior) throw new SpineError("CORRECTION_TARGET_MISSING", `Cannot correct unknown interaction "${input.correctsInteractionId}".`);
    if (prior.caseId !== input.caseId) throw new SpineError("CROSS_CASE_DENIED", "Correction target belongs to a different case.");
    supersedes = prior.interactionId;
    deps.store.putInteraction({ ...prior, supersededBy: interactionId });
  }

  const record: InteractionRecord = {
    interactionId, tenantId: input.tenantId, caseId: input.caseId, productCode: input.productCode,
    interactionType: input.interactionType, occurredAt, idempotencyKey, schemaVersion: SPINE_SCHEMA_VERSION,
    provenance: input.provenance, structuredResult: input.structuredResult, supersedes, supersededBy: null,
  };
  deps.store.putInteraction(record);

  // (8) twin update (versioned, additive; contradictions preserved not overwritten)
  const twin = applyToTwin(deps.store.getTwin(input.tenantId, input.caseId), record, now);
  deps.store.putTwin(twin);

  return { record, twin, deduplicated: false };
}

function applyToTwin(prev: StrategicTwinState | null, record: InteractionRecord, now: () => string): StrategicTwinState {
  const ts = record.occurredAt || now();
  const twin: StrategicTwinState = prev
    ? { ...prev, contradictions: { ...prev.contradictions }, evidenceGaps: { ...prev.evidenceGaps }, commitments: { ...prev.commitments }, signals: { ...prev.signals }, interactionLineage: [...prev.interactionLineage] }
    : { tenantId: record.tenantId, caseId: record.caseId, version: 0, updatedAt: ts, contradictions: {}, evidenceGaps: {}, commitments: {}, signals: {}, interactionLineage: [] };

  for (const c of record.structuredResult.contradictions ?? []) {
    const e = twin.contradictions[c.key];
    twin.contradictions[c.key] = e
      ? { ...e, count: e.count + 1, lastSeen: ts, status: "active", lastSeverity: c.severity ?? e.lastSeverity }
      : { key: c.key, count: 1, firstSeen: ts, lastSeen: ts, status: "active", lastSeverity: c.severity };
  }
  for (const gp of record.structuredResult.evidenceGaps ?? []) {
    const e = twin.evidenceGaps[gp.key];
    twin.evidenceGaps[gp.key] = e ? { ...e, count: e.count + 1, lastSeen: ts } : { key: gp.key, count: 1, firstSeen: ts, lastSeen: ts, status: "active" };
  }
  for (const cm of record.structuredResult.commitments ?? []) {
    twin.commitments[cm.key] = { key: cm.key, statement: cm.statement, owner: cm.owner ?? null, deadline: cm.deadline ?? null, recordedAt: ts };
  }
  for (const s of record.structuredResult.signals ?? []) {
    const e = twin.signals[s.key];
    twin.signals[s.key] = e ? { ...e, count: e.count + 1, lastValue: s.value ?? e.lastValue, trend: s.trend ?? e.trend } : { key: s.key, count: 1, lastValue: s.value ?? null, trend: s.trend ?? null };
  }
  twin.interactionLineage.push(record.interactionId);
  twin.version = (prev?.version ?? 0) + 1;
  twin.updatedAt = ts;
  return twin;
}

/** Tenant-scoped read model (provenance-preserving). Cross-tenant reads return null. */
export function getStrategicTwin(deps: SpineDeps, tenantId: string, caseId: string): StrategicTwinState | null {
  const boundTenant = deps.store.getCaseTenant(caseId);
  if (boundTenant && boundTenant !== tenantId) return null; // isolation
  return deps.store.getTwin(tenantId, caseId);
}

export function listCaseInteractions(deps: SpineDeps, tenantId: string, caseId: string): InteractionRecord[] {
  const boundTenant = deps.store.getCaseTenant(caseId);
  if (boundTenant && boundTenant !== tenantId) return [];
  return deps.store.listInteractions(tenantId, caseId);
}

/** Deletion/retention: remove case data + tombstone so replay cannot recreate it. */
export function deleteCaseData(deps: SpineDeps, tenantId: string, caseId: string): void {
  const boundTenant = deps.store.getCaseTenant(caseId);
  if (boundTenant && boundTenant !== tenantId) throw new SpineError("CROSS_TENANT_DENIED", "Cannot delete another tenant's case.");
  deps.store.deleteCase(tenantId, caseId);
}

// ── Reference in-memory store (tests + a deterministic reference impl) ─────────

export function createInMemoryInteractionStore(): InteractionStore {
  const caseTenant = new Map<string, string>();
  const interactions = new Map<string, InteractionRecord>(); // key: tenant::interactionId
  const byIdem = new Map<string, string>(); // key: tenant::idem -> interactionId
  const twins = new Map<string, StrategicTwinState>(); // key: tenant::case
  const tombstones = new Set<string>(); // tenant::idem
  const k = (t: string, x: string) => `${t}::${x}`;
  return {
    getCaseTenant: (caseId) => caseTenant.get(caseId) ?? null,
    bindCaseTenant: (caseId, tenantId) => void caseTenant.set(caseId, tenantId),
    getByIdempotencyKey: (t, key) => {
      const id = byIdem.get(k(t, key));
      return id ? interactions.get(k(t, id)) ?? null : null;
    },
    putInteraction: (r) => {
      interactions.set(k(r.tenantId, r.interactionId), { ...r });
      byIdem.set(k(r.tenantId, r.idempotencyKey), r.interactionId);
    },
    getInteraction: (t, id) => interactions.get(k(t, id)) ?? null,
    getTwin: (t, c) => twins.get(k(t, c)) ?? null,
    putTwin: (twin) => void twins.set(k(twin.tenantId, twin.caseId), { ...twin }),
    listInteractions: (t, c) => Array.from(interactions.values()).filter((r) => r.tenantId === t && r.caseId === c),
    deleteCase: (t, c) => {
      for (const [key, r] of interactions) {
        if (r.tenantId === t && r.caseId === c) {
          interactions.delete(key);
          tombstones.add(k(t, r.idempotencyKey));
          byIdem.delete(k(t, r.idempotencyKey));
        }
      }
      twins.delete(k(t, c));
      caseTenant.delete(c);
    },
    isTombstoned: (t, key) => tombstones.has(k(t, key)),
  };
}
