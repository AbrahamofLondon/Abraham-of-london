import "server-only";

import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma.server";
import { createCounselWorkflowAction, listCounselWorkflowActions, persistCounselWorkflowAction } from "@/lib/product/counsel-review-workflow";
import type { CounselAssignmentRequest, CounselAssignmentResult, CounselReviewSubmission } from "@/lib/product/counsel-assignment-contract";
import { validateCounselReviewSubmission } from "@/lib/product/counsel-review-submission";

export async function assignCounselReview(input: CounselAssignmentRequest & { actorId?: string | null }): Promise<CounselAssignmentResult> {
  const workflow = await createCounselWorkflowAction({
    caseId: input.caseId,
    cycleId: input.cycleId,
    triggerReason: input.triggerReason,
    triggerSource: input.triggerSource,
    assignedTo: input.assignedTo,
    requestedReviewQuestion: input.requestedReviewQuestion,
    actorId: input.actorId,
  });
  return { workflow };
}

export async function submitCounselReview(input: CounselReviewSubmission & { actorId?: string | null }) {
  const errors = validateCounselReviewSubmission(input);
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  const existing = (await listCounselWorkflowActions({
    cycleId: input.cycleId,
    caseId: input.caseId,
  })).find((item) => item.id === input.workflowId);

  if (!existing) {
    throw new Error("Counsel workflow does not exist.");
  }

  const evidenceNodeIds: string[] = [];
  const journey = await prisma.diagnosticJourney.findFirst({
    where: { journeyKey: input.caseId },
    select: { id: true },
  });
  if (journey) {
    for (const basis of input.evidenceBasis) {
      const node = await prisma.diagnosticEvidenceNode.create({
        data: {
          journeyId: journey.id,
          sourceStage: "counsel_review",
          kind: "human_reviewed",
          label: "Governed counsel review",
          summary: basis,
          confidence: 0.8,
          severity: "medium",
          payload: {
            recommendation: input.recommendation,
            contradictionAssessment: input.contradictionAssessment,
            riskIfIgnored: input.riskIfIgnored,
            agreesWithSystemRestriction: input.agreesWithSystemRestriction,
            requiredClientAction: input.requiredClientAction,
            outcomeFollowUpDate: input.outcomeFollowUpDate ?? null,
          } as never,
        },
      });
      evidenceNodeIds.push(node.id);
    }
  } else {
    evidenceNodeIds.push(randomUUID());
  }

  const nextAction = input.escalateToBoardroom
    ? "Escalate to boardroom archive and sponsor decision path."
    : input.escalateToRetainerOversight
      ? "Escalate to retained oversight review."
      : input.requiredClientAction;

  const workflow = await persistCounselWorkflowAction({
    actorId: input.actorId,
    workflow: {
      ...existing,
      status: input.escalateToRetainerOversight
        ? "ESCALATED_TO_RETAINER_OVERSIGHT"
        : "COUNSEL_RESPONSE_RECORDED",
      triggerReason: input.triggerReason,
      counselResponseSummary: input.recommendation,
      evidenceNodeIds,
      operatorDisposition: input.reviewStatus === "ACCEPTED" ? "ACCEPTED" : input.reviewStatus === "REJECTED" ? "REJECTED" : "PENDING",
      nextAction,
      requiredActionIds: [randomUUID()],
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorType: input.actorId ? "ADMIN" : "SYSTEM",
      actorId: input.actorId ?? null,
      objectType: "OVERSIGHT_COUNSEL_REVIEW_SUBMISSION",
      objectId: workflow.id,
      actionType: "CREATED",
      summary: `Counsel review submitted for workflow ${workflow.id}.`,
      metadata: {
        reviewStatus: input.reviewStatus,
        recommendation: input.recommendation,
        contradictionAssessment: input.contradictionAssessment,
        riskIfIgnored: input.riskIfIgnored,
        agreesWithSystemRestriction: input.agreesWithSystemRestriction,
        requiredClientAction: input.requiredClientAction,
        outcomeFollowUpDate: input.outcomeFollowUpDate ?? null,
        escalateToRetainerOversight: Boolean(input.escalateToRetainerOversight),
        escalateToBoardroom: Boolean(input.escalateToBoardroom),
        evidenceNodeIds,
      } as never,
    },
  }).catch(() => null);

  return { workflow, evidenceNodeIds };
}
