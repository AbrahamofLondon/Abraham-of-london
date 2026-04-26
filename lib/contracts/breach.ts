/**
 * Breach Engine — missed checkpoint → warning → restricted → locked.
 *
 * Breach escalation is not punishment. It is accountability.
 */

import type { PatternBreakerContract, ContractCheckpoint, EscalationLevel } from "./types";

export type BreachResult = {
  breachCount: number;
  escalationLevel: EscalationLevel;
  message: string;
  strategyRoomLocked: boolean;
};

/**
 * Process a missed checkpoint and escalate accordingly.
 */
export function processCheckpointMiss(contract: PatternBreakerContract, checkpointId: string): BreachResult {
  const newBreachCount = contract.breachCount + 1;

  let escalationLevel: EscalationLevel;
  let message: string;
  let strategyRoomLocked = false;

  if (newBreachCount === 1) {
    escalationLevel = "warning";
    message = "First checkpoint missed. The system has recorded this.";
  } else if (newBreachCount === 2) {
    escalationLevel = "restricted";
    message = "Second checkpoint missed. This is now a pattern of avoidance. Access restricted.";
  } else {
    escalationLevel = "locked";
    message = "Three or more checkpoints missed. Behaviour is contradicting stated priorities. Strategy Room locked until acknowledged.";
    strategyRoomLocked = contract.source === "strategy_room";
  }

  // Signal-specific escalation overrides
  if (contract.canonSignals.includes("AUTHORITY_VACUUM") && newBreachCount >= 2) {
    message += " Authority vacuum signal active — owner reassignment requires explicit reason.";
  }

  if (contract.canonSignals.includes("RISK_EXPOSURE") && newBreachCount >= 1) {
    if (escalationLevel === "warning") escalationLevel = "restricted";
    message += " Risk exposure signal active — escalation level raised.";
  }

  return { breachCount: newBreachCount, escalationLevel, message, strategyRoomLocked };
}

/**
 * Check all checkpoints for overdue items.
 */
export function getOverdueCheckpoints(contract: PatternBreakerContract): ContractCheckpoint[] {
  const now = Date.now();
  return contract.checkpoints.filter(
    (cp) => cp.status === "pending" && new Date(cp.dueAt).getTime() < now,
  );
}
