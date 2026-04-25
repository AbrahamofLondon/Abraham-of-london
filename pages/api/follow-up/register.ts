/**
 * POST /api/follow-up/register
 *
 * Registers a new pressure loop in the database.
 * Called after Fast Diagnostic completion to schedule 48h/7d/14d follow-up.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import type { PressureLoop } from "@/lib/follow-up/pressure-loop";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { loop } = req.body as { loop?: PressureLoop };
    if (!loop || !loop.email || !loop.spineId) {
      return res.status(400).json({ error: "Missing loop data" });
    }

    const journeyKey = `pressure_${loop.email}_${loop.spineId}`;

    await prisma.diagnosticJourney.upsert({
      where: { journeyKey },
      create: {
        journeyKey,
        subjectKey: loop.email,
        email: loop.email,
        diagnosticType: "pressure_loop",
        status: "active",
        mergedTensionThread: JSON.parse(JSON.stringify(loop)),
      },
      update: {
        mergedTensionThread: JSON.parse(JSON.stringify(loop)),
        status: "active",
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[follow-up/register] Error:", error);
    return res.status(500).json({ error: "Failed to register follow-up loop" });
  }
}
