/**
 * lib/judgement/input-echo-guard.ts
 *
 * Input Echo Guard
 *
 * Detects when output is merely echoing/rephrasing input rather than
 * distilling it into decision logic.
 *
 * Thresholds:
 * - Input echo ratio: < 30% (input phrases appearing in output)
 * - Generic phrase density: < 15% (generic phrases per total words)
 * - Restated vs. interpreted: majority must be interpreted logic
 *
 * If output fails guards, it's rejected as insufficient distillation.
 */

export interface InputEchoAnalysis {
  /** Original user input */
  input: string;

  /** Generated output */
  output: string;

  /** Ratio of input phrases appearing in output (0-1) */
  inputEchoRatio: number;

  /** Density of generic phrases (0-1) */
  genericPhraseDensity: number;

  /** Words that are merely restatement vs. new logic */
  restatedVsInterpretedRatio: number;

  /** Phrases from input that appear verbatim in output */
  directEchoes: string[];

  /** Generic phrases detected in output */
  genericPhrases: string[];

  /** Overall quality score (0-10, 10 = excellent distillation) */
  qualityScore: number;

  /** Pass/fail based on thresholds */
  passGuard: boolean;

  /** Explanation of failures */
  failureReasons: string[];
}

const GENERIC_PHRASES = [
  "consider whether",
  "think about",
  "evaluate the",
  "assess the",
  "weigh the",
  "take into account",
  "it is important",
  "you should",
  "on the one hand",
  "on the other hand",
  "balance",
  "trade-off",
  "approach",
  "strategy",
  "clarify",
  "gather more information",
  "have a conversation",
  "make sure to",
  "be aware that",
  "keep in mind",
  "consider all options",
  "evaluate your",
  "think carefully",
  "before deciding",
  "is critical",
  "is important",
  "cannot be ignored",
  "must be considered",
  "be mindful",
  "take time",
];

/**
 * Extract key phrases from input (nouns, verbs, decision terms)
 */
function extractKeyPhrases(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const phrases: string[] = [];

  // Extract 2-3 word phrases
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(words.slice(i, i + 2).join(" "));
    if (i < words.length - 2) {
      phrases.push(words.slice(i, i + 3).join(" "));
    }
  }

  return [...new Set(phrases)];
}

/**
 * Measure ratio of input phrases appearing in output
 */
function measureInputEchoRatio(input: string, output: string): { ratio: number; echoes: string[] } {
  const inputPhrases = extractKeyPhrases(input);
  const outputLower = output.toLowerCase();

  const echoes = inputPhrases.filter((phrase) => outputLower.includes(phrase));

  const ratio = inputPhrases.length > 0 ? echoes.length / inputPhrases.length : 0;

  return { ratio, echoes };
}

/**
 * Measure density of generic phrases in output
 */
function measureGenericPhraseDensity(output: string): { density: number; phrases: string[] } {
  const outputLower = output.toLowerCase();
  const words = outputLower.split(/\s+/);

  const foundPhrases = GENERIC_PHRASES.filter((phrase) => outputLower.includes(phrase));

  const totalWords = words.length;
  const genericWords = foundPhrases.reduce((sum, phrase) => sum + phrase.split(/\s+/).length, 0);

  const density = totalWords > 0 ? genericWords / totalWords : 0;

  return { density, phrases: foundPhrases };
}

/**
 * Detect if output is restating input vs. interpreting it
 *
 * Heuristic: output that starts with "You said", "Your situation", "The problem you described"
 * is more likely to be restatement. Output starting with "The real decision", "Actually", "But"
 * is more likely to be interpretation.
 */
function analyzeRestatedVsInterpreted(output: string): number {
  const restatingPatterns = [
    /^you (said|mentioned|described)/i,
    /^your situation/i,
    /^the problem you/i,
    /^based on what you said/i,
    /^it sounds like/i,
  ];

  const interpretingPatterns = [
    /^the real decision/i,
    /^actually,/i,
    /^but/i,
    /^what this really (means|is about)/i,
    /^the core (issue|tension|question)/i,
    /^beneath (this|that|the surface)/i,
  ];

  const startsWithRestating = restatingPatterns.some((p) => p.test(output));
  const startsWithInterpreting = interpretingPatterns.some((p) => p.test(output));

  // Count occurrences
  let restatingCount = 0;
  let interpretingCount = 0;

  const sentences = output.split(/[.!?]+/);
  sentences.forEach((sentence) => {
    if (restatingPatterns.some((p) => p.test(sentence))) {
      restatingCount++;
    }
    if (interpretingPatterns.some((p) => p.test(sentence))) {
      interpretingCount++;
    }
  });

  const total = restatingCount + interpretingCount || 1;
  const interpretedRatio = interpretingCount / total;

  return interpretedRatio;
}

/**
 * Main analysis function
 */
export function analyzeInputEcho(input: string, output: string): InputEchoAnalysis {
  const { ratio: echoRatio, echoes: directEchoes } = measureInputEchoRatio(input, output);
  const { density: genericDensity, phrases: genericPhrases } = measureGenericPhraseDensity(output);
  const interpretedRatio = analyzeRestatedVsInterpreted(output);

  const failureReasons: string[] = [];

  // Thresholds
  if (echoRatio > 0.3) {
    failureReasons.push(
      `Input echo ratio too high: ${(echoRatio * 100).toFixed(1)}% (threshold: <= 30%)`
    );
  }

  if (genericDensity > 0.15) {
    failureReasons.push(
      `Generic phrase density too high: ${(genericDensity * 100).toFixed(1)}% (threshold: <= 15%)`
    );
  }

  if (interpretedRatio < 0.5) {
    failureReasons.push(
      `Output is too restatement-focused: ${(interpretedRatio * 100).toFixed(1)}% interpreted vs restated (threshold: >= 50%)`
    );
  }

  // Quality score (0-10)
  let qualityScore = 10;
  qualityScore -= echoRatio * 20; // -0 to -20
  qualityScore -= genericDensity * 15; // -0 to -15
  qualityScore -= (1 - interpretedRatio) * 10; // -0 to -10
  qualityScore = Math.max(0, qualityScore);

  const passGuard = failureReasons.length === 0;

  return {
    input,
    output,
    inputEchoRatio: echoRatio,
    genericPhraseDensity: genericDensity,
    restatedVsInterpretedRatio: interpretedRatio,
    directEchoes: directEchoes.slice(0, 10), // Top 10 echoes
    genericPhrases,
    qualityScore,
    passGuard,
    failureReasons,
  };
}

/**
 * Guard function: fail if echo is too high
 */
export function guardAgainstInputEcho(input: string, output: string): { pass: boolean; reason?: string } {
  const analysis = analyzeInputEcho(input, output);

  if (!analysis.passGuard) {
    return {
      pass: false,
      reason: analysis.failureReasons.join("; "),
    };
  }

  return { pass: true };
}

/**
 * Generate feedback for fixing input echo
 */
export function generateInputEchoFeedback(analysis: InputEchoAnalysis): string {
  if (analysis.passGuard) {
    return `✓ Input echo guard passed. Output successfully distils input.`;
  }

  const feedback: string[] = ["Input echo guard failed:"];

  if (analysis.inputEchoRatio > 0.3) {
    feedback.push(
      `- Reduce input echo: ${analysis.directEchoes.length} direct echoes detected; try to interpret rather than restate`
    );
  }

  if (analysis.genericPhraseDensity > 0.15) {
    feedback.push(
      `- Replace generic language: phrases like "${analysis.genericPhrases.slice(0, 2).join('", "')}" don't add specificity`
    );
  }

  if (analysis.restatedVsInterpretedRatio < 0.5) {
    feedback.push(
      `- Add interpretation: output is ${(analysis.restatedVsInterpretedRatio * 100).toFixed(0)}% interpretation; aim for 50%+`
    );
  }

  return feedback.join("\n");
}

export default {
  analyzeInputEcho,
  guardAgainstInputEcho,
  generateInputEchoFeedback,
};
