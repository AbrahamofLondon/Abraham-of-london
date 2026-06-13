/**
 * Anti-Toy Product Test.
 *
 * A product fails this test when its actual output mostly restates the
 * user's input, uses serious language without serious judgement, contains
 * sections but no insight, gives generic recommendations, lacks consequence
 * or specificity or a real next action, cannot be reused later, could be
 * produced by a generic AI prompt, or creates the impression of governance
 * without useful judgement.
 *
 * The decisive instrument is the cross-input comparison: the same product
 * is run against two materially different situations. If the rendered
 * judgement is nearly identical across both, the product is a template
 * wearing the language of judgement — the definition of a toy.
 *
 * Hard rules:
 *   toyRiskScore > 5  → cannot be gold_standard
 *   toyRiskScore > 20 → blocked_from_release
 */

export interface AnalyzableOutput {
  /** Full rendered output text as the customer would read it. */
  fullText: string;
  diagnosisText?: string;
  nextActionText: string;
  consequenceText: string;
  falsificationText?: string;
  executionSequenceText?: string[];
  limitsText: string;
  evidenceItems: string[];
}

export interface AnalyzableSample {
  /** Short label for the scenario, e.g. "pricing decision under deadline". */
  label: string;
  /** The raw user input text supplied to the product. */
  inputText: string;
  output: AnalyzableOutput;
}

export interface AntiToyTestInput {
  productCode: string;
  /** Where the tested output came from, e.g. a route or composer execution. */
  testedOutputSource: string;
  primary: AnalyzableSample;
  /** A materially different scenario, used to detect template judgement. */
  variant: AnalyzableSample;
}

export interface AntiToyTestResult {
  productCode: string;
  testedOutputSource: string;
  toyRiskScore: number; // 0 safe, 100 toy-like
  failsAntiToyTest: boolean;
  reasons: string[];
  requiredCorrections: string[];
}

export const ANTI_TOY_GOLD_MAXIMUM = 5;
export const ANTI_TOY_RELEASE_MAXIMUM = 20;

export interface OutputFeatureAnalysis {
  inputEchoRatio: number;
  crossInputSimilarity: number;
  judgementDiversity: JudgementDiversityAnalysis;
  genericPhraseHits: string[];
  nextActionGroundedInInput: boolean;
  nextActionIdenticalAcrossInputs: boolean;
  consequenceGroundedInInput: boolean;
  statesLimits: boolean;
  citesEvidence: boolean;
  hasReuseMarkers: boolean;
  hasOwnerAndTimeframe: boolean;
  couldBeGenericAiOutput: boolean;
}

export interface JudgementDiversityAnalysis {
  overallJudgementSimilarity: number;
  diagnosisSimilarity: number;
  consequenceSimilarity: number;
  nextMoveSimilarity: number;
  falsificationSimilarity: number;
  executionSequenceSimilarity: number;
  failures: string[];
}

export const JUDGEMENT_DIVERSITY_THRESHOLDS = {
  overallJudgementSimilarity: 0.55,
  diagnosisSimilarity: 0.5,
  nextMoveSimilarity: 0.45,
  consequenceSimilarity: 0.55,
  falsificationSimilarity: 0.55,
  executionSequenceSimilarity: 0.55,
} as const;

const GENERIC_PHRASES = [
  "best practice",
  "stakeholder alignment",
  "align your stakeholders",
  "communicate clearly",
  "improve your processes",
  "actionable insights",
  "drive value",
  "holistic approach",
  "synerg",
  "move the needle",
  "work smarter",
  "embrace change",
];

const STOPWORDS = new Set([
  "the", "and", "for", "that", "this", "with", "your", "you", "are", "was",
  "not", "its", "has", "have", "but", "can", "will", "must", "into", "from",
  "what", "when", "who", "how", "why", "one", "their", "they", "them", "any",
  "all", "than", "then", "before", "after", "under", "over", "more", "most",
]);

export function extractOutputFeatures(
  primary: AnalyzableSample,
  variant: AnalyzableSample,
): OutputFeatureAnalysis {
  const primaryOutputTokens = tokenize(primary.output.fullText);
  const variantOutputTokens = tokenize(variant.output.fullText);
  const primaryInputTokens = tokenize(primary.inputText);

  const inputEchoRatio = ratio(intersect(primaryOutputTokens, primaryInputTokens).size, primaryOutputTokens.size);
  const crossInputSimilarity = jaccard(primaryOutputTokens, variantOutputTokens);

  const fullLower = primary.output.fullText.toLowerCase();
  const genericPhraseHits = GENERIC_PHRASES.filter((phrase) => fullLower.includes(phrase));
  const judgementDiversity = analyzeJudgementDiversity(primary.output, variant.output);

  const nextTokensA = tokenize(primary.output.nextActionText);
  const nextTokensB = tokenize(variant.output.nextActionText);
  const nextActionGroundedInInput = intersect(nextTokensA, primaryInputTokens).size >= 2;
  const nextActionIdenticalAcrossInputs = jaccard(nextTokensA, nextTokensB) > 0.9;

  const consequenceGroundedInInput = intersect(tokenize(primary.output.consequenceText), primaryInputTokens).size >= 2;
  const statesLimits = primary.output.limitsText.trim().length > 40;
  const citesEvidence = primary.output.evidenceItems.length > 0 &&
    primary.output.evidenceItems.every((item) => item.trim().length > 8);
  const hasReuseMarkers = /checkpoint|re-?open|revisit|record|calendar|review (it|this|the)|within (the next )?\d+|\d+[- ](hour|day|week)/i.test(primary.output.fullText);
  const hasOwnerAndTimeframe = /owner|owns|accountable|named/i.test(primary.output.nextActionText) &&
    /\d+\s*(minute|hour|day|week)|48-hour|tomorrow|this week|next week/i.test(primary.output.nextActionText);

  return {
    inputEchoRatio,
    crossInputSimilarity,
    judgementDiversity,
    genericPhraseHits,
    nextActionGroundedInInput,
    nextActionIdenticalAcrossInputs,
    consequenceGroundedInInput,
    statesLimits,
    citesEvidence,
    hasReuseMarkers,
    hasOwnerAndTimeframe,
    couldBeGenericAiOutput: crossInputSimilarity > 0.6,
  };
}

export function runAntiToyTest(input: AntiToyTestInput): AntiToyTestResult {
  const features = extractOutputFeatures(input.primary, input.variant);
  const reasons: string[] = [];
  const requiredCorrections: string[] = [];
  let score = 0;

  if (features.crossInputSimilarity > 0.75) {
    score += 35;
    reasons.push(`Near-identical judgement (${pct(features.crossInputSimilarity)} similar) for two materially different situations — this is a template wearing the language of judgement.`);
    requiredCorrections.push("Derive diagnosis branches from the actual input pattern so different situations produce materially different judgement, not different interpolations.");
  } else if (features.crossInputSimilarity > 0.6) {
    score += 25;
    reasons.push(`Output is ${pct(features.crossInputSimilarity)} similar across two different situations — judgement is mostly template, partially case-specific.`);
    requiredCorrections.push("Increase the share of case-derived judgement: classification, severity, and recommendation should change with the input pattern.");
  } else if (features.crossInputSimilarity > 0.45) {
    score += 12;
    reasons.push(`Moderate template share (${pct(features.crossInputSimilarity)} cross-input similarity).`);
    requiredCorrections.push("Reduce fixed framing text relative to case-specific judgement.");
  }

  if (features.judgementDiversity.overallJudgementSimilarity > JUDGEMENT_DIVERSITY_THRESHOLDS.overallJudgementSimilarity) {
    score += 28;
    reasons.push(`Overall judgement similarity is ${pct(features.judgementDiversity.overallJudgementSimilarity)} across materially different cases; threshold is ${pct(JUDGEMENT_DIVERSITY_THRESHOLDS.overallJudgementSimilarity)}.`);
    requiredCorrections.push("Make diagnosis, consequence, next move, falsification, and execution sequence derive from the classified decision pattern.");
  }
  if (features.judgementDiversity.diagnosisSimilarity > JUDGEMENT_DIVERSITY_THRESHOLDS.diagnosisSimilarity) {
    score += 16;
    reasons.push(`Diagnosis similarity is ${pct(features.judgementDiversity.diagnosisSimilarity)} across materially different cases; threshold is ${pct(JUDGEMENT_DIVERSITY_THRESHOLDS.diagnosisSimilarity)}.`);
    requiredCorrections.push("Diagnosis must name the case's actual decision pathology, not a reusable section frame.");
  }
  if (features.judgementDiversity.nextMoveSimilarity > JUDGEMENT_DIVERSITY_THRESHOLDS.nextMoveSimilarity) {
    score += 16;
    reasons.push(`Next-move similarity is ${pct(features.judgementDiversity.nextMoveSimilarity)} across materially different cases; threshold is ${pct(JUDGEMENT_DIVERSITY_THRESHOLDS.nextMoveSimilarity)}.`);
    requiredCorrections.push("Next moves must change with the decision pattern; identical advice for different cases blocks gold output.");
  }
  if (features.judgementDiversity.failures.length > 0) {
    reasons.push(...features.judgementDiversity.failures);
  }

  if (features.inputEchoRatio > 0.55) {
    score += 20;
    reasons.push(`Output mostly restates the user's input (${pct(features.inputEchoRatio)} echo).`);
    requiredCorrections.push("Replace input restatement with judgement the user could not have written themselves.");
  } else if (features.inputEchoRatio > 0.35) {
    score += 10;
    reasons.push(`High input echo (${pct(features.inputEchoRatio)}).`);
    requiredCorrections.push("Cut restated input; keep only what anchors the judgement.");
  }

  if (features.genericPhraseHits.length > 0) {
    score += Math.min(features.genericPhraseHits.length * 6, 18);
    reasons.push(`Generic recommendation language detected: ${features.genericPhraseHits.join(", ")}.`);
    requiredCorrections.push("Remove generic recommendation phrasing; every recommendation must be specific to the case.");
  }

  if (!features.consequenceGroundedInInput) {
    score += 8;
    reasons.push("Consequence section is not grounded in the user's stated situation.");
    requiredCorrections.push("Tie the consequence to the user's named stake, not to a universal warning.");
  }

  if (features.nextActionIdenticalAcrossInputs) {
    score += 12;
    reasons.push("The next action is the same regardless of the situation.");
    requiredCorrections.push("Select the next action from the input pattern; identical advice for different cases is not advice.");
  }
  if (!features.nextActionGroundedInInput) {
    score += 8;
    reasons.push("The next action does not reference the user's actual case.");
    requiredCorrections.push("Anchor the next action in the user's named decision, owner, or stake.");
  }

  if (!features.statesLimits) {
    score += 6;
    reasons.push("Output does not state its own limits.");
    requiredCorrections.push("State explicitly what the result does not prove.");
  }
  if (!features.citesEvidence) {
    score += 6;
    reasons.push("Output cites no evidence or reasoning basis.");
    requiredCorrections.push("Show the evidence or reasoning the judgement rests on.");
  }
  if (!features.hasReuseMarkers) {
    score += 5;
    reasons.push("Nothing in the output supports later reuse.");
    requiredCorrections.push("Add a checkpoint, record, or review element the user can return to.");
  }
  if (!features.hasOwnerAndTimeframe) {
    score += 5;
    reasons.push("Next action lacks an owner or a timeframe.");
    requiredCorrections.push("Bind the next action to a named owner and a concrete timeframe.");
  }

  if (features.couldBeGenericAiOutput) {
    reasons.push("A generic AI prompt given the same input could plausibly produce this output — the product adds structure, not proprietary judgement.");
    requiredCorrections.push("Add judgement a generic prompt cannot produce: pattern classification across cases, calibrated severity, or evidence the platform alone holds.");
  }

  const toyRiskScore = clamp(Math.round(score), 0, 100);

  return {
    productCode: input.productCode,
    testedOutputSource: input.testedOutputSource,
    toyRiskScore,
    failsAntiToyTest: toyRiskScore > ANTI_TOY_GOLD_MAXIMUM,
    reasons,
    requiredCorrections: [...new Set(requiredCorrections)],
  };
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)),
  );
}

function analyzeJudgementDiversity(
  primary: AnalyzableOutput,
  variant: AnalyzableOutput,
): JudgementDiversityAnalysis {
  const diagnosisSimilarity = textSimilarity(
    primary.diagnosisText ?? firstUsefulLine(primary.fullText),
    variant.diagnosisText ?? firstUsefulLine(variant.fullText),
  );
  const consequenceSimilarity = textSimilarity(primary.consequenceText, variant.consequenceText);
  const nextMoveSimilarity = textSimilarity(primary.nextActionText, variant.nextActionText);
  const falsificationSimilarity = textSimilarity(primary.falsificationText ?? "", variant.falsificationText ?? "");
  const executionSequenceSimilarity = textSimilarity(
    (primary.executionSequenceText ?? []).join(" "),
    (variant.executionSequenceText ?? []).join(" "),
  );

  const overallJudgementSimilarity = average([
    diagnosisSimilarity,
    consequenceSimilarity,
    nextMoveSimilarity,
    falsificationSimilarity,
    executionSequenceSimilarity,
  ]);

  const failures: string[] = [];
  if (consequenceSimilarity > JUDGEMENT_DIVERSITY_THRESHOLDS.consequenceSimilarity) {
    failures.push(`Consequence similarity is ${pct(consequenceSimilarity)}; materially different cases require materially different commercial consequence.`);
  }
  if (falsificationSimilarity > JUDGEMENT_DIVERSITY_THRESHOLDS.falsificationSimilarity) {
    failures.push(`Falsification challenge similarity is ${pct(falsificationSimilarity)}; the challenge must test the case-specific diagnosis.`);
  }
  if (executionSequenceSimilarity > JUDGEMENT_DIVERSITY_THRESHOLDS.executionSequenceSimilarity) {
    failures.push(`Execution-sequence similarity is ${pct(executionSequenceSimilarity)}; sequence should vary by decision pattern.`);
  }

  return {
    overallJudgementSimilarity,
    diagnosisSimilarity,
    consequenceSimilarity,
    nextMoveSimilarity,
    falsificationSimilarity,
    executionSequenceSimilarity,
    failures,
  };
}

function textSimilarity(a: string, b: string): number {
  if (a.trim().length === 0 && b.trim().length === 0) return 0;
  return jaccard(tokenize(a), tokenize(b));
}

function firstUsefulLine(text: string): string {
  return text.split(/\r?\n/).find((line) => line.trim().length > 24) ?? text;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function intersect(a: Set<string>, b: Set<string>): Set<string> {
  return new Set([...a].filter((token) => b.has(token)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const union = new Set([...a, ...b]);
  return intersect(a, b).size / union.size;
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
