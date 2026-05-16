/**
 * pages/api/strategy-room/confirm-action.ts
 *
 * POST /api/strategy-room/confirm-action
 *
 * Authenticated. Confirms or escalates a Strategy Room follow-up action.
 * The user selects an outcome (ACTION_TAKEN, ACTION_DEFERRED,
 * ACTION_BLOCKED, SITUATION_CHANGED, ESCALATION_NEEDED) and optionally
 * provides a note.
 *
 * Side effects:
 * - Updates the case follow-up status in routeDecisions JSON
 * - If outcome warrants a Return Brief, marks the case accordingly
 * - If escalation is needed, flags for counsel review
 *
 * Body: FollowUpConfirmationRequest
 * Response: FollowUpConfirmationResponse
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  deriveFollowUpStatus,
  nextStepForOutcome,
  shouldTriggerReturnBrief,
  shouldEscalate,
  type FollowUpConfirmationRequest,
  type FollowUpConfirmationResponse,
  type FollowUpOutcome,
} from "@/lib/product/strategy-room-followup-contract";

type ErrorResponse = { error: string };

const VALID_OUTCOMES: FollowUpOutcome[] = [
  "ACTION_TAKEN",
  "ACTION_DEFERRED",
  "ACTION_BLOCKED",
  "SITUATION_CHANGED",
  "ESCALATION_NEEDED",
];

function isValidOutcome(v: unknown): v is FollowUpOutcome {
  return typeof v === "string" && (VALID_OUTCOMES as string[]).includes(v);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FollowUpConfirmationResponse | ErrorResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const identity = await resolveIdentity(req);
  if (!identity?.email) {
    return res.status(401).json({ error: "Authentication required" });
  }

  let body: Partial<FollowUpConfirmationRequest>;
  try {
    body = typeof req.body === "string"
      ? (JSON.parse(req.body) as typeof body)
      : (req.body as typeof body);
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { followUpId, caseId, outcome, note } = body;

  if (!followUpId || !caseId) {
    return res.status(400).json({ error: "followUpId and caseId are required" });
  }

  if (!isValidOutcome(outcome)) {
    return res.status(400).json({
      error: `outcome must be one of: ${VALID_OUTCOMES.join(", ")}`,
    });
  }

  try {
    // Verify the case belongs to the authenticated user
    const journey = await prisma.diagnosticJourney.findFirst({
      where: { journeyKey: caseId, email: identity.email },
      select: { id: true, routeDecisions: true },
    });

    if (!journey) {
      return res.status(404).json({ error: "Case not found or access denied" });
    }

    const confirmedAt = new Date().toISOString();
    const status = deriveFollowUpStatus(outcome, false);
    const returnBriefTriggered = shouldTriggerReturnBrief(outcome);
    const escalated = shouldEscalate(outcome);

    // Merge follow-up confirmation into routeDecisions JSON
    const existing =
      journey.routeDecisions !== null &&
      typeof journey.routeDecisions === "object" &&
      !Array.isArray(journey.routeDecisions)
        ? (journey.routeDecisions as Record<string, unknown>)
        : {};

    const existingFollowUps: Record<string, unknown>[] = Array.isArray(existing.followUps)
      ? (existing.followUps as Record<string, unknown>[])
      : [];

    const newFollowUp: Record<string, unknown> = {
      followUpId,
      outcome,
      status,
      confirmedAt,
      note: note ?? null,
      returnBriefTriggered,
      escalated,
    };

    const updatedFollowUps = [...existingFollowUps, newFollowUp];

    const updatedRouteDecisions: Prisma.InputJsonValue = {
      ...(existing as Prisma.InputJsonObject),
      followUps: updatedFollowUps as Prisma.InputJsonValue,
      lastFollowUpAt: confirmedAt,
      counselFlagged: escalated ? true : Boolean(existing.counselFlagged),
      returnBriefPending: returnBriefTriggered
        ? true
        : Boolean(existing.returnBriefPending),
    };

    await prisma.diagnosticJourney.update({
      where: { id: journey.id },
      data: { routeDecisions: updatedRouteDecisions },
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      followUpId,
      status,
      nextStep: nextStepForOutcome(outcome),
      returnBriefTriggered,
      escalated,
    });
  } catch (err) {
    console.error("[strategy-room/confirm-action]", err);
    return res.status(500).json({ error: "Failed to record confirmation" });
  }
}

export const config = {
  api: { bodyParser: true },
};
