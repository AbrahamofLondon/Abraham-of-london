/**
 * Real-Time Contradiction Forcing — pauses assessment when contradiction detected.
 *
 * WHY THIS IS IRREPLICABLE:
 * The system doesn't wait until the end to tell you about contradictions.
 * It catches them AS YOU ANSWER and forces you to confront them.
 * This changes the user's self-awareness in real-time — an effect that
 * persists even if they never buy anything. They come back because
 * the system taught them something about themselves.
 */

export type ContradictionForce = {
  /** Whether a contradiction was detected mid-assessment */
  detected: boolean;
  /** The two answers that contradict */
  answerA: { questionId: string; domain: string; score: number };
  answerB: { questionId: string; domain: string; score: number };
  /** The gap between them */
  gap: number;
  /** The forcing question — what the user must confront */
  forcingQuestion: string;
  /** Why this contradiction matters */
  significance: string;
  /** Severity of the contradiction */
  severity: "notable" | "significant" | "critical";
};

/**
 * Check if the latest answer creates a contradiction with prior answers.
 * Called after EACH answer to enable real-time detection.
 */
export function checkForContradiction(
  currentAnswers: Record<string, { resonance: number; certainty: number; domain: string }>,
  latestQuestionId: string,
): ContradictionForce | null {
  const latest = currentAnswers[latestQuestionId];
  if (!latest) return null;

  const latestScore = Math.sqrt(Math.max(0, latest.resonance * latest.certainty)) * 10;

  // Check against all other answered questions
  for (const [qid, answer] of Object.entries(currentAnswers)) {
    if (qid === latestQuestionId) continue;

    const otherScore = Math.sqrt(Math.max(0, answer.resonance * answer.certainty)) * 10;
    const gap = Math.abs(latestScore - otherScore);

    // Threshold: 40+ point gap between any two answers = contradiction
    if (gap < 40) continue;

    const high = latestScore > otherScore
      ? { questionId: latestQuestionId, domain: latest.domain, score: latestScore }
      : { questionId: qid, domain: answer.domain, score: otherScore };
    const low = latestScore > otherScore
      ? { questionId: qid, domain: answer.domain, score: otherScore }
      : { questionId: latestQuestionId, domain: latest.domain, score: latestScore };

    const severity: ContradictionForce["severity"] = gap >= 60 ? "critical" : gap >= 50 ? "significant" : "notable";

    // Generate the forcing question based on the domains involved
    const forcingQuestion = generateForcingQuestion(high.domain, low.domain, gap);
    const significance = `${high.domain} scored ${Math.round(high.score)}% while ${low.domain} scored ${Math.round(low.score)}%. A ${Math.round(gap)}-point gap between these domains is a structural signal, not noise.`;

    return {
      detected: true,
      answerA: high,
      answerB: low,
      gap: Math.round(gap),
      forcingQuestion,
      significance,
      severity,
    };
  }

  return null;
}

function generateForcingQuestion(highDomain: string, lowDomain: string, gap: number): string {
  const pairs: Record<string, string> = {
    "identity_decision": "You report strong identity but weak decision integrity. Are you clear on who you are but avoiding what that requires you to do?",
    "decision_identity": "You report strong decision-making but weak identity clarity. Are you acting decisively without a clear mandate — and if so, on whose authority?",
    "identity_behaviour": "You report strong identity but weak operational behaviour. The mandate exists in language but not in your calendar. Which is the truth?",
    "behaviour_identity": "Your behaviour is stronger than your identity signal. You may be executing well on someone else's mandate. Is that sustainable?",
    "identity_environment": "Strong identity but weak environment alignment. You know who you are but your context is working against it. What are you tolerating?",
    "trust_authority": "Low trust but clear authority. People know who decides but don't trust the process. What broke?",
    "authority_trust": "Clear trust but unclear authority. People trust each other but no one owns the decision. Who should?",
    "coherence_execution": "Strong coherence but weak execution. The plan is clear but nothing is moving. What is blocking the first step?",
    "execution_coherence": "Strong execution but weak coherence. Things are moving but in different directions. Who is setting the direction?",
  };

  const key = `${lowDomain}_${highDomain}`;
  const reverseKey = `${highDomain}_${lowDomain}`;

  return pairs[key] ?? pairs[reverseKey]
    ?? `Your ${highDomain} signal (strong) contradicts your ${lowDomain} signal (weak). A ${Math.round(gap)}-point gap means one of these is wrong. Which do you trust more?`;
}

/**
 * Check if the overall answer set has high-certainty-low-resonance pattern
 * (false confidence). Called at assessment completion.
 */
export function detectFalseConfidence(
  answers: Record<string, { resonance: number; certainty: number }>,
): { detected: boolean; message: string; affectedCount: number } {
  let falseConfidenceCount = 0;

  for (const answer of Object.values(answers)) {
    if (answer.certainty >= 8 && answer.resonance <= 3) {
      falseConfidenceCount++;
    }
  }

  const total = Object.keys(answers).length;
  const ratio = total > 0 ? falseConfidenceCount / total : 0;

  if (ratio >= 0.3) {
    return {
      detected: true,
      message: `${falseConfidenceCount} of ${total} answers show high certainty with low resonance. You are confident about your weaknesses but may not be examining them. High certainty on weak alignment is not strength — it is resignation.`,
      affectedCount: falseConfidenceCount,
    };
  }

  return { detected: false, message: "", affectedCount: 0 };
}
