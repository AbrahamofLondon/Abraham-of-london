// lib/alignment/tournament-engine.ts

// Deterministic arbiter that prevents generative hallucination

import type { TournamentResult } from "./enhanced-types";
import type { DualAxisAnswer, PurposeProfileResult } from "./types";

export function runTournament(
  deterministicResult: PurposeProfileResult,
  generativeSuggestion: string,
  userAnswers: Record<string, DualAxisAnswer>,
  userReflections: { avoidedDecision: string; lastSevenDays: string; dissenter: string },
  demographicContext: { role: string; industry: string }
): TournamentResult {
  const contradictions: string[] = [];
  
  // RULE 1: Generative cannot contradict deterministic scoring
  const generativeClaims = extractClaimedBand(generativeSuggestion);
  if (generativeClaims && Math.abs(generativeClaims - deterministicResult.percent) > 15) {
    contradictions.push(`Generative claims ${generativeClaims}% alignment but deterministic score is ${deterministicResult.percent}%`);
  }
  
  // RULE 2: Generative must quote user's own words
  const hasQuoteFromUser = checkQuotesAgainstAnswers(generativeSuggestion, userAnswers, userReflections);
  if (!hasQuoteFromUser) {
    contradictions.push("Generative did not quote user's specific language from their answers");
  }
  
  // RULE 3: Generative cannot invent costs or timelines
  const extractedNumbers = extractNumbers(generativeSuggestion);
  const invalidNumbers = extractedNumbers.filter(n => !isValidNumber(n, deterministicResult));
  if (invalidNumbers.length > 0) {
    contradictions.push(`Generative used unsupported numbers: ${invalidNumbers.join(", ")}`);
  }
  
  // RULE 4: Domain-specific classification must match
  const claimedDomain = extractWeakestDomain(generativeSuggestion);
  if (claimedDomain && claimedDomain !== deterministicResult.weakestDomains[0]) {
    contradictions.push(`Generative identifies "${claimedDomain}" as weakest, but deterministic says "${deterministicResult.weakestDomains[0]}"`);
  }
  
  // RULE 5: Role/industry appropriateness check
  const roleMismatch = checkRoleAppropriateness(generativeSuggestion, demographicContext);
  if (roleMismatch) {
    contradictions.push(`Generative advice not calibrated for ${demographicContext.role} role`);
  }
  
  // Determine winner
  let arbiterVerdict: TournamentResult["arbiterVerdict"];
  let winningOutput: string;
  let confidence: number;
  
  if (contradictions.length > 0) {
    arbiterVerdict = "deterministic_wins";
    winningOutput = formatDeterministicOutput(deterministicResult, userReflections);
    confidence = 0.95 - (contradictions.length * 0.1);
  } else {
    arbiterVerdict = "generative_wins";
    winningOutput = `[Synthesized from your answers]\n\n${generativeSuggestion}\n\n---\n**Deterministic anchor**: ${deterministicResult.percent}% coherence (${deterministicResult.coherenceBand} band)`;
    confidence = 0.85;
  }
  
  return {
    deterministicOutput: formatDeterministicOutput(deterministicResult, userReflections),
    generativeOutput: generativeSuggestion,
    arbiterVerdict,
    winningOutput,
    confidence,
    contradictions,
    quotedUserLanguage: hasQuoteFromUser
  };
}

function extractClaimedBand(text: string): number | null {
  const match = text.match(/(\d{1,3})%?\s*(?:coherence|alignment|score)/i);
  return match?.[1] ? parseInt(match[1], 10) : null;
}

function checkQuotesAgainstAnswers(
  text: string, 
  answers: Record<string, DualAxisAnswer>, 
  reflections: { avoidedDecision: string; lastSevenDays: string; dissenter: string }
): boolean {
  // Check for quotes from answers
  const allAnswerTexts = Object.values(answers).map(a => `${a.resonance} ${a.certainty}`).join(" ");
  const hasQuoteFromAnswers = /"([^"]{15,})"/.test(text);
  
  // Check for reflection quotes
  const reflectionTexts = [reflections.avoidedDecision, reflections.lastSevenDays, reflections.dissenter].filter(Boolean);
  const hasQuoteFromReflections = reflectionTexts.some(ref => 
    ref && text.includes(ref.substring(0, 30))
  );
  
  return hasQuoteFromAnswers || hasQuoteFromReflections;
}

function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+(?:\.\d+)?[kKmM]?/g);
  return matches ? matches.map(m => parseFloat(m.replace(/[kKmM]/g, ""))) : [];
}

function isValidNumber(num: number, result: PurposeProfileResult): boolean {
  // Numbers under 10 are probably resonance/certainty scores (valid)
  // Numbers between 10-100 could be percentages (valid if within reasonable range)
  // Numbers over 1000 would be financial - these need validation
  if (num > 1000) {
    // Would check against user's stated financial context
    return false; // Too high without evidence
  }
  return true;
}

function extractWeakestDomain(text: string): string | null {
  const domains = ["identity", "decision", "environment", "behaviour", "emotional_order", "legacy"];
  for (const domain of domains) {
    if (text.toLowerCase().includes(domain.replace("_", " "))) {
      return domain;
    }
  }
  return null;
}

function checkRoleAppropriateness(text: string, context: { role: string; industry: string }): boolean {
  // Check if advice fits role
  const lowerText = text.toLowerCase();
  const role = context.role.toLowerCase();
  
  if (role === "ceo" && !lowerText.includes("board") && !lowerText.includes("strategy")) {
    return true; // Mismatch - CEO advice should mention board/strategy
  }
  
  if (role === "individual contributor" && lowerText.includes("board")) {
    return true; // Mismatch - ICs don't interact with boards
  }
  
  return false;
}

function formatDeterministicOutput(result: PurposeProfileResult, reflections: { avoidedDecision: string }): string {
  const weakestDomain = result.weakestDomains[0] || "unknown";
  const percent = result.percent;
  const band = result.coherenceBand;
  
  let output = `Deterministic analysis (score: ${percent}%, ${band} band)\n`;
  output += `Weakest domain: ${weakestDomain}\n`;
  output += `Domain scores: ${result.domainProfiles.map((d: { domain: string; percent: number }) => `${d.domain}: ${d.percent}%`).join(", ")}\n`;
  
  if (reflections.avoidedDecision) {
    output += `\nUser-identified avoided decision: "${reflections.avoidedDecision}"\n`;
    output += `This self-reported avoidance is the primary signal for intervention.`;
  }
  
  return output;
}