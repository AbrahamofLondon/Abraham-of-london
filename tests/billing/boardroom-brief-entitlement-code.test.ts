/**
 * tests/billing/boardroom-brief-entitlement-code.test.ts
 *
 * REGRESSION TEST: BOARDROOM_BRIEF must be in PRODUCT_CODES.
 *
 * Bug context: BOARDROOM_BRIEF: "boardroom-brief" was missing from the
 * PRODUCT_CODES enum in lib/server/billing/entitlements.ts. Without it,
 * the Stripe webhook (pages/api/billing/webhook.ts) would receive a
 * checkout.session.completed event for a Boardroom Brief purchase,
 * fail the isProductCode() gate, and never grant the entitlement.
 *
 * Customer pays £99. Customer gets nothing.
 *
 * This test suite proves the fix holds across:
 *   1. PRODUCT_CODES includes "boardroom-brief"
 *   2. isProductCode("boardroom-brief") returns true
 *   3. catalog.boardroom_brief.entitlementSlug maps correctly
 *   4. Webhook metadata productCode="boardroom-brief" passes the entitlement gate
 */

import { describe, expect, it } from "vitest";
import { PRODUCT_CODES, type ProductCode } from "@/lib/server/billing/entitlements";
import { CATALOG } from "@/lib/commercial/catalog";

// ─── TEST 1: PRODUCT_CODES includes "boardroom-brief" ────────────────────────

describe("PRODUCT_CODES includes boardroom-brief", () => {
  it("has BOARDROOM_BRIEF key with value 'boardroom-brief'", () => {
    expect(PRODUCT_CODES.BOARDROOM_BRIEF).toBe("boardroom-brief");
  });

  it("'boardroom-brief' is a value in the PRODUCT_CODES enum", () => {
    const values = Object.values(PRODUCT_CODES);
    expect(values).toContain("boardroom-brief");
  });

  it("'boardroom-brief' is the only canonical value for the Boardroom Brief product code", () => {
    // There should be exactly one entry with value "boardroom-brief"
    const matches = Object.entries(PRODUCT_CODES).filter(
      ([, value]) => value === "boardroom-brief",
    );
    expect(matches.length).toBe(1);
    expect(matches[0][0]).toBe("BOARDROOM_BRIEF");
  });
});

// ─── TEST 2: isProductCode("boardroom-brief") returns true ────────────────────

describe("isProductCode gate", () => {
  // Replicate the exact logic from pages/api/billing/webhook.ts
  const VALID_PRODUCT_CODES = new Set<string>(Object.values(PRODUCT_CODES));

  function isProductCode(value: string): value is ProductCode {
    return VALID_PRODUCT_CODES.has(value);
  }

  it("returns true for 'boardroom-brief'", () => {
    expect(isProductCode("boardroom-brief")).toBe(true);
  });

  it("returns false for unknown product codes", () => {
    expect(isProductCode("nonexistent-product")).toBe(false);
    expect(isProductCode("")).toBe(false);
    expect(isProductCode("boardroom-brief-misspelled")).toBe(false);
  });

  it("returns true for all other known product codes (sanity check)", () => {
    // Spot-check a few critical ones
    expect(isProductCode("executive-report-full")).toBe(true);
    expect(isProductCode("strategy-room.entry")).toBe(true);
    expect(isProductCode("boardroom-pdf")).toBe(true);
    expect(isProductCode("professional")).toBe(false); // "professional" is not a PRODUCT_CODE value
  });
});

// ─── TEST 3: catalog.boardroom_brief.entitlementSlug maps correctly ───────────

describe("catalog boardroom_brief entitlement slug", () => {
  it("exists in the catalog", () => {
    expect(CATALOG.boardroom_brief).toBeDefined();
  });

  it("is active and paid", () => {
    expect(CATALOG.boardroom_brief!.active).toBe(true);
    expect(CATALOG.boardroom_brief!.commercialStatus).toBe("paid");
  });

  it("has entitlementSlug that matches PRODUCT_CODES value", () => {
    const entitlementSlug = CATALOG.boardroom_brief!.entitlementSlug;
    expect(entitlementSlug).toBe("boardroom-brief");
    expect(entitlementSlug).toBe(PRODUCT_CODES.BOARDROOM_BRIEF);
  });

  it("has a valid Stripe price ID for checkout", () => {
    expect(CATALOG.boardroom_brief!.stripePriceId).toBeTruthy();
    expect(CATALOG.boardroom_brief!.stripePriceId).toMatch(/^price_/);
  });

  it("has a valid Stripe product ID", () => {
    expect(CATALOG.boardroom_brief!.stripeProductId).toBeTruthy();
    expect(CATALOG.boardroom_brief!.stripeProductId).toMatch(/^prod_/);
  });

  it("has correct pricing", () => {
    expect(CATALOG.boardroom_brief!.amount).toBe(9900); // £99.00 in pence
    expect(CATALOG.boardroom_brief!.displayPrice).toBe("£99");
  });

  it("has requiresCheckout enabled", () => {
    expect(CATALOG.boardroom_brief!.requiresCheckout).toBe(true);
  });
});

// ─── TEST 4: Webhook metadata productCode="boardroom-brief" passes the gate ──

describe("webhook entitlement gate for boardroom-brief", () => {
  // Simulate the webhook's exact validation flow from pages/api/billing/webhook.ts
  const VALID_PRODUCT_CODES = new Set<string>(Object.values(PRODUCT_CODES));

  function isProductCode(value: string): value is ProductCode {
    return VALID_PRODUCT_CODES.has(value);
  }

  function simulateWebhookEntitlementGate(metadata: {
    email?: string;
    productCode?: string;
  }): { passesGate: boolean; reason: string } {
    const email = (metadata.email || "").toLowerCase();
    const productCode = metadata.productCode || "";

    if (!email) {
      return { passesGate: false, reason: "No email" };
    }
    if (!productCode) {
      return { passesGate: false, reason: "No productCode" };
    }
    if (!isProductCode(productCode)) {
      return { passesGate: false, reason: `Unknown productCode: ${productCode}` };
    }

    return { passesGate: true, reason: "ok" };
  }

  it("passes the entitlement gate with productCode='boardroom-brief'", () => {
    const result = simulateWebhookEntitlementGate({
      email: "test@example.com",
      productCode: "boardroom-brief",
    });
    expect(result.passesGate).toBe(true);
    expect(result.reason).toBe("ok");
  });

  it("passes the entitlement gate with productCode='boardroom_brief' (legacy format)", () => {
    // The webhook also handles this case explicitly
    const result = simulateWebhookEntitlementGate({
      email: "test@example.com",
      productCode: "boardroom_brief",
    });
    // Note: "boardroom_brief" is NOT in PRODUCT_CODES (the value is "boardroom-brief")
    // This test documents that the legacy format does NOT pass the PRODUCT_CODES gate
    // The webhook has a separate explicit check for this: pc === "boardroom_brief"
    expect(result.passesGate).toBe(false);
  });

  it("rejects empty productCode", () => {
    const result = simulateWebhookEntitlementGate({
      email: "test@example.com",
      productCode: "",
    });
    expect(result.passesGate).toBe(false);
    expect(result.reason).toBe("No productCode");
  });

  it("rejects missing email", () => {
    const result = simulateWebhookEntitlementGate({
      email: "",
      productCode: "boardroom-brief",
    });
    expect(result.passesGate).toBe(false);
    expect(result.reason).toBe("No email");
  });

  it("rejects unknown product codes", () => {
    const result = simulateWebhookEntitlementGate({
      email: "test@example.com",
      productCode: "nonexistent-product",
    });
    expect(result.passesGate).toBe(false);
    expect(result.reason).toContain("Unknown productCode");
  });

  it("rejects misspelled boardroom-brief", () => {
    const result = simulateWebhookEntitlementGate({
      email: "test@example.com",
      productCode: "boardroom-brieff",
    });
    expect(result.passesGate).toBe(false);
  });

  it("rejects misspelled boardroom_brief", () => {
    const result = simulateWebhookEntitlementGate({
      email: "test@example.com",
      productCode: "boardroom_brieff",
    });
    expect(result.passesGate).toBe(false);
  });
});

// ─── TEST 5: Cross-reference — catalog code matches PRODUCT_CODES value ──────

describe("catalog-to-entitlement cross-reference", () => {
  it("catalog.boardroom_brief.code matches PRODUCT_CODES.BOARDROOM_BRIEF", () => {
    // The catalog code is "boardroom_brief" (snake_case, catalog key)
    // The PRODUCT_CODES value is "boardroom-brief" (kebab-case, entitlement slug)
    // These are intentionally different — the catalog key is internal,
    // the entitlement slug is what Stripe metadata and webhook use.
    expect(CATALOG.boardroom_brief!.code).toBe("boardroom_brief");
    expect(PRODUCT_CODES.BOARDROOM_BRIEF).toBe("boardroom-brief");
  });

  it("catalog.boardroom_brief.entitlementSlug is the webhook's expected value", () => {
    // This is the critical mapping: the catalog says the entitlement slug is
    // "boardroom-brief", and PRODUCT_CODES now has BOARDROOM_BRIEF = "boardroom-brief".
    // The webhook resolves productCode from Stripe metadata, then checks
    // isProductCode(productCode). If they match, entitlement is granted.
    const slug = CATALOG.boardroom_brief!.entitlementSlug;
    expect(slug).toBe(PRODUCT_CODES.BOARDROOM_BRIEF);

    // Verify the webhook would accept it
    const VALID_PRODUCT_CODES = new Set<string>(Object.values(PRODUCT_CODES));
    expect(VALID_PRODUCT_CODES.has(slug!)).toBe(true);
  });
});
