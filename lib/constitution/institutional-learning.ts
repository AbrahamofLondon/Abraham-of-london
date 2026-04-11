import { buildCaseKey, buildOperatorKey } from "./memory-identity";
import { updateCaseMemory } from "./case-memory";
import { recordRecommendations } from "./recommendation-memory";
import { getOperatorMemory } from "./operator-memory";
import { buildLearningSnapshot } from "./learning-snapshot";
import type { AdvisoryMemo } from "./advisory-types";
import type { ConstitutionalDecision } from "./rules";

export function runInstitutionalLearning(input: {
  email?: string | null;
  name?: string | null;
  organisation?: string | null;
  problemStatement?: string | null;
  decision: ConstitutionalDecision;
  memo: AdvisoryMemo;
  readinessScore: number;
  seriousness: number;
  trajectory: string;
}) {
  const operatorKey = buildOperatorKey({
    email: input.email,
    organisation: input.organisation,
    name: input.name,
  });

  const caseKey = buildCaseKey({
    operatorKey,
    organisation: input.organisation,
    problemStatement: input.problemStatement,
  });

  const caseMemory = updateCaseMemory({
    caseKey,
    operatorKey,
    decision: input.decision,
    readinessScore: input.readinessScore,
    seriousness: input.seriousness,
    trajectory: input.trajectory,
    warnings: input.memo.warnings,
    tags: [input.memo.route, input.trajectory],
  });

  const recommendationMemory = recordRecommendations({
    caseKey,
    recommendations: input.memo.recommendations,
  });

  const operatorMemory = getOperatorMemory(operatorKey);
  const snapshot = buildLearningSnapshot();

  return {
    operatorKey,
    caseKey,
    caseMemory,
    recommendationMemory,
    operatorMemory,
    snapshot,
  };
}