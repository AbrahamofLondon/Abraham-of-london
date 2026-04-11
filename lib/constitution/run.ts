/* lib/constitution/run.ts */
import { scoreClarity, scoreCoherence, detectAuthority, scoreReadiness } from "./scoring";
import { detectFailureModes } from "./failure";
import { classifyReadiness, classifyPosture } from "./classification";
import { decideRoute } from "./routing";
import { decomposeNarrative } from "./decompose";
import { detectContradictions } from "./contradictions";
import { scoreSeriousness } from "./seriousness";
import { inferEconomicWeight } from "./economic";
import { validateNarrativeIntegrity } from "./integrity";
import { inferTrajectory } from "./trajectory";
import { simulateDecisionRisk } from "./simulation";
import { shouldEscalate } from "./escalation";
import { updateMemory } from "./memory";
import { buildScenarios } from "./scenario";
import { buildConsequenceTree } from "./consequence";
import { generateChallenges } from "./adversarial";
import { buildDecisionFrame } from "./framing";
import { synthesisePosture } from "./synthesis";

export type ConstitutionalRunInput = {
  problemStatement: string;
  role: string;
  email?: string;
};

export type ConstitutionalRunResult = {
  route: string;
  confidence: number;
  disqualifiers: string[];
  trajectory: any;
  risks: any;
  seriousness: number;
  economicWeight: string;
  scenarios: any;
  consequences: any;
  challenges: any;
  decisionFrame: any;
  synthesisedPosture: any;
};

export function runConstitution(input: ConstitutionalRunInput): ConstitutionalRunResult {
  const text = input.problemStatement.trim();

  if (!text) {
    throw new Error("Problem statement is required");
  }

  // Core scoring
  const clarity = scoreClarity(text);
  const coherence = scoreCoherence(text);
  const authority = detectAuthority(input.role);
  const readinessScore = scoreReadiness(clarity, coherence, authority);

  // Classification
  const readinessTier = classifyReadiness(readinessScore);
  const posture = classifyPosture(clarity, coherence);

  // Analysis
  const failureModes = detectFailureModes(clarity, coherence, authority);
  const narrative = decomposeNarrative(text);
  const contradictions = detectContradictions(text);
  const seriousness = scoreSeriousness(text);
  const economicWeight = inferEconomicWeight(text);
  const integrityIssues = validateNarrativeIntegrity({
    problem: narrative.problem || "",
    constraint: narrative.constraint || "",
    outcome: narrative.outcome || "",
  });

  const trajectory = inferTrajectory(clarity, readinessScore, failureModes);
  const risks = simulateDecisionRisk({ trajectory, readiness: readinessScore, authority });
  const escalate = shouldEscalate({ trajectory, readiness: readinessScore, authority, seriousness });

  let disqualifiers: string[] = [
    ...contradictions,
    ...integrityIssues.issues,
  ];

  if (seriousness < 40) disqualifiers.push("Insufficient seriousness");
  if (economicWeight === "LOW") disqualifiers.push("Low economic weight");

  // Final routing decision
  let result = decideRoute({
    clarity,
    coherence,
    authority,
    readinessScore,
    readinessTier,
    posture,
    failureModes: failureModes as import("./engine").FailureMode[],
    route: "DIAGNOSTIC",
    confidence: 0,
    disqualifiers,
  });

  // Safety gate
  if (!escalate && result.route === "STRATEGY") {
    result.route = "DIAGNOSTIC";
    result.disqualifiers.push("Escalation not justified by trajectory");
  }

  // Memory update
  if (input.email) {
    updateMemory(input.email, result.route);
  }

  // Rich outputs
  const scenarios = buildScenarios({ readiness: readinessScore, authority, trajectory });
  const consequences = buildConsequenceTree({ trajectory, readiness: readinessScore });
  const challenges = generateChallenges({ clarity, coherence, seriousness });
  const decisionFrame = buildDecisionFrame({ readiness: readinessScore, trajectory });
  const synthesisedPosture = synthesisePosture({ readiness: readinessScore, trajectory, authority });

  return {
    ...result,
    trajectory,
    risks,
    seriousness,
    economicWeight,
    scenarios,
    consequences,
    challenges,
    decisionFrame,
    synthesisedPosture,
  };
}