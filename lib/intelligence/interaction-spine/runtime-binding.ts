/**
 * lib/intelligence/interaction-spine/runtime-binding.ts
 *
 * §3 — the runtime on-switch. This is the single place a live product runtime path
 * (playbook /run, completeInstrumentRun, reporting cycle) hands its AUTHORITATIVE
 * result to the compounding system. It maps the product-specific result to a
 * canonical interaction, records it through the spine (durable store), and enqueues
 * the durable outbox event — completing the chain:
 *
 *   ACTUAL PRODUCT RESULT
 *     → mapProductResultToInteraction (typed, fail-closed for unmapped)
 *     → recordProductInteraction (durable store, versioned twin)
 *     → enqueueInteractionEvent (durable outbox → governed memory/twin/continuity)
 *
 * Fail-safe contract: the customer's product run is ALREADY persisted and returned by
 * the caller. The compounding write is additive; a failure here MUST NOT break the
 * product response. So this function never throws — it returns a BindingOutcome the
 * caller may log. (Durability of the outbox event guarantees eventual propagation; a
 * transient store failure is surfaced, not swallowed into data loss, because the
 * authoritative product record still exists and can be replayed.)
 *
 * The spine (durable store + outbox) is injected via a resolver so this is proven
 * deterministically in tests; the runtime provider (runtime-spine-provider) resolves
 * the real durable store. An unmapped product fails closed: it cannot write ungoverned
 * memory, and the outcome says so.
 */

import {
  recordProductInteraction,
  type SpineDeps,
  type ProductInteractionInput,
} from "./product-interaction-spine";
import { isMappedProduct, mapProductResultToInteraction } from "./product-interaction-mappers";
import { enqueueInteractionEvent, type OutboxStore } from "./interaction-outbox";
import { buildPreRunContextForCase, type PreRunContext } from "./pre-run-context";

/** A resolved durable spine for one case: the record deps + optional durable outbox. */
export interface RuntimeSpine {
  deps: SpineDeps;
  outbox?: OutboxStore;
  /** flush any buffered writes to durable storage (no-op for synchronous stores). */
  flush?: () => void | Promise<void>;
  /** release resources (e.g. close a DB handle). */
  close?: () => void;
}

/**
 * Resolve the durable spine for a case. Returns null when no durable store is
 * configured — the caller then knows the interaction was NOT recorded (deploy
 * boundary), not that it silently succeeded. Async so a provider may open a handle.
 */
export type RuntimeSpineResolver = (caseId: string) => Promise<RuntimeSpine | null> | RuntimeSpine | null;

export interface RuntimeInteractionContext {
  productCode: string;
  tenantId: string;
  caseId: string;
  actorType: ProductInteractionInput["actorType"];
  sourceSurface: string;
  sourceRunId?: string;
  inputHash?: string;
  occurredAt?: string;
  /** the product's AUTHORITATIVE typed result (mapper input). */
  nativeResult: unknown;
  interactionTypeOverride?: string;
  correctsInteractionId?: string;
}

export interface BindingOutcome {
  bound: boolean;
  reason?: string;
  interactionId?: string;
  twinVersion?: number;
  deduplicated?: boolean;
  outboxEventId?: string;
}

/**
 * Record a live product interaction into the compounding system. Never throws.
 */
export async function recordRuntimeInteraction(
  resolver: RuntimeSpineResolver,
  ctx: RuntimeInteractionContext,
): Promise<BindingOutcome> {
  // fail-closed for the MEMORY write, fail-open for the PRODUCT: an unmapped product
  // is not allowed to write ungoverned memory, but its run still succeeds upstream.
  if (!isMappedProduct(ctx.productCode)) {
    return { bound: false, reason: `UNMAPPED_PRODUCT:${ctx.productCode}` };
  }
  if (!ctx.tenantId || !ctx.caseId) {
    return { bound: false, reason: "MISSING_TENANT_OR_CASE" };
  }

  let spine: RuntimeSpine | null = null;
  try {
    spine = await resolver(ctx.caseId);
    if (!spine) return { bound: false, reason: "NO_DURABLE_STORE_CONFIGURED" };

    const mapped = mapProductResultToInteraction(ctx.productCode, ctx.nativeResult);
    const input: ProductInteractionInput = {
      tenantId: ctx.tenantId,
      caseId: ctx.caseId,
      productCode: ctx.productCode,
      interactionType: ctx.interactionTypeOverride ?? mapped.interactionType,
      actorType: ctx.actorType,
      occurredAt: ctx.occurredAt,
      structuredResult: mapped.structuredResult,
      provenance: { sourceSurface: ctx.sourceSurface, sourceRunId: ctx.sourceRunId, inputHash: ctx.inputHash },
      correctsInteractionId: ctx.correctsInteractionId,
    };

    const res = recordProductInteraction(spine.deps, input);

    let outboxEventId: string | undefined;
    if (spine.outbox && !res.deduplicated) {
      const evt = enqueueInteractionEvent(
        { store: spine.outbox },
        {
          interactionId: res.record.interactionId,
          tenantId: res.record.tenantId,
          caseId: res.record.caseId,
          productCode: res.record.productCode,
          eventType: "interaction.recorded",
          payload: { interactionType: res.record.interactionType, twinVersion: res.twin.version },
        },
      );
      outboxEventId = evt.eventId;
    }

    await spine.flush?.();

    return {
      bound: true,
      interactionId: res.record.interactionId,
      twinVersion: res.twin.version,
      deduplicated: res.deduplicated,
      outboxEventId,
    };
  } catch (err) {
    // additive path — never break the product response.
    // eslint-disable-next-line no-console
    console.error("[interaction-spine] runtime binding failed (product flow unaffected):", err);
    return { bound: false, reason: err instanceof Error ? `BINDING_ERROR:${err.message}` : "BINDING_ERROR" };
  } finally {
    try { spine?.close?.(); } catch { /* ignore close errors */ }
  }
}

// ── Product-family convenience wrappers ───────────────────────────────────────

/** Playbook /run → spine. actorType organisation (governed playbooks are org-level). */
export function recordPlaybookRunInteraction(
  resolver: RuntimeSpineResolver,
  args: { productCode: string; tenantId: string; caseId: string; runId: string; inputHash?: string; result: unknown; occurredAt?: string },
): Promise<BindingOutcome> {
  return recordRuntimeInteraction(resolver, {
    productCode: args.productCode,
    tenantId: args.tenantId,
    caseId: args.caseId,
    actorType: "organisation",
    sourceSurface: "playbook_run_api",
    sourceRunId: args.runId,
    inputHash: args.inputHash,
    occurredAt: args.occurredAt,
    nativeResult: args.result,
  });
}

/** completeInstrumentRun → spine. actorType organisation; instrumentSlug is the productCode. */
export function recordInstrumentRunInteraction(
  resolver: RuntimeSpineResolver,
  args: { instrumentSlug: string; tenantId: string; caseId: string; runId: string; inputHash?: string; scoreJson: unknown; occurredAt?: string },
): Promise<BindingOutcome> {
  return recordRuntimeInteraction(resolver, {
    productCode: args.instrumentSlug,
    tenantId: args.tenantId,
    caseId: args.caseId,
    actorType: "organisation",
    sourceSurface: "instrument_results_api",
    sourceRunId: args.runId,
    inputHash: args.inputHash,
    occurredAt: args.occurredAt,
    nativeResult: args.scoreJson,
  });
}

/**
 * §4 read-before-run: resolve the RELEVANT prior continuity for a case, fail-safe.
 * Reads the tenant-isolated twin through the durable spine and selects bounded relevant
 * prior state. Returns null if no durable store is configured or on any failure (the
 * product run proceeds regardless — continuity is additive). Call this BEFORE recording
 * the new interaction so it reflects PRIOR state.
 */
export async function readContinuityForCase(
  resolver: RuntimeSpineResolver,
  args: { productCode: string; tenantId: string; caseId: string; topicTags: string[]; maxItems?: number },
): Promise<PreRunContext | null> {
  if (!args.tenantId || !args.caseId) return null;
  let spine: RuntimeSpine | null = null;
  try {
    spine = await resolver(args.caseId);
    if (!spine) return null;
    return buildPreRunContextForCase(spine.deps, args.tenantId, args.caseId, {
      productCode: args.productCode,
      topicTags: args.topicTags,
      maxItems: args.maxItems,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[interaction-spine] continuity read failed (product flow unaffected):", err);
    return null;
  } finally {
    try { spine?.close?.(); } catch { /* ignore */ }
  }
}

/**
 * Derive the canonical (tenantId, caseId) for a customer identity. One decision case
 * per customer so interactions compound ACROSS products (the moat), tenant-isolated.
 * subjectId is preferred (stable); email is the fallback identity.
 */
export function resolveTenantCase(identity: { subjectId?: string | null; email?: string | null }): { tenantId: string; caseId: string } | null {
  const tenantId = (identity.subjectId ?? identity.email ?? "").trim();
  if (!tenantId) return null;
  return { tenantId, caseId: `case_${tenantId}` };
}
