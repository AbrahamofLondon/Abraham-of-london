import "server-only";

/**
 * Return Brief Trigger Engine — compatibility wrapper.
 *
 * Sending is now controlled centrally by the Decision State Orchestrator.
 * This module is retained so older manual/debug entry points continue to work
 * without owning their own email copy or delivery path.
 */

import type { OrchestrationResult } from "@/lib/server/follow-up/decision-state-orchestrator.server";

export type TriggerScanResult = {
  sessionsScanned: number;
  briefsGenerated: number;
  emailsSent: number;
  errors: string[];
};

export async function runReturnBriefScan(): Promise<TriggerScanResult> {
  const { runDecisionStateOrchestrator } = await import("@/lib/server/follow-up/decision-state-orchestrator.server");
  const result: OrchestrationResult = await runDecisionStateOrchestrator({
    dryRun: false,
    limit: 200,
  });

  return {
    sessionsScanned: result.scanned,
    briefsGenerated: result.triggered,
    emailsSent: result.triggered,
    errors: result.errors > 0 ? [`Decision State Orchestrator reported ${result.errors} error(s).`] : [],
  };
}
