import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";

/**
 * GET /api/pdf/decision-instrument-dossier?slug=...&resultKey=...
 *
 * Generates a governed PDF dossier for a completed instrument result.
 * Returns a structured JSON summary (PDF rendering is handled by the PDF pipeline).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const resolved = await requireAdminApi(req, res);
  if (!resolved) return;

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const slug = typeof req.query.slug === "string" ? req.query.slug : null;
  const resultKey = typeof req.query.resultKey === "string" ? req.query.resultKey : null;

  if (!slug) return res.status(400).json({ error: "Instrument slug is required" });

  try {
    const { prisma } = await import("@/lib/prisma.server");

    // Load result from diagnostic journey
    const record = resultKey
      ? await prisma.diagnosticJourney.findFirst({
          where: { journeyKey: resultKey, diagnosticType: "instrument_result" },
          select: { mergedTensionThread: true, updatedAt: true },
        })
      : null;

    if (!record?.mergedTensionThread) {
      return res.status(200).json({
        available: false,
        slug,
        reason: "No completed instrument result found for this reference.",
      });
    }

    const data = record.mergedTensionThread as Record<string, unknown>;
    const result = data.result as Record<string, unknown> | undefined;

    if (!result) {
      return res.status(200).json({ available: false, slug, reason: "Result data not available." });
    }

    // Build dossier content — public-safe only
    const dossier = {
      available: true,
      slug,
      generatedAt: new Date().toISOString(),
      instrument: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      decisionStatement: typeof data.decisionStatement === "string" ? data.decisionStatement : null,
      resultBand: result.exposureBand ?? result.readinessBand ?? result.riskBand ?? result.alignmentBand ?? result.failurePattern ?? "UNKNOWN",
      score: result.exposureScore ?? result.readinessScore ?? result.riskIndex ?? result.overallAlignmentScore ?? result.healthScore ?? null,
      recommendation: typeof result.recommendation === "string" ? result.recommendation : null,
      missingEvidence: Array.isArray(result.blockers) ? result.blockers : [],
      nextMove: typeof result.recommendedEscalation === "string"
        ? result.recommendedEscalation.replace(/_/g, " ").toLowerCase()
        : typeof result.repairPath === "string" ? result.repairPath : "Review the full instrument result",
      memoryStatement: `This instrument result was recorded on ${record.updatedAt.toISOString().slice(0, 10)} and is preserved in the decision record.`,
      sourceLabels: ["User-reported instrument inputs", "Deterministic scoring engine"],
      caveats: [
        "This is an instrument estimate based on user-reported inputs.",
        "It is not independently verified analysis.",
        "Scores may change if inputs are updated.",
      ],
    };

    return res.status(200).json(dossier);
  } catch (err) {
    console.error("[decision-instrument-dossier]", err);
    return res.status(500).json({ error: "Failed to generate dossier" });
  }
}
