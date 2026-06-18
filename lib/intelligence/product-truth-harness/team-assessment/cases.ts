import type { DecisionIntelligenceInput } from "@/lib/intelligence/decision-intelligence-orchestrator";
import { TEAM_ASSESSMENT_SINGLE_RESPONDENT_POLICY } from "@/lib/intelligence/judgement-truth-contract";
import { TEAM_ASSESSMENT_TRUTH_ASSETS } from "@/lib/intelligence/product-truth-harness/team-assessment/assets";

export type TeamAssessmentTruthCaseKind =
  | "canonical"
  | "contradiction"
  | "weak_evidence";

export interface TeamAssessmentTruthCase {
  id: string;
  kind: TeamAssessmentTruthCaseKind;
  caseId: string;
  description: string;
  sourceRefs: string[];
  runbook: Array<Pick<DecisionIntelligenceInput, "rawUserInput" | "userAnswers">>;
  expected: {
    requiresCrossRespondentAnalysis: boolean;
    requiresDivergence: boolean;
    requiredEvidencePhrases: string[];
    requiredUnresolvedPhrases: string[];
    nextMoveKeywords: string[];
    forbidHighConfidence: boolean;
    forbidDivergenceClaim: boolean;
    minObservedJudgementScore?: number;
    maxObservedJudgementScore?: number;
  };
}

const canonicalKeywords = ["divergence", "decision", "team"];
const contradictionKeywords = ["resolve", "divergence", "decision"];

export const TEAM_ASSESSMENT_TRUTH_CASES: TeamAssessmentTruthCase[] = [
  {
    id: "canonical-hidden-divergence",
    kind: "canonical",
    caseId: "truth-harness-team-canonical",
    description: `${TEAM_ASSESSMENT_TRUTH_ASSETS.canonicalScenario.description} using ${TEAM_ASSESSMENT_TRUTH_ASSETS.teamAlignmentIllusion.title}.`,
    sourceRefs: [
      "lib/validation/frozen-scenario-sets-v2.ts",
      TEAM_ASSESSMENT_TRUTH_ASSETS.teamAlignmentIllusion.relativePath,
      TEAM_ASSESSMENT_TRUTH_ASSETS.hiddenDivergenceOutcome.relativePath,
      "lib/product/team-assessment-gold-composer.ts",
    ],
    runbook: [
      {
        rawUserInput: "Team Assessment completed: executive view.",
        userAnswers: {
          respondentRole: "Sales Director",
          perceivedDecision: "Enter the enterprise SaaS market in Q3.",
          perceivedOwner: "CEO",
          perceivedBlocker: "Engineering timeline does not support the date already promised to prospects.",
          authorityClarity: 74,
          evidenceClarity: 61,
          executionConfidence: 52,
          consequenceAwareness: 83,
          leadershipAvoidanceSignal:
            "Leadership says alignment is high but avoids naming which success metric wins.",
        },
      },
      {
        rawUserInput: "Team Assessment completed: engineering view.",
        userAnswers: {
          respondentRole: "Engineering Lead",
          perceivedDecision: "Delay the enterprise rollout until platform reliability is ready.",
          perceivedOwner: "COO",
          perceivedBlocker: "Sales committed dates before the delivery sequence was agreed.",
          authorityClarity: 38,
          evidenceClarity: 47,
          executionConfidence: 36,
          consequenceAwareness: 79,
          leadershipAvoidanceSignal:
            "No one wants to state whether reliability or revenue target is the real decision.",
        },
      },
      {
        rawUserInput: "Team Assessment completed: product view.",
        userAnswers: {
          respondentRole: "Product Manager",
          perceivedDecision:
            "Decide whether success means revenue this half or product readiness next half.",
          perceivedOwner: "CEO",
          perceivedBlocker: "Conflicting success definitions are driving conflicting work queues.",
          authorityClarity: 42,
          evidenceClarity: 44,
          executionConfidence: 41,
          consequenceAwareness: 76,
          leadershipAvoidanceSignal:
            "The success definition changes depending on who is in the room.",
        },
      },
    ],
    expected: {
      requiresCrossRespondentAnalysis: true,
      requiresDivergence: true,
      requiredEvidencePhrases: [
        "Team divergence detected",
        "3 respondent(s) assessed.",
        "different owner(s) identified",
        "different blocker(s) identified",
      ],
      requiredUnresolvedPhrases: [
        "Ownership divergence",
        "Blocker divergence",
        "Authority perception gap",
      ],
      nextMoveKeywords: canonicalKeywords,
      forbidHighConfidence: false,
      forbidDivergenceClaim: false,
      minObservedJudgementScore: 6,
    },
  },
  {
    id: "contradiction-resource-allocation",
    kind: "contradiction",
    caseId: "truth-harness-team-contradiction",
    description: `${TEAM_ASSESSMENT_TRUTH_ASSETS.contradictionScenario.description} with planted cross-respondent contradictions.`,
    sourceRefs: [
      "lib/validation/frozen-scenario-sets-v2.ts",
      TEAM_ASSESSMENT_TRUTH_ASSETS.teamAlignmentIllusion.relativePath,
    ],
    runbook: [
      {
        rawUserInput: "Team Assessment completed: product allocation view.",
        userAnswers: {
          respondentRole: "Product Manager",
          perceivedDecision: "Fund Initiative A immediately and hold the support backlog flat.",
          perceivedOwner: "Chief Product Officer",
          perceivedBlocker: "Operations is delaying the roadmap without authority.",
          authorityClarity: 82,
          evidenceClarity: 78,
          executionConfidence: 66,
          consequenceAwareness: 71,
          leadershipAvoidanceSignal:
            "Leadership avoids naming which initiative is allowed to slip.",
        },
      },
      {
        rawUserInput: "Team Assessment completed: operations allocation view.",
        userAnswers: {
          respondentRole: "Ops Manager",
          perceivedDecision: "Pause Initiative A until support load is reduced.",
          perceivedOwner: "COO",
          perceivedBlocker: "Product committed work without operational capacity.",
          authorityClarity: 22,
          evidenceClarity: 33,
          executionConfidence: 29,
          consequenceAwareness: 84,
          leadershipAvoidanceSignal:
            "Nobody will say whether service stability outranks roadmap promises.",
        },
      },
      {
        rawUserInput: "Team Assessment completed: customer success allocation view.",
        userAnswers: {
          respondentRole: "Customer Success Manager",
          perceivedDecision:
            "Reallocate budget to the backlog before any new initiative goes live.",
          perceivedOwner: "CFO",
          perceivedBlocker: "The team does not agree on what success requires right now.",
          authorityClarity: 18,
          evidenceClarity: 28,
          executionConfidence: 24,
          consequenceAwareness: 88,
          leadershipAvoidanceSignal:
            "Escalation is politically unsafe because the wrong answer is expensive.",
        },
      },
    ],
    expected: {
      requiresCrossRespondentAnalysis: true,
      requiresDivergence: true,
      requiredEvidencePhrases: [
        "Team divergence detected",
        "3 respondent(s) assessed.",
        "different owner(s) identified",
        "different blocker(s) identified",
      ],
      requiredUnresolvedPhrases: [
        "Ownership divergence",
        "Blocker divergence",
        "Authority perception gap",
        "Respondents are not describing the same decision.",
      ],
      nextMoveKeywords: contradictionKeywords,
      forbidHighConfidence: false,
      forbidDivergenceClaim: false,
      minObservedJudgementScore: 6,
    },
  },
  {
    id: "weak-evidence-single-respondent",
    kind: "weak_evidence",
    caseId: "truth-harness-team-weak",
    description: "Single-respondent Team Assessment should stay below the divergence and confidence ceiling.",
    sourceRefs: [
      "docs/product/diagnostic-engine-architecture.md",
      "lib/product/product-consequence-standard.ts",
    ],
    runbook: [
      {
        rawUserInput: "Team Assessment completed: watch.",
        userAnswers: {
          respondentRole: "Director",
          perceivedDecision: "Improve alignment.",
          perceivedOwner: "Leadership",
          perceivedBlocker: "Communication.",
          authorityClarity: 55,
          evidenceClarity: 50,
          executionConfidence: 49,
          consequenceAwareness: 45,
          leadershipAvoidanceSignal: "maybe",
        },
      },
    ],
    expected: {
      requiresCrossRespondentAnalysis: false,
      requiresDivergence: false,
      requiredEvidencePhrases: [
        "Single respondent only; team divergence cannot yet be assessed.",
      ],
      requiredUnresolvedPhrases: [],
      nextMoveKeywords: [],
      forbidHighConfidence: true,
      forbidDivergenceClaim: true,
      maxObservedJudgementScore:
        TEAM_ASSESSMENT_SINGLE_RESPONDENT_POLICY.maxJudgementScore,
    },
  },
];
