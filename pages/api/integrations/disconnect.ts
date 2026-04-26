/**
 * pages/api/integrations/disconnect.ts
 * Disconnects an OAuth integration for the current user.
 *
 * POST /api/integrations/disconnect
 * Body: { provider: "google" | "slack" }
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { disconnectIntegration } from "@/lib/integrations";
import { getAuthSession } from "@/lib/auth/config";
import type { ProviderType } from "@/lib/integrations";

const VALID_PROVIDERS: ProviderType[] = ["google", "slack", "jira", "linear", "github", "notion"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
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

  const { provider } = req.body || {};

  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return res.status(400).json({
      error: "Invalid provider",
      validProviders: VALID_PROVIDERS,
    });
  }

  try {
    await disconnectIntegration(userId as string, provider as ProviderType);
    return res.status(200).json({ success: true, provider });
  } catch (error) {
    console.error("[INTEGRATIONS_DISCONNECT_ERROR]", error);
    return res.status(500).json({ error: "Failed to disconnect integration" });
  }
}
