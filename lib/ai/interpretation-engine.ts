/**
 * lib/ai/interpretation-engine.ts — CORE INTELLIGENCE LAYER
 *
 * The LLM does not decide. The system decides. The LLM interprets.
 *
 * Architecture:
 *   Canonical Engine (deterministic) → Interpretation Engine (LLM) → Output
 *
 * The interpretation engine is constrained by:
 * 1. Structured input from the canonical engine (scores, classifications)
 * 2. Stage-specific system prompts (tone, focus, rules)
 * 3. Anti-generic guards (specificity, variation, language)
 * 4. Strict JSON output schema
 *
 * Fallback: If LLM call fails, canonical engine output stands unmodified.
 */

import Anthropic from "@anthropic-ai/sdk";
import { stableInputHash } from "@/lib/diagnostics/runtime-validation";
import {
  STAGE_PROMPTS,
  buildUserMessage,
  type InterpretationStage,
} from "./prompts";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type InterpretationInput = {
  canonicalResult: Record<string, unknown>;
  userInputs: {
    problemStatement?: string;
    symptoms?: string;
    constraints?: string;
    objective?: string;
    [key: string]: unknown;
  };
  stage: InterpretationStage;
  tensionThread?: Record<string, unknown> | null;
  cacheScope?: string | null;
};

export type PriorityAction = {
  action: string;
  rationale: string;
  urgency: "immediate" | "near_term" | "structural";
};

export type InterpretationOutput = {
  conditionLabel: string;
  conditionExplanation: string;
  contradictionInsight: string;
  contextualRisks: string[];
  priorityStack: PriorityAction[];
  narrative: string;
  escalationJustification: string | null;
  /** Metadata: was this produced by LLM or is it a fallback? */
  source: "llm" | "fallback" | "cached";
  /** Metadata: model used */
  model?: string;
  /** Metadata: latency in ms */
  latencyMs?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────────────────────

let _client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  _client = new Anthropic({ apiKey: key });
  return _client;
}

// ─────────────────────────────────────────────────────────────────────────────
// Anti-Generic Guards
// ─────────────────────────────────────────────────────────────────────────────

const BANNED_PHRASES = [
  "organisations often",
  "in many cases",
  "typically",
  "it is common to",
  "many leaders find",
  "it may be helpful",
  "consider exploring",
  "you might want to",
  "it's worth noting",
  "generally speaking",
];

function passesSpecificityCheck(
  output: InterpretationOutput,
  input: InterpretationInput,
): boolean {
  const combined = [
    output.conditionLabel,
    output.conditionExplanation,
    output.contradictionInsight,
    output.narrative,
    ...output.contextualRisks,
    ...output.priorityStack.map((p) => p.action + " " + p.rationale),
  ].join(" ").toLowerCase();

  // Must reference at least one user input term
  const userTerms = [
    input.userInputs.problemStatement,
    input.userInputs.symptoms,
    input.userInputs.constraints,
    input.userInputs.objective,
  ]
    .filter(Boolean)
    .flatMap((text) => text!.toLowerCase().split(/\s+/).filter((w) => w.length > 4))
    .slice(0, 20);

  const referencedTerms = userTerms.filter((term) => combined.includes(term));
  return referencedTerms.length >= 2;
}

function passesLanguageGuard(output: InterpretationOutput): boolean {
  const combined = [
    output.conditionExplanation,
    output.contradictionInsight,
    output.narrative,
    ...output.contextualRisks,
    ...output.priorityStack.map((p) => p.rationale),
  ].join(" ").toLowerCase();

  return !BANNED_PHRASES.some((phrase) => combined.includes(phrase));
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback
// ─────────────────────────────────────────────────────────────────────────────

function buildFallback(input: InterpretationInput): InterpretationOutput {
  const result = input.canonicalResult as Record<string, unknown>;
  const posture = (result.constitutionalPosture ?? result.posture ?? {}) as Record<string, unknown>;

  return {
    conditionLabel: String(posture.orgState ?? posture.route ?? "Condition identified"),
    conditionExplanation: String(posture.narrativeSummary ?? "The canonical engine has classified this condition. Interpretation enrichment unavailable."),
    contradictionInsight: "Contradiction analysis requires the interpretation layer.",
    contextualRisks: Array.isArray(posture.failureModes) ? posture.failureModes.map(String).slice(0, 5) : ["See canonical failure mode analysis"],
    priorityStack: Array.isArray(posture.requiredInterventions)
      ? posture.requiredInterventions.slice(0, 5).map((item: unknown) => ({
          action: String(item),
          rationale: "From canonical engine",
          urgency: "near_term" as const,
        }))
      : [{ action: "Review canonical engine output", rationale: "Interpretation unavailable", urgency: "near_term" as const }],
    narrative: String(posture.narrativeSummary ?? "The system has produced a deterministic reading. LLM interpretation was not available for this assessment."),
    escalationJustification: null,
    source: "fallback",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Interpretation Function
// ─────────────────────────────────────────────────────────────────────────────

export async function interpret(input: InterpretationInput): Promise<InterpretationOutput> {
  const startMs = Date.now();
  const client = getClient();

  if (!client) {
    console.warn("[INTERPRETATION_ENGINE] No ANTHROPIC_API_KEY configured. Using fallback.");
    return buildFallback(input);
  }

  const systemPrompt = STAGE_PROMPTS[input.stage];
  if (!systemPrompt) {
    console.error("[INTERPRETATION_ENGINE] Unknown stage:", input.stage);
    return buildFallback(input);
  }

  const userMessage = buildUserMessage({
    canonicalResult: input.canonicalResult,
    userInputs: input.userInputs,
    tensionThread: input.tensionThread,
  });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const latencyMs = Date.now() - startMs;

    // Extract text content
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.error("[INTERPRETATION_ENGINE] No text in response");
      return buildFallback(input);
    }

    // Parse JSON from response
    let parsed: Record<string, unknown>;
    try {
      // Handle potential markdown wrapping
      const raw = textBlock.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(raw);
    } catch {
      console.error("[INTERPRETATION_ENGINE] Failed to parse JSON response");
      return buildFallback(input);
    }

    // Build typed output
    const output: InterpretationOutput = {
      conditionLabel: String(parsed.conditionLabel ?? "Unclassified"),
      conditionExplanation: String(parsed.conditionExplanation ?? ""),
      contradictionInsight: String(parsed.contradictionInsight ?? ""),
      contextualRisks: Array.isArray(parsed.contextualRisks)
        ? parsed.contextualRisks.map(String)
        : [],
      priorityStack: Array.isArray(parsed.priorityStack)
        ? parsed.priorityStack.map((p: Record<string, unknown>) => ({
            action: String(p.action ?? ""),
            rationale: String(p.rationale ?? ""),
            urgency: (["immediate", "near_term", "structural"].includes(String(p.urgency))
              ? String(p.urgency)
              : "near_term") as PriorityAction["urgency"],
          }))
        : [],
      narrative: String(parsed.narrative ?? ""),
      escalationJustification: parsed.escalationJustification
        ? String(parsed.escalationJustification)
        : null,
      source: "llm",
      model: response.model,
      latencyMs,
    };

    // Anti-generic enforcement — retry once if output is weak
    const specificityPass = passesSpecificityCheck(output, input);
    const languagePass = passesLanguageGuard(output);

    if (!specificityPass || !languagePass) {
      const reasons = [
        !specificityPass ? "low specificity — does not reference user inputs" : "",
        !languagePass ? "generic language detected" : "",
      ].filter(Boolean).join("; ");

      console.warn(`[INTERPRETATION_ENGINE] Output rejected: ${reasons}. Retrying with emphasis.`);

      // Retry with emphasis prompt
      try {
        const retryResponse = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: systemPrompt,
          messages: [
            { role: "user", content: userMessage },
            { role: "assistant", content: textBlock.text },
            { role: "user", content: `REJECTED: ${reasons}. Your output was too generic. It must reference the user's specific inputs: their stated decision, their constraint, their prior attempts. Rewrite the entire output. Do not use phrases like "organisations often" or "typically". Every statement must be grounded in THIS user's situation. Return the corrected JSON.` },
          ],
        });

        const retryText = retryResponse.content.find((b) => b.type === "text");
        if (retryText && retryText.type === "text") {
          try {
            const retryRaw = retryText.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const retryParsed = JSON.parse(retryRaw) as Record<string, unknown>;
            // Use retry output if it parses
            output.conditionLabel = String(retryParsed.conditionLabel ?? output.conditionLabel);
            output.conditionExplanation = String(retryParsed.conditionExplanation ?? output.conditionExplanation);
            output.contradictionInsight = String(retryParsed.contradictionInsight ?? output.contradictionInsight);
            output.narrative = String(retryParsed.narrative ?? output.narrative);
            if (Array.isArray(retryParsed.contextualRisks)) output.contextualRisks = retryParsed.contextualRisks.map(String);
            if (Array.isArray(retryParsed.priorityStack)) {
              output.priorityStack = retryParsed.priorityStack.map((p: Record<string, unknown>) => ({
                action: String(p.action ?? ""),
                rationale: String(p.rationale ?? ""),
                urgency: (["immediate", "near_term", "structural"].includes(String(p.urgency)) ? String(p.urgency) : "near_term") as PriorityAction["urgency"],
              }));
            }
            output.latencyMs = Date.now() - startMs;
            console.info("[INTERPRETATION_ENGINE] Retry produced improved output.");
          } catch {
            console.warn("[INTERPRETATION_ENGINE] Retry parse failed. Using original output.");
          }
        }
      } catch {
        console.warn("[INTERPRETATION_ENGINE] Retry call failed. Using original output.");
      }
    }

    return output;
  } catch (error) {
    console.error("[INTERPRETATION_ENGINE] LLM call failed:", error instanceof Error ? error.message : error);
    return buildFallback(input);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch / Cache
// ─────────────────────────────────────────────────────────────────────────────

const _cache = new Map<string, { output: InterpretationOutput; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function cacheKey(input: InterpretationInput): string {
  // SECURITY: cacheScope MUST be user-specific to prevent cross-user data leakage.
  // If no scope is provided, generate a unique key that never collides with another user.
  const scope = typeof input.cacheScope === "string" && input.cacheScope.trim()
    ? input.cacheScope.trim().toLowerCase()
    : `unscoped_${Date.now()}_${Math.random().toString(36).slice(2)}`; // unique per call, never shared
  return [
    scope,
    input.stage,
    stableInputHash(input.canonicalResult),
    stableInputHash(input.userInputs),
    stableInputHash(input.tensionThread ?? null),
  ].join(":");
}

/**
 * Interpret with session-level caching.
 * Same inputs within 30 minutes → cached result.
 */
export async function interpretCached(input: InterpretationInput): Promise<InterpretationOutput> {
  const key = cacheKey(input);
  const cached = _cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { ...cached.output, source: "cached" };
  }

  const output = await interpret(input);
  if (output.source === "llm") {
    _cache.set(key, { output, timestamp: Date.now() });
  }

  return output;
}

/**
 * Check if interpretation is available (API key configured).
 */
export function isInterpretationAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * Stages that qualify for LLM interpretation.
 * Personal and team stages use rule engine only (cost control).
 */
export function stageQualifiesForInterpretation(stage: InterpretationStage): boolean {
  return ["constitutional", "enterprise", "executive"].includes(stage);
}
