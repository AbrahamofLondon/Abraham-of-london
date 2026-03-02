/* pages/api/inner-circle/unlock.ts — VAULT REDEMPTION (SSOT) */
import type { NextApiRequest, NextApiResponse } from "next";
import { setAccessCookie } from "@/lib/server/auth/cookies";
import { redeemAccessKey } from "@/lib/server/auth/tokenStore.postgres";

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

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const key = String(req.body?.key || "").trim();
  if (!key) return res.status(400).json({ ok: false, error: "Authentication key required." });

  try {
    const result = await redeemAccessKey(key, {
      ipAddress: getClientIp(req),
      userAgent: String(req.headers["user-agent"] || ""),
      source: "inner-circle-vault",
    });

    if (!result.ok) {
      return res.status(401).json({
        ok: false,
        error: result.reason || "Invalid or expired security key.",
      });
    }

    // sessionId is the authoritative server-side identity; cookie stores it
    setAccessCookie(res, result.sessionId);

    return res.status(200).json({
      ok: true,
      tier: result.tier,
      message: "Vault access granted.",
    });
  } catch (error: any) {
    console.error("[VAULT_UNLOCK_ERROR]:", error);
    return res.status(500).json({ ok: false, error: "Internal security protocol error." });
  }
}