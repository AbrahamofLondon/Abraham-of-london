/**
 * lib/product/public-product-authority-projection.ts
 *
 * Customer-safe projection of internal product authority truth.
 *
 * Phase 5 of authority containment. The internal ProductAuthorityContract carries
 * governance internals (blocking reasons, validation results, anti-toy/red-team
 * outcomes, comparator results, canonical file locations, target/evidence claims,
 * authority backbone). NONE of that may reach a customer surface.
 *
 * This projection answers only:
 *   - Can I use this?            (posture)
 *   - What does it mean to me?   (customerMeaning + publicClaimLanguage)
 *   - What should I do next?     (nextPublicAction)
 *
 * It NEVER answers which internal control failed, which evidence artifact is
 * missing, which red-team test has not passed, or where the canonical source is.
 *
 * The transform constructs a fresh object; it never spreads the internal contract,
 * so internal fields cannot leak by accident.
 */

import type {
  ProductAuthorityContract,
  ProductAuthorityState,
} from "./product-authority-contract";

export type PublicProductPosture =
  | "AVAILABLE"
  | "CONTROLLED_ACCESS"
  | "EVIDENCE_LIMITED"
  | "REFERENCE_ONLY"
  | "UNAVAILABLE";

export interface PublicProductAuthorityProjection {
  productCode: string;
  posture: PublicProductPosture;
  /** Owner-controlled public vocabulary — never a raw internal claim string. */
  publicClaimLanguage: string;
  /** What the present posture means for the customer, in plain language. */
  customerMeaning: string;
  /** A single bounded next public action, or null. */
  nextPublicAction?: { label: string; href: string } | null;
}

/**
 * Explicit internal-state → public-posture map. Every internal state maps to
 * exactly one intentional public posture. Raw internal enum names are never
 * exposed; only the mapped posture is.
 */
const POSTURE_BY_STATE: Record<ProductAuthorityState, PublicProductPosture> = {
  externally_proven_gold_product: "AVAILABLE",
  diagnostic_product: "AVAILABLE",
  judgement_product: "AVAILABLE",
  legacy_validated_pending_v2_revalidation: "EVIDENCE_LIMITED",
  blocked_until_claim_evidenced: "EVIDENCE_LIMITED",
  blocked_until_v2_revalidation: "EVIDENCE_LIMITED",
  measurement_inconclusive: "EVIDENCE_LIMITED",
  pending_reconciliation: "CONTROLLED_ACCESS",
  static_reference: "REFERENCE_ONLY",
  internal_only: "UNAVAILABLE",
  authority_contract_missing: "UNAVAILABLE",
};

/** Customer-facing meaning per posture — controlled vocabulary, no internals. */
const CUSTOMER_MEANING: Record<PublicProductPosture, string> = {
  AVAILABLE:
    "This product is available to use now.",
  CONTROLLED_ACCESS:
    "Access to this product is arranged directly rather than by instant checkout.",
  EVIDENCE_LIMITED:
    "This product is available, with results presented as a considered signal rather than a certified outcome.",
  REFERENCE_ONLY:
    "This is a reference edition — available to read, not to purchase.",
  UNAVAILABLE:
    "This product is not currently available.",
};

/** Public claim language per posture — owner-controlled, safe to render. */
const PUBLIC_CLAIM_LANGUAGE: Record<PublicProductPosture, string> = {
  AVAILABLE:
    "Available. Provides a structured, governed decision signal from the context you supply.",
  CONTROLLED_ACCESS:
    "Available by arrangement. Provided through a governed access route.",
  EVIDENCE_LIMITED:
    "Available as a considered signal. It does not certify outcomes or independently verify the underlying facts.",
  REFERENCE_ONLY:
    "Reference edition. Provided for reading and citation.",
  UNAVAILABLE:
    "Not currently available.",
};

export interface ProjectionOptions {
  /** A single bounded next public action (label + internal href). */
  nextPublicAction?: { label: string; href: string } | null;
}

/**
 * Project internal authority truth to a customer-safe DTO.
 * Reads ONLY productCode and currentAuthorityState from the contract; constructs
 * a fresh object so no internal field can cross the boundary.
 */
export function projectPublicProductAuthority(
  contract: ProductAuthorityContract,
  options: ProjectionOptions = {},
): PublicProductAuthorityProjection {
  const posture = POSTURE_BY_STATE[contract.currentAuthorityState] ?? "UNAVAILABLE";
  return {
    productCode: contract.productCode,
    posture,
    publicClaimLanguage: PUBLIC_CLAIM_LANGUAGE[posture],
    customerMeaning: CUSTOMER_MEANING[posture],
    nextPublicAction: options.nextPublicAction ?? null,
  };
}

/** The exact set of keys a public authority projection may contain. */
export const PUBLIC_PROJECTION_ALLOWED_KEYS: ReadonlyArray<keyof PublicProductAuthorityProjection> = [
  "productCode",
  "posture",
  "publicClaimLanguage",
  "customerMeaning",
  "nextPublicAction",
];
