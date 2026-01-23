// pages/api/access/enter.ts — CANONICAL ACCESS ENTRY (ONE-TIME KEY → SESSION COOKIE)
import type { NextApiRequest, NextApiResponse } from "next";
import { redeemAccessKey, type Tier } from "@/lib/server/auth/tokenStore.postgres";
import { setAccessCookie } from "@/lib/server/auth/cookies";

type Ok = { ok: true; tier: Tier };
type Fail = { ok: false; reason: string };
type Data = Ok | Fail;

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

/**
 * Extract client IP:
 * - prefers first IP in X-Forwarded-For
 * - falls back to socket.remoteAddress
 */
function getClientIp(req: NextApiRequest): string | undefined {
  const xf = req.headers["x-forwarded-for"];

  // x-forwarded-for can be "client, proxy1, proxy2" OR string[] in some setups
  const raw =
    (typeof xf === "string" ? xf : Array.isArray(xf) ? xf[0] : undefined) ||
    req.socket?.remoteAddress ||
    "";

  const ip = String(raw).split(",")[0]?.trim();
  return ip || undefined;
}

function getUserAgent(req: NextApiRequest): string {
  const ua = req.headers["user-agent"];
  if (!ua) return "";
  if (Array.isArray(ua)) return ua.join(" ");
  return String(ua);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // 1) Method gate
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  // 2) Token validation
  const tokenRaw = (req.body as any)?.token;

  if (!isNonEmptyString(tokenRaw)) {
    return res.status(400).json({ ok: false, reason: "Missing token" });
  }

  const token = tokenRaw.trim();

  // Guardrails: prevents abuse + accidental huge payloads
  if (token.length < 8) {
    return res.status(400).json({ ok: false, reason: "Token format invalid" });
  }
  if (token.length > 512) {
    return res.status(413).json({ ok: false, reason: "Token too large" });
  }

  try {
    // 3) Redeem one-time key (must be atomic in Postgres)
    // IMPORTANT: redeemAccessKey must create the session and return sessionId.
    const redeemed = await redeemAccessKey(token, {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      source: "api/access/enter",
    });

    if (!redeemed.ok) {
      // 403 is correct for invalid/used/revoked keys
      return res.status(403).json({ ok: false, reason: redeemed.reason || "Access denied" });
    }

    if (!redeemed.sessionId) {
      // If this happens, tokenStore.postgres is not honoring the contract.
      console.error("[ACCESS_ENTER] redeemAccessKey ok but missing sessionId");
      return res.status(500).json({ ok: false, reason: "Auth misconfiguration" });
    }

    // 4) Cookie contains the REAL sessionId from Postgres
    setAccessCookie(res, redeemed.sessionId);

    // 5) Return tier for client UX decisions
    return res.status(200).json({ ok: true, tier: redeemed.tier });
  } catch (err) {
    console.error("[ACCESS_ENTER_ERROR]", err);
    return res.status(500).json({ ok: false, reason: "Institutional auth failure" });
  }
}