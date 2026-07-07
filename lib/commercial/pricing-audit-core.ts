/**
 * lib/commercial/pricing-audit-core.ts
 *
 * Pure detection logic for the pricing-authority audit. It audits PRICING
 * AUTHORITY, not vocabulary occurrence:
 *   - a monetary display price is one that carries a currency + numeric amount
 *     (isMonetaryDisplayPrice); commercial sentinels ("Custom", "Evidence-gated",
 *     "Request access", "Currently free") are NOT prices and never enter
 *     hardcoded-price detection;
 *   - a monetary literal is only a finding when it appears in a pricing-bearing
 *     context (a price field or a JSX price prop), not merely anywhere in a file;
 *   - structured amount detection (amount/unit_amount/priceGBP/…) stays strict;
 *   - unknown product identifiers in commercial identity fields stay fail-closed;
 *   - retired product references are findings ONLY in active purchase/checkout
 *     contexts — not in registries, migration, or denial logic.
 *
 * The script (scripts/audit-pricing-authority.ts) is a thin walker over this core.
 * Detector + mutation tests live in pricing-audit-core.test.ts.
 */

export type PricingViolationType =
  | "hardcoded_product_price"
  | "hardcoded_product_amount"
  | "unknown_product_identifier"
  | "retired_product_reference"
  | "controlled_self_serve_checkout"
  | "fallback_pricing_logic"
  | "multiple_pricing_authorities";

export interface PricingViolation {
  file: string;
  type: PricingViolationType;
  match: string;
}

// A monetary token carries a currency marker adjacent to a number.
const CURRENCY_NUMERIC =
  /(?:£|\$|€)\s?\d|(?:\bGBP\b|\bUSD\b|\bEUR\b)\s?\d|\d[\d,]*(?:\.\d+)?\s?(?:GBP|USD|EUR)\b/;

/**
 * A display price is MONETARY only if it expresses a currency and a numeric
 * amount. Sentinels like "Custom", "Evidence-gated", "Currently free",
 * "Request access", "By enquiry" are non-monetary and must never be treated as
 * hardcoded prices. This is a semantic predicate, not a fixed blacklist.
 */
export function isMonetaryDisplayPrice(displayPrice: string): boolean {
  if (!displayPrice) return false;
  return CURRENCY_NUMERIC.test(displayPrice);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Pricing-bearing field/prop assignments; the captured group is the value, which
// is then semantically classified by isMonetaryDisplayPrice. This flags ANY
// hardcoded monetary price in a price field (even a novel one) while letting
// sentinel values ("Custom", "Evidence-gated") through, and it does NOT flag
// monetary strings that merely occur in prose.
const PRICE_FIELD_ASSIGN =
  /(?:price|displayPrice|priceLabel|priceDisplay|priceGBP|unitAmountGbp|cost|amountLabel|pricing)\s*[:=]\s*["'`{]{1,2}\s*([^"'`}\n]{1,24})/gi;
const PRICE_JSX_PROP =
  /\b(?:price|displayPrice|priceLabel)\s*=\s*["'{]\s*([^"'}\n]{1,24})/gi;

/**
 * True when the monetary literal appears as the value of a pricing-bearing key
 * or a JSX price prop — i.e. it is being USED as a product price, not mentioned.
 */
export function inPricingBearingContext(text: string, monetary: string): boolean {
  for (const re of [PRICE_FIELD_ASSIGN, PRICE_JSX_PROP]) {
    for (const m of text.matchAll(re)) {
      const value = (m[1] ?? "").trim().replace("&pound;", "£");
      if (value.includes(monetary) && isMonetaryDisplayPrice(value)) return true;
    }
  }
  return false;
}

// Active-purchase context markers (real purchase intent) vs retirement markers.
const ACTIVE_PURCHASE_MARKERS =
  /(CheckoutButton|initiate[A-Za-z]*[Cc]heckout|checkout\.sessions\.create|buyNow|addToCart|requiresCheckout\s*:\s*true|Buy now|Purchase now|Get access —|Unlock —)/;
const RETIREMENT_MARKERS =
  /(inactive|retired|deprecat|legacy|migrat|compat|denial|historical|do not use|not for sale)/i;

export interface PricingAuditContext {
  /** active product amounts (minor units), as strings, > 0. */
  productAmounts: readonly string[];
  /** resolver: true if the identifier maps to a real product/alias. */
  isResolvableProductCode: (id: string) => boolean;
  /** canonical retired product codes. */
  retiredCodes: ReadonlySet<string>;
  /** codes that are NOT self-serve-checkout eligible (manual/contracted/inactive/evidence-gated). */
  controlledProductCodes: ReadonlySet<string>;
}

export function collectPricingViolations(
  rel: string,
  text: string,
  ctx: PricingAuditContext,
): PricingViolation[] {
  const violations: PricingViolation[] = [];

  // 1. Hardcoded monetary price in a pricing-bearing field/prop (value-based:
  //    flags any currency+amount value; sentinels like "Custom" pass through).
  const seenPrices = new Set<string>();
  for (const re of [PRICE_FIELD_ASSIGN, PRICE_JSX_PROP]) {
    for (const m of text.matchAll(re)) {
      const value = (m[1] ?? "").trim().replace("&pound;", "£");
      if (isMonetaryDisplayPrice(value) && !seenPrices.has(value)) {
        seenPrices.add(value);
        violations.push({ file: rel, type: "hardcoded_product_price", match: value });
      }
    }
  }

  // 2. Structured hardcoded amount in a pricing-bearing field (kept strict).
  for (const amount of ctx.productAmounts) {
    const amountPattern = new RegExp(
      `(?:amount|unit_amount|unitAmount|priceGBP|unitAmountGbp|priceInPence)\\s*:\\s*${escapeRegExp(amount)}(?![0-9])`,
    );
    if (amountPattern.test(text)) {
      violations.push({ file: rel, type: "hardcoded_product_amount", match: amount });
    }
  }

  // 3. Unknown product identifier in a commercial identity field (fail-closed).
  const idPatterns = [
    /productCode=["']([^"']+)["']/g,
    /productCode:\s*["']([^"']+)["']/g,
    /priceCode:\s*["']([^"']+)["']/g,
    /checkoutCode:\s*["']([^"']+)["']/g,
  ];
  for (const pattern of idPatterns) {
    for (const m of text.matchAll(pattern)) {
      const id = m[1];
      if (!id || id.includes("${")) continue;
      if (!ctx.isResolvableProductCode(id)) {
        violations.push({ file: rel, type: "unknown_product_identifier", match: id });
      }
    }
  }

  // 4. Product identity used in an ACTIVE purchase/checkout context must be a
  //    live, self-serve-eligible product. Retired or controlled codes exposed to
  //    self-serve checkout are findings. Registry/migration/denial usage (no active
  //    purchase markers, or retirement markers present) is not flagged.
  for (const m of text.matchAll(/(?:productCode|checkoutCode|priceCode)\s*[:=]\s*["']([^"']+)["']/g)) {
    const code = m[1];
    if (!code) continue;
    const idx = m.index ?? text.indexOf(code);
    const win = text.slice(Math.max(0, idx - 220), Math.min(text.length, idx + 220));
    const activeCtx = ACTIVE_PURCHASE_MARKERS.test(win) && !RETIREMENT_MARKERS.test(win);
    if (!activeCtx) continue;
    if (ctx.retiredCodes.has(code)) {
      violations.push({ file: rel, type: "retired_product_reference", match: code });
    } else if (ctx.controlledProductCodes.has(code)) {
      violations.push({ file: rel, type: "controlled_self_serve_checkout", match: code });
    }
  }

  // 5. Fallback pricing logic (kept).
  if (/amount:\s*(95|395)\b/.test(text) || /return\s+.*\?\s*25000\s*:\s*9500/.test(text)) {
    violations.push({ file: rel, type: "fallback_pricing_logic", match: "hardcoded fallback amount" });
  }

  return violations;
}
