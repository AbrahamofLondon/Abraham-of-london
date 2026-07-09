/**
 * lib/intelligence/interaction-spine/sqlite-outbox-store.test.ts
 *
 * Proves DURABLE propagation against a real DB (§7): enqueue persists, successful
 * propagation persists DELIVERED, a consumer failure persists PENDING (source not
 * lost) then retry persists DELIVERED, and a deleted interaction is dead-lettered
 * (persisted) and never reconstituted.
 */

import { describe, it, expect } from "vitest";
import { createSqliteOutboxStore } from "./sqlite-outbox-store";
import { enqueueInteractionEvent, processOutboxEvent, TransientConsumerError, type OutboxConsumer, type OutboxDeps } from "./interaction-outbox";

const enq = (d: OutboxDeps) => enqueueInteractionEvent(d, { interactionId: "int1", tenantId: "tA", caseId: "c1", productCode: "execution_integrity_protocol", eventType: "interaction_recorded", payload: { x: 1 } });

describe("durable SQLite outbox (§7)", () => {
  it("enqueue + full propagation persist to the real DB", async () => {
    const store = createSqliteOutboxStore(":memory:");
    const d: OutboxDeps = { store, now: () => "2026-07-07T00:00:00Z" };
    const e = enq(d);
    expect((store.db.prepare("SELECT processing_state FROM outbox_events WHERE event_id=?").get(e.eventId) as any).processing_state).toBe("PENDING");
    const calls: Record<string, number> = {};
    await processOutboxEvent(d, [{ name: "memory", process: async () => { calls.memory = 1; } }], e.eventId);
    expect((store.db.prepare("SELECT processing_state FROM outbox_events WHERE event_id=?").get(e.eventId) as any).processing_state).toBe("DELIVERED");
    store.close();
  });

  it("consumer failure persists PENDING (not lost); retry persists DELIVERED; no duplicate", async () => {
    const store = createSqliteOutboxStore(":memory:");
    const d: OutboxDeps = { store, now: () => "2026-07-07T00:00:00Z" };
    const e = enq(d);
    let fail = true;
    const flaky: OutboxConsumer = { name: "twin", process: async () => { if (fail) { fail = false; throw new TransientConsumerError("down"); } } };
    const mem: OutboxConsumer = { name: "memory", process: async () => {} };
    await processOutboxEvent(d, [mem, flaky], e.eventId);
    expect((store.get(e.eventId))!.processingState).toBe("PENDING"); // source retained durably
    await processOutboxEvent(d, [mem, flaky], e.eventId);
    expect((store.get(e.eventId))!.processingState).toBe("DELIVERED");
    // memory consumed exactly once (idempotency persisted)
    expect((store.db.prepare("SELECT COUNT(*) AS n FROM outbox_consumed WHERE consumer='memory'").get() as any).n).toBe(1);
    store.close();
  });

  it("deleted interaction is dead-lettered durably and never reconstituted", async () => {
    const store = createSqliteOutboxStore(":memory:");
    const d: OutboxDeps = { store, now: () => "2026-07-07T00:00:00Z" };
    const e = enq(d);
    store.tombstoneInteraction("int1");
    const r = await processOutboxEvent(d, [{ name: "memory", process: async () => {} }], e.eventId);
    expect(r.state).toBe("DEAD_LETTER");
    expect(store.deadLetters().map((x) => x.eventId)).toContain(e.eventId);
    store.close();
  });
});
