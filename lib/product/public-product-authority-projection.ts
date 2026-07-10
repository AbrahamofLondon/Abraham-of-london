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
  | "PUBLIC_AUTHORITY_CLEARED"
  | "CONTROLLED_AUTHORITY"
  | "EVIDENCE_LIMITED"
  | "REFERENCE_AUTHORITY"
  | "NO_PUBLIC_AUTHORITY";

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
  externally_proven_gold_product: "PUBLIC_AUTHORITY_CLEARED",
  diagnostic_product: "PUBLIC_AUTHORITY_CLEARED",
  judgement_product: "PUBLIC_AUTHORITY_CLEARED",
  legacy_validated_pending_v2_revalidation: "EVIDENCE_LIMITED",
  blocked_until_claim_evidenced: "EVIDENCE_LIMITED",
  blocked_until_v2_revalidation: "EVIDENCE_LIMITED",
  measurement_inconclusive: "EVIDENCE_LIMITED",
  pending_reconciliation: "CONTROLLED_AUTHORITY",
  static_reference: "REFERENCE_AUTHORITY",
  internal_only: "NO_PUBLIC_AUTHORITY",
  authority_contract_missing: "NO_PUBLIC_AUTHORITY",
};

/** Customer-facing meaning per posture — controlled vocabulary, no internals. */
const CUSTOMER_MEANING: Record<PublicProductPosture, string> = {
  PUBLIC_AUTHORITY_CLEARED:
    "Authority cleared. Release, commercial, and progression state are separate dimensions.",
  CONTROLLED_AUTHORITY:
    "Authority is controlled. Access is arranged directly rather than by instant checkout.",
  EVIDENCE_LIMITED:
    "Evidence-limited authority. Results are presented as a considered signal rather than a certified outcome.",
  REFERENCE_AUTHORITY:
    "Reference authority. Provided for reading and citation, not for purchase.",
  NO_PUBLIC_AUTHORITY:
    "No public authority has been established for this product.",
};

/** Public claim language per posture — owner-controlled, safe to render. */
const PUBLIC_CLAIM_LANGUAGE: Record<PublicProductPosture, string> = {
  PUBLIC_AUTHORITY_CLEARED:
    "Authority cleared. Provides a structured, governed decision signal from the context you supply.",
  CONTROLLED_AUTHORITY:
    "Controlled authority. Provided through a governed access route.",
  EVIDENCE_LIMITED:
    "Evidence-limited authority. Does not certify outcomes or independently verify the underlying facts.",
  REFERENCE_AUTHORITY:
    "Reference authority. Provided for reading and citation.",
  NO_PUBLIC_AUTHORITY:
    "No public authority established.",
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
  const posture = POSTURE_BY_STATE[contract.currentAuthorityState] ?? "NO_PUBLIC_AUTHORITY";
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
