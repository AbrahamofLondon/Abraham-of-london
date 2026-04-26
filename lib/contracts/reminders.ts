/**
 * Reminder Engine — sends checkpoint and breach reminders.
 * Uses existing email system. No fake sends.
 */

import type { PatternBreakerContract, ContractCheckpoint } from "./types";
import { getOverdueCheckpoints } from "./breach";

export type ReminderEmail = {
  to: string;
  subject: string;
  body: string;
  type: "checkpoint" | "breach";
};

export function getDueCheckpoints(contracts: PatternBreakerContract[], now: Date): Array<{ contract: PatternBreakerContract; checkpoint: ContractCheckpoint }> {
  const results: Array<{ contract: PatternBreakerContract; checkpoint: ContractCheckpoint }> = [];

  for (const contract of contracts) {
    if (contract.status !== "active") continue;
    const overdue = getOverdueCheckpoints(contract);
    for (const cp of overdue) {
      if (!cp.reminderSent) {
        results.push({ contract, checkpoint: cp });
      }
    }
  }

  return results;
}

export function buildReminderEmail(contract: PatternBreakerContract, checkpoint: ContractCheckpoint): ReminderEmail | null {
  if (!contract.ownerEmail) return null;

  return {
    to: contract.ownerEmail,
    subject: `Checkpoint due: ${contract.commitment.slice(0, 50)}`,
    body: `You committed to:\n\n"${contract.commitment}"\n\nCheckpoint due: ${new Date(checkpoint.dueAt).toLocaleDateString()}\n\nStatus: ${checkpoint.status}\n\nIf no action is taken, this will be recorded as a missed checkpoint.`,
    type: "checkpoint",
  };
}

export function buildBreachEmail(contract: PatternBreakerContract, checkpoint: ContractCheckpoint): ReminderEmail | null {
  if (!contract.ownerEmail) return null;

  const breachNum = contract.breachCount + 1;
  const severity = breachNum === 1 ? "First" : breachNum === 2 ? "Second" : `${breachNum}th`;

  return {
    to: contract.ownerEmail,
    subject: `${severity} missed checkpoint: ${contract.commitment.slice(0, 40)}`,
    body: `${severity} checkpoint missed for:\n\n"${contract.commitment}"\n\nThis is not a missed task. It is a ${breachNum >= 3 ? "repeated failure" : "missed commitment"} against a stated pattern-breaker contract.\n\n${contract.consequenceOfInaction ? `Consequence of inaction: ${contract.consequenceOfInaction}` : ""}`,
    type: "breach",
  };
}

export function markReminderSent(contract: PatternBreakerContract, checkpointId: string): PatternBreakerContract {
  return {
    ...contract,
    checkpoints: contract.checkpoints.map((cp) =>
      cp.id === checkpointId ? { ...cp, reminderSent: true } : cp,
    ),
    updatedAt: new Date().toISOString(),
  };
}
