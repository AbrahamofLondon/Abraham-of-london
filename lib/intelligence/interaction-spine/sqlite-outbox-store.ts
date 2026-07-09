/**
 * lib/intelligence/interaction-spine/sqlite-outbox-store.ts
 *
 * DURABLE outbox persistence (better-sqlite3) implementing the OutboxStore
 * interface, so the durable-propagation guarantees are proven against a real DB
 * (§7): committed event → durable row → consumer processing → state transitions →
 * dead-letter, consumer idempotency, and deleted-interaction tombstones all persist.
 */

import Database from "better-sqlite3";
import type { OutboxStore, OutboxEvent, OutboxProcessingState } from "./interaction-outbox";

export interface SqliteOutboxStore extends OutboxStore {
  close(): void;
  readonly db: Database.Database;
}

export function createSqliteOutboxStore(dbPath = ":memory:"): SqliteOutboxStore {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS outbox_events (
      event_id TEXT PRIMARY KEY, schema_version TEXT, interaction_id TEXT, tenant_id TEXT, case_id TEXT,
      product_code TEXT, correlation_id TEXT, causation_id TEXT, event_type TEXT, payload_hash TEXT,
      payload TEXT, created_at TEXT, processing_state TEXT, attempts INTEGER, last_attempt_at TEXT,
      next_attempt_at TEXT, failure_code TEXT, failure_reason TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_outbox_state ON outbox_events(processing_state);
    CREATE TABLE IF NOT EXISTS outbox_consumed (event_id TEXT, consumer TEXT, PRIMARY KEY (event_id, consumer));
    CREATE TABLE IF NOT EXISTS outbox_tombstones (interaction_id TEXT PRIMARY KEY);
  `);

  const toEvent = (r: any): OutboxEvent => ({
    eventId: r.event_id, schemaVersion: r.schema_version, interactionId: r.interaction_id, tenantId: r.tenant_id,
    caseId: r.case_id, productCode: r.product_code, correlationId: r.correlation_id, causationId: r.causation_id,
    eventType: r.event_type, payloadHash: r.payload_hash, payload: JSON.parse(r.payload), createdAt: r.created_at,
    processingState: r.processing_state as OutboxProcessingState, attempts: r.attempts, lastAttemptAt: r.last_attempt_at ?? null,
    nextAttemptAt: r.next_attempt_at ?? null, failureCode: r.failure_code ?? null, failureReason: r.failure_reason ?? null,
  });

  const upsert = db.prepare(`INSERT INTO outbox_events
    (event_id, schema_version, interaction_id, tenant_id, case_id, product_code, correlation_id, causation_id, event_type, payload_hash, payload, created_at, processing_state, attempts, last_attempt_at, next_attempt_at, failure_code, failure_reason)
    VALUES (@event_id,@schema_version,@interaction_id,@tenant_id,@case_id,@product_code,@correlation_id,@causation_id,@event_type,@payload_hash,@payload,@created_at,@processing_state,@attempts,@last_attempt_at,@next_attempt_at,@failure_code,@failure_reason)
    ON CONFLICT(event_id) DO UPDATE SET processing_state=excluded.processing_state, attempts=excluded.attempts, last_attempt_at=excluded.last_attempt_at, next_attempt_at=excluded.next_attempt_at, failure_code=excluded.failure_code, failure_reason=excluded.failure_reason`);
  const params = (e: OutboxEvent) => ({
    event_id: e.eventId, schema_version: e.schemaVersion, interaction_id: e.interactionId, tenant_id: e.tenantId,
    case_id: e.caseId, product_code: e.productCode, correlation_id: e.correlationId, causation_id: e.causationId,
    event_type: e.eventType, payload_hash: e.payloadHash, payload: JSON.stringify(e.payload), created_at: e.createdAt,
    processing_state: e.processingState, attempts: e.attempts, last_attempt_at: e.lastAttemptAt, next_attempt_at: e.nextAttemptAt,
    failure_code: e.failureCode, failure_reason: e.failureReason,
  });
  const q = {
    get: db.prepare("SELECT * FROM outbox_events WHERE event_id = ?"),
    byState: db.prepare("SELECT * FROM outbox_events WHERE processing_state = ?"),
    consumed: db.prepare("SELECT 1 FROM outbox_consumed WHERE event_id = ? AND consumer = ?"),
    markConsumed: db.prepare("INSERT OR IGNORE INTO outbox_consumed (event_id, consumer) VALUES (?, ?)"),
    tomb: db.prepare("SELECT 1 FROM outbox_tombstones WHERE interaction_id = ?"),
    addTomb: db.prepare("INSERT OR IGNORE INTO outbox_tombstones (interaction_id) VALUES (?)"),
    dead: db.prepare("SELECT * FROM outbox_events WHERE processing_state = 'DEAD_LETTER'"),
  };

  return {
    db,
    close: () => db.close(),
    append: (e) => void upsert.run(params(e)),
    get: (id) => { const r = q.get.get(id); return r ? toEvent(r) : null; },
    listByState: (s) => (q.byState.all(s) as any[]).map(toEvent),
    update: (e) => void upsert.run(params(e)),
    isConsumed: (eventId, consumer) => Boolean(q.consumed.get(eventId, consumer)),
    markConsumed: (eventId, consumer) => void q.markConsumed.run(eventId, consumer),
    isInteractionTombstoned: (id) => Boolean(q.tomb.get(id)),
    tombstoneInteraction: (id) => void q.addTomb.run(id),
    deadLetters: () => (q.dead.all() as any[]).map(toEvent),
  };
}
