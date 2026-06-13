/**
 * Case Pattern Classifier.
 *
 * Derives decision patterns from the actual input fields of a case. The
 * classifier is evidence-honest: every classification lists the input
 * signals it matched, states its uncertainty, and refuses to classify
 * (insufficient_pattern_evidence) when the input cannot support judgement.
 * Insufficient evidence blocks gold output downstream.
 */

import {
  ALL_DECISION_PATTERNS,
  DECISION_PATTERN_PROFILES,
  type DecisionPattern,
} from "@/lib/judgement/decision-pattern-model";

export interface DecisionCaseInput {
  decisionDescription: string;
  stakeholders: string[];
  deadline: string;
  evidenceAvailable: string[];
  constraint: string;
  desiredOutcome: string;
  priorAttempts: string[];
  consequenceOfDelay: string;
  optionsUnderConsideration: string[];
}

export interface DecisionPatternClassification {
  primaryPattern: DecisionPattern;
  secondaryPatterns: DecisionPattern[];
  confidence: number;
  evidenceMatched: string[];
  uncertainty: string[];
}

export type DecisionPatternClassificationResult =
  | ({ status: "classified" } & DecisionPatternClassification)
  | { status: "insufficient_pattern_evidence"; missingSignals: string[] };

const MINIMUM_INPUT_CHARS = 80;
const MINIMUM_PRIMARY_HITS = 2;

interface FieldText {
  field: string;
  text: string;
  weight: number;
}

export function classifyDecisionPattern(input: DecisionCaseInput): DecisionPatternClassificationResult {
  const fields: FieldText[] = [
    { field: "decisionDescription", text: input.decisionDescription, weight: 2 },
    { field: "constraint", text: input.constraint, weight: 2 },
    { field: "consequenceOfDelay", text: input.consequenceOfDelay, weight: 1 },
    { field: "deadline", text: input.deadline, weight: 1 },
    { field: "desiredOutcome", text: input.desiredOutcome, weight: 1 },
    { field: "stakeholders", text: input.stakeholders.join("; "), weight: 1 },
    { field: "evidenceAvailable", text: input.evidenceAvailable.join("; "), weight: 1 },
    { field: "priorAttempts", text: input.priorAttempts.join("; "), weight: 1 },
    { field: "optionsUnderConsideration", text: input.optionsUnderConsideration.join("; "), weight: 1 },
  ];

  const combinedLength = fields.reduce((sum, field) => sum + field.text.trim().length, 0);
  if (combinedLength < MINIMUM_INPUT_CHARS) {
    return {
      status: "insufficient_pattern_evidence",
      missingSignals: [
        `Combined case input is ${combinedLength} characters; at least ${MINIMUM_INPUT_CHARS} characters of case description are required to support judgement.`,
        "Provide the decision description, the binding constraint, and the consequence of delay at minimum.",
      ],
    };
  }

  const scores = new Map<DecisionPattern, { score: number; matches: string[] }>();
  for (const pattern of ALL_DECISION_PATTERNS) {
    const profile = DECISION_PATTERN_PROFILES[pattern];
    let score = 0;
    const matches: string[] = [];
    for (const signature of profile.diagnosticSignature) {
      for (const field of fields) {
        if (field.text.toLowerCase().includes(signature)) {
          score += field.weight;
          matches.push(`"${signature}" matched in ${field.field}`);
        }
      }
    }
    scores.set(pattern, { score, matches });
  }

  const ranked = [...scores.entries()]
    .filter(([, entry]) => entry.score > 0)
    .sort((a, b) => b[1].score - a[1].score);

  const topRanked = ranked[0];
  if (!topRanked || topRanked[1].score < MINIMUM_PRIMARY_HITS) {
    return {
      status: "insufficient_pattern_evidence",
      missingSignals: [
        "No decision pattern signature reached the minimum evidence threshold in the supplied input.",
        "Describe the decision friction in concrete terms: who is blocked, what contradicts what, what expires when.",
      ],
    };
  }

  const [primaryPattern, primaryEntry] = topRanked;
  const secondaryPatterns = ranked
    .slice(1)
    .filter(([, entry]) => entry.score >= Math.max(2, primaryEntry.score / 2))
    .slice(0, 2)
    .map(([pattern]) => pattern);

  const uncertainty: string[] = [];
  const secondRanked = ranked[1];
  if (secondRanked && secondRanked[1].score === primaryEntry.score) {
    uncertainty.push(`The signal strength for ${secondRanked[0]} equals the primary pattern; the classification between them is contestable.`);
  }
  if (primaryEntry.score < 4) {
    uncertainty.push("Pattern evidence is real but thin; additional case detail would harden or overturn this classification.");
  }
  if (input.evidenceAvailable.length === 0) {
    uncertainty.push("No evidence items were supplied; the classification rests on the case description alone.");
  }

  return {
    status: "classified",
    primaryPattern,
    secondaryPatterns,
    confidence: Math.min(1, primaryEntry.score / 6),
    evidenceMatched: Array.from(new Set<string>(primaryEntry.matches)),
    uncertainty,
  };
}
