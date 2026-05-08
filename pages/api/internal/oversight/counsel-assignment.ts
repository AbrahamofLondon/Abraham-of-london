import type { NextApiRequest, NextApiResponse } from "next";

import { assignCounselReview } from "@/lib/product/counsel-assignment-engine";
import { requireOversightRole } from "@/lib/product/operator-role-access";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const accessSession = await requireOversightRole(req, res, {
    routeKey: "internal-oversight-counsel-assignment",
    permission: "COUNSEL_WORKFLOW",
  });
  if (!accessSession) return;
  const role = accessSession.role;
  if (!role || !["SUPER_ADMIN", "OPERATOR"].includes(role)) {
    return res.status(403).json({ ok: false, error: "COUNSEL_ASSIGNMENT_FORBIDDEN" });
  }

  const body = req.body ?? {};
  if (typeof body.caseId !== "string" || typeof body.triggerReason !== "string" || typeof body.assignedTo !== "string") {
    return res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
  }

  const actorId = typeof accessSession.session.user?.id === "string" ? accessSession.session.user.id : null;
  const result = await assignCounselReview({
    actorId,
    caseId: body.caseId,
    cycleId: typeof body.cycleId === "string" ? body.cycleId : undefined,
    triggerReason: body.triggerReason,
    triggerSource: typeof body.triggerSource === "string" ? body.triggerSource : undefined,
    assignedTo: body.assignedTo,
    requestedReviewQuestion: typeof body.requestedReviewQuestion === "string" ? body.requestedReviewQuestion : undefined,
  });
  return res.status(200).json({ ok: true, ...result });
}
