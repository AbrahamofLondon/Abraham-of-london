import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { composeOversightReviewCycle } from "@/lib/product/oversight-review-cycle-composer";
import { evaluateOrganisationAccess } from "@/lib/product/organisation-access";
import type { OversightReviewDecision } from "@/lib/product/oversight-review-cycle-contract";

function isReviewDecision(value: string | undefined): value is OversightReviewDecision {
  return value === "APPROVE"
    || value === "REVISE"
    || value === "WITHHOLD"
    || value === "ESCALATE_TO_COUNSEL"
    || value === "ESCALATE_TO_BOARDROOM";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "internal-oversight-review-cycle-preview",
  });
  if (!session) return;

  const userId = typeof session.user?.id === "string" ? session.user.id : undefined;
  const sessionEmail = typeof session.user?.email === "string" ? session.user.email.toLowerCase() : undefined;
  const email = typeof req.query.email === "string" ? req.query.email.toLowerCase() : sessionEmail;
  const organisationId = typeof req.query.organisationId === "string" ? req.query.organisationId : undefined;
  const periodStart = typeof req.query.periodStart === "string" ? req.query.periodStart : undefined;
  const periodEnd = typeof req.query.periodEnd === "string" ? req.query.periodEnd : undefined;
  const persist = req.query.persist === "true";
  const rawDecision = typeof req.query.decision === "string" ? req.query.decision : undefined;
  const operatorDecision = isReviewDecision(rawDecision) ? rawDecision : undefined;
  const operatorReason = typeof req.query.reason === "string" ? req.query.reason : undefined;
  const deliver = req.query.deliver === "true";
  const scheduleNextCycle = req.query.scheduleNext === "true";

  if (organisationId) {
    const access = await evaluateOrganisationAccess({
      userId,
      email: sessionEmail,
      organisationId,
      requestedScope: "CONTROL_ROOM_VIEW",
    });

    if (!access.allowed) {
      return res.status(403).json({
        ok: false,
        error: "ORGANISATION_ACCESS_DENIED",
        reason: access.reason,
      });
    }
  }

  const composed = await composeOversightReviewCycle({
    userId,
    email,
    organisationId,
    periodStart,
    periodEnd,
    persist,
    operatorDecision,
    operatorReason,
    deliver,
    scheduleNextCycle,
  });

  return res.status(200).json({
    ok: true,
    internalBrief: composed.internalBrief ?? null,
    clientSafeBrief: composed.clientSafeBrief ?? null,
    efficacy: composed.efficacy ?? null,
    cycle: composed.cycle,
    suppressions: composed.cycle.suppressions,
    ledgerEvents: composed.ledgerEvents,
    cycleComparison: composed.cycleComparison,
    nextRequiredOperatorDecision: composed.nextRequiredOperatorDecision,
    warnings: composed.warnings,
  });
}
