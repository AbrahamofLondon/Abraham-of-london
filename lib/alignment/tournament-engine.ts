// lib/alignment/tournament-engine.ts
//
// Enterprise-grade deterministic arbiter for Purpose Alignment synthesis.
// Deterministic scoring is sovereign. Generative synthesis may only win when
// it is anchored, compatible, specific, and free of invented claims.

import type { TournamentResult } from "./enhanced-types";
import type { DualAxisAnswer, PurposeProfileResult } from "./types";

type Reflections = {
  avoidedDecision: string;
  lastSevenDays: string;
  dissenter: string;
};

type DemographicContext = {
  role: string;
  industry: string;
};

type ViolationSeverity = "BLOCKER" | "WARNING";

type TournamentViolation = {
  code:
    | "SCORE_CONTRADICTION"
    | "NO_USER_ANCHOR"
    | "UNSUPPORTED_NUMBER"
    | "DOMAIN_CONTRADICTION"
    | "ROLE_MISMATCH"
    | "GENERIC_ADVICE"
    | "INVENTED_VERIFICATION"
    | "INVENTED_PEER_DATA";
  severity: ViolationSeverity;
  message: string;
};

const DOMAIN_ALIASES: Record<string, string[]> = {
  identity: ["identity", "mandate", "identity mandate", "coherent centre", "center"],
  decision: ["decision", "decision integrity", "choices", "decision-making"],
  environment: ["environment", "surroundings", "context", "operating environment"],
  behaviour: ["behaviour", "behavior", "daily action", "habits", "execution behaviour"],
  emotional_order: ["emotional order", "emotional", "internal instability", "emotional capacity"],
  legacy: ["legacy", "legacy orientation", "structures", "future building"],
};

const GENERIC_ADVICE_PATTERNS = [
  /reflect on/i,
  /consider/i,
  /you may want/i,
  /try to/i,
  /think about/i,
  /explore/i,
  /gain clarity/i,
  /improve alignment/i,
];

const INVENTED_VERIFICATION_PATTERNS = [
  /calendar confirms/i,
  /slack confirms/i,
  /verified by calendar/i,
  /verified by slack/i,
  /behavioural data confirms/i,
  /behavioral data confirms/i,
];

const INVENTED_PEER_PATTERNS = [
  /ceos like you/i,
  /leaders like you/i,
  /breach at \d+/i,
  /peer average/i,
  /industry benchmark/i,
];

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeDomain(value: unknown): string {
  const text = normalizeText(value).replace(/-/g, "_");

  if (text === "emotional order") return "emotional_order";
  if (text === "decision integrity") return "decision";
  if (text === "legacy orientation") return "legacy";
  if (text === "identity mandate") return "identity";

  return text;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractClaimedScore(text: string): number | null {
  const patterns = [
    /(\d{1,3})\s*%\s*(?:coherence|alignment|score)/i,
    /(?:coherence|alignment|score)\s*(?:of|is|at)?\s*(\d{1,3})\s*%/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) {
        return parsed;
      }
    }
  }

  return null;
}

function extractKnownUserPhrases(reflections: Reflections): string[] {
  return [
    reflections.avoidedDecision,
    reflections.lastSevenDays,
    reflections.dissenter,
  ]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length >= 12);
}

function hasUserLanguageAnchor(text: string, reflections: Reflections): boolean {
  const lowerText = text.toLowerCase();
  const phrases = extractKnownUserPhrases(reflections);

  if (phrases.length === 0) return false;

  return phrases.some((phrase) => {
    const clean = phrase.toLowerCase();

    if (clean.length >= 30 && lowerText.includes(clean.slice(0, 30))) {
      return true;
    }

    const significantWords = clean
      .split(/\s+/)
      .map((w) => w.replace(/[^\w]/g, ""))
      .filter((w) => w.length >= 5);

    if (significantWords.length < 3) return false;

    const hits = significantWords.filter((word) =>
      lowerText.includes(word)
    ).length;

    return hits >= Math.min(3, significantWords.length);
  });
}

function extractUnsupportedNumbers(
  text: string,
  deterministicResult: PurposeProfileResult,
  reflections: Reflections
): string[] {
  const userText = [
    reflections.avoidedDecision,
    reflections.lastSevenDays,
    reflections.dissenter,
  ]
    .join(" ")
    .toLowerCase();

  const supportedNumbers = new Set<string>();

  supportedNumbers.add(String(Math.round(deterministicResult.percent)));

  for (const profile of deterministicResult.domainProfiles || []) {
    supportedNumbers.add(String(Math.round(profile.percent)));
  }

  const matches = text.match(
    /(?:£|\$|€)?\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:k|m|bn|%|days?|weeks?|months?|years?)?/gi
  );

  if (!matches) return [];

  const unsupported: string[] = [];

  for (const raw of matches) {
    const value = raw.trim();
    const numericOnly = value.replace(/[^\d.]/g, "");
    const hasCurrency = /[£$€]/.test(value);
    const hasScale = /\b(k|m|bn)\b/i.test(value);
    const hasTime = /\b(days?|weeks?|months?|years?)\b/i.test(value);
    const hasPercent = /%/.test(value);

    if (!numericOnly) continue;

    const parsed = Number.parseFloat(numericOnly);
    if (!Number.isFinite(parsed)) continue;

    const rounded = String(Math.round(parsed));

    const isSmallScore = parsed >= 0 && parsed <= 10 && !hasCurrency && !hasScale;
    const isSupportedScore =
      hasPercent &&
      (supportedNumbers.has(rounded) ||
        Math.abs(parsed - deterministicResult.percent) <= 1);

    const appearsInUserText = userText.includes(value.toLowerCase());

    if (isSmallScore || isSupportedScore || appearsInUserText) continue;

    if (hasCurrency || hasScale || hasTime || parsed > 100) {
      unsupported.push(value);
    }
  }

  return unsupported;
}

function extractMentionedDomains(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const [domain, aliases] of Object.entries(DOMAIN_ALIASES)) {
    if (aliases.some((alias) => new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(lower))) {
      found.push(domain);
    }
  }

  return Array.from(new Set(found));
}

function domainIsAllowed(
  mentionedDomain: string,
  deterministicWeakestDomain: string,
  text: string
): boolean {
  if (mentionedDomain === deterministicWeakestDomain) return true;

  const lower = text.toLowerCase();
  const secondaryPattern = new RegExp(
    `(secondary|also|related|downstream|contributes to).{0,80}${escapeRegExp(
      mentionedDomain.replace("_", " ")
    )}`,
    "i"
  );

  return secondaryPattern.test(lower);
}

function checkRoleAppropriateness(
  text: string,
  context: DemographicContext
): TournamentViolation | null {
  const lower = text.toLowerCase();
  const role = normalizeText(context.role);

  if (!role) return null;

  const isSenior =
    /\b(ceo|founder|director|vp|chief|head|partner|owner|executive)\b/i.test(role);

  const isIndividualContributor =
    /\b(individual contributor|analyst|associate|developer|engineer|designer|consultant)\b/i.test(
      role
    ) && !isSenior;

  if (isSenior && !/(authority|owner|board|strategy|mandate|governance|decision)/i.test(lower)) {
    return {
      code: "ROLE_MISMATCH",
      severity: "WARNING",
      message: `Generative output may be under-calibrated for ${context.role}; senior-role synthesis should address authority, mandate, governance, or strategy.`,
    };
  }

  if (
    isIndividualContributor &&
    /(take it to the board|force the board|board chair|override the executive)/i.test(lower)
  ) {
    return {
      code: "ROLE_MISMATCH",
      severity: "BLOCKER",
      message: `Generative output assigns board-level action to ${context.role}, which is not role-appropriate.`,
    };
  }

  return null;
}

function hasGenericAdvice(text: string): boolean {
  const normalized = text.trim();

  if (normalized.length < 120) return true;

  return GENERIC_ADVICE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function containsInventedVerification(text: string): boolean {
  return INVENTED_VERIFICATION_PATTERNS.some((pattern) => pattern.test(text));
}

function containsInventedPeerData(text: string): boolean {
  return INVENTED_PEER_PATTERNS.some((pattern) => pattern.test(text));
}

function formatDeterministicOutput(
  result: PurposeProfileResult,
  reflections: Reflections
): string {
  const weakestDomain = result.weakestDomains[0] || "unknown";
  const percent = Math.round(result.percent);
  const band = result.coherenceBand;

  const domainSummary = result.domainProfiles
    .map((d: { domain: string; percent: number }) => {
      return `${d.domain}: ${Math.round(d.percent)}%`;
    })
    .join(", ");

  const avoided = reflections.avoidedDecision?.trim();

  let output = `Deterministic anchor: ${percent}% coherence (${band} band).\n`;
  output += `Sharpest weak domain: ${weakestDomain}.\n`;
  output += `Domain profile: ${domainSummary}.\n`;

  if (avoided) {
    output += `\nAvoided decision named by user: "${avoided}".\n`;
    output +=
      "This is the primary behavioural evidence. The next valid move is to convert the avoided decision into one binding commitment with a deadline and consequence.";
  } else {
    output +=
      "\nNo avoided decision was specific enough to bind. Precision is blocked until the user names the decision directly.";
  }

  return output;
}

function buildWinningSynthesis(
  generativeSuggestion: string,
  deterministicResult: PurposeProfileResult
): string {
  return [
    "[Governed synthesis — accepted by deterministic arbiter]",
    "",
    generativeSuggestion.trim(),
    "",
    "---",
    `Deterministic anchor: ${Math.round(
      deterministicResult.percent
    )}% coherence (${deterministicResult.coherenceBand} band).`,
  ].join("\n");
}

export function runTournament(
  deterministicResult: PurposeProfileResult,
  generativeSuggestion: string,
  userAnswers: Record<string, DualAxisAnswer>,
  userReflections: Reflections,
  demographicContext: DemographicContext
): TournamentResult {
  const violations: TournamentViolation[] = [];
  const deterministicOutput = formatDeterministicOutput(
    deterministicResult,
    userReflections
  );

  const safeGenerative = typeof generativeSuggestion === "string"
    ? generativeSuggestion.trim()
    : "";

  const deterministicScore = Number(deterministicResult.percent || 0);
  const weakestDomain = normalizeDomain(deterministicResult.weakestDomains[0]);

  const claimedScore = extractClaimedScore(safeGenerative);
  if (
    claimedScore !== null &&
    Math.abs(claimedScore - deterministicScore) > 15
  ) {
    violations.push({
      code: "SCORE_CONTRADICTION",
      severity: "BLOCKER",
      message: `Generative claims ${claimedScore}% alignment but deterministic score is ${Math.round(
        deterministicScore
      )}%.`,
    });
  }

  const hasQuoteFromUser = hasUserLanguageAnchor(
    safeGenerative,
    userReflections
  );

  if (!hasQuoteFromUser) {
    violations.push({
      code: "NO_USER_ANCHOR",
      severity: "BLOCKER",
      message:
        "Generative output does not anchor itself in the user's avoided decision, last-seven-days reflection, or dissenter signal.",
    });
  }

  const unsupportedNumbers = extractUnsupportedNumbers(
    safeGenerative,
    deterministicResult,
    userReflections
  );

  if (unsupportedNumbers.length > 0) {
    violations.push({
      code: "UNSUPPORTED_NUMBER",
      severity: "BLOCKER",
      message: `Generative output used unsupported numbers: ${unsupportedNumbers.join(
        ", "
      )}.`,
    });
  }

  const mentionedDomains = extractMentionedDomains(safeGenerative);
  const conflictingDomains = mentionedDomains.filter(
    (domain) => !domainIsAllowed(domain, weakestDomain, safeGenerative)
  );

  if (conflictingDomains.length > 0) {
    violations.push({
      code: "DOMAIN_CONTRADICTION",
      severity: "BLOCKER",
      message: `Generative output foregrounds ${conflictingDomains.join(
        ", "
      )}, but deterministic weakest domain is ${weakestDomain}.`,
    });
  }

  const roleViolation = checkRoleAppropriateness(
    safeGenerative,
    demographicContext
  );

  if (roleViolation) {
    violations.push(roleViolation);
  }

  if (hasGenericAdvice(safeGenerative)) {
    violations.push({
      code: "GENERIC_ADVICE",
      severity: "BLOCKER",
      message:
        "Generative output contains generic advice or insufficiently specific guidance.",
    });
  }

  if (containsInventedVerification(safeGenerative)) {
    violations.push({
      code: "INVENTED_VERIFICATION",
      severity: "BLOCKER",
      message:
        "Generative output implies behavioural verification that has not been connected or confirmed.",
    });
  }

  if (containsInventedPeerData(safeGenerative)) {
    violations.push({
      code: "INVENTED_PEER_DATA",
      severity: "BLOCKER",
      message:
        "Generative output implies peer intelligence or breach-rate data without verified sufficient sample data.",
    });
  }

  const blockers = violations.filter((v) => v.severity === "BLOCKER");
  const warnings = violations.filter((v) => v.severity === "WARNING");

  const arbiterVerdict: TournamentResult["arbiterVerdict"] =
    blockers.length > 0 ? "deterministic_wins" : "generative_wins";

  const winningOutput =
    arbiterVerdict === "generative_wins"
      ? buildWinningSynthesis(safeGenerative, deterministicResult)
      : deterministicOutput;

  const confidence =
    arbiterVerdict === "generative_wins"
      ? clamp(0.86 - warnings.length * 0.04, 0.7, 0.9)
      : clamp(0.95 - blockers.length * 0.08 - warnings.length * 0.03, 0.35, 0.95);

  const contradictionMessages = violations.map((v) => v.message);

  return {
    deterministicOutput,
    generativeOutput: safeGenerative,
    arbiterVerdict,
    winningOutput,
    confidence,
    contradictions: contradictionMessages,
    quotedUserLanguage: hasQuoteFromUser,
  };
}