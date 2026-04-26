/**
 * POST /api/decision-instruments/results — persist instrument result
 * GET  /api/decision-instruments/results — list user's results
 *
 * Uses DiagnosticJourney with diagnosticType = "instrument_result"
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { instrumentSlug, version, answers, scores, result, email, spineId } = req.body ?? {};
      if (!instrumentSlug || !result) return res.status(400).json({ error: "Missing instrumentSlug or result" });

      const journeyKey = `instrument_${instrumentSlug}_${email ?? spineId ?? Date.now()}`;

      await prisma.diagnosticJourney.upsert({
        where: { journeyKey },
        create: {
          journeyKey,
          subjectKey: email ?? spineId ?? journeyKey,
          email: email ?? null,
          diagnosticType: "instrument_result",
          status: "completed",
          mergedTensionThread: JSON.parse(JSON.stringify({ instrumentSlug, version, answers, scores, result, completedAt: new Date().toISOString() })),
        },
        update: {
          mergedTensionThread: JSON.parse(JSON.stringify({ instrumentSlug, version, answers, scores, result, completedAt: new Date().toISOString() })),
          status: "completed",
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({ ok: true, journeyKey });
    } catch (error) {
      console.error("[instrument-results] POST error:", error);
      return res.status(500).json({ error: "Failed to save result" });
    }
  }

  if (req.method === "GET") {
    const email = typeof req.query.email === "string" ? req.query.email : "";
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
      const results = await prisma.diagnosticJourney.findMany({
        where: { email, diagnosticType: "instrument_result" },
        orderBy: { updatedAt: "desc" },
        take: 20,
      });

      return res.status(200).json({ results: results.map((r) => ({ id: r.id, journeyKey: r.journeyKey, data: r.mergedTensionThread, updatedAt: r.updatedAt })) });
    } catch (error) {
      console.error("[instrument-results] GET error:", error);
      return res.status(500).json({ error: "Failed to load results" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
