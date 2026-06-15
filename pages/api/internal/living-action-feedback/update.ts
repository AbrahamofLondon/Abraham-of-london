/**
 * pages/api/internal/living-action-feedback/update.ts
 *
 * Internal/admin feedback update route.
 *
 * Allows operators to record action state changes with governed guardrails.
 * Only a protected internal route may mark verified_complete, and even then
 * it requires evidenceVerified=true, resolutionVerified=true, actor=operator/admin/reviewer/founder,
 * and source=manual_review.
 *
 * For MVP, this route uses the existing admin guard pattern (requireAdminPage).
 * If the guard is not available at API route level, it returns 501 with a clear
 * message rather than allowing unsafe mutation.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { canAccessAdmin } from "@/lib/access/checks";
import { getUserAccess } from "@/lib/access/get-user-access";
import { prisma } from "@/lib/prisma.server";
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

  // ── Admin guard ────────────────────────────────────────────────────────────
  try {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id ?? null;
    const email = session?.user?.email ?? null;

    if (!userId) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const access = await getUserAccess(prisma, userId, email);
    if (!canAccessAdmin(access)) {
      res.status(403).json({ ok: false, error: "Forbidden: admin access required" });
      return;
    }
  } catch {
    // If admin guard is not available, return 501 rather than allowing unsafe mutation.
    res.status(501).json({
      ok: false,
      error: "Admin guard not available in this environment. Feedback capture is read-only.",
    });
    return;
  }

  try {
    // Validate request body safety for operator audience.
    assertFeedbackUpdateIsSafe(req.body, "operator");

    const { feedbackId, objectId, actionId, status, notes, evidenceVerified, resolutionVerified, actor, source } = req.body as {
      feedbackId?: string;
      objectId?: string;
      actionId?: string;
      status: string;
      notes?: string;
      evidenceVerified?: boolean;
      resolutionVerified?: boolean;
      actor?: string;
      source?: string;
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

    // If this is a verified_complete update, also set the verification flags.
    if (status === "verified_complete") {
      updated.evidenceVerified = evidenceVerified === true;
      updated.resolutionVerified = resolutionVerified === true;
      if (actor) updated.actor = actor as any;
      if (source) updated.source = source as any;
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
        evidenceVerified: updated.evidenceVerified,
        resolutionVerified: updated.resolutionVerified,
        lastUpdatedAt: updated.lastUpdatedAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(400).json({ ok: false, error: message });
  }
}
