/**
 * pages/api/living-action-feedback/user-update.ts
 *
 * Safe user-facing feedback capture route.
 *
 * Allows users to record action state changes without falsely inferring
 * evidence verification, completion, consent, approval, fulfilment, or delivery.
 *
 * Allowed actions:
 *   - acknowledge recommended action
 *   - mark started
 *   - indicate evidence has been submitted
 *   - skip action with optional safe reason
 *
 * Rejects:
 *   - verified_complete
 *   - evidenceVerified=true
 *   - resolutionVerified=true
 *   - operator-only object IDs
 *   - unknown action IDs
 *   - unsafe notes or raw evidence payloads
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { loadFeedbackStore, saveFeedbackStore, updateFeedbackStatus } from "@/lib/living-intelligence/living-action-feedback-store";
import { assertFeedbackUpdateIsSafe } from "@/lib/living-intelligence/living-action-feedback-guards";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  // Only accept POST.
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    // Validate request body safety.
    assertFeedbackUpdateIsSafe(req.body, "user");

    const { feedbackId, objectId, actionId, status, notes } = req.body as {
      feedbackId?: string;
      objectId?: string;
      actionId?: string;
      status: string;
      notes?: string;
    };

    // Load the store.
    const store = loadFeedbackStore();

    // Find the feedback record.
    let targetId = feedbackId;
    if (!targetId && objectId && actionId) {
      const found = store.feedback.find(
        (f) => f.objectId === objectId && f.actionId === actionId,
      );
      if (found) {
        targetId = found.id;
      }
    }

    if (!targetId) {
      res.status(404).json({ ok: false, error: "Feedback record not found. Unknown objectId or actionId." });
      return;
    }

    // Update the status.
    const updated = updateFeedbackStatus(store, targetId, status as any, notes);
    if (!updated) {
      res.status(404).json({ ok: false, error: "Feedback record not found." });
      return;
    }

    // Save the store.
    saveFeedbackStore(store);

    res.status(200).json({
      ok: true,
      feedback: {
        id: updated.id,
        objectId: updated.objectId,
        actionId: updated.actionId,
        status: updated.status,
        lastUpdatedAt: updated.lastUpdatedAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(400).json({ ok: false, error: message });
  }
}
