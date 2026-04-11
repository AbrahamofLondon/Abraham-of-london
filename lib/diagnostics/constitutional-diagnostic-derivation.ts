/* ============================================================================
   FILE: lib/constitution/constitutional-diagnostic-derivation.ts
   PURPOSE:
   - Shared derivation layer for the constitutional intake
   - Converts raw diagnostic answers into:
     1. scored domain outputs
     2. micro-report
     3. constitutional engine input
     4. presentation-ready route summary
   NOTES:
   - No React
   - Deterministic and auditable
   - Safe to reuse from UI, API, exports, and future team/enterprise layers
============================================================================ */

import {
  evaluateConstitutionalRoute,
  type AuthorityType,
  type ConstitutionInput,
  type ConstitutionalDecision,
  type OrgPosture,
  type ReadinessTier,
} from "@/lib/constitution/rules";

export type LikertValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type DiagnosticAnswerValue = {
  resonance: LikertValue;
  certainty: LikertValue;
};

export type DiagnosticQuestionDomain =
  | "coherence"
  | "authority"
  | "environment"
  | "execution"
  | "trust"
  | "friction"
  | "stakes"
  | "pattern"
  | "pressure";

export type DiagnosticQuestion = {
  id: string;
  text: string;
  domain: DiagnosticQuestionDomain;
  reverse?: boolean;
};

export type DiagnosticAnswers = Record<string, DiagnosticAnswerValue>;

export type DomainScoreSet = {
  authorityScore: number;
  coherenceScore: number;
  pressureScore: number;
  frictionScore: number;
  trustScore: number;
  seriousnessScore: number;
  governanceDiscipline: number;
  interventionReadiness: number;
  narrativeCoherence: number;
  failureModeCount: number;
  failureModeSeverity: number;
};

export type ConstitutionalMicroReport = DomainScoreSet & {
  authorityType: AuthorityType;
  posture: OrgPosture;
  readinessTier: ReadinessTier;
  mandateFit: boolean;
  summary: string;
  keyFindings: string[];
  answeredCount: number;
  totalQuestions: number;
  completionPercent: number;
};

export type ConstitutionalRouteSummary = {
  route:
    | "PENDING"
    | "DIAGNOSTIC"
    | "EXECUTIVE_REPORTING"
    | "STRATEGY_ROOM"
    | "STRATEGY";
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: "neutral" | "amber" | "emerald";
};

export type ConstitutionalDiagnosticBundle = {
  report: ConstitutionalMicroReport;
  constitutionalInput: ConstitutionInput;
  decision: ConstitutionalDecision;
  routeSummary: ConstitutionalRouteSummary;
};

export const DEFAULT_DIAGNOSTIC_QUESTIONS: readonly DiagnosticQuestion[] = [
  {
    id: "q1",
    text: "The stated strategy and actual resource allocation are meaningfully aligned.",
    domain: "coherence",
  },
  {
    id: "q2",
    text: "Decision authority is clear and exercised without chronic diffusion or bottleneck.",
    domain: "authority",
  },
  {
    id: "q3",
    text: "The operating environment has changed faster than the organisation's ability to adapt.",
    domain: "environment",
    reverse: true,
  },
  {
    id: "q4",
    text: "There is a pattern of strategic drift — direction stated but not executed with discipline.",
    domain: "execution",
    reverse: true,
  },
  {
    id: "q5",
    text: "Trust between leadership and execution layers is materially intact.",
    domain: "trust",
  },
  {
    id: "q6",
    text: "The organisation carries visible friction: coordination failures, duplicated work, or unresolved conflict.",
    domain: "friction",
    reverse: true,
  },
  {
    id: "q7",
    text: "There is a clear decision-maker who can authorise strategic intervention.",
    domain: "authority",
  },
  {
    id: "q8",
    text: "The cost of getting this wrong would be material — financial, reputational, or structural.",
    domain: "stakes",
  },
  {
    id: "q9",
    text: "Past attempts to correct the issue have failed due to structural, not motivational, causes.",
    domain: "pattern",
    reverse: true,
  },
  {
    id: "q10",
    text: "External market or stakeholder pressure is actively forcing attention to this issue.",
    domain: "pressure",
  },
] as const;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function average(values: number[], fallback = 5): number {
  if (!values.length) return fallback;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentFromLikert(value: number): number {
  return clamp(Math.round(value * 10), 0, 100);
}

function certaintyWeight(certainty: LikertValue): number {
  return clamp(0.45 + certainty / 18, 0.45, 1);
}

function scoreQuestion(
  question: DiagnosticQuestion,
  answer: DiagnosticAnswerValue,
): number {
  const base = question.reverse ? 10 - answer.resonance : answer.resonance;
  return base * certaintyWeight(answer.certainty);
}

function classifyAuthorityType(authorityScore: number): AuthorityType {
  if (authorityScore >= 70) return "DIRECT";
  if (authorityScore >= 45) return "PROXY";
  return "UNCLEAR";
}

function classifyPosture(input: {
  coherenceScore: number;
  frictionScore: number;
  trustScore: number;
  governanceDiscipline: number;
}): OrgPosture {
  const disorderSignals = [
    input.coherenceScore < 35,
    input.frictionScore >= 70,
    input.trustScore < 35,
    input.governanceDiscipline < 35,
  ].filter(Boolean).length;

  if (disorderSignals >= 3) return "DISORDERED";
  if (input.coherenceScore < 45 || input.frictionScore >= 60) return "MISALIGNED";
  if (input.coherenceScore < 65 || input.governanceDiscipline < 60) return "DRIFTING";
  return "ORDERED";
}

function classifyReadinessTier(input: {
  authorityScore: number;
  coherenceScore: number;
  trustScore: number;
  interventionReadiness: number;
  governanceDiscipline: number;
}): ReadinessTier {
  const composite = average([
    input.authorityScore / 10,
    input.coherenceScore / 10,
    input.trustScore / 10,
    input.interventionReadiness / 10,
    input.governanceDiscipline / 10,
  ]);

  const pct = percentFromLikert(composite);

  if (pct < 35) return "FRAGILE";
  if (pct < 50) return "EMERGING";
  if (pct < 68) return "STABILIZING";
  if (pct < 85) return "EXECUTION_READY";
  return "SOVEREIGN";
}

function buildSummary(posture: OrgPosture): string {
  switch (posture) {
    case "DISORDERED":
      return "The system reads this as a disorder-risk case: structure is compromised, readiness is weak, and escalation must be tightly governed.";
    case "MISALIGNED":
      return "The system reads this as a misalignment case: the signal is real, but coherence, authority, or execution order remain materially imperfect.";
    case "DRIFTING":
      return "The system reads this as a drift case: the problem is meaningful, but foundational correction remains more urgent than premium escalation.";
    case "ORDERED":
    default:
      return "The system reads this as relatively ordered: the issue may justify sharper escalation if consequence and authority remain strong.";
  }
}

function buildFindings(input: {
  authorityScore: number;
  coherenceScore: number;
  frictionScore: number;
  pressureScore: number;
  trustScore: number;
}): string[] {
  const findings: string[] = [];

  if (input.authorityScore < 45) {
    findings.push("Authority is weak or insufficiently explicit.");
  } else if (input.authorityScore < 70) {
    findings.push("Authority exists, but escalation boundaries are still imperfect.");
  } else {
    findings.push("Authority appears sufficiently explicit for serious intervention.");
  }

  if (input.coherenceScore < 45) {
    findings.push("Strategic coherence is materially compromised.");
  } else if (input.coherenceScore < 70) {
    findings.push("Coherence exists, but execution and direction are not fully locked.");
  } else {
    findings.push("Strategic coherence is comparatively strong.");
  }

  if (input.frictionScore >= 70) {
    findings.push("Structural friction is high and likely compounding execution drag.");
  } else if (input.frictionScore >= 50) {
    findings.push("Friction is present and meaningful.");
  } else {
    findings.push("Friction is present but currently governable.");
  }

  if (input.pressureScore >= 70) {
    findings.push("The situation carries material consequence and external pressure.");
  } else if (input.pressureScore >= 50) {
    findings.push("Pressure is real, but not yet fully acute.");
  } else {
    findings.push("Pressure exists, but the signal is not yet severe.");
  }

  if (input.trustScore < 45) {
    findings.push("Trust condition is compromised and may reduce safe intervention fit.");
  }

  return findings;
}

export function getAnsweredCount(answers: DiagnosticAnswers): number {
  return Object.keys(answers).length;
}

export function getCompletionPercent(
  answers: DiagnosticAnswers,
  questions: readonly DiagnosticQuestion[] = DEFAULT_DIAGNOSTIC_QUESTIONS,
): number {
  if (!questions.length) return 0;
  return Math.round((getAnsweredCount(answers) / questions.length) * 100);
}

export function buildDomainMap(
  answers: DiagnosticAnswers,
  questions: readonly DiagnosticQuestion[] = DEFAULT_DIAGNOSTIC_QUESTIONS,
): Record<DiagnosticQuestionDomain, number[]> {
  const result: Record<DiagnosticQuestionDomain, number[]> = {
    authority: [],
    coherence: [],
    pressure: [],
    friction: [],
    trust: [],
    stakes: [],
    execution: [],
    environment: [],
    pattern: [],
  };

  for (const question of questions) {
    const answer = answers[question.id];
    if (!answer) continue;
    result[question.domain].push(scoreQuestion(question, answer));
  }

  return result;
}

export function deriveConstitutionalMicroReport(
  answers: DiagnosticAnswers,
  questions: readonly DiagnosticQuestion[] = DEFAULT_DIAGNOSTIC_QUESTIONS,
): ConstitutionalMicroReport {
  const byDomain = buildDomainMap(answers, questions);

  const authorityScore = percentFromLikert(average(byDomain.authority));
  const coherenceScore = percentFromLikert(average(byDomain.coherence));
  const trustScore = percentFromLikert(average(byDomain.trust));

  const pressureScore = percentFromLikert(
    average([...byDomain.pressure, ...byDomain.stakes, ...byDomain.environment]),
  );

  const frictionScore = percentFromLikert(
    average([...byDomain.friction, ...byDomain.execution, ...byDomain.pattern]),
  );

  const seriousnessScore = clamp(
    Math.round(average([authorityScore, pressureScore, frictionScore]) * 0.9),
    0,
    100,
  );

  const governanceDiscipline = clamp(
    Math.round(average([authorityScore, coherenceScore, trustScore])),
    0,
    100,
  );

  const narrativeCoherence = clamp(
    Math.round(average([coherenceScore, trustScore, authorityScore])),
    0,
    100,
  );

  const interventionReadiness = clamp(
    Math.round(average([authorityScore, coherenceScore, trustScore, 100 - frictionScore])),
    0,
    100,
  );

  let failureModeCount = 0;
  if (coherenceScore < 50) failureModeCount += 1;
  if (authorityScore < 50) failureModeCount += 1;
  if (trustScore < 50) failureModeCount += 1;
  if (frictionScore >= 60) failureModeCount += 1;
  if (pressureScore >= 70) failureModeCount += 1;

  const failureModeSeverity = clamp(
    Math.round(
      average([
        (100 - coherenceScore) / 10,
        (100 - authorityScore) / 10,
        frictionScore / 10,
        pressureScore / 12,
      ]),
    ),
    0,
    10,
  );

  const authorityType = classifyAuthorityType(authorityScore);
  const posture = classifyPosture({
    coherenceScore,
    frictionScore,
    trustScore,
    governanceDiscipline,
  });

  const readinessTier = classifyReadinessTier({
    authorityScore,
    coherenceScore,
    trustScore,
    interventionReadiness,
    governanceDiscipline,
  });

  const mandateFit = seriousnessScore >= 30;
  const answeredCount = getAnsweredCount(answers);
  const totalQuestions = questions.length;
  const completionPercent = getCompletionPercent(answers, questions);

  return {
    authorityScore,
    coherenceScore,
    pressureScore,
    frictionScore,
    trustScore,
    seriousnessScore,
    governanceDiscipline,
    interventionReadiness,
    narrativeCoherence,
    failureModeCount,
    failureModeSeverity,
    authorityType,
    posture,
    readinessTier,
    mandateFit,
    summary: buildSummary(posture),
    keyFindings: buildFindings({
      authorityScore,
      coherenceScore,
      frictionScore,
      pressureScore,
      trustScore,
    }),
    answeredCount,
    totalQuestions,
    completionPercent,
  };
}

export function deriveConstitutionInputFromMicroReport(
  report: ConstitutionalMicroReport,
  options?: {
    operatorKey?: string;
    operatorOverrideRequested?: boolean;
  },
): ConstitutionInput {
  return {
    clarityScore: report.coherenceScore,
    authorityType: report.authorityType,
    readinessTier: report.readinessTier,
    posture: report.posture,
    failureModeCount: report.failureModeCount,
    failureModeSeverity: report.failureModeSeverity,
    narrativeCoherence: report.narrativeCoherence,
    interventionReadiness: report.interventionReadiness,
    seriousnessScore: report.seriousnessScore,
    governanceDiscipline: report.governanceDiscipline,
    trustCondition: report.trustScore,
    mandateFit: report.mandateFit,
    operatorOverrideRequested: options?.operatorOverrideRequested ?? false,
    operatorKey: options?.operatorKey ?? "constitutional_diagnostic_public",
  };
}

export function deriveRouteSummary(
  decision: ConstitutionalDecision | null,
): ConstitutionalRouteSummary {
  if (!decision) {
    return {
      route: "PENDING",
      title: "Assessment in progress",
      description: "The chamber is still weighing the signal.",
      href: "#",
      cta: "Continue assessment",
      tone: "neutral",
    };
  }

  switch (decision.route) {
    case "STRATEGY":
      return {
        route: "STRATEGY_ROOM",
        title: "Strategy Room — escalation justified",
        description:
          "This signal shows sufficient authority, consequence, and readiness to justify private strategic escalation.",
        href: "/consulting/strategy-room",
        cta: "Enter Strategy Room",
        tone: "emerald",
      };

    case "DIAGNOSTIC":
      return {
        route: "EXECUTIVE_REPORTING",
        title: "Executive Reporting — the right next layer",
        description:
          "The signal is real, but disciplined interpretation should come before premium intervention.",
        href: "/diagnostics/executive-reporting",
        cta: "Review Executive Reporting",
        tone: "amber",
      };

    case "REJECT":
    default:
      return {
        route: "DIAGNOSTIC",
        title: "Foundational diagnosis required",
        description:
          "The current signal is not yet strong enough for escalation. The right move is clearer diagnostic work, not importance theatre.",
        href: "/diagnostics",
        cta: "Open diagnostics",
        tone: "neutral",
      };
  }
}

export function deriveConstitutionalDiagnosticBundle(
  answers: DiagnosticAnswers,
  options?: {
    questions?: readonly DiagnosticQuestion[];
    operatorKey?: string;
    operatorOverrideRequested?: boolean;
  },
): ConstitutionalDiagnosticBundle {
  const questions = options?.questions ?? DEFAULT_DIAGNOSTIC_QUESTIONS;
  const report = deriveConstitutionalMicroReport(answers, questions);
  const constitutionalInput = deriveConstitutionInputFromMicroReport(report, {
    operatorKey: options?.operatorKey,
    operatorOverrideRequested: options?.operatorOverrideRequested,
  });
  const decision = evaluateConstitutionalRoute(constitutionalInput);
  const routeSummary = deriveRouteSummary(decision);

  return {
    report,
    constitutionalInput,
    decision,
    routeSummary,
  };
}