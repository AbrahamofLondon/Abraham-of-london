/**
 * tests/commercial/verification-authority.test.ts
 *
 * PR D — Verification authority tests.
 *
 * Ensures that certification/verification scripts execute production code,
 * not hand-maintained mirrors. Prevents verifier drift.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { resolveCommercialAction } from "../../lib/commercial/commercial-action-resolver";
import { CATALOG, getAllProducts } from "../../lib/commercial/catalog";
import { reconcile } from "../../lib/commercial/stripe/stripe-reconciliation";
import type { StripeCatalogSnapshot } from "../../lib/commercial/stripe/stripe-catalog-adapter.server";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

describe("verification authority — no mirror imports in certification scripts", () => {
  const certificationScripts = [
    "scripts/check-product-storefront-coverage.mjs",
    "scripts/check-commercial-checkout-governance.mjs",
  ];

  for (const script of certificationScripts) {
    it(`${script} does not import _commercial-mirror.mjs`, () => {
      const content = readFileSync(join(ROOT, script), "utf8");
      expect(content).not.toContain("_commercial-mirror");
    });
  }

  it("no new imports of _commercial-mirror.mjs exist in scripts/", () => {
    const scriptsDir = join(ROOT, "scripts");
    const entries = readdirSync(scriptsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".mjs") && !entry.name.endsWith(".js")) continue;
      if (entry.name === "_commercial-mirror.mjs") continue;
      const content = readFileSync(join(scriptsDir, entry.name), "utf8");
      expect(content, `${entry.name} must not import _commercial-mirror.mjs`).not.toContain("_commercial-mirror");
    }
    // fs-walk of the large scripts/ dir; generous timeout so it survives starvation under
    // full-suite concurrency (passes in <1s in isolation) — assertion unchanged.
  }, 120000);
});

describe("verification authority — production resolver is the authority", () => {
  it("certification script imports production resolver authority", () => {
    const content = readFileSync(join(ROOT, "scripts/check-product-storefront-coverage.mjs"), "utf8");
    expect(content).toContain("commercial-action-resolver.ts");
  });

  it("no duplicate resolveCommercialAction implementation exists in scripts/", () => {
    const scriptsDir = join(ROOT, "scripts");
    const entries = readdirSync(scriptsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".mjs") && !entry.name.endsWith(".js")) continue;
      if (entry.name === "_commercial-mirror.mjs") continue;
      const content = readFileSync(join(scriptsDir, entry.name), "utf8");
      expect(content, `${entry.name} must not define its own resolveCommercialAction`).not.toMatch(/function resolveCommercialAction/);
    }
  }, 30000);

  it("unknown governance is fail-closed through production code", () => {
    const paidCheckoutProducts = Object.values(CATALOG).filter(
      (p: any) => p.commercialStatus === "paid" && p.requiresCheckout === true && p.active
    );

    for (const product of paidCheckoutProducts) {
      const governance = {
        productCode: product.code,
        known: false,
        readinessStatus: null,
        releaseReadyNow: false,
        checkoutSafe: null,
        commercialSafe: null,
        releaseLane: null,
        releaseMode: null,
        checkoutAllowed: null,
        manualFulfilmentAllowed: null,
        commercialClaimAllowed: null,
      };
      const action = resolveCommercialAction(product, governance);
      expect(action.purchasable, `${product.code} must not be purchasable with unknown governance`).toBe(false);
      expect(action.state, `${product.code} must be blocked with unknown governance`).toBe("blocked");
      expect(action.reason, `${product.code} fail-closed reason`).toBe("governance_unknown_fail_closed");
    }
  });
});

describe("verification authority — production and verifier Product Code resolution", () => {
  it("production and verifier use the same catalog source", () => {
    expect(CATALOG).toBeDefined();
    expect(Object.keys(CATALOG).length).toBeGreaterThan(40);
  });

  it("dynamic GMI editions are counted explicitly", () => {
    const gmiEditions = Object.values(CATALOG).filter(
      (p: any) => p.code.startsWith("gmi_q") && p.code !== "gmi_quarterly"
    );
    expect(gmiEditions.length).toBe(3);
  });

  it("no duplicate canonical product identities exist", () => {
    const codes = Object.keys(CATALOG);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it("every product code resolves deterministically through CATALOG", () => {
    for (const code of Object.keys(CATALOG)) {
      const product = CATALOG[code];
      expect(product, `${code} must resolve through CATALOG`).toBeDefined();
      expect(product!.code).toBe(code);
    }
  });

  it("certification scripts contain no copied Product Code map", () => {
    const scriptsDir = join(ROOT, "scripts");
    const entries = readdirSync(scriptsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".mjs") && !entry.name.endsWith(".js")) continue;
      if (entry.name === "_commercial-mirror.mjs") continue;
      const content = readFileSync(join(scriptsDir, entry.name), "utf8");
      // No certification script should define its own PRODUCT_CODE_MAP
      expect(content, `${entry.name} must not define PRODUCT_CODE_MAP`).not.toContain("PRODUCT_CODE_MAP");
    }
  }, 30000);

  it("certification code contains no independent GMI current-quarter constant", () => {
    const scriptsDir = join(ROOT, "scripts");
    const entries = readdirSync(scriptsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".mjs") && !entry.name.endsWith(".js")) continue;
      if (entry.name === "_commercial-mirror.mjs") continue;
      const content = readFileSync(join(scriptsDir, entry.name), "utf8");
      expect(content, `${entry.name} must not define CURRENT_GMI_QUARTER_KEY`).not.toContain("CURRENT_GMI_QUARTER_KEY");
    }
  }, 30000);
});

describe("verification authority — reconciliation classification integrity", () => {
  it("primaryOutcome always exists for every local product, arithmetic totals 46", () => {
    const locals = getAllProducts().map((p: any) => ({
      code: p.code,
      name: p.displayName,
      amount: p.amount,
      currency: "gbp",
      stripeProductId: p.stripeProductId,
      stripePriceId: p.stripePriceId,
      active: p.active,
      commercialStatus: p.commercialStatus || "paid",
      recurringInterval: p.duration === "monthly" ? "month" : p.duration === "annual" ? "year" : null,
    }));
    const snapshot: StripeCatalogSnapshot = {
      retrievedAt: "fixture",
      schemaVersion: "1",
      keyMode: "live",
      apiVersion: "fixture",
      livemode: true,
      productCount: locals.filter((p) => p.stripeProductId).length,
      priceCount: locals.filter((p) => p.stripeProductId && p.stripePriceId).length,
      products: locals
        .filter((p) => p.stripeProductId)
        .map((p) => ({
          id: p.stripeProductId!,
          name: p.name,
          active: p.active,
          livemode: true,
          aolProductCode: p.code,
        })),
      prices: locals
        .filter((p) => p.stripeProductId && p.stripePriceId)
        .map((p) => ({
          id: p.stripePriceId!,
          productId: p.stripeProductId!,
          active: p.active,
          livemode: true,
          currency: p.currency,
          unitAmount: p.amount,
          recurringInterval: p.recurringInterval,
          lookupKey: null,
          aolProductCode: p.code,
        })),
    };

    const results = reconcile(snapshot, locals);
    const localResults = results.filter((r) => r.code !== null);

    expect(localResults.length).toBe(46);

    for (const result of localResults) {
      expect(result.primaryOutcome, `${result.code} must have a primaryOutcome`).toBeDefined();
      expect(result.anomalyFlags).toBeDefined();
      // classifications must equal [primaryOutcome, ...anomalyFlags]
      expect(result.classifications).toEqual([result.primaryOutcome, ...result.anomalyFlags]);
    }

    // Arithmetic: sum of primary outcomes must equal 46
    const counts: Record<string, number> = {};
    for (const r of localResults) {
      counts[r.primaryOutcome] = (counts[r.primaryOutcome] || 0) + 1;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(46);

    // Remote fixture arithmetic remains internally consistent without a generated snapshot file.
    expect(snapshot.productCount).toBe(snapshot.products.length);
    expect(snapshot.priceCount).toBe(snapshot.prices.length);
  });
});
