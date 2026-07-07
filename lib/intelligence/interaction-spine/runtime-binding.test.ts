/**
 * lib/intelligence/interaction-spine/runtime-binding.test.ts
 *
 * §3 proof — the runtime on-switch. Exercises the SAME binding functions the live
 * handlers call (recordPlaybookRunInteraction / recordInstrumentRunInteraction), with
 * an injected durable spine, and proves the full chain:
 *
 *   ACTUAL RESULT → interaction → durable store → outbox → twin vN+1
 *
 * plus compounding ACROSS products on one case, tenant isolation, fail-closed for
 * unmapped products, the deploy boundary (no store → not bound, honestly), and the
 * fail-safe contract (a store failure never throws into the product path).
 */

import { describe, it, expect } from "vitest";
import {
  recordPlaybookRunInteraction,
  recordInstrumentRunInteraction,
  resolveTenantCase,
  type RuntimeSpine,
  type RuntimeSpineResolver,
} from "./runtime-binding";
import { createInMemoryInteractionStore, getStrategicTwin, type InteractionStore } from "./product-interaction-spine";
import { createInMemoryOutboxStore, type OutboxStore } from "./interaction-outbox";
import { isMappedProduct } from "./product-interaction-mappers";

/** A durable-shaped spine backed by in-memory stores (deterministic stand-in for SQLite). */
function makeDurableResolver(): { resolver: RuntimeSpineResolver; store: InteractionStore; outbox: OutboxStore } {
  const store = createInMemoryInteractionStore();
  const outbox = createInMemoryOutboxStore();
  const spine: RuntimeSpine = { deps: { store, isCanonicalProduct: isMappedProduct }, outbox };
  return { resolver: () => spine, store, outbox };
}

const playbookResult = {
  posture: "AT_RISK",
  overallSeverity: "HIGH",
  score: 42,
  contradictions: [{ ref: "supply dependency", detail: "single supplier" }],
  evidenceGaps: ["supplier exposure"],
};

describe("§3 runtime on-switch — live binding", () => {
  it("records a playbook run through the chain: interaction → durable store → outbox → twin v1", async () => {
    const { resolver, store, outbox } = makeDurableResolver();
    const tc = resolveTenantCase({ subjectId: "u1" })!;

    const out = await recordPlaybookRunInteraction(resolver, {
      productCode: "execution_integrity_protocol",
      tenantId: tc.tenantId,
      caseId: tc.caseId,
      runId: "run-1",
      result: playbookResult,
    });

    expect(out.bound).toBe(true);
    expect(out.twinVersion).toBe(1);
    expect(out.outboxEventId).toBeTruthy();

    // durable store holds the interaction + twin
    const twin = getStrategicTwin({ store, isCanonicalProduct: isMappedProduct }, tc.tenantId, tc.caseId)!;
    expect(twin.version).toBe(1);
    expect(Object.keys(twin.contradictions)).toContain("supply_dependency");

    // outbox holds exactly one durable event for propagation
    expect(outbox.listByState("PENDING")).toHaveLength(1);
  });

  it("compounds ACROSS products on one case (playbook then instrument → twin v3)", async () => {
    const { resolver, store } = makeDurableResolver();
    const tc = resolveTenantCase({ subjectId: "u2" })!;
    const deps = { store, isCanonicalProduct: isMappedProduct };

    await recordPlaybookRunInteraction(resolver, {
      productCode: "execution_integrity_protocol", tenantId: tc.tenantId, caseId: tc.caseId, runId: "r1", result: playbookResult,
    });
    await recordPlaybookRunInteraction(resolver, {
      productCode: "alignment_audit_playbook", tenantId: tc.tenantId, caseId: tc.caseId, runId: "r2",
      result: { posture: "MISALIGNED", overallSeverity: "MEDIUM", score: 60, contradictions: [{ ref: "owner ambiguity", detail: "no owner" }], evidenceGaps: [] },
    });
    const afterInstrument = await recordInstrumentRunInteraction(resolver, {
      instrumentSlug: "decision-exposure-instrument", tenantId: tc.tenantId, caseId: tc.caseId, runId: "r3",
      scoreJson: { instrumentSlug: "decision-exposure-instrument", scores: { exposure: 7 }, result: { exposures: ["gbp_rate_regime"] } },
    });

    expect(afterInstrument.bound).toBe(true);
    const twin = getStrategicTwin(deps, tc.tenantId, tc.caseId)!;
    expect(twin.version).toBe(3); // three products compounded on ONE case
    // instrument exposure recorded as a signal the cross-moat brief can intersect
    expect(Object.keys(twin.signals).some((k) => k.startsWith("exposure_"))).toBe(true);
  });

  it("isolates tenants — another customer's identical run does not touch the first twin", async () => {
    const { resolver, store } = makeDurableResolver();
    const deps = { store, isCanonicalProduct: isMappedProduct };
    const a = resolveTenantCase({ subjectId: "tenantA" })!;
    const b = resolveTenantCase({ subjectId: "tenantB" })!;

    await recordPlaybookRunInteraction(resolver, { productCode: "execution_integrity_protocol", tenantId: a.tenantId, caseId: a.caseId, runId: "r1", result: playbookResult });
    await recordPlaybookRunInteraction(resolver, { productCode: "execution_integrity_protocol", tenantId: b.tenantId, caseId: b.caseId, runId: "r1", result: playbookResult });

    expect(getStrategicTwin(deps, a.tenantId, a.caseId)!.version).toBe(1);
    expect(getStrategicTwin(deps, b.tenantId, b.caseId)!.version).toBe(1);
    // A cannot read B's case
    expect(getStrategicTwin(deps, a.tenantId, b.caseId)).toBeNull();
  });

  it("fails closed for an unmapped product (no ungoverned memory write)", async () => {
    const { resolver, store } = makeDurableResolver();
    const out = await recordRuntime(resolver, "not_a_real_product");
    expect(out.bound).toBe(false);
    expect(out.reason).toMatch(/UNMAPPED_PRODUCT/);
    // nothing was written
    expect(getStrategicTwin({ store, isCanonicalProduct: isMappedProduct }, "u9", "case_u9")).toBeNull();
  });

  it("honours the deploy boundary — no durable store means NOT bound (not a silent success)", async () => {
    const nullResolver: RuntimeSpineResolver = () => null;
    const out = await recordPlaybookRunInteraction(nullResolver, {
      productCode: "execution_integrity_protocol", tenantId: "u1", caseId: "case_u1", runId: "r1", result: playbookResult,
    });
    expect(out.bound).toBe(false);
    expect(out.reason).toBe("NO_DURABLE_STORE_CONFIGURED");
  });

  it("is fail-safe — a store failure never throws into the product path", async () => {
    const throwingResolver: RuntimeSpineResolver = () => { throw new Error("db down"); };
    const out = await recordPlaybookRunInteraction(throwingResolver, {
      productCode: "execution_integrity_protocol", tenantId: "u1", caseId: "case_u1", runId: "r1", result: playbookResult,
    });
    expect(out.bound).toBe(false);
    expect(out.reason).toMatch(/BINDING_ERROR/);
  });

  it("deduplicates an idempotent replay of the same run (no double twin bump)", async () => {
    const { resolver, store } = makeDurableResolver();
    const tc = resolveTenantCase({ subjectId: "u4" })!;
    const args = { productCode: "execution_integrity_protocol", tenantId: tc.tenantId, caseId: tc.caseId, runId: "same", result: playbookResult, occurredAt: "2026-07-07T00:00:00Z" };
    const first = await recordPlaybookRunInteraction(resolver, args);
    const second = await recordPlaybookRunInteraction(resolver, args);
    expect(first.deduplicated).toBe(false);
    expect(second.deduplicated).toBe(true);
    expect(getStrategicTwin({ store, isCanonicalProduct: isMappedProduct }, tc.tenantId, tc.caseId)!.version).toBe(1);
  });
});

// small helper to drive an unmapped product through the generic path
async function recordRuntime(resolver: RuntimeSpineResolver, productCode: string) {
  return recordPlaybookRunInteraction(resolver, { productCode, tenantId: "u9", caseId: "case_u9", runId: "r", result: playbookResult });
}
