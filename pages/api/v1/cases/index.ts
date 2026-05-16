/**
 * pages/api/v1/cases/index.ts
 *
 * POST /api/v1/cases
 *
 * Enterprise API — create a governed case intake record.
 *
 * Authentication: x-api-key header (hashed against ApiKey table).
 * Rate limit: 60 requests/minute per key (enforced at infrastructure layer).
 *
 * This endpoint accepts structured case evidence from an external system and
 * creates a DiagnosticJourney intake record in the governed case registry.
 * The caller receives a caseId (journeyKey) that can be used to query the
 * case summary and provenance chain via subsequent API calls.
 *
 * What this does NOT do:
 * - Run AI analysis or produce governed findings (human-initiated only)
 * - Grant any entitlements
 * - Send emails or notifications
 *
 * Body: V1CaseIntakeRequest
 * Response: V1CaseIntakeResponse
 */

import { createId } from "@paralleldrive/cuid2";
import type { NextApiRequest, NextApiResponse } from "next";
import { resolveV1ApiKey, v1CallerLabel } from "@/lib/api/v1-auth";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

type V1CaseIntakeRequest = {
  /** Short label for the case (displayed in Decision Centre) */
  title: string;
  /** Plain-language description of the decision or issue */
  decisionText: string;
  /** Optional: known constraints on the decision */
  constraintText?: string;
  /** Optional: commercial or operational cost of inaction */
  costOfDelayText?: string;
  /** Optional: key stakeholders involved */
  stakeholderText?: string;
  /** Optional: caller's reference ID for this case */
  externalRef?: string;
  /** Optional: email of the subject (user) for this case */
  subjectEmail?: string;
  /** Optional: organisation name */
  organisation?: string;
};

type V1CaseIntakeResponse = {
  ok: true;
  caseId: string;
  message: string;
  summaryUrl: string;
  provenanceUrl: string;
};

type ErrorResponse = { error: string; code?: string };

// ─── Validators ───────────────────────────────────────────────────────────────

function isValidRequest(body: unknown): body is V1CaseIntakeRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return typeof b.title === "string" && b.title.trim().length > 0
    && typeof b.decisionText === "string" && b.decisionText.trim().length > 0;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<V1CaseIntakeResponse | ErrorResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authenticate
  const auth = await resolveV1ApiKey(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  // Parse body
  let body: unknown;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON body", code: "INVALID_BODY" });
  }

  if (!isValidRequest(body)) {
    return res.status(400).json({
      error: "Request body must include title (string) and decisionText (string)",
      code: "VALIDATION_ERROR",
    });
  }

  const {
    title,
    decisionText,
    constraintText,
    costOfDelayText,
    stakeholderText,
    externalRef,
    subjectEmail,
    organisation,
  } = body;

  if (title.length > 200) {
    return res.status(400).json({ error: "title must be 200 characters or fewer", code: "VALIDATION_ERROR" });
  }
  if (decisionText.length > 4000) {
    return res.status(400).json({ error: "decisionText must be 4000 characters or fewer", code: "VALIDATION_ERROR" });
  }

  try {
    const journeyKey = createId();
    const caller = v1CallerLabel(auth);

    // Create the governed case intake record
    const journey = await prisma.diagnosticJourney.create({
      data: {
        journeyKey,
        subjectKey: subjectEmail ?? `api:${auth.memberId}`,
        email: subjectEmail ?? null,
        organisation: organisation ?? null,
        diagnosticType: "api_intake",
        status: "active",
        routeDecisions: {
          intakeSource: "enterprise_api_v1",
          intakeCaller: caller,
          externalRef: externalRef ?? null,
          intakeTitle: title,
        },
      },
    });

    // Create the primary decision object
    await prisma.diagnosticDecisionObject.create({
      data: {
        journeyId: journey.id,
        sourceStage: "api_intake_v1",
        decisionText: decisionText.trim(),
        constraintText: constraintText?.trim() ?? null,
        costOfDelayText: costOfDelayText?.trim() ?? null,
        stakeholderText: stakeholderText?.trim() ?? null,
        email: subjectEmail ?? null,
        confidence: 0.5, // Default — no AI analysis at intake
        aiExposureLevel: "MODERATE",
      },
    });

    const summaryUrl = `/api/v1/cases/${journeyKey}/summary`;
    const provenanceUrl = `/api/v1/cases/${journeyKey}/provenance`;

    res.setHeader("Cache-Control", "no-store");
    return res.status(201).json({
      ok: true,
      caseId: journeyKey,
      message: "Governed case intake record created. The case is now registered in the governed case registry. No analysis has been run — a governed finding requires human-initiated assessment.",
      summaryUrl,
      provenanceUrl,
    });
  } catch (err) {
    console.error("[v1/cases POST]", err);
    return res.status(500).json({ error: "Failed to create case intake record", code: "INTERNAL_ERROR" });
  }
}

export const config = {
  api: { bodyParser: true },
};
