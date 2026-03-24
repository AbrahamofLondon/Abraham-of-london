import {
  ALIGNMENT_DOMAIN_LABELS,
  ALIGNMENT_DOMAIN_ORDER,
  PURPOSE_ALIGNMENT_QUESTIONS,
} from "./checklist";
import type {
  AlignmentAssessmentInput,
  AlignmentAssessmentResult,
  AlignmentBand,
  AlignmentDomain,
  AlignmentDomainScore,
} from "./types";

function getBand(score: number): AlignmentBand {
  if (score >= 18) return "aligned";
  if (score >= 14) return "drifting";
  if (score >= 10) return "misaligned";
  return "disordered";
}

function getCorrections(weakestDomains: AlignmentDomain[]): string[] {
  const map: Record<AlignmentDomain, string> = {
    identity:
      "Rewrite your current mandate in one sentence and remove one commitment that does not serve it.",
    decision:
      "Review your last three major decisions and identify where pressure replaced principle.",
    environment:
      "Remove one recurring source of noise, sabotage, or confusion from your operating environment.",
    behaviour:
      "Rebuild one non-negotiable daily habit tied directly to your long-term outcomes.",
    emotional_order:
      "Stabilise sleep, input, and response rhythm before making further strategic decisions.",
    legacy:
      "Define one structure you are building that must outlast your current season.",
  };

  return weakestDomains.map((domain) => map[domain]);
}

function getStrengths(domainScores: AlignmentDomainScore[]): string[] {
  return domainScores
    .filter((score) => score.percent >= 67)
    .map(
      (score) =>
        `${ALIGNMENT_DOMAIN_LABELS[score.domain]} is currently operating above baseline.`
    );
}

export function scorePurposeAlignment(
  input: AlignmentAssessmentInput
): AlignmentAssessmentResult {
  const possibleScore = PURPOSE_ALIGNMENT_QUESTIONS.length;
  const totalScore = PURPOSE_ALIGNMENT_QUESTIONS.reduce(
    (sum, question) => sum + (input.answers[question.id] ? 1 : 0),
    0
  );

  const domainScores: AlignmentDomainScore[] = ALIGNMENT_DOMAIN_ORDER.map((domain) => {
    const domainQuestions = PURPOSE_ALIGNMENT_QUESTIONS.filter(
      (question) => question.domain === domain
    );

    const earned = domainQuestions.reduce(
      (sum, question) => sum + (input.answers[question.id] ? 1 : 0),
      0
    );

    const possible = domainQuestions.length;
    const percent = possible === 0 ? 0 : Math.round((earned / possible) * 100);

    return {
      domain,
      earned,
      possible,
      percent,
    };
  });

  const weakestDomains = [...domainScores]
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 2)
    .map((item) => item.domain);

  return {
    totalScore,
    possibleScore,
    percent: Math.round((totalScore / possibleScore) * 100),
    band: getBand(totalScore),
    domainScores,
    weakestDomains,
    strengths: getStrengths(domainScores),
    corrections: getCorrections(weakestDomains),
    createdAt: new Date().toISOString(),
  };
}