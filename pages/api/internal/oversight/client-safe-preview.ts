/**
 * pages/api/internal/oversight/client-safe-preview.ts
 *
 * Admin-only preview of the client-safe version of an oversight brief.
 * Returns only the approved/safe version with suppressions and delivery readiness.
 * Does not send email. Does not mark delivered. Preview only.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { composeOversightBrief } from "@/lib/product/oversight-brief-composer";
import { buildClientSafeOversightBrief } from "@/lib/product/client-safe-oversight-brief";
import { scoreOversightBriefEfficacy } from "@/lib/product/oversight-brief-efficacy-scorer";
import { evaluateOrganisationAccess } from "@/lib/product/organisation-access";

type DeliveryReadiness =
  | "WITHHELD"
  | "OPERATOR_REVIEW_REQUIRED"
  | "CLIENT_SAFE_PREVIEW_READY"
  | "APPROVED_FOR_DELIVERY"
  | "NOT_DELIVERABLE";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "internal-oversight-client-safe-preview",
  });
  if (!session) return;

  const sessionEmail = typeof session.user?.email === "string" ? session.user.email.toLowerCase() : undefined;
  const userId = typeof session.user?.id === "string" ? session.user.id : undefined;

  const email = typeof req.query.email === "string" ? req.query.email.toLowerCase() : undefined;
  const organisationId = typeof req.query.organisationId === "string" ? req.query.organisationId : undefined;

  if (!email && !organisationId) {
    return res.status(400).json({ ok: false, error: "Provide email or organisationId." });
  }

  // Organisation access check
  if (organisationId) {
    const access = await evaluateOrganisationAccess({
      userId,
      email: sessionEmail,
      organisationId,
      requestedScope: "CONTROL_ROOM_VIEW",
    });
    if (!access.allowed) {
      return res.status(403).json({ ok: false, error: "ORGANISATION_ACCESS_DENIED", reason: access.reason });
    }
  }

  // Compose internal brief
  const composed = await composeOversightBrief({
    userId,
    email: email ?? sessionEmail,
    organisationId,
  });

  if (!composed.brief) {
    return res.status(200).json({
      ok: true,
      clientSafeBrief: null,
      suppressions: [],
      efficacy: null,
      deliveryReadiness: "NOT_DELIVERABLE" as DeliveryReadiness,
      withheldReasons: ["No brief could be composed from available data."],
      warnings: composed.warnings,
    });
  }

  // Build client-safe version
  const clientSafe = buildClientSafeOversightBrief({
    brief: composed.brief,
    access: {
      allowed: true,
      role: "SPONSOR",
      scopes: ["CONTROL_ROOM_VIEW", "CAMPAIGN_VIEW_AGGREGATE"],
      reason: "Sponsor preview",
      privacyBoundary: {
        canViewRawResponses: false,
        canViewNamedRespondents: false,
        canViewAggregates: true,
        smallSampleSuppressionApplies: true,
      },
    },
  });

  // Score efficacy of client-safe brief
  const efficacy = scoreOversightBriefEfficacy({
    brief: clientSafe.brief,
    warnings: [...composed.warnings, ...clientSafe.warnings],
    suppressions: clientSafe.suppressions.map((s) => ({
      section: s.section,
      reason: String(s.reason),
      explanation: s.explanation,
    })),
  });

  // Derive delivery readiness
  let deliveryReadiness: DeliveryReadiness;
  const withheldReasons: string[] = [];

  if (efficacy.withholdReasons.length > 0) {
    deliveryReadiness = "WITHHELD";
    withheldReasons.push(...efficacy.withholdReasons);
  } else if (efficacy.grade === "WEAK") {
    deliveryReadiness = "OPERATOR_REVIEW_REQUIRED";
    withheldReasons.push("Brief grade is WEAK. Operator review required before delivery.");
  } else if (efficacy.grade === "ADEQUATE") {
    deliveryReadiness = "OPERATOR_REVIEW_REQUIRED";
  } else {
    deliveryReadiness = "CLIENT_SAFE_PREVIEW_READY";
  }

  return res.status(200).json({
    ok: true,
    clientSafeBrief: clientSafe.brief,
    suppressions: clientSafe.suppressions,
    efficacy,
    deliveryReadiness,
    withheldReasons,
    warnings: [...composed.warnings, ...clientSafe.warnings],
    nextOperatorDecision: deliveryReadiness === "WITHHELD"
      ? "WITHHOLD"
      : deliveryReadiness === "OPERATOR_REVIEW_REQUIRED"
        ? "REVISE"
        : efficacy.grade === "FORMIDABLE"
          ? "APPROVE"
          : "APPROVE",
  });
}
