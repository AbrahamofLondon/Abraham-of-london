import type { BoardroomIntakeContract } from "@/lib/boardroom/boardroom-intake-contract";

export interface BoardroomBriefComposition {
  executiveJudgement: string;
  situationFraming: string;
  inputBasis: string[];
  coreDecisionTension: string;
  evidenceInterpretation: string;
  strategicDiagnosis: string;
  commercialConsequence: string;
  decisionOptions: string[];
  falsificationChallenge: string;
  riskAndDependencyMap: string[];
  recommendedNextMove: string;
  seventyTwoHourExecutionSequence: string[];
  operatorReviewNotes: string;
}

export function composeBoardroomBrief(intake: BoardroomIntakeContract): BoardroomBriefComposition {
  return {
    executiveJudgement: `The decision should be governed against the success definition: ${intake.definitionOfSuccess}.`,
    situationFraming: intake.commercialContext,
    inputBasis: intake.availableEvidence,
    coreDecisionTension: intake.currentConstraint,
    evidenceInterpretation: "Evidence must be interpreted against urgency, stakeholder exposure, and consequence of delay.",
    strategicDiagnosis: "The brief is gold-standard only when it converts intake into consequence, options, challenge, and execution.",
    commercialConsequence: intake.consequenceOfDelay,
    decisionOptions: intake.optionsAlreadyConsidered,
    falsificationChallenge: "Name the strongest reason this judgement could be wrong and what evidence would change it.",
    riskAndDependencyMap: intake.stakeholders.map((stakeholder) => `${stakeholder}: dependency or approval risk to resolve.`),
    recommendedNextMove: "Approve only the smallest decision that preserves learning and reduces irreversible exposure.",
    seventyTwoHourExecutionSequence: [
      "Confirm owner, decision boundary, and evidence gap.",
      "Run the minimum action that tests the core tension.",
      "Reconvene on evidence movement, risk change, and escalation need.",
    ],
    operatorReviewNotes: "Operator review must confirm value-readiness score, intake completeness, and delivery safety before approval.",
  };
}
