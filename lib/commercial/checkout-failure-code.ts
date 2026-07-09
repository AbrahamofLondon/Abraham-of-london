/**
 * lib/commercial/checkout-failure-code.ts
 *
 * Standardized checkout failure codes with customer-friendly messaging.
 * Each failure maps to a public message (shown to customer) and recovery path.
 * Internal technical reasons are NOT exposed to the customer.
 *
 * Principle: Customers see helpful next steps, not technical jargon.
 */

export type CheckoutFailureCode =
  // Product configuration errors (rare, usually admin issue)
  | "PRODUCT_NOT_CONFIGURED"
  | "PRODUCT_NOT_FOUND"
  | "STRIPE_NOT_CONFIGURED"

  // Input validation errors (customer action required)
  | "EMAIL_REQUIRED"
  | "INVALID_PRODUCT_IDENTIFIER"
  | "INVALID_PROOF_TOKEN"

  // Prerequisite not met (customer can recover)
  | "RELEASE_PROOF_MISSING"           // GMI Q2 receipt doesn't exist yet
  | "DIAGNOSTIC_JOURNEY_INCOMPLETE"   // Intelligence Spine: complete diagnostic first
  | "ADMISSION_RESTRICTED"            // Executive Reporting: not admitted
  | "BOARDROOM_HANDOFF_MISSING"       // Boardroom Brief: requires valid handoff

  // Commercial governance blocks (rare, usually policy decision)
  | "CHECKOUT_BLOCKED_BY_GOVERNANCE"  // Product is not in purchasable state
  | "CHECKOUT_INELIGIBLE"             // Product doesn't meet checkout requirements

  // Stripe errors (rare, platform issue)
  | "STRIPE_SESSION_CREATION_FAILED";

/**
 * Customer-friendly message + recovery guidance for each failure code.
 * These messages are shown to the customer; internal reasons are not exposed.
 */
export interface CheckoutFailureResponse {
  code: CheckoutFailureCode;
  publicMessage: string;
  recoveryPath?: string;
  helpEmail?: string;
}

export const CHECKOUT_FAILURE_MESSAGES: Record<CheckoutFailureCode, CheckoutFailureResponse> = {
  // ── Configuration Errors ────────────────────────────────────────────────
  PRODUCT_NOT_CONFIGURED: {
    code: "PRODUCT_NOT_CONFIGURED",
    publicMessage: "This product is not yet available. Please check back soon.",
    recoveryPath: "/dashboard",
    helpEmail: "support@abraham.ai",
  },

  PRODUCT_NOT_FOUND: {
    code: "PRODUCT_NOT_FOUND",
    publicMessage: "The product you're looking for doesn't exist. Please verify the link.",
    recoveryPath: "/dashboard",
  },

  STRIPE_NOT_CONFIGURED: {
    code: "STRIPE_NOT_CONFIGURED",
    publicMessage: "Payment processing is temporarily unavailable. Please try again shortly.",
    recoveryPath: "/dashboard",
    helpEmail: "support@abraham.ai",
  },

  // ── Input Validation ────────────────────────────────────────────────────
  EMAIL_REQUIRED: {
    code: "EMAIL_REQUIRED",
    publicMessage: "Please provide your email address to proceed with checkout.",
    helpEmail: "support@abraham.ai",
  },

  INVALID_PRODUCT_IDENTIFIER: {
    code: "INVALID_PRODUCT_IDENTIFIER",
    publicMessage: "The product link is invalid. Please try again from the storefront.",
    recoveryPath: "/dashboard",
  },

  INVALID_PROOF_TOKEN: {
    code: "INVALID_PROOF_TOKEN",
    publicMessage: "This checkout link is no longer valid. Please start over.",
    recoveryPath: "/dashboard",
  },

  // ── Prerequisite Not Met ────────────────────────────────────────────────
  RELEASE_PROOF_MISSING: {
    code: "RELEASE_PROOF_MISSING",
    publicMessage: "Global Market Intelligence Q2 2026 is not yet released. It will be available on the publication date.",
    recoveryPath: "/intelligence/gmi/q2-2026",
  },

  DIAGNOSTIC_JOURNEY_INCOMPLETE: {
    code: "DIAGNOSTIC_JOURNEY_INCOMPLETE",
    publicMessage: "This product requires you to complete the diagnostic journey first. This helps us personalise the experience.",
    recoveryPath: "/diagnostics",
  },

  ADMISSION_RESTRICTED: {
    code: "ADMISSION_RESTRICTED",
    publicMessage: "Executive Reporting requires membership verification. Please contact us for access.",
    recoveryPath: "/contact",
    helpEmail: "support@abraham.ai",
  },

  BOARDROOM_HANDOFF_MISSING: {
    code: "BOARDROOM_HANDOFF_MISSING",
    publicMessage: "This offer requires a valid invitation. Please check your email or contact us.",
    recoveryPath: "/contact",
    helpEmail: "support@abraham.ai",
  },

  // ── Commercial Governance ───────────────────────────────────────────────
  CHECKOUT_BLOCKED_BY_GOVERNANCE: {
    code: "CHECKOUT_BLOCKED_BY_GOVERNANCE",
    publicMessage: "This product is not currently available for purchase. Please check back soon.",
    recoveryPath: "/dashboard",
  },

  CHECKOUT_INELIGIBLE: {
    code: "CHECKOUT_INELIGIBLE",
    publicMessage: "This product doesn't meet the requirements for online checkout. Please contact us for alternative purchase options.",
    recoveryPath: "/contact",
    helpEmail: "support@abraham.ai",
  },

  // ── Stripe Errors ───────────────────────────────────────────────────────
  STRIPE_SESSION_CREATION_FAILED: {
    code: "STRIPE_SESSION_CREATION_FAILED",
    publicMessage: "We encountered a problem processing your order. Please try again or contact support.",
    helpEmail: "support@abraham.ai",
  },
};

/**
 * Map a prerequisite evaluation failure to a checkout failure code.
 * Used by the checkout endpoint to provide consistent public messaging.
 */
export function mapPrerequisiteFailureToCheckoutCode(
  prerequisitePolicy: string,
  reason?: string,
): CheckoutFailureCode {
  switch (prerequisitePolicy) {
    case "RELEASE_RECEIPT":
      return "RELEASE_PROOF_MISSING";

    case "INTELLIGENCE_SPINE":
      return "DIAGNOSTIC_JOURNEY_INCOMPLETE";

    case "EXECUTIVE_REPORTING_ADMISSION":
      return "ADMISSION_RESTRICTED";

    case "BOARDROOM_HANDOFF":
      return "BOARDROOM_HANDOFF_MISSING";

    default:
      // Fallback for unknown policies
      return "CHECKOUT_INELIGIBLE";
  }
}

/**
 * Build a customer-facing checkout failure response.
 * Ensures sensitive technical information is never exposed.
 */
export function buildCheckoutFailureResponse(
  code: CheckoutFailureCode,
  productCode?: string,
): CheckoutFailureResponse {
  const message = CHECKOUT_FAILURE_MESSAGES[code];
  if (!message) {
    // Fallback for unmapped codes (should not happen in production)
    return {
      code: "CHECKOUT_INELIGIBLE",
      publicMessage: "Unable to process your checkout. Please try again or contact support.",
      helpEmail: "support@abraham.ai",
    };
  }

  return {
    ...message,
    // Optional: Include product code for internal logging/debugging (not shown to customer)
  };
}
