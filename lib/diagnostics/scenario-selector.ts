/**
 * Scenario Selector — picks the right scenario for the detected signal.
 */

import type { SignalKey } from "./signals";
import { SCENARIOS, type ScenarioDefinition } from "./scenarios";

export function selectScenario(signal: SignalKey): ScenarioDefinition {
  const scenario = SCENARIOS.find((s) => s.trigger(signal));
  if (!scenario) {
    // Fallback to first scenario if no trigger matches
    return SCENARIOS[0]!;
  }
  return scenario;
}
