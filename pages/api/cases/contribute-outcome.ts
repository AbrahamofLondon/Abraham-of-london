/**
 * pages/api/cases/contribute-outcome.ts
 *
 * POST /api/cases/contribute-outcome
 *
 * Authenticated. Opt-in anonymised outcome contribution.
 *
 * The user reports what happened after acting on the governed
 * recommendation. Their contribution is anonymised before storage:
 * no caseId, journeyKey, email, or organisation is retained in the
 * aggregate pool. Only the outcome shape and assessment band.
 *
 * The case-level record (routeDecisions) is updated to mark that the
 * user has contributed an outcome for this case.
 *
 * Body: OutcomeContributionRequest
 * Response: OutcomeContributionResponse
 *
 * Retraction:
 * Users can retract their contribution within 30 days via
 * DELETE /api/cases/contribute-outcome (contributionId required).
 */

import { createId } from "@paralleldrive/cuid2";
import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/server/apply-rate-limit";
import type {
  OutcomeContributionRequest,
  OutcomeContributionResponse,
  OutcomeContributionState,
  OutcomeContributionTimeToActBand,
  AnonymisedOutcomeContribution,
} from "@/lib/product/outcome-contribution-contract";

type ErrorResponse = { error: string };

// ─── Validators ───────────────────────────────────────────────────────────────

const VALID_STATES: OutcomeContributionState[] = [
  "IMPROVED", "RESOLVED", "UNCHANGED", "WORSENED", "ABANDONED",
];
const VALID_TIME_BANDS: OutcomeContributionTimeToActBand[] = [
  "IMMEDIATE", "SHORT", "MEDIUM", "LONG", "DID_NOT_ACT",
];

function isValidState(v: unknown): v is OutcomeContributionState {
  return typeof v === "string" && (VALID_STATES as string[]).includes(v);
}

function isValidTimeBand(v: unknown): v is OutcomeContributionTimeToActBand {
  return typeof v === "string" && (VALID_TIME_BANDS as string[]).includes(v);
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res: NextApiResponse<any>,
) {
  if (req.method === "DELETE") {
    return handleRetract(req, res as NextApiResponse<{ ok: true; message: string } | ErrorResponse>);
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const identity = await resolveIdentity(req);
  if (!identity?.email) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const ok = await applyRateLimit(req, res, {
    scope: "OUTCOME_CONTRIBUTION",
    identifier: identity.email,
    limit: 20,
    windowSeconds: 3600,
  });
  if (!ok) return;

  let body: Partial<OutcomeContributionRequest>;
  try {
    body = typeof req.body === "string"
      ? (JSON.parse(req.body) as typeof body)
      : (req.body as typeof body);
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { caseId, outcomeState, timeToAct, findingAccurate, recommendationUseful } = body;

  if (!caseId || typeof caseId !== "string") {
    return res.status(400).json({ error: "caseId is required" });
  }
  if (!isValidState(outcomeState)) {
    return res.status(400).json({ error: `outcomeState must be one of: ${VALID_STATES.join(", ")}` });
  }
  if (!isValidTimeBand(timeToAct)) {
    return res.status(400).json({ error: `timeToAct must be one of: ${VALID_TIME_BANDS.join(", ")}` });
  }

  try {
    // Verify case belongs to user — fetch assessment band and kind for context
    const journey = await prisma.diagnosticJourney.findFirst({
      where: { journeyKey: caseId, email: identity.email },
      select: {
        id: true,
        journeyKey: true,
        diagnosticType: true,
        routeDecisions: true,
        // Get the highest-scoring stage for the band context
        stages: {
          select: { stage: true, payload: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!journey) {
      return res.status(404).json({ error: "Case not found or access denied" });
    }

    // Prevent duplicate contributions (one per case)
    const existing =
      journey.routeDecisions !== null &&
      typeof journey.routeDecisions === "object" &&
      !Array.isArray(journey.routeDecisions)
        ? (journey.routeDecisions as Record<string, unknown>)
        : {};

    if (existing.outcomeContributed === true) {
      return res.status(409).json({
        error: "An outcome contribution has already been recorded for this case. To update it, retract the existing contribution first.",
      });
    }

    // Generate contribution ID
    const contributionId = createId();
    const contributedAt = new Date().toISOString();

    // Extract assessment band from latest stage payload (best-effort)
    let assessmentBand: string | null = null;
    const latestStage = journey.stages[0];
    if (latestStage?.payload && typeof latestStage.payload === "object" && !Array.isArray(latestStage.payload)) {
      const payload = latestStage.payload as Record<string, unknown>;
      if (typeof payload.band === "string") assessmentBand = payload.band;
      if (typeof payload.severity === "string") assessmentBand = assessmentBand ?? payload.severity;
    }

    // Build anonymised contribution — no caseId, email, or org
    const anonymised: AnonymisedOutcomeContribution = {
      contributionId,
      assessmentBand,
      assessmentKind: journey.diagnosticType,
      outcomeState,
      timeToAct,
      findingAccurate: findingAccurate ?? null,
      recommendationUseful: recommendationUseful ?? null,
      contributedAt,
      retracted: false,
    };

    // Store anonymised data in AuditEvent — no PII
    await prisma.auditEvent.create({
      data: {
        actorType: "USER",
        actorId: null, // anonymised — no user identifier
        objectType: "OUTCOME_CONTRIBUTION",
        objectId: contributionId,
        actionType: "CONTRIBUTED",
        summary: "Anonymised outcome contribution — opt-in",
        metadata: anonymised as unknown as Prisma.InputJsonValue,
      },
    });

    // Mark the case as having contributed an outcome (for deduplication)
    // Store contributionId so user can retract later
    await prisma.diagnosticJourney.update({
      where: { id: journey.id },
      data: {
        routeDecisions: {
          ...existing,
          outcomeContributed: true,
          outcomeContributionId: contributionId,
          outcomeContributedAt: contributedAt,
        },
      },
    });

    const retractBefore = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      contributionId,
      message:
        "Thank you. Your outcome has been recorded anonymously and will contribute to the benchmark pool once sufficient contributions are available.",
      canRetract: true,
      retractBefore,
    });
  } catch (err) {
    console.error("[contribute-outcome POST]", err);
    return res.status(500).json({ error: "Failed to record outcome contribution" });
  }
}

// ─── DELETE: retract contribution ─────────────────────────────────────────────

async function handleRetract(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: true; message: string } | ErrorResponse>,
) {
  const identity = await resolveIdentity(req);
  if (!identity?.email) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { contributionId } = req.query;
  if (typeof contributionId !== "string" || !contributionId) {
    return res.status(400).json({ error: "contributionId query parameter is required" });
  }

  try {
    // Verify the contribution belongs to the authenticated user via the journey
    const journey = await prisma.diagnosticJourney.findFirst({
      where: {
        email: identity.email,
        routeDecisions: {
          path: ["outcomeContributionId"],
          equals: contributionId,
        },
      },
      select: { id: true, routeDecisions: true },
    });

    if (!journey) {
      return res.status(404).json({
        error: "Contribution not found or access denied",
      });
    }

    // Mark the AuditEvent contribution as retracted
    // We use findFirst + update (not updateMany) so we can spread existing metadata
    const existingEvent = await prisma.auditEvent.findFirst({
      where: {
        objectType: "OUTCOME_CONTRIBUTION",
        objectId: contributionId,
        actionType: "CONTRIBUTED",
      },
      select: { id: true, metadata: true },
    });

    if (existingEvent) {
      const existingMeta =
        existingEvent.metadata !== null &&
        typeof existingEvent.metadata === "object" &&
        !Array.isArray(existingEvent.metadata)
          ? (existingEvent.metadata as Record<string, unknown>)
          : {};

      await prisma.auditEvent.update({
        where: { id: existingEvent.id },
        data: {
          metadata: {
            ...existingMeta,
            retracted: true,
            retractedAt: new Date().toISOString(),
          },
        },
      });
    }

    // Update the journey record to reflect retraction
    const existing =
      journey.routeDecisions !== null &&
      typeof journey.routeDecisions === "object" &&
      !Array.isArray(journey.routeDecisions)
        ? (journey.routeDecisions as Record<string, unknown>)
        : {};

    await prisma.diagnosticJourney.update({
      where: { id: journey.id },
      data: {
        routeDecisions: {
          ...existing,
          outcomeContributed: false,
          outcomeContributionRetracted: true,
          outcomeContributionRetractedAt: new Date().toISOString(),
        },
      },
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      message:
        "Your outcome contribution has been retracted. Your data has been marked as retracted in the aggregate pool and will no longer be included in benchmark calculations.",
    });
  } catch (err) {
    console.error("[contribute-outcome DELETE]", err);
    return res.status(500).json({ error: "Failed to retract contribution" });
  }
}

export const config = {
  api: { bodyParser: true },
};
