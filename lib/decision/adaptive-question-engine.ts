/**
 * Adaptive Question Engine — generates targeted questions from spine state.
 *
 * No fixed question sets. Every question is selected based on:
 * - conditionClass (what type of decision failure)
 * - C3 gaps (what information is missing)
 * - contradiction (what needs validation)
 * - memory signals (what patterns are recurring)
 * - stage (what depth of analysis is appropriate)
 *
 * The question bank is deterministic. No LLM needed.
 * Questions get sharper as the spine accumulates evidence.
 */

import type { ConditionClass } from "./case-object";
import type { C3Score } from "./c3-fidelity-scorer";
import type { MemorySignal } from "./memory-interrupt";
import type { SpineStage } from "./intelligence-spine";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type QuestionPurpose = "clarify" | "validate" | "challenge";
export type QuestionType = "free" | "structured" | "binary";
export type QuestionTarget = "clarity" | "context" | "consequence" | "contradiction" | "authority" | "execution" | "definition";

export type AdaptiveQuestion = {
  id: string;
  prompt: string;
  type: QuestionType;
  purpose: QuestionPurpose;
  targetGap: QuestionTarget;
  priority: number; // 1-10, higher = more important
  /** Why this question was selected */
  rationale: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BANK — deterministic, pre-authored, no LLM
// ─────────────────────────────────────────────────────────────────────────────

type QuestionTemplate = Omit<AdaptiveQuestion, "id" | "rationale"> & {
  conditions: {
    conditionClasses?: ConditionClass[];
    c3Gaps?: C3Score["missing"][number][];
    stages?: SpineStage[];
    requiresContradiction?: boolean;
    requiresMemory?: boolean;
  };
};

const QUESTION_BANK: QuestionTemplate[] = [
  // ── AUTHORITY questions ──────────────────────────────────────────────────
  {
    prompt: "When the stated owner hesitates, who actually makes the call? Name the person.",
    type: "free",
    purpose: "clarify",
    targetGap: "authority",
    priority: 9,
    conditions: { conditionClasses: ["authority"] },
  },
  {
    prompt: "Has anyone overridden the stated owner on this decision in the last 90 days? What happened?",
    type: "free",
    purpose: "validate",
    targetGap: "authority",
    priority: 8,
    conditions: { conditionClasses: ["authority"], stages: ["constitutional", "team", "enterprise"] },
  },
  {
    prompt: "If the stated owner disappeared tomorrow, who would inherit this decision by default — not by design?",
    type: "free",
    purpose: "challenge",
    targetGap: "authority",
    priority: 7,
    conditions: { conditionClasses: ["authority"], stages: ["team", "enterprise", "executive_reporting"] },
  },
  {
    prompt: "When this decision was last urgent, who made it? Was that the person you named as owner?",
    type: "free",
    purpose: "validate",
    targetGap: "authority",
    priority: 8,
    conditions: { conditionClasses: ["authority"], stages: ["constitutional", "team"] },
  },

  // ── EXECUTION questions ─────────────────────────────────��────────────────
  {
    prompt: "Name the specific action that has been identified but repeatedly deferred. Why was it deferred each time?",
    type: "free",
    purpose: "clarify",
    targetGap: "execution",
    priority: 9,
    conditions: { conditionClasses: ["execution"] },
  },
  {
    prompt: "If this decision were forced in 48 hours, what is the first thing that would actually happen? Who would do it?",
    type: "free",
    purpose: "challenge",
    targetGap: "execution",
    priority: 8,
    conditions: { conditionClasses: ["execution"], stages: ["constitutional", "team", "enterprise"] },
  },
  {
    prompt: "At what point does deferral become more expensive than the decision itself? Has that point passed?",
    type: "free",
    purpose: "challenge",
    targetGap: "consequence",
    priority: 7,
    conditions: { conditionClasses: ["execution"], stages: ["enterprise", "executive_reporting"] },
  },
  {
    prompt: "Where does ownership of this decision collapse? Name the handoff point where accountability disappears.",
    type: "free",
    purpose: "validate",
    targetGap: "execution",
    priority: 8,
    conditions: { conditionClasses: ["execution"], stages: ["team", "enterprise"] },
  },

  // ── DEFINITION questions ─────────────────────────────────────────────────
  {
    prompt: "Write the outcome of this decision in one sentence. Now: would the person most affected describe the same outcome?",
    type: "free",
    purpose: "clarify",
    targetGap: "definition",
    priority: 9,
    conditions: { conditionClasses: ["definition"] },
  },
  {
    prompt: "If two stakeholders were asked 'what does success look like here?', would they give the same answer? Name them and predict what each would say.",
    type: "free",
    purpose: "validate",
    targetGap: "definition",
    priority: 8,
    conditions: { conditionClasses: ["definition"], stages: ["team", "enterprise"] },
  },
  {
    prompt: "When was the last time someone asked 'what exactly are we deciding?' in a meeting about this? What happened?",
    type: "free",
    purpose: "challenge",
    targetGap: "definition",
    priority: 7,
    conditions: { conditionClasses: ["definition"], stages: ["constitutional", "team"] },
  },

  // ── INSTABILITY questions ────────────────────────────────────────────────
  {
    prompt: "What is the one assumption holding this decision together that has never been tested under real pressure?",
    type: "free",
    purpose: "challenge",
    targetGap: "clarity",
    priority: 9,
    conditions: { conditionClasses: ["instability"] },
  },
  {
    prompt: "If external conditions changed suddenly — a key departure, a funding shift, a regulatory change — which part of this decision breaks first?",
    type: "free",
    purpose: "validate",
    targetGap: "context",
    priority: 8,
    conditions: { conditionClasses: ["instability"], stages: ["enterprise", "executive_reporting"] },
  },

  // ── C3 GAP questions (condition-agnostic) ────────────────────────────────
  {
    prompt: "What exactly must be decided — not the topic, not the area, but the specific decision? One sentence.",
    type: "free",
    purpose: "clarify",
    targetGap: "clarity",
    priority: 10,
    conditions: { c3Gaps: ["clarity"] },
  },
  {
    prompt: "Who has the authority to move this forward, and what specifically prevents them from acting right now?",
    type: "free",
    purpose: "clarify",
    targetGap: "context",
    priority: 10,
    conditions: { c3Gaps: ["context"] },
  },
  {
    prompt: "What specifically gets more expensive — in money, time, or options — each week this sits unresolved?",
    type: "free",
    purpose: "clarify",
    targetGap: "consequence",
    priority: 10,
    conditions: { c3Gaps: ["consequence"] },
  },

  // ── CONTRADICTION validation questions ───────────────────────────────────
  {
    prompt: "The system detected a contradiction between your stated blocker and your forced action. Is this contradiction real, or is there context the system is missing?",
    type: "free",
    purpose: "validate",
    targetGap: "contradiction",
    priority: 9,
    conditions: { requiresContradiction: true },
  },

  // ── MEMORY-triggered challenge questions ─────────────────────────────────
  {
    prompt: "You described this blocker in a prior assessment. What has changed since then? If nothing has changed, what makes this time different?",
    type: "free",
    purpose: "challenge",
    targetGap: "context",
    priority: 10,
    conditions: { requiresMemory: true },
  },
  {
    prompt: "The same action keeps appearing as the answer across assessments. If you know what to do, the question is: what makes the action feel impossible? Name it.",
    type: "free",
    purpose: "challenge",
    targetGap: "execution",
    priority: 10,
    conditions: { requiresMemory: true },
  },

  // ── DEEPER STAGE questions (enterprise, executive) ──────��────────────────
  {
    prompt: "If this decision were presented to the board, what is the one thing they would ask that you cannot currently answer?",
    type: "free",
    purpose: "challenge",
    targetGap: "consequence",
    priority: 7,
    conditions: { stages: ["enterprise", "executive_reporting"] },
  },
  {
    prompt: "Name the person who benefits most from this decision NOT being made. What is their incentive to maintain the status quo?",
    type: "free",
    purpose: "challenge",
    targetGap: "authority",
    priority: 8,
    conditions: { stages: ["enterprise", "executive_reporting", "strategy_room"] },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate adaptive questions based on spine state.
 *
 * Returns questions sorted by priority (highest first), limited to `maxQuestions`.
 * Every question has a rationale explaining why it was selected.
 */
export function generateAdaptiveQuestions(input: {
  conditionClass: ConditionClass;
  contradiction: string | null;
  c3Gaps: C3Score["missing"];
  memorySignals: MemorySignal[];
  stage: SpineStage;
  maxQuestions?: number;
}): AdaptiveQuestion[] {
  const { conditionClass, contradiction, c3Gaps, memorySignals, stage, maxQuestions = 3 } = input;
  const hasContradiction = contradiction !== null && contradiction.length > 10;
  const hasMemory = memorySignals.length > 0 && memorySignals.some((s) => s.interrupt);

  const matched: Array<{ template: QuestionTemplate; rationale: string }> = [];

  for (const template of QUESTION_BANK) {
    const { conditions } = template;
    let eligible = true;
    const reasons: string[] = [];

    // Condition class filter
    if (conditions.conditionClasses && conditions.conditionClasses.length > 0) {
      if (!conditions.conditionClasses.includes(conditionClass)) {
        eligible = false;
      } else {
        reasons.push(`condition is ${conditionClass}`);
      }
    }

    // Stage filter
    if (conditions.stages && conditions.stages.length > 0) {
      if (!conditions.stages.includes(stage)) {
        eligible = false;
      } else {
        reasons.push(`stage is ${stage}`);
      }
    }

    // C3 gap filter
    if (conditions.c3Gaps && conditions.c3Gaps.length > 0) {
      const hasGap = conditions.c3Gaps.some((g) => c3Gaps.includes(g));
      if (!hasGap) {
        eligible = false;
      } else {
        reasons.push(`C3 gap in ${conditions.c3Gaps.filter((g) => c3Gaps.includes(g)).join(", ")}`);
      }
    }

    // Contradiction filter
    if (conditions.requiresContradiction) {
      if (!hasContradiction) {
        eligible = false;
      } else {
        reasons.push("contradiction detected");
      }
    }

    // Memory filter
    if (conditions.requiresMemory) {
      if (!hasMemory) {
        eligible = false;
      } else {
        reasons.push("recurring pattern from prior assessment");
      }
    }

    if (eligible && reasons.length > 0) {
      matched.push({
        template,
        rationale: `Selected because: ${reasons.join("; ")}`,
      });
    }
  }

  // Sort by priority (highest first), then deduplicate by targetGap
  matched.sort((a, b) => b.template.priority - a.template.priority);

  const seen = new Set<string>();
  const result: AdaptiveQuestion[] = [];

  for (const { template, rationale } of matched) {
    if (result.length >= maxQuestions) break;

    // Avoid duplicate target gaps unless both are high priority
    const gapKey = `${template.targetGap}_${template.purpose}`;
    if (seen.has(gapKey) && template.priority < 9) continue;
    seen.add(gapKey);

    result.push({
      id: `aq_${stage}_${template.targetGap}_${result.length}`,
      prompt: template.prompt,
      type: template.type,
      purpose: template.purpose,
      targetGap: template.targetGap,
      priority: template.priority,
      rationale,
    });
  }

  return result;
}
