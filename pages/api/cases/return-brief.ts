/**
 * pages/api/cases/return-brief.ts
 *
 * POST /api/cases/return-brief
 *   Body: { caseId: string }
 *   Authenticated. User must own the case.
 *   Generates a client-safe Return Brief from the governed case record.
 *   Stores the brief in the journey record and returns the brief + URL.
 *
 * GET /api/cases/return-brief?caseId=xxx
 *   Retrieves a previously generated Return Brief for the given case.
 *   Returns INSUFFICIENT_EVIDENCE if none exists.
 *
 * Safe fields only. No evidence text, actor IDs, suppression details,
 * operator notes, or internal trigger mechanics are returned.
 * Boundary note is always included in the response.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma";
import { composeReturnBriefV1 } from "@/lib/product/return-brief-composer";
import type { ReturnBriefV1, ReturnBriefComposerSource } from "@/lib/product/return-brief-contract";
import { applyRateLimit } from "@/lib/server/apply-rate-limit";

// ─── Response types ───────────────────────────────────────────────────────────

export type ReturnBriefApiResponse = {
  ok: true;
  caseId: string;
  href: string;
  generatedAt: string;
  brief: ReturnBriefV1;
};

type ErrorResponse = { error: string; code?: string };

// ─── Eligibility ──────────────────────────────────────────────────────────────

/**
 * Minimum evidence required to generate a meaningful return brief.
 * At least one decision object must exist on the case.
 */
function checkEligibility(
  decisionObjects: Array<{
    decisionText: string;
    constraintText: string | null;
  }>,
): boolean {
  return decisionObjects.length > 0;
}

/**
 * Map case evidence to the ReturnBriefComposerSource shape.
 * We derive what we can from the governed record — we do not fabricate.
 */
function buildComposerSource(
  journeyKey: string,
  decisionObjects: Array<{
    decisionText: string;
    constraintText: string | null;
    costOfDelayText: string | null;
    confidence: number;
    createdAt: Date;
    updatedAt: Date;
  }>,
  daysElapsed: number,
): ReturnBriefComposerSource {
  const primaryDecision = decisionObjects[0];

  return {
    sessionKey: journeyKey,
    trigger: "no_activity_after_commitment",
    trajectory: {
      state: "STAGNANT",
      reason:
        "The case has not received a governed move within the expected review window.",
    },
    contradiction:
      primaryDecision?.constraintText
        ? {
            decision: primaryDecision.decisionText,
            constraint: primaryDecision.constraintText,
            status: "UNRESOLVED",
          }
        : null,
    costOfInaction: {
      daysElapsed,
    },
    challenge:
      primaryDecision
        ? `The governed record shows an unresolved decision: "${primaryDecision.decisionText}". The next required move is to confirm, close, or formally escalate this decision.`
        : null,
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReturnBriefApiResponse | ErrorResponse>,
) {
  // Authentication required
  const identity = await resolveIdentity(req);
  if (!identity?.email) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.method === "GET") {
    return handleGet(req, res, identity.email);
  }

  if (req.method === "POST") {
    // Professional entitlement check
    const { checkActionEntitlement } = await import("@/lib/product/action-entitlement");
    const entitlement = await checkActionEntitlement(identity.email, "return_brief_generation");
    if (!entitlement.allowed) {
      return res.status(403).json({ error: entitlement.message, code: "PROFESSIONAL_REQUIRED" });
    }

    const ok = await applyRateLimit(req, res, {
      scope: "RETURN_BRIEF_GENERATION",
      identifier: identity.email,
      limit: 5,
      windowSeconds: 3600,
    });
    if (!ok) return;
    return handlePost(req, res, identity.email);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}

// ─── GET: retrieve stored brief ───────────────────────────────────────────────

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ReturnBriefApiResponse | ErrorResponse>,
  email: string,
) {
  const { caseId } = req.query;
  if (typeof caseId !== "string" || !caseId) {
    return res.status(400).json({ error: "caseId query parameter is required" });
  }

  try {
    const journey = await prisma.diagnosticJourney.findFirst({
      where: { journeyKey: caseId, email },
      select: { journeyKey: true, routeDecisions: true },
    });

    if (!journey) {
      return res.status(404).json({ error: "Case not found or access denied" });
    }

    const stored = extractStoredBrief(journey.routeDecisions);
    if (!stored) {
      const brief = composeReturnBriefV1(null, caseId);
      return res.status(200).json({
        ok: true,
        caseId,
        href: `/return-brief/${caseId}`,
        generatedAt: new Date().toISOString(),
        brief,
      });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(stored);
  } catch (err) {
    console.error("[return-brief GET]", err);
    return res.status(500).json({ error: "Failed to retrieve return brief" });
  }
}

// ─── POST: generate and store brief ──────────────────────────────────────────

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<ReturnBriefApiResponse | ErrorResponse>,
  email: string,
) {
  let body: { caseId?: unknown };
  try {
    body = typeof req.body === "string" ? (JSON.parse(req.body) as typeof body) : (req.body as typeof body);
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { caseId } = body;
  if (typeof caseId !== "string" || !caseId.trim()) {
    return res.status(400).json({ error: "caseId is required" });
  }

  try {
    // Verify ownership
    const journey = await prisma.diagnosticJourney.findFirst({
      where: { journeyKey: caseId, email },
      select: {
        id: true,
        journeyKey: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        routeDecisions: true,
        decisionObjects: {
          select: {
            decisionText: true,
            constraintText: true,
            costOfDelayText: true,
            confidence: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "asc" },
          take: 5,
        },
      },
    });

    if (!journey) {
      return res.status(404).json({ error: "Case not found or access denied" });
    }

    // Eligibility check
    if (!checkEligibility(journey.decisionObjects)) {
      const brief = composeReturnBriefV1(null, caseId);
      // Return INSUFFICIENT_EVIDENCE — do not store
      const response: ReturnBriefApiResponse = {
        ok: true,
        caseId,
        href: `/return-brief/${caseId}`,
        generatedAt: new Date().toISOString(),
        brief,
      };
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(response);
    }

    // Compute days elapsed since case was created
    const daysElapsed = Math.floor(
      (Date.now() - journey.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Build composer source from case evidence
    const source = buildComposerSource(caseId, journey.decisionObjects, daysElapsed);
    const brief = composeReturnBriefV1(source, caseId);
    const generatedAt = new Date().toISOString();
    const href = `/return-brief/${caseId}`;

    const payload: ReturnBriefApiResponse = {
      ok: true,
      caseId,
      href,
      generatedAt,
      brief,
    };

    // Store the generated brief in routeDecisions JSON
    const existingRouteDecisions =
      journey.routeDecisions !== null &&
      typeof journey.routeDecisions === "object" &&
      !Array.isArray(journey.routeDecisions)
        ? (journey.routeDecisions as Record<string, unknown>)
        : {};

    await prisma.diagnosticJourney.update({
      where: { id: journey.id },
      data: {
        routeDecisions: {
          ...existingRouteDecisions,
          returnBrief: {
            generatedAt,
            brief,
            href,
          },
        },
      },
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(payload);
  } catch (err) {
    console.error("[return-brief POST]", err);
    return res.status(500).json({ error: "Failed to generate return brief" });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractStoredBrief(
  routeDecisions: unknown,
): ReturnBriefApiResponse | null {
  if (
    routeDecisions === null ||
    typeof routeDecisions !== "object" ||
    Array.isArray(routeDecisions)
  ) {
    return null;
  }

  const stored = (routeDecisions as Record<string, unknown>).returnBrief;
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return null;
  }

  const s = stored as Record<string, unknown>;
  if (!s.generatedAt || !s.brief || !s.href) return null;

  return {
    ok: true,
    caseId: "",
    href: String(s.href),
    generatedAt: String(s.generatedAt),
    brief: s.brief as ReturnBriefV1,
  };
}

export const config = {
  api: { bodyParser: true },
};
