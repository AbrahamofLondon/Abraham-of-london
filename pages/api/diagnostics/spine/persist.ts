/**
 * POST /api/diagnostics/spine/persist
 *
 * Persists an intelligence spine to the database via DiagnosticJourney.
 * This is the DB tier of the three-layer handoff:
 * 1. sessionStorage (immediate)
 * 2. this endpoint (persistent)
 * 3. email-based recovery (cross-device)
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { spine } = req.body as { spine?: IntelligenceSpine };
    if (!spine?.id || !spine?.case?.decision) {
      return res.status(400).json({ error: "Invalid spine data" });
    }

    const journeyKey = `spine_${spine.email ?? spine.id}`;
    const subjectKey = spine.email ?? spine.userId ?? spine.id;

    await prisma.diagnosticJourney.upsert({
      where: { journeyKey },
      create: {
        journeyKey,
        subjectKey,
        email: spine.email ?? null,
        userId: spine.userId ?? null,
        diagnosticType: "intelligence_spine",
        mergedTensionThread: JSON.parse(JSON.stringify(spine)),
        status: "active",
      },
      update: {
        mergedTensionThread: JSON.parse(JSON.stringify(spine)),
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[spine/persist] Error:", error);
    return res.status(500).json({ error: "Failed to persist spine" });
  }
}
