import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { composeOversightBrief } from "@/lib/product/oversight-brief-composer";
import { evaluateOrganisationAccess } from "@/lib/product/organisation-access";
import { scoreOversightBriefEfficacy } from "@/lib/product/oversight-brief-efficacy-scorer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "internal-oversight-brief-preview",
  });
  if (!session) return;

  const userId = typeof session.user?.id === "string" ? session.user.id : undefined;
  const sessionEmail = typeof session.user?.email === "string" ? session.user.email.toLowerCase() : undefined;

  const email = typeof req.query.email === "string" ? req.query.email.toLowerCase() : undefined;
  const organisationId = typeof req.query.organisationId === "string" ? req.query.organisationId : undefined;
  const periodStart = typeof req.query.periodStart === "string" ? req.query.periodStart : undefined;
  const periodEnd = typeof req.query.periodEnd === "string" ? req.query.periodEnd : undefined;

  if (!email && !organisationId && !userId) {
    return res.status(400).json({
      ok: false,
      error: "MISSING_SCOPE",
      reason: "Provide email or organisationId to preview an oversight brief.",
    });
  }

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

  const composed = await composeOversightBrief({
    userId,
    email: email ?? sessionEmail,
    organisationId,
    periodStart,
    periodEnd,
  });

  // ── Efficacy scoring ──
  const efficacy = composed.brief
    ? scoreOversightBriefEfficacy({
        brief: composed.brief,
        warnings: composed.warnings,
      })
    : null;

  return res.status(200).json({
    ok: true,
    brief: composed.brief ?? null,
    warnings: composed.warnings,
    efficacy,
  });
}
