/**
 * Strategic Twin Simulation Contract
 *
 * Defines bounded predictive simulation that:
 * - Uses probability bands (not fake precision)
 * - Discloses evidence gaps and limitations
 * - Cannot grant authority
 * - Learns from falsification history
 * - Respects product moat boundaries
 */

export type StrategicTwinScenario =
  | "no_action"
  | "evidence_deepening"
  | "governance_intervention"
  | "execution_review"
  | "board_escalation"
  | "debt_reduction_path"
  | "verification_followup";

export type ProbabilityBand =
  | "not_enough_evidence"
  | "low"
  | "medium"
  | "high";

export type SimulationConfidence =
  | "low"
  | "medium"
  | "high";

export interface StrategicTwinSimulation {
  simulationId: string;
  caseId: string;
  productCode: string;
  simulatedAt: string;

  horizonDays: number;
  scenario: StrategicTwinScenario;

  recurrenceRiskBand: ProbabilityBand;
  decisionDebtMovement:
    | "unknown"
    | "likely_reduced"
    | "likely_flat"
    | "likely_increased";

  expectedConsequencePath: string[];
  evidenceBasis: string[];
  activeEvidenceGaps: string[];
  contradictionKeys: string[];

  debtRecordIds: string[];
  verificationTargetIds: string[];
  falsificationIds: string[];

  confidence: SimulationConfidence;
  confidenceBasis: string[];
  limitations: string[];

  recommendedMove: string;
  recommendedMoveBasis: string[];
  unsuitableMoves: string[];

  authorityBoundary: {
    positiveAuthorityGranted: false;
    authorityRestorationPerformed: false;
    simulationGrantsAuthority: false;
    requiresHumanDecision: true;
  };
}

export interface CounterfactualScenarioComparison {
  caseId: string;
  comparedAt: string;
  horizonDays: number;

  scenarios: StrategicTwinSimulation[];
  preferredScenario?: string;
  preferredScenarioReason: string;
  preferredScenarioBasis: string[];

  noActionRiskSummary: string;
  evidenceNeededBeforeHigherConfidence: string[];

  authorityBoundary: {
    comparisonGrantsAuthority: false;
    requiresHumanDecision: true;
  };
}

export const SIMULATION_INVARIANTS = {
  NO_EXACT_PROBABILITY_WITHOUT_BASIS:
    "Probability bands required unless defensible data basis exists",
  LIMITATIONS_MANDATORY:
    "Every simulation must disclose active evidence gaps and known limits",
  AUTHORITY_PRESERVED:
    "Simulation cannot grant or restore authority; positive authority remains 0",
  FALSIFICATION_AWARE:
    "Confidence adjusted down where similar prior warnings were falsified",
  BLOCKED_PRODUCT_BOUNDARY:
    "Simulation cannot recommend blocked products as commercial routes",
  NO_AUTONOMOUS_DECISION:
    "Simulation is advice, not authority; human decision required",
  CONSEQUENCE_PATHS_NOT_PROPHECY:
    "Simulation shows plausible paths, not guaranteed outcomes",
};

export const PROBABILITY_BAND_MEANINGS = {
  not_enough_evidence: "Insufficient data to form probabilistic judgment",
  low: "Prior base rate or recurrence history suggests low likelihood",
  medium: "Evidence supports moderate likelihood; confidence band exists",
  high: "Strong evidence pattern; but falsification risk reduces certainty",
};
