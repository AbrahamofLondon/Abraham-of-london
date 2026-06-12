/**
 * Customer Usefulness Proof.
 *
 * Each product must prove at least one concrete customer win from its
 * actual output. No proof, no release. Proofs are derived from measured
 * output features, not asserted.
 */

import {
  extractOutputFeatures,
  type AnalyzableSample,
} from "@/lib/product/anti-toy-product-test";

export type UsefulnessProofType =
  | "decision_clarity_improved"
  | "next_action_obvious"
  | "risk_made_visible"
  | "contradiction_made_explicit"
  | "execution_sequence_clearer"
  | "evidence_organised_into_judgement"
  | "likely_mistake_avoided"
  | "reusable_artefact_gained";

export const ALL_USEFULNESS_PROOFS: UsefulnessProofType[] = [
  "decision_clarity_improved",
  "next_action_obvious",
  "risk_made_visible",
  "contradiction_made_explicit",
  "execution_sequence_clearer",
  "evidence_organised_into_judgement",
  "likely_mistake_avoided",
  "reusable_artefact_gained",
];

export interface CustomerUsefulnessProof {
  productCode: string;
  testedOutputSource: string;
  proofsEstablished: UsefulnessProofType[];
  proofsMissing: UsefulnessProofType[];
  hasProof: boolean;
  notes: string[];
}

export function assessCustomerUsefulness(
  productCode: string,
  testedOutputSource: string,
  primary: AnalyzableSample,
  variant: AnalyzableSample,
): CustomerUsefulnessProof {
  const features = extractOutputFeatures(primary, variant);
  const proofs = new Set<UsefulnessProofType>();
  const notes: string[] = [];
  const fullText = primary.output.fullText;

  if (features.hasOwnerAndTimeframe && features.nextActionGroundedInInput && !features.nextActionIdenticalAcrossInputs) {
    proofs.add("next_action_obvious");
    notes.push("Next action is owned, time-bound, and anchored in the user's case.");
  }
  if (features.consequenceGroundedInInput) {
    proofs.add("risk_made_visible");
    notes.push("Consequence is tied to the user's named stake, making the risk of inaction visible.");
  }
  if (/contradiction|tension|friction/i.test(fullText) && features.crossInputSimilarity < 0.6) {
    proofs.add("contradiction_made_explicit");
    notes.push("The output names a case-specific contradiction or friction.");
  }
  if (features.citesEvidence && features.statesLimits) {
    proofs.add("evidence_organised_into_judgement");
    notes.push("Evidence basis and honest limits are organised into an explicit judgement frame.");
  }
  if (features.hasReuseMarkers) {
    proofs.add("reusable_artefact_gained");
    notes.push("Checkpoint/record structure gives the user an artefact to return to.");
  }
  if (/sequence|first|then|before (you|touching|committing)|step/i.test(fullText) && features.nextActionGroundedInInput) {
    proofs.add("execution_sequence_clearer");
    notes.push("The output orders what to do before what — an execution sequence, not a list.");
  }
  if (features.crossInputSimilarity < 0.5 && features.inputEchoRatio < 0.35) {
    proofs.add("decision_clarity_improved");
    notes.push("The judgement is case-derived rather than restated input — clarity the user did not have.");
  }
  if (/irreversible|before committing|reversible (step|move)/i.test(fullText)) {
    proofs.add("likely_mistake_avoided");
    notes.push("The output explicitly guards the user against premature irreversible commitment.");
  }

  const proofsEstablished = ALL_USEFULNESS_PROOFS.filter((proof) => proofs.has(proof));

  return {
    productCode,
    testedOutputSource,
    proofsEstablished,
    proofsMissing: ALL_USEFULNESS_PROOFS.filter((proof) => !proofs.has(proof)),
    hasProof: proofsEstablished.length > 0,
    notes,
  };
}
