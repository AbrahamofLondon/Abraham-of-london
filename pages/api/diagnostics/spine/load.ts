/**
 * GET /api/diagnostics/spine/load?email=...
 *
 * Loads the most recent intelligence spine from the database for a given email.
 * Used for cross-device continuity and refresh recovery.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const email = typeof req.query.email === "string" ? req.query.email.trim() : "";
  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    const record = await prisma.diagnosticJourney.findFirst({
      where: {
        email,
        diagnosticType: "intelligence_spine",
        status: "active",
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!record?.mergedTensionThread) {
      return res.status(200).json({ spine: null });
    }

    return res.status(200).json({ spine: record.mergedTensionThread });
  } catch (error) {
    console.error("[spine/load] Error:", error);
    return res.status(500).json({ error: "Failed to load spine" });
  }
}
