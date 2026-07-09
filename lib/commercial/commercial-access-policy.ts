/**
 * lib/commercial/commercial-access-policy.ts
 *
 * Commercial Access Policy — determines how each product is acquired and what
 * prerequisite (if any) must pass before checkout.
 *
 * One policy per product. No product may be subjected to a prerequisite merely
 * because it shares the canonical checkout endpoint.
 *
 * Immutable: Stripe product/price IDs, Q2 lifecycle, receipt hashes.
 */

export type AcquisitionMode =
  | "FREE"                       // No payment, immediate access
  | "SELF_SERVE_CHECKOUT"        // Immediate checkout, no prerequisites (unless policy says otherwise)
  | "EVIDENCE_GATED_CHECKOUT"    // Checkout available only if evidence passes
  | "ADMISSION_GATED_CHECKOUT"   // Checkout available only if admitted
  | "MANUAL_BILLING"             // Manual fulfilment, no self-serve checkout
  | "CONTRACT"                   // Enterprise/contract only
  | "ARCHIVE_ONLY";              // Historical reference, no acquisition

export type PrerequisitePolicy =
  | "NONE"                              // No prerequisites
  | "RELEASE_RECEIPT"                   // Durable receipt must exist (GMI)
  | "INTELLIGENCE_SPINE"                // Diagnostic journey must be completed
  | "EXECUTIVE_REPORTING_ADMISSION"     // Executive Reporting admission evaluator
  | "BOARDROOM_HANDOFF"                 // Boardroom-specific rules
  | "CUSTOM";                           // Product-specific custom evaluator

export type FulfilmentMode =
  | "INTERACTIVE_ACCESS"   // Immediate access to decision instrument
  | "PDF_DOWNLOAD"         // PDF artifact download (gated by entitlement)
  | "DOSSIER_DELIVERY"     // Quarterly/periodic delivery
  | "SESSION_BOOKING"      // Facilitated session scheduling
  | "SUBSCRIPTION"         // Ongoing subscription
  | "MANUAL";              // Manual email/contact-based fulfilment

export interface CommercialAccessPolicy {
  /** Product code (e.g., "gmi_q2_2026", "decision_exposure") */
  productCode: string;

  /** Product family (e.g., "gmi_quarterly", "decision_instruments", "executive_reporting") */
  familyCode: string;

  /** How is this product acquired? */
  acquisitionMode: AcquisitionMode;

  /** What prerequisite (if any) must pass? */
  prerequisitePolicy: PrerequisitePolicy;

  /** Does the product existence depend on a durable release proof? */
  releaseProofRequired: boolean;

  /** Does the product cost money? */
  paymentRequired: boolean;

  /** Is an entitlement record required to track access? */
  entitlementRequired: boolean;

  /** Can this product appear on public surfaces? */
  publicSurfaceAllowed: boolean;

  /** After successful payment, how is the product fulfilled? */
  fulfilmentMode: FulfilmentMode;

  /** Where does the user go after successful checkout? */
  successPath: string;

  /** Optional: Stripe product ID (for validation) */
  stripeProductId?: string;

  /** Optional: Stripe price ID (for validation) */
  stripePriceId?: string;

  /** Optional: custom prerequisite evaluator function */
  customEvaluatorName?: string; // Reference to function in lib/commercial/prerequisite-evaluators
}

/**
 * Complete product family policies.
 * Every sellable product must have exactly one policy.
 */
export const COMMERCIAL_ACCESS_POLICIES: Record<string, CommercialAccessPolicy> = {
  // ── GMI QUARTERLY ───────────────────────────────────────────────────────

  gmi_q2_2026: {
    productCode: "gmi_q2_2026",
    familyCode: "gmi_quarterly",
    acquisitionMode: "SELF_SERVE_CHECKOUT",
    prerequisitePolicy: "RELEASE_RECEIPT",     // Must check durable receipt exists
    releaseProofRequired: true,
    paymentRequired: true,
    entitlementRequired: true,
    publicSurfaceAllowed: true,
    fulfilmentMode: "PDF_DOWNLOAD",
    successPath: "/intelligence/gmi/q2-2026",
    stripeProductId: "prod_UNnSL8r6DMedEH",
    stripePriceId: "price_1TP1rRQFpelVFMXJWaFMOpJQ",
  },

  // ── DECISION INSTRUMENTS (No diagnostic prerequisite) ────────────────────

  decision_exposure: {
    productCode: "decision_exposure",
    familyCode: "decision_instruments",
    acquisitionMode: "SELF_SERVE_CHECKOUT",
    prerequisitePolicy: "NONE",                // ← NOT Intelligence Spine
    releaseProofRequired: false,
    paymentRequired: true,
    entitlementRequired: true,
    publicSurfaceAllowed: true,
    fulfilmentMode: "INTERACTIVE_ACCESS",
    successPath: "/diagnostics/decision-exposure",
  },

  decision_alignment_gap_map: {
    productCode: "decision_alignment_gap_map",
    familyCode: "decision_instruments",
    acquisitionMode: "SELF_SERVE_CHECKOUT",
    prerequisitePolicy: "NONE",
    releaseProofRequired: false,
    paymentRequired: true,
    entitlementRequired: true,
    publicSurfaceAllowed: true,
    fulfilmentMode: "INTERACTIVE_ACCESS",
    successPath: "/diagnostics/alignment-gap-map",
  },

  mandate_clarity_framework: {
    productCode: "mandate_clarity_framework",
    familyCode: "decision_instruments",
    acquisitionMode: "SELF_SERVE_CHECKOUT",
    prerequisitePolicy: "NONE",
    releaseProofRequired: false,
    paymentRequired: true,
    entitlementRequired: true,
    publicSurfaceAllowed: true,
    fulfilmentMode: "INTERACTIVE_ACCESS",
    successPath: "/diagnostics/mandate-clarity",
  },

  execution_risk_index: {
    productCode: "execution_risk_index",
    familyCode: "decision_instruments",
    acquisitionMode: "SELF_SERVE_CHECKOUT",
    prerequisitePolicy: "NONE",
    releaseProofRequired: false,
    paymentRequired: true,
    entitlementRequired: true,
    publicSurfaceAllowed: true,
    fulfilmentMode: "INTERACTIVE_ACCESS",
    successPath: "/diagnostics/execution-risk",
  },

  // ── EXECUTIVE REPORTING ──────────────────────────────────────────────────

  executive_reporting: {
    productCode: "executive_reporting",
    familyCode: "executive_reporting",
    acquisitionMode: "ADMISSION_GATED_CHECKOUT",
    prerequisitePolicy: "EXECUTIVE_REPORTING_ADMISSION",
    releaseProofRequired: false,
    paymentRequired: true,
    entitlementRequired: true,
    publicSurfaceAllowed: true,
    fulfilmentMode: "PDF_DOWNLOAD",
    successPath: "/professional/executive-reporting",
    customEvaluatorName: "evaluateExecutiveReportingAdmission",
  },

  // ── BOARDROOM BRIEF ──────────────────────────────────────────────────────

  boardroom_brief: {
    productCode: "boardroom_brief",
    familyCode: "boardroom_brief",
    acquisitionMode: "SELF_SERVE_CHECKOUT",
    prerequisitePolicy: "BOARDROOM_HANDOFF",   // Explicit policy, not hardcoded bypass
    releaseProofRequired: false,
    paymentRequired: true,
    entitlementRequired: true,
    publicSurfaceAllowed: true,
    fulfilmentMode: "PDF_DOWNLOAD",
    successPath: "/professional/boardroom-brief",
    customEvaluatorName: "evaluateBoardroomHandoff",
  },

  // ── PROFESSIONAL SUBSCRIPTION ────────────────────────────────────────────

  professional: {
    productCode: "professional",
    familyCode: "professional",
    acquisitionMode: "SELF_SERVE_CHECKOUT",
    prerequisitePolicy: "NONE",
    releaseProofRequired: false,
    paymentRequired: true,
    entitlementRequired: true,
    publicSurfaceAllowed: true,
    fulfilmentMode: "SUBSCRIPTION",
    successPath: "/professional",
  },

  professional_annual: {
    productCode: "professional_annual",
    familyCode: "professional",
    acquisitionMode: "SELF_SERVE_CHECKOUT",
    prerequisitePolicy: "NONE",
    releaseProofRequired: false,
    paymentRequired: true,
    entitlementRequired: true,
    publicSurfaceAllowed: true,
    fulfilmentMode: "SUBSCRIPTION",
    successPath: "/professional",
  },

  // ── ENTERPRISE ───────────────────────────────────────────────────────────

  enterprise: {
    productCode: "enterprise",
    familyCode: "enterprise",
    acquisitionMode: "CONTRACT",
    prerequisitePolicy: "NONE",
    releaseProofRequired: false,
    paymentRequired: true,
    entitlementRequired: true,
    publicSurfaceAllowed: true,
    fulfilmentMode: "MANUAL",
    successPath: "/contact",
  },

  // ── ADDITIONAL_COLLABORATOR ──────────────────────────────────────────────

  additional_collaborator: {
    productCode: "additional_collaborator",
    familyCode: "professional_add_ons",
    acquisitionMode: "MANUAL_BILLING",         // Assisted billing (no self-serve)
    prerequisitePolicy: "NONE",
    releaseProofRequired: false,
    paymentRequired: true,
    entitlementRequired: true,
    publicSurfaceAllowed: false,              // Internal/pro-only
    fulfilmentMode: "SUBSCRIPTION",
    successPath: "/professional",
  },

  // ── FAST DIAGNOSTIC (Free) ───────────────────────────────────────────────

  fast_diagnostic: {
    productCode: "fast_diagnostic",
    familyCode: "diagnostics",
    acquisitionMode: "FREE",
    prerequisitePolicy: "NONE",
    releaseProofRequired: false,
    paymentRequired: false,
    entitlementRequired: false,
    publicSurfaceAllowed: true,
    fulfilmentMode: "INTERACTIVE_ACCESS",
    successPath: "/diagnostics/fast",
  },
};

/**
 * Resolve a product's commercial access policy.
 * Returns null if the product has no defined policy (should not happen for production).
 */
export function resolveCommercialAccessPolicy(productCode: string): CommercialAccessPolicy | null {
  return COMMERCIAL_ACCESS_POLICIES[productCode] ?? null;
}

/**
 * Verify that all policies have consistent prerequisite/acquisition combinations.
 * This runs at build time to catch misconfigurations early.
 */
export function validatePolicies(): Array<{ productCode: string; error: string }> {
  const errors: Array<{ productCode: string; error: string }> = [];

  for (const [code, policy] of Object.entries(COMMERCIAL_ACCESS_POLICIES)) {
    // MANUAL_BILLING or CONTRACT must not require checkout
    if ((policy.acquisitionMode === "MANUAL_BILLING" || policy.acquisitionMode === "CONTRACT") && policy.paymentRequired) {
      errors.push({
        productCode: code,
        error: `${policy.acquisitionMode} mode should not have paymentRequired=true`,
      });
    }

    // FREE must not require payment or entitlement
    if (policy.acquisitionMode === "FREE" && (policy.paymentRequired || policy.entitlementRequired)) {
      errors.push({
        productCode: code,
        error: `FREE mode should not require payment or entitlement`,
      });
    }

    // ARCHIVE_ONLY must not be publicly surfaced or purchasable
    if (policy.acquisitionMode === "ARCHIVE_ONLY" && policy.publicSurfaceAllowed) {
      errors.push({
        productCode: code,
        error: `ARCHIVE_ONLY products should not appear on public surfaces`,
      });
    }

    // Release-proof-required products should be purchasable
    if (policy.releaseProofRequired && policy.acquisitionMode === "ARCHIVE_ONLY") {
      errors.push({
        productCode: code,
        error: `Release-proof products cannot be ARCHIVE_ONLY`,
      });
    }
  }

  return errors;
}
