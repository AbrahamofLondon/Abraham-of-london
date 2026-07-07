/**
 * lib/intelligence/interaction-spine/interaction-outbox.ts
 *
 * OPP-04 — durable propagation (outbox). A customer-facing interaction commit must
 * not synchronously depend on a fragile chain of downstream writes (memory → twin →
 * orchestrator → calibration → continuity). The spine commits the interaction, then
 * enqueues ONE durable outbox event; independent, idempotent consumers process it
 * with retry, fail-closed on governance, and dead-letter + operator visibility on
 * terminal failure.
 *
 * Pure + injectable so the guarantees (at-least-once, consumer idempotency, retry,
 * dead-letter, tenant rejection, no replay duplication, deleted-cannot-reconstitute)
 * are proven deterministically. Runtime binds consumers to the real governed
 * memory/twin/orchestrator/calibration/continuity.
 */

export type OutboxProcessingState = "PENDING" | "IN_PROGRESS" | "DELIVERED" | "DEAD_LETTER";

export interface OutboxEvent {
  eventId: string;
  schemaVersion: string;
  interactionId: string;
  tenantId: string;
  caseId: string;
  productCode: string;
  correlationId: string;
  causationId: string;
  eventType: string;
  payloadHash: string;
  payload: unknown;
  createdAt: string;
  processingState: OutboxProcessingState;
  attempts: number;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  failureCode: string | null;
  failureReason: string | null;
}

export const OUTBOX_SCHEMA_VERSION = "1.0.0";

/** A consumer failure that should be retried (transient). */
export class TransientConsumerError extends Error {
  constructor(message: string) { super(message); this.name = "TransientConsumerError"; }
}
/** A consumer failure that must NOT be retried (governance/fail-closed). */
export class TerminalConsumerError extends Error {
  constructor(message: string) { super(message); this.name = "TerminalConsumerError"; }
}

export interface OutboxConsumer {
  name: string;
  process(event: OutboxEvent): Promise<void>;
}

export interface OutboxStore {
  append(event: OutboxEvent): void;
  get(eventId: string): OutboxEvent | null;
  listByState(state: OutboxProcessingState): OutboxEvent[];
  update(event: OutboxEvent): void;
  /** consumer idempotency: has (eventId, consumer) already succeeded? */
  isConsumed(eventId: string, consumer: string): boolean;
  markConsumed(eventId: string, consumer: string): void;
  /** tombstoned interaction ids (deleted) — their events must not be reconstituted. */
  isInteractionTombstoned(interactionId: string): boolean;
  tombstoneInteraction(interactionId: string): void;
  deadLetters(): OutboxEvent[];
}

export interface EnqueueInput {
  interactionId: string;
  tenantId: string;
  caseId: string;
  productCode: string;
  eventType: string;
  payload: unknown;
  correlationId?: string;
  causationId?: string;
}

function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export interface OutboxDeps {
  store: OutboxStore;
  now?: () => string;
}

/** Enqueue a durable event for a committed interaction. Idempotent per interactionId+eventType. */
export function enqueueInteractionEvent(deps: OutboxDeps, input: EnqueueInput): OutboxEvent {
  const now = deps.now ?? (() => new Date().toISOString());
  if (deps.store.isInteractionTombstoned(input.interactionId)) {
    throw new TerminalConsumerError(`Interaction ${input.interactionId} is deleted; refusing to enqueue.`);
  }
  const eventId = `evt_${hash(`${input.interactionId}:${input.eventType}`)}`;
  const existing = deps.store.get(eventId);
  if (existing) return existing; // idempotent enqueue
  const payloadHash = hash(JSON.stringify(input.payload ?? {}));
  const correlationId = input.correlationId ?? `corr_${hash(input.caseId)}`;
  const event: OutboxEvent = {
    eventId, schemaVersion: OUTBOX_SCHEMA_VERSION, interactionId: input.interactionId,
    tenantId: input.tenantId, caseId: input.caseId, productCode: input.productCode,
    correlationId, causationId: input.causationId ?? input.interactionId, eventType: input.eventType,
    payloadHash, payload: input.payload, createdAt: now(), processingState: "PENDING",
    attempts: 0, lastAttemptAt: null, nextAttemptAt: now(), failureCode: null, failureReason: null,
  };
  deps.store.append(event);
  return event;
}

export interface ProcessResult {
  eventId: string;
  state: OutboxProcessingState;
  consumersRun: string[];
  consumersFailed: { consumer: string; kind: "transient" | "terminal"; reason: string }[];
}

/**
 * Process one outbox event across all consumers. Each consumer runs at-most-once
 * (idempotency ledger). Transient failures leave the event PENDING with attempts++
 * and dead-letter once attempts reach maxAttempts; terminal failures dead-letter
 * immediately. A tombstoned interaction is refused (cannot be reconstituted).
 */
export async function processOutboxEvent(
  deps: OutboxDeps,
  consumers: OutboxConsumer[],
  eventId: string,
  opts: { maxAttempts?: number; expectedTenant?: string } = {},
): Promise<ProcessResult> {
  const now = deps.now ?? (() => new Date().toISOString());
  const maxAttempts = opts.maxAttempts ?? 3;
  const event = deps.store.get(eventId);
  if (!event) throw new TerminalConsumerError(`Unknown outbox event ${eventId}.`);

  // deleted/revoked interaction cannot be reconstituted
  if (deps.store.isInteractionTombstoned(event.interactionId)) {
    const dl = { ...event, processingState: "DEAD_LETTER" as const, failureCode: "INTERACTION_DELETED", failureReason: "Interaction was deleted; event not reconstituted.", lastAttemptAt: now() };
    deps.store.update(dl);
    return { eventId, state: "DEAD_LETTER", consumersRun: [], consumersFailed: [{ consumer: "*", kind: "terminal", reason: "interaction deleted" }] };
  }
  // tenant rejection
  if (opts.expectedTenant && event.tenantId !== opts.expectedTenant) {
    const dl = { ...event, processingState: "DEAD_LETTER" as const, failureCode: "TENANT_MISMATCH", failureReason: "Event tenant does not match processing context.", lastAttemptAt: now() };
    deps.store.update(dl);
    return { eventId, state: "DEAD_LETTER", consumersRun: [], consumersFailed: [{ consumer: "*", kind: "terminal", reason: "tenant mismatch" }] };
  }

  const run: string[] = [];
  const failed: ProcessResult["consumersFailed"] = [];
  let terminal = false;
  let transient = false;

  for (const c of consumers) {
    if (deps.store.isConsumed(event.eventId, c.name)) continue; // replay: no duplicate side-effect
    try {
      await c.process(event);
      deps.store.markConsumed(event.eventId, c.name);
      run.push(c.name);
    } catch (err) {
      if (err instanceof TerminalConsumerError) { terminal = true; failed.push({ consumer: c.name, kind: "terminal", reason: (err as Error).message }); }
      else { transient = true; failed.push({ consumer: c.name, kind: "transient", reason: (err as Error).message }); }
    }
  }

  const attempts = event.attempts + 1;
  let state: OutboxProcessingState;
  if (terminal || (transient && attempts >= maxAttempts)) {
    state = "DEAD_LETTER";
  } else if (transient) {
    state = "PENDING"; // will retry — source interaction is NOT lost
  } else {
    state = "DELIVERED";
  }
  deps.store.update({
    ...event, processingState: state, attempts, lastAttemptAt: now(),
    nextAttemptAt: state === "PENDING" ? now() : null,
    failureCode: failed[0]?.kind === "terminal" ? "CONSUMER_TERMINAL" : failed.length ? "CONSUMER_TRANSIENT" : null,
    failureReason: failed.map((f) => `${f.consumer}:${f.reason}`).join("; ") || null,
  });
  return { eventId, state, consumersRun: run, consumersFailed: failed };
}

/** Drain all PENDING events once (single pass). */
export async function drainOutboxOnce(deps: OutboxDeps, consumers: OutboxConsumer[], opts: { maxAttempts?: number; expectedTenant?: string } = {}): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];
  for (const e of deps.store.listByState("PENDING")) results.push(await processOutboxEvent(deps, consumers, e.eventId, opts));
  return results;
}

// ── Reference in-memory outbox store ──────────────────────────────────────────

export function createInMemoryOutboxStore(): OutboxStore {
  const events = new Map<string, OutboxEvent>();
  const consumed = new Set<string>(); // `${eventId}::${consumer}`
  const tombstones = new Set<string>();
  return {
    append: (e) => void events.set(e.eventId, { ...e }),
    get: (id) => events.get(id) ?? null,
    listByState: (s) => Array.from(events.values()).filter((e) => e.processingState === s),
    update: (e) => void events.set(e.eventId, { ...e }),
    isConsumed: (eventId, consumer) => consumed.has(`${eventId}::${consumer}`),
    markConsumed: (eventId, consumer) => void consumed.add(`${eventId}::${consumer}`),
    isInteractionTombstoned: (id) => tombstones.has(id),
    tombstoneInteraction: (id) => void tombstones.add(id),
    deadLetters: () => Array.from(events.values()).filter((e) => e.processingState === "DEAD_LETTER"),
  };
}
