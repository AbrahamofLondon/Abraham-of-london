import {
  runDecisionIntelligence,
  type DecisionIntelligenceResult,
} from "@/lib/intelligence/decision-intelligence-orchestrator";
import {
  evaluateJudgementAgainstDelivery,
  getJudgementVsDeliveryTruth,
} from "@/lib/intelligence/judgement-truth-contract";
import {
  TEAM_ASSESSMENT_TRUTH_CASES,
  type TeamAssessmentTruthCase,
} from "@/lib/intelligence/product-truth-harness/team-assessment/cases";
import { _resetMemoryStore } from "@/lib/product/diagnostic-journey-store";

export interface TeamAssessmentTruthCaseRun {
  id: string;
  kind: TeamAssessmentTruthCase["kind"];
  description: string;
  sourceRefs: string[];
  passed: boolean;
  observedJudgementScore: number;
  allowedReleaseScore: number;
  effectiveCeiling: number;
  releaseCeilingReasons: string[];
  violationReasons: string[];
  respondentCount: number;
  rawResult: DecisionIntelligenceResult;
}

export interface TeamAssessmentTruthHarnessRun {
  surface: "team_assessment";
  generatedAt: string;
  passed: boolean;
  effectiveCeiling: number;
  sourceRefs: string[];
  cases: TeamAssessmentTruthCaseRun[];
}

function includesAll(haystack: string, needles: string[]): boolean {
  return needles.every((needle) => haystack.includes(needle.toLowerCase()));
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle.toLowerCase()));
}

function hasSpecificMove(text: string): boolean {
  return (
    text.trim().length >= 40 &&
    /\b(resolve|map|name|compare|assign|lock|validate|treat)\b/i.test(text)
  );
}

function deriveObservedJudgementScore(
  result: DecisionIntelligenceResult,
  respondentCount: number,
): number {
  const lowerEvidenceBasis = result.evidenceBasis.join(" ").toLowerCase();
  const lowerUnresolved = result.unresolvedItems.join(" ").toLowerCase();
  const claimsDivergence = /team divergence detected|ownership divergence|blocker divergence/.test(
    `${lowerEvidenceBasis} ${lowerUnresolved}`,
  );

  let score = respondentCount >= 3 ? 5 : respondentCount >= 2 ? 4 : 1;
  if (result.confidence === "MEDIUM") score += 1;
  if (result.confidence === "HIGH") score += 2;
  if (claimsDivergence) score += 1;
  if (hasSpecificMove(result.nextAdmissibleMove)) score += 1;
  if (/authority perception gap|evidence confidence gap|unresolved contradiction/.test(lowerUnresolved)) {
    score += 1;
  }

  return Math.max(0, Math.min(10, score));
}

export function evaluateTeamAssessmentTruthCase(
  caseDefinition: TeamAssessmentTruthCase,
  result: DecisionIntelligenceResult,
): TeamAssessmentTruthCaseRun {
  const respondentCount = caseDefinition.runbook.length;
  const evidenceText = result.evidenceBasis.join(" ").toLowerCase();
  const unresolvedText = result.unresolvedItems.join(" ").toLowerCase();
  const engineTraceEntry = result.engineTrace?.find(
    (entry) => entry.engineId === "cross-respondent-analysis",
  );
  const claimsCrossRespondentDivergence =
    /team divergence detected|ownership divergence|blocker divergence|authority perception gap|evidence confidence gap/.test(
      `${evidenceText} ${unresolvedText}`,
    );

  const observedJudgementScore = deriveObservedJudgementScore(
    result,
    respondentCount,
  );

  const contractEvaluation = evaluateJudgementAgainstDelivery({
    surface: "team_assessment",
    proposedJudgementScore: observedJudgementScore,
    respondentCount,
    confidence: result.confidence,
    claimsCrossRespondentDivergence,
  });

  const violationReasons = [...contractEvaluation.violationReasons];

  if (
    caseDefinition.expected.requiresCrossRespondentAnalysis &&
    engineTraceEntry?.status !== "USED"
  ) {
    violationReasons.push(
      'Expected "cross-respondent-analysis" to be USED for a multi-respondent truth case.',
    );
  }

  if (
    !caseDefinition.expected.requiresCrossRespondentAnalysis &&
    engineTraceEntry?.status !== "SKIPPED_GATED"
  ) {
    violationReasons.push(
      'Expected "cross-respondent-analysis" to be SKIPPED_GATED for a single-respondent truth case.',
    );
  }

  if (
    caseDefinition.expected.requiredEvidencePhrases.length > 0 &&
    !includesAll(evidenceText, caseDefinition.expected.requiredEvidencePhrases)
  ) {
    violationReasons.push(
      `Missing required evidence phrases: ${caseDefinition.expected.requiredEvidencePhrases.join(
        ", ",
      )}.`,
    );
  }

  if (
    caseDefinition.expected.requiredUnresolvedPhrases.length > 0 &&
    !includesAll(unresolvedText, caseDefinition.expected.requiredUnresolvedPhrases)
  ) {
    violationReasons.push(
      `Missing required unresolved phrases: ${caseDefinition.expected.requiredUnresolvedPhrases.join(
        ", ",
      )}.`,
    );
  }

  if (
    caseDefinition.expected.requiresDivergence &&
    !claimsCrossRespondentDivergence
  ) {
    violationReasons.push(
      "Expected planted respondent contradiction to surface as divergence, but it did not.",
    );
  }

  if (
    caseDefinition.expected.forbidDivergenceClaim &&
    claimsCrossRespondentDivergence
  ) {
    violationReasons.push(
      "Weak-evidence case incorrectly claimed cross-respondent divergence.",
    );
  }

  if (
    caseDefinition.expected.forbidHighConfidence &&
    result.confidence === "HIGH"
  ) {
    const label =
      caseDefinition.kind === "stale_evidence"
        ? "Stale-evidence"
        : caseDefinition.kind === "adversarial"
          ? "Adversarial"
          : "Weak-evidence";
    violationReasons.push(
      `${label} case incorrectly claimed HIGH confidence.`,
    );
  }

  if (
    caseDefinition.expected.nextMoveKeywords.length > 0 &&
    !includesAny(
      result.nextAdmissibleMove.toLowerCase(),
      caseDefinition.expected.nextMoveKeywords,
    )
  ) {
    violationReasons.push(
      `Next move missed the expected governance vocabulary: ${caseDefinition.expected.nextMoveKeywords.join(
        ", ",
      )}.`,
    );
  }

  if (
    caseDefinition.expected.requiresDivergence &&
    !hasSpecificMove(result.nextAdmissibleMove)
  ) {
    violationReasons.push(
      "Contradiction case returned a generic next move instead of a governed correction.",
    );
  }

  if (
    caseDefinition.expected.minObservedJudgementScore !== undefined &&
    observedJudgementScore < caseDefinition.expected.minObservedJudgementScore
  ) {
    violationReasons.push(
      `Observed judgement score ${observedJudgementScore} is below the required floor of ${caseDefinition.expected.minObservedJudgementScore}.`,
    );
  }

  if (
    caseDefinition.expected.maxObservedJudgementScore !== undefined &&
    observedJudgementScore > caseDefinition.expected.maxObservedJudgementScore
  ) {
    violationReasons.push(
      `Observed judgement score ${observedJudgementScore} exceeds the allowed weak-evidence ceiling of ${caseDefinition.expected.maxObservedJudgementScore}.`,
    );
  }

  // Stale-evidence-specific checks
  if (caseDefinition.kind === "stale_evidence") {
    const allText = `${evidenceText} ${unresolvedText}`;
    if (!/stale/i.test(allText) && !/outdated/i.test(allText) && !/expired/i.test(allText)) {
      violationReasons.push(
        "Stale-evidence case did not flag any evidence as stale, outdated, or expired.",
      );
    }
    if (result.confidence === "HIGH") {
      violationReasons.push(
        "Stale-evidence case must not produce HIGH confidence.",
      );
    }
  }

  return {
    id: caseDefinition.id,
    kind: caseDefinition.kind,
    description: caseDefinition.description,
    sourceRefs: caseDefinition.sourceRefs,
    passed: violationReasons.length === 0,
    observedJudgementScore,
    allowedReleaseScore: contractEvaluation.allowedReleaseScore,
    effectiveCeiling: contractEvaluation.effectiveCeiling,
    releaseCeilingReasons: contractEvaluation.releaseCeilingReasons,
    violationReasons,
    respondentCount,
    rawResult: result,
  };
}

export async function runTeamAssessmentTruthCase(
  caseDefinition: TeamAssessmentTruthCase,
): Promise<TeamAssessmentTruthCaseRun> {
  _resetMemoryStore();

  let result: DecisionIntelligenceResult | null = null;

  for (const step of caseDefinition.runbook) {
    result = await runDecisionIntelligence({
      surface: "team_assessment",
      rawUserInput: step.rawUserInput,
      userAnswers: step.userAnswers as Record<string, unknown>,
      persistJourney: true,
      caseId: caseDefinition.caseId,
    });
  }

  if (!result) {
    throw new Error(`Truth harness case "${caseDefinition.id}" produced no result.`);
  }

  return evaluateTeamAssessmentTruthCase(caseDefinition, result);
}

export async function runTeamAssessmentTruthHarness(): Promise<TeamAssessmentTruthHarnessRun> {
  const truth = getJudgementVsDeliveryTruth("team_assessment");
  if (!truth) {
    throw new Error("Missing judgement-vs-delivery truth contract for team_assessment.");
  }

  const runs: TeamAssessmentTruthCaseRun[] = [];
  for (const caseDefinition of TEAM_ASSESSMENT_TRUTH_CASES) {
    runs.push(await runTeamAssessmentTruthCase(caseDefinition));
  }

  return {
    surface: "team_assessment",
    generatedAt: new Date().toISOString(),
    passed: runs.every((run) => run.passed),
    effectiveCeiling: truth.effectiveCeiling,
    sourceRefs: [...new Set(runs.flatMap((run) => run.sourceRefs))],
    cases: runs,
  };
}
