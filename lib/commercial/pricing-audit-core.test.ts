/**
 * lib/commercial/pricing-audit-core.test.ts
 *
 * Proves the pricing-audit detector is more PRECISE without becoming weaker:
 * real pricing-authority defects still fail; ordinary vocabulary and prose do not
 * misclassify. (This file is skipped by the audit walker via the .test. rule.)
 */

import { describe, it, expect } from "vitest";
import {
  collectPricingViolations,
  isMonetaryDisplayPrice,
  type PricingAuditContext,
} from "./pricing-audit-core";

const ctx: PricingAuditContext = {
  productAmounts: ["4900", "5900"],
  isResolvableProductCode: (id) => ["boardroom_brief", "professional", "gmi_quarterly", "enterprise", "diagnostic_report_basic"].includes(id),
  retiredCodes: new Set(["diagnostic_report_basic"]),
  controlledProductCodes: new Set(["gmi_quarterly", "enterprise"]),
};
const types = (text: string) => collectPricingViolations("f.tsx", text, ctx).map((v) => v.type);

// ── Section 2: semantic monetary classification ───────────────────────────────
describe("isMonetaryDisplayPrice — semantic classification", () => {
  it("monetary values", () => {
    for (const p of ["£49", "£59", "£495/month", "$1,250", "250 GBP"]) expect(isMonetaryDisplayPrice(p)).toBe(true);
  });
  it("non-monetary sentinels", () => {
    for (const p of ["Custom", "Evidence-gated", "Currently free", "Request access", "By enquiry", "Free", "Paid"]) {
      expect(isMonetaryDisplayPrice(p)).toBe(false);
    }
  });
});

// ── Section 7: required positive detections ───────────────────────────────────
describe("detector — real defects fail", () => {
  it("1. hardcoded numeric price in a pricing field", () => {
    expect(types(`const p = { displayPrice: "£49" };`)).toContain("hardcoded_product_price");
  });
  it("2. hardcoded price in a JSX purchase surface", () => {
    expect(types(`<PriceTag price="£59" />`)).toContain("hardcoded_product_price");
  });
  it("3. hardcoded numeric amount in a checkout config field", () => {
    expect(types(`const cfg = { amount: 4900 };`)).toContain("hardcoded_product_amount");
  });
  it("4. unknown productCode", () => {
    expect(types(`<CheckoutButton productCode="NON_EXISTENT" />`)).toContain("unknown_product_identifier");
  });
  it("5. unknown checkoutCode", () => {
    expect(types(`const x = { checkoutCode: "bogus" };`)).toContain("unknown_product_identifier");
  });
  it("6. retired product in a live purchase CTA", () => {
    expect(types(`<CheckoutButton productCode="diagnostic_report_basic">Buy now</CheckoutButton>`)).toContain("retired_product_reference");
  });
  it("7. controlled product exposing self-serve checkout", () => {
    expect(types(`<CheckoutButton productCode="gmi_quarterly">Buy now</CheckoutButton>`)).toContain("controlled_self_serve_checkout");
  });
  it("8. wrong canonical identifier (case) on an operational surface", () => {
    expect(types(`const cfg = { productCode: "BOARDROOM_BRIEF" };`)).toContain("unknown_product_identifier");
  });
});

// ── Required non-findings ─────────────────────────────────────────────────────
describe("detector — ordinary vocabulary does not misclassify", () => {
  it("9. 'Custom' as UI text", () => {
    expect(types(`<span>Custom reporting is available.</span>`)).not.toContain("hardcoded_product_price");
  });
  it("10. 'Evidence-gated' as a status label", () => {
    expect(types(`const label = "Evidence-gated";`)).not.toContain("hardcoded_product_price");
  });
  it("11. historical prose mentioning £49 outside a pricing field", () => {
    expect(types(`<p>Historically the entry fee was £49 in 2020.</p>`)).not.toContain("hardcoded_product_price");
  });
  it("12. retired code inside compatibility/migration handling", () => {
    expect(types(`// legacy migration compatibility\nconst m = { productCode: "diagnostic_report_basic" };`)).not.toContain("retired_product_reference");
  });
  it("13. canonical price obtained through a resolver (no literal)", () => {
    expect(types(`const price = getProduct(code).displayPrice;`)).toHaveLength(0);
  });
});

// ── Section 8: mutation proof (strictness + precision) ────────────────────────
describe("audit mutation proof", () => {
  it("A. novel hardcoded price on a commercial surface → FAIL", () => {
    expect(types(`export const card = { displayPrice: "£123" };`)).toContain("hardcoded_product_price");
  });
  it("B. non-existent productCode on an operational surface → FAIL", () => {
    expect(types(`const o = { productCode: "NON_EXISTENT_PRODUCT" };`)).toContain("unknown_product_identifier");
  });
  it("C. retired product in a purchase action → FAIL", () => {
    expect(types(`<CheckoutButton productCode="diagnostic_report_basic">Purchase now</CheckoutButton>`)).toContain("retired_product_reference");
  });
  it("D. 'Custom reporting is available.' content → no pricing violation", () => {
    expect(collectPricingViolations("f.tsx", `<div>Custom reporting is available.</div>`, ctx)).toHaveLength(0);
  });
  it("E. 'Evidence-gated' label → no hardcoded-price violation", () => {
    expect(types(`<Badge>Evidence-gated</Badge>`)).not.toContain("hardcoded_product_price");
  });
  it("F. unrelated historical sentence mentioning £49 → no product-price finding", () => {
    expect(types(`<p>Back in 2019, tickets were £49.</p>`)).not.toContain("hardcoded_product_price");
  });
});
