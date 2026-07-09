/**
 * lib/fulfilment/estate-verdict-layer.ts
 *
 * LAYER C — VERDICT
 *
 * Only after observation (Layer A) and evaluation (Layer B):
 * produce final product dispositions.
 *
 * The verdict generator consumes Layer B evaluations.
 * Layer A must never consume Layer C.
 * Layer B must never validate a value merely because Layer C declared it.
 */

import { type ProductEvaluation, evaluateAllProducts, evaluateProduct } from "./estate-evaluation-layer";
import { observeProductCommercialStatus, observeProductHasStripePriceId, observeProductIsActive } from "./estate-observation-layer";
import { CATALOG } from "../commercial/catalog";
import { getContractByProductCode } from "../product/product-fulfilment-contract";

// ── Final disposition types ────────────────────────────────────────────────

export type FinalDisposition =
  | "RELEASE_READY_NOW"
  | "CONTROLLED_RELEASE_READY"
  | "PUBLIC_REFERENCE_READY"
  | "INTERNAL_ONLY_JUSTIFIED"
  | "MERGED_OR_RETIRED"
  | "UNRESOLVED";

export type ProductVerdict = {
  productCode: string;
  productName: string;
  disposition: FinalDisposition;
  previousDisposition: FinalDisposition | null;
  evaluationPassed: boolean;
  evaluationCount: number;
  passedCount: number;
  failedCount: number;
  reason: string;
};

// ── Policy-driven classifications ──────────────────────────────────────────

const MERGED_OR_RETIRED_CODES = new Set([
  "operator_essentials_pack",
  "command_pack",
  "governance_suite",
  "diagnostic_report_basic",
  "diagnostic_report_pro",
  "executive_reporting_priority",
]);

const INTERNAL_ONLY_CODES = new Set([
  "gmi_q3_2026",
  "inner_circle",
]);

const PUBLIC_REFERENCE_CODES = new Set([
  "gmi_q1_2026",
  "case_dossier_tariff_shock",
  "case_dossier_team_alignment",
  "case_dossier_escalation_denied",
]);

// ── Verdict rules ──────────────────────────────────────────────────────────

function determineDisposition(productCode: string, evaluation: ProductEvaluation): {
  disposition: FinalDisposition;
  reason: string;
} {
  // Policy-driven classifications first
  if (MERGED_OR_RETIRED_CODES.has(productCode)) {
    return {
      disposition: "MERGED_OR_RETIRED",
      reason: "Policy decision: merged into canonical product or retired. No separate market job remains.",
    };
  }

  if (INTERNAL_ONLY_CODES.has(productCode)) {
    return {
      disposition: "INTERNAL_ONLY_JUSTIFIED",
      reason: "Policy decision: internal operations or future-edition record only. Not a public commercial product.",
    };
  }

  if (PUBLIC_REFERENCE_CODES.has(productCode)) {
    return {
      disposition: "PUBLIC_REFERENCE_READY",
      reason: "Policy decision: public reference/provenance asset. No advisory, diagnostic, or investment claims.",
    };
  }

  // Evidence-driven classifications
  const commercialStatus = observeProductCommercialStatus(productCode);
  const isActive = observeProductIsActive(productCode);
  const hasStripe = observeProductHasStripePriceId(productCode);

  // Check for controlled release conditions
  const isContracted = commercialStatus === "contracted";
  const isManualBilling = commercialStatus === "manual_billing";
  const isEvidenceGated = commercialStatus === "evidence_gated";
  const isInactive = commercialStatus === "inactive" || !isActive;
  const isSubscription = commercialStatus === "paid" && CATALOG[productCode]?.accessType === "subscription";

  // Human-reviewed or scheduled products need controlled release
  const contract = getContractByProductCode(productCode);
  const needsHumanReview = contract?.fulfilmentType === "human_reviewed_dossier";
  const isScheduledSession = contract?.fulfilmentType === "scheduled_session";
  const isReportArtifact = contract?.fulfilmentType === "executive_report_artifact";
  const isBundle = contract?.fulfilmentType === "bundle_grant";
  const isRetainerCycle = contract?.fulfilmentType === "retainer_cycle";

  if (isContracted || isManualBilling || isEvidenceGated || isInactive || isSubscription ||
      needsHumanReview || isScheduledSession || isReportArtifact || isBundle || isRetainerCycle) {
    // Released recurring GMI editions remain report artifacts, but current editions can be sold directly
    // once the catalogue, Stripe binding and product evidence are all green.
    if (productCode === "gmi_q2_2026" && commercialStatus === "paid" && isActive && hasStripe && evaluation.allPassed) {
      return {
        disposition: "RELEASE_READY_NOW",
        reason: "Released current GMI edition: durable release authority, active checkout binding and all estate evaluations passed.",
      };
    }

    // Boardroom mode is evidence-gated
    if (productCode === "boardroom_mode") {
      return {
        disposition: "CONTROLLED_RELEASE_READY",
        reason: "Evidence-gated: requires prior Executive Reporting or governed case record. No self-serve checkout.",
      };
    }

    return {
      disposition: "CONTROLLED_RELEASE_READY",
      reason: evaluation.allPassed
        ? `Controlled release: ${commercialStatus}, ${contract?.fulfilmentType ?? "standard"} fulfilment. Evaluation passed.`
        : `Controlled release: ${commercialStatus}, ${contract?.fulfilmentType ?? "standard"} fulfilment. Evaluation has gaps (${evaluation.evaluations.length - evaluation.evaluations.filter(e => e.passed).length} failures).`,
    };
  }

  // Release-ready now: must pass all evaluations
  if (evaluation.allPassed) {
    return {
      disposition: "RELEASE_READY_NOW",
      reason: `All ${evaluation.evaluations.length} evaluations passed. Product is commercially and structurally ready.`,
    };
  }

  // Failed evaluations but not controlled — demote to controlled
  return {
    disposition: "CONTROLLED_RELEASE_READY",
    reason: `Evaluation incomplete: ${evaluation.evaluations.filter(e => !e.passed).length}/${evaluation.evaluations.length} evaluations failed. Demoted to controlled release.`,
  };
}

// ── Verdict generation ─────────────────────────────────────────────────────

export function generateVerdict(productCode: string): ProductVerdict {
  const evaluation = evaluateProduct(productCode);
  const { disposition, reason } = determineDisposition(productCode, evaluation);

  return {
    productCode,
    productName: evaluation.productName,
    disposition,
    previousDisposition: null,
    evaluationPassed: evaluation.allPassed,
    evaluationCount: evaluation.evaluations.length,
    passedCount: evaluation.evaluations.filter((e) => e.passed).length,
    failedCount: evaluation.evaluations.filter((e) => !e.passed).length,
    reason,
  };
}

export function generateAllVerdicts(): ProductVerdict[] {
  const evaluations = evaluateAllProducts();
  return evaluations.map((e) => generateVerdict(e.productCode));
}

export function getVerdictCounts(): Record<FinalDisposition, number> {
  const verdicts = generateAllVerdicts();
  const counts: Record<FinalDisposition, number> = {
    RELEASE_READY_NOW: 0,
    CONTROLLED_RELEASE_READY: 0,
    PUBLIC_REFERENCE_READY: 0,
    INTERNAL_ONLY_JUSTIFIED: 0,
    MERGED_OR_RETIRED: 0,
    UNRESOLVED: 0,
  };
  for (const v of verdicts) {
    counts[v.disposition]++;
  }
  return counts as Record<FinalDisposition, number>;
}
