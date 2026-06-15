/**
 * lib/living-intelligence/source-of-truth-map.ts
 *
 * Defines which system governs which question across the Abraham of London estate.
 *
 * This is the canonical reference for the Living Intelligence Engine.
 * Every contradiction detector consults this map to determine which source
 * of truth should prevail when two systems disagree.
 *
 * Non-negotiable: the source-of-truth hierarchy is:
 *   1. Publication truth:   market-intelligence-lifecycle.ts
 *   2. Runtime edition:     gmi-edition-resolver.ts (DB-backed)
 *   3. Commercial metadata: gmi-edition-registry.ts, CATALOG, product-code maps
 *   4. Governance permission: ProductAuthorityContract, release matrices, resolver
 */

export type Domain = string;
export type SourceOfTruth = string;

/**
 * Map each governance question to its authoritative source.
 * The key is the question; the value is the system that must answer it.
 */
export const SOURCE_OF_TRUTH_MAP: Record<string, SourceOfTruth> = {
  // ── Checkout & Commercial ────────────────────────────────────────────────
  checkoutPermission: "commercial_action_resolver",
  checkoutRouteIntegrity: "governed_billing_api",
  stripeMetadataOwnership: "CATALOG",
  commercialDisplayPrice: "CATALOG",
  productEntitlementSlug: "CATALOG",

  // ── Product Governance ───────────────────────────────────────────────────
  productAuthority: "ProductAuthorityContract",
  releaseReadiness: "product_release_readiness_matrix",
  releaseGovernance: "product_release_governance_matrix",
  productReleaseLane: "release_readiness_matrix",
  productReleaseMode: "release_readiness_or_governance_matrix",

  // ── Publication & Lifecycle ──────────────────────────────────────────────
  publicationLifecycle: "market_intelligence_lifecycle",
  gmiEditionCurrentState: "market_intelligence_lifecycle",
  gmiEditionCommercialStatus: "gmi_edition_registry",
  gmiEditionCatalogEntry: "CATALOG_via_gmi_edition_factory",

  // ── Content & Routes ─────────────────────────────────────────────────────
  contentRouteResolution: "public_content_resolver",
  contentIndexing: "contentlayer_generated_indexes",
  blogRouteResolution: "blog_catch_all_route",
  publicContentVisibility: "contentlayer_document_fields",

  // ── Narrative & Claims ───────────────────────────────────────────────────
  publicNarrativeClaims: "narrative_claim_rules_and_product_authority",
  productClaimAccuracy: "ProductAuthorityContract_allowed_claims",

  // ── Build & Deployment ───────────────────────────────────────────────────
  deploymentReadiness: "build_and_verification_checks",
  environmentVariableValidity: "env_guards_and_next_config",
  buildOutputIntegrity: "next_build_and_contentlayer",

  // ── Evidence & Memory ────────────────────────────────────────────────────
  evidencePackageValidity: "evidence_package_registry",
  decisionMemoryContinuity: "decision_memory_service",
};

/**
 * Human-readable descriptions of each source of truth.
 */
export const SOURCE_OF_TRUTH_DESCRIPTIONS: Record<string, string> = {
  commercial_action_resolver: "lib/commercial/commercial-action-resolver.ts — the single authority for checkout gating",
  governed_billing_api: "pages/api/billing/checkout.ts — server-side checkout gate that enforces the resolver",
  CATALOG: "lib/commercial/catalog.ts — canonical commercial product metadata (Stripe IDs, prices, statuses)",
  ProductAuthorityContract: "data/ProductAuthorityContract.json — 43 products with authority states and claim boundaries",
  product_release_readiness_matrix: "reports/product-release-readiness-matrix.json — release readiness per product",
  product_release_governance_matrix: "reports/product-release-governance-matrix.json — governance rules per product",
  market_intelligence_lifecycle: "lib/intelligence/market-intelligence-lifecycle.ts — static lifecycle records (PUBLICATION TRUTH)",
  gmi_edition_registry: "lib/commercial/gmi/gmi-edition-registry.ts — commercial metadata for GMI editions",
  CATALOG_via_gmi_edition_factory: "lib/commercial/gmi/gmi-edition-factory.ts — derives CatalogProduct from registry entries",
  public_content_resolver: "lib/content/public-content-resolver.ts — resolves content documents to public URLs",
  contentlayer_generated_indexes: ".contentlayer/generated/<Type>/_index.json — Contentlayer build output",
  blog_catch_all_route: "pages/blog/[...slug].tsx — catch-all blog route with getStaticPaths/getStaticProps",
  contentlayer_document_fields: "fields on contentlayer documents (draft, published, requiresAuthSafe, accessTierSafe)",
  narrative_claim_rules_and_product_authority: "ProductAuthorityContract + narrative copy rules — public claims must not exceed governance evidence",
  ProductAuthorityContract_allowed_claims: "allowedClaims/forbiddenClaims fields on ProductAuthorityContract entries",
  build_and_verification_checks: "TypeScript, route checks, product checks, content checks, build result, environment guards",
  env_guards_and_next_config: "next.config.mjs NEXTAUTH_URL guard + .env file presence",
  next_build_and_contentlayer: "next build output + Contentlayer build status + route generation counts",
  evidence_package_registry: "reports/evidence-package-registry-matrix.json — evidence package validation",
  decision_memory_service: "lib/kernel/decision-memory-service.ts — decision memory continuity",
};

/**
 * Get the authoritative source for a given question.
 * Returns the source identifier or "unknown" if not mapped.
 */
export function getAuthorityFor(question: string): string {
  return SOURCE_OF_TRUTH_MAP[question] ?? "unknown";
}

/**
 * Get a human-readable description of a source of truth.
 */
export function describeSource(source: string): string {
  return SOURCE_OF_TRUTH_DESCRIPTIONS[source] ?? source;
}
