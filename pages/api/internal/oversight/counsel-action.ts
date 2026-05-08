import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import {
  createCounselWorkflowAction,
  listCounselWorkflowActions,
  persistCounselWorkflowAction,
} from "@/lib/product/counsel-review-workflow";
import type { CounselReviewAction, CounselWorkflowStatus } from "@/lib/product/counsel-review-workflow-contract";

type RequestBody = {
  workflowId?: string;
  caseId?: string;
  cycleId?: string;
  triggerReason?: string;
  triggerSource?: string;
  assignedTo?: string;
  requestedReviewQuestion?: string;
  status?: CounselWorkflowStatus;
  counselResponseSummary?: string;
  evidenceNodeIds?: string[];
  requiredActionIds?: string[];
  operatorDisposition?: "ACCEPTED" | "REJECTED" | "PENDING";
  nextAction?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await requireAdminServer(req, res, {
    routeKey: "internal-oversight-counsel-action",
  });
  if (!session) return;

  if (req.method === "GET") {
    const cycleId = typeof req.query.cycleId === "string" ? req.query.cycleId : undefined;
    const caseId = typeof req.query.caseId === "string" ? req.query.caseId : undefined;
    const workflows = await listCounselWorkflowActions({ cycleId, caseId });
    return res.status(200).json({ ok: true, workflows });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const body = (req.body ?? {}) as RequestBody;
  const actorId = typeof session.user?.id === "string" ? session.user.id : null;

  if (body.workflowId) {
    const workflow: CounselReviewAction = {
      id: body.workflowId,
      caseId: body.caseId || "",
      cycleId: body.cycleId,
      status: body.status ?? "UNDER_REVIEW",
      triggerReason: body.triggerReason || "Counsel workflow updated.",
      triggerSource: body.triggerSource,
      assignedTo: body.assignedTo,
      assignedBy: actorId ?? undefined,
      requestedReviewQuestion: body.requestedReviewQuestion,
      counselResponseSummary: body.counselResponseSummary,
      evidenceNodeIds: body.evidenceNodeIds,
      requiredActionIds: body.requiredActionIds,
      operatorDisposition: body.operatorDisposition,
      nextAction: body.nextAction,
    };

    const persisted = await persistCounselWorkflowAction({
      workflow,
      actorId,
    });
    return res.status(200).json({ ok: true, workflow: persisted });
  }

  if (!body.caseId || !body.triggerReason) {
    return res.status(400).json({ ok: false, error: "CASE_AND_REASON_REQUIRED" });
  }

  const created = await createCounselWorkflowAction({
    caseId: body.caseId,
    cycleId: body.cycleId,
    triggerReason: body.triggerReason,
    triggerSource: body.triggerSource,
    assignedTo: body.assignedTo,
    assignedBy: actorId ?? undefined,
    requestedReviewQuestion: body.requestedReviewQuestion,
    actorId,
  });

  return res.status(200).json({ ok: true, workflow: created });
}
