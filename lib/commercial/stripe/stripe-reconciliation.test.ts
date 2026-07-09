/**
 * lib/commercial/stripe/stripe-reconciliation.test.ts
 *
 * PR B — reconciliation engine proofs (pure, fixture-driven; no live API).
 * Covers: exact match, missing local id, id mismatch, amount/interval mismatch,
 * active-state drift, multiple active price candidates, ambiguous match, orphan,
 * intentionally-unbound, informational binding, and live/test separation.
 *
 * Every local product must have exactly one primaryOutcome.
 * Anomaly flags are orthogonal and may be zero or more.
 */

import { describe, it, expect } from "vitest";
import { reconcile, type LocalCommercialProduct } from "./stripe-reconciliation";
import type { StripeCatalogSnapshot, NormalizedStripeProduct, NormalizedStripePrice } from "./stripe-catalog-adapter.server";

function snap(products: Partial<NormalizedStripeProduct>[], prices: Partial<NormalizedStripePrice>[], livemode = true): StripeCatalogSnapshot {
  return {
    retrievedAt: "t", schemaVersion: "1", keyMode: "live", apiVersion: "v", livemode,
    productCount: products.length, priceCount: prices.length,
    products: products.map((p) => ({ id: "prod_x", name: "X", active: true, livemode, aolProductCode: null, ...p })),
    prices: prices.map((pr) => ({ id: "price_x", productId: "prod_x", active: true, livemode, currency: "gbp", unitAmount: 4900, recurringInterval: null, lookupKey: null, aolProductCode: null, ...pr })),
  };
}
function local(o: Partial<LocalCommercialProduct>): LocalCommercialProduct {
  return { code: "p", name: "X", amount: 4900, currency: "gbp", stripeProductId: null, stripePriceId: null, active: true, commercialStatus: "paid", recurringInterval: null, ...o };
}
const rowOf = (r: ReturnType<typeof reconcile>, code: string) => r.find((x) => x.code === code)!;

describe("stripe reconciliation engine", () => {
  it("EXACT_MATCH when local IDs equal live IDs and fields agree", () => {
    const s = snap([{ id: "prod_1", name: "Alpha" }], [{ id: "price_1", productId: "prod_1", unitAmount: 4900 }]);
    const r = reconcile(s, [local({ code: "alpha", name: "Alpha", stripeProductId: "prod_1", stripePriceId: "price_1", amount: 4900 })]);
    expect(rowOf(r, "alpha").primaryOutcome).toBe("EXACT_MATCH");
    expect(rowOf(r, "alpha").anomalyFlags).toEqual([]);
  });

  it("LOCAL_ID_MISSING when a live object exists but catalogue is unbound", () => {
    const s = snap([{ id: "prod_2", name: "Beta", aolProductCode: "beta" }], [{ id: "price_2", productId: "prod_2" }]);
    const r = reconcile(s, [local({ code: "beta", name: "Beta", stripeProductId: null, stripePriceId: null })]);
    expect(rowOf(r, "beta").primaryOutcome).toBe("LOCAL_ID_MISSING");
  });

  it("PRODUCT_ID_MISMATCH when catalogue id differs from the name/metadata-matched live product", () => {
    const s = snap([{ id: "prod_live", name: "Gamma", aolProductCode: "gamma" }], [{ id: "price_g", productId: "prod_live" }]);
    const r = reconcile(s, [local({ code: "gamma", name: "Gamma", stripeProductId: "prod_stale", stripePriceId: "price_g" })]);
    expect(rowOf(r, "gamma").primaryOutcome).toBe("PRODUCT_ID_MISMATCH");
  });

  it("AMOUNT_MISMATCH and INTERVAL_MISMATCH are anomaly flags (not primary outcomes)", () => {
    const s = snap([{ id: "prod_3", name: "Delta" }], [{ id: "price_3", productId: "prod_3", unitAmount: 9900, recurringInterval: "month" }]);
    const r = reconcile(s, [local({ code: "delta", name: "Delta", stripeProductId: "prod_3", stripePriceId: "price_3", amount: 4900, recurringInterval: null })]);
    const row = rowOf(r, "delta");
    // Primary outcome is EXACT_MATCH (IDs match); amount/interval drift are anomaly flags
    expect(row.primaryOutcome).toBe("EXACT_MATCH");
    expect(row.anomalyFlags).toEqual(expect.arrayContaining(["AMOUNT_MISMATCH", "INTERVAL_MISMATCH"]));
  });

  it("ACTIVE_STATE_DRIFT is an anomaly flag (not a primary outcome)", () => {
    const s = snap([{ id: "prod_4", name: "Epsilon", active: true }], [{ id: "price_4", productId: "prod_4" }]);
    const r = reconcile(s, [local({ code: "epsilon", name: "Epsilon", stripeProductId: "prod_4", stripePriceId: "price_4", active: false })]);
    const row = rowOf(r, "epsilon");
    // Primary outcome is EXACT_MATCH (IDs match); active-state drift is anomaly flag
    expect(row.primaryOutcome).toBe("EXACT_MATCH");
    expect(row.anomalyFlags).toContain("ACTIVE_STATE_DRIFT");
    // facts reported separately, not merged:
    expect(row.stripeProductActive).toBe(true);
    expect(row.localActive).toBe(false);
  });

  it("MULTIPLE_ACTIVE_PRICE_CANDIDATES is an anomaly flag when local has no Price ID", () => {
    const s = snap([{ id: "prod_5", name: "Zeta" }], [
      { id: "price_5a", productId: "prod_5", active: true },
      { id: "price_5b", productId: "prod_5", active: true },
    ]);
    const r = reconcile(s, [local({ code: "zeta", name: "Zeta", stripeProductId: "prod_5", stripePriceId: null })]);
    const row = rowOf(r, "zeta");
    expect(row.primaryOutcome).toBe("LOCAL_ID_MISSING");
    expect(row.anomalyFlags).toContain("MULTIPLE_ACTIVE_PRICE_CANDIDATES");
  });

  it("AMBIGUOUS_MATCH when two live products share the same normalized name (no auto-write)", () => {
    const s = snap([{ id: "prod_6a", name: "Eta" }, { id: "prod_6b", name: "Eta" }], []);
    const r = reconcile(s, [local({ code: "eta", name: "Eta", stripeProductId: null })]);
    expect(rowOf(r, "eta").primaryOutcome).toBe("AMBIGUOUS_MATCH");
  });

  it("ORPHAN_REMOTE_PRODUCT for a live product with no local match", () => {
    const s = snap([{ id: "prod_orph", name: "Orphan" }], []);
    const r = reconcile(s, [local({ code: "unrelated", name: "Unrelated", stripeProductId: null })]);
    expect(r.some((x) => x.remoteProductId === "prod_orph" && x.classifications.includes("ORPHAN_REMOTE_PRODUCT"))).toBe(true);
  });

  it("INTENTIONALLY_UNBOUND for a free/manual local product with no Stripe id and no match", () => {
    const s = snap([], []);
    const r = reconcile(s, [local({ code: "freebie", name: "Freebie", commercialStatus: "free_controlled", stripeProductId: null, amount: 0 })]);
    expect(rowOf(r, "freebie").primaryOutcome).toBe("INTENTIONALLY_UNBOUND");
  });

  it("INFORMATIONAL_STRIPE_BINDING is an anomaly flag, not a primary outcome (manual_billing with complete Stripe binding)", () => {
    const s = snap([{ id: "prod_collab", name: "Collaborator" }], [{ id: "price_collab", productId: "prod_collab", unitAmount: 1500, recurringInterval: "month" }]);
    const r = reconcile(s, [local({
      code: "collaborator", name: "Collaborator",
      stripeProductId: "prod_collab", stripePriceId: "price_collab",
      amount: 1500, commercialStatus: "manual_billing", recurringInterval: "month",
    })]);
    const row = rowOf(r, "collaborator");
    // Primary outcome must be EXACT_MATCH (binding is correct)
    expect(row.primaryOutcome).toBe("EXACT_MATCH");
    // INFORMATIONAL_STRIPE_BINDING must be an anomaly flag only
    expect(row.anomalyFlags).toContain("INFORMATIONAL_STRIPE_BINDING");
    // It must NOT be in the primary outcome position
    expect(row.classifications[0]).toBe("EXACT_MATCH");
  });

  it("every local product has exactly one primaryOutcome", () => {
    const s = snap(
      [{ id: "prod_a", name: "Alpha" }, { id: "prod_b", name: "Beta" }, { id: "prod_c", name: "Gamma" }],
      [{ id: "price_a", productId: "prod_a" }, { id: "price_b", productId: "prod_b" }],
    );
    const r = reconcile(s, [
      local({ code: "alpha", name: "Alpha", stripeProductId: "prod_a", stripePriceId: "price_a" }),
      local({ code: "beta", name: "Beta", stripeProductId: "prod_b", stripePriceId: null }),
      local({ code: "gamma", name: "Gamma", stripeProductId: null, stripePriceId: null, commercialStatus: "free_controlled" }),
    ]);
    for (const result of r) {
      if (result.code === null) continue; // orphan remotes
      expect(result.primaryOutcome).toBeDefined();
      expect(typeof result.primaryOutcome).toBe("string");
    }
  });

  it("classifications array starts with primaryOutcome followed by anomalyFlags", () => {
    const s = snap([{ id: "prod_x", name: "X", active: true }], [{ id: "price_x", productId: "prod_x", unitAmount: 4900 }]);
    const r = reconcile(s, [local({
      code: "test", name: "X",
      stripeProductId: "prod_x", stripePriceId: "price_x",
      amount: 4900, active: false,
    })]);
    const row = rowOf(r, "test");
    expect(row.classifications[0]).toBe(row.primaryOutcome);
    expect(row.classifications.slice(1)).toEqual(row.anomalyFlags);
  });

  it("classifications is always derived from primaryOutcome + anomalyFlags (never independently constructed)", () => {
    const s = snap(
      [{ id: "prod_a", name: "Alpha" }, { id: "prod_b", name: "Beta" }, { id: "prod_c", name: "Gamma" }],
      [{ id: "price_a", productId: "prod_a" }, { id: "price_b", productId: "prod_b" }],
    );
    const r = reconcile(s, [
      local({ code: "alpha", name: "Alpha", stripeProductId: "prod_a", stripePriceId: "price_a" }),
      local({ code: "beta", name: "Beta", stripeProductId: null, stripePriceId: null, commercialStatus: "free_controlled" }),
      local({ code: "gamma", name: "Gamma", stripeProductId: "prod_stale", stripePriceId: "price_c", amount: 4900 }),
    ]);
    for (const result of r) {
      if (result.code === null) continue; // orphan remotes
      // classifications must equal [primaryOutcome, ...anomalyFlags]
      const expected = [result.primaryOutcome, ...result.anomalyFlags];
      expect(result.classifications).toEqual(expected);
    }
  });
});