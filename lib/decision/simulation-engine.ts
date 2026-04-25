/**
 * Simulation Engine — "What if I do X?" consequence modelling.
 *
 * Wraps the structural decision simulation from lib/engine/ with
 * spine-aware context. The Strategy Room uses this to answer:
 *
 * "What if I escalate now?"
 * "What if I replace the owner?"
 * "What if I do nothing for another month?"
 *
 * Outputs: immediate effect, second-order effect, likely blocker,
 * risk shift direction, and a concrete recommendation.
 */

import type { IntelligenceSpine, StakeholderMap } from "./intelligence-spine";
import type { ConditionClass } from "./case-object";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type RiskShift = "increases" | "stable" | "decreases";

export type SimulationResult = {
  /** What happens immediately if this action is taken */
  immediateEffect: string;
  /** What follows from the immediate effect (2nd-order consequence) */
  secondOrderEffect: string;
  /** What is most likely to block or derail this action */
  likelyBlocker: string;
  /** Direction of risk change */
  riskShift: RiskShift;
  /** One-sentence recommendation */
  recommendation: string;
  /** Confidence in this simulation (0-1) */
  confidence: number;
};

export type ActionCategory =
  | "escalate"
  | "replace_owner"
  | "force_deadline"
  | "do_nothing"
  | "confront"
  | "restructure"
  | "custom";

// ─────────────────────────────────────────────────────────────────────────────
// ACTION CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

function classifyAction(action: string): ActionCategory {
  const lower = action.toLowerCase();
  if (/escalat|board|executive|senior|higher/.test(lower)) return "escalate";
  if (/replac|remov|reassign|new owner|change.*owner/.test(lower)) return "replace_owner";
  if (/deadline|force.*date|set.*date|ultimatum|by.*friday|by.*monday/.test(lower)) return "force_deadline";
  if (/nothing|wait|delay|defer|pause|hold/.test(lower)) return "do_nothing";
  if (/confront|address.*directly|have.*conversation|tell.*truth/.test(lower)) return "confront";
  if (/restructur|reorgani|redesign|rebuild/.test(lower)) return "restructure";
  return "custom";
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATION MODELS
// ─────────────────────────────────────────────────────────────────────────────

type SimModel = Record<ConditionClass, {
  immediateEffect: string;
  secondOrderEffect: string;
  likelyBlocker: string;
  riskShift: RiskShift;
  recommendation: string;
}>;

const ESCALATE_MODEL: SimModel = {
  authority: {
    immediateEffect: "Escalation surfaces the authority vacuum to senior leadership. The unnamed decision-maker loses informal control.",
    secondOrderEffect: "If senior leadership acts, formal authority is restored. If they defer, the escalation confirms that no one above wants this decision either.",
    likelyBlocker: "The person you escalate to may also lack clear authority, creating another layer of deferral.",
    riskShift: "decreases",
    recommendation: "Escalate — but only if you have identified who above has actual authority. Escalating into another vacuum makes the condition worse.",
  },
  definition: {
    immediateEffect: "Escalation forces the definition question upward. Senior leadership must articulate what the decision actually is.",
    secondOrderEffect: "If they define it, alignment becomes possible. If they cannot, the undefined state is now visible at a higher level — which accelerates resolution.",
    likelyBlocker: "Senior leadership may believe the decision is already defined. The escalation conversation must prove it is not.",
    riskShift: "decreases",
    recommendation: "Escalate with evidence of divergent interpretations. Do not escalate with a complaint — escalate with proof.",
  },
  execution: {
    immediateEffect: "Escalation creates external pressure on the person deferring. The decision becomes visible to people who will hold them accountable.",
    secondOrderEffect: "The deferring party either acts or is bypassed. Either way, the decision moves. The cost is relationship friction.",
    likelyBlocker: "The person you escalate to may protect the deferring party. Organisational loyalty can override operational logic.",
    riskShift: "decreases",
    recommendation: "Escalate with a deadline attached. Open-ended escalations become discussions. Deadline-bound escalations become decisions.",
  },
  instability: {
    immediateEffect: "Escalation under instability is premature — there is no proven failure to escalate. The condition is untested.",
    secondOrderEffect: "Senior leadership may dismiss the escalation as premature, reducing your credibility for when it actually matters.",
    likelyBlocker: "The absence of a visible failure makes the escalation feel speculative. You will be asked for evidence you do not yet have.",
    riskShift: "stable",
    recommendation: "Do not escalate yet. Test the condition first. Force the decision through one real constraint. If it breaks, then escalate with evidence.",
  },
};

const DO_NOTHING_MODEL: SimModel = {
  authority: {
    immediateEffect: "The authority vacuum persists. Informal decision-making continues to fill the gap.",
    secondOrderEffect: "In 30 days, the informal authority becomes the de facto authority. Reversing it will require visible confrontation.",
    likelyBlocker: "Inertia. The absence of crisis makes inaction feel acceptable.",
    riskShift: "increases",
    recommendation: "Inaction is the current strategy. It produces a predictable outcome: informal authority replaces formal authority. If that is acceptable, do nothing. If not, act now.",
  },
  definition: {
    immediateEffect: "Stakeholders continue operating against different interpretations. No one knows the decision is undefined because everyone thinks they know what it is.",
    secondOrderEffect: "Rework compounds. When the divergence surfaces (and it will), the cost of alignment is higher than it would be today.",
    likelyBlocker: "The illusion of alignment. Everyone believes they agree because no one has tested it.",
    riskShift: "increases",
    recommendation: "Doing nothing here is not neutral — it is allowing divergence to accumulate. The longer you wait, the more expensive alignment becomes.",
  },
  execution: {
    immediateEffect: "The deferred decision remains deferred. The window for voluntary action narrows further.",
    secondOrderEffect: "External conditions will eventually force the decision. When they do, you will have fewer options and less control.",
    likelyBlocker: "Comfort. The current state is survivable. The future state is not — but it is not here yet.",
    riskShift: "increases",
    recommendation: "Every week of deferral costs you one option. You currently have options. You will not have them forever.",
  },
  instability: {
    immediateEffect: "The untested condition continues to hold. No evidence of failure, but no evidence of resilience either.",
    secondOrderEffect: "The first real pressure event will determine whether this was genuine clarity or comfortable assumption.",
    likelyBlocker: "The absence of visible failure makes testing feel unnecessary.",
    riskShift: "stable",
    recommendation: "Doing nothing is reasonable here — but only if you are monitoring for the first sign of pressure. Set a trigger condition.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SIMULATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulate the consequence of a proposed action against the current spine state.
 */
export function simulateAction(input: {
  action: string;
  spine: IntelligenceSpine;
  stakeholderMap?: StakeholderMap;
}): SimulationResult {
  const { action, spine, stakeholderMap } = input;
  const condition = spine.deterministic.conditionClass;
  const category = classifyAction(action);

  // Select the appropriate simulation model
  let model: SimModel[ConditionClass];

  switch (category) {
    case "escalate":
      model = ESCALATE_MODEL[condition];
      break;
    case "do_nothing":
      model = DO_NOTHING_MODEL[condition];
      break;
    case "force_deadline":
      model = {
        immediateEffect: `Setting a deadline forces visibility. The decision must either be made or explicitly deferred — deferral under a deadline is a visible choice, not a silent one.`,
        secondOrderEffect: condition === "execution"
          ? `The deadline will expose who actually blocks the decision. If the blocker is real, it will surface. If it is a justification for avoidance, the deadline will prove it.`
          : `The deadline creates a forcing function. Stakeholders who have been operating under different assumptions will be forced to converge or visibly disagree.`,
        likelyBlocker: stakeholderMap?.blockers[0]
          ? `The most likely resistance comes from: ${stakeholderMap.blockers[0]}. Anticipate their objection and prepare your response before the deadline is set.`
          : "The most likely resistance is from whoever benefits from the current ambiguity. Identify them before setting the deadline.",
        riskShift: "decreases" as RiskShift,
        recommendation: "Set the deadline. Attach a named person to the outcome. Make the deadline non-negotiable for at least the first iteration.",
      };
      break;
    case "replace_owner":
      model = {
        immediateEffect: `Replacing the owner signals that the current ownership structure has failed. This creates immediate clarity — and immediate friction.`,
        secondOrderEffect: `The replaced owner will either accept the change (confirming they were blocked) or resist (confirming they were the blocker). Either way, the condition is clarified.`,
        likelyBlocker: stakeholderMap?.formalOwner
          ? `${stakeholderMap.formalOwner} may resist the replacement. Their institutional position may protect them even if their decision authority has eroded.`
          : "Institutional resistance. Ownership changes surface power dynamics that organisations prefer to leave unnamed.",
        riskShift: "decreases" as RiskShift,
        recommendation: "Replace the owner only if you have the authority to do so. If you do not, escalate to someone who does — with this recommendation attached.",
      };
      break;
    case "confront":
      model = {
        immediateEffect: `Direct confrontation breaks the avoidance pattern. The unnamed thing becomes named. This is uncomfortable but structurally necessary.`,
        secondOrderEffect: condition === "authority"
          ? "The confrontation will reveal whether the authority gap is a misunderstanding or a power structure. Both are useful to know."
          : "The confrontation forces a response. The response — whatever it is — gives you more information than the current silence.",
        likelyBlocker: "Your own willingness to sustain the discomfort. Most confrontations fail not because of the other party but because the initiator softens the message.",
        riskShift: "decreases" as RiskShift,
        recommendation: "Confront with evidence, not emotion. State what you observed, what it means, and what must happen next. Do not ask for agreement — state the consequence of inaction.",
      };
      break;
    default:
      // Custom action — generic simulation based on condition
      model = {
        immediateEffect: `Taking action on "${action.slice(0, 60)}" introduces a variable that the current stagnant state has not had to absorb.`,
        secondOrderEffect: `The second-order effect depends on how the existing blockers respond. If the ${condition} condition is real, your action will meet resistance at that exact point.`,
        likelyBlocker: spine.synthesis?.avoidedDecision
          ? `The underlying avoidance pattern remains: ${spine.synthesis.avoidedDecision.slice(0, 80)}. Your action must address this or it will be absorbed by the existing pattern.`
          : "The structural condition identified by the system. Your action must address the root condition, not its symptoms.",
        riskShift: "stable" as RiskShift,
        recommendation: `Proceed — but monitor whether the ${condition} condition absorbs your action or is disrupted by it. If absorbed, escalate.`,
      };
  }

  // Confidence based on spine depth and C3 tier
  const stageDepth = spine.history.length;
  const c3Factor = spine.c3.specificityScore;
  const confidence = Math.min(0.95, 0.3 + (stageDepth * 0.1) + (c3Factor * 0.3));

  return {
    ...model,
    confidence,
  };
}
