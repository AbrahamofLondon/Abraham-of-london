/**
 * lib/living-intelligence/contradiction-detector.ts
 *
 * Detects contradictions across all domains of the Abraham of London estate.
 *
 * Each detector is a pure function that takes the estate snapshot and returns
 * an array of Contradiction objects. Detectors are organised by domain pair.
 *
 * Source-of-truth hierarchy (non-negotiable):
 *   1. Publication truth:   market-intelligence-lifecycle.ts
 *   2. Runtime edition:     gmi-edition-resolver.ts (DB-backed)
 *   3. Commercial metadata: gmi-edition-registry.ts, CATALOG, product-code maps
 *   4. Governance permission: ProductAuthorityContract, release matrices, resolver
 */

import type {
  EstateSnapshot,
  Contradiction,
  ContradictionSeverity,
  ProductSnapshot,
  GmiEditionSnapshot,
} from "./estate-state-contract";
import { SOURCE_OF_TRUTH_MAP, describeSource } from "./source-of-truth-map";

let _contradictionCounter = 0;
function nextId(prefix: string): string {
  _contradictionCounter++;
  return `${prefix}-${String(_contradictionCounter).padStart(3, "0")}`;
}

function c(
  severity: ContradictionSeverity,
  title: string,
  description: string,
  domains: string[],
  authoritativeSource: string,
  isFailure: boolean,
  requiresOwnerDecision: boolean,
  recommendation: string,
): Contradiction {
  return {
    id: nextId(severity.substring(0, 3)),
    severity,
    title,
    description,
    domains,
    authoritativeSource,
    isFailure,
    requiresOwnerDecision,
    ownerAcknowledged: false,
    recommendation,
  };
}

// ─── 1. GMI Registry vs Lifecycle Contradictions ─────────────────────────────

function detectGmiRegistryLifecycleConflicts(snapshot: EstateSnapshot): Contradiction[] {
  const results: Contradiction[] = [];

  for (const edition of snapshot.gmiEditions) {
    // Registry says current but lifecycle says DRAFT
    if (edition.registryCurrent && edition.lifecycleState === "DRAFT") {
      results.push(c(
        "publication_lifecycle_conflict",
        `GMI ${edition.editionId}: registry marks current but lifecycle says DRAFT`,
        `Edition ${edition.editionId} is marked as current: true in gmi-edition-registry.ts ` +
          `(status: ${edition.registryStatus}) but market-intelligence-lifecycle.ts says ` +
          `lifecycleState: DRAFT, publicVisible: ${edition.lifecyclePublicVisible}, ` +
          `purchasable: ${edition.lifecyclePurchasable}. ` +
          `The lifecycle is the publication authority — a DRAFT edition must not be treated as current.`,
        ["gmi_edition_registry", "market_intelligence_lifecycle"],
        describeSource("market_intelligence_lifecycle"),
        true,
        true,
        "Update lifecycle state to match publication reality, or update registry current flag to match lifecycle truth.",
      ));
    }

    // Registry says archived but lifecycle says ACTIVE_UNTIL_SUPERSEDED
    if (edition.registryStatus === "archived" && edition.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED") {
      results.push(c(
        "publication_lifecycle_conflict",
        `GMI ${edition.editionId}: registry says archived but lifecycle says active`,
        `Edition ${edition.editionId} has registry status: archived but lifecycle says ` +
          `ACTIVE_UNTIL_SUPERSEDED (publicVisible: ${edition.lifecyclePublicVisible}, ` +
          `purchasable: ${edition.lifecyclePurchasable}). ` +
          `The lifecycle is the publication authority — an archived registry status contradicts ` +
          `an active lifecycle state.`,
        ["gmi_edition_registry", "market_intelligence_lifecycle"],
        describeSource("market_intelligence_lifecycle"),
        true,
        true,
        "Align lifecycle state with registry or vice versa. If the edition is still the current published issue, lifecycle must not say ACTIVE_UNTIL_SUPERSEDED without a superseding edition.",
      ));
    }

    // Registry status and lifecycle state are fundamentally misaligned
    const registryIsPublished = edition.registryStatus === "active" || edition.registryStatus === "manual_billing";
    const lifecycleIsDraft = edition.lifecycleState === "DRAFT";
    if (registryIsPublished && lifecycleIsDraft) {
      results.push(c(
        "source_of_truth_conflict",
        `GMI ${edition.editionId}: registry says published but lifecycle says draft`,
        `Edition ${edition.editionId} has registry status: ${edition.registryStatus} ` +
          `(commercial: ${edition.commercialStatus}) but lifecycle says DRAFT. ` +
          `The lifecycle is the publication authority — a draft edition must not have a published ` +
          `commercial status in the registry.`,
        ["gmi_edition_registry", "market_intelligence_lifecycle", "CATALOG"],
        describeSource("market_intelligence_lifecycle"),
        true,
        true,
        "Either advance the lifecycle state to reflect actual publication, or revert the registry status to draft.",
      ));
    }
  }

  return results;
}

// ─── 2. ProductAuthorityContract vs GMI Registry ─────────────────────────────

function detectProductAuthorityGmiConflicts(snapshot: EstateSnapshot): Contradiction[] {
  const results: Contradiction[] = [];

  for (const edition of snapshot.gmiEditions) {
    if (!edition.authorityState) continue;

    // If registry treats edition as current/published but authority says insufficient_information
    const registryIsPublished = edition.registryStatus === "active" || edition.registryStatus === "manual_billing";
    const authorityBlocks = edition.authorityState === "insufficient_information_requires_review";

    if (registryIsPublished && authorityBlocks) {
      results.push(c(
        "governance_contradiction",
        `GMI ${edition.editionId}: registry treats as published but ProductAuthorityContract says insufficient information`,
        `Edition ${edition.editionId} (productCode: ${edition.productCode}) has ` +
          `ProductAuthorityContract state: "${edition.authorityState}" which requires scope definition, ` +
          `but the GMI edition registry treats it as ${edition.registryStatus} (current: ${edition.registryCurrent}). ` +
          `The ProductAuthorityContract governs product authority — an insufficient-information product ` +
          `should not be treated as a published commercial edition.`,
        ["ProductAuthorityContract", "gmi_edition_registry"],
        describeSource("ProductAuthorityContract"),
        true,
        true,
        "Update ProductAuthorityContract state to reflect the edition's actual publication status, or align registry to match the contract.",
      ));
    }
  }

  return results;
}

// ─── 3. Blocked Products with Stripe IDs ─────────────────────────────────────

function detectBlockedProductsWithStripe(snapshot: EstateSnapshot): Contradiction[] {
  const results: Contradiction[] = [];

  for (const [code, product] of Object.entries(snapshot.products)) {
    const hasStripe = product.hasStripeProductId || product.hasStripePriceId;
    if (!hasStripe) continue;

    const isBlocked = product.readinessStatus === "blocked" ||
      product.releaseMode === "blocked" ||
      (product.releaseLane && product.releaseLane.startsWith("blocked"));

    if (isBlocked) {
      if (product.resolverAction === "checkout") {
        // FAILURE: blocked product resolving to checkout
        results.push(c(
          "commercial_safety_blocker",
          `${code}: blocked by governance but resolver grants checkout`,
          `Product ${code} has readinessStatus: ${product.readinessStatus}, ` +
            `releaseMode: ${product.releaseMode} but resolver returns "${product.resolverAction}" ` +
            `(purchasable: ${product.resolverPurchasable}). Stripe IDs present. ` +
            `This is a commercial safety blocker — a blocked product must never resolve to checkout.`,
          ["product_release_readiness_matrix", "commercial_action_resolver", "CATALOG"],
          describeSource("commercial_action_resolver"),
          true,
          true,
          "Fix resolver rule order or governance matrix to ensure blocked products never reach checkout state.",
        ));
      } else {
        // Governed tension: blocked product has Stripe IDs but resolver correctly blocks
        results.push(c(
          "governed_tension",
          `${code}: blocked but has Stripe metadata (resolver correctly blocks)`,
          `Product ${code} has readinessStatus: ${product.readinessStatus}, ` +
            `releaseMode: ${product.releaseMode} and carries Stripe metadata ` +
            `(stripeProductId: ${product.hasStripeProductId}, stripePriceId: ${product.hasStripePriceId}) ` +
            `but resolver correctly returns "${product.resolverAction}" (purchasable: false). ` +
            `This is a governed tension — Stripe IDs exist for future activation but resolver prevents checkout.`,
          ["product_release_readiness_matrix", "commercial_action_resolver", "CATALOG"],
          describeSource("commercial_action_resolver"),
          false,
          false,
          "No action required if Stripe IDs are intentionally retained for future unblocking. Remove Stripe IDs if no unblocking is planned.",
        ));
      }
    }
  }

  return results;
}

// ─── 4. Inactive Products with Stripe IDs ────────────────────────────────────

function detectInactiveProductsWithStripe(snapshot: EstateSnapshot): Contradiction[] {
  const results: Contradiction[] = [];

  for (const [code, product] of Object.entries(snapshot.products)) {
    if (!product.active && (product.hasStripeProductId || product.hasStripePriceId)) {
      if (product.resolverAction === "checkout") {
        results.push(c(
          "commercial_safety_blocker",
          `${code}: inactive but resolver grants checkout`,
          `Product ${code} is inactive (active: false) but has Stripe metadata and resolver ` +
            `returns "${product.resolverAction}" (purchasable: ${product.resolverPurchasable}). ` +
            `Inactive products must never resolve to checkout.`,
          ["CATALOG", "commercial_action_resolver"],
          describeSource("commercial_action_resolver"),
          true,
          true,
          "Fix resolver or catalog to ensure inactive products are non-purchasable.",
        ));
      } else {
        results.push(c(
          "informational_note",
          `${code}: inactive with Stripe metadata (resolver correctly blocks)`,
          `Product ${code} is inactive but retains Stripe metadata ` +
            `(stripeProductId: ${product.hasStripeProductId}, stripePriceId: ${product.hasStripePriceId}). ` +
            `Resolver correctly returns "${product.resolverAction}". Consider removing Stripe IDs ` +
            `if reactivation is not planned.`,
          ["CATALOG"],
          describeSource("CATALOG"),
          false,
          false,
          "Consider removing Stripe IDs from inactive products, or retain if reactivation is planned.",
        ));
      }
    }
  }

  return results;
}

// ─── 5. Release-Ready Products Missing Storefront Path ───────────────────────

function detectReleaseReadyMissingStorefront(snapshot: EstateSnapshot): Contradiction[] {
  const results: Contradiction[] = [];

  for (const [code, product] of Object.entries(snapshot.products)) {
    if (product.releaseReadyNow && product.resolverAction !== "checkout" && product.resolverAction !== "view_free_surface") {
      results.push(c(
        "storefront_gap",
        `${code}: release-ready but resolver returns "${product.resolverAction}"`,
        `Product ${code} has releaseReadyNow: true but the commercial action resolver returns ` +
          `"${product.resolverAction}" (purchasable: ${product.resolverPurchasable}). ` +
          `A release-ready product should have a storefront path that resolves to checkout or free access.`,
        ["product_release_readiness_matrix", "commercial_action_resolver"],
        describeSource("commercial_action_resolver"),
        false,
        false,
        "Check if the product needs a storefront route, Stripe metadata, or governance clearance to become purchasable.",
      ));
    }
  }

  return results;
}

// ─── 6. Checkout-Safe Products Missing Stripe Metadata ───────────────────────

function detectCheckoutSafeMissingStripe(snapshot: EstateSnapshot): Contradiction[] {
  const results: Contradiction[] = [];

  for (const [code, product] of Object.entries(snapshot.products)) {
    if (product.checkoutSafe === true && product.commercialStatus === "paid" && product.requiresCheckout && !product.hasStripePriceId) {
      results.push(c(
        "storefront_gap",
        `${code}: checkout-safe but missing Stripe metadata`,
        `Product ${code} has checkoutSafe: true, commercialStatus: paid, requiresCheckout: true ` +
          `but no stripePriceId. The resolver returns "${product.resolverAction}". ` +
          `A checkout-safe paid product needs valid Stripe metadata to enable checkout.`,
        ["CATALOG", "product_release_readiness_matrix"],
        describeSource("CATALOG"),
        false,
        false,
        "Add Stripe price ID to catalog entry, or change commercialStatus to manual_billing if self-serve checkout is not intended.",
      ));
    }
  }

  return results;
}

// ─── 7. Internal-Only Products Exposed Publicly ──────────────────────────────

function detectInternalOnlyPublicExposure(snapshot: EstateSnapshot): Contradiction[] {
  const results: Contradiction[] = [];

  for (const [code, product] of Object.entries(snapshot.products)) {
    if (product.releaseMode === "internal_only" && product.resolverAction === "checkout") {
      results.push(c(
        "commercial_safety_blocker",
        `${code}: internal_only but resolver grants checkout`,
        `Product ${code} has releaseMode: internal_only but resolver returns "checkout" ` +
          `(purchasable: ${product.resolverPurchasable}). Internal-only products must never ` +
          `resolve to public checkout.`,
        ["product_release_readiness_matrix", "commercial_action_resolver"],
        describeSource("commercial_action_resolver"),
        true,
        true,
        "Fix resolver to block internal_only products from reaching checkout state.",
      ));
    }
  }

  return results;
}

// ─── 8. Content Family Zero Index While Source Exists ────────────────────────

function detectContentFamilyZeroIndex(snapshot: EstateSnapshot): Contradiction[] {
  const results: Contradiction[] = [];

  for (const family of snapshot.contentFamilies) {
    if (family.sourceFileCount > 0 && family.indexedCount === 0) {
      results.push(c(
        "content_route_failure",
        `${family.family}: ${family.sourceFileCount} source files but Contentlayer indexed 0`,
        `Content family "${family.family}" has ${family.sourceFileCount} source files in ` +
          `content/${family.family}/ but Contentlayer generated indexes show 0 documents. ` +
          `This means no routes will be generated for this family.`,
        ["contentlayer_generated_indexes", "content_source_files"],
        describeSource("contentlayer_generated_indexes"),
        true,
        false,
        "Run Contentlayer build and check for schema/parsing errors in the content files.",
      ));
    }

    if (family.sourceFileCount > 0 && family.publicIndexedCount === 0 && family.indexedCount > 0) {
      results.push(c(
        "content_route_failure",
        `${family.family}: ${family.indexedCount} indexed but 0 public (all draft/restricted)`,
        `Content family "${family.family}" has ${family.sourceFileCount} source files, ` +
          `${family.indexedCount} indexed, but 0 are publicly visible. All documents may be ` +
          `draft, future-dated, or restricted.`,
        ["contentlayer_generated_indexes"],
        describeSource("contentlayer_generated_indexes"),
        false,
        false,
        "Verify this is intentional (e.g., all content is draft or restricted).",
      ));
    }
  }

  return results;
}

// ─── 9. Build-Critical Env Var Issues ────────────────────────────────────────

function detectBuildEnvIssues(snapshot: EstateSnapshot): Contradiction[] {
  const results: Contradiction[] = [];

  for (const [name, status] of Object.entries(snapshot.build.envVars)) {
    if (!status.present) {
      results.push(c(
        "fatal_build_blocker",
        `Build-critical env var "${name}" is missing or empty`,
        `Environment variable ${name} is not set or is empty. This variable is required ` +
          `for build/deployment.`,
        ["env_guards_and_next_config"],
        describeSource("env_guards_and_next_config"),
        true,
        false,
        `Set ${name} in .env or deployment environment.`,
      ));
    } else if (status.malformed) {
      results.push(c(
        "fatal_build_blocker",
        `Build-critical env var "${name}" is malformed`,
        `Environment variable ${name} is set but appears malformed (value: "${process.env[name]?.substring(0, 20)}...").`,
        ["env_guards_and_next_config"],
        describeSource("env_guards_and_next_config"),
        true,
        false,
        `Fix the value of ${name} to be a valid URL/format.`,
      ));
    }
  }

  // NEXTAUTH_URL specific check
  if (!snapshot.build.nextauthUrlSet) {
    results.push(c(
      "fatal_build_blocker",
      "NEXTAUTH_URL is not set — next-auth will fail at module load",
      `NEXTAUTH_URL is not set. next-auth/react calls parseUrl(process.env.NEXTAUTH_URL) ` +
        `at module level. An empty string causes TypeError: Invalid URL in page-data workers. ` +
        `next.config.mjs has a guard but the env var should be set explicitly.`,
      ["env_guards_and_next_config"],
      describeSource("env_guards_and_next_config"),
      true,
      false,
      "Set NEXTAUTH_URL in .env or deployment environment.",
    ));
  }

  return results;
}

// ─── 10. Contentlayer Build Status ───────────────────────────────────────────

function detectContentlayerBuildStatus(snapshot: EstateSnapshot): Contradiction[] {
  const results: Contradiction[] = [];

  if (!snapshot.build.contentlayerBuilt) {
    results.push(c(
      "fatal_build_blocker",
      "Contentlayer has not been built — no content indexes exist",
      `.contentlayer/generated directory does not exist. Contentlayer must be built ` +
        `before any content routes can be generated. Run: pnpm contentlayer2 build`,
      ["contentlayer_generated_indexes", "next_build_and_contentlayer"],
      describeSource("next_build_and_contentlayer"),
      true,
      false,
      "Run contentlayer build before attempting to verify content routes.",
    ));
  }

  return results;
}

// ─── 11. Governance-Only or Catalog-Only Codes ───────────────────────────────

function detectGovernanceCatalogMismatch(snapshot: EstateSnapshot): Contradiction[] {
  const results: Contradiction[] = [];

  if (snapshot.governanceOnlyCodes.length > 0) {
    results.push(c(
      "informational_note",
      `${snapshot.governanceOnlyCodes.length} product(s) in governance matrices but not in CATALOG`,
      `Product codes: ${snapshot.governanceOnlyCodes.join(", ")}. These products have ` +
        `release readiness and governance entries but no CATALOG entry. They cannot be ` +
        `purchased or surfaced through the commercial storefront.`,
      ["product_release_readiness_matrix", "product_release_governance_matrix", "CATALOG"],
      describeSource("CATALOG"),
      false,
      false,
      "Add CATALOG entries if these products should be commercially available, or remove from governance matrices if retired.",
    ));
  }

  if (snapshot.catalogOnlyCodes.length > 0) {
    results.push(c(
      "informational_note",
      `${snapshot.catalogOnlyCodes.length} product(s) in CATALOG but not in governance matrices`,
      `Product codes: ${snapshot.catalogOnlyCodes.join(", ")}. These products have CATALOG ` +
        `entries but no governance matrix entries. The resolver will use default governance ` +
        `(known: false) which may not reflect intended release state.`,
      ["CATALOG", "product_release_readiness_matrix", "product_release_governance_matrix"],
      describeSource("product_release_readiness_matrix"),
      false,
      false,
      "Add governance matrix entries for these products, or confirm they are intentionally ungoverned.",
    ));
  }

  return results;
}

// ─── 12. Product Authority State vs Commercial Status ────────────────────────

function detectAuthorityCommercialMismatch(snapshot: EstateSnapshot): Contradiction[] {
  const results: Contradiction[] = [];

  for (const [code, product] of Object.entries(snapshot.products)) {
    if (!product.authorityState || !product.commercialStatus) continue;

    // internal_only authority + paid commercial status = tension
    if (product.authorityState === "internal_only" && product.commercialStatus === "paid") {
      results.push(c(
        "governed_tension",
        `${code}: authority is internal_only but commercial status is paid`,
        `Product ${code} has ProductAuthorityContract state: internal_only but CATALOG ` +
          `commercialStatus: paid. An internal-only product should not have a paid commercial status.`,
        ["ProductAuthorityContract", "CATALOG"],
        describeSource("ProductAuthorityContract"),
        false,
        true,
        "Either advance the authority state or change the commercial status to internal_only.",
      ));
    }

    // blocked_until_claim_evidenced + checkout = unsafe
    if (product.authorityState === "blocked_until_claim_evidenced" && product.resolverAction === "checkout") {
      results.push(c(
        "commercial_safety_blocker",
        `${code}: authority is blocked_until_claim_evidenced but resolver grants checkout`,
        `Product ${code} has ProductAuthorityContract state: blocked_until_claim_evidenced ` +
          `but resolver returns "checkout" (purchasable: ${product.resolverPurchasable}). ` +
          `A product blocked until evidence is provided must not be purchasable.`,
        ["ProductAuthorityContract", "commercial_action_resolver"],
        describeSource("ProductAuthorityContract"),
        true,
        true,
        "Fix resolver or governance matrix to block checkout for evidence-blocked products.",
      ));
    }
  }

  return results;
}

// ─── Master detector ─────────────────────────────────────────────────────────

export function detectAllContradictions(snapshot: EstateSnapshot): Contradiction[] {
  _contradictionCounter = 0;

  const detectors = [
    detectGmiRegistryLifecycleConflicts,
    detectProductAuthorityGmiConflicts,
    detectBlockedProductsWithStripe,
    detectInactiveProductsWithStripe,
    detectReleaseReadyMissingStorefront,
    detectCheckoutSafeMissingStripe,
    detectInternalOnlyPublicExposure,
    detectContentFamilyZeroIndex,
    detectBuildEnvIssues,
    detectContentlayerBuildStatus,
    detectGovernanceCatalogMismatch,
    detectAuthorityCommercialMismatch,
  ];

  const all: Contradiction[] = [];
  for (const detector of detectors) {
    try {
      const results = detector(snapshot);
      all.push(...results);
    } catch (err) {
      all.push(c(
        "informational_note",
        `Detector "${detector.name}" threw an error`,
        `Error: ${err instanceof Error ? err.message : String(err)}`,
        ["internal"],
        "living_intelligence_engine",
        false,
        false,
        "Review detector implementation.",
      ));
    }
  }

  return all;
}
