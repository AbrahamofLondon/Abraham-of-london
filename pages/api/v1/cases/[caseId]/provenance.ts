/**
 * pages/api/v1/cases/[caseId]/provenance.ts
 *
 * GET /api/v1/cases/:caseId/provenance
 *
 * Enterprise API — retrieve the provenance chain for a governed case.
 *
 * Authentication: x-api-key header.
 *
 * Returns the ordered chain of stage records and evidence nodes that
 * constitute the governed record of this case. Each node includes the
 * kind, source stage, and creation timestamp — forming a verifiable
 * chain of custody without exposing PII.
 *
 * What this does NOT return:
 * - Email addresses or user identifiers
 * - AI model internals or raw prompts
 * - Entitlement data
 *
 * Response: V1CaseProvenanceResponse
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveV1ApiKey } from "@/lib/api/v1-auth";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

type V1ProvenanceNode = {
  nodeId: string;
  kind: "stage" | "evidence" | "decision";
  sourceStage: string;
  label: string;
  summary: string;
  confidence: number | null;
  recordedAt: string;
};

type V1CaseProvenanceResponse = {
  ok: true;
  caseId: string;
  totalNodes: number;
  chain: V1ProvenanceNode[];
  integrityNote: string;
  boundaryNote: string;
};

type ErrorResponse = { error: string; code?: string };

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<V1CaseProvenanceResponse | ErrorResponse>,
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
        routeDecisions: true,
        createdAt: true,
        stages: {
          select: {
            id: true,
            stage: true,
            payload: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        evidenceNodes: {
          select: {
            id: true,
            kind: true,
            sourceStage: true,
            label: true,
            summary: true,
            confidence: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        decisionObjects: {
          select: {
            id: true,
            sourceStage: true,
            decisionText: true,
            confidence: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!journey) {
      return res.status(404).json({ error: "Case not found", code: "NOT_FOUND" });
    }

    // Verify API-created case
    const rd =
      journey.routeDecisions !== null &&
      typeof journey.routeDecisions === "object" &&
      !Array.isArray(journey.routeDecisions)
        ? (journey.routeDecisions as Record<string, unknown>)
        : {};

    if (rd.intakeSource !== "enterprise_api_v1") {
      return res.status(403).json({
        error: "Access denied: this case was not created via the enterprise API",
        code: "ACCESS_DENIED",
      });
    }

    // Build ordered provenance chain
    const chain: V1ProvenanceNode[] = [];

    // Stage records — the procedural backbone
    for (const s of journey.stages) {
      const payload =
        s.payload !== null && typeof s.payload === "object" && !Array.isArray(s.payload)
          ? (s.payload as Record<string, unknown>)
          : {};
      chain.push({
        nodeId: s.id,
        kind: "stage",
        sourceStage: s.stage,
        label: String(payload.label ?? s.stage),
        summary: String(payload.summary ?? "Stage record"),
        confidence: typeof payload.confidence === "number" ? payload.confidence : null,
        recordedAt: s.createdAt.toISOString(),
      });
    }

    // Evidence nodes
    for (const e of journey.evidenceNodes) {
      chain.push({
        nodeId: e.id,
        kind: "evidence",
        sourceStage: e.sourceStage,
        label: e.label,
        summary: e.summary,
        confidence: e.confidence,
        recordedAt: e.createdAt.toISOString(),
      });
    }

    // Decision objects
    for (const d of journey.decisionObjects) {
      chain.push({
        nodeId: d.id,
        kind: "decision",
        sourceStage: d.sourceStage,
        label: "Decision record",
        summary: d.decisionText.slice(0, 200) + (d.decisionText.length > 200 ? "…" : ""),
        confidence: d.confidence,
        recordedAt: d.createdAt.toISOString(),
      });
    }

    // Sort by recordedAt ascending (chronological chain)
    chain.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      caseId: journey.journeyKey,
      totalNodes: chain.length,
      chain,
      integrityNote:
        "Each node in this chain represents a discrete governed record event. " +
        "Nodes are ordered chronologically by creation timestamp. " +
        "The chain reflects what was submitted and recorded — not what was independently verified.",
      boundaryNote:
        "This provenance record is produced from user-submitted and system-recorded data. " +
        "It is not an audit trail certified by an independent third party. " +
        "No content here constitutes legal, financial, or professional advice.",
    });
  } catch (err) {
    console.error("[v1/cases/[caseId]/provenance GET]", err);
    return res.status(500).json({ error: "Failed to retrieve case provenance", code: "INTERNAL_ERROR" });
  }
}

export const config = {
  api: { bodyParser: false },
};
