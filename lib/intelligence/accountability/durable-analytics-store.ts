/**
 * lib/intelligence/accountability/durable-analytics-store.ts
 *
 * §4.3 — Durable Corridor Analytics persistence.
 *
 * Persists progression events with tenant isolation, duplicate event idempotency,
 * and no sensitive decision payload.
 */
import Database from "better-sqlite3";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const DB_DIR = join(process.cwd(), "data", "analytics");
const DB_PATH = join(DB_DIR, "analytics-store.sqlite");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      event_id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      case_id TEXT,
      product_code TEXT NOT NULL,
      corridor_state TEXT,
      recommendation_id TEXT,
      event_type TEXT NOT NULL,
      source_product_code TEXT,
      occurred_at TEXT NOT NULL,
      provenance TEXT,
      consent_basis TEXT DEFAULT 'analytics',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      deduplication_key TEXT UNIQUE,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_analytics_tenant ON analytics_events(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_customer ON analytics_events(customer_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_product ON analytics_events(product_code);
  `);
  return _db;
}

export interface AnalyticsEvent {
  eventId: string;
  tenantId: string;
  customerId: string;
  caseId: string | null;
  productCode: string;
  corridorState: string | null;
  recommendationId: string | null;
  eventType: string;
  sourceProductCode: string | null;
  occurredAt: string;
  provenance: string | null;
  consentBasis: string;
  metadata: Record<string, string>;
  deduplicationKey: string | null;
  createdAt: string;
}

export function recordAnalyticsEvent(input: {
  tenantId: string; customerId: string; caseId?: string; productCode: string;
  corridorState?: string; recommendationId?: string; eventType: string;
  sourceProductCode?: string | null; provenance?: string; consentBasis?: string;
  metadata?: Record<string, string>; deduplicationKey?: string;
}): AnalyticsEvent {
  const db = getDb();
  const now = new Date().toISOString();
  const eventId = `ae_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const dedupKey = input.deduplicationKey ?? `${input.tenantId}:${input.eventType}:${input.productCode}:${input.customerId}:${now}`;
  try {
    db.prepare(`
      INSERT INTO analytics_events (event_id, tenant_id, customer_id, case_id, product_code, corridor_state, recommendation_id, event_type, source_product_code, occurred_at, provenance, consent_basis, metadata_json, deduplication_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(eventId, input.tenantId, input.customerId, input.caseId ?? null, input.productCode, input.corridorState ?? null, input.recommendationId ?? null, input.eventType, input.sourceProductCode ?? null, now, input.provenance ?? null, input.consentBasis ?? "analytics", JSON.stringify(input.metadata ?? {}), dedupKey, now);
  } catch (e: any) {
    if (e?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      // Duplicate event — return existing
      const existing = db.prepare("SELECT * FROM analytics_events WHERE deduplication_key = ?").get(dedupKey) as any;
      if (existing) return mapEvent(existing);
    }
    throw e;
  }
  return getAnalyticsEvent(eventId)!;
}

export function getAnalyticsEvent(eventId: string): AnalyticsEvent | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM analytics_events WHERE event_id = ?").get(eventId) as any;
  return row ? mapEvent(row) : null;
}

export function getEventsForCustomer(tenantId: string, customerId: string, limit: number = 100): AnalyticsEvent[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM analytics_events WHERE tenant_id = ? AND customer_id = ? ORDER BY occurred_at DESC LIMIT ?").all(tenantId, customerId, limit) as any[];
  return rows.map(mapEvent);
}

export function getEventsByType(tenantId: string, eventType: string, limit: number = 100): AnalyticsEvent[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM analytics_events WHERE tenant_id = ? AND event_type = ? ORDER BY occurred_at DESC LIMIT ?").all(tenantId, eventType, limit) as any[];
  return rows.map(mapEvent);
}

export function getFunnelSummary(tenantId: string): { eventType: string; count: number }[] {
  const db = getDb();
  return db.prepare("SELECT event_type, COUNT(*) as count FROM analytics_events WHERE tenant_id = ? GROUP BY event_type ORDER BY count DESC").all(tenantId) as any[];
}

export function getStallRate(tenantId: string): { total: number; stalled: number; rate: number } {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE tenant_id = ? AND event_type = 'product_started'").get(tenantId) as any)?.count ?? 0;
  const stalled = (db.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE tenant_id = ? AND event_type = 'corridor_stall'").get(tenantId) as any)?.count ?? 0;
  return { total, stalled, rate: total > 0 ? stalled / total : 0 };
}

export function closeAnalyticsDatabase(): void {
  if (_db) { try { _db.close(); } catch { } _db = null; }
}

function mapEvent(row: any): AnalyticsEvent {
  return {
    eventId: row.event_id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    caseId: row.case_id,
    productCode: row.product_code,
    corridorState: row.corridor_state,
    recommendationId: row.recommendation_id,
    eventType: row.event_type,
    sourceProductCode: row.source_product_code,
    occurredAt: row.occurred_at,
    provenance: row.provenance,
    consentBasis: row.consent_basis,
    metadata: JSON.parse(row.metadata_json || "{}"),
    deduplicationKey: row.deduplication_key,
    createdAt: row.created_at,
  };
}
