/**
 * lib/commercial/recommendation-engine.ts
 *
 * Maps diagnostic conditions to product recommendations.
 * The system recommends the next appropriate instrument
 * because the evidence requires it — not because the platform wants revenue.
 *
 * All products resolve through catalog.ts. No hardcoded prices or names.
 */

import { getProduct, type CatalogProduct } from "@/lib/commercial/catalog";

export type RecommendationInput = {
  sourceSurface:
    | "fast_diagnostic"
    | "personal_decision_audit"
    | "constitutional_diagnostic"
    | "executive_reporting"
    | "strategy_room"
    | "return_brief"
    | "decision_centre";
  condition?: string | null;
  primaryPattern?: string | null;
  weakestDomain?: string | null;
  authorityGap?: boolean;
  ownershipGap?: boolean;
  interventionUnclear?: boolean;
  consequenceHigh?: boolean;
  executionBlocked?: boolean;
  evidenceInsufficient?: boolean;
  preCommitmentMissing?: boolean;
  competingObligationDominant?: boolean;
  institutionalStakes?: boolean;
  executionReady?: boolean;
};

export type ProductRecommendation = {
  productCode: string;
  product: CatalogProduct;
  reason: string;
  urgency: "LOW" | "MODERATE" | "HIGH";
  recommendationType:
    | "NEXT_INSTRUMENT"
    | "DEEPEN_ANALYSIS"
    | "EXECUTE"
    | "ESCALATE"
    | "BUNDLE";
  ctaLabel: string;
};

function tryProduct(code: string): CatalogProduct | null {
  try {
    return getProduct(code);
  } catch {
    return null;
  }
}

export function recommendNextInstrument(input: RecommendationInput): ProductRecommendation | null {
  // Count how many decision instrument needs are present
  const instrumentNeeds = [
    input.authorityGap,
    input.ownershipGap,
    input.interventionUnclear,
    input.consequenceHigh,
  ].filter(Boolean).length;

  // Bundle recommendation if multiple needs
  if (instrumentNeeds >= 2) {
    const product = tryProduct("operator_decision_pack");
    if (product?.active) {
      return {
        productCode: "operator_decision_pack",
        product,
        reason: "Multiple decision pressure points detected. The bundle addresses authority, intervention path, and consequence exposure together.",
        urgency: "HIGH",
        recommendationType: "BUNDLE",
        ctaLabel: product.primaryCta ?? product.displayName,
      };
    }
  }

  // Authority or ownership gap → mandate clarity
  if (input.authorityGap || input.ownershipGap) {
    const product = tryProduct("mandate_clarity_framework");
    if (product?.active) {
      return {
        productCode: "mandate_clarity_framework",
        product,
        reason: input.authorityGap
          ? "The diagnostic detected an authority gap. The mandate framework tests whether the decision has a clear, exercisable owner."
          : "Decision ownership is unclear. The mandate framework helps identify who can actually make this binding.",
        urgency: "HIGH",
        recommendationType: "NEXT_INSTRUMENT",
        ctaLabel: product.primaryCta ?? product.displayName,
      };
    }
  }

  // Intervention unclear → intervention path selector
  if (input.interventionUnclear) {
    const product = tryProduct("intervention_path_selector");
    if (product?.active) {
      return {
        productCode: "intervention_path_selector",
        product,
        reason: "The decision exists but the intervention path is unclear. This instrument tests which type of correction is appropriate.",
        urgency: "MODERATE",
        recommendationType: "NEXT_INSTRUMENT",
        ctaLabel: product.primaryCta ?? product.displayName,
      };
    }
  }

  // High consequence → decision exposure instrument
  if (input.consequenceHigh) {
    const product = tryProduct("decision_exposure_instrument");
    if (product?.active) {
      return {
        productCode: "decision_exposure_instrument",
        product,
        reason: "High consequence detected. This instrument maps the financial, reputational, and structural exposure of the current decision state.",
        urgency: "HIGH",
        recommendationType: "NEXT_INSTRUMENT",
        ctaLabel: product.primaryCta ?? product.displayName,
      };
    }
  }

  // Personal contradiction / competing obligation → personal decision audit
  if (input.competingObligationDominant || input.weakestDomain === "identity" || input.weakestDomain === "decision") {
    const product = tryProduct("personal_decision_audit");
    if (product) {
      return {
        productCode: "personal_decision_audit",
        product,
        reason: "The diagnostic suggests the constraint is personal — a competing obligation or mandate confusion is blocking the decision.",
        urgency: "MODERATE",
        recommendationType: "DEEPEN_ANALYSIS",
        ctaLabel: product.primaryCta ?? product.displayName,
      };
    }
  }

  // Board-grade / institutional stakes → executive reporting
  if (input.institutionalStakes || input.consequenceHigh) {
    const product = tryProduct("executive_reporting");
    if (product?.active) {
      return {
        productCode: "executive_reporting",
        product,
        reason: "The decision has institutional or board-level consequence. Executive Reporting produces a governed priority stack and escalation route.",
        urgency: "HIGH",
        recommendationType: "ESCALATE",
        ctaLabel: product.primaryCta ?? product.displayName,
      };
    }
  }

  // Execution ready → strategy room
  if (input.executionReady) {
    const product = tryProduct("strategy_room");
    if (product?.active) {
      return {
        productCode: "strategy_room",
        product,
        reason: "Evidence and authority are sufficient. The Strategy Room converts diagnosis into governed execution with checkpoints and memory.",
        urgency: "MODERATE",
        recommendationType: "EXECUTE",
        ctaLabel: product.primaryCta ?? product.displayName,
      };
    }
  }

  // Default: if evidence is insufficient, recommend deepening
  if (input.evidenceInsufficient) {
    const product = tryProduct("personal_decision_audit");
    if (product) {
      return {
        productCode: "personal_decision_audit",
        product,
        reason: "The current evidence base is thin. A deeper personal audit would strengthen the diagnostic reading.",
        urgency: "LOW",
        recommendationType: "DEEPEN_ANALYSIS",
        ctaLabel: product.primaryCta ?? product.displayName,
      };
    }
  }

  return null;
}
