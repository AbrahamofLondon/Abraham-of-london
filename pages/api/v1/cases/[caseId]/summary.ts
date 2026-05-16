/**
 * pages/api/v1/cases/[caseId]/summary.ts
 *
 * GET /api/v1/cases/:caseId/summary
 *
 * Enterprise API — retrieve a client-safe case summary.
 *
 * Authentication: x-api-key header.
 *
 * Returns structured, client-safe summary of the governed case record.
 * No PII beyond what was submitted by the caller at intake.
 * No AI-generated content is fabricated — only what is recorded in the case.
 *
 * Response: V1CaseSummaryResponse
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveV1ApiKey } from "@/lib/api/v1-auth";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

type V1EvidenceItem = {
  kind: string;
  label: string;
  summary: string;
  confidence: number;
  severity: string;
  recordedAt: string;
};

type V1DecisionObjectSummary = {
  decisionText: string;
  constraintText: string | null;
  costOfDelayText: string | null;
  stakeholderText: string | null;
  affectedDomain: string | null;
  confidence: number;
  recordedAt: string;
};

type V1CaseSummaryResponse = {
  ok: true;
  caseId: string;
  status: string;
  diagnosticType: string;
  organisation: string | null;
  decisionObjects: V1DecisionObjectSummary[];
  evidenceNodes: V1EvidenceItem[];
  stageCount: number;
  createdAt: string;
  updatedAt: string;
  /** Boundary note — always present */
  boundaryNote: string;
};

type ErrorResponse = { error: string; code?: string };

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<V1CaseSummaryResponse | ErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authenticate
  const auth = await resolveV1ApiKey(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { caseId } = req.query;
  if (typeof caseId !== "string" || !caseId) {
    return res.status(400).json({ error: "caseId path parameter is required", code: "VALIDATION_ERROR" });
  }

  try {
    const journey = await prisma.diagnosticJourney.findUnique({
      where: { journeyKey: caseId },
      select: {
        id: true,
        journeyKey: true,
        diagnosticType: true,
        status: true,
        organisation: true,
        routeDecisions: true,
        createdAt: true,
        updatedAt: true,
        stages: {
          select: { id: true },
        },
        decisionObjects: {
          select: {
            decisionText: true,
            constraintText: true,
            costOfDelayText: true,
            stakeholderText: true,
            affectedDomain: true,
            confidence: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        evidenceNodes: {
          select: {
            kind: true,
            label: true,
            summary: true,
            confidence: true,
            severity: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!journey) {
      return res.status(404).json({ error: "Case not found", code: "NOT_FOUND" });
    }

    // Verify this case was created by the calling API key's member
    // (intake source check — if intakeSource is not enterprise_api_v1, deny)
    const rd =
      journey.routeDecisions !== null &&
      typeof journey.routeDecisions === "object" &&
      !Array.isArray(journey.routeDecisions)
        ? (journey.routeDecisions as Record<string, unknown>)
        : {};

    if (rd.intakeSource !== "enterprise_api_v1") {
      // Case exists but was not created via this API — deny cross-source access
      return res.status(403).json({
        error: "Access denied: this case was not created via the enterprise API",
        code: "ACCESS_DENIED",
      });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      caseId: journey.journeyKey,
      status: journey.status,
      diagnosticType: journey.diagnosticType,
      organisation: journey.organisation,
      decisionObjects: journey.decisionObjects.map((d) => ({
        decisionText: d.decisionText,
        constraintText: d.constraintText,
        costOfDelayText: d.costOfDelayText,
        stakeholderText: d.stakeholderText,
        affectedDomain: d.affectedDomain,
        confidence: d.confidence,
        recordedAt: d.createdAt.toISOString(),
      })),
      evidenceNodes: journey.evidenceNodes.map((e) => ({
        kind: e.kind,
        label: e.label,
        summary: e.summary,
        confidence: e.confidence,
        severity: e.severity,
        recordedAt: e.createdAt.toISOString(),
      })),
      stageCount: journey.stages.length,
      createdAt: journey.createdAt.toISOString(),
      updatedAt: journey.updatedAt.toISOString(),
      boundaryNote:
        "This summary reflects evidence submitted to the governed case record. " +
        "No finding has been generated unless a human-initiated assessment has been completed. " +
        "This data is not legal, financial, or professional advice.",
    });
  } catch (err) {
    console.error("[v1/cases/[caseId]/summary GET]", err);
    return res.status(500).json({ error: "Failed to retrieve case summary", code: "INTERNAL_ERROR" });
  }
}

export const config = {
  api: { bodyParser: false },
};
