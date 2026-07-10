/**
 * lib/commercial/commercial-access-policy.ts
 *
 * Commercial Access Policy — determines how each product is acquired and what
 * prerequisite (if any) must pass before checkout.
 *
 * ARCHITECTURE (reconciled 2026-07-10):
 * Policies are DERIVED from the catalog (lib/commercial/catalog.ts), the single
 * source of truth for the full sellable estate, plus GMI edition state
 * (lib/commercial/gmi/gmi-edition-registry.ts). A small set of EXPLICIT_OVERRIDES
 * carries governed products that need special prerequisites (executive reporting
 * admission, boardroom handoff). This guarantees 100% coverage of every sellable
 * product without a divergent hand-maintained list — no product 404s merely
 * because it lacks a bespoke policy entry.
 *
 * Doctrine: a paid self-serve product carries NO prerequisite unless an explicit
 * governed policy (or an evidence_gated catalog status) says otherwise. The
 * universal Intelligence-Spine gate is removed.
 */

import { CATALOG, getProduct, type CatalogProduct, type CommercialStatus } from "./catalog";
import { GMI_EDITION_REGISTRY } from "./gmi/gmi-edition-registry";

export type AcquisitionMode =
  | "FREE"
  | "SELF_SERVE_CHECKOUT"
  | "EVIDENCE_GATED_CHECKOUT"
  | "ADMISSION_GATED_CHECKOUT"
  | "MANUAL_BILLING"
  | "CONTRACT"
  | "ARCHIVE_ONLY";

export type PrerequisitePolicy =
  | "NONE"
  | "RELEASE_RECEIPT"
  | "INTELLIGENCE_SPINE"
  | "EXECUTIVE_REPORTING_ADMISSION"
  | "BOARDROOM_HANDOFF"
  | "CUSTOM";

export type FulfilmentMode =
  | "INTERACTIVE_ACCESS"
  | "PDF_DOWNLOAD"
  | "DOSSIER_DELIVERY"
  | "SESSION_BOOKING"
  | "SUBSCRIPTION"
  | "MANUAL";

export interface CommercialAccessPolicy {
  productCode: string;
  familyCode: string;
  acquisitionMode: AcquisitionMode;
  prerequisitePolicy: PrerequisitePolicy;
  releaseProofRequired: boolean;
  paymentRequired: boolean;
  entitlementRequired: boolean;
  publicSurfaceAllowed: boolean;
  fulfilmentMode: FulfilmentMode;
  successPath: string;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  customEvaluatorName?: string;
  /** How this policy was resolved — for audit/observability. */
  source: "GMI_EDITION" | "EXPLICIT_OVERRIDE" | "CATALOG_DERIVED";
}

/**
 * Explicit governed overrides. Only products whose prerequisite cannot be
 * derived from catalog status belong here. Keyed by catalog product code.
 */
type OverrideSpec = Partial<Omit<CommercialAccessPolicy, "productCode" | "source">> & {
  prerequisitePolicy: PrerequisitePolicy;
};

const EXPLICIT_OVERRIDES: Record<string, OverrideSpec> = {
  executive_reporting: {
    acquisitionMode: "ADMISSION_GATED_CHECKOUT",
    prerequisitePolicy: "EXECUTIVE_REPORTING_ADMISSION",
    customEvaluatorName: "evaluateExecutiveReportingAdmission",
    fulfilmentMode: "PDF_DOWNLOAD",
  },
  executive_reporting_priority: {
    acquisitionMode: "ADMISSION_GATED_CHECKOUT",
    prerequisitePolicy: "EXECUTIVE_REPORTING_ADMISSION",
    customEvaluatorName: "evaluateExecutiveReportingAdmission",
    fulfilmentMode: "PDF_DOWNLOAD",
  },
  boardroom_brief: {
    acquisitionMode: "SELF_SERVE_CHECKOUT",
    prerequisitePolicy: "BOARDROOM_HANDOFF",
    customEvaluatorName: "evaluateBoardroomHandoff",
    fulfilmentMode: "PDF_DOWNLOAD",
  },
};

/** Map catalog commercialStatus → acquisition mode + default prerequisite. */
function acquisitionFromStatus(
  status: CommercialStatus | undefined,
  accessType: string,
): { mode: AcquisitionMode; prerequisite: PrerequisitePolicy; paymentRequired: boolean; publicSurfaceAllowed: boolean } {
  switch (status) {
    case "free_controlled":
      return { mode: "FREE", prerequisite: "NONE", paymentRequired: false, publicSurfaceAllowed: true };
    case "paid":
      return { mode: "SELF_SERVE_CHECKOUT", prerequisite: "NONE", paymentRequired: true, publicSurfaceAllowed: true };
    case "evidence_gated":
      // The ONLY place a diagnostic/evidence prerequisite legitimately survives,
      // because the catalog itself marks the product evidence_gated.
      return { mode: "EVIDENCE_GATED_CHECKOUT", prerequisite: "INTELLIGENCE_SPINE", paymentRequired: true, publicSurfaceAllowed: true };
    case "contracted":
      return { mode: "CONTRACT", prerequisite: "NONE", paymentRequired: false, publicSurfaceAllowed: true };
    case "manual_billing":
      return { mode: "MANUAL_BILLING", prerequisite: "NONE", paymentRequired: false, publicSurfaceAllowed: false };
    case "dormant":
    case "inactive":
    case "retired":
    case "internal_only":
      return { mode: "ARCHIVE_ONLY", prerequisite: "NONE", paymentRequired: false, publicSurfaceAllowed: false };
    default:
      return {
        mode: accessType === "free" ? "FREE" : "SELF_SERVE_CHECKOUT",
        prerequisite: "NONE",
        paymentRequired: accessType !== "free",
        publicSurfaceAllowed: true,
      };
  }
}

function fulfilmentFromAccessType(accessType: string): FulfilmentMode {
  if (accessType === "subscription") return "SUBSCRIPTION";
  return "INTERACTIVE_ACCESS";
}

const TERMINAL_STATUSES: ReadonlySet<CommercialStatus> = new Set([
  "dormant",
  "inactive",
  "retired",
  "internal_only",
]);

function deriveFromCatalog(product: CatalogProduct): CommercialAccessPolicy {
  const a = acquisitionFromStatus(product.commercialStatus, product.accessType);

  const base: CommercialAccessPolicy = {
    productCode: product.code,
    familyCode: (product as unknown as { category?: string }).category ?? "uncategorised",
    acquisitionMode: a.mode,
    prerequisitePolicy: a.prerequisite,
    releaseProofRequired: false,
    paymentRequired: a.paymentRequired,
    entitlementRequired: a.paymentRequired,
    publicSurfaceAllowed: a.publicSurfaceAllowed,
    fulfilmentMode: fulfilmentFromAccessType(product.accessType),
    successPath: product.successPath || "/dashboard",
    stripeProductId: product.stripeProductId,
    stripePriceId: product.stripePriceId,
    source: "CATALOG_DERIVED",
  };

  // ISSUE 1 — terminal commercial states DOMINATE explicit overrides. An inactive,
  // retired, dormant or internal-only product must remain ARCHIVE_ONLY regardless
  // of any override. Overrides may only refine still-live products.
  if (product.commercialStatus && TERMINAL_STATUSES.has(product.commercialStatus)) {
    return base;
  }

  const override = EXPLICIT_OVERRIDES[product.code];
  if (override) {
    return { ...base, ...override, productCode: product.code, source: "EXPLICIT_OVERRIDE" };
  }
  return base;
}

function deriveFromGmi(productCode: string): CommercialAccessPolicy | null {
  const entry = GMI_EDITION_REGISTRY.find((e) => e.productCode === productCode);
  if (!entry) return null;

  if (entry.status === "active" && entry.current) {
    return {
      productCode,
      familyCode: "gmi_quarterly",
      acquisitionMode: "SELF_SERVE_CHECKOUT",
      prerequisitePolicy: "RELEASE_RECEIPT",
      releaseProofRequired: true,
      paymentRequired: true,
      entitlementRequired: true,
      publicSurfaceAllowed: true,
      fulfilmentMode: "PDF_DOWNLOAD",
      successPath: `/intelligence/gmi/${entry.slug}`,
      stripeProductId: entry.stripeProductId ?? null,
      stripePriceId: entry.stripePriceId ?? null,
      source: "GMI_EDITION",
    };
  }

  if (entry.status === "manual_billing") {
    return {
      productCode,
      familyCode: "gmi_quarterly",
      acquisitionMode: "MANUAL_BILLING",
      prerequisitePolicy: "RELEASE_RECEIPT",
      releaseProofRequired: true,
      paymentRequired: false,
      entitlementRequired: true,
      publicSurfaceAllowed: true,
      fulfilmentMode: "DOSSIER_DELIVERY",
      successPath: `/intelligence/gmi/${entry.slug}`,
      source: "GMI_EDITION",
    };
  }

  // draft / archived / retired → no current checkout.
  return {
    productCode,
    familyCode: "gmi_quarterly",
    acquisitionMode: "ARCHIVE_ONLY",
    prerequisitePolicy: "NONE",
    releaseProofRequired: false,
    paymentRequired: false,
    entitlementRequired: false,
    publicSurfaceAllowed: false,
    fulfilmentMode: "DOSSIER_DELIVERY",
    successPath: `/intelligence/gmi/${entry.slug}`,
    source: "GMI_EDITION",
  };
}

/**
 * Resolve a product's commercial access policy.
 * Order: GMI edition registry → catalog (with explicit governed overrides).
 * Returns null only for genuinely unknown product codes.
 */
export function resolveCommercialAccessPolicy(productCode: string): CommercialAccessPolicy | null {
  const gmi = deriveFromGmi(productCode);
  if (gmi) return gmi;

  const product = getProduct(productCode);
  if (product) return deriveFromCatalog(product);

  return null;
}

/** Resolve a policy for every catalog + GMI product (audit/coverage helper). */
export function resolveAllPolicies(): CommercialAccessPolicy[] {
  const policies: CommercialAccessPolicy[] = [];
  for (const code of Object.keys(CATALOG)) {
    const p = resolveCommercialAccessPolicy(code);
    if (p) policies.push(p);
  }
  for (const entry of GMI_EDITION_REGISTRY) {
    const p = resolveCommercialAccessPolicy(entry.productCode);
    if (p) policies.push(p);
  }
  return policies;
}

/**
 * Validate that every catalog/GMI identity resolves a consistent policy.
 * Enforces (issue 7): terminal-state precedence, acquisition/payment consistency,
 * prerequisite requirements, and registry membership.
 */
export function validatePolicies(): Array<{ productCode: string; error: string }> {
  const errors: Array<{ productCode: string; error: string }> = [];
  const push = (productCode: string, error: string) => errors.push({ productCode, error });

  const catalogCodes = Object.keys(CATALOG);
  const codes = new Set<string>([...catalogCodes, ...GMI_EDITION_REGISTRY.map((e) => e.productCode)]);

  const SELF_SERVE = new Set(["FREE", "SELF_SERVE_CHECKOUT", "EVIDENCE_GATED_CHECKOUT", "ADMISSION_GATED_CHECKOUT"]);

  for (const code of codes) {
    const policy = resolveCommercialAccessPolicy(code);
    if (!policy) {
      push(code, "No policy resolved (coverage gap)");
      continue;
    }

    // (a) Terminal-state precedence: terminal catalog status ⇒ ARCHIVE_ONLY.
    const product = CATALOG[code];
    if (product?.commercialStatus && TERMINAL_STATUSES.has(product.commercialStatus)
        && policy.source !== "GMI_EDITION"
        && policy.acquisitionMode !== "ARCHIVE_ONLY") {
      push(code, `terminal status ${product.commercialStatus} must resolve ARCHIVE_ONLY, got ${policy.acquisitionMode}`);
    }

    // (b) Acquisition/payment consistency.
    if (policy.acquisitionMode === "FREE" && policy.paymentRequired) {
      push(code, "FREE must not require payment");
    }
    if ((policy.acquisitionMode === "SELF_SERVE_CHECKOUT" || policy.acquisitionMode === "EVIDENCE_GATED_CHECKOUT"
         || policy.acquisitionMode === "ADMISSION_GATED_CHECKOUT") && !policy.paymentRequired) {
      push(code, `${policy.acquisitionMode} must require payment`);
    }
    if ((policy.acquisitionMode === "CONTRACT" || policy.acquisitionMode === "MANUAL_BILLING"
         || policy.acquisitionMode === "ARCHIVE_ONLY") && policy.paymentRequired) {
      push(code, `${policy.acquisitionMode} must not require self-serve payment`);
    }
    if (policy.paymentRequired && !policy.entitlementRequired) {
      push(code, "payment-required products must track entitlement");
    }

    // (c) Prerequisite requirements.
    if (policy.prerequisitePolicy === "RELEASE_RECEIPT" && !policy.releaseProofRequired) {
      push(code, "RELEASE_RECEIPT policy must set releaseProofRequired");
    }
    if (policy.acquisitionMode === "ADMISSION_GATED_CHECKOUT"
        && policy.prerequisitePolicy !== "EXECUTIVE_REPORTING_ADMISSION") {
      push(code, "ADMISSION_GATED_CHECKOUT must use EXECUTIVE_REPORTING_ADMISSION prerequisite");
    }
    if (policy.acquisitionMode === "EVIDENCE_GATED_CHECKOUT" && policy.prerequisitePolicy === "NONE") {
      push(code, "EVIDENCE_GATED_CHECKOUT must carry a real prerequisite, not NONE");
    }
    if (SELF_SERVE.has(policy.acquisitionMode)
        && (policy.prerequisitePolicy === "RELEASE_RECEIPT" || policy.prerequisitePolicy === "EXECUTIVE_REPORTING_ADMISSION")
        && !policy.publicSurfaceAllowed) {
      push(code, "gated self-serve product must be publicly surfaced to be reachable");
    }

    // (d) Surfacing.
    if (policy.acquisitionMode === "ARCHIVE_ONLY" && policy.publicSurfaceAllowed) {
      push(code, "ARCHIVE_ONLY must not be publicly surfaced");
    }
  }

  // (e) Registry membership: every GMI registry code must resolve via GMI_EDITION.
  for (const entry of GMI_EDITION_REGISTRY) {
    const policy = resolveCommercialAccessPolicy(entry.productCode);
    if (!policy || policy.source !== "GMI_EDITION") {
      push(entry.productCode, "GMI edition must resolve via the GMI registry (source=GMI_EDITION)");
    }
  }

  return errors;
}
