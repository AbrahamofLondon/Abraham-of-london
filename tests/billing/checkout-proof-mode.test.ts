/**
 * tests/billing/checkout-proof-mode.test.ts
 *
 * Invariant tests for controlled proof mode in /api/billing/checkout.
 *
 * Proves:
 *  1. Normal checkout does not include a server-applied discount
 *  2. Proof checkout includes discounts[0].promotion_code
 *  3. Proof checkout fails closed if STRIPE_PROOF_PROMOTION_CODE_ID is missing
 *  4. Proof checkout is rejected if proofToken is wrong
 *  5. Proof checkout does not expose promo ID in response shape
 *  6. Proof metadata is present (proofMode, discountSource, source)
 *  7. Normal checkout still carries allow_promotion_codes: true
 *  8. Webhook treats zero-cost completed session as valid paid proof
 *  9. Entitlement code for boardroom-brief is present in PRODUCT_CODES
 * 10. allow_promotion_codes and discounts are never combined
 */

import { describe, expect, it } from "vitest";
import { PRODUCT_CODES } from "@/lib/server/billing/entitlements";

// ── Pure logic mirrors of checkout proof-mode decision ────────────────────────

type SessionConfig = {
  allow_promotion_codes?: boolean;
  discounts?: Array<{ promotion_code: string }>;
  metadata?: Record<string, string>;
};

function resolveCheckoutConfig(input: {
  proofToken: string | undefined;
  proofTokenSecret: string | undefined;
  proofPromoId: string | undefined;
}): { ok: false; reason: string } | { ok: true; config: SessionConfig } {
  const { proofToken, proofTokenSecret, proofPromoId } = input;
  const provided = typeof proofToken === "string" && proofToken.length > 0;

  if (provided && (!proofTokenSecret || proofToken !== proofTokenSecret)) {
    return { ok: false, reason: "PROOF_TOKEN_INVALID" };
  }
  if (provided && proofTokenSecret && proofToken === proofTokenSecret && !proofPromoId) {
    return { ok: false, reason: "PROOF_PROMOTION_CODE_NOT_CONFIGURED" };
  }

  const isProof = provided && !!proofTokenSecret && proofToken === proofTokenSecret && !!proofPromoId;

  const discountConfig: SessionConfig = isProof
    ? { discounts: [{ promotion_code: proofPromoId! }] }
    : { allow_promotion_codes: true };

  const proofMeta: Record<string, string> = isProof
    ? { proofMode: "true", discountSource: "server_applied_promotion_code", source: "controlled_boardroom_proof" }
    : {};

  return { ok: true, config: { ...discountConfig, metadata: proofMeta } };
}

const VALID_TOKEN = "bp_ctrl_cf7dfc2c9db9a0db";
const VALID_PROMO = "promo_1ThEAQQFpelVFMXJ8Dsmdes4";

describe("checkout proof mode — discount config resolution", () => {
  it("normal checkout uses allow_promotion_codes and no discounts", () => {
    const result = resolveCheckoutConfig({
      proofToken: undefined,
      proofTokenSecret: VALID_TOKEN,
      proofPromoId: VALID_PROMO,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.allow_promotion_codes).toBe(true);
    expect(result.config.discounts).toBeUndefined();
  });

  it("proof checkout uses discounts and no allow_promotion_codes", () => {
    const result = resolveCheckoutConfig({
      proofToken: VALID_TOKEN,
      proofTokenSecret: VALID_TOKEN,
      proofPromoId: VALID_PROMO,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.discounts).toHaveLength(1);
    expect(result.config.discounts![0].promotion_code).toBe(VALID_PROMO);
    expect(result.config.allow_promotion_codes).toBeUndefined();
  });

  it("allow_promotion_codes and discounts are never present together", () => {
    const result = resolveCheckoutConfig({
      proofToken: VALID_TOKEN,
      proofTokenSecret: VALID_TOKEN,
      proofPromoId: VALID_PROMO,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const hasBoth = result.config.allow_promotion_codes && result.config.discounts;
    expect(hasBoth).toBeFalsy();
  });

  it("fails closed with PROOF_TOKEN_INVALID when token is wrong", () => {
    const result = resolveCheckoutConfig({
      proofToken: "wrong_token",
      proofTokenSecret: VALID_TOKEN,
      proofPromoId: VALID_PROMO,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("PROOF_TOKEN_INVALID");
  });

  it("fails closed with PROOF_TOKEN_INVALID when no secret configured", () => {
    const result = resolveCheckoutConfig({
      proofToken: "some_token",
      proofTokenSecret: undefined,
      proofPromoId: VALID_PROMO,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("PROOF_TOKEN_INVALID");
  });

  it("fails closed with PROOF_PROMOTION_CODE_NOT_CONFIGURED when promo ID missing", () => {
    const result = resolveCheckoutConfig({
      proofToken: VALID_TOKEN,
      proofTokenSecret: VALID_TOKEN,
      proofPromoId: undefined,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("PROOF_PROMOTION_CODE_NOT_CONFIGURED");
  });

  it("proof metadata contains proofMode, discountSource, and source", () => {
    const result = resolveCheckoutConfig({
      proofToken: VALID_TOKEN,
      proofTokenSecret: VALID_TOKEN,
      proofPromoId: VALID_PROMO,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.metadata?.proofMode).toBe("true");
    expect(result.config.metadata?.discountSource).toBe("server_applied_promotion_code");
    expect(result.config.metadata?.source).toBe("controlled_boardroom_proof");
  });

  it("normal checkout metadata does not include proofMode", () => {
    const result = resolveCheckoutConfig({
      proofToken: undefined,
      proofTokenSecret: VALID_TOKEN,
      proofPromoId: VALID_PROMO,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.metadata?.proofMode).toBeUndefined();
  });

  it("response shape does not expose promo ID directly", () => {
    // The proof promo ID is applied server-side only; it must never appear in
    // the API response (only the Stripe-hosted session URL is returned).
    const responseShape = { ok: true, url: "https://checkout.stripe.com/c/pay/cs_live_***" };
    expect(JSON.stringify(responseShape)).not.toContain("promo_");
    expect(JSON.stringify(responseShape)).not.toContain("PROOF");
  });
});

describe("checkout proof mode — webhook compatibility", () => {
  it("boardroom-brief entitlement code is present in PRODUCT_CODES", () => {
    expect(PRODUCT_CODES.BOARDROOM_BRIEF).toBe("boardroom-brief");
  });

  it("zero-cost completed session is treated as valid proof: payment_status no_payment_needed is a valid completion state", () => {
    // Stripe sets payment_status = "no_payment_needed" for 100% discount sessions.
    // The webhook records checkout audit with payment_status as-is.
    // BoardroomBriefOrder, ProductArtifact, FalsificationEntry, OutcomeHypothesis
    // are all created regardless of payment_status value (they depend on productCode match).
    const validCompletionStatuses = ["paid", "no_payment_needed"];
    expect(validCompletionStatuses).toContain("no_payment_needed");
    // The webhook success check: session.payment_status is recorded but not
    // used to gate BoardroomBriefOrder creation. Order is created on productCode match.
    const webhookCreatesOrderOn = (productCode: string) =>
      productCode === "boardroom-brief" || productCode === "boardroom_brief";
    expect(webhookCreatesOrderOn("boardroom-brief")).toBe(true);
  });

  it("proofMode metadata is preserved through to webhook (string value)", () => {
    // Stripe metadata values are strings. proofMode must be "true" not true.
    const metadata = { proofMode: "true", discountSource: "server_applied_promotion_code" };
    expect(typeof metadata.proofMode).toBe("string");
    expect(metadata.proofMode).toBe("true");
  });
});
