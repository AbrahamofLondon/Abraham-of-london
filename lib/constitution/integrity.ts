/* lib/constitution/integrity.ts */
export interface NarrativeInput {
  problem: string;
  constraint: string;
  outcome: string;
}

export interface NarrativeIntegrityResult {
  isValid: boolean;
  score: number;           // 0–100
  issues: string[];        // Critical problems (blocks strategy)
  warnings: string[];      // Concerns (should be addressed)
  suggestions: string[];   // Improvement recommendations
}

/**
 * Validates the structural and logical integrity of a strategic narrative
 * (Problem → Constraint → Outcome)
 */
export function validateNarrativeIntegrity(input: NarrativeInput): NarrativeIntegrityResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const p = (input.problem || "").trim();
  const c = (input.constraint || "").trim();
  const o = (input.outcome || "").trim();

  // Basic presence checks
  if (!p) issues.push("Problem statement is missing or empty");
  if (!o) issues.push("Outcome statement is missing or empty");

  if (issues.length > 0) {
    return { isValid: false, score: 0, issues, warnings, suggestions };
  }

  let score = 100;

  // Length & substance
  if (p.length < 25) {
    warnings.push("Problem statement is too brief");
    score -= 15;
  }
  if (o.length < 35) {
    warnings.push("Outcome is not decision-grade (too short)");
    score -= 22;
  }
  if (c.length < 15) {
    warnings.push("Constraint is very weak or missing");
    score -= 10;
  }

  // Semantic alignment between problem and outcome
  const problemWords = p.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const outcomeWords = o.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  const overlap = problemWords.filter(word =>
    outcomeWords.some(ow => ow.includes(word) || word.includes(ow))
  ).length;

  if (overlap === 0) {
    issues.push("Outcome does not appear to address the stated problem");
    score -= 40;
  } else if (overlap <= 1) {
    warnings.push("Weak connection between problem and outcome");
    score -= 18;
  }

  // Constraint relevance
  if (c) {
    const constraintWords = c.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const constraintOverlap = problemWords.filter(word =>
      constraintWords.some(cw => cw.includes(word) || word.includes(cw))
    ).length;

    if (constraintOverlap === 0) {
      warnings.push("Constraint appears disconnected from the core problem");
      score -= 12;
    }
  }

  // Outcome language quality
  const weakPhrases = ["i want", "we should", "maybe", "hopefully", "try to", "might"];
  if (weakPhrases.some(phrase => o.toLowerCase().includes(phrase))) {
    warnings.push("Outcome uses weak or passive language");
    score -= 15;
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    isValid: issues.length === 0 && finalScore >= 70,
    score: finalScore,
    issues,
    warnings,
    suggestions: suggestions.length > 0 ? suggestions : [],
  };
}

// Convenience helper
export function isNarrativeStrong(input: NarrativeInput): boolean {
  const result = validateNarrativeIntegrity(input);
  return result.isValid && result.score >= 78;
}