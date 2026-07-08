/**
 * lib/intelligence/corridor/recommendation-context-store.ts
 *
 * Durable recommendation context for the flagship journey. Signal produces a stable
 * recommendation identity; Corridor must not recompute from an empty demo twin or rely on
 * memory-only state. This store persists the minimal, non-sensitive decision state needed
 * to render the next admissible move and prove why it is admissible.
 */

import Database from "better-sqlite3";
import crypto from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export type CorridorAccessMode = "free" | "self_serve" | "controlled" | "manual_billing" | "unavailable" | "none";

export interface RecommendationContextInput {
  recommendationId: string;
  sessionId: string;
  sessionVersion?: number;
  pressureBand: string;
  targetProductCode: string;
  targetLabel: string;
  targetRoute: string;
  accessMode: CorridorAccessMode;
  whyAdmissible: string;
  evidenceBasis: string[];
  established: string[];
  unresolved: {
    contradiction: string | null;
    evidenceGap: string | null;
    ownershipGap: string | null;
    timingPressure: string | null;
    unresolvedCommitment: string | null;
  };
  notYetAppropriate: string | null;
  carryForward: string[];
  stateHash?: string;
}

export interface RecommendationContextRecord extends RecommendationContextInput {
  contextId: string;
  createdAt: string;
  updatedAt: string;
  stateHash: string;
}

const DB_DIR = join(process.cwd(), "data", "corridor");
const DB_PATH = join(DB_DIR, "recommendation-context.sqlite");
let _db: Database.Database | null = null;

function schema(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS recommendation_contexts (
    recommendation_id TEXT PRIMARY KEY,
    context_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    session_version INTEGER NOT NULL,
    pressure_band TEXT NOT NULL,
    target_product_code TEXT NOT NULL,
    target_label TEXT NOT NULL,
    target_route TEXT NOT NULL,
    access_mode TEXT NOT NULL,
    why_admissible TEXT NOT NULL,
    evidence_basis_json TEXT NOT NULL,
    established_json TEXT NOT NULL,
    unresolved_json TEXT NOT NULL,
    not_yet_appropriate TEXT,
    carry_forward_json TEXT NOT NULL,
    state_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_recommendation_session ON recommendation_contexts(session_id)`);
}

function getDb(): Database.Database {
  if (_db) return _db;
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  schema(db);
  _db = db;
  return db;
}

export function _setRecommendationContextDbForTest(db: Database.Database): void {
  _db = db;
  schema(db);
}

function hashState(input: RecommendationContextInput): string {
  return crypto.createHash("sha256").update(JSON.stringify({
    recommendationId: input.recommendationId,
    sessionId: input.sessionId,
    sessionVersion: input.sessionVersion ?? 1,
    pressureBand: input.pressureBand,
    targetProductCode: input.targetProductCode,
    accessMode: input.accessMode,
    evidenceBasis: input.evidenceBasis,
    unresolved: input.unresolved,
  })).digest("hex");
}

function rowToRecord(row: any): RecommendationContextRecord {
  return {
    recommendationId: row.recommendation_id,
    contextId: row.context_id,
    sessionId: row.session_id,
    sessionVersion: row.session_version,
    pressureBand: row.pressure_band,
    targetProductCode: row.target_product_code,
    targetLabel: row.target_label,
    targetRoute: row.target_route,
    accessMode: row.access_mode,
    whyAdmissible: row.why_admissible,
    evidenceBasis: JSON.parse(row.evidence_basis_json),
    established: JSON.parse(row.established_json),
    unresolved: JSON.parse(row.unresolved_json),
    notYetAppropriate: row.not_yet_appropriate ?? null,
    carryForward: JSON.parse(row.carry_forward_json),
    stateHash: row.state_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function saveRecommendationContext(input: RecommendationContextInput, now = new Date().toISOString()): RecommendationContextRecord {
  if (!/^rec_[A-Za-z0-9_-]{6,}$/.test(input.recommendationId)) throw new Error("Invalid recommendation id");
  if (!input.sessionId || input.sessionId.length > 96) throw new Error("Invalid session id");
  const db = getDb();
  const existing = getRecommendationContext(input.recommendationId);
  const stateHash = input.stateHash ?? hashState(input);
  const contextId = existing?.contextId ?? `ctx_${crypto.randomBytes(10).toString("hex")}`;
  const createdAt = existing?.createdAt ?? now;
  db.prepare(`INSERT OR REPLACE INTO recommendation_contexts (
    recommendation_id, context_id, session_id, session_version, pressure_band, target_product_code,
    target_label, target_route, access_mode, why_admissible, evidence_basis_json, established_json,
    unresolved_json, not_yet_appropriate, carry_forward_json, state_hash, created_at, updated_at
  ) VALUES (@recommendationId, @contextId, @sessionId, @sessionVersion, @pressureBand, @targetProductCode,
    @targetLabel, @targetRoute, @accessMode, @whyAdmissible, @evidenceBasisJson, @establishedJson,
    @unresolvedJson, @notYetAppropriate, @carryForwardJson, @stateHash, @createdAt, @updatedAt)`).run({
    recommendationId: input.recommendationId,
    contextId,
    sessionId: input.sessionId,
    sessionVersion: input.sessionVersion ?? 1,
    pressureBand: input.pressureBand,
    targetProductCode: input.targetProductCode,
    targetLabel: input.targetLabel,
    targetRoute: input.targetRoute,
    accessMode: input.accessMode,
    whyAdmissible: input.whyAdmissible,
    evidenceBasisJson: JSON.stringify(input.evidenceBasis.slice(0, 8)),
    establishedJson: JSON.stringify(input.established.slice(0, 8)),
    unresolvedJson: JSON.stringify(input.unresolved),
    notYetAppropriate: input.notYetAppropriate,
    carryForwardJson: JSON.stringify(input.carryForward.slice(0, 8)),
    stateHash,
    createdAt,
    updatedAt: now,
  });
  const saved = getRecommendationContext(input.recommendationId);
  if (!saved) throw new Error("Recommendation context save failed");
  return saved;
}

export function getRecommendationContext(recommendationId: string): RecommendationContextRecord | null {
  const row = getDb().prepare(`SELECT * FROM recommendation_contexts WHERE recommendation_id = ?`).get(recommendationId);
  return row ? rowToRecord(row) : null;
}

export function listRecommendationContextsForSession(sessionId: string): RecommendationContextRecord[] {
  return getDb().prepare(`SELECT * FROM recommendation_contexts WHERE session_id = ? ORDER BY updated_at DESC`).all(sessionId).map(rowToRecord);
}

export function isRecommendationContextStale(record: RecommendationContextRecord, now = new Date(), maxAgeMs = 24 * 60 * 60 * 1000): boolean {
  const updated = Date.parse(record.updatedAt);
  return !Number.isFinite(updated) || now.getTime() - updated > maxAgeMs;
}
