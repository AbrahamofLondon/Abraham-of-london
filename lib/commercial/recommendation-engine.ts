/**
 * lib/commercial/recommendation-engine.ts
 *
 * Earned progression engine. Not a sales funnel.
 *
 * A next instrument appears only when the user's evidence earns it.
 * The system must be willing to say: "No paid step is warranted yet."
 *
 * All products resolve through catalog.ts. No hardcoded prices or names.
 */

import { getProduct, isCheckoutAvailable, type CatalogProduct } from "@/lib/commercial/catalog";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type ProgressionInput = {
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
  hasUnresolvedCheckpoint?: boolean;
};

export type ProductProgressionState =
  | "NOT_RELEVANT"
  | "INSUFFICIENT_EVIDENCE"
  | "AVAILABLE_BUT_NOT_WARRANTED"
  | "EARNED_ACCESS"
  | "RECOMMENDED_BY_EVIDENCE"
  | "ESCALATION_WARRANTED"
  | "RETAINER_SIGNAL_DETECTED"
  | "COUNSEL_WARRANTED"
  | "BLOCKED_UNTIL_MORE_EVIDENCE"
  | "ALREADY_ENTITLED";

export type EarnedProgression = {
  productCode: string;
  product: CatalogProduct;
  state: ProductProgressionState;
  reason: string;
  evidenceThreshold: string[];
  whatItWillTest: string;
  whatHappensIfYouStop: string;
  ctaLabel: string;
};

// Legacy alias for backward compatibility
export type ProductRecommendation = EarnedProgression;
export type RecommendationInput = ProgressionInput;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function tryProduct(code: string): CatalogProduct | null {
  try {
    return getProduct(code);
  } catch {
    return null;
  }
}

function buildProgression(input: {
  productCode: string;
  product: CatalogProduct;
  state: ProductProgressionState;
  reason: string;
  evidenceThreshold: string[];
  whatItWillTest: string;
}): EarnedProgression {
  return {
    ...input,
    whatHappensIfYouStop: "Your current finding and checkpoint remain active. The system will still check whether you acted.",
    ctaLabel: input.product.primaryCta ?? input.product.displayName,
  };
}

// ─── MAIN ENGINE ─────────────────────────────────────────────────────────────

export function determineEarnedNextStep(input: ProgressionInput): EarnedProgression | null {
  // If user has an unresolved checkpoint, do not push a product.
  // The primary action is: respond to your checkpoint.
  if (input.hasUnresolvedCheckpoint) {
    return null;
  }

  // If evidence is genuinely insufficient, say so. Do not recommend a paid product.
  if (input.evidenceInsufficient && !input.authorityGap && !input.ownershipGap && !input.consequenceHigh) {
    return null; // "No paid step is warranted yet."
  }

  // Count how many decision instrument needs are present
  const instrumentNeeds = [
    input.authorityGap,
    input.ownershipGap,
    input.interventionUnclear,
    input.consequenceHigh,
  ].filter(Boolean).length;

  // Bundle if multiple needs converge
  if (instrumentNeeds >= 2) {
    const product = tryProduct("operator_decision_pack");
    if (product?.active && isCheckoutAvailable(product)) {
      return buildProgression({
        productCode: "operator_decision_pack",
        product,
        state: "EARNED_ACCESS",
        reason: "Multiple decision pressure points detected. The evidence threshold for the decision instrument bundle has been crossed.",
        evidenceThreshold: [
          input.authorityGap ? "Authority gap detected" : "",
          input.ownershipGap ? "Ownership unclear" : "",
          input.interventionUnclear ? "Intervention path undefined" : "",
          input.consequenceHigh ? "High consequence confirmed" : "",
        ].filter(Boolean),
        whatItWillTest: "Authority, intervention route, and consequence exposure — tested together.",
      });
    }
  }

  // Authority or ownership gap → mandate clarity
  if (input.authorityGap || input.ownershipGap) {
    const product = tryProduct("mandate_clarity_framework");
    if (product?.active && isCheckoutAvailable(product)) {
      return buildProgression({
        productCode: "mandate_clarity_framework",
        product,
        state: "EARNED_ACCESS",
        reason: input.authorityGap
          ? "Your evidence shows a decision exists but authority to act is unclear. This instrument tests whether the mandate is clear enough to proceed."
          : "Decision ownership could not be confirmed. This instrument tests whether a binding owner exists.",
        evidenceThreshold: [
          input.authorityGap ? "Authority gap confirmed in diagnostic" : "",
          input.ownershipGap ? "Owner named but not binding" : "",
        ].filter(Boolean),
        whatItWillTest: "Whether this decision has a clear, exercisable mandate owner.",
      });
    }
  }

  // Intervention unclear → path selector
  if (input.interventionUnclear) {
    const product = tryProduct("intervention_path_selector");
    if (product?.active && isCheckoutAvailable(product)) {
      return buildProgression({
        productCode: "intervention_path_selector",
        product,
        state: "EARNED_ACCESS",
        reason: "The decision is named, but the correction path is undefined. This instrument tests which type of intervention is appropriate.",
        evidenceThreshold: ["Intervention route unresolved"],
        whatItWillTest: "Which correction type — authority, execution, or structural — matches the evidence.",
      });
    }
  }

  // High consequence → exposure instrument
  if (input.consequenceHigh && !input.institutionalStakes) {
    const product = tryProduct("decision_exposure_instrument");
    if (product?.active && isCheckoutAvailable(product)) {
      return buildProgression({
        productCode: "decision_exposure_instrument",
        product,
        state: "EARNED_ACCESS",
        reason: "Consequence severity is high. This instrument maps the financial, reputational, and structural exposure of the current decision state.",
        evidenceThreshold: ["High consequence detected in diagnostic"],
        whatItWillTest: "The scale and type of exposure if the decision remains unresolved.",
      });
    }
  }

  // Institutional stakes → executive reporting (not immediate checkout — preview)
  if (input.institutionalStakes) {
    const product = tryProduct("executive_reporting");
    if (product?.active) {
      return buildProgression({
        productCode: "executive_reporting",
        product,
        state: "RECOMMENDED_BY_EVIDENCE",
        reason: "The decision appears to carry institutional, board-level, or multi-stakeholder consequence. Executive Reporting produces a governed priority stack when the evidence supports it.",
        evidenceThreshold: [
          "Institutional consequence language detected",
          input.consequenceHigh ? "High consequence confirmed" : "",
        ].filter(Boolean),
        whatItWillTest: "Whether the consequence justifies a board-grade priority stack and escalation route.",
      });
    }
  }

  // Competing obligation dominant → personal decision audit
  if (input.competingObligationDominant) {
    const product = tryProduct("personal_decision_audit");
    if (product) {
      return buildProgression({
        productCode: "personal_decision_audit",
        product,
        state: product.active ? "EARNED_ACCESS" : "AVAILABLE_BUT_NOT_WARRANTED",
        reason: "The diagnostic suggests the primary blocker is a competing obligation — something the user is protecting at the expense of the decision.",
        evidenceThreshold: ["Competing obligation identified"],
        whatItWillTest: "The contradiction between stated mandate, actual behaviour, and competing obligation.",
      });
    }
  }

  // Execution ready → strategy room
  if (input.executionReady) {
    const product = tryProduct("strategy_room");
    if (product?.active) {
      return buildProgression({
        productCode: "strategy_room",
        product,
        state: "EARNED_ACCESS",
        reason: "Evidence and authority are sufficient for governed execution. The Strategy Room converts diagnosis into action with checkpoints and memory.",
        evidenceThreshold: ["Authority confirmed", "Evidence sufficient", "Execution readiness met"],
        whatItWillTest: "Whether the user will execute against the identified condition with governance.",
      });
    }
  }

  // No earned progression — this is fine
  return null;
}

// Legacy alias
export function recommendNextInstrument(input: ProgressionInput): EarnedProgression | null {
  return determineEarnedNextStep(input);
}
