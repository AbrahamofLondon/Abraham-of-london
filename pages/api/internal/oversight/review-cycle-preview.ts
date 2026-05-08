import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { prisma } from "@/lib/prisma.server";
import { evaluateOrganisationAccess } from "@/lib/product/organisation-access";
import type { OversightReviewDecision } from "@/lib/product/oversight-review-decision-contract";
import { composeOversightReviewCycle } from "@/lib/product/oversight-review-cycle-composer";

type RequestPayload = {
  accountId?: string;
  email?: string;
  organisationId?: string;
  periodStart?: string;
  periodEnd?: string;
  persist?: boolean;
  operatorDecision?: OversightReviewDecision;
  operatorNote?: string;
  firstCycleException?: boolean;
};

const REVIEW_DECISIONS: OversightReviewDecision[] = [
  "APPROVE_FOR_CLIENT",
  "REVISE_BEFORE_DELIVERY",
  "WITHHOLD_FROM_CLIENT",
  "ESCALATE_TO_COUNSEL",
  "ESCALATE_TO_BOARDROOM",
  "WAIT_FOR_MORE_EVIDENCE",
];

function isReviewDecision(value: string | undefined): value is OversightReviewDecision {
  return Boolean(value && REVIEW_DECISIONS.includes(value as OversightReviewDecision));
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === "1";
}

async function resolveOrganisationId(accountId: string | undefined): Promise<string | undefined> {
  if (!accountId) return undefined;
  const contract = await prisma.retainerContract.findUnique({
    where: { id: accountId },
    select: { organisationId: true },
  });
  return contract?.organisationId ?? undefined;
}

function parsePayload(req: NextApiRequest): RequestPayload {
  if (req.method === "POST" && req.body && typeof req.body === "object") {
    const body = req.body as Record<string, unknown>;
    return {
      accountId: typeof body.accountId === "string" ? body.accountId : undefined,
      email: typeof body.email === "string" ? body.email.toLowerCase() : undefined,
      organisationId: typeof body.organisationId === "string" ? body.organisationId : undefined,
      periodStart: typeof body.periodStart === "string" ? body.periodStart : undefined,
      periodEnd: typeof body.periodEnd === "string" ? body.periodEnd : undefined,
      persist: parseBoolean(body.persist),
      operatorDecision: isReviewDecision(typeof body.operatorDecision === "string" ? body.operatorDecision : undefined)
        ? body.operatorDecision as OversightReviewDecision
        : undefined,
      operatorNote: typeof body.operatorNote === "string" ? body.operatorNote : undefined,
      firstCycleException: parseBoolean(body.firstCycleException),
    };
  }

  return {
    accountId: typeof req.query.accountId === "string" ? req.query.accountId : undefined,
    email: typeof req.query.email === "string" ? req.query.email.toLowerCase() : undefined,
    organisationId: typeof req.query.organisationId === "string" ? req.query.organisationId : undefined,
    periodStart: typeof req.query.periodStart === "string" ? req.query.periodStart : undefined,
    periodEnd: typeof req.query.periodEnd === "string" ? req.query.periodEnd : undefined,
    persist: parseBoolean(req.query.persist),
    operatorDecision: isReviewDecision(typeof req.query.operatorDecision === "string" ? req.query.operatorDecision : undefined)
      ? req.query.operatorDecision as OversightReviewDecision
      : undefined,
    operatorNote: typeof req.query.operatorNote === "string" ? req.query.operatorNote : undefined,
    firstCycleException: parseBoolean(req.query.firstCycleException),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "internal-oversight-review-cycle-preview",
  });
  if (!session) return;

  const payload = parsePayload(req);
  const userId = typeof session.user?.id === "string" ? session.user.id : undefined;
  const sessionEmail = typeof session.user?.email === "string" ? session.user.email.toLowerCase() : undefined;
  const resolvedOrganisationId = payload.organisationId ?? await resolveOrganisationId(payload.accountId);

  if (!payload.email && !resolvedOrganisationId && !userId) {
    return res.status(400).json({
      ok: false,
      error: "MISSING_SCOPE",
      reason: "Provide email, organisationId, or a resolvable accountId.",
    });
  }

  if (resolvedOrganisationId) {
    const access = await evaluateOrganisationAccess({
      userId,
      email: sessionEmail,
      organisationId: resolvedOrganisationId,
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
    email: payload.email ?? sessionEmail,
    organisationId: resolvedOrganisationId,
    accountId: payload.accountId,
    periodStart: payload.periodStart,
    periodEnd: payload.periodEnd,
    persist: payload.persist,
    operatorDecision: payload.operatorDecision,
    operatorNote: payload.operatorNote,
    firstCycleException: payload.firstCycleException,
  });

  return res.status(200).json({
    ok: true,
    internalBrief: composed.internalBrief ?? null,
    clientSafeBrief: composed.clientSafeBrief ?? null,
    audienceOutputs: Object.fromEntries(
      Object.entries(composed.audienceOutputs).map(([audience, safe]) => [
        audience,
        safe
          ? {
              brief: safe.brief,
              suppressions: safe.suppressions,
              warnings: safe.warnings,
            }
          : null,
      ])
    ),
    efficacy: composed.efficacy ?? null,
    cycle: composed.cycle,
    suppressions: composed.cycle.suppressions,
    ledgerEvents: composed.ledgerEvents,
    cycleComparison: composed.cycleComparison,
    recommendedDecision: composed.recommendedDecision,
    nextRequiredOperatorDecision: composed.nextRequiredOperatorDecision,
    operatorDecisionRecord: composed.operatorDecisionRecord ?? null,
    deliveryIntent: composed.deliveryIntent,
    nextCycleIntent: composed.nextCycleIntent ?? null,
    archivedCycle: composed.archivedCycle ?? null,
    counselWorkflows: composed.counselWorkflows,
    warnings: composed.warnings,
  });
}
