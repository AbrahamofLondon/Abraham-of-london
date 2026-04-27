/**
 * Default Path Forecast — what happens if they don't act.
 *
 * Specific to the user's case. No fabricated £ amounts without user anchor.
 * Forecasts deterioration path. Shows how inaction transfers control.
 *
 * Mathematical additions:
 * - optionDecayRate: options lost per month (0-1)
 * - controlShiftProbability: probability control transfers away (0-1)
 * - structuralRiskShift: rate of structural risk change
 */

import type { CaseObject, ConditionClass } from "./case-object";
import { classifyCondition } from "./case-object";

export type DefaultPathForecast = {
  alreadyIncurred?: string;
  sevenDays: string;
  thirtyDays: string;
  ninetyDays: string;
  optionCompression?: string;
  consequenceShift?: string;
  /** Options lost per month — 0-1 scale */
  optionDecayRate: number;
  /** Probability that decision control transfers away from stated owner — 0-1 */
  controlShiftProbability: number;
  /** Rate of structural risk change */
  structuralRiskShift: "stable" | "accelerating" | "compounding";
};

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICAL DERIVATION
// ─────────────────────────────────────────────────────────────────────────────

/** Base decay rates by condition class */
const BASE_DECAY_RATES: Record<ConditionClass, number> = {
  authority: 0.3,    // authority vacuums fill informally — moderate decay
  execution: 0.4,    // deferred decisions lose options fastest
  definition: 0.2,   // undefined decisions diverge slowly but compound
  instability: 0.15, // untested conditions hold until they don't
};

/**
 * Derive option decay rate from case material.
 * Higher specificity in cost-of-delay → higher decay (user can see it happening).
 */
function deriveOptionDecayRate(condition: ConditionClass, caseObj: CaseObject): number {
  let rate = BASE_DECAY_RATES[condition];

  // If user articulated cost of delay with specifics, decay is faster (they can see it)
  if (caseObj.costOfDelay) {
    const words = caseObj.costOfDelay.trim().split(/\s+/).length;
    if (words > 15) rate += 0.1; // detailed cost = visible decay
    if (/[£$€]|\d+/.test(caseObj.costOfDelay)) rate += 0.05; // quantified cost
  }

  // If forced action exists and differs from blocker → decision is closer to being forced
  if (caseObj.forcedAction && caseObj.blocker) rate += 0.05;

  return Math.min(0.8, rate);
}

/**
 * Derive probability that control shifts away from stated owner.
 * Based on: owner specificity, blocker severity, prior attempts.
 */
function deriveControlShiftProbability(condition: ConditionClass, caseObj: CaseObject): number {
  let probability = 0.3; // base: 30% chance control shifts in any deferred decision

  // No owner named → high shift probability
  if (!caseObj.claimedOwner || caseObj.claimedOwner.trim().length < 3) {
    probability += 0.3;
  }

  // Blocker is substantial → owner is constrained → shift more likely
  if (caseObj.blocker && caseObj.blocker.trim().split(/\s+/).length > 10) {
    probability += 0.1;
  }

  // Prior attempts failed → patterns suggest owner can't move it
  if (caseObj.priorAttempt && caseObj.priorAttempt.trim().length > 20) {
    probability += 0.1;
  }

  // Authority conditions have highest inherent shift risk
  if (condition === "authority") probability += 0.15;
  if (condition === "instability") probability += 0.1;

  return Math.min(0.95, probability);
}

/**
 * Derive structural risk shift from cost-of-delay specificity.
 */
function deriveStructuralRiskShift(condition: ConditionClass, caseObj: CaseObject): "stable" | "accelerating" | "compounding" {
  // Quantified cost = compounding (user sees the numbers growing)
  if (caseObj.costOfDelay && /[£$€]|\b\d{2,}\b/.test(caseObj.costOfDelay)) {
    return "compounding";
  }

  // Execution and authority conditions accelerate risk
  if (condition === "execution" || condition === "authority") {
    if (caseObj.priorAttempt && caseObj.priorAttempt.length > 20) {
      return "accelerating"; // prior failures + urgent condition = accelerating
    }
  }

  // Definition and instability tend to be stable until they suddenly aren't
  return "stable";
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FORECAST
// ─────────────────────────────────────────────────────────────────────────────

export function forecastDefaultPath(caseObj: CaseObject): DefaultPathForecast {
  const condition = caseObj.conditionClass ?? classifyCondition(caseObj);
  const hasOwner = caseObj.claimedOwner && caseObj.claimedOwner.trim().length > 3;
  const hasCost = caseObj.costOfDelay && caseObj.costOfDelay.trim().length > 5;

  // Mathematical fields
  const optionDecayRate = deriveOptionDecayRate(condition, caseObj);
  const controlShiftProbability = deriveControlShiftProbability(condition, caseObj);
  const structuralRiskShift = deriveStructuralRiskShift(condition, caseObj);

  // Personalised narrative forecasts by condition
  const forecasts: Record<ConditionClass, DefaultPathForecast> = {
    authority: {
      alreadyIncurred: hasOwner
        ? `Delayed decision ownership — ${caseObj.claimedOwner} holds nominal authority while informal decisions accumulate.`
        : "Unresolved authority dependency — no one named as owner while the decision drifts.",
      sevenDays: hasOwner
        ? `${caseObj.claimedOwner} remains the nominal owner but is not yet exercising authority. Informal decisions begin filling the gap.`
        : "No owner has been named. Informal authority is already filling the vacuum.",
      thirtyDays: "The informal decision-maker has now set precedent. Reversing their decisions requires visible confrontation that most organisations will avoid.",
      ninetyDays: "Authority has been permanently redistributed by behaviour, not by design. Recovery requires reconstitution — not a conversation.",
      optionCompression: `Each week without explicit authority assignment removes one resolution path. Options are narrowing at approximately ${Math.round(optionDecayRate * 100)}% per month.`,
      consequenceShift: hasCost
        ? `The cost you described — "${caseObj.costOfDelay}" — shifts from recoverable to structural after approximately 30 days.`
        : "The cost shifts from recoverable to structural. Once informal authority is established, the cost of correction exceeds the cost of the original decision.",
      optionDecayRate,
      controlShiftProbability,
      structuralRiskShift,
    },
    definition: {
      alreadyIncurred: "Accumulated definition drift — stakeholders already executing against different interpretations of this decision.",
      sevenDays: "The undefined decision continues to consume meeting time. Stakeholders discuss it without converging because the outcome was never agreed.",
      thirtyDays: "Different stakeholders are now executing against different interpretations. Rework is compounding. Each attempt to 'align' produces temporary agreement that collapses under execution pressure.",
      ninetyDays: "The undefined decision has become a structural dependency failure. Downstream work built on assumption, not agreement, begins failing visibly.",
      optionCompression: `Each week of undefined outcomes allows more divergent execution to accumulate. Correction scope grows at approximately ${Math.round(optionDecayRate * 100)}% per month.`,
      optionDecayRate,
      controlShiftProbability,
      structuralRiskShift,
    },
    execution: {
      alreadyIncurred: caseObj.forcedAction
        ? `Repeated execution drift — you already identified the action ("${caseObj.forcedAction.length > 60 ? caseObj.forcedAction.slice(0, 60) + "..." : caseObj.forcedAction}") but it remains untaken.`
        : "Repeated execution drift — the decision is understood but being avoided.",
      sevenDays: caseObj.forcedAction
        ? `The action you described — "${caseObj.forcedAction}" — remains untaken. The window for voluntary action is still open but narrowing.`
        : "The decision remains deferred. The window for voluntary action is still open but narrowing.",
      thirtyDays: "The deferred decision is now more expensive to make. Fewer options remain. External conditions have shifted. The cost your prior self would have paid is lower than what your future self will pay.",
      ninetyDays: "The decision is now forced by external conditions rather than internal authority. The organisation responds reactively at higher cost and lower control.",
      optionCompression: `Deferred decisions lose approximately ${Math.round(optionDecayRate * 100)}% of viable options per month. At 90 days, the remaining options are the ones no one wanted.`,
      optionDecayRate,
      controlShiftProbability,
      structuralRiskShift,
    },
    instability: {
      alreadyIncurred: "Untested assumptions already embedded — operating on clarity that has never survived real pressure.",
      sevenDays: "The untested condition holds. No visible failure, but no proof of resilience either.",
      thirtyDays: "The first real pressure event will determine whether this was genuine clarity or comfortable assumption. If assumption, recovery starts from behind.",
      ninetyDays: "The untested condition has embedded itself as normal operating state. When it fails — and it will — the failure is structural, not incremental.",
      optionDecayRate,
      controlShiftProbability,
      structuralRiskShift,
    },
  };

  return forecasts[condition];
}

/**
 * Generate a one-line control shift summary for display.
 */
export function controlShiftSummary(forecast: DefaultPathForecast): string {
  const pct = Math.round(forecast.controlShiftProbability * 100);
  if (pct >= 70) {
    return `If unchanged for 30 days, decision control almost certainly shifts from you to operational drift (${pct}% probability).`;
  }
  if (pct >= 50) {
    return `If unchanged for 30 days, decision control is likely to shift away from the stated owner (${pct}% probability).`;
  }
  return `Control shift probability over 30 days: ${pct}%. The stated owner retains nominal authority — for now.`;
}
