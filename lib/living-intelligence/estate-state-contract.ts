/**
 * lib/living-intelligence/estate-state-contract.ts
 *
 * Canonical estate state types for the Living Intelligence Engine.
 *
 * Defines the shape of every domain snapshot, contradiction, intervention,
 * recommendation, and report that the engine produces.
 *
 * Source-of-truth hierarchy (non-negotiable):
 *   1. Publication truth:   market-intelligence-lifecycle.ts
 *   2. Runtime edition:     gmi-edition-resolver.ts (DB-backed)
 *   3. Commercial metadata: gmi-edition-registry.ts, CATALOG, product-code maps
 *   4. Governance permission: ProductAuthorityContract, release matrices, resolver
 *
 * No production code imports from this file — it is consumed by the
 * living-intelligence engine and the check-living-estate-intelligence.mjs script.
 */

// ─── Domain States ───────────────────────────────────────────────────────────

/** Product governance state from ProductAuthorityContract */
export type ProductAuthorityState =
  | "internal_only"
  | "blocked_until_claim_evidenced"
  | "insufficient_information_requires_review"
  | "diagnostic_product_pending_evidence_validation"
  | "diagnostic_product"
  | "static_reference";

/** Commercial status from CATALOG */
export type CommercialStatus =
  | "free_controlled"
  | "paid"
  | "contracted"
  | "manual_billing"
  | "evidence_gated"
  | "dormant"
  | "inactive"
  | "retired"
  | "internal_only";

/** GMI edition commercial status from registry */
export type GmiEditionStatus =
  | "draft"
  | "active"
  | "manual_billing"
  | "archived"
  | "retired";

/** Market intelligence lifecycle state (publication truth) */
export type LifecycleState =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "ACTIVE_UNTIL_SUPERSEDED"
  | "SUPERSEDED"
  | "ARCHIVED"
  | "RETIRED";

/** Release readiness status from readiness matrix */
export type ReadinessStatus =
  | "release_ready_now"
  | "blocked"
  | "future_ready_for_evidence_path"
  | string;

/** Resolver commercial action state */
export type ResolverActionState =
  | "checkout"
  | "request_access"
  | "manual_fulfilment"
  | "contact_sales"
  | "review_gated"
  | "evidence_gated"
  | "blocked"
  | "archive_reference_only"
  | "view_free_surface"
  | "unavailable";

// ─── Product Snapshot ────────────────────────────────────────────────────────

export type ProductSnapshot = {
  productCode: string;
  productName: string;
  /** From ProductAuthorityContract */
  authorityState: ProductAuthorityState | null;
  /** From CATALOG */
  commercialStatus: CommercialStatus | null;
  /** From CATALOG */
  hasStripeProductId: boolean;
  /** From CATALOG */
  hasStripePriceId: boolean;
  /** From CATALOG */
  active: boolean;
  /** From CATALOG */
  requiresCheckout: boolean | null;
  /** From readiness matrix */
  readinessStatus: ReadinessStatus | null;
  /** From readiness matrix */
  releaseReadyNow: boolean | null;
  /** From readiness matrix */
  checkoutSafe: boolean | null;
  /** From readiness matrix */
  commercialSafe: boolean | null;
  /** From readiness/governance matrix */
  releaseLane: string | null;
  /** From readiness/governance matrix */
  releaseMode: string | null;
  /** From governance matrix */
  checkoutAllowed: boolean | null;
  /** Resolver action */
  resolverAction: ResolverActionState | null;
  /** Resolver purchasable flag */
  resolverPurchasable: boolean;
};

// ─── GMI Edition Snapshot ────────────────────────────────────────────────────

export type GmiEditionSnapshot = {
  editionId: string;
  productCode: string;
  quarter: string;
  year: number;
  /** From gmi-edition-registry.ts */
  registryStatus: GmiEditionStatus;
  /** From gmi-edition-registry.ts */
  registryCurrent: boolean;
  /** From gmi-edition-registry.ts */
  registryHiddenFromPricing: boolean;
  /** From market-intelligence-lifecycle.ts (PUBLICATION TRUTH) */
  lifecycleState: LifecycleState | null;
  /** From market-intelligence-lifecycle.ts */
  lifecyclePublicVisible: boolean | null;
  /** From market-intelligence-lifecycle.ts */
  lifecyclePurchasable: boolean | null;
  /** From ProductAuthorityContract */
  authorityState: ProductAuthorityState | null;
  /** From CATALOG */
  commercialStatus: CommercialStatus | null;
  /** From CATALOG */
  hasStripePriceId: boolean;
  /** Resolver action for the edition's catalog product */
  resolverAction: ResolverActionState | null;
};

// ─── Content Family Snapshot ─────────────────────────────────────────────────

export type ContentFamilySnapshot = {
  family: string;
  /** Number of source files in content/ directory */
  sourceFileCount: number;
  /** Number of documents indexed by Contentlayer */
  indexedCount: number;
  /** Number of published, public documents */
  publicIndexedCount: number;
  /** Whether the family has route resolution issues */
  hasRouteIssues: boolean;
  /** Specific route issues */
  routeIssues: string[];
};

// ─── Build Snapshot ──────────────────────────────────────────────────────────

export type BuildSnapshot = {
  /** Whether .contentlayer/generated exists */
  contentlayerBuilt: boolean;
  /** Build-critical env vars and their status */
  envVars: Record<string, { present: boolean; malformed: boolean }>;
  /** Whether NEXTAUTH_URL was set */
  nextauthUrlSet: boolean;
  /** Whether VERCEL=1 would change output config */
  vercelAffectsOutput: boolean;
};

// ─── Estate Snapshot (complete) ──────────────────────────────────────────────

export type EstateSnapshot = {
  timestamp: string;
  products: Record<string, ProductSnapshot>;
  gmiEditions: GmiEditionSnapshot[];
  contentFamilies: ContentFamilySnapshot[];
  build: BuildSnapshot;
  /** Product codes that are in the governance matrices but not in CATALOG */
  governanceOnlyCodes: string[];
  /** Product codes that are in CATALOG but not in governance matrices */
  catalogOnlyCodes: string[];
};

// ─── Contradictions & Tensions ───────────────────────────────────────────────

export type ContradictionSeverity =
  | "fatal_build_blocker"
  | "commercial_safety_blocker"
  | "checkout_bypass"
  | "governance_contradiction"
  | "publication_lifecycle_conflict"
  | "content_route_failure"
  | "storefront_gap"
  | "narrative_drift"
  | "test_drift"
  | "source_of_truth_conflict"
  | "owner_decision_required"
  | "governed_tension"
  | "informational_note";

export type Contradiction = {
  id: string;
  severity: ContradictionSeverity;
  title: string;
  description: string;
  /** The domains involved */
  domains: string[];
  /** The source-of-truth that should prevail */
  authoritativeSource: string;
  /** Whether this is a hard failure (must fix) */
  isFailure: boolean;
  /** Whether this requires an explicit owner decision */
  requiresOwnerDecision: boolean;
  /** Whether this has been explicitly acknowledged by the owner */
  ownerAcknowledged: boolean;
  /** Suggested action */
  recommendation: string;
};

// ─── Intervention ────────────────────────────────────────────────────────────

export type InterventionClassification =
  | "fatal_build_blocker"
  | "commercial_safety_blocker"
  | "checkout_bypass"
  | "governance_contradiction"
  | "publication_lifecycle_conflict"
  | "content_route_failure"
  | "storefront_gap"
  | "narrative_drift"
  | "test_drift"
  | "source_of_truth_conflict"
  | "owner_decision_required"
  | "governed_tension"
  | "informational_note";

export type Intervention = {
  classification: InterventionClassification;
  contradictionId: string;
  title: string;
  description: string;
  /** Can this be fixed automatically? */
  autoFixable: boolean;
  /** Must this be escalated to human? */
  requiresHumanReview: boolean;
  /** Must the owner decide? */
  requiresOwnerDecision: boolean;
  /** Suggested fix (if auto-fixable) */
  suggestedFix?: string;
};

// ─── Recommendation ──────────────────────────────────────────────────────────

export type RecommendationAction =
  | "block_checkout"
  | "gate_product"
  | "update_registry"
  | "update_lifecycle"
  | "update_resolver"
  | "update_storefront"
  | "update_test"
  | "add_route"
  | "remove_public_claim"
  | "request_owner_decision"
  | "hold_deployment"
  | "mark_as_governed_tension"
  | "no_action_required";

export type Recommendation = {
  action: RecommendationAction;
  target: string;
  reason: string;
  priority: "critical" | "high" | "medium" | "low";
  autoSafe: boolean;
};

// ─── Guardrail Violation ─────────────────────────────────────────────────────

export type GuardrailViolation = {
  guardrail: string;
  description: string;
  severity: "violation" | "warning" | "info";
  details: string;
};

// ─── Living Report ───────────────────────────────────────────────────────────

export type LivingReport = {
  timestamp: string;
  summary: {
    totalContradictions: number;
    failures: number;
    warnings: number;
    informationalTensions: number;
    ownerDecisionsRequired: number;
    guardrailViolations: number;
    checkoutBypasses: number;
  };
  contradictions: Contradiction[];
  interventions: Intervention[];
  recommendations: Recommendation[];
  guardrailViolations: GuardrailViolation[];
  snapshot: EstateSnapshot;
  /** Whether the script should exit non-zero */
  exitCode: number;
};
