import { isBoardroomIntakeComplete, type BoardroomIntakeContract } from "@/lib/boardroom/boardroom-intake-contract";
import type { BoardroomBriefComposition } from "@/lib/boardroom/boardroom-brief-composer";

export interface BoardroomValueReadinessResult {
  scoreOutOf10: number;
  approvalAllowed: boolean;
  blockingReasons: string[];
}

const REQUIRED_SECTIONS: Array<keyof BoardroomBriefComposition> = [
  "executiveJudgement",
  "situationFraming",
  "inputBasis",
  "coreDecisionTension",
  "evidenceInterpretation",
  "strategicDiagnosis",
  "commercialConsequence",
  "decisionOptions",
  "falsificationChallenge",
  "riskAndDependencyMap",
  "recommendedNextMove",
  "seventyTwoHourExecutionSequence",
  "operatorReviewNotes",
];

export function assessBoardroomValueReadiness(
  intake: Partial<BoardroomIntakeContract>,
  brief: Partial<BoardroomBriefComposition>,
): BoardroomValueReadinessResult {
  const blockingReasons: string[] = [];
  if (!isBoardroomIntakeComplete(intake)) blockingReasons.push("Boardroom intake is incomplete.");
  for (const section of REQUIRED_SECTIONS) {
    const value = brief[section];
    if (Array.isArray(value) ? value.length === 0 : typeof value !== "string" || value.trim().length === 0) {
      blockingReasons.push(`Missing boardroom section: ${section}`);
    }
  }
  const scoreOutOf10 = blockingReasons.length === 0 ? 9.8 : Math.max(0, 9.8 - blockingReasons.length);
  return {
    scoreOutOf10,
    approvalAllowed: scoreOutOf10 >= 9.8 && blockingReasons.length === 0,
    blockingReasons,
  };
}
