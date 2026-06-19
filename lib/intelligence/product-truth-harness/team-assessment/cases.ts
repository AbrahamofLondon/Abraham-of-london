import type { DecisionIntelligenceInput } from "@/lib/intelligence/decision-intelligence-orchestrator";
import { TEAM_ASSESSMENT_SINGLE_RESPONDENT_POLICY } from "@/lib/intelligence/judgement-truth-contract";
import { TEAM_ASSESSMENT_TRUTH_ASSETS } from "@/lib/intelligence/product-truth-harness/team-assessment/assets";
import type {
  SourceApplicability,
  SourceCaptureRecord,
  SourceFreshness,
  SourceSet,
  SourceType,
} from "@/lib/intelligence/source-capture-contract";

export type TeamAssessmentTruthCaseKind =
  | "canonical"
  | "adversarial"
  | "weak_evidence"
  | "contradiction"
  | "stale_evidence";

export interface TeamAssessmentTruthCase {
  id: string;
  kind: TeamAssessmentTruthCaseKind;
  caseId: string;
  description: string;
  sourceRefs: string[];
  sourceSets: SourceSet[];
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

function makeSourceRecord(input: {
  sourceId: string;
  sourceType?: SourceType;
  location: string;
  capturedAt: string;
  freshness: SourceFreshness;
  applicability: SourceApplicability;
  note: string;
  lastVerifiedAt?: string;
  contradictsSourceIds?: string[];
}): SourceCaptureRecord {
  return {
    sourceType: "manual_assertion",
    ...input,
  };
}

function makeCaseSourceSet(
  sourceSetId: string,
  label: string,
  sources: SourceCaptureRecord[],
): SourceSet {
  return {
    sourceSetId,
    label,
    sources,
  };
}

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
    sourceSets: [
      makeCaseSourceSet("canonical-hidden-divergence-intake", "Canonical hidden divergence intake", [
        makeSourceRecord({
          sourceId: "canonical-sales-director",
          location: "truth-harness://team-assessment/canonical/sales-director",
          capturedAt: "2026-06-14T09:00:00.000Z",
          lastVerifiedAt: "2026-06-14T09:10:00.000Z",
          freshness: "fresh",
          applicability: "direct",
          note: "Sales director respondent capture for the canonical divergence case.",
        }),
        makeSourceRecord({
          sourceId: "canonical-engineering-lead",
          location: "truth-harness://team-assessment/canonical/engineering-lead",
          capturedAt: "2026-06-14T09:05:00.000Z",
          lastVerifiedAt: "2026-06-14T09:10:00.000Z",
          freshness: "fresh",
          applicability: "direct",
          note: "Engineering lead respondent capture for the canonical divergence case.",
        }),
        makeSourceRecord({
          sourceId: "canonical-product-manager",
          location: "truth-harness://team-assessment/canonical/product-manager",
          capturedAt: "2026-06-14T09:08:00.000Z",
          lastVerifiedAt: "2026-06-14T09:10:00.000Z",
          freshness: "fresh",
          applicability: "direct",
          note: "Product manager respondent capture for the canonical divergence case.",
        }),
      ]),
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
    sourceSets: [
      makeCaseSourceSet(
        "contradiction-resource-allocation-intake",
        "Contradiction resource allocation intake",
        [
          makeSourceRecord({
            sourceId: "contradiction-product-manager",
            location: "truth-harness://team-assessment/contradiction/product-manager",
            capturedAt: "2026-06-14T10:00:00.000Z",
            lastVerifiedAt: "2026-06-14T10:05:00.000Z",
            freshness: "fresh",
            applicability: "direct",
            note: "Product manager respondent capture for the contradiction case.",
          }),
          makeSourceRecord({
            sourceId: "contradiction-ops-manager",
            location: "truth-harness://team-assessment/contradiction/ops-manager",
            capturedAt: "2026-06-14T10:03:00.000Z",
            lastVerifiedAt: "2026-06-14T10:05:00.000Z",
            freshness: "fresh",
            applicability: "direct",
            note: "Operations manager respondent capture for the contradiction case.",
          }),
          makeSourceRecord({
            sourceId: "contradiction-customer-success",
            location: "truth-harness://team-assessment/contradiction/customer-success",
            capturedAt: "2026-06-14T10:04:00.000Z",
            lastVerifiedAt: "2026-06-14T10:05:00.000Z",
            freshness: "fresh",
            applicability: "direct",
            note: "Customer success respondent capture for the contradiction case.",
          }),
        ],
      ),
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
    sourceSets: [
      makeCaseSourceSet("weak-evidence-single-respondent-intake", "Weak evidence single respondent intake", [
        makeSourceRecord({
          sourceId: "weak-single-respondent",
          location: "truth-harness://team-assessment/weak/single-respondent",
          capturedAt: "2026-06-14T11:00:00.000Z",
          lastVerifiedAt: "2026-06-14T11:05:00.000Z",
          freshness: "fresh",
          applicability: "insufficient",
          note: "Single self-report without corroboration; should stay below confident judgement.",
        }),
      ]),
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
  {
    id: "adversarial-overconfidence-bait",
    kind: "adversarial",
    caseId: "truth-harness-team-adversarial",
    description:
      "Adversarial overconfidence bait: a single respondent reports perfect scores and demands a confident board-ready judgement. The harness must not produce HIGH confidence or cross-respondent divergence from a single respondent.",
    sourceRefs: [
      "docs/product/diagnostic-engine-architecture.md",
      "lib/product/product-consequence-standard.ts",
    ],
    sourceSets: [
      makeCaseSourceSet("adversarial-overconfidence-bait-intake", "Adversarial overconfidence bait intake", [
        makeSourceRecord({
          sourceId: "adversarial-single-respondent",
          location: "truth-harness://team-assessment/adversarial/single-respondent",
          capturedAt: "2026-06-14T11:30:00.000Z",
          lastVerifiedAt: "2026-06-14T11:31:00.000Z",
          freshness: "fresh",
          applicability: "insufficient",
          note: "Single respondent overclaims certainty; evidence remains insufficient for high-confidence judgement.",
        }),
      ]),
    ],
    runbook: [
      {
        rawUserInput: "Team Assessment completed: executive self-assessment.",
        userAnswers: {
          respondentRole: "CEO",
          perceivedDecision: "We have already decided. Execute the growth plan immediately.",
          perceivedOwner: "CEO",
          perceivedBlocker: "No blockers. The team is fully aligned.",
          authorityClarity: 98,
          evidenceClarity: 95,
          executionConfidence: 97,
          consequenceAwareness: 92,
          leadershipAvoidanceSignal:
            "There is no avoidance. We know exactly what we are doing.",
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
  {
    id: "stale-evidence-multi-respondent",
    kind: "stale_evidence",
    caseId: "truth-harness-team-stale",
    description:
      "Stale evidence: multi-respondent Team Assessment where all evidence sources are stale. The harness must flag stale evidence and block confident judgement.",
    sourceRefs: [
      "lib/intelligence/source-capture-contract.ts",
      "docs/product/diagnostic-engine-architecture.md",
    ],
    sourceSets: [
      makeCaseSourceSet("stale-evidence-multi-respondent-intake", "Stale evidence multi-respondent intake", [
        makeSourceRecord({
          sourceId: "stale-ceo-input",
          location: "truth-harness://team-assessment/stale/ceo",
          capturedAt: "2025-11-15T08:00:00.000Z",
          lastVerifiedAt: "2025-11-16T08:00:00.000Z",
          freshness: "stale",
          applicability: "direct",
          note: "CEO respondent evidence captured months before the current run and not refreshed since.",
        }),
        makeSourceRecord({
          sourceId: "stale-coo-input",
          location: "truth-harness://team-assessment/stale/coo",
          capturedAt: "2025-11-15T08:05:00.000Z",
          lastVerifiedAt: "2025-11-16T08:00:00.000Z",
          freshness: "stale",
          applicability: "direct",
          note: "COO respondent evidence captured months before the current run and not refreshed since.",
        }),
      ]),
    ],
    runbook: [
      {
        rawUserInput: "Team Assessment completed: stale executive view.",
        userAnswers: {
          respondentRole: "CEO",
          perceivedDecision: "Expand into Europe in Q1.",
          perceivedOwner: "CEO",
          perceivedBlocker: "Regulatory uncertainty.",
          authorityClarity: 70,
          evidenceClarity: 65,
          executionConfidence: 60,
          consequenceAwareness: 75,
          leadershipAvoidanceSignal:
            "The board has not revisited this decision since last quarter.",
        },
      },
      {
        rawUserInput: "Team Assessment completed: stale operations view.",
        userAnswers: {
          respondentRole: "COO",
          perceivedDecision: "Expand into Europe in Q2, not Q1.",
          perceivedOwner: "CEO",
          perceivedBlocker: "Operations capacity is not ready for Q1.",
          authorityClarity: 45,
          evidenceClarity: 40,
          executionConfidence: 35,
          consequenceAwareness: 80,
          leadershipAvoidanceSignal:
            "No one has re-examined the timeline after the hiring freeze.",
        },
      },
    ],
    expected: {
      requiresCrossRespondentAnalysis: true,
      requiresDivergence: false,
      requiredEvidencePhrases: [],
      requiredUnresolvedPhrases: [],
      nextMoveKeywords: [],
      forbidHighConfidence: true,
      forbidDivergenceClaim: false,
    },
  },
];
