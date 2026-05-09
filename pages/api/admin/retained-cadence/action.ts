import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import {
  completeCycle,
  escalateOverdueCycle,
  markCycleInProgress,
  skipCycleWithReason,
} from "@/lib/product/retained-cadence-service";

type Action = "MARK_IN_PROGRESS" | "COMPLETE" | "SKIP" | "ESCALATE";

const VALID_ACTIONS: Action[] = ["MARK_IN_PROGRESS", "COMPLETE", "SKIP", "ESCALATE"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "admin-retained-cadence-action",
  });
  if (!session) return;

  const body = (req.body ?? {}) as {
    cycleId?: string;
    action?: Action;
    reason?: string;
    intervalDays?: number;
  };

  if (typeof body.cycleId !== "string" || !body.cycleId.trim()) {
    return res.status(400).json({ ok: false, error: "CYCLE_ID_REQUIRED" });
  }

  if (!body.action || !VALID_ACTIONS.includes(body.action)) {
    return res.status(400).json({ ok: false, error: "INVALID_ACTION", validActions: VALID_ACTIONS });
  }

  const operatorId = typeof session.user?.id === "string" ? session.user.id : null;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  let updated = null;

  if (body.action === "MARK_IN_PROGRESS") {
    if (!operatorId) {
      return res.status(400).json({ ok: false, error: "OPERATOR_ID_REQUIRED" });
    }
    updated = await markCycleInProgress(body.cycleId, operatorId);
  }

  if (body.action === "COMPLETE") {
    if (!operatorId) {
      return res.status(400).json({ ok: false, error: "OPERATOR_ID_REQUIRED" });
    }
    updated = await completeCycle(body.cycleId, operatorId, {
      intervalDays: typeof body.intervalDays === "number" ? body.intervalDays : undefined,
    });
  }

  if (body.action === "SKIP") {
    if (!reason) {
      return res.status(400).json({ ok: false, error: "SKIP_REASON_REQUIRED" });
    }
    if (!operatorId) {
      return res.status(400).json({ ok: false, error: "OPERATOR_ID_REQUIRED" });
    }
    updated = await skipCycleWithReason(body.cycleId, reason, operatorId);
  }

  if (body.action === "ESCALATE") {
    updated = await escalateOverdueCycle(body.cycleId, operatorId);
  }

  if (!updated) {
    return res.status(404).json({ ok: false, error: "CYCLE_NOT_FOUND" });
  }

  return res.status(200).json({ ok: true, cycle: updated });
}
