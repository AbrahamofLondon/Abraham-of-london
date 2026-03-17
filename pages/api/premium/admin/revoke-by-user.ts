// pages/api/premium/admin/revoke-by-user.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { revokeDownloadTokensByUserId } from "@/lib/premium/download-token";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const tier = normalizeUserTier((session as any)?.aol?.tier || "public");
  if (!hasAccess(tier, "architect")) {
    return res.status(403).json({ error: "Insufficient clearance" });
  }

  const userId =
    typeof req.body?.userId === "string" ? req.body.userId.trim() : "";

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const revoked = await revokeDownloadTokensByUserId(userId);
    return res.status(200).json({
      success: true,
      userId,
      revoked,
    });
  } catch (error) {
    console.error("[PREMIUM_REVOKE_BY_USER_ERROR]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}