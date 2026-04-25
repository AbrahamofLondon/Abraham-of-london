/**
 * Default Path Forecast — what happens if they don't act.
 *
 * Specific to the user's case. No fabricated £ amounts without user anchor.
 * Forecasts deterioration path. Shows how inaction transfers control.
 */

import type { CaseObject, ConditionClass } from "./case-object";
import { classifyCondition } from "./case-object";

export type DefaultPathForecast = {
  sevenDays: string;
  thirtyDays: string;
  ninetyDays: string;
  optionCompression?: string;
  consequenceShift?: string;
};

export function forecastDefaultPath(caseObj: CaseObject): DefaultPathForecast {
  const condition = caseObj.conditionClass ?? classifyCondition(caseObj);
  const hasOwner = caseObj.claimedOwner && caseObj.claimedOwner.trim().length > 3;
  const hasCost = caseObj.costOfDelay && caseObj.costOfDelay.trim().length > 5;

  // Base forecasts by condition — then personalise with case details
  const forecasts: Record<ConditionClass, DefaultPathForecast> = {
    authority: {
      sevenDays: hasOwner
        ? `${caseObj.claimedOwner} remains the nominal owner but is not yet exercising authority. Informal decisions begin filling the gap.`
        : "No owner has been named. Informal authority is already filling the vacuum.",
      thirtyDays: "The informal decision-maker has now set precedent. Reversing their decisions requires visible confrontation that most organisations will avoid.",
      ninetyDays: "Authority has been permanently redistributed by behaviour, not by design. Recovery requires reconstitution — not a conversation.",
      optionCompression: "Each week without explicit authority assignment removes one resolution path. Options are narrowing.",
      consequenceShift: hasCost
        ? `The cost you described — "${caseObj.costOfDelay}" — shifts from recoverable to structural after approximately 30 days.`
        : "The cost shifts from recoverable to structural. Once informal authority is established, the cost of correction exceeds the cost of the original decision.",
    },
    definition: {
      sevenDays: "The undefined decision continues to consume meeting time. Stakeholders discuss it without converging because the outcome was never agreed.",
      thirtyDays: "Different stakeholders are now executing against different interpretations. Rework is compounding. Each attempt to 'align' produces temporary agreement that collapses under execution pressure.",
      ninetyDays: "The undefined decision has become a structural dependency failure. Downstream work built on assumption, not agreement, begins failing visibly.",
      optionCompression: "Each week of undefined outcomes allows more divergent execution to accumulate. Correction scope grows linearly with time.",
    },
    execution: {
      sevenDays: caseObj.forcedAction
        ? `The action you described — "${caseObj.forcedAction}" — remains untaken. The window for voluntary action is still open but narrowing.`
        : "The decision remains deferred. The window for voluntary action is still open but narrowing.",
      thirtyDays: "The deferred decision is now more expensive to make. Fewer options remain. External conditions have shifted. The cost your prior self would have paid is lower than what your future self will pay.",
      ninetyDays: "The decision is now forced by external conditions rather than internal authority. The organisation responds reactively at higher cost and lower control.",
      optionCompression: "Deferred decisions lose approximately one viable option per month. At 90 days, the remaining options are the ones no one wanted.",
    },
    instability: {
      sevenDays: "The untested condition holds. No visible failure, but no proof of resilience either.",
      thirtyDays: "The first real pressure event will determine whether this was genuine clarity or comfortable assumption. If assumption, recovery starts from behind.",
      ninetyDays: "The untested condition has embedded itself as normal operating state. When it fails — and it will — the failure is structural, not incremental.",
    },
  };

  return forecasts[condition];
}
