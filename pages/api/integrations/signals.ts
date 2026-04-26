/**
 * pages/api/integrations/signals.ts
 * Serves behavioral data signals to the frontend.
 * Called by verifyWithBehavioralData in behavioral-integration.ts.
 *
 * GET /api/integrations/signals?subjectId=<userId>
 * Returns: BehavioralDataSource[]
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { fetchUserBehavioralData } from "@/lib/integrations";
import { getAuthSession } from "@/lib/auth/config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify authentication
  const session = await getAuthSession();
  if (!session?.user?.id && !session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = session.user.id || session.user.email;
  if (!userId) {
    return res.status(401).json({ error: "No user identifier" });
  }

  // Support both query param and session-based resolution
  const subjectId = (req.query.subjectId as string) || (userId as string);

  // Security: only allow users to fetch their own data
  if (subjectId !== userId && !session.user.role?.includes("ADMIN")) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const behavioralData = await fetchUserBehavioralData(subjectId);
    return res.status(200).json(behavioralData);
  } catch (error) {
    console.error("[INTEGRATIONS_SIGNALS_ERROR]", error);
    return res.status(500).json({
      error: "Failed to fetch behavioral signals",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
