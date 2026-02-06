/* pages/api/inner-circle/unlock.ts — VAULT REDEMPTION */
import type { NextApiRequest, NextApiResponse } from "next";
import { setAccessCookie } from "@/lib/server/auth/cookies";
import { redeemAccessKey } from "@/lib/server/auth/tokenStore.postgres";

/**
 * Extract true client IP, respecting proxy headers
 */
function getClientIp(req: NextApiRequest): string {
  const xff = String(req.headers["x-forwarded-for"] || "");
  const ip = xff.split(",")[0]?.trim();
  return ip || req.socket.remoteAddress || "unknown";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const key = String(req.body?.key || "").trim();
  if (!key) return res.status(400).json({ ok: false, error: "Authentication key required." });

  try {
    // 1. Process the key through the TokenStore
    // This function should handle: hashing, lookup, status update, and session creation
    const result = await redeemAccessKey(key, {
      ipAddress: getClientIp(req),
      userAgent: String(req.headers["user-agent"] || ""),
      source: "inner-circle-vault",
    });

    if (!result.ok) {
      console.warn(`[AUTH_FAILURE]: IP ${getClientIp(req)} attempted invalid key.`);
      return res.status(401).json({ 
        ok: false, 
        error: result.reason || "Invalid or expired security key." 
      });
    }

    // 2. Set the secure institutional cookie
    // The cookie contains the sessionId linked to the member in Postgres
    setAccessCookie(res, result.sessionId);

    // 3. Success response
    return res.status(200).json({
      ok: true,
      tier: result.tier,
      message: "Vault access granted."
    });

  } catch (error: any) {
    console.error("[VAULT_UNLOCK_ERROR]:", error);
    return res.status(500).json({ ok: false, error: "Internal security protocol error." });
  }
}