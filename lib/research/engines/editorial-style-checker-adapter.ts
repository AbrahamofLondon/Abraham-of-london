/**
 * lib/research/engines/editorial-style-checker-adapter.ts
 *
 * Intelligence Foundry adapter for the Editorial Style Checker engine.
 *
 * Implements the Abraham of London editorial house style ruleset:
 *   1. UK vs US spelling (realise/realize, organisation/organization, etc.)
 *   2. Forbidden overclaim phrases (guaranteed, AI predicts, 100%, etc.)
 *   3. Guarantee language detection
 *   4. Hidden compliance assertions (FCA-regulated, etc.)
 *   5. AI prediction claim language
 *   6. Unsupported authority claims
 *   7. Evidence posture weakness (we believe, we think, in our opinion)
 *   8. IP scoring logic leakage
 *
 * Status: PRODUCTION_CALLABLE
 * - All rules are deterministic — no AI, no external calls
 * - Based on the same claim categories used in Content Red Team
 * - Applies to editorial, blog, shorts, briefs, and outbound copy
 *
 * Payload fields:
 *   - text: string — content to evaluate
 *   - title: string — content title (optional)
 *   - contentType: "editorial" | "blog" | "shorts" | "brief" | "outbound" — default "editorial"
 */

import "server-only";

import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ─────────────────────────────────────────────────────────

export const EDITORIAL_STYLE_ENGINE_ID = "editorial-style-checker";
export const EDITORIAL_STYLE_VERSION = "1.2.0";

// ─── Rule sets ────────────────────────────────────────────────────────────────

/** US spellings → preferred UK spelling */
const US_TO_UK_MAP: Record<string, string> = {
  "analyze": "analyse",
  "analyzed": "analysed",
  "analyzing": "analysing",
  "analyzer": "analyser",
  "organize": "organise",
  "organized": "organised",
  "organizing": "organising",
  "organization": "organisation",
  "organizations": "organisations",
  "recognize": "recognise",
  "recognized": "recognised",
  "recognizing": "recognising",
  "realize": "realise",
  "realized": "realised",
  "realizing": "realising",
  "prioritize": "prioritise",
  "prioritized": "prioritised",
  "prioritizing": "prioritising",
  "optimize": "optimise",
  "optimized": "optimised",
  "optimizing": "optimising",
  "behavior": "behaviour",
  "behaviors": "behaviours",
  "color": "colour",
  "colors": "colours",
  "favor": "favour",
  "favors": "favours",
  "honor": "honour",
  "honors": "honours",
  "labor": "labour",
  "neighbor": "neighbour",
  "neighbors": "neighbours",
  "center": "centre",
  "centers": "centres",
  "theater": "theatre",
  "theaters": "theatres",
  "defense": "defence",
  "offense": "offence",
  "license": "licence",
  "licenses": "licences",
  "program": "programme",
  "programs": "programmes",
};

const FORBIDDEN_OVERCLAIM_PHRASES: string[] = [
  "guaranteed",
  "guarantee",
  "100% success",
  "100% guaranteed",
  "always works",
  "never fails",
  "zero risk",
  "risk free",
  "proven formula",
  "buy now",
  "buy today",
  "act fast",
  "limited time only",
];

const GUARANTEE_LANGUAGE: RegExp[] = [
  /\bguarantee[ds]?\b/i,
  /\bguarantee\b.*result/i,
  /results?\s+guaranteed/i,
  /money[- ]back\s+guarantee/i,
  /we\s+(guarantee|promise|ensure)\s+you/i,
];

const HIDDEN_COMPLIANCE_PHRASES: string[] = [
  "fca regulated",
  "fca-regulated",
  "financial advice",
  "investment advice",
  "this is not financial advice",
  "regulated by",
  "authorised and regulated",
  "authorized and regulated",
  "legal advice",
  "this is not legal advice",
];

const AI_PREDICTION_PATTERNS: RegExp[] = [
  /ai\s+(predicts?|forecasts?|recommends?|suggests?|calculates?)/i,
  /algorithm\s+(guarantees?|predicts?|ensures?)/i,
  /machine\s+learning\s+shows?/i,
  /our\s+ai\s+(says?|shows?|proves?)/i,
  /data\s+science\s+(proves?|guarantees?)/i,
];

const EVIDENCE_POSTURE_WEAKNESS: string[] = [
  "we believe",
  "we think",
  "in our opinion",
  "we feel",
  "it seems",
  "probably",
  "should work",
  "might work",
  "could work",
];

const IP_LEAKAGE_PATTERNS: RegExp[] = [
  /\bip\s+score\b/i,
  /\bintelligence\s+spine\b/i,
  /\bfoundry\s+(score|rating|output)\b/i,
  /\bhcd\s+(score|delta|metric)\b/i,
  /\bogr\s+(score|index|rating)\b/i,
  /\bconstitutional\s+score\b/i,
  /lifecycle.state/i,
  /release.gate/i,
  /contentlayer/i,
];

const UNSUPPORTED_AUTHORITY_PATTERNS: RegExp[] = [
  /#[12]\s+in\s+/i,
  /top\s+\d+\s+(advisor|firm|consultant)/i,
  /award[- ]winning\s+(?:service|program|methodology)/i,
  /world.class\b/i,
  /industry-leading\b/i,
  /best[- ]in[- ]class\b/i,
  /market\s+leader\b/i,
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function detectUSSpelling(text: string): string[] {
  const violations: string[] = [];
  const words = text.split(/\b/);
  for (const word of words) {
    const lower = word.toLowerCase();
    if (US_TO_UK_MAP[lower]) {
      violations.push(`"${word}" → "${US_TO_UK_MAP[lower]}"`);
    }
  }
  return [...new Set(violations)];
}

function detectPhrases(text: string, phrases: string[]): string[] {
  const norm = normalise(text);
  return phrases.filter((p) => norm.includes(p.toLowerCase()));
}

function detectPatterns(text: string, patterns: RegExp[]): string[] {
  return patterns
    .filter((p) => p.test(text))
    .map((p) => p.source);
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CLEAN_FIXTURE = {
  text: "Abraham of London works with founders and boards to establish clear decision authority. Our diagnostic process surfaces the patterns that organisations cannot see from within.",
  title: "Decision Authority and Organisational Clarity",
  contentType: "editorial",
};

const DIRTY_FIXTURE = {
  text: "Guaranteed results. Our AI predicts your organization will save 100% of wasted costs. We believe our IP score algorithm is world-class and FCA regulated. Buy now — limited time only!",
  title: "Guaranteed Success",
  contentType: "editorial",
};

// ─── Self-test ────────────────────────────────────────────────────────────────

async function selfTest(): Promise<{ ok: boolean; message: string }> {
  try {
    // Clean text should have no violations
    const cleanFindings: string[] = [];
    const usSpelling = detectUSSpelling(CLEAN_FIXTURE.text);
    const overclaims = detectPhrases(CLEAN_FIXTURE.text, FORBIDDEN_OVERCLAIM_PHRASES);
    if (usSpelling.length > 0) cleanFindings.push(`unexpected US spelling: ${usSpelling.join(", ")}`);
    if (overclaims.length > 0) cleanFindings.push(`unexpected overclaims: ${overclaims.join(", ")}`);

    // Dirty text must detect violations
    const dirtyViolations = [
      ...detectPhrases(DIRTY_FIXTURE.text, FORBIDDEN_OVERCLAIM_PHRASES),
      ...detectPatterns(DIRTY_FIXTURE.text, GUARANTEE_LANGUAGE),
      ...detectPatterns(DIRTY_FIXTURE.text, AI_PREDICTION_PATTERNS),
    ];

    if (cleanFindings.length > 0) {
      return { ok: false, message: `Clean fixture triggered violations: ${cleanFindings.join("; ")}` };
    }
    if (dirtyViolations.length === 0) {
      return { ok: false, message: "Dirty fixture did not trigger any violations" };
    }

    return {
      ok: true,
      message: `Clean: 0 violations. Dirty: ${dirtyViolations.length} violations detected.`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Self-test failed" };
  }
}

function getVersion(): string {
  return EDITORIAL_STYLE_VERSION;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function run(input: EngineRunInput): Promise<EngineRunOutput> {
  const startTime = Date.now();

  const payload = (input?.payload ?? {}) as Record<string, unknown>;
  const findings: Finding[] = [];

  // ── Input resolution ────────────────────────────────────────────────────────
  let text: string;
  let title: string;
  let contentType: string;

  if (payload.useDirtyFixture === true) {
    ({ text, title, contentType } = DIRTY_FIXTURE);
  } else if (payload.useCleanFixture === true || !("text" in payload)) {
    ({ text, title, contentType } = CLEAN_FIXTURE);
  } else {
    text = typeof payload.text === "string" ? payload.text : "";
    title = typeof payload.title === "string" ? payload.title : "";
    contentType = typeof payload.contentType === "string" ? payload.contentType : "editorial";
  }

  if (!text) {
    return {
      findings: [
        {
          id: `editorial-no-text-${Date.now()}`,
          title: "No content provided",
          description: "Editorial style check requires a text string.",
          severity: "HIGH",
          source: `${EDITORIAL_STYLE_ENGINE_ID}::run::input-validation`,
          evidence: "payload.text is empty or missing",
          remediation: "Provide a non-empty text string in the payload.",
        },
      ],
      summary: "No content provided for style check.",
      severity: "HIGH",
      engineVersion: EDITORIAL_STYLE_VERSION,
      durationMs: Date.now() - startTime,
      limitations: [],
      rawOutput: { engineId: EDITORIAL_STYLE_ENGINE_ID, runAt: new Date().toISOString() },
    };
  }

  // ── Run checks ──────────────────────────────────────────────────────────────
  const usSpellingViolations = detectUSSpelling(text);
  const titleUSSpellingViolations = title ? detectUSSpelling(title) : [];
  const overclaims = detectPhrases(text, FORBIDDEN_OVERCLAIM_PHRASES);
  const guaranteeMatches = detectPatterns(text, GUARANTEE_LANGUAGE);
  const compliancePhrases = detectPhrases(text, HIDDEN_COMPLIANCE_PHRASES);
  const aiPredictionMatches = detectPatterns(text, AI_PREDICTION_PATTERNS);
  const evidenceWeakness = detectPhrases(text, EVIDENCE_POSTURE_WEAKNESS);
  const ipLeakage = detectPatterns(text, IP_LEAKAGE_PATTERNS);
  const authorityViolations = detectPatterns(text, UNSUPPORTED_AUTHORITY_PATTERNS);

  // ── Formula steps ───────────────────────────────────────────────────────────
  const formulaSteps: FormulaStep[] = [
    {
      stepId: "content-profile",
      label: "Content profile",
      inputs: {
        contentType,
        textLength: text.length,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        hasTitle: title ? "yes" : "no",
      },
      output: `${text.length} chars, ${text.split(/\s+/).filter(Boolean).length} words`,
      sourceRule: "detectPhrases() / detectPatterns() — lib/research/engines/editorial-style-checker-adapter.ts",
      engineVersion: EDITORIAL_STYLE_VERSION,
    },
    {
      stepId: "rule-results",
      label: "Rule evaluation results",
      inputs: {
        usSpellingCount: usSpellingViolations.length + titleUSSpellingViolations.length,
        overclaimCount: overclaims.length,
        guaranteeCount: guaranteeMatches.length,
        complianceCount: compliancePhrases.length,
        aiPredictionCount: aiPredictionMatches.length,
        evidenceWeaknessCount: evidenceWeakness.length,
        ipLeakageCount: ipLeakage.length,
        authorityCount: authorityViolations.length,
      },
      intermediate: {
        totalViolations: String(
          usSpellingViolations.length + titleUSSpellingViolations.length +
          overclaims.length + guaranteeMatches.length + compliancePhrases.length +
          aiPredictionMatches.length + evidenceWeakness.length + ipLeakage.length + authorityViolations.length
        ),
      },
      output: overclaims.length + guaranteeMatches.length + compliancePhrases.length === 0
        ? "CLEAR — no high-severity violations"
        : "VIOLATIONS — high-severity findings",
      sourceRule: "detectPhrases() / detectPatterns() — lib/research/engines/editorial-style-checker-adapter.ts",
      engineVersion: EDITORIAL_STYLE_VERSION,
    },
  ];

  // ── Map violations to findings ──────────────────────────────────────────────
  const allUSSpelling = [...usSpellingViolations, ...titleUSSpellingViolations];
  if (allUSSpelling.length > 0) {
    findings.push({
      id: `editorial-us-spelling-${Date.now()}`,
      title: `US spelling detected (${allUSSpelling.length} instance(s))`,
      description: `American English spelling found. Abraham of London uses UK English throughout.\n${allUSSpelling.join("\n")}`,
      severity: "MEDIUM",
      source: `${EDITORIAL_STYLE_ENGINE_ID}::uk-us-spelling-drift`,
      evidence: allUSSpelling.join(", "),
      remediation: "Replace US spellings with UK equivalents.",
    });
  }

  if (overclaims.length > 0) {
    findings.push({
      id: `editorial-overclaim-${Date.now()}`,
      title: `Overclaim language detected (${overclaims.length} phrase(s))`,
      description: `Forbidden overclaim phrases found: ${overclaims.join(", ")}. These cannot appear in any published content.`,
      severity: "CRITICAL",
      source: `${EDITORIAL_STYLE_ENGINE_ID}::overclaim-detection`,
      evidence: overclaims.join(" | "),
      remediation: "Remove all forbidden overclaim phrases. Replace with evidence-grounded, hedged language.",
    });
  }

  if (guaranteeMatches.length > 0) {
    findings.push({
      id: `editorial-guarantee-${Date.now()}`,
      title: "Guarantee language detected",
      description: "Language patterns suggesting outcome guarantees detected. No guarantee of results may be made.",
      severity: "HIGH",
      source: `${EDITORIAL_STYLE_ENGINE_ID}::guarantee-language`,
      evidence: `${guaranteeMatches.length} pattern(s) matched`,
      remediation: "Replace guarantee language with conditional framing (e.g., 'when authority is clear, execution follows').",
    });
  }

  if (compliancePhrases.length > 0) {
    findings.push({
      id: `editorial-compliance-${Date.now()}`,
      title: `Hidden compliance assertion detected (${compliancePhrases.length})`,
      description: `Compliance/regulation language detected: ${compliancePhrases.join(", ")}. These assertions require formal verification.`,
      severity: "HIGH",
      source: `${EDITORIAL_STYLE_ENGINE_ID}::hidden-compliance-assertions`,
      evidence: compliancePhrases.join(" | "),
      remediation: "Remove compliance claims unless formally verified and approved by legal.",
    });
  }

  if (aiPredictionMatches.length > 0) {
    findings.push({
      id: `editorial-ai-prediction-${Date.now()}`,
      title: "AI prediction claim detected",
      description: "Language suggesting AI/algorithmic outcome prediction detected. This violates editorial standards.",
      severity: "HIGH",
      source: `${EDITORIAL_STYLE_ENGINE_ID}::ai-prediction-claims`,
      evidence: `${aiPredictionMatches.length} pattern(s) matched`,
      remediation: "Remove AI prediction language. Abraham of London does not claim algorithmic outcome prediction.",
    });
  }

  if (evidenceWeakness.length > 0) {
    findings.push({
      id: `editorial-evidence-posture-${Date.now()}`,
      title: `Evidence posture weakness (${evidenceWeakness.length} phrase(s))`,
      description: `Weak evidential framing detected: ${evidenceWeakness.join(", ")}. These phrases undermine authority and claim defensibility.`,
      severity: "LOW",
      source: `${EDITORIAL_STYLE_ENGINE_ID}::evidence-posture-weakness`,
      evidence: evidenceWeakness.join(" | "),
      remediation: "Replace opinion language with observation language backed by diagnostic evidence.",
    });
  }

  if (ipLeakage.length > 0) {
    findings.push({
      id: `editorial-ip-leakage-${Date.now()}`,
      title: "IP scoring logic leakage detected",
      description: "Internal terminology or scoring logic references detected. These must not appear in client-facing or public copy.",
      severity: "HIGH",
      source: `${EDITORIAL_STYLE_ENGINE_ID}::ip-scoring-logic-leakage`,
      evidence: `${ipLeakage.length} pattern(s) matched`,
      remediation: "Remove internal scoring, Foundry, or platform terminology from public copy.",
    });
  }

  if (authorityViolations.length > 0) {
    findings.push({
      id: `editorial-authority-${Date.now()}`,
      title: "Unsupported authority claim detected",
      description: "Language claiming authority rankings or superiority without evidence: industry-leading, world-class, etc.",
      severity: "MEDIUM",
      source: `${EDITORIAL_STYLE_ENGINE_ID}::unsupported-authority-claims`,
      evidence: `${authorityViolations.length} pattern(s) matched`,
      remediation: "Remove or replace with evidence-backed positioning.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: `editorial-clear-${Date.now()}`,
      title: "Editorial style: CLEAR",
      description: "No style violations detected. Content meets Abraham of London editorial standards.",
      severity: "INFO",
      source: `${EDITORIAL_STYLE_ENGINE_ID}::clear`,
      evidence: `${text.length} chars evaluated across 8 rule categories`,
    });
  }

  // ── Overall severity ────────────────────────────────────────────────────────
  const hasCritical = findings.some((f) => f.severity === "CRITICAL");
  const hasHigh = findings.some((f) => f.severity === "HIGH");
  const hasMedium = findings.some((f) => f.severity === "MEDIUM");

  const overallSeverity = hasCritical ? "CRITICAL" : hasHigh ? "HIGH" : hasMedium ? "MEDIUM" : findings.some((f) => f.severity === "LOW") ? "LOW" : "INFO";

  const violationCount = findings.filter((f) => f.severity !== "INFO").length;
  const summary = violationCount === 0
    ? "Editorial style check CLEAR — all 8 rule categories passed."
    : `${violationCount} editorial violation(s) detected across ${Object.keys(formulaSteps[1]?.inputs ?? {}).filter((k) => String((formulaSteps[1]?.inputs ?? {})[k]) !== "0").length} rule categories.`;

  const durationMs = Date.now() - startTime;

  return {
    findings,
    summary,
    severity: overallSeverity,
    engineVersion: EDITORIAL_STYLE_VERSION,
    durationMs,
    limitations: [
      "UK/US spelling check uses a curated word list — comprehensive but not exhaustive.",
      "Pattern matching is heuristic — false positives possible for technical content using legitimate terminology.",
      "Manual review recommended for high-stakes content (boardroom dossiers, GMI reports).",
    ],
    rawOutput: {
      engineId: EDITORIAL_STYLE_ENGINE_ID,
      runAt: new Date().toISOString(),
      formulaSteps,
      contentType,
      textLength: text.length,
      ruleResults: {
        usSpellingViolations: allUSSpelling,
        overclaims,
        guaranteeMatches,
        compliancePhrases,
        aiPredictionMatches,
        evidenceWeakness,
        ipLeakage,
        authorityViolations,
      },
    },
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const editorialStyleCheckerAdapter = {
  id: EDITORIAL_STYLE_ENGINE_ID,
  run,
  selfTest,
  getVersion,
};
