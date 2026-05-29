/**
 * lib/research/engines/content-red-team-adapter.ts
 *
 * Intelligence Foundry adapter for Content Red-Team analysis.
 *
 * Stress-tests content for: overclaim density, fabricated authority, hidden
 * compliance assertions, claim-to-evidence ratio, drift from editorial
 * standards, and market protection violations.
 *
 * Distinct from editorial-style-checker-adapter:
 *   - editorial-style-checker: house style (UK spelling, tone, phraseology)
 *   - content-red-team:        adversarial content pressure-testing
 *     (fabricated credentials, unsupported superiority claims, regulatory
 *      misrepresentation, claim density, market overclaim risk)
 *
 * Status: PRODUCTION_CALLABLE
 *
 * Check categories:
 *   1. Fabricated credential detection (awards, rankings, accreditations)
 *   2. Regulatory misrepresentation (FCA, legal, financial claim framing)
 *   3. Market dominance overclaim (market leader, world-class, #1)
 *   4. Evidence-to-claim ratio (assertions without supporting evidence)
 *   5. Social proof manipulation (testimonials without attribution)
 *   6. Urgency/scarcity pressure tactics (limited time, act now)
 *   7. AI capability overclaim (predicts, guarantees, solves)
 *   8. Comparative claim without benchmark (better than competitors)
 *
 * Payload fields:
 *   - text: string — content to evaluate
 *   - title: string — content title
 *   - contentType: "editorial" | "blog" | "outbound" | "boardroom" | "gmi"
 *   - useDirtyFixture: boolean — run against known-bad content
 *   - useCleanFixture: boolean — run against known-clean content
 */

import "server-only";

import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ─────────────────────────────────────────────────────────

export const CONTENT_RED_TEAM_ENGINE_ID = "content-red-team";
export const CONTENT_RED_TEAM_VERSION = "1.0.0";

// ─── Rule definitions ─────────────────────────────────────────────────────────

const FABRICATED_CREDENTIAL_PATTERNS: RegExp[] = [
  /award[- ]winning\s+(?:consultancy|firm|service|methodology|approach)/i,
  /#1\s+(?:in|for|among)\s+\w+/i,
  /ranked\s+(?:number\s+one|#1|first|top)\s+(?:in|for|among)/i,
  /as\s+seen\s+in\s+(?:the\s+)?(?:bbc|ft|guardian|telegraph|times|forbes|bloomberg)/i,
  /featured\s+in\s+(?:the\s+)?(?:bbc|ft|guardian|telegraph|times|forbes|bloomberg)/i,
  /accredited\s+by\b/i,
  /certified\s+by\b/i,
  /endorsed\s+by\b/i,
  /trusted\s+by\s+(?:over\s+)?\d+/i,
];

const REGULATORY_MISREPRESENTATION: string[] = [
  "fca regulated",
  "fca-regulated",
  "fca authorised",
  "authorised and regulated",
  "authorized and regulated",
  "regulated by the fca",
  "financial advice",
  "investment advice",
  "legal advice",
  "this is not financial advice",
  "this is not legal advice",
  "not to be construed as",
];

const MARKET_DOMINANCE_OVERCLAIMS: RegExp[] = [
  /\bmarket\s+leader\b/i,
  /\bleading\s+(?:firm|consultancy|provider|platform)\b/i,
  /\bworld[- ]class\b/i,
  /\bindustry[- ]leading\b/i,
  /\bbest[- ]in[- ]class\b/i,
  /\bunrivalled\b/i,
  /\bunparalleled\b/i,
  /\bpremier\s+(?:firm|consultancy|provider)\b/i,
  /\bno\s+one\s+(?:else\s+)?(?:does|offers|provides)\b/i,
  /\bunique\s+(?:approach|method|system|framework)\b/i,
];

const URGENCY_SCARCITY_TACTICS: RegExp[] = [
  /\blimited\s+(?:time|spaces?|availability)\b/i,
  /\bact\s+now\b/i,
  /\bdon't\s+(?:miss|wait|delay)\b/i,
  /\bspots?\s+(?:are\s+)?(?:filling\s+up|limited|remaining)\b/i,
  /\bonly\s+\d+\s+(?:spot|place|seat)s?\s+(?:left|remaining|available)\b/i,
  /\btoday\s+only\b/i,
  /\bexpires?\s+(?:soon|today|midnight)\b/i,
];

const AI_CAPABILITY_OVERCLAIMS: RegExp[] = [
  /\bai\s+(?:guarantees?|ensures?|proves?|solves?)\b/i,
  /\bai\s+predicts?\s+(?:your|the|all)\b/i,
  /\balgorithm\s+(?:guarantees?|ensures?|eliminates?)\b/i,
  /\bmachine\s+learning\s+(?:guarantees?|ensures?|proves?)\b/i,
  /\bour\s+(?:ai|model|algorithm)\s+(?:knows?|understands?|sees?)\s+everything\b/i,
  /\bfully\s+automated\b/i,
  /\bzero\s+human\s+(?:error|bias|judgement)\b/i,
];

const UNSUPPORTED_COMPARATIVE_CLAIMS: RegExp[] = [
  /\bbetter\s+than\s+(?:all\s+)?(?:competitors?|others?|alternatives?|the\s+rest)\b/i,
  /\bmore\s+(?:effective|accurate|reliable|trusted)\s+than\b/i,
  /\boutperforms?\b/i,
  /\bcompetitors?\s+can't\s+(?:match|offer|deliver)\b/i,
  /\bunlike\s+(?:others?|competitors?|the\s+rest)\b/i,
];

// Social proof: quotes without clear attribution source (e.g. "(CEO, Company)" or "Name, Title")
const UNATTRIBUTED_SOCIAL_PROOF: RegExp[] = [
  /"[^"]{10,}"[\s\n]*(?:—|-|–)\s*(?:client|customer|user|member|reader|participant)\b/i,
  /\btestimony\b/i,
  /\bclient\s+(?:said|stated|told\s+us)\b/i,
  /\bour\s+clients?\s+(?:report|say|tell\s+us)\b/i,
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectPatterns(text: string, patterns: RegExp[]): string[] {
  return patterns.filter((p) => p.test(text)).map((p) => p.source);
}

function detectPhrases(text: string, phrases: string[]): string[] {
  const norm = text.toLowerCase();
  return phrases.filter((p) => norm.includes(p.toLowerCase()));
}

/** Count declarative claims (assertions) vs hedged/evidenced statements */
function measureClaimDensity(text: string): { claimCount: number; evidenceCount: number; ratio: number } {
  const declarative = (text.match(/\b(?:we|our|you|your)\s+\w+\s/gi) ?? []).length;
  const evidenceMarkers = (text.match(/\b(?:research|data|evidence|study|studies|analysis|diagnostic|assessment|found|showed|demonstrated|measured)\b/gi) ?? []).length;
  const ratio = evidenceMarkers === 0 ? declarative : declarative / Math.max(evidenceMarkers, 1);
  return { claimCount: declarative, evidenceCount: evidenceMarkers, ratio };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CLEAN_FIXTURE = {
  text: `Abraham of London helps founders and boards establish decision authority and resolve the tensions that prevent effective execution. Our diagnostic process is grounded in observable patterns — not opinion. Every finding is traceable to a source. Every recommendation has an evidence path. Where evidence is absent, we say so.`,
  title: "Decision Authority — What We Do",
  contentType: "editorial",
};

const DIRTY_FIXTURE = {
  text: `Award-winning #1 consultancy. Our AI guarantees your organisation will solve all alignment failures. We are the undisputed market leader — better than all competitors. Trusted by over 5,000 companies. FCA regulated. Limited time only — act now before spots fill up! As seen in the FT. "This completely changed our business" — client. Our algorithm ensures zero human error.`,
  title: "We Are The Best — Act Now",
  contentType: "outbound",
};

// ─── Self-test ─────────────────────────────────────────────────────────────────

async function selfTest(): Promise<{ ok: boolean; message: string }> {
  try {
    // Clean: no violations
    const cleanChecks = [
      detectPatterns(CLEAN_FIXTURE.text, FABRICATED_CREDENTIAL_PATTERNS),
      detectPatterns(CLEAN_FIXTURE.text, MARKET_DOMINANCE_OVERCLAIMS),
      detectPatterns(CLEAN_FIXTURE.text, AI_CAPABILITY_OVERCLAIMS),
    ].flat();

    // Dirty: must detect violations
    const dirtyChecks = [
      detectPatterns(DIRTY_FIXTURE.text, FABRICATED_CREDENTIAL_PATTERNS),
      detectPatterns(DIRTY_FIXTURE.text, MARKET_DOMINANCE_OVERCLAIMS),
      detectPatterns(DIRTY_FIXTURE.text, AI_CAPABILITY_OVERCLAIMS),
      detectPatterns(DIRTY_FIXTURE.text, URGENCY_SCARCITY_TACTICS),
      detectPhrases(DIRTY_FIXTURE.text, REGULATORY_MISREPRESENTATION),
    ].flat();

    if (cleanChecks.length > 0) {
      return { ok: false, message: `Clean fixture triggered violations: ${cleanChecks.join("; ")}` };
    }
    if (dirtyChecks.length === 0) {
      return { ok: false, message: "Dirty fixture did not trigger any violations — detection broken" };
    }

    return {
      ok: true,
      message: `Clean: 0 violations. Dirty: ${dirtyChecks.length} violations detected.`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Self-test failed" };
  }
}

function getVersion(): string {
  return CONTENT_RED_TEAM_VERSION;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function run(input: EngineRunInput): Promise<EngineRunOutput> {
  const startTime = Date.now();
  const payload = (input?.payload ?? {}) as Record<string, unknown>;

  // ── Input resolution ────────────────────────────────────────────────────────
  let text: string;
  let title: string;
  let contentType: string;
  let fixtureMode: "clean" | "dirty" | "real";

  if (payload.useDirtyFixture === true) {
    ({ text, title, contentType } = DIRTY_FIXTURE);
    fixtureMode = "dirty";
  } else if (payload.useCleanFixture === true || !("text" in payload)) {
    ({ text, title, contentType } = CLEAN_FIXTURE);
    fixtureMode = "clean";
  } else {
    text = typeof payload.text === "string" ? payload.text : "";
    title = typeof payload.title === "string" ? payload.title : "";
    contentType = typeof payload.contentType === "string" ? payload.contentType : "editorial";
    fixtureMode = "real";
  }

  if (!text) {
    return {
      findings: [
        {
          id: `content-rt-no-text-${Date.now()}`,
          title: "No content provided",
          description: "Content red-team requires a text string.",
          severity: "HIGH",
          source: `${CONTENT_RED_TEAM_ENGINE_ID}::run::input-validation`,
          evidence: "payload.text is empty or missing",
          remediation: "Provide a non-empty text string in the payload.",
        },
      ],
      summary: "No content provided for content red-team.",
      severity: "HIGH",
      engineVersion: CONTENT_RED_TEAM_VERSION,
      durationMs: Date.now() - startTime,
      limitations: [],
      rawOutput: { engineId: CONTENT_RED_TEAM_ENGINE_ID, runAt: new Date().toISOString() },
    };
  }

  // ── Run all checks ──────────────────────────────────────────────────────────
  const fabricatedCredentials = detectPatterns(text, FABRICATED_CREDENTIAL_PATTERNS);
  const regulatoryMisrep = detectPhrases(text, REGULATORY_MISREPRESENTATION);
  const marketOverclaims = detectPatterns(text, MARKET_DOMINANCE_OVERCLAIMS);
  const urgencyTactics = detectPatterns(text, URGENCY_SCARCITY_TACTICS);
  const aiOverclaims = detectPatterns(text, AI_CAPABILITY_OVERCLAIMS);
  const comparativeClaims = detectPatterns(text, UNSUPPORTED_COMPARATIVE_CLAIMS);
  const socialProof = detectPatterns(text, UNATTRIBUTED_SOCIAL_PROOF);
  const claimDensity = measureClaimDensity(text);

  // ── Formula steps ──────────────────────────────────────────────────────────
  const formulaSteps: FormulaStep[] = [
    {
      stepId: "content-profile",
      label: "Content profile",
      inputs: {
        contentType,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        charCount: text.length,
        fixtureMode,
      },
      output: `${text.split(/\s+/).filter(Boolean).length} words, ${text.length} chars`,
      sourceRule: "content-red-team-adapter::content-profile",
      engineVersion: CONTENT_RED_TEAM_VERSION,
    },
    {
      stepId: "claim-density",
      label: "Claim-to-evidence ratio",
      inputs: {
        declarativeClaims: claimDensity.claimCount,
        evidenceMarkers: claimDensity.evidenceCount,
      },
      intermediate: {
        ratio: claimDensity.ratio.toFixed(2),
      },
      output: claimDensity.ratio > 5 ? "HIGH claim density — evidence markers sparse" : "Claim density within tolerance",
      sourceRule: "content-red-team-adapter::claim-density",
      engineVersion: CONTENT_RED_TEAM_VERSION,
    },
    {
      stepId: "red-team-results",
      label: "Red-team check results",
      inputs: {
        fabricatedCredentials: fabricatedCredentials.length,
        regulatoryMisrep: regulatoryMisrep.length,
        marketOverclaims: marketOverclaims.length,
        urgencyTactics: urgencyTactics.length,
        aiOverclaims: aiOverclaims.length,
        comparativeClaims: comparativeClaims.length,
        socialProof: socialProof.length,
      },
      intermediate: {
        totalViolations: String(
          fabricatedCredentials.length + regulatoryMisrep.length + marketOverclaims.length +
          urgencyTactics.length + aiOverclaims.length + comparativeClaims.length + socialProof.length
        ),
      },
      output:
        fabricatedCredentials.length + regulatoryMisrep.length + marketOverclaims.length + aiOverclaims.length === 0
          ? "CLEAR — no high-severity content violations"
          : "VIOLATIONS — content red-team findings",
      sourceRule: "content-red-team-adapter::red-team-aggregation",
      engineVersion: CONTENT_RED_TEAM_VERSION,
    },
  ];

  // ── Map to findings ─────────────────────────────────────────────────────────
  const findings: Finding[] = [];

  if (fabricatedCredentials.length > 0) {
    findings.push({
      id: `content-rt-fabricated-${Date.now()}`,
      title: `Fabricated credential / unverifiable authority claim (${fabricatedCredentials.length})`,
      description: `Content contains award, ranking, or media-placement claims that cannot be verified from context.\n${fabricatedCredentials.join("\n")}`,
      severity: "CRITICAL",
      source: `${CONTENT_RED_TEAM_ENGINE_ID}::FABRICATED_CREDENTIALS`,
      evidence: fabricatedCredentials.join(" | "),
      remediation:
        "Remove all unverifiable credential claims. Replace with traceable, specific evidence (e.g., cite the specific award body, year, and category — or remove the claim entirely).",
    });
  }

  if (regulatoryMisrep.length > 0) {
    findings.push({
      id: `content-rt-regulatory-${Date.now()}`,
      title: `Regulatory misrepresentation (${regulatoryMisrep.length})`,
      description: `Content contains regulatory or compliance language that may misrepresent Abraham of London's regulatory status or the nature of the service.\n${regulatoryMisrep.join(", ")}`,
      severity: "CRITICAL",
      source: `${CONTENT_RED_TEAM_ENGINE_ID}::REGULATORY_MISREPRESENTATION`,
      evidence: regulatoryMisrep.join(" | "),
      remediation:
        "Remove all regulatory framing. Abraham of London is not FCA-regulated and does not provide financial, investment, or legal advice. Any legal/compliance disclaimers must be reviewed by legal before publication.",
    });
  }

  if (marketOverclaims.length > 0) {
    findings.push({
      id: `content-rt-market-${Date.now()}`,
      title: `Market dominance overclaim (${marketOverclaims.length})`,
      description: `Content asserts market leadership or superiority without evidence.\n${marketOverclaims.join("\n")}`,
      severity: "HIGH",
      source: `${CONTENT_RED_TEAM_ENGINE_ID}::MARKET_DOMINANCE_OVERCLAIM`,
      evidence: marketOverclaims.join(" | "),
      remediation:
        "Replace market dominance claims with specific, verifiable positioning. Instead of 'market leader', describe what is specifically done and for whom.",
    });
  }

  if (aiOverclaims.length > 0) {
    findings.push({
      id: `content-rt-ai-${Date.now()}`,
      title: `AI capability overclaim (${aiOverclaims.length})`,
      description: `Content makes AI/algorithmic capability claims that exceed what can be demonstrated or defended.\n${aiOverclaims.join("\n")}`,
      severity: "HIGH",
      source: `${CONTENT_RED_TEAM_ENGINE_ID}::AI_CAPABILITY_OVERCLAIM`,
      evidence: aiOverclaims.join(" | "),
      remediation:
        "Remove AI certainty language. Describe what the engine actually does, under what conditions, and with what limitations. No engine guarantees outcomes.",
    });
  }

  if (comparativeClaims.length > 0) {
    findings.push({
      id: `content-rt-comparative-${Date.now()}`,
      title: `Unsupported comparative claim (${comparativeClaims.length})`,
      description: `Content makes comparative claims against competitors or alternatives without benchmark evidence.\n${comparativeClaims.join("\n")}`,
      severity: "HIGH",
      source: `${CONTENT_RED_TEAM_ENGINE_ID}::COMPARATIVE_WITHOUT_BENCHMARK`,
      evidence: comparativeClaims.join(" | "),
      remediation:
        "Remove comparative claims unless backed by a specific, published benchmark or independent study. Describe the approach, not the competitor comparison.",
    });
  }

  if (urgencyTactics.length > 0) {
    findings.push({
      id: `content-rt-urgency-${Date.now()}`,
      title: `Urgency/scarcity pressure tactic (${urgencyTactics.length})`,
      description: `Content uses urgency or artificial scarcity language that is inconsistent with Abraham of London's positioning.\n${urgencyTactics.join("\n")}`,
      severity: "MEDIUM",
      source: `${CONTENT_RED_TEAM_ENGINE_ID}::URGENCY_SCARCITY_TACTICS`,
      evidence: urgencyTactics.join(" | "),
      remediation:
        "Remove pressure tactics. Abraham of London does not use manufactured urgency. Replace with factual framing of why timing matters (e.g., strategic window, market conditions).",
    });
  }

  if (socialProof.length > 0) {
    findings.push({
      id: `content-rt-social-proof-${Date.now()}`,
      title: `Unattributed social proof (${socialProof.length})`,
      description: `Content includes testimonials or client claims without verifiable attribution.`,
      severity: "MEDIUM",
      source: `${CONTENT_RED_TEAM_ENGINE_ID}::UNATTRIBUTED_SOCIAL_PROOF`,
      evidence: `${socialProof.length} pattern(s) matched`,
      remediation:
        "All testimonials must include: full name, title, company (with permission). Anonymous 'a client said' claims are not permitted.",
    });
  }

  // High claim density warning
  if (claimDensity.ratio > 8) {
    findings.push({
      id: `content-rt-claim-density-${Date.now()}`,
      title: "High claim density — evidence posture weak",
      description: `Claim-to-evidence ratio is ${claimDensity.ratio.toFixed(1)} (${claimDensity.claimCount} declarative claims, ${claimDensity.evidenceCount} evidence markers). Content asserts without grounding.`,
      severity: "LOW",
      source: `${CONTENT_RED_TEAM_ENGINE_ID}::CLAIM_DENSITY`,
      evidence: `ratio ${claimDensity.ratio.toFixed(2)} — threshold 8.0`,
      remediation:
        "Increase evidence density: cite diagnostics, findings, client data (anonymised), or structured assessments to support assertions.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: `content-rt-clear-${Date.now()}`,
      title: "Content red-team: CLEAR",
      description: `No content violations detected. Content meets Abraham of London market protection standards.`,
      severity: "INFO",
      source: `${CONTENT_RED_TEAM_ENGINE_ID}::clear`,
      evidence: `${text.split(/\s+/).filter(Boolean).length} words evaluated across 8 red-team categories`,
    });
  }

  // ── Overall severity ────────────────────────────────────────────────────────
  const hasCritical = findings.some((f) => f.severity === "CRITICAL");
  const hasHigh = findings.some((f) => f.severity === "HIGH");
  const hasMedium = findings.some((f) => f.severity === "MEDIUM");
  const overallSeverity = hasCritical ? "CRITICAL" : hasHigh ? "HIGH" : hasMedium ? "MEDIUM" : findings.some((f) => f.severity === "LOW") ? "LOW" : "INFO";

  const violationCount = findings.filter((f) => f.severity !== "INFO").length;
  const summary =
    violationCount === 0
      ? `Content red-team CLEAR — ${text.split(/\s+/).filter(Boolean).length} words, 8 categories, 0 violations.`
      : `${violationCount} content violation(s) across ${[fabricatedCredentials, regulatoryMisrep, marketOverclaims, urgencyTactics, aiOverclaims, comparativeClaims, socialProof].filter((a) => a.length > 0).length} category(s). Highest severity: ${overallSeverity}.`;

  return {
    findings,
    summary,
    severity: overallSeverity,
    engineVersion: CONTENT_RED_TEAM_VERSION,
    durationMs: Date.now() - startTime,
    limitations: [
      "Pattern matching is heuristic — false positives possible for technical or legal content.",
      "Claim density uses word-count heuristics — not semantic parsing.",
      "Social proof detection matches form patterns only; manual review needed for subtle cases.",
      "Does not evaluate factual accuracy of specific claims — only structural risk patterns.",
    ],
    promotionRequirements: [
      "Integrate with GMI phrasing standard registry for live phrase blocklist sync.",
      "Add semantic claim severity scoring (NLP-based confidence weighting).",
      "Add cross-document consistency check (claim X contradicts earlier asset Y).",
    ],
    rawOutput: {
      engineId: CONTENT_RED_TEAM_ENGINE_ID,
      runAt: new Date().toISOString(),
      fixtureMode,
      contentType,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      formulaSteps,
      checkResults: {
        fabricatedCredentials,
        regulatoryMisrep,
        marketOverclaims,
        urgencyTactics,
        aiOverclaims,
        comparativeClaims,
        socialProof,
        claimDensity,
      },
    },
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const contentRedTeamAdapter = {
  id: CONTENT_RED_TEAM_ENGINE_ID,
  run,
  selfTest,
  getVersion,
};
