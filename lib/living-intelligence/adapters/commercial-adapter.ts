/**
 * lib/living-intelligence/adapters/commercial-adapter.ts
 *
 * Commercial domain adapter — Phase 5A.
 *
 * Translates catalog + governance + resolver state into LivingStateObjects for
 * every product with a commercial surface. This adapter does NOT assume checkout
 * permission from Stripe metadata, does NOT infer delivery from payment, and
 * does NOT hardcode product-specific names — it derives everything from the
 * canonical commercial sources:
 *
 *   lib/commercial/catalog.ts              (product definitions)
 *   lib/commercial/commercial-governance.ts (governance state per product)
 *   lib/commercial/commercial-action-resolver.ts (resolved action)
 *   reports/product-release-readiness-matrix.json
 *   reports/product-release-governance-matrix.json
 *   data/ProductAuthorityContract.json
 *
 * Every object answers:
 *   1. What was purchased/requested?
 *   2. Is it checkout-safe, manual-fulfilment, blocked, contracted, or free?
 *   3. Is there a fulfilment path?
 *   4. Is an artefact required?
 *   5. What is blocked?
 *   6. Who must act?
 *   7. What is the next governed action?
 *
 * The system REFUSES to infer:
 *   - payment from product metadata
 *   - delivery from order existence
 *   - fulfilment from checkout success
 *   - approval from draft status
 *   - artefact generation from artefact listing
 *   - verification from link presence
 *   - consent from silence
 */

import { CATALOG } from "@/lib/commercial/catalog";
import type { CatalogProduct, CommercialStatus } from "@/lib/commercial/catalog";
import { getGovernanceState } from "@/lib/commercial/commercial-governance";
import { resolveCommercialAction } from "@/lib/commercial/commercial-action-resolver";
import type { CommercialActionState } from "@/lib/commercial/commercial-action-resolver";

import {
  readString,
  type LivingDomainAdapter,
  type LivingDomainAdapterInput,
} from "@/lib/living-intelligence/living-domain-adapter-contract";
import type {
  LivingStateArtifactStatus,
  LivingStateBlockerCode,
  LivingStateConsentStatus,
  LivingStateEvidenceStatus,
  LivingStateObject,
  LivingStateStage,
} from "@/lib/living-intelligence/living-state-object-contract";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map a product's commercial status + resolver action to a living stage.
 * This is NOT checkout permission — it is the operational stage of the
 * commercial surface itself.
 */
function commercialStatusToStage(
  product: CatalogProduct,
  actionState: CommercialActionState,
): LivingStateStage {
  // Blocked / unavailable products are in a blocked stage.
  if (
    actionState === "blocked" ||
    actionState === "unavailable" ||
    actionState === "archive_reference_only"
  ) {
    return "blocked";
  }

  // Free / view-only surfaces are at a free-access stage.
  if (actionState === "view_free_surface") {
    return "created";
  }

  // Manual fulfilment products require operator action.
  if (actionState === "manual_fulfilment" || actionState === "request_access") {
    return "awaiting_review";
  }

  // Contact-sales products are at intake stage.
  if (actionState === "contact_sales") {
    return "intake_started";
  }

  // Review-gated / evidence-gated products are awaiting evidence.
  if (actionState === "review_gated" || actionState === "evidence_gated") {
    return "awaiting_evidence";
  }

  // Checkout-cleared products are purchasable.
  if (actionState === "checkout") {
    return "paid";
  }

  return "created";
}

/**
 * Determine whether a product has a fulfilment expectation.
 * Manual-fulfilment, paid-checkout, and contracted products all require
 * some form of fulfilment. Free-access and internal-only do not.
 */
function requiresFulfilment(product: CatalogProduct): boolean {
  const cs = product.commercialStatus;
  return (
    cs === "paid" ||
    cs === "manual_billing" ||
    cs === "contracted" ||
    cs === "evidence_gated"
  );
}

/**
 * Determine whether an artefact is expected for this product.
 * Paid and manual-fulfilment products with a delivery format expect artefacts.
 */
function requiresArtifact(product: CatalogProduct): boolean {
  if (!requiresFulfilment(product)) return false;
  // Products with an explicit delivery format expect an artefact.
  if (product.deliveryFormat) return true;
  // Paid products that require checkout expect an artefact.
  if (product.commercialStatus === "paid" && product.requiresCheckout) return true;
  return false;
}

/**
 * Determine the artefact status from what we know without inspecting a DB.
 * We cannot infer artefact existence from product metadata — the best we can
 * do is report "missing" when the product expects one and we have no record.
 */
function deriveArtifactStatus(product: CatalogProduct): LivingStateArtifactStatus {
  if (!requiresArtifact(product)) return "not_required";
  // We have no DB record here — the adapter reports what the product expects.
  // The engine will flag missing_artifact if required but not present.
  return "missing";
}

/**
 * Derive evidence posture for a commercial surface.
 * A product with governance data has "weakly_indicated" evidence of its
 * commercial readiness. A product with no governance data is "unverified".
 */
function deriveEvidenceStatus(product: CatalogProduct): LivingStateEvidenceStatus {
  const governance = getGovernanceState(product.code);
  if (governance.known) return "weakly_indicated";
  return "unverified";
}

/**
 * Derive consent status. Commercial surfaces generally do not require
 * publication consent unless the product is published as a case study.
 */
function deriveConsentStatus(product: CatalogProduct): LivingStateConsentStatus {
  return "not_required";
}

/**
 * Build the list of things the system refuses to infer for this product.
 */
function buildCannotInfer(product: CatalogProduct): string[] {
  const cannot: string[] = [];
  cannot.push("Payment from product metadata — Stripe IDs are not payment.");
  cannot.push("Delivery from order existence — an order is not a delivered artefact.");
  cannot.push("Fulfilment from checkout success — checkout is not fulfilment.");
  cannot.push("Artefact generation from artefact listing — listing is not generation.");
  if (product.commercialStatus === "paid" && product.requiresCheckout) {
    cannot.push("Checkout permission from Stripe metadata — resolver decides checkout.");
  }
  return cannot;
}

/**
 * Build blocker codes that the adapter can determine without a DB.
 * The engine will add more via cross-cutting rules (missing_artifact,
 * paid_without_fulfilment, etc.).
 */
function deriveAdapterBlockers(
  product: CatalogProduct,
  actionState: CommercialActionState,
): { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] {
  const blockers: { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] = [];

  const governance = getGovernanceState(product.code);

  // Product has Stripe metadata but resolver denies checkout → governed tension.
  if (
    product.stripePriceId &&
    product.stripeProductId &&
    actionState !== "checkout" &&
    product.commercialStatus === "paid"
  ) {
    blockers.push({
      code: "checkout_permission_conflict",
      explanation: `Product "${product.code}" has Stripe metadata (priceId=${product.stripePriceId}) but the resolver denies checkout (action=${actionState}). Governance state overrides catalogue metadata.`,
      requiredAction: "Reconcile the governance state with the Stripe metadata — either clear the product for checkout or remove the Stripe references.",
    });
  }

  // Product route exists but commercial action is blocked.
  if (actionState === "blocked" && product.active) {
    blockers.push({
      code: "source_of_truth_conflict",
      explanation: `Product "${product.code}" is active in the catalogue but the resolver returns "blocked". The governance matrix has blocked this product from commercial surfaces.`,
      requiredAction: "Resolve the governance block or deactivate the product in the catalogue.",
    });
  }

  // Manual-fulfilment product with no operator fulfilment path.
  if (
    (actionState === "manual_fulfilment" || product.commercialStatus === "manual_billing") &&
    product.active
  ) {
    blockers.push({
      code: "missing_operator_action",
      explanation: `Product "${product.code}" requires manual fulfilment but no operator fulfilment route is defined for this product. An operator must manually process this request.`,
      requiredAction: "Define an operator fulfilment workflow for this manual-fulfilment product.",
    });
  }

  // Internal-only product exposed through a public purchase surface.
  if (
    governance.known &&
    governance.releaseMode === "internal_only" &&
    product.active &&
    product.commercialStatus !== "free_controlled"
  ) {
    blockers.push({
      code: "source_of_truth_conflict",
      explanation: `Product "${product.code}" is releaseMode=internal_only but is active in the catalogue. Internal-only products must not be exposed through public commercial surfaces.`,
      requiredAction: "Either deactivate the product in the catalogue or change its release mode.",
    });
  }

  // Free-access product incorrectly treated as checkout product.
  if (
    product.commercialStatus === "free_controlled" &&
    product.stripePriceId
  ) {
    blockers.push({
      code: "source_of_truth_conflict",
      explanation: `Product "${product.code}" is free_controlled but has Stripe metadata. Free products should not carry Stripe price IDs.`,
      requiredAction: "Remove Stripe metadata from the free product or change its commercial status to paid.",
    });
  }

  // Contracted product incorrectly treated as self-serve.
  if (
    product.commercialStatus === "contracted" &&
    (product.stripePriceId || product.requiresCheckout)
  ) {
    blockers.push({
      code: "checkout_permission_conflict",
      explanation: `Product "${product.code}" is contracted but has checkout-related metadata. Contracted products must not be self-serve purchasable.`,
      requiredAction: "Remove Stripe metadata and set requiresCheckout=false for this contracted product.",
    });
  }

  return blockers;
}

/**
 * Build the operator summary for a commercial object.
 */
function buildOperatorSummary(
  product: CatalogProduct,
  actionState: CommercialActionState,
): string {
  const governance = getGovernanceState(product.code);
  const parts: string[] = [
    `Product "${product.code}" (${product.displayName}) — commercial status: ${product.commercialStatus ?? "unknown"}, resolver action: ${actionState}.`,
  ];

  if (governance.known) {
    parts.push(`Governance: releaseMode=${governance.releaseMode ?? "unknown"}, checkoutAllowed=${governance.checkoutAllowed}, manualFulfilmentAllowed=${governance.manualFulfilmentAllowed}.`);
  } else {
    parts.push("No governance data found for this product.");
  }

  if (product.stripePriceId) {
    parts.push(`Has Stripe price ID (${product.stripePriceId}) but this is NOT checkout permission.`);
  }

  if (requiresFulfilment(product)) {
    parts.push("Fulfilment is required for this product.");
  }

  if (requiresArtifact(product)) {
    parts.push(`Artefact expected (delivery format: ${product.deliveryFormat ?? "unspecified"}).`);
  }

  return parts.join(" ");
}

/**
 * Build the user-visible summary. This is deliberately generic — we do not
 * expose internal governance state to end users.
 */
function buildUserSummary(
  product: CatalogProduct,
  actionState: CommercialActionState,
): string {
  if (actionState === "checkout") {
    return `${product.displayName} is available for purchase.`;
  }
  if (actionState === "view_free_surface") {
    return product.userPromise || `${product.displayName} is available to use.`;
  }
  if (actionState === "blocked" || actionState === "unavailable") {
    return `${product.displayName} is not currently available.`;
  }
  if (actionState === "manual_fulfilment" || actionState === "request_access") {
    return `${product.displayName} is available by request. Contact us to discuss access.`;
  }
  if (actionState === "contact_sales") {
    return `${product.displayName} is available for enterprise access. Contact our team.`;
  }
  return `${product.displayName} is listed on our platform.`;
}

/**
 * Build the list of source-of-truth files for this object.
 */
function buildSourceOfTruth(product: CatalogProduct): string[] {
  return [
    "lib/commercial/catalog.ts",
    "lib/commercial/commercial-governance.ts",
    "lib/commercial/commercial-action-resolver.ts",
    "reports/product-release-readiness-matrix.json",
    "reports/product-release-governance-matrix.json",
    "data/ProductAuthorityContract.json",
  ];
}

// ─── Map one product ──────────────────────────────────────────────────────────

function mapOne(
  product: CatalogProduct,
  input: LivingDomainAdapterInput,
): LivingStateObject {
  const governance = getGovernanceState(product.code);
  const action = resolveCommercialAction(product, governance);
  const stage = commercialStatusToStage(product, action.state);
  const adapterBlockers = deriveAdapterBlockers(product, action.state);

  const id = `commercial-${product.code}`;
  const title = `${product.displayName} — commercial surface`;

  return {
    id,
    domain: "commercial",
    subjectType: "checkout",
    sourceId: product.code,
    productCode: product.code,
    title,
    currentStage: stage,
    statusLabel: `${action.label} — ${action.state}`,
    userVisibleSummary: buildUserSummary(product, action.state),
    operatorSummary: buildOperatorSummary(product, action.state),
    evidence: {
      status: deriveEvidenceStatus(product),
      supportingEvidence: governance.known
        ? [`Governance data exists for ${product.code}`]
        : [],
      missingEvidence: governance.known
        ? []
        : [`No governance matrix entry for ${product.code}`],
      cannotInfer: buildCannotInfer(product),
    },
    consent: {
      required: false,
      status: deriveConsentStatus(product),
      supportingEvidence: [],
      missing: [],
    },
    artifact: {
      required: requiresArtifact(product),
      status: deriveArtifactStatus(product),
      artifactIds: [],
      artifactRoutes: action.href ? [action.href] : [],
      missing: requiresArtifact(product)
        ? [`Generated artefact for "${product.code}"`]
        : [],
    },
    publication: {
      relevant: false,
      allowed: false,
      reason: "A commercial surface is not a publication subject.",
      missing: [],
    },
    blockers: adapterBlockers.map((b) => ({
      code: b.code,
      label: b.code === "checkout_permission_conflict"
        ? "Checkout permission conflicts with governance"
        : b.code === "source_of_truth_conflict"
          ? "Sources of truth disagree"
          : b.code === "missing_operator_action"
            ? "An operator action is required but undefined"
            : "Commercial surface issue",
      severity: b.code === "checkout_permission_conflict"
        ? "governed_tension"
        : b.code === "missing_operator_action"
          ? "blocker"
          : "blocker",
      explanation: b.explanation,
      evidence: [
        `productCode=${product.code}`,
        `commercialStatus=${product.commercialStatus ?? "unknown"}`,
        `resolverAction=${action.state}`,
        ...(product.stripePriceId ? [`stripePriceId=${product.stripePriceId}`] : []),
      ],
      affectedItems: [product.code],
      requiredAction: b.requiredAction,
      actionOwner: "admin",
      canAutomate: false,
    })),
    nextActions: [
      {
        label: action.label,
        description: action.reason
          ? `Resolver action: ${action.state} (${action.reason})`
          : `Resolver action: ${action.state}`,
        owner: action.state === "checkout" ? "user" : "operator",
        actionType: action.state === "checkout"
          ? "open_case"
          : action.state === "blocked" || action.state === "unavailable"
            ? "do_not_proceed"
            : "show_operator_warning",
        route: action.href || undefined,
        safeToAutomate: false,
        requiredEvidence: [],
      },
    ],
    memory: {
      recurrenceCount: 1,
      currentStage: stage,
      regressionDetected: false,
      resolvedSinceLastRun: false,
    },
    safeToShowUser: action.state === "checkout" || action.state === "view_free_surface",
    safeToShowOperator: true,
    safeToAutomate: false,
    sourceOfTruth: buildSourceOfTruth(product),
    raw: {
      productCode: product.code,
      commercialStatus: product.commercialStatus ?? null,
      resolverAction: action.state,
      checkoutAllowed: governance.checkoutAllowed,
      releaseMode: governance.releaseMode ?? null,
      hasStripePrice: Boolean(product.stripePriceId),
      requiresFulfilment: requiresFulfilment(product),
      requiresArtifact: requiresArtifact(product),
    },
  };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export const commercialAdapter: LivingDomainAdapter = {
  domain: "commercial",
  label: "Commercial",
  detect(records) {
    // The commercial adapter generates its own records from the catalog.
    // This detect is used when records are passed in — for standalone operation
    // we always return true so the runner includes it.
    return true;
  },
  map(input: LivingDomainAdapterInput) {
    // Generate one LivingStateObject per active product in the catalog.
    const products = Object.values(CATALOG).filter(
      (p) => p.active || p.commercialStatus === "paid" || p.commercialStatus === "manual_billing",
    );

    return products.map((product) => mapOne(product, input));
  },
};

export default commercialAdapter;
