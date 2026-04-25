/**
 * Synthesis Engine — produces bespoke output from the user's specific case.
 *
 * Every output must pass: "Could this have existed before this user arrived?"
 * If yes → fail. If no → ship.
 *
 * Architecture:
 * 1. CaseObject → C3 Score → if ready → synthesis prompt → LLM → governed output
 * 2. Deterministic arbiter validates synthesis against classification
 * 3. If arbiter rejects → fall back to deterministic output
 */

import type { CaseObject, ConditionClass } from "./case-object";
import { classifyCondition, inferContradiction, inferAvoidance } from "./case-object";
import { scoreC3, type C3Score } from "./c3-fidelity-scorer";

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
// SYNTHESIS PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export function buildSynthesisPrompt(caseObj: CaseObject): string {
  return `You are a decision intelligence system. You do not advise. You identify contradictions, name what is being avoided, and force clarity.

Given these 6 responses from a decision-maker:

1. DECISION: "${caseObj.decision}"
2. PRIOR ATTEMPTS: "${caseObj.priorAttempt ?? "Not provided"}"
3. COST OF DELAY: "${caseObj.costOfDelay ?? "Not provided"}"
4. CLAIMED OWNER: "${caseObj.claimedOwner ?? "Not provided"}"
5. BLOCKER: "${caseObj.blocker ?? "Not provided"}"
6. FORCED 24-HOUR ACTION: "${caseObj.forcedAction ?? "Not provided"}"

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
// DETERMINISTIC ARBITER
// ─────────────────────────────────────────────────────────────────────────────

export type ArbiterResult = {
  status: "APPROVED" | "REJECTED";
  reason?: string;
};

/**
 * Validates that synthesis output doesn't contradict deterministic classification.
 */
export function arbitrate(
  synthesis: Partial<GovernedSynthesis>,
  caseObj: CaseObject,
): ArbiterResult {
  // Check: verdict must contain at least one quoted user phrase
  const hasQuote = synthesis.verdict?.includes('"') || synthesis.verdict?.includes("'");
  if (!hasQuote && synthesis.verdict && synthesis.verdict.length > 20) {
    return { status: "REJECTED", reason: "Verdict does not reference user language. Synthesis must quote user words." };
  }

  // Check: concrete move must not be generic
  const genericPhrases = ["improve communication", "align stakeholders", "have a conversation", "think about", "consider", "reflect on"];
  const moveIsGeneric = genericPhrases.some((p) => synthesis.concreteMove?.toLowerCase().includes(p));
  if (moveIsGeneric) {
    return { status: "REJECTED", reason: "Concrete move is generic. Must be specific to user's situation." };
  }

  // Check: condition class from synthesis should broadly align with deterministic
  const deterministicClass = classifyCondition(caseObj);
  // We don't require exact match — synthesis may see nuance — but flag if wildly different
  if (synthesis.conditionClass && synthesis.conditionClass !== deterministicClass) {
    // Allow: synthesis found a more specific class. Don't allow: completely unrelated.
    // For now, this is informational, not blocking.
  }

  return { status: "APPROVED" };
}

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Produces deterministic output when synthesis is unavailable or rejected.
 * Still references user words. Still bespoke. Just not LLM-synthesised.
 */
export function deterministicFallback(caseObj: CaseObject): GovernedSynthesis {
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
    primaryContradiction: contradiction ?? "Insufficient input to identify a specific contradiction. Provide more detail about the blocker and what you would do under time pressure.",
    avoidedDecision: avoidance ?? "The system cannot determine what is being avoided without both a stated blocker and a forced action.",
    whyPriorAttemptsFailed: caseObj.priorAttempt
      ? `You described prior attempts as: "${caseObj.priorAttempt}". These addressed the surface condition. The structural cause — the ${conditionClass} gap — was not addressed.`
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

/**
 * Produce governed synthesis from a CaseObject.
 *
 * 1. Score C3 fidelity
 * 2. If PRECISION_RECOVERY → return recovery state
 * 3. If SYNTHESIS_READY → attempt LLM synthesis
 * 4. Arbiter validates → if rejected, fall back to deterministic
 * 5. Return governed output
 *
 * The LLM call is provided as an async function parameter so the engine
 * is not coupled to any specific LLM provider.
 */
export async function synthesise(
  caseObj: CaseObject,
  llmCall?: (prompt: string) => Promise<string>,
): Promise<{ synthesis: GovernedSynthesis; source: "llm" | "deterministic" | "recovery"; recoveryQuestion?: string }> {
  // 1. C3 fidelity check
  const c3 = scoreC3(caseObj);

  // 2. Precision recovery
  if (c3.mode === "PRECISION_RECOVERY") {
    return {
      synthesis: deterministicFallback(caseObj),
      source: "recovery",
      recoveryQuestion: c3.recoveryQuestion,
    };
  }

  // 3. Attempt LLM synthesis
  if (llmCall) {
    try {
      const prompt = buildSynthesisPrompt(caseObj);
      const raw = await llmCall(prompt);

      // Parse JSON from LLM response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

        const synthesis: GovernedSynthesis = {
          verdict: String(parsed.verdict ?? ""),
          primaryContradiction: String(parsed.primaryContradiction ?? ""),
          avoidedDecision: String(parsed.avoidedDecision ?? ""),
          whyPriorAttemptsFailed: String(parsed.whyPriorAttemptsFailed ?? ""),
          concreteMove: String(parsed.concreteMove ?? ""),
          defaultPathForecast: String(parsed.defaultPathForecast ?? ""),
          signalStrength: (parsed.signalStrength as any) ?? "medium",
          certaintyBoundary: String(parsed.certaintyBoundary ?? ""),
          quotedUserLanguage: [caseObj.decision, caseObj.blocker, caseObj.forcedAction].filter(Boolean) as string[],
          conditionClass: classifyCondition(caseObj),
          c3Score: c3,
        };

        // 4. Arbiter validation
        const arbiterResult = arbitrate(synthesis, caseObj);
        if (arbiterResult.status === "APPROVED") {
          return { synthesis, source: "llm" };
        }

        // Arbiter rejected — fall back
        console.warn("[synthesis-engine] Arbiter rejected LLM output:", arbiterResult.reason);
      }
    } catch (err) {
      console.error("[synthesis-engine] LLM synthesis failed:", err);
    }
  }

  // 5. Deterministic fallback
  return { synthesis: deterministicFallback(caseObj), source: "deterministic" };
}
