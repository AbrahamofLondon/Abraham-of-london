/**
 * Behaviour Map — deterministic behaviour assessment.
 *
 * Compares scenario response to detected signal.
 * Produces alignment or divergence. No generative logic.
 */

import type { SignalKey } from "./signals";

export type BehaviourAssessment = {
  aligned: boolean;
  message: string;
};

export function evaluateBehaviour(signal: SignalKey, behaviourTag: string): BehaviourAssessment {
  if (signal === "AUTHORITY_LEAKAGE") {
    if (behaviourTag === "controlled_execution") {
      return { aligned: true, message: "Your response indicates you would restore control under pressure." };
    }
    return { aligned: false, message: "Under pressure, control is likely to default rather than be exercised deliberately." };
  }

  if (signal === "EXECUTION_AVOIDANCE") {
    if (behaviourTag === "controlled_execution") {
      return { aligned: true, message: "Your response indicates you would act despite current hesitation." };
    }
    return { aligned: false, message: "Your response suggests the decision would continue to be delayed under pressure." };
  }

  if (signal === "DEFINITION_FAILURE") {
    if (behaviourTag === "decisive_authority") {
      return { aligned: true, message: "Your response indicates clarity would be imposed under conflict." };
    }
    return { aligned: false, message: "Your response suggests the lack of definition would persist under conflict." };
  }

  if (signal === "LATENT_INSTABILITY") {
    if (behaviourTag === "decisive_authority" || behaviourTag === "controlled_execution") {
      return { aligned: true, message: "Your response indicates you would act to stabilise the condition." };
    }
    return { aligned: false, message: "Your response indicates the instability would persist under pressure." };
  }

  return { aligned: false, message: "Your response indicates potential inconsistency under pressure." };
}
