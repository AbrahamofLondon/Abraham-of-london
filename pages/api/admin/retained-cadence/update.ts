import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import {
  escalateRetainedReviewCycle,
  markRetainedReviewCompleted,
  markRetainedReviewSkipped,
} from "@/lib/product/retained-cadence-service";

type Action = "MARK_COMPLETED" | "SKIP_WITH_REASON" | "ESCALATE";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "admin-retained-cadence-update",
  });
  if (!session) return;

  const body = (req.body ?? {}) as {
    cycleId?: string;
    action?: Action;
    reason?: string;
  };

  if (typeof body.cycleId !== "string" || !body.cycleId.trim()) {
    return res.status(400).json({ ok: false, error: "CYCLE_ID_REQUIRED" });
  }

  if (!body.action || !["MARK_COMPLETED", "SKIP_WITH_REASON", "ESCALATE"].includes(body.action)) {
    return res.status(400).json({ ok: false, error: "INVALID_ACTION" });
  }

  const operatorId = typeof session.user?.id === "string" ? session.user.id : null;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  let updated = null;
  if (body.action === "MARK_COMPLETED") {
    updated = await markRetainedReviewCompleted({
      cycleId: body.cycleId,
      operatorId,
    });
  }
  if (body.action === "SKIP_WITH_REASON") {
    if (!reason) {
      return res.status(400).json({ ok: false, error: "SKIP_REASON_REQUIRED" });
    }
    updated = await markRetainedReviewSkipped({
      cycleId: body.cycleId,
      operatorId,
      skippedReason: reason,
    });
  }
  if (body.action === "ESCALATE") {
    if (!reason) {
      return res.status(400).json({ ok: false, error: "ESCALATION_REASON_REQUIRED" });
    }
    updated = await escalateRetainedReviewCycle({
      cycleId: body.cycleId,
      operatorId,
      escalationReason: reason,
    });
  }

  if (!updated) {
    return res.status(404).json({ ok: false, error: "CYCLE_NOT_FOUND" });
  }

  return res.status(200).json({
    ok: true,
    cycle: updated,
  });
}
