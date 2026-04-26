/**
 * Operator Decision Pack — unified execution flow.
 *
 * Step 1 → Exposure → Step 2 → Mandate → Step 3 → Intervention
 * Cannot skip steps. Each feeds the next.
 *
 * Final output: Decision Dossier (single structured document).
 */

import { scoreExposure, type ExposureInput, type ExposureResult } from "./decision-exposure/engine";
import { scoreMandateClarity, type MandateInput, type MandateResult } from "./mandate-clarity/engine";
import { selectInterventionPath, type InterventionInput, type InterventionResult } from "./intervention-path/engine";

export type OperatorPackStage = "exposure" | "mandate" | "intervention" | "complete";

export type OperatorPackState = {
  stage: OperatorPackStage;
  exposure: ExposureResult | null;
  mandate: MandateResult | null;
  intervention: InterventionResult | null;
  dossier: DecisionDossier | null;
};

export type DecisionDossier = {
  exposure: ExposureResult;
  authority: MandateResult;
  intervention: InterventionResult;
  finalDecision: string;
  executionWindow: number;
  riskStatement: string;
  generatedAt: string;
  deterministic: true;
  version: "1.0";
};

/**
 * Create initial pack state.
 */
export function createPackState(): OperatorPackState {
  return { stage: "exposure", exposure: null, mandate: null, intervention: null, dossier: null };
}

/**
 * Complete exposure step → advance to mandate.
 */
export function completeExposure(state: OperatorPackState, input: ExposureInput, costAnchor?: number): OperatorPackState {
  const exposure = scoreExposure(input, costAnchor);
  return { ...state, stage: "mandate", exposure };
}

/**
 * Complete mandate step → advance to intervention.
 */
export function completeMandate(state: OperatorPackState, input: MandateInput): OperatorPackState {
  if (!state.exposure) throw new Error("Cannot complete mandate before exposure");
  const mandate = scoreMandateClarity(input);
  return { ...state, stage: "intervention", mandate };
}

/**
 * Complete intervention step → generate dossier.
 */
export function completeIntervention(state: OperatorPackState, input: InterventionInput): OperatorPackState {
  if (!state.exposure || !state.mandate) throw new Error("Cannot complete intervention before exposure + mandate");
  const intervention = selectInterventionPath(input);

  const dossier = generateDossier(state.exposure, state.mandate, intervention);
  return { ...state, stage: "complete", intervention, dossier };
}

function generateDossier(exposure: ExposureResult, authority: MandateResult, intervention: InterventionResult): DecisionDossier {
  const riskFactors: string[] = [];
  if (exposure.exposureBand === "CRITICAL") riskFactors.push(`exposure is critical (${exposure.exposureScore}/100)`);
  if (authority.authorityType === "UNCLEAR") riskFactors.push("authority is unclear");
  if (intervention.executionBlocked) riskFactors.push("execution is blocked");
  if (authority.misalignmentFlags.length > 0) riskFactors.push(`${authority.misalignmentFlags.length} authority misalignment(s)`);

  const riskStatement = riskFactors.length > 0
    ? `Decision carries ${riskFactors.length} active risk factor${riskFactors.length > 1 ? "s" : ""}: ${riskFactors.join("; ")}.`
    : "Risk level is manageable under current conditions.";

  const finalDecision = intervention.executionBlocked
    ? "Execution is blocked. Authority must be reconstituted before any action is valid."
    : `Recommended path: ${intervention.recommendedPath}. Authority type: ${authority.authorityType}. Exposure: ${exposure.exposureBand}.`;

  return {
    exposure,
    authority,
    intervention,
    finalDecision,
    executionWindow: intervention.escalationWindow,
    riskStatement,
    generatedAt: new Date().toISOString(),
    deterministic: true,
    version: "1.0",
  };
}
