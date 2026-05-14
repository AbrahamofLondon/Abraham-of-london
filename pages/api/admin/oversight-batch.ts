/**
 * pages/api/admin/oversight-batch.ts
 *
 * Safe bulk actions for oversight review cycles.
 *
 * POST /api/admin/oversight-batch
 * Body: { action, cycleIds, reason? }
 * Returns: { ok, successCount, failCount, results }
 *
 * Actions:
 *   MARK_IN_PROGRESS  — starts review for DUE/OVERDUE cycles
 *   MARK_COMPLETED    — completes cycles in REVIEW_IN_PROGRESS
 *   SKIP_WITH_REASON  — skips cycles with a mandatory reason string
 *
 * Eligibility is re-verified server-side. Ineligible cycle IDs in the
 * request are skipped, not errored — partial success is the expected outcome.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminPage } from "@/lib/access/server";
import { classifyBatchEligibility } from "@/lib/admin/oversight-batch";
import type { OversightBatchAction, OversightBatchResult } from "@/lib/admin/oversight-batch";

type RequestBody = {
  action: OversightBatchAction;
  cycleIds: string[];
  reason?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminPage(req as any);
  if (!guard.authorized) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const body = req.body as RequestBody;
  const { action, cycleIds, reason } = body;

  if (!action || !Array.isArray(cycleIds) || cycleIds.length === 0) {
    return res.status(400).json({ ok: false, error: "action and cycleIds are required" });
  }

  const validActions: OversightBatchAction[] = [
    "MARK_IN_PROGRESS",
    "MARK_COMPLETED",
    "SKIP_WITH_REASON",
  ];
  if (!validActions.includes(action)) {
    return res.status(400).json({ ok: false, error: `Invalid action: ${action}` });
  }

  if (action === "SKIP_WITH_REASON" && (!reason || !reason.trim())) {
    return res.status(400).json({
      ok: false,
      error: "A reason is required for SKIP_WITH_REASON",
    });
  }

  if (cycleIds.length > 50) {
    return res.status(400).json({
      ok: false,
      error: "Batch size limited to 50 cycles per request",
    });
  }

  const { buildOperatorCadenceQueue } = await import(
    "@/lib/product/retained-cadence-service"
  );
  const {
    markCycleInProgress,
    completeCycle,
    skipCycleWithReason,
  } = await import("@/lib/product/retained-cadence-service");

  const queue = await buildOperatorCadenceQueue();

  const results: OversightBatchResult["results"] = [];

  for (const cycleId of cycleIds) {
    const queueItem = queue.all.find((item) => item.cycleId === cycleId);

    if (!queueItem) {
      results.push({ cycleId, success: false, error: "Cycle not found in queue" });
      continue;
    }

    const { eligibleActions } = classifyBatchEligibility({
      cycleId: queueItem.cycleId,
      cadenceState: queueItem.cadenceState,
    });

    if (!eligibleActions.includes(action)) {
      results.push({
        cycleId,
        success: false,
        error: `Action ${action} is not eligible for cycle in state ${queueItem.cadenceState}`,
      });
      continue;
    }

    try {
      if (action === "MARK_IN_PROGRESS") {
        await markCycleInProgress(cycleId, "admin_batch");
      } else if (action === "MARK_COMPLETED") {
        await completeCycle(cycleId, "admin_batch");
      } else if (action === "SKIP_WITH_REASON") {
        await skipCycleWithReason(cycleId, reason!.trim(), "admin_batch");
      }
      results.push({ cycleId, success: true });
    } catch (err) {
      results.push({
        cycleId,
        success: false,
        error: err instanceof Error ? err.message : "Action failed",
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return res.status(200).json({
    ok: successCount > 0,
    successCount,
    failCount,
    results,
  } satisfies OversightBatchResult & { ok: boolean });
}
