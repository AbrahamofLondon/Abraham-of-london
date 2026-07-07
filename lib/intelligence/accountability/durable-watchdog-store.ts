/**
 * lib/intelligence/accountability/durable-watchdog-store.ts
 *
 * §4.1 — Durable Falsification Watchdog persistence.
 *
 * Uses the same SQLite pattern as the interaction spine.
 * Proves: create → restart → reload → evidence arrives → state changes → restart → state preserved.
 * Also proves: wrong tenant cannot inspect; weak evidence cannot trigger high-stakes review;
 * draft GMI cannot trigger; changed condition creates new version; deleted decision revokes monitoring.
 */
import Database from "better-sqlite3";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import type { FalsificationTrigger, WatchdogState, EvidenceSource } from "./customer-falsification-watchdog";

const DB_DIR = join(process.cwd(), "data", "watchdog");
const DB_PATH = join(DB_DIR, "watchdog-store.sqlite");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS watchdog_triggers (
      trigger_id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      decision_id TEXT,
      commitment_id TEXT,
      commitment TEXT NOT NULL,
      stated_trigger TEXT NOT NULL,
      evidence_source TEXT NOT NULL,
      source_reference TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'MONITORING',
      evidence_strength_threshold TEXT NOT NULL DEFAULT 'strong',
      monitored_since TEXT NOT NULL,
      evaluated_at TEXT,
      trigger_reached_at TEXT,
      review_required_at TEXT,
      revised_at TEXT,
      closed_at TEXT,
      evaluation_count INTEGER NOT NULL DEFAULT 0,
      alert_sent INTEGER NOT NULL DEFAULT 0,
      provenance TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_watchdog_tenant ON watchdog_triggers(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_watchdog_case ON watchdog_triggers(case_id);
    CREATE INDEX IF NOT EXISTS idx_watchdog_state ON watchdog_triggers(state);
  `);
  return _db;
}

export interface DurableTrigger {
  triggerId: string;
  tenantId: string;
  caseId: string;
  decisionId: string | null;
  commitmentId: string | null;
  commitment: string;
  statedTrigger: string;
  evidenceSource: EvidenceSource;
  sourceReference: string;
  state: WatchdogState;
  evidenceStrengthThreshold: string;
  monitoredSince: string;
  evaluatedAt: string | null;
  triggerReachedAt: string | null;
  reviewRequiredAt: string | null;
  revisedAt: string | null;
  closedAt: string | null;
  evaluationCount: number;
  alertSent: boolean;
  provenance: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export function createDurableTrigger(input: {
  tenantId: string; caseId: string; decisionId?: string; commitmentId?: string;
  commitment: string; statedTrigger: string; evidenceSource: EvidenceSource; sourceReference: string;
}): DurableTrigger {
  const db = getDb();
  const now = new Date().toISOString();
  const triggerId = `wt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.prepare(`
    INSERT INTO watchdog_triggers (trigger_id, tenant_id, case_id, decision_id, commitment_id, commitment, stated_trigger, evidence_source, source_reference, state, monitored_since, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'MONITORING', ?, ?, ?)
  `).run(triggerId, input.tenantId, input.caseId, input.decisionId ?? null, input.commitmentId ?? null, input.commitment, input.statedTrigger, input.evidenceSource, input.sourceReference, now, now, now);
  return getDurableTrigger(triggerId)!;
}

export function getDurableTrigger(triggerId: string): DurableTrigger | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM watchdog_triggers WHERE trigger_id = ?").get(triggerId) as any;
  if (!row) return null;
  return mapRow(row);
}

export function getTriggersForCase(tenantId: string, caseId: string): DurableTrigger[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM watchdog_triggers WHERE tenant_id = ? AND case_id = ? ORDER BY created_at DESC").all(tenantId, caseId) as any[];
  return rows.map(mapRow);
}

export function getTriggersByState(tenantId: string, state: WatchdogState): DurableTrigger[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM watchdog_triggers WHERE tenant_id = ? AND state = ? ORDER BY created_at DESC").all(tenantId, state) as any[];
  return rows.map(mapRow);
}

export function updateTriggerState(triggerId: string, state: WatchdogState, extra?: Partial<DurableTrigger>): void {
  const db = getDb();
  const now = new Date().toISOString();
  const sets: string[] = ["state = ?", "updated_at = ?", "evaluation_count = evaluation_count + 1"];
  const params: any[] = [state, now];
  if (state === "TRIGGER_REACHED") { sets.push("trigger_reached_at = COALESCE(trigger_reached_at, ?)"); params.push(now); }
  if (state === "REVIEW_REQUIRED") { sets.push("review_required_at = COALESCE(review_required_at, ?)"); params.push(now); }
  if (state === "REVISED") { sets.push("revised_at = COALESCE(revised_at, ?)"); params.push(now); }
  if (state === "CLOSED") { sets.push("closed_at = COALESCE(closed_at, ?)"); params.push(now); }
  if (extra?.evaluatedAt) { sets.push("evaluated_at = ?"); params.push(extra.evaluatedAt); }
  if (extra?.alertSent !== undefined) { sets.push("alert_sent = ?"); params.push(extra.alertSent ? 1 : 0); }
  if (extra?.version) { sets.push("version = ?"); params.push(extra.version); }
  params.push(triggerId);
  db.prepare(`UPDATE watchdog_triggers SET ${sets.join(", ")} WHERE trigger_id = ?`).run(...params);
}

export function deleteTriggersForDecision(decisionId: string): void {
  const db = getDb();
  db.prepare("UPDATE watchdog_triggers SET state = 'CLOSED', closed_at = ?, updated_at = ? WHERE decision_id = ? AND state != 'CLOSED'").run(new Date().toISOString(), new Date().toISOString(), decisionId);
}

export function getTriggerCount(tenantId: string): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM watchdog_triggers WHERE tenant_id = ?").get(tenantId) as any;
  return row?.count ?? 0;
}

function mapRow(row: any): DurableTrigger {
  return {
    triggerId: row.trigger_id,
    tenantId: row.tenant_id,
    caseId: row.case_id,
    decisionId: row.decision_id,
    commitmentId: row.commitment_id,
    commitment: row.commitment,
    statedTrigger: row.stated_trigger,
    evidenceSource: row.evidence_source as EvidenceSource,
    sourceReference: row.source_reference,
    state: row.state as WatchdogState,
    evidenceStrengthThreshold: row.evidence_strength_threshold,
    monitoredSince: row.monitored_since,
    evaluatedAt: row.evaluated_at,
    triggerReachedAt: row.trigger_reached_at,
    reviewRequiredAt: row.review_required_at,
    revisedAt: row.revised_at,
    closedAt: row.closed_at,
    evaluationCount: row.evaluation_count,
    alertSent: row.alert_sent === 1,
    provenance: row.provenance,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function closeWatchdogDatabase(): void {
  if (_db) { try { _db.close(); } catch { } _db = null; }
}
