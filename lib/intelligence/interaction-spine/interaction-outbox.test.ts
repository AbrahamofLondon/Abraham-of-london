/**
 * lib/intelligence/interaction-spine/interaction-outbox.test.ts
 *
 * Proves OPP-04 durable propagation guarantees (brief §5): full propagation,
 * consumer-failure isolation, retry, replay-no-duplication (memory + twin),
 * terminal→dead-letter+operator-visible, tenant rejection, deleted-cannot-reconstitute.
 */

import { describe, it, expect } from "vitest";
import {
  createInMemoryOutboxStore,
  enqueueInteractionEvent,
  processOutboxEvent,
  TransientConsumerError,
  TerminalConsumerError,
  type OutboxConsumer,
  type OutboxDeps,
} from "./interaction-outbox";

const deps = (): OutboxDeps => ({ store: createInMemoryOutboxStore(), now: () => "2026-07-07T00:00:00Z" });
const enq = (d: OutboxDeps, over: any = {}) => enqueueInteractionEvent(d, { interactionId: "int1", tenantId: "tA", caseId: "c1", productCode: "execution_integrity_protocol", eventType: "interaction_recorded", payload: { x: 1 }, ...over });

function recordingConsumer(name: string, calls: Record<string, number>): OutboxConsumer {
  return { name, process: async () => { calls[name] = (calls[name] ?? 0) + 1; } };
}
function flakyConsumer(name: string, failTimes: number, calls: Record<string, number>): OutboxConsumer {
  let n = 0;
  return { name, process: async () => { if (n++ < failTimes) throw new TransientConsumerError("temporarily unavailable"); calls[name] = (calls[name] ?? 0) + 1; } };
}

describe("interaction outbox — durable propagation (OPP-04)", () => {
  it("1. successful full propagation → all consumers run, DELIVERED", async () => {
    const d = deps(); const calls: Record<string, number> = {};
    const e = enq(d);
    const r = await processOutboxEvent(d, [recordingConsumer("memory", calls), recordingConsumer("twin", calls)], e.eventId);
    expect(r.state).toBe("DELIVERED");
    expect(r.consumersRun).toEqual(["memory", "twin"]);
  });

  it("2. one consumer failure does not lose the source interaction (others still run)", async () => {
    const d = deps(); const calls: Record<string, number> = {};
    const e = enq(d);
    const failing: OutboxConsumer = { name: "orchestrator", process: async () => { throw new TransientConsumerError("down"); } };
    const r = await processOutboxEvent(d, [recordingConsumer("memory", calls), failing], e.eventId);
    expect(r.state).toBe("PENDING"); // retained for retry, not lost
    expect(calls.memory).toBe(1);
    expect(d.store.get(e.eventId)!.processingState).toBe("PENDING");
  });

  it("3. retry succeeds; already-succeeded consumer is not re-run", async () => {
    const d = deps(); const calls: Record<string, number> = {};
    const e = enq(d);
    const consumers = [recordingConsumer("memory", calls), flakyConsumer("twin", 1, calls)];
    const r1 = await processOutboxEvent(d, consumers, e.eventId);
    expect(r1.state).toBe("PENDING"); // twin failed once
    const r2 = await processOutboxEvent(d, consumers, e.eventId);
    expect(r2.state).toBe("DELIVERED");
    expect(calls.memory).toBe(1); // NOT re-run on retry (idempotency)
    expect(calls.twin).toBe(1);
  });

  it("4/5. replay does not duplicate memory or twin side-effects", async () => {
    const d = deps(); const calls: Record<string, number> = {};
    const e = enq(d);
    const consumers = [recordingConsumer("memory", calls), recordingConsumer("twin", calls)];
    await processOutboxEvent(d, consumers, e.eventId);
    await processOutboxEvent(d, consumers, e.eventId); // replay
    await processOutboxEvent(d, consumers, e.eventId); // replay again
    expect(calls.memory).toBe(1);
    expect(calls.twin).toBe(1);
  });

  it("6. terminal failure → dead-letter and operator-visible", async () => {
    const d = deps(); const calls: Record<string, number> = {};
    const e = enq(d);
    const terminal: OutboxConsumer = { name: "calibration", process: async () => { throw new TerminalConsumerError("governance denied"); } };
    const r = await processOutboxEvent(d, [recordingConsumer("memory", calls), terminal], e.eventId);
    expect(r.state).toBe("DEAD_LETTER");
    expect(d.store.deadLetters().map((x) => x.eventId)).toContain(e.eventId);
    expect(d.store.get(e.eventId)!.failureReason).toContain("calibration");
  });

  it("7. wrong tenant is rejected (dead-lettered, not processed)", async () => {
    const d = deps(); const calls: Record<string, number> = {};
    const e = enq(d, { tenantId: "tA" });
    const r = await processOutboxEvent(d, [recordingConsumer("memory", calls)], e.eventId, { expectedTenant: "tB" });
    expect(r.state).toBe("DEAD_LETTER");
    expect(d.store.get(e.eventId)!.failureCode).toBe("TENANT_MISMATCH");
    expect(calls.memory).toBeUndefined(); // consumer never ran
  });

  it("8. a deleted interaction cannot be reconstituted by replay", async () => {
    const d = deps(); const calls: Record<string, number> = {};
    const e = enq(d);
    d.store.tombstoneInteraction("int1");
    const r = await processOutboxEvent(d, [recordingConsumer("memory", calls)], e.eventId);
    expect(r.state).toBe("DEAD_LETTER");
    expect(d.store.get(e.eventId)!.failureCode).toBe("INTERACTION_DELETED");
    expect(calls.memory).toBeUndefined();
    // and re-enqueue of a tombstoned interaction is refused
    expect(() => enq(d, { eventType: "other" })).toThrow(TerminalConsumerError);
  });

  it("enqueue is idempotent per interaction+eventType; carries correlation/causation + schema version", () => {
    const d = deps();
    const a = enq(d); const b = enq(d);
    expect(a.eventId).toBe(b.eventId);
    expect(a.schemaVersion).toBe("1.0.0");
    expect(a.correlationId).toBeTruthy();
    expect(a.causationId).toBe("int1");
  });
});
