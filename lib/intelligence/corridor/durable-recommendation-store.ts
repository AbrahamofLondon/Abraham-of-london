/**
 * lib/intelligence/corridor/durable-recommendation-store.ts
 *
 * §10 — Durable corridor recommendation store.
 *
 * Replaces the in-memory runtime-corridor-binding with SQLite persistence.
 * Records recommendations and customer actions durably.
 */
import Database from "better-sqlite3";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const DB_DIR = join(process.cwd(), "data", "corridor");
const DB_PATH = join(DB_DIR, "recommendation-store.sqlite");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS recommendations (
      recommendation_id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      twin_version INTEGER NOT NULL,
      target_product_code TEXT NOT NULL,
      evidence_basis TEXT NOT NULL DEFAULT '[]',
      governance_result TEXT NOT NULL,
      commercial_action TEXT NOT NULL,
      generated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customer_actions (
      action_id TEXT PRIMARY KEY,
      recommendation_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      FOREIGN KEY (recommendation_id) REFERENCES recommendations(recommendation_id)
    );
    CREATE INDEX IF NOT EXISTS idx_rec_tenant ON recommendations(tenant_id, case_id);
    CREATE INDEX IF NOT EXISTS idx_actions_rec ON customer_actions(recommendation_id);
  `);
  return _db;
}

export interface DurableRecommendation {
  recommendationId: string;
  tenantId: string;
  caseId: string;
  twinVersion: number;
  targetProductCode: string;
  evidenceBasis: string[];
  governanceResult: string;
  commercialAction: string;
  generatedAt: string;
  customerActions: Array<{ actionType: string; occurredAt: string }>;
}

export function storeRecommendation(input: Omit<DurableRecommendation, "recommendationId" | "generatedAt" | "customerActions">): DurableRecommendation {
  const db = getDb();
  const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  db.prepare("INSERT INTO recommendations (recommendation_id, tenant_id, case_id, twin_version, target_product_code, evidence_basis, governance_result, commercial_action, generated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, input.tenantId, input.caseId, input.twinVersion, input.targetProductCode, JSON.stringify(input.evidenceBasis), input.governanceResult, input.commercialAction, now);
  return { recommendationId: id, ...input, generatedAt: now, customerActions: [] };
}

export function recordAction(recommendationId: string, actionType: string): boolean {
  const db = getDb();
  const rec = db.prepare("SELECT recommendation_id FROM recommendations WHERE recommendation_id = ?").get(recommendationId);
  if (!rec) return false;
  const actionId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.prepare("INSERT INTO customer_actions (action_id, recommendation_id, action_type, occurred_at) VALUES (?, ?, ?, ?)")
    .run(actionId, recommendationId, actionType, new Date().toISOString());
  return true;
}

export function getRecommendations(tenantId: string, caseId: string): DurableRecommendation[] {
  const db = getDb();
  const recs = db.prepare("SELECT * FROM recommendations WHERE tenant_id = ? AND case_id = ? ORDER BY generated_at DESC").all(tenantId, caseId) as any[];
  return recs.map((r: any) => {
    const actions = db.prepare("SELECT * FROM customer_actions WHERE recommendation_id = ? ORDER BY occurred_at ASC").all(r.recommendation_id) as any[];
    return {
      recommendationId: r.recommendation_id,
      tenantId: r.tenant_id,
      caseId: r.case_id,
      twinVersion: r.twin_version,
      targetProductCode: r.target_product_code,
      evidenceBasis: JSON.parse(r.evidence_basis || "[]"),
      governanceResult: r.governance_result,
      commercialAction: r.commercial_action,
      generatedAt: r.generated_at,
      customerActions: actions.map((a: any) => ({ actionType: a.action_type, occurredAt: a.occurred_at })),
    };
  });
}

export function closeRecommendationDatabase(): void {
  if (_db) { try { _db.close(); } catch { } _db = null; }
}
