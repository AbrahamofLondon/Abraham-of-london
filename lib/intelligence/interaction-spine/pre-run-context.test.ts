/**
 * lib/intelligence/interaction-spine/pre-run-context.test.ts
 *
 * §4 proof — read-before-run relevance selection. Proves the three required behaviours:
 * different RELEVANT history → different context; IRRELEVANT history → no change;
 * insufficient history → explicit limited continuity. Plus tenant isolation and the
 * bound (never a full twin dump), and that the customer statement is evidence-backed.
 */

import { describe, it, expect } from "vitest";
import { resolvePreRunContext, buildPreRunContextForCase } from "./pre-run-context";
import {
  createInMemoryInteractionStore,
  recordProductInteraction,
  getStrategicTwin,
  type SpineDeps,
} from "./product-interaction-spine";
import { isMappedProduct } from "./product-interaction-mappers";

function seed(): { deps: SpineDeps; tenantId: string; caseId: string } {
  const deps: SpineDeps = { store: createInMemoryInteractionStore(), isCanonicalProduct: isMappedProduct, now: () => "2026-07-07T00:00:00Z" };
  const tenantId = "tA", caseId = "case_tA";
  const base = { tenantId, caseId, productCode: "execution_integrity_protocol", interactionType: "playbook_run", actorType: "organisation" as const, provenance: { sourceSurface: "s" } };
  recordProductInteraction(deps, { ...base, idempotencyKey: "i1", structuredResult: { summary: "r", contradictions: [{ key: "supply_dependency", severity: "HIGH" }], evidenceGaps: [{ key: "supplier_exposure" }] } });
  recordProductInteraction(deps, { ...base, idempotencyKey: "i2", structuredResult: { summary: "r2", contradictions: [{ key: "supply_dependency", severity: "HIGH" }] } });
  recordProductInteraction(deps, { ...base, idempotencyKey: "i3", structuredResult: { summary: "r3", commitments: [{ key: "hiring_freeze", statement: "freeze non-critical hiring", owner: "CFO" }] } });
  return { deps, tenantId, caseId };
}

describe("§4 read-before-run relevance selection", () => {
  it("selects relevant prior state and explains it in an evidence-backed statement", () => {
    const { deps, tenantId, caseId } = seed();
    const twin = getStrategicTwin(deps, tenantId, caseId)!;
    const ctx = resolvePreRunContext(twin, { productCode: "execution_integrity_protocol", topicTags: ["supply", "supplier"] });

    expect(ctx.hasContinuity).toBe(true);
    expect(ctx.items.some((i) => i.key === "supply_dependency" && i.kind === "contradiction")).toBe(true);
    expect(ctx.items.some((i) => i.key === "supplier_exposure")).toBe(true);
    // recurrence is traceable (contradiction seen twice)
    expect(ctx.items.find((i) => i.key === "supply_dependency")!.recurrence).toBe(2);
    expect(ctx.customerStatement).toMatch(/informed by/i);
    // did NOT pull the unrelated hiring commitment (different topic)
    expect(ctx.items.some((i) => i.key === "hiring_freeze")).toBe(false);
  });

  it("different RELEVANT history yields different context; IRRELEVANT history yields no change", () => {
    const { deps, tenantId, caseId } = seed();
    const twin = getStrategicTwin(deps, tenantId, caseId)!;

    // relevant topic → supply items surface
    const relevant = resolvePreRunContext(twin, { productCode: "x", topicTags: ["supply"] });
    // completely unrelated topic → no items (irrelevant history causes no artificial change)
    const irrelevant = resolvePreRunContext(twin, { productCode: "x", topicTags: ["marketing", "brand"] });

    expect(relevant.items.length).toBeGreaterThan(0);
    expect(irrelevant.items.length).toBe(0);
    expect(irrelevant.hasContinuity).toBe(false);
    expect(irrelevant.customerStatement).toMatch(/no prior related decision history/i);
  });

  it("reports explicit limited continuity when relevant history is thin", () => {
    const { deps, tenantId, caseId } = seed();
    const twin = getStrategicTwin(deps, tenantId, caseId)!;
    // only the commitment topic → a single relevant item → limited
    const ctx = resolvePreRunContext(twin, { productCode: "x", topicTags: ["hiring"], limitedThreshold: 2 });
    expect(ctx.hasContinuity).toBe(true);
    expect(ctx.items).toHaveLength(1);
    expect(ctx.limited).toBe(true);
    expect(ctx.customerStatement).toMatch(/limited prior history/i);
  });

  it("honours the maxItems bound (never dumps the whole twin)", () => {
    const { deps, tenantId, caseId } = seed();
    const twin = getStrategicTwin(deps, tenantId, caseId)!;
    const ctx = resolvePreRunContext(twin, { productCode: "x", topicTags: ["supply", "supplier"], maxItems: 1 });
    expect(ctx.items).toHaveLength(1);
    expect(ctx.provenance.selectedFrom).toBeGreaterThanOrEqual(1);
  });

  it("cannot leak another tenant's decisions (cross-tenant read → no continuity)", () => {
    const { deps, caseId } = seed();
    const ctx = buildPreRunContextForCase(deps, "OTHER_TENANT", caseId, { productCode: "x", topicTags: ["supply"] });
    expect(ctx.hasContinuity).toBe(false);
    expect(ctx.items).toHaveLength(0);
  });
});
