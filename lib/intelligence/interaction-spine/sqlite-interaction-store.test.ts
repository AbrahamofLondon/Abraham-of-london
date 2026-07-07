/**
 * lib/intelligence/interaction-spine/sqlite-interaction-store.test.ts
 *
 * Proves the DURABLE persistence round-trip against a REAL database (better-sqlite3),
 * not an in-memory mock (§4/§5/§7): migration applies → runtime interaction persisted
 * → memory + twin version persisted → read back → tenant isolation holds → correction
 * creates a version → deletion + tombstone → replay does not resurrect. Plus
 * cross-connection disk durability.
 */

import { describe, it, expect, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSqliteInteractionStore } from "./sqlite-interaction-store";
import { recordProductInteraction, getStrategicTwin, deleteCaseData, SpineError, type SpineDeps } from "./product-interaction-spine";

const CANON = new Set(["execution_integrity_protocol"]);
function deps(store: ReturnType<typeof createSqliteInteractionStore>): SpineDeps {
  return { store, isCanonicalProduct: (p) => CANON.has(p), now: () => "2026-07-07T00:00:00Z" };
}
const input = (o: any = {}) => ({
  tenantId: "tA", caseId: "c1", productCode: "execution_integrity_protocol", interactionType: "playbook_run",
  actorType: "organisation" as const, provenance: { sourceSurface: "s", sourceRunId: "run1" },
  structuredResult: { summary: "r", contradictions: [{ key: "supply_dependency", severity: "HIGH" as const }] }, ...o,
});

const tmp = mkdtempSync(join(tmpdir(), "spine-sqlite-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe("durable SQLite interaction store (§4/§5/§7)", () => {
  it("migration applies and a runtime interaction is DURABLY persisted (memory + twin version)", () => {
    const store = createSqliteInteractionStore(":memory:");
    const d = deps(store);
    recordProductInteraction(d, input({ idempotencyKey: "i1" }));
    // assert at the RAW DB level (not the spine API) — real persistence
    const interactionRows = store.db.prepare("SELECT COUNT(*) AS n FROM interactions").get() as any;
    const twinRow = store.db.prepare("SELECT version FROM twins WHERE tenant_id=? AND case_id=?").get("tA", "c1") as any;
    expect(interactionRows.n).toBe(1);
    expect(twinRow.version).toBe(1);
    store.close();
  });

  it("tenant isolation holds at the DB layer", () => {
    const store = createSqliteInteractionStore(":memory:");
    const d = deps(store);
    recordProductInteraction(d, input({ tenantId: "tA", caseId: "shared", idempotencyKey: "i1" }));
    expect(() => recordProductInteraction(d, input({ tenantId: "tB", caseId: "shared", idempotencyKey: "i2" }))).toThrow(/CROSS_TENANT_DENIED/);
    expect(getStrategicTwin(d, "tB", "shared")).toBeNull();
    store.close();
  });

  it("correction creates a persisted version; history preserved in the DB", () => {
    const store = createSqliteInteractionStore(":memory:");
    const d = deps(store);
    const a = recordProductInteraction(d, input({ idempotencyKey: "i1" }));
    const c = recordProductInteraction(d, input({ idempotencyKey: "i2", correctsInteractionId: a.record.interactionId }));
    const prior = store.db.prepare("SELECT superseded_by FROM interactions WHERE interaction_id=?").get(a.record.interactionId) as any;
    expect(prior.superseded_by).toBe(c.record.interactionId); // durable, not rewritten
    expect(c.twin.version).toBe(2);
    store.close();
  });

  it("deletion removes rows + tombstones; replay is denied against the real DB", () => {
    const store = createSqliteInteractionStore(":memory:");
    const d = deps(store);
    recordProductInteraction(d, input({ idempotencyKey: "i1" }));
    deleteCaseData(d, "tA", "c1");
    expect((store.db.prepare("SELECT COUNT(*) AS n FROM interactions WHERE case_id='c1'").get() as any).n).toBe(0);
    expect((store.db.prepare("SELECT COUNT(*) AS n FROM tombstones").get() as any).n).toBe(1);
    expect(() => recordProductInteraction(d, input({ idempotencyKey: "i1" }))).toThrow(SpineError); // DELETED_CASE_REPLAY_BLOCKED
    store.close();
  });

  it("survives across DB connections (disk durability)", () => {
    const dbPath = join(tmp, "durable.db");
    const s1 = createSqliteInteractionStore(dbPath);
    recordProductInteraction(deps(s1), input({ idempotencyKey: "i1" }));
    s1.close(); // flush + close

    const s2 = createSqliteInteractionStore(dbPath); // reopen the SAME file
    const twin = getStrategicTwin(deps(s2), "tA", "c1");
    expect(twin).not.toBeNull();
    expect(twin!.version).toBe(1);
    expect(Object.keys(twin!.contradictions)).toContain("supply_dependency");
    s2.close();
  });
});
