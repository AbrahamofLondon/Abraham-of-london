import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { prisma } from "@/lib/prisma.server";
import { loadOversightCycleArchive, updateOversightCycleArchiveDeliveryState } from "@/lib/product/oversight-cycle-archive";
import type { OversightDeliveryAction, OversightDeliveryIntent } from "@/lib/product/oversight-delivery-contract";

type RequestBody = {
  cycleId?: string;
  action?: OversightDeliveryAction;
  operatorNote?: string;
};

const ACTIONS: OversightDeliveryAction[] = [
  "APPROVE_CLIENT_SAFE_BRIEF",
  "WITHHOLD_BRIEF",
  "REQUEST_REVISION",
  "MARK_CLIENT_VIEW_READY",
  "MARK_DELIVERED",
  "RECORD_DELIVERY_FAILURE",
];

function isAction(value: string | undefined): value is OversightDeliveryAction {
  return Boolean(value && ACTIONS.includes(value as OversightDeliveryAction));
}

function buildDeliveryIntentFromAction(input: {
  current: string;
  action: OversightDeliveryAction;
  cycleId: string;
}): OversightDeliveryIntent {
  switch (input.action) {
    case "APPROVE_CLIENT_SAFE_BRIEF":
      return {
        state: "APPROVED_FOR_DELIVERY",
        deliveryAllowed: true,
        deliveryMethod: "CLIENT_PORTAL",
        reason: "Operator approved the client-safe brief for delivery preparation.",
        nextStep: "Mark client view ready once the stable governed brief URL is confirmed.",
        scheduledFor: null,
      };
    case "WITHHOLD_BRIEF":
      return {
        state: "WITHHELD",
        deliveryAllowed: false,
        deliveryMethod: "INTERNAL_PREVIEW",
        reason: "Operator withheld the brief from client delivery.",
        nextStep: "Revise the brief or gather more evidence before attempting delivery again.",
        scheduledFor: null,
      };
    case "REQUEST_REVISION":
      return {
        state: "OPERATOR_REVIEW_REQUIRED",
        deliveryAllowed: false,
        deliveryMethod: "INTERNAL_PREVIEW",
        reason: "Operator requested revision before the brief can move into delivery.",
        nextStep: "Regenerate or revise the brief and repeat review.",
        scheduledFor: null,
      };
    case "MARK_CLIENT_VIEW_READY":
      return {
        state: "CLIENT_VIEW_READY",
        deliveryAllowed: true,
        deliveryMethod: "CLIENT_PORTAL",
        reason: "Client-safe brief now has a stable governed view path.",
        nextStep: `Client-safe brief is ready at /oversight/brief/${input.cycleId}.`,
        scheduledFor: null,
      };
    case "MARK_DELIVERED":
      return {
        state: "DELIVERED",
        deliveryAllowed: true,
        deliveryMethod: "CLIENT_PORTAL",
        reason: "Delivery has been recorded against the governed client brief surface.",
        nextStep: "Preserve this cycle in the archive and monitor the next review window.",
        scheduledFor: null,
      };
    case "RECORD_DELIVERY_FAILURE":
      return {
        state: "DELIVERY_FAILED",
        deliveryAllowed: false,
        deliveryMethod: "CLIENT_PORTAL",
        reason: "Delivery attempt failed and requires operator intervention.",
        nextStep: "Correct the access or review problem before retrying.",
        scheduledFor: null,
      };
  }
}

function eventTypeForAction(action: OversightDeliveryAction) {
  switch (action) {
    case "APPROVE_CLIENT_SAFE_BRIEF":
      return "APPROVED_FOR_DELIVERY";
    case "WITHHOLD_BRIEF":
      return "WITHHELD";
    case "REQUEST_REVISION":
      return "REVISION_REQUESTED";
    case "MARK_CLIENT_VIEW_READY":
      return "CLIENT_VIEW_READY";
    case "MARK_DELIVERED":
      return "DELIVERED";
    case "RECORD_DELIVERY_FAILURE":
      return "DELIVERY_FAILED";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "internal-oversight-delivery-action",
  });
  if (!session) return;

  const body = (req.body ?? {}) as RequestBody;
  if (typeof body.cycleId !== "string" || !isAction(body.action)) {
    return res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
  }

  const archive = await loadOversightCycleArchive({ cycleId: body.cycleId });
  if (!archive) {
    return res.status(404).json({ ok: false, error: "CYCLE_ARCHIVE_NOT_FOUND" });
  }

  const warnings: string[] = [];
  const hasBlockingSuppression = archive.record.suppressions.some((item) =>
    item.reason === "CLIENT_VISIBILITY_RESTRICTED"
    || item.reason === "RAW_RESPONSE_PROTECTED"
    || item.reason === "LEGAL_OR_REPUTATION_RISK"
  );

  if (body.action === "APPROVE_CLIENT_SAFE_BRIEF") {
    if (!["STRONG", "FORMIDABLE"].includes(archive.record.efficacyGrade)) {
      return res.status(400).json({ ok: false, error: "EFFICACY_TOO_LOW" });
    }
    if (archive.record.reviewDecision !== "APPROVE_FOR_CLIENT") {
      return res.status(400).json({ ok: false, error: "REVIEW_DECISION_REQUIRED" });
    }
    if (hasBlockingSuppression) {
      return res.status(400).json({ ok: false, error: "SUPPRESSION_RISK_REMAINS" });
    }
  }

  if (body.action === "MARK_CLIENT_VIEW_READY" && archive.record.deliveryStatus !== "APPROVED_FOR_DELIVERY") {
    return res.status(400).json({ ok: false, error: "DELIVERY_NOT_APPROVED" });
  }

  if (body.action === "MARK_DELIVERED" && archive.record.deliveryStatus !== "CLIENT_VIEW_READY") {
    return res.status(400).json({ ok: false, error: "CLIENT_VIEW_NOT_READY" });
  }

  const deliveryIntent = buildDeliveryIntentFromAction({
    current: archive.record.deliveryStatus,
    action: body.action,
    cycleId: body.cycleId,
  });

  const now = new Date().toISOString();
  await updateOversightCycleArchiveDeliveryState({
    cycleId: body.cycleId,
    deliveryIntent,
    approvedAt: deliveryIntent.state === "APPROVED_FOR_DELIVERY" ? now : archive.record.approvedAt ?? null,
    deliveredAt: deliveryIntent.state === "DELIVERED" ? now : archive.record.deliveredAt ?? null,
  });

  await prisma.auditEvent.create({
    data: {
      actorType: "ADMIN",
      actorId: typeof session.user?.id === "string" ? session.user.id : null,
      objectType: "OVERSIGHT_CYCLE",
      objectId: archive.record.accountId,
      actionType: "UPDATED",
      summary: `Delivery action ${body.action} recorded for oversight cycle ${body.cycleId}.`,
      metadata: {
        cycleId: body.cycleId,
        eventType: eventTypeForAction(body.action),
        actor: {
          userId: typeof session.user?.id === "string" ? session.user.id : undefined,
          email: typeof session.user?.email === "string" ? session.user.email : undefined,
          role: "ADMIN",
        },
        reason: body.operatorNote ?? deliveryIntent.reason,
        warnings,
      } as never,
    },
  });

  const updated = await loadOversightCycleArchive({ cycleId: body.cycleId });
  return res.status(200).json({
    ok: true,
    archive: updated,
  });
}
