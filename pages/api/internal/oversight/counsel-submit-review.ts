import type { NextApiRequest, NextApiResponse } from "next";

import { submitCounselReview } from "@/lib/product/counsel-assignment-engine";
import { listCounselWorkflowActions } from "@/lib/product/counsel-review-workflow";
import { requireOversightRole } from "@/lib/product/operator-role-access";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const accessSession = await requireOversightRole(req, res, {
    routeKey: "internal-oversight-counsel-submit-review",
    permission: "COUNSEL_WORKFLOW",
  });
  if (!accessSession) return;
  const actorId = typeof accessSession.session.user?.id === "string" ? accessSession.session.user.id : null;
  const sessionEmail = typeof accessSession.session.user?.email === "string" ? accessSession.session.user.email.toLowerCase() : "";
  const body = req.body ?? {};

  if (typeof body.workflowId !== "string" || typeof body.caseId !== "string") {
    return res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
  }

  if (accessSession.role === "COUNSEL") {
    const workflows = await listCounselWorkflowActions({
      cycleId: typeof body.cycleId === "string" ? body.cycleId : undefined,
      caseId: body.caseId,
    });
    const assigned = workflows.find((item) => item.id === body.workflowId);
    if (!assigned || (assigned.assignedTo || "").toLowerCase() !== sessionEmail) {
      return res.status(403).json({ ok: false, error: "COUNSEL_ASSIGNMENT_REQUIRED" });
    }
  }

  const result = await submitCounselReview({
    actorId,
    workflowId: body.workflowId,
    caseId: body.caseId,
    cycleId: typeof body.cycleId === "string" ? body.cycleId : undefined,
    status: typeof body.status === "string" ? body.status : "COUNSEL_RESPONSE_RECORDED",
    reviewStatus: body.reviewStatus === "ACCEPTED" || body.reviewStatus === "REJECTED" ? body.reviewStatus : "OUTCOME_PENDING",
    triggerReason: typeof body.triggerReason === "string" ? body.triggerReason : "Governed counsel review submitted.",
    evidenceBasis: Array.isArray(body.evidenceBasis) ? body.evidenceBasis.filter((item: unknown): item is string => typeof item === "string") : [],
    recommendation: typeof body.recommendation === "string" ? body.recommendation : "",
    contradictionAssessment: typeof body.contradictionAssessment === "string" ? body.contradictionAssessment : "",
    riskIfIgnored: typeof body.riskIfIgnored === "string" ? body.riskIfIgnored : "",
    agreesWithSystemRestriction: body.agreesWithSystemRestriction !== false,
    requiredClientAction: typeof body.requiredClientAction === "string" ? body.requiredClientAction : "",
    outcomeFollowUpDate: typeof body.outcomeFollowUpDate === "string" ? body.outcomeFollowUpDate : undefined,
    escalateToRetainerOversight: body.escalateToRetainerOversight === true,
    escalateToBoardroom: body.escalateToBoardroom === true,
  });

  return res.status(200).json({ ok: true, ...result });
}
