/**
 * Synthesis Engine — produces bespoke output from the user's specific case.
 *
 * Every output must pass: "Could this have existed before this user arrived?"
 * If yes → fail. If no → ship.
 *
 * Architecture:
 * 1. CaseObject → C3 Score → tier check
 * 2. HARD_RECOVERY → recovery questions only, no synthesis
 * 3. SOFT_RECOVERY → deterministic fallback only, no contradiction block
 * 4. FULL_SYNTHESIS → LLM synthesis → arbiter tournament → governed output
 * 5. Arbiter rejects → explicit mismatch message, NOT silent fallback
 */

import type { CaseObject, ConditionClass } from "./case-object";
import { classifyCondition, inferContradiction, inferAvoidance } from "./case-object";
import { scoreC3, type C3Score } from "./c3-fidelity-scorer";
import { runArbiterTournament, type ArbiterTournamentResult } from "./arbiter-tournament";
import { SIGNALS, type SignalKey } from "@/lib/diagnostics/signals";
import type { DeterministicOutput } from "./intelligence-spine";

// ─────────────────────────────────────────────────────────────────────────────
// GOVERNED SYNTHESIS CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

export type GovernedSynthesis = {
  /** The bespoke verdict, referencing user's words */
  verdict: string;
  /** The specific contradiction found between their answers */
  primaryContradiction: string;
  /** What the system infers they are avoiding */
  avoidedDecision: string;
  /** Why their prior attempts failed, based on their inputs */
  whyPriorAttemptsFailed: string;
  /** One specific move tied to their situation */
  concreteMove: string;
  /** What happens by default if they don't act */
  defaultPathForecast: string;
  /** How strong the signal is */
  signalStrength: "low" | "medium" | "high";
  /** What the system cannot conclude */
  certaintyBoundary: string;
  /** Direct quotes from their input */
  quotedUserLanguage: string[];
  /** Deterministic condition class */
  conditionClass: ConditionClass;
  /** C3 fidelity score */
  c3Score: C3Score;
};

// ─────────────────────────────────────────────────────────────────────────────
// INPUT SANITISATION — prevent prompt injection
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FIELD_LENGTH = 800;

function sanitiseForPrompt(text: string | undefined | null): string {
  if (!text) return "Not provided";
  let clean = text
    .replace(/```/g, "")                    // strip code fences
    .replace(/\bsystem\s*:/gi, "system -")  // strip system: directives
    .replace(/\bassistant\s*:/gi, "")       // strip assistant: injections
    .replace(/\bhuman\s*:/gi, "")           // strip human: injections
    .replace(/\bignore\s+(?:all\s+)?(?:previous|above|prior)\b/gi, "") // strip override attempts
    .replace(/<[^>]+>/g, "")               // strip HTML/XML tags
    .trim();
  if (clean.length > MAX_FIELD_LENGTH) clean = clean.slice(0, MAX_FIELD_LENGTH) + "...";
  return clean || "Not provided";
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNTHESIS PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export function buildSynthesisPrompt(caseObj: CaseObject): string {
  const d = sanitiseForPrompt(caseObj.decision);
  const pa = sanitiseForPrompt(caseObj.priorAttempt);
  const cd = sanitiseForPrompt(caseObj.costOfDelay);
  const co = sanitiseForPrompt(caseObj.claimedOwner);
  const b = sanitiseForPrompt(caseObj.blocker);
  const fa = sanitiseForPrompt(caseObj.forcedAction);

  return `You are a decision intelligence system. You do not advise. You identify contradictions, name what is being avoided, and force clarity.

Given these 6 responses from a decision-maker:

1. DECISION: "${d}"
2. PRIOR ATTEMPTS: "${pa}"
3. COST OF DELAY: "${cd}"
4. CLAIMED OWNER: "${co}"
5. BLOCKER: "${b}"
6. FORCED 24-HOUR ACTION: "${fa}"

Produce a JSON object with these exact fields:

{
  "verdict": "One direct sentence. Reference the user's actual words. Name the condition. No hedging.",
  "primaryContradiction": "Identify the specific contradiction between their stated blocker (#5) and their forced answer (#6). Quote their words. Explain why both cannot be true.",
  "avoidedDecision": "Name what they are actually avoiding, based on the gap between their blocker and their forced action. Be specific to their situation.",
  "whyPriorAttemptsFailed": "Based on their prior attempts (#2) and blocker (#5), explain why those attempts addressed symptoms rather than the structural cause. Reference their words.",
  "concreteMove": "One specific action within 72 hours. Not generic. Tied to their specific situation, their specific stakeholders, their specific blocker.",
  "defaultPathForecast": "What happens if they do nothing for 30 days. Specific to their situation. No generic 'things will get worse.'",
  "signalStrength": "low | medium | high — based on input specificity and contradiction clarity",
  "certaintyBoundary": "What the system cannot conclude from these inputs alone."
}

RULES:
- You MUST quote the user's actual words where relevant (use quotation marks)
- You MUST NOT use phrases like "organisations often", "typically", "in general"
- Every statement must be specific to THIS user's situation
- If input is vague, say so directly. Do not fabricate specificity.
- The verdict must be something that could NOT have been written before this user arrived.
- Return valid JSON only. No markdown. No explanation outside the JSON.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC OUTPUT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

const CONDITION_TO_SIGNAL: Record<ConditionClass, SignalKey> = {
  authority: "AUTHORITY_LEAKAGE",
  definition: "DEFINITION_FAILURE",
  execution: "EXECUTION_AVOIDANCE",
  instability: "LATENT_INSTABILITY",
};

/**
 * Build deterministic output from case material.
 * This is always computed, regardless of synthesis tier.
 */
export function buildDeterministicOutput(caseObj: CaseObject): DeterministicOutput {
  const conditionClass = classifyCondition(caseObj);
  const signalKey = CONDITION_TO_SIGNAL[conditionClass];
  const signal = SIGNALS[signalKey];

  const contradictionSet: string[] = [];
  const inferred = inferContradiction(caseObj);
  if (inferred) contradictionSet.push(inferred);
  if (signal.contradiction) contradictionSet.push(signal.contradiction);

  return {
    conditionClass,
    signal,
    contradictionSet,
    blockerClass: conditionClass,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC FALLBACK (still bespoke — quotes user words)
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Use arbitrate() in old integrations — prefer runArbiterTournament() */
export type ArbiterResult = {
  status: "APPROVED" | "REJECTED";
  reason?: string;
};

/** @deprecated Use runArbiterTournament() instead */
export function arbitrate(
  synthesis: Partial<GovernedSynthesis>,
  caseObj: CaseObject,
): ArbiterResult {
  const deterministic = buildDeterministicOutput(caseObj);
  const result = runArbiterTournament(synthesis, caseObj, deterministic);
  return {
    status: result.accepted ? "APPROVED" : "REJECTED",
    reason: result.violations.map((v) => v.message).join("; ") || undefined,
  };
}

/**
 * Produces deterministic output when synthesis is unavailable or rejected.
 * Still references user words. Still bespoke. Just not LLM-synthesised.
 */
export function deterministicFallback(caseObj: CaseObject, opts?: { suppressContradiction?: boolean }): GovernedSynthesis {
  const conditionClass = classifyCondition(caseObj);
  const contradiction = inferContradiction(caseObj);
  const avoidance = inferAvoidance(caseObj);
  const c3 = scoreC3(caseObj);

  const decisionQuote = caseObj.decision.length > 80 ? caseObj.decision.slice(0, 80) + "..." : caseObj.decision;

  const verdicts: Record<ConditionClass, string> = {
    authority: `The decision you described — "${decisionQuote}" — is stalled at the authority level. The person who should decide either doesn't know they should, or is waiting for permission that was never required.`,
    definition: `The decision you described — "${decisionQuote}" — is not yet defined clearly enough to be acted on. People are discussing it without agreeing on what the outcome actually is.`,
    execution: `The decision you described — "${decisionQuote}" — is understood but is being avoided. The blocker you named is not preventing the decision — it is the reason you haven't had to make it yet.`,
    instability: `The decision you described — "${decisionQuote}" — is not stable. It has not been tested under pressure. What looks like clarity now is assumption that will collapse when urgency arrives.`,
  };

  const moves: Record<ConditionClass, string> = {
    authority: caseObj.claimedOwner
      ? `Confirm with ${caseObj.claimedOwner} whether they have authority to decide this without further escalation. If they don't know, that is the first finding.`
      : "Name who can make this decision without further permission. If no one can, that is the first decision: who decides?",
    definition: "Write the decision outcome in one sentence. Share it with the person who will be most affected. If they describe a different outcome, the decision is not defined.",
    execution: caseObj.forcedAction
      ? `You already know what to do — you said: "${caseObj.forcedAction}". Do it within 72 hours. The blocker you named will not prevent you.`
      : "Set a 7-day deadline. Name who reports on the outcome. Do both today.",
    instability: "Force this decision through one real constraint within 72 hours: a stakeholder deadline, a budget limit, or a team commitment. Observe what breaks.",
  };

  const forecasts: Record<ConditionClass, string> = {
    authority: "In 30 days, the authority vacuum will have been filled informally. Someone will have started making decisions without mandate. Reclaiming authority after that requires confrontation, not clarification.",
    definition: "In 30 days, different stakeholders will be executing against different interpretations of this decision. Rework cost will have begun compounding. Alignment conversations will feel harder because positions have hardened.",
    execution: "In 30 days, the decision will be forced by external conditions rather than internal authority. The organisation will respond reactively, with fewer options and higher cost.",
    instability: "In 30 days, the first real pressure will reveal whether this was clarity or assumption. If it was assumption, recovery starts from behind.",
  };

  const quotedLanguage: string[] = [];
  if (caseObj.decision) quotedLanguage.push(caseObj.decision);
  if (caseObj.blocker) quotedLanguage.push(caseObj.blocker);
  if (caseObj.forcedAction) quotedLanguage.push(caseObj.forcedAction);

  return {
    verdict: verdicts[conditionClass],
    primaryContradiction: opts?.suppressContradiction
      ? "Insufficient confidence for contradiction analysis. Complete more detail for the system to identify structural contradictions."
      : (contradiction ?? "Insufficient input to identify a specific contradiction. Provide more detail about the blocker and what you would do under time pressure."),
    avoidedDecision: avoidance ?? "The system cannot determine what is being avoided without both a stated blocker and a forced action.",
    whyPriorAttemptsFailed: caseObj.priorAttempt
      ? `You tried: "${caseObj.priorAttempt.length > 120 ? caseObj.priorAttempt.slice(0, 120) + "..." : caseObj.priorAttempt}". That addressed the visible symptom — not the structural condition. The ${conditionClass} gap was not touched by that approach.${caseObj.blocker ? ` The blocker you named — "${caseObj.blocker.length > 80 ? caseObj.blocker.slice(0, 80) + "..." : caseObj.blocker}" — persisted because it is structural, not operational.` : ""}`
      : "No prior attempts described. If this decision is genuinely new, the structural condition is the first thing to test.",
    concreteMove: moves[conditionClass],
    defaultPathForecast: forecasts[conditionClass],
    signalStrength: c3.specificityScore >= 0.6 ? "high" : c3.specificityScore >= 0.35 ? "medium" : "low",
    certaintyBoundary: "Based on your responses from a single session. Strongest when tested against a live decision or validated by a second respondent.",
    quotedUserLanguage: quotedLanguage,
    conditionClass,
    c3Score: c3,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SYNTHESIS FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export type SynthesisResult = {
  synthesis: GovernedSynthesis;
  source: "llm" | "deterministic" | "recovery";
  recoveryQuestion?: string;
  /** Arbiter result when LLM was attempted */
  arbiterResult?: ArbiterTournamentResult;
  /** Explicit mismatch message when arbiter rejects — SHOW THIS TO THE USER */
  arbiterMismatchMessage?: string;
};

/**
 * Produce governed synthesis from a CaseObject.
 *
 * Tiered enforcement:
 * - HARD_RECOVERY: recovery questions only, no synthesis attempt
 * - SOFT_RECOVERY: deterministic only, no contradiction block, no LLM
 * - FULL_SYNTHESIS: LLM → arbiter tournament → governed output
 *
 * The LLM call is provided as an async function parameter so the engine
 * is not coupled to any specific LLM provider.
 */
export async function synthesise(
  caseObj: CaseObject,
  llmCall?: (prompt: string) => Promise<string>,
): Promise<SynthesisResult> {
  // 1. C3 fidelity check
  const c3 = scoreC3(caseObj);

  // 2. HARD_RECOVERY — demand specifics, no synthesis
  if (c3.tier === "HARD_RECOVERY") {
    return {
      synthesis: deterministicFallback(caseObj, { suppressContradiction: true }),
      source: "recovery",
      recoveryQuestion: c3.recoveryQuestion,
    };
  }

  // 3. SOFT_RECOVERY — deterministic only, suppress contradiction block
  if (c3.tier === "SOFT_RECOVERY") {
    return {
      synthesis: deterministicFallback(caseObj, { suppressContradiction: true }),
      source: "deterministic",
      recoveryQuestion: c3.recoveryQuestion,
    };
  }

  // 4. FULL_SYNTHESIS — attempt LLM with arbiter tournament
  const deterministic = buildDeterministicOutput(caseObj);

  if (llmCall) {
    try {
      const prompt = buildSynthesisPrompt(caseObj);
      const raw = await llmCall(prompt);

      // Parse JSON from LLM response (enforce max length)
      const MAX_LLM_OUTPUT = 8000;
      const bounded = raw.length > MAX_LLM_OUTPUT ? raw.slice(0, MAX_LLM_OUTPUT) : raw;
      const jsonMatch = bounded.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

        const synthesis: GovernedSynthesis = {
          verdict: String(parsed.verdict ?? ""),
          primaryContradiction: String(parsed.primaryContradiction ?? ""),
          avoidedDecision: String(parsed.avoidedDecision ?? ""),
          whyPriorAttemptsFailed: String(parsed.whyPriorAttemptsFailed ?? ""),
          concreteMove: String(parsed.concreteMove ?? ""),
          defaultPathForecast: String(parsed.defaultPathForecast ?? ""),
          signalStrength: (parsed.signalStrength as GovernedSynthesis["signalStrength"]) ?? "medium",
          certaintyBoundary: String(parsed.certaintyBoundary ?? ""),
          quotedUserLanguage: [caseObj.decision, caseObj.blocker, caseObj.forcedAction].filter(Boolean) as string[],
          conditionClass: classifyCondition(caseObj),
          c3Score: c3,
        };

        // 5. Arbiter tournament — hard validation
        const arbiterResult = runArbiterTournament(synthesis, caseObj, deterministic);

        if (arbiterResult.accepted) {
          return { synthesis, source: "llm", arbiterResult };
        }

        // Arbiter rejected — DO NOT silently fallback
        // Return deterministic but expose the mismatch
        console.warn("[synthesis-engine] Arbiter tournament rejected LLM output:", arbiterResult.violations);
        return {
          synthesis: deterministicFallback(caseObj),
          source: "deterministic",
          arbiterResult,
          arbiterMismatchMessage: arbiterResult.userMessage,
        };
      }
    } catch (err) {
      console.error("[synthesis-engine] LLM synthesis failed:", err);
    }
  }

  // 6. No LLM available — deterministic fallback
  return { synthesis: deterministicFallback(caseObj), source: "deterministic" };
}
