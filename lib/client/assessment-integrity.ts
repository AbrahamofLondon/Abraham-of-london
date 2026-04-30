"use client";

import type { DualAxisAnswer } from "@/lib/alignment/types";
import type { ChallengeResult } from "@/lib/server/decision/challenge-engine.server";

type IntegrityInput = {
  answers: Record<string, DualAxisAnswer>;
  startedAt?: number | null;
  submittedAt?: number | null;
  minimumAnswers?: number;
};

function buildClarifyChallenge(
  type: ChallengeResult["type"],
  challengeText: string,
  clarificationPrompt: string,
  canProceed = true,
): ChallengeResult {
  return {
    severity: canProceed ? "clarify" : "challenge",
    type,
    challengeText,
    clarificationPrompt,
    canProceed,
  };
}

export function detectDualAxisIntegrityChallenge({
  answers,
  startedAt,
  submittedAt,
  minimumAnswers = 4,
}: IntegrityInput): ChallengeResult | null {
  const values = Object.values(answers);
  if (values.length < minimumAnswers) return null;

  const patternCount = new Set(
    values.map((answer) => `${answer.resonance}:${answer.certainty}`),
  ).size;
  const avgMsPerAnswer =
    startedAt && submittedAt && submittedAt > startedAt
      ? (submittedAt - startedAt) / values.length
      : null;

  const conflictCount = values.filter(
    (answer) =>
      Math.abs(answer.resonance - answer.certainty) >= 5 &&
      answer.certainty >= 7,
  ).length;
  const extremeUniformity = values.filter(
    (answer) =>
      (answer.resonance <= 1 || answer.resonance >= 9) &&
      (answer.certainty <= 1 || answer.certainty >= 9),
  ).length;

  if (avgMsPerAnswer !== null && avgMsPerAnswer < 900) {
    return buildClarifyChallenge(
      "insufficient_evidence",
      "These answers arrived unusually fast for the amount of signal being claimed.",
      "Pause and confirm the strongest points before continuing.",
    );
  }

  if (patternCount <= 2 || extremeUniformity >= Math.ceil(values.length * 0.7)) {
    return buildClarifyChallenge(
      "insufficient_evidence",
      "The response pattern is too uniform to support a high-resolution reading.",
      "Adjust any answers that were set mechanically rather than deliberately.",
    );
  }

  if (conflictCount >= Math.ceil(values.length * 0.45)) {
    return buildClarifyChallenge(
      "contradiction",
      "Several answers combine high certainty with internal tension.",
      "Check whether those tensions are real, or whether some answers need tightening.",
    );
  }

  return null;
}
