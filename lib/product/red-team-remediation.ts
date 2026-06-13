/**
 * lib/product/red-team-remediation.ts
 *
 * Red-Team Remediation
 *
 * When red-team review fails, this module produces a correction plan
 * instead of suggesting downgrade.
 *
 * Maps reviewer rejection reasons to specific engine-layer fixes.
 */

export type EngineLayer =
  | "input_interpretation"
  | "signal_extraction"
  | "falsification_pressure"
  | "execution_translation"
  | "output_distillation"
  | "market_comparison"
  | "case_derivation"
  | "operator_accountability";

export interface ReviewerRejection {
  /** Which reviewer role rejected the output */
  reviewer:
    | "skeptical_executive"
    | "busy_operator"
    | "commercial_buyer"
    | "experienced_consultant"
    | "returning_user";

  /** Why the output was rejected */
  rejectionReason: string;

  /** Severity: critical (blocks gold), warning (lowers score), informational */
  severity: "critical" | "warning" | "informational";

  /** Score given by reviewer (out of 10) */
  score: number;
}

export interface RedTeamRemediation {
  /** The rejection that triggered remediation */
  rejection: ReviewerRejection;

  /** What must be corrected in the output */
  requiredCorrection: string;

  /** Which engine layer must be fixed */
  engineLayerToFix: EngineLayer;

  /** Specific functions or logic to modify */
  targetFunctions: string[];

  /** How to measure success of the fix */
  successCriteria: string;

  /** Estimated effort in days */
  estimatedEffort: number;

  /** Priority: immediate (blocks gold), high, medium, low */
  priority: "immediate" | "high" | "medium" | "low";
}

/**
 * Map reviewer rejections to remediation plans
 */
export function generateRemediationFromRejection(rejection: ReviewerRejection): RedTeamRemediation {
  // Skeptical Executive: "Decision logic exists but doesn't address equity cliff risk specifically"
  if (rejection.reviewer === "skeptical_executive") {
    if (rejection.rejectionReason.includes("generic") || rejection.rejectionReason.includes("doesn't address")) {
      return {
        rejection,
        requiredCorrection: "Extract case-specific risks and pressure-test them explicitly",
        engineLayerToFix: "falsification_pressure",
        targetFunctions: ["generateFalsificationPressure", "extractTestableAssumption"],
        successCriteria:
          "Output names the specific risk scenario and identifies evidence that would change judgment",
        estimatedEffort: 2,
        priority: "immediate",
      };
    }
  }

  // Busy Operator: "Would take me 15+ minutes to extract actionable next step"
  if (rejection.reviewer === "busy_operator") {
    if (rejection.rejectionReason.includes("rehashing") || rejection.rejectionReason.includes("actionable")) {
      return {
        rejection,
        requiredCorrection: "Distill input echo and lead with accountable next move",
        engineLayerToFix: "output_distillation",
        targetFunctions: ["distillDecisionOutput", "convertToAccountableNextMove"],
        successCriteria:
          "Output's first section is the next move (action + owner + deadline); input echo < 20%",
        estimatedEffort: 1,
        priority: "immediate",
      };
    }
  }

  // Commercial Buyer: "For this price, I'd expect deeper equity/control analysis"
  if (rejection.reviewer === "commercial_buyer") {
    if (rejection.rejectionReason.includes("deeper") || rejection.rejectionReason.includes("specific")) {
      return {
        rejection,
        requiredCorrection: "Add domain-specific reasoning depth; don't generic-AI generic",
        engineLayerToFix: "signal_extraction",
        targetFunctions: ["extractTestableAssumptions", "generateFalsificationPressure"],
        successCriteria:
          "Output addresses domain-specific tradeoffs (e.g., equity cliff mechanics); outperforms ChatGPT on same scenario",
        estimatedEffort: 3,
        priority: "high",
      };
    }
  }

  // Experienced Consultant: "Treats co-founder decision as generic partnership"
  if (rejection.reviewer === "experienced_consultant") {
    if (rejection.rejectionReason.includes("generic") || rejection.rejectionReason.includes("misses")) {
      return {
        rejection,
        requiredCorrection: "Recognize decision type and apply domain-specific reasoning",
        engineLayerToFix: "case_derivation",
        targetFunctions: ["detectDecisionType", "applyDomainSpecificLogic"],
        successCriteria:
          "Output correctly identifies decision type and applies type-specific frameworks (co-founder != partnership)",
        estimatedEffort: 2,
        priority: "high",
      };
    }
  }

  // Returning User: "Case-specific output; low reuse value"
  if (rejection.reviewer === "returning_user") {
    if (rejection.rejectionReason.includes("reuse") || rejection.rejectionReason.includes("framework")) {
      return {
        rejection,
        requiredCorrection: "Extract reusable decision framework from case-specific logic",
        engineLayerToFix: "execution_translation",
        targetFunctions: ["generateDecisionFramework", "extractReusableLogic"],
        successCriteria:
          "Output includes both case-specific judgment AND reusable framework that applies to similar decisions",
        estimatedEffort: 2,
        priority: "medium",
      };
    }
  }

  // Default remediation for unknown rejection
  return {
    rejection,
    requiredCorrection: "Review output against rejection reason; improve specificity and actionability",
    engineLayerToFix: "output_distillation",
    targetFunctions: ["review_and_improve"],
    successCriteria: "Output addresses the specific rejection reason",
    estimatedEffort: 1,
    priority: "medium",
  };
}

/**
 * Roll up all rejections from red-team panel into remediation plan
 */
export function generateRemediationPlanFromPanel(rejections: ReviewerRejection[]): {
  remediations: RedTeamRemediation[];
  criticalIssues: RedTeamRemediation[];
  totalEstimatedEffort: number;
  recommendedSequence: string;
} {
  const remediations = rejections.map(generateRemediationFromRejection);

  const criticalIssues = remediations.filter((r) => r.priority === "immediate");

  const totalEffort = remediations.reduce((sum, r) => sum + r.estimatedEffort, 0);

  // Determine sequence: fix critical first, then high-priority
  const sequence =
    criticalIssues.length > 0
      ? `Fix ${criticalIssues.length} critical issues first (${criticalIssues
          .map((r) => r.engineLayerToFix)
          .join(", ")}), then remaining ${remediations.length - criticalIssues.length} issues`
      : `Address ${remediations.length} issues in priority order`;

  return {
    remediations,
    criticalIssues,
    totalEstimatedEffort: totalEffort,
    recommendedSequence: sequence,
  };
}

/**
 * Translate remediation into concrete code changes
 */
export function translateRemediationToCodeChanges(remediation: RedTeamRemediation): {
  filesToModify: string[];
  functionsToAdd: string[];
  functionsToModify: string[];
  description: string;
} {
  const engineLayerToFile: Record<EngineLayer, string> = {
    input_interpretation: "lib/judgement/decision-input-parser.ts",
    signal_extraction: "lib/judgement/signal-extraction-engine.ts",
    falsification_pressure: "lib/judgement/decision-output-distiller.ts",
    execution_translation: "lib/judgement/execution-translator.ts",
    output_distillation: "lib/judgement/decision-output-distiller.ts",
    market_comparison: "lib/product/market-comparison-engine.ts",
    case_derivation: "lib/product/decision-instrument-gold-composer.ts",
    operator_accountability: "lib/judgement/decision-output-distiller.ts",
  };

  const file = engineLayerToFile[remediation.engineLayerToFix];

  return {
    filesToModify: [file].filter(Boolean),
    functionsToAdd: remediation.targetFunctions.filter((f) => f.startsWith("new_")),
    functionsToModify: remediation.targetFunctions,
    description: remediation.requiredCorrection,
  };
}

export default {
  generateRemediationFromRejection,
  generateRemediationPlanFromPanel,
  translateRemediationToCodeChanges,
};
