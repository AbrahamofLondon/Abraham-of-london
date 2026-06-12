/**
 * lib/product/fulfilment-readiness-validator.ts
 *
 * Validates ProductFulfilmentContracts and produces a structured readiness report.
 * Pure functions — no DB calls, no I/O. Safe to call at build time.
 *
 * Hard failures: structural defects that must be fixed before a product can be sold.
 * Warnings: gaps that should be resolved before scale but do not block sale.
 */

import type { ProductFulfilmentContract, ReadinessStatus } from "./product-fulfilment-contract";

// ── Result types ───────────────────────────────────────────────────────────────

export type ValidationFailure = {
  rule: string;
  message: string;
};

export type ProductReadinessResult = {
  productCode: string;
  displayName: string;
  commercialStatus: string;
  fulfilmentType: string;
  declaredStatus: ReadinessStatus;
  computedStatus: ReadinessStatus;
  statusMismatch: boolean;
  hardFailures: ValidationFailure[];
  warnings: ValidationFailure[];
  contractWarnings: string[];
  isBlocked: boolean;
};

export type EstateReadinessReport = {
  generatedAt: string;
  totalProducts: number;
  sellable: number;
  proofReady: number;
  notSellable: number;
  notApplicable: number;
  blocked: number;
  statusMismatches: number;
  results: ProductReadinessResult[];
  summary: string;
};

// ── Hard failure rules ─────────────────────────────────────────────────────────
// These block `sellable` and `proof_ready` for paid products.

function checkHardFailures(c: ProductFulfilmentContract): ValidationFailure[] {
  const failures: ValidationFailure[] = [];
  const isPaid = c.commercialStatus === "paid";
  const isContracted = c.commercialStatus === "contracted";

  if (isPaid && !c.stripePriceId) {
    failures.push({
      rule: "MISSING_STRIPE_PRICE_ID",
      message: `Paid product "${c.productCode}" has no stripePriceId`,
    });
  }

  if (isPaid && !c.checkoutRoute) {
    failures.push({
      rule: "MISSING_CHECKOUT_ROUTE",
      message: `Paid product "${c.productCode}" has no checkoutRoute`,
    });
  }

  if (isPaid && !c.customerAccessRoute) {
    failures.push({
      rule: "MISSING_CUSTOMER_ACCESS_ROUTE",
      message: `Paid product "${c.productCode}" has no customerAccessRoute — customer cannot access what they paid for`,
    });
  }

  if (isPaid && !c.successRoute) {
    failures.push({
      rule: "MISSING_SUCCESS_ROUTE",
      message: `Paid product "${c.productCode}" has no successRoute — post-purchase landing undefined`,
    });
  }

  if (c.fulfilmentType === "human_reviewed_dossier") {
    if (!c.adminRoute) {
      failures.push({
        rule: "MISSING_ADMIN_ROUTE_FOR_DOSSIER",
        message: `"${c.productCode}" is human_reviewed_dossier but has no adminRoute — operator cannot review`,
      });
    }
    if (!c.artifactModel) {
      failures.push({
        rule: "MISSING_ARTIFACT_MODEL_FOR_DOSSIER",
        message: `"${c.productCode}" is human_reviewed_dossier but has no artifactModel — no DB record to track delivery`,
      });
    }
  }

  if (c.fulfilmentType === "executive_report_artifact" && !c.artifactModel) {
    failures.push({
      rule: "MISSING_ARTIFACT_MODEL_FOR_EXECUTIVE_REPORT",
      message: `"${c.productCode}" is executive_report_artifact but has no artifactModel`,
    });
  }

  if (c.fulfilmentType === "bundle_grant") {
    if (!c.notes || !c.notes.includes("Includes:")) {
      failures.push({
        rule: "BUNDLE_MISSING_INCLUDES_DECLARATION",
        message: `"${c.productCode}" is bundle_grant but notes field does not declare included products`,
      });
    }
  }

  if (isContracted && !c.notes) {
    failures.push({
      rule: "CONTRACTED_MISSING_NOTES",
      message: `Contracted product "${c.productCode}" has no notes — contract terms undocumented`,
    });
  }

  return failures;
}

// ── Warning rules ──────────────────────────────────────────────────────────────
// These do not block sale but should be resolved before scale.

function checkWarnings(c: ProductFulfilmentContract): ValidationFailure[] {
  const warnings: ValidationFailure[] = [];
  const isPaid = c.commercialStatus === "paid";

  if (isPaid && !c.adminRoute) {
    warnings.push({
      rule: "NO_ADMIN_ROUTE",
      message: `"${c.productCode}" is paid but has no adminRoute — operator cannot inspect or troubleshoot`,
    });
  }

  if (isPaid && !c.feedbackSurface) {
    warnings.push({
      rule: "NO_FEEDBACK_SURFACE",
      message: `"${c.productCode}" has no feedbackSurface — post-delivery feedback cannot be collected`,
    });
  }

  if (c.caseStudyEligible && !c.artifactModel && c.fulfilmentType !== "scheduled_session") {
    warnings.push({
      rule: "CASE_STUDY_ELIGIBLE_NO_ARTIFACT",
      message: `"${c.productCode}" is caseStudyEligible but has no artifactModel to generate a case study from`,
    });
  }

  if (isPaid && !c.proofRunCompleted) {
    warnings.push({
      rule: "PROOF_RUN_NOT_COMPLETED",
      message: `"${c.productCode}" has not completed a proof run — fulfilment path unverified in production`,
    });
  }

  if (isPaid && c.dashboardVisibility && !c.estateSpineSourceType) {
    warnings.push({
      rule: "DASHBOARD_VISIBLE_NO_SPINE_SOURCE",
      message: `"${c.productCode}" claims dashboardVisibility but has no estateSpineSourceType — will not appear in fulfilment spine`,
    });
  }

  return warnings;
}

// ── Compute readiness status from failures ────────────────────────────────────

function computeStatus(c: ProductFulfilmentContract, hardFailures: ValidationFailure[]): ReadinessStatus {
  if (c.commercialStatus === "inactive" || c.commercialStatus === "contracted") return "not_applicable";
  if (c.commercialStatus === "free_controlled" || c.commercialStatus === "evidence_gated") {
    return "not_applicable";
  }
  if (c.fulfilmentType === "free_asset" || c.fulfilmentType === "corridor_stage") {
    return "not_applicable";
  }
  if (hardFailures.length > 0) return "not_sellable";
  if (!c.proofRunCompleted) return "proof_ready";
  return "sellable";
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function validateContract(c: ProductFulfilmentContract): ProductReadinessResult {
  const hardFailures = checkHardFailures(c);
  const warnings = checkWarnings(c);
  const computedStatus = computeStatus(c, hardFailures);
  const statusMismatch = computedStatus !== c.readinessStatus;
  const isBlocked = computedStatus === "not_sellable";

  return {
    productCode: c.productCode,
    displayName: c.displayName,
    commercialStatus: c.commercialStatus,
    fulfilmentType: c.fulfilmentType,
    declaredStatus: c.readinessStatus,
    computedStatus,
    statusMismatch,
    hardFailures,
    warnings,
    contractWarnings: c.warnings,
    isBlocked,
  };
}

export function validateAllContracts(
  contracts: ProductFulfilmentContract[],
): EstateReadinessReport {
  const results = contracts.map(validateContract);

  const sellable = results.filter((r) => r.computedStatus === "sellable").length;
  const proofReady = results.filter((r) => r.computedStatus === "proof_ready").length;
  const notSellable = results.filter((r) => r.computedStatus === "not_sellable").length;
  const notApplicable = results.filter((r) => r.computedStatus === "not_applicable").length;
  const blocked = results.filter((r) => r.isBlocked).length;
  const statusMismatches = results.filter((r) => r.statusMismatch).length;

  const blockedNames = results.filter((r) => r.isBlocked).map((r) => r.productCode);
  const mismatchNames = results.filter((r) => r.statusMismatch).map((r) => r.productCode);

  let summary = `${contracts.length} products: ${sellable} sellable, ${proofReady} proof-ready, ${notSellable} not-sellable, ${notApplicable} not-applicable.`;
  if (blocked > 0) summary += ` BLOCKED: ${blockedNames.join(", ")}.`;
  if (statusMismatches > 0) summary += ` STATUS MISMATCH: ${mismatchNames.join(", ")}.`;

  return {
    generatedAt: new Date().toISOString(),
    totalProducts: contracts.length,
    sellable,
    proofReady,
    notSellable,
    notApplicable,
    blocked,
    statusMismatches,
    results,
    summary,
  };
}
