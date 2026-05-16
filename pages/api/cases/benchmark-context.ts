/**
 * pages/api/cases/benchmark-context.ts
 *
 * GET /api/cases/benchmark-context
 *
 * Public (no auth required). Returns aggregate benchmark context
 * derived from anonymised opt-in outcome contributions.
 *
 * Query params:
 *   assessmentKind — optional: filter to a specific assessment kind
 *
 * Returns BenchmarkContext.
 * If n < 50, returns availability: "BUILDING" with n and no rates.
 * If n = 0, returns availability: "NO_DATA".
 *
 * The response includes sourceLabel and disclaimer always.
 * These must be shown in any UI that renders benchmark data.
 *
 * Cached for 1 hour (aggregate — does not expose individual data).
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import {
  computeBenchmarkContext,
  type BenchmarkContext,
  type AnonymisedOutcomeContribution,
  type OutcomeContributionState,
  type OutcomeContributionTimeToActBand,
} from "@/lib/product/outcome-contribution-contract";

type ErrorResponse = { error: string };

export type BenchmarkContextApiResponse = {
  ok: true;
  generatedAt: string;
  filter: {
    assessmentKind: string | null;
  };
  benchmark: BenchmarkContext;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BenchmarkContextApiResponse | ErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawKind = req.query.assessmentKind;
  const assessmentKind = typeof rawKind === "string" && rawKind ? rawKind : null;

  try {
    // Fetch all non-retracted OUTCOME_CONTRIBUTION audit events
    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        objectType: "OUTCOME_CONTRIBUTION",
        actionType: "CONTRIBUTED",
      },
      select: {
        objectId: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5000, // hard cap — contributions are small
    });

    // Parse and filter the anonymised contributions
    const contributions: AnonymisedOutcomeContribution[] = [];

    for (const event of auditEvents) {
      if (!event.metadata || typeof event.metadata !== "object") continue;
      const m = event.metadata as Record<string, unknown>;

      // Skip retracted
      if (m.retracted === true) continue;

      // Apply assessmentKind filter if specified
      if (assessmentKind && m.assessmentKind !== assessmentKind) continue;

      contributions.push({
        contributionId: String(m.contributionId ?? event.objectId),
        assessmentBand: typeof m.assessmentBand === "string" ? m.assessmentBand : null,
        assessmentKind: typeof m.assessmentKind === "string" ? m.assessmentKind : null,
        outcomeState: (m.outcomeState as OutcomeContributionState) ?? "UNCHANGED",
        timeToAct: (m.timeToAct as OutcomeContributionTimeToActBand) ?? "DID_NOT_ACT",
        findingAccurate: typeof m.findingAccurate === "boolean" ? m.findingAccurate : null,
        recommendationUseful: typeof m.recommendationUseful === "boolean" ? m.recommendationUseful : null,
        contributedAt: typeof m.contributedAt === "string" ? m.contributedAt : event.createdAt.toISOString(),
        retracted: false,
      });
    }

    const benchmark = computeBenchmarkContext(contributions);

    // Cache for 1 hour — aggregate data, not user-specific
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");

    return res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      filter: { assessmentKind },
      benchmark,
    });
  } catch (err) {
    console.error("[benchmark-context]", err);
    return res.status(500).json({ error: "Failed to compute benchmark context" });
  }
}

export const config = {
  api: { bodyParser: false },
};
