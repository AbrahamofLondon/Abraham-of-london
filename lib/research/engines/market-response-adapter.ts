/**
 * lib/research/engines/market-response-adapter.ts
 *
 * Intelligence Foundry adapter for the Market Response engine.
 *
 * Deterministic copy analysis for outbound marketing and positioning text.
 * No invented scores — all findings reference specific matched strings.
 *
 * Checks:
 *   1. CTA verb check — weak/vague action verbs in CTAs
 *   2. Headline concrete noun check — abstract headline language
 *   3. Generic SaaS language detection — commoditised B2B clichés
 *   4. Forbidden phrase detection — overclaim, urgency, guarantee language
 *   5. Audience clarity check — undefined/generic audience references
 *   6. Platform length check — character/word count against per-platform limits
 *   7. Unsupported claim detection — comparative claims lacking evidence basis
 *
 * Status: PRODUCTION_CALLABLE
 * - All rules are deterministic — no AI, no external calls
 * - No invented scores. Findings are present/absent and count-based.
 */

import "server-only";

import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ─────────────────────────────────────────────────────────

export const MARKET_RESPONSE_ENGINE_ID = "market-response";
export const MARKET_RESPONSE_VERSION = "1.0.0";

// ─── Platform limits ─────────────────────────────────────────────────────────

const PLATFORM_LIMITS: Record<string, { chars?: number; words?: number; label: string }> = {
  "linkedin-post":    { chars: 3000, label: "LinkedIn post" },
  "linkedin-article": { chars: 110_000, label: "LinkedIn article" },
  "x-post":           { chars: 280, label: "X (Twitter) post" },
  "facebook-post":    { chars: 63_206, label: "Facebook post" },
  "email-subject":    { chars: 60, words: 10, label: "Email subject line" },
  "email-preview":    { chars: 90, label: "Email preview text" },
  "ad-headline":      { chars: 30, words: 5, label: "Ad headline" },
  "ad-description":   { chars: 90, words: 20, label: "Ad description" },
  "meta-description": { chars: 160, label: "Meta description" },
  "page-title":       { chars: 60, label: "Page title" },
};

// ─── Rule sets ────────────────────────────────────────────────────────────────

const WEAK_CTA_VERBS: string[] = [
  "click here", "learn more", "find out more", "read more", "more info",
  "get started", "get in touch", "contact us", "reach out", "let's connect",
  "submit", "proceed",
];

const GENERIC_SAAS_PHRASES: string[] = [
  "all-in-one", "end-to-end", "360-degree", "360 degree", "seamlessly", "holistic",
  "synergy", "synergize", "disruptive", "disrupt the", "game-changing", "game changer",
  "next-generation", "next generation", "cutting-edge", "cutting edge",
  "state-of-the-art", "world-class", "best-in-class", "industry-leading",
  "industry leading", "thought leader", "thought leadership", "move the needle",
  "take it to the next level", "leverage", "utilise our", "utilize our",
  "empower your", "unlock your potential", "unlock the power",
  "transform your business", "digital transformation", "robust solution",
  "scalable solution", "innovative solution", "bespoke solution",
  "turnkey solution", "one-stop shop", "value-added", "value proposition",
  "pain points",
];

const FORBIDDEN_PHRASES: { phrase: string; category: string }[] = [
  { phrase: "guaranteed results",   category: "guarantee" },
  { phrase: "guaranteed to",        category: "guarantee" },
  { phrase: "100% guaranteed",      category: "guarantee" },
  { phrase: "money-back guarantee", category: "guarantee" },
  { phrase: "we guarantee",         category: "guarantee" },
  { phrase: "results guaranteed",   category: "guarantee" },
  { phrase: "act now",              category: "urgency" },
  { phrase: "limited time",         category: "urgency" },
  { phrase: "limited offer",        category: "urgency" },
  { phrase: "don't miss out",       category: "urgency" },
  { phrase: "expires soon",         category: "urgency" },
  { phrase: "last chance",          category: "urgency" },
  { phrase: "only a few left",      category: "urgency" },
  { phrase: "never fails",          category: "overclaim" },
  { phrase: "always works",         category: "overclaim" },
  { phrase: "zero risk",            category: "overclaim" },
  { phrase: "risk-free",            category: "overclaim" },
  { phrase: "proven to",            category: "overclaim" },
  { phrase: "scientifically proven",category: "overclaim" },
  { phrase: "clinically proven",    category: "overclaim" },
];

const UNSUPPORTED_COMPARATIVE_PATTERNS: RegExp[] = [
  /\b(?:the\s+)?(?:only|best|leading|top|fastest|most\s+\w+)\s+(?:in\s+(?:the\s+)?(?:uk|world|europe|market|industry))/i,
  /\b(?:number\s+one|#1)\s+(?:in\s+(?:the\s+)?(?:uk|world|europe|market|industry)|\w+\s+provider)/i,
  /better\s+than\s+(?:the\s+)?competition/i,
  /outperforms?\s+(?:every|all|other)/i,
  /nobody\s+(?:does|offers|provides)\s+(?:it\s+)?better/i,
  /unlike\s+(?:the\s+)?competition,?\s+we\b/i,
];

const VAGUE_AUDIENCE_PATTERNS: RegExp[] = [
  /\b(?:everyone|anybody|every\s+(?:business|company|organisation|organization))\b/i,
  /\b(?:all\s+(?:businesses|companies|organisations|organizations|teams|leaders))\b/i,
  /\bfor\s+(?:anyone|everybody|all)\b/i,
  /\bwhatever\s+(?:your\s+)?(?:size|industry|sector|need)\b/i,
];

const ABSTRACT_HEADLINE_WORDS = [
  "success", "excellence", "innovation", "solutions", "strategy",
  "insight", "insights", "optimisation", "optimization", "efficiency",
  "performance", "results", "outcomes", "value", "impact",
];

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CLEAN_FIXTURE = `We work with founders who have built evidence-based authority in their sector and want to communicate it to the market without compromise.

Our engagements follow a structured intake: a two-hour diagnostic, a written brief, and a 90-day engagement with defined deliverables.

Book a diagnostic call to see if we are the right fit for your situation.`;

const DIRTY_FIXTURE = `We are the leading all-in-one solution for business transformation! Our cutting-edge platform seamlessly leverages synergy across your entire organisation.

We guarantee results or your money back. Act now — limited time offer. Don't miss out on this game-changing opportunity to move the needle.

For everyone in business: our best-in-class system is scientifically proven to outperform the competition. We're number one in the UK market.

Click here to get started.`;

// ─── Check helpers ─────────────────────────────────────────────────────────────

function matchPhrase(text: string, phrase: string): boolean {
  return new RegExp(`\\b${phrase.replace(/[-\s]/g, "[\\s-]")}\\b`, "i").test(text);
}

// ─── Run function ─────────────────────────────────────────────────────────────

async function run(input: EngineRunInput): Promise<EngineRunOutput> {
  const startTime = Date.now();
  const {
    text = "",
    platform = "none",
    isHeadline = false,
    mode = "analyze",
  } = (input.payload ?? {}) as {
    text?: string;
    platform?: string;
    isHeadline?: boolean;
    mode?: "analyze" | "clean" | "dirty";
  };

  const content = mode === "clean" ? CLEAN_FIXTURE : mode === "dirty" ? DIRTY_FIXTURE : text;
  const effectivePlatform = (mode === "clean" || mode === "dirty") ? "none" : platform;
  const effectiveIsHeadline = Boolean(isHeadline || mode === "dirty");

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  // ── 1. CTA verb check ──────────────────────────────────────────────────────
  const weakCtaMatches = WEAK_CTA_VERBS.filter((p) => matchPhrase(content, p));

  // ── 2. Headline abstract language ─────────────────────────────────────────
  const abstractHeadlineMatches = effectiveIsHeadline
    ? ABSTRACT_HEADLINE_WORDS.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(content))
    : [];

  // ── 3. Generic SaaS language ───────────────────────────────────────────────
  const genericSaasMatches = GENERIC_SAAS_PHRASES.filter((p) => matchPhrase(content, p));

  // ── 4. Forbidden phrases (by category) ────────────────────────────────────
  const forbiddenByCategory: Record<string, string[]> = {};
  for (const { phrase, category } of FORBIDDEN_PHRASES) {
    if (matchPhrase(content, phrase)) {
      (forbiddenByCategory[category] ??= []).push(phrase);
    }
  }

  // ── 5. Unsupported comparative claims ─────────────────────────────────────
  const comparativeMatches: string[] = [];
  for (const pattern of UNSUPPORTED_COMPARATIVE_PATTERNS) {
    const m = content.match(pattern);
    if (m) comparativeMatches.push(m[0]);
  }

  // ── 6. Audience clarity ────────────────────────────────────────────────────
  const audienceMatches: string[] = [];
  for (const pattern of VAGUE_AUDIENCE_PATTERNS) {
    const m = content.match(pattern);
    if (m) audienceMatches.push(m[0]);
  }

  // ── 7. Platform length ─────────────────────────────────────────────────────
  const platformLimit = PLATFORM_LIMITS[effectivePlatform];
  const lengthViolations: { type: "chars" | "words"; current: number; limit: number; label: string }[] = [];
  if (platformLimit) {
    if (platformLimit.chars && charCount > platformLimit.chars) {
      lengthViolations.push({ type: "chars", current: charCount, limit: platformLimit.chars, label: platformLimit.label });
    }
    if (platformLimit.words && wordCount > platformLimit.words) {
      lengthViolations.push({ type: "words", current: wordCount, limit: platformLimit.words, label: platformLimit.label });
    }
  }

  // ── Formula trace ──────────────────────────────────────────────────────────
  const formulaSteps: FormulaStep[] = [
    {
      stepId: "content-profile",
      label: "Content profile",
      inputs: { wordCount, charCount, platform: effectivePlatform, isHeadline: String(effectiveIsHeadline), mode },
      output: `${wordCount} words / ${charCount} chars`,
      sourceRule: "market-response-adapter::content-profile",
      engineVersion: MARKET_RESPONSE_VERSION,
    },
    {
      stepId: "cta-verb",
      label: "CTA verb check",
      inputs: { patternsChecked: WEAK_CTA_VERBS.length },
      intermediate: { matched: weakCtaMatches.join(", ") || "none" },
      output: weakCtaMatches.length > 0 ? `FAIL — ${weakCtaMatches.length} weak verb(s)` : "PASS",
      sourceRule: "market-response-adapter::cta-verb-check",
      engineVersion: MARKET_RESPONSE_VERSION,
    },
    {
      stepId: "generic-saas",
      label: "Generic SaaS language",
      inputs: { patternsChecked: GENERIC_SAAS_PHRASES.length },
      intermediate: { matchCount: genericSaasMatches.length, topMatches: genericSaasMatches.slice(0, 3).join(", ") || "none" },
      output: genericSaasMatches.length > 0 ? `FAIL — ${genericSaasMatches.length} phrase(s)` : "PASS",
      sourceRule: "market-response-adapter::generic-saas-check",
      engineVersion: MARKET_RESPONSE_VERSION,
    },
    {
      stepId: "forbidden-phrases",
      label: "Forbidden phrases",
      inputs: { patternsChecked: FORBIDDEN_PHRASES.length },
      intermediate: { categories: Object.keys(forbiddenByCategory).join(", ") || "none" },
      output: Object.keys(forbiddenByCategory).length > 0 ? `FAIL — categories: ${Object.keys(forbiddenByCategory).join(", ")}` : "PASS",
      sourceRule: "market-response-adapter::forbidden-phrase-check",
      engineVersion: MARKET_RESPONSE_VERSION,
    },
    {
      stepId: "comparatives",
      label: "Unsupported comparative claims",
      inputs: { patternsChecked: UNSUPPORTED_COMPARATIVE_PATTERNS.length },
      intermediate: { matched: comparativeMatches.join(" | ") || "none" },
      output: comparativeMatches.length > 0 ? `FAIL — ${comparativeMatches.length} claim(s)` : "PASS",
      sourceRule: "market-response-adapter::comparative-claim-check",
      engineVersion: MARKET_RESPONSE_VERSION,
    },
    {
      stepId: "audience",
      label: "Audience clarity",
      inputs: { patternsChecked: VAGUE_AUDIENCE_PATTERNS.length },
      intermediate: { matched: audienceMatches.join(" | ") || "none" },
      output: audienceMatches.length > 0 ? `WARN — ${audienceMatches.length} vague reference(s)` : "PASS",
      sourceRule: "market-response-adapter::audience-clarity-check",
      engineVersion: MARKET_RESPONSE_VERSION,
    },
    {
      stepId: "platform-length",
      label: "Platform length",
      inputs: { platform: effectivePlatform, charCount, wordCount },
      output: lengthViolations.length > 0
        ? `FAIL — ${lengthViolations.map((v) => `${v.type}: ${v.current}/${v.limit}`).join(", ")}`
        : effectivePlatform === "none" ? "NOT_CHECKED" : "PASS",
      sourceRule: "market-response-adapter::platform-length-check",
      engineVersion: MARKET_RESPONSE_VERSION,
    },
  ];

  // ── Map to findings ────────────────────────────────────────────────────────
  const findings: Finding[] = [];

  if (weakCtaMatches.length > 0) {
    findings.push({
      id: `market-cta-${Date.now()}`,
      title: `Weak CTA verb(s): ${weakCtaMatches.join(", ")}`,
      description: `${weakCtaMatches.length} weak/vague call-to-action verb(s) detected. These reduce response rates and undermine specific positioning.`,
      severity: "LOW",
      source: `${MARKET_RESPONSE_ENGINE_ID}::CTA_VERB_CHECK`,
      evidence: weakCtaMatches.join(" | "),
      remediation: "Replace with specific action verbs: 'Book a diagnostic call', 'Request the report', 'See the framework', 'Read the evidence'.",
    });
  }

  if (abstractHeadlineMatches.length >= 2) {
    findings.push({
      id: `market-headline-${Date.now()}`,
      title: `Abstract headline nouns (${abstractHeadlineMatches.length}): ${abstractHeadlineMatches.join(", ")}`,
      description: `Headline contains ${abstractHeadlineMatches.length} abstract nouns without anchoring specifics. Two or more abstract nouns compound — weakening credibility and recall.`,
      severity: "LOW",
      source: `${MARKET_RESPONSE_ENGINE_ID}::HEADLINE_ABSTRACT_NOUN_CHECK`,
      evidence: abstractHeadlineMatches.join(" | "),
      remediation: "Anchor with a specific domain, named entity, or measurable claim. Abstract nouns signal generic positioning.",
    });
  }

  if (genericSaasMatches.length > 0) {
    const sev = genericSaasMatches.length >= 4 ? "HIGH" : "MEDIUM";
    findings.push({
      id: `market-saas-${Date.now()}`,
      title: `Generic SaaS language (${genericSaasMatches.length} phrase${genericSaasMatches.length > 1 ? "s" : ""})`,
      description: `Copy contains commodity B2B/SaaS phrases that signal generic positioning: ${genericSaasMatches.slice(0, 5).join(", ")}${genericSaasMatches.length > 5 ? `… (+${genericSaasMatches.length - 5} more)` : ""}.`,
      severity: sev,
      source: `${MARKET_RESPONSE_ENGINE_ID}::GENERIC_SAAS_LANGUAGE`,
      evidence: genericSaasMatches.join(" | "),
      remediation: "Replace with domain-specific language referencing your actual methodology, named frameworks, or observable client outcomes.",
    });
  }

  for (const [category, phrases] of Object.entries(forbiddenByCategory)) {
    findings.push({
      id: `market-forbidden-${category}-${Date.now()}`,
      title: `Forbidden ${category} language (${phrases.length} match${phrases.length > 1 ? "es" : ""})`,
      description: `Content contains forbidden ${category} language: ${phrases.join(", ")}.`,
      severity: "CRITICAL",
      source: `${MARKET_RESPONSE_ENGINE_ID}::FORBIDDEN_${category.toUpperCase()}`,
      evidence: phrases.join(" | "),
      remediation: category === "guarantee"
        ? "Remove guarantee language. Describe real client outcomes with named evidence instead."
        : category === "urgency"
        ? "Remove manufactured urgency. Real scarcity (capacity limits, cohort dates) can be stated honestly with specifics."
        : "Remove overclaim. Qualify with evidence or remove the claim entirely.",
    });
  }

  if (comparativeMatches.length > 0) {
    findings.push({
      id: `market-comparative-${Date.now()}`,
      title: `Unsupported comparative claim(s) (${comparativeMatches.length})`,
      description: `Content contains comparative superlatives without verifiable evidence basis: ${comparativeMatches.join(" | ")}.`,
      severity: "HIGH",
      source: `${MARKET_RESPONSE_ENGINE_ID}::UNSUPPORTED_COMPARATIVE_CLAIM`,
      evidence: comparativeMatches.join(" | "),
      remediation: "Comparative superlatives require specific, verifiable evidence. Remove or replace with named, evidenced position statements.",
    });
  }

  if (audienceMatches.length > 0) {
    findings.push({
      id: `market-audience-${Date.now()}`,
      title: `Vague audience reference(s) (${audienceMatches.length})`,
      description: `Content uses generic audience descriptors: ${audienceMatches.join(" | ")}.`,
      severity: "LOW",
      source: `${MARKET_RESPONSE_ENGINE_ID}::AUDIENCE_CLARITY`,
      evidence: audienceMatches.join(" | "),
      remediation: "Name a specific audience: role, sector, organisation size, or decision context. 'Everyone' signals absence of positioning.",
    });
  }

  for (const v of lengthViolations) {
    findings.push({
      id: `market-length-${v.type}-${Date.now()}`,
      title: `${v.label}: ${v.type} limit exceeded (${v.current}/${v.limit})`,
      description: `Content exceeds the ${v.label} ${v.type} limit by ${v.current - v.limit} ${v.type === "chars" ? "characters" : "words"}.`,
      severity: "HIGH",
      source: `${MARKET_RESPONSE_ENGINE_ID}::PLATFORM_LENGTH_${v.type.toUpperCase()}`,
      evidence: `${v.current} ${v.type} / ${v.limit} limit`,
      remediation: `Trim by ${v.current - v.limit} ${v.type === "chars" ? "characters" : "words"} to fit the ${v.label} limit.`,
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: `market-clear-${Date.now()}`,
      title: "Market Response: CLEAR",
      description: `No market response violations detected. Copy passed all checks against ${WEAK_CTA_VERBS.length + GENERIC_SAAS_PHRASES.length + FORBIDDEN_PHRASES.length} rule patterns.`,
      severity: "INFO",
      source: `${MARKET_RESPONSE_ENGINE_ID}::CLEAR`,
      evidence: `${wordCount} words, ${charCount} chars evaluated`,
    });
  }

  // ── Overall severity ───────────────────────────────────────────────────────
  const hasCritical = findings.some((f) => f.severity === "CRITICAL");
  const hasHigh     = findings.some((f) => f.severity === "HIGH");
  const hasMedium   = findings.some((f) => f.severity === "MEDIUM");
  const hasLow      = findings.some((f) => f.severity === "LOW");
  const overallSeverity =
    hasCritical ? "CRITICAL" :
    hasHigh     ? "HIGH"     :
    hasMedium   ? "MEDIUM"   :
    hasLow      ? "LOW"      : "INFO";

  const violationCount = findings.filter((f) => f.severity !== "INFO").length;
  const summary =
    violationCount === 0
      ? `Market response CLEAR — ${wordCount} words, 7 checks, 0 violations.`
      : `${violationCount} copy violation(s) detected. Highest severity: ${overallSeverity}.`;

  return {
    findings,
    summary,
    severity: overallSeverity,
    engineVersion: MARKET_RESPONSE_VERSION,
    durationMs: Date.now() - startTime,
    limitations: [
      "Pattern-based detection. Does not evaluate factual accuracy of claims.",
      "Platform length checks are based on declared platform — no live platform API validation.",
      "Headline check only activates when isHeadline=true or in dirty-fixture mode.",
      "Does not check tone, sentiment, or audience fit beyond the listed patterns.",
    ],
    promotionRequirements: [
      "All CRITICAL and HIGH findings resolved or documented with rationale before publication.",
      "Platform length confirmed against target platform limits for each deployment surface.",
      "Content reviewed by copywriter applying Abraham of London house style.",
    ],
    rawOutput: {
      engineId: MARKET_RESPONSE_ENGINE_ID,
      runAt: new Date().toISOString(),
      mode,
      platform: effectivePlatform,
      wordCount,
      charCount,
      formulaSteps,
      checkResults: {
        weakCtaMatches,
        abstractHeadlineMatches,
        genericSaasMatches,
        forbiddenByCategory,
        comparativeMatches,
        audienceMatches,
        lengthViolations,
      },
    },
  };
}

// ─── Self-test ────────────────────────────────────────────────────────────────

async function selfTest(): Promise<{ ok: boolean; error?: string }> {
  try {
    // Clean fixture must produce only INFO (no violations)
    const clean = await run({ payload: { mode: "clean" } });
    const cleanViolations = clean.findings.filter((f) => f.severity !== "INFO");
    if (cleanViolations.length > 0) {
      return { ok: false, error: `Clean fixture produced violations: ${cleanViolations.map((f) => f.source).join(", ")}` };
    }

    // Dirty fixture must detect CRITICAL findings (forbidden phrases at minimum)
    const dirty = await run({ payload: { mode: "dirty" } });
    const criticalFindings = dirty.findings.filter((f) => f.severity === "CRITICAL" || f.severity === "HIGH");
    if (criticalFindings.length === 0) {
      return { ok: false, error: "Dirty fixture produced no CRITICAL/HIGH findings — detection logic may be broken" };
    }

    // Platform length: ad headline with too-long text must produce HIGH
    const longHeadline = await run({ payload: { text: "This is a headline that is much too long for an ad unit", platform: "ad-headline" } });
    const lenError = longHeadline.findings.find((f) => f.source.includes("PLATFORM_LENGTH") && f.severity === "HIGH");
    if (!lenError) {
      return { ok: false, error: "Platform length check missed overlong ad headline" };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "selfTest threw" };
  }
}

function getVersion(): string {
  return MARKET_RESPONSE_VERSION;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const marketResponseAdapter = {
  id:          MARKET_RESPONSE_ENGINE_ID,
  run,
  selfTest,
  getVersion,
};
