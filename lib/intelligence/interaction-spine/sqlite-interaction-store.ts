/**
 * lib/intelligence/interaction-spine/sqlite-interaction-store.ts
 *
 * DURABLE, tenant-isolated persistence for the canonical interaction spine, backed
 * by better-sqlite3 (a real embedded database already vendored in this repo). This
 * makes the governed path both SAFE (tenant isolation, idempotency, deletion) AND
 * DURABLE (persisted to disk) — resolving the "safe-but-non-durable vs
 * durable-but-unsafe" split. Implements the same InteractionStore interface the
 * spine already depends on, so the identical proof suite runs against a real DB.
 *
 * The embedded schema below is the canonical persistence model for interactions,
 * twins, case↔tenant bindings, and deletion tombstones. Runtime uses a file DB;
 * tests use an ephemeral one — no production DB, no deploy.
 */

import Database from "better-sqlite3";
import type { InteractionStore, InteractionRecord, StrategicTwinState } from "./product-interaction-spine";

export interface SqliteInteractionStore extends InteractionStore {
  close(): void;
  /** raw handle for durability assertions in tests. */
  readonly db: Database.Database;
}

export function createSqliteInteractionStore(dbPath = ":memory:"): SqliteInteractionStore {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  // canonical persistence schema (idempotent migration)
  db.exec(`
    CREATE TABLE IF NOT EXISTS case_tenant (case_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS interactions (
      tenant_id TEXT NOT NULL, interaction_id TEXT NOT NULL, case_id TEXT NOT NULL,
      product_code TEXT NOT NULL, interaction_type TEXT NOT NULL, occurred_at TEXT NOT NULL,
      idempotency_key TEXT NOT NULL, schema_version TEXT NOT NULL,
      provenance TEXT NOT NULL, structured_result TEXT NOT NULL,
      supersedes TEXT, superseded_by TEXT,
      PRIMARY KEY (tenant_id, interaction_id)
    );
    CREATE INDEX IF NOT EXISTS idx_interactions_idem ON interactions(tenant_id, idempotency_key);
    CREATE INDEX IF NOT EXISTS idx_interactions_case ON interactions(tenant_id, case_id);
    CREATE TABLE IF NOT EXISTS twins (tenant_id TEXT NOT NULL, case_id TEXT NOT NULL, version INTEGER NOT NULL, state TEXT NOT NULL, PRIMARY KEY (tenant_id, case_id));
    CREATE TABLE IF NOT EXISTS tombstones (tenant_id TEXT NOT NULL, idem TEXT NOT NULL, PRIMARY KEY (tenant_id, idem));
  `);

  const rowToRecord = (r: any): InteractionRecord => ({
    interactionId: r.interaction_id, tenantId: r.tenant_id, caseId: r.case_id, productCode: r.product_code,
    interactionType: r.interaction_type, occurredAt: r.occurred_at, idempotencyKey: r.idempotency_key,
    schemaVersion: r.schema_version, provenance: JSON.parse(r.provenance), structuredResult: JSON.parse(r.structured_result),
    supersedes: r.supersedes ?? null, supersededBy: r.superseded_by ?? null,
  });

  const st = {
    getCaseTenant: db.prepare("SELECT tenant_id FROM case_tenant WHERE case_id = ?"),
    bindCaseTenant: db.prepare("INSERT OR IGNORE INTO case_tenant (case_id, tenant_id) VALUES (?, ?)"),
    getByIdem: db.prepare("SELECT * FROM interactions WHERE tenant_id = ? AND idempotency_key = ? LIMIT 1"),
    upsertInteraction: db.prepare(`INSERT INTO interactions
      (tenant_id, interaction_id, case_id, product_code, interaction_type, occurred_at, idempotency_key, schema_version, provenance, structured_result, supersedes, superseded_by)
      VALUES (@tenant_id,@interaction_id,@case_id,@product_code,@interaction_type,@occurred_at,@idempotency_key,@schema_version,@provenance,@structured_result,@supersedes,@superseded_by)
      ON CONFLICT(tenant_id, interaction_id) DO UPDATE SET superseded_by=excluded.superseded_by, structured_result=excluded.structured_result`),
    getInteraction: db.prepare("SELECT * FROM interactions WHERE tenant_id = ? AND interaction_id = ?"),
    getTwin: db.prepare("SELECT state FROM twins WHERE tenant_id = ? AND case_id = ?"),
    upsertTwin: db.prepare("INSERT INTO twins (tenant_id, case_id, version, state) VALUES (?,?,?,?) ON CONFLICT(tenant_id, case_id) DO UPDATE SET version=excluded.version, state=excluded.state"),
    listInteractions: db.prepare("SELECT * FROM interactions WHERE tenant_id = ? AND case_id = ?"),
    delInteractions: db.prepare("SELECT idempotency_key FROM interactions WHERE tenant_id = ? AND case_id = ?"),
    delInteractionsRun: db.prepare("DELETE FROM interactions WHERE tenant_id = ? AND case_id = ?"),
    delTwin: db.prepare("DELETE FROM twins WHERE tenant_id = ? AND case_id = ?"),
    delCaseTenant: db.prepare("DELETE FROM case_tenant WHERE case_id = ?"),
    addTombstone: db.prepare("INSERT OR IGNORE INTO tombstones (tenant_id, idem) VALUES (?, ?)"),
    isTombstoned: db.prepare("SELECT 1 FROM tombstones WHERE tenant_id = ? AND idem = ?"),
  };

  return {
    db,
    close: () => db.close(),
    getCaseTenant: (caseId) => (st.getCaseTenant.get(caseId) as any)?.tenant_id ?? null,
    bindCaseTenant: (caseId, tenantId) => void st.bindCaseTenant.run(caseId, tenantId),
    getByIdempotencyKey: (tenantId, key) => { const r = st.getByIdem.get(tenantId, key); return r ? rowToRecord(r) : null; },
    putInteraction: (rec) => st.upsertInteraction.run({
      tenant_id: rec.tenantId, interaction_id: rec.interactionId, case_id: rec.caseId, product_code: rec.productCode,
      interaction_type: rec.interactionType, occurred_at: rec.occurredAt, idempotency_key: rec.idempotencyKey,
      schema_version: rec.schemaVersion, provenance: JSON.stringify(rec.provenance), structured_result: JSON.stringify(rec.structuredResult),
      supersedes: rec.supersedes, superseded_by: rec.supersededBy,
    }),
    getInteraction: (tenantId, id) => { const r = st.getInteraction.get(tenantId, id); return r ? rowToRecord(r) : null; },
    getTwin: (tenantId, caseId) => { const r = st.getTwin.get(tenantId, caseId) as any; return r ? (JSON.parse(r.state) as StrategicTwinState) : null; },
    putTwin: (twin) => void st.upsertTwin.run(twin.tenantId, twin.caseId, twin.version, JSON.stringify(twin)),
    listInteractions: (tenantId, caseId) => (st.listInteractions.all(tenantId, caseId) as any[]).map(rowToRecord),
    deleteCase: (tenantId, caseId) => {
      const idems = (st.delInteractions.all(tenantId, caseId) as any[]).map((r) => r.idempotency_key as string);
      const tx = db.transaction(() => {
        for (const idem of idems) st.addTombstone.run(tenantId, idem);
        st.delInteractionsRun.run(tenantId, caseId);
        st.delTwin.run(tenantId, caseId);
        st.delCaseTenant.run(caseId);
      });
      tx();
    },
    isTombstoned: (tenantId, key) => Boolean(st.isTombstoned.get(tenantId, key)),
  };
}
