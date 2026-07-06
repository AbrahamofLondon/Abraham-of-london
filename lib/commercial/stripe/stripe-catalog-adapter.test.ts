/**
 * lib/commercial/stripe/stripe-catalog-adapter.test.ts
 *
 * PR B — adapter proofs with a mocked Stripe client (never touches the live API).
 * Covers: read-only (list-only) behaviour, full pagination, active+inactive
 * retrieval, and live/test separation.
 */

import { describe, it, expect, vi, afterEach } from "vitest";

const listCalls: string[] = [];

function asyncList<T>(items: T[]) {
  return (async function* () {
    for (const i of items) yield i;
  })();
}

// A mock client that ONLY exposes list methods. Any write (create/update/del)
// would be an undefined access → the "no write" guarantee is structural.
vi.mock("./stripe-client.server", () => ({
  STRIPE_RECON_API_VERSION: "test-version",
  getStripeKeyMode: () => "live",
  getStripeReadClient: () => ({
    products: {
      list: (args: { active: boolean }) => {
        listCalls.push("products.list");
        return asyncList(
          args.active
            ? [
                { id: "prod_a1", name: "A1", active: true, livemode: true, metadata: {} },
                { id: "prod_a2", name: "A2", active: true, livemode: true, metadata: { aol_product_code: "a2" } },
              ]
            : [{ id: "prod_i1", name: "I1", active: false, livemode: true, metadata: {} }],
        );
      },
    },
    prices: {
      list: (args: { active: boolean }) => {
        listCalls.push("prices.list");
        return asyncList(
          args.active
            ? [{ id: "price_a1", product: "prod_a1", active: true, livemode: true, currency: "gbp", unit_amount: 4900, recurring: null, lookup_key: null, metadata: {} }]
            : [],
        );
      },
    },
  }),
}));

afterEach(() => { listCalls.length = 0; });

describe("stripe catalogue adapter (read-only)", () => {
  it("uses ONLY list methods (products.list + prices.list) — no writes", async () => {
    const { pullStripeCatalogSnapshot } = await import("./stripe-catalog-adapter.server");
    await pullStripeCatalogSnapshot();
    // Only list calls were made; every call is a *.list.
    expect(listCalls.every((c) => c.endsWith(".list"))).toBe(true);
    expect(listCalls).toContain("products.list");
    expect(listCalls).toContain("prices.list");
  });

  it("retrieves active AND inactive products with full pagination", async () => {
    const { pullStripeCatalogSnapshot } = await import("./stripe-catalog-adapter.server");
    const snap = await pullStripeCatalogSnapshot();
    // 2 active + 1 inactive across the paginated async iterator.
    expect(snap.productCount).toBe(3);
    expect(snap.products.some((p) => !p.active)).toBe(true);
    expect(snap.products.find((p) => p.id === "prod_a2")?.aolProductCode).toBe("a2");
    expect(snap.livemode).toBe(true);
    expect(snap.keyMode).toBe("live");
  });
});

describe("stripe catalogue adapter — live/test separation", () => {
  afterEach(() => vi.resetModules());

  it("refuses a snapshot that mixes live and test objects", async () => {
    vi.resetModules();
    vi.doMock("./stripe-client.server", () => ({
      STRIPE_RECON_API_VERSION: "test-version",
      getStripeKeyMode: () => "live",
      getStripeReadClient: () => ({
        products: {
          list: (args: { active: boolean }) =>
            asyncList(args.active ? [{ id: "p_live", name: "L", active: true, livemode: true, metadata: {} }] : [{ id: "p_test", name: "T", active: false, livemode: false, metadata: {} }]),
        },
        prices: { list: () => asyncList([]) },
      }),
    }));
    const mod = await import("./stripe-catalog-adapter.server");
    await expect(mod.pullStripeCatalogSnapshot()).rejects.toThrow(/mixes live and test/i);
  });
});
