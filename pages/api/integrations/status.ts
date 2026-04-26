/**
 * pages/api/integrations/status.ts
 * Returns the connection status of all OAuth integrations for the current user.
 *
 * GET /api/integrations/status
 * Returns: Array<{ provider: string; status: string; scopes: string; lastSyncAt: string | null }>
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getIntegrationsStatus } from "@/lib/integrations";
import { getAuthSession } from "@/lib/auth/config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getAuthSession();
  if (!session?.user?.id && !session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = session.user.id || session.user.email;
  if (!userId) {
    return res.status(401).json({ error: "No user identifier" });
  }

  try {
    const integrations = await getIntegrationsStatus(userId as string);
    return res.status(200).json(integrations);
  } catch (error) {
    console.error("[INTEGRATIONS_STATUS_ERROR]", error);
    return res.status(500).json({ error: "Failed to fetch integration status" });
  }
}
