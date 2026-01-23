/* pages/api/auth/mint.ts - INSTITUTIONAL SESSION MINT (PRISMA) */
import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";

import { redeemAccessKey, mintSession, type Tier } from "@/lib/server/auth/tokenStore.postgres";
import { setAccessCookie } from "@/lib/server/auth/cookies";

type Ok = { ok: true; tier: Tier };
type Fail = { ok: false; reason: string };
type Data = Ok | Fail;

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

/**
 * Best-effort client IP extraction:
 * - prefers x-forwarded-for (first IP)
 * - falls back to req.socket.remoteAddress
 */
function getClientIp(req: NextApiRequest): string | null {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    // "client, proxy1, proxy2" → take first
    const first = xff.split(",")[0]?.trim();
    return first || null;
  }
  if (Array.isArray(xff) && xff.length > 0) {
    const first = String(xff[0] || "").split(",")[0]?.trim();
    return first || null;
  }
  const ra = req.socket?.remoteAddress;
  return ra ? String(ra) : null;
}

function getUserAgent(req: NextApiRequest): string {
  const ua = req.headers["user-agent"];
  if (!ua) return "";
  if (Array.isArray(ua)) return ua.join(" ");
  return String(ua);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // 1) Enforce POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  // 2) Validate token input
  const tokenRaw = (req.body as any)?.token;
  if (!isNonEmptyString(tokenRaw)) {
    return res.status(400).json({ ok: false, reason: "Token is required" });
  }
  const token = tokenRaw.trim();

  // Optional guardrails: prevent silly payloads / abuse
  if (token.length < 8) {
    return res.status(400).json({ ok: false, reason: "Token format invalid" });
  }
  if (token.length > 512) {
    return res.status(413).json({ ok: false, reason: "Token too large" });
  }

  try {
    // 3) Redeem key (one-time enforcement lives in tokenStore.postgres)
    const redemption = await redeemAccessKey(token, {
      ipAddress: getClientIp(req) || undefined,
      userAgent: getUserAgent(req) || undefined,
      source: "api/auth/mint",
    });

    if (!redemption.ok) {
      // You can choose 401 or 403.
      // - 401 if "auth failed"
      // - 403 if "token not allowed"
      return res.status(403).json({ ok: false, reason: redemption.reason || "Access denied" });
    }

    // 4) Mint session id (uuid is fine here)
    const sessionId = uuidv4();

    // 5) Persist session in Postgres
    await mintSession({
      sessionId,
      tier: redemption.tier as Tier,
      memberId: redemption.memberId as string,
      emailHash: redemption.emailHash || "",
      userAgent: getUserAgent(req) || undefined,
      ipAddress: getClientIp(req) || undefined,
      metadata: {
        keyId: redemption.keyId,
        source: "api/auth/mint",
      },
    });

    // 6) Issue cookie
    setAccessCookie(res, sessionId);

    return res.status(200).json({ ok: true, tier: redemption.tier as Tier });
  } catch (error) {
    console.error("[MINT_ERROR]", error);
    return res.status(500).json({ ok: false, reason: "Institutional auth failure" });
  }
}