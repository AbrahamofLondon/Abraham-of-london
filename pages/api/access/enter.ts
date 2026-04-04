/* pages/api/access/enter.ts — V7.1 CANONICAL ALIGNED */

import type { NextApiRequest, NextApiResponse } from "next";
import { redeemAccessKey } from "@/lib/server/auth/tokenStore.postgres";
import { setAccessCookie } from "@/lib/server/auth/cookies";
// Import the Policy Engine to ensure data purity
import { normalizeUserTier, type AccessTier as Tier } from "@/lib/access/tier-policy";

type Ok = { ok: true; tier: Tier };
type Fail = { ok: false; reason: string };
type Data = Ok | Fail;

const isNonEmptyString = (x: unknown): x is string =>
  typeof x === "string" && x.trim().length > 0;

function getClientIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  const raw =
    (typeof xf === "string"
      ? xf
      : Array.isArray(xf)
      ? xf[0]
      : undefined) ||
    req.socket?.remoteAddress ||
    "0.0.0.0";

  return String(raw).split(",")[0]?.trim() || "0.0.0.0";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // 1. Method Guard
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, reason: "Method Not Allowed" });
  }

  // 2. Payload Validation
  const { token: tokenRaw } = req.body || {};

  if (!isNonEmptyString(tokenRaw)) {
    return res.status(400).json({ ok: false, reason: "Credential missing" });
  }

  const token = tokenRaw.trim();

  // Basic Sanity/Security Bounds
  if (token.length < 8) {
    return res.status(400).json({ ok: false, reason: "Invalid format" });
  }

  if (token.length > 512) {
    return res.status(413).json({ ok: false, reason: "Payload excessive" });
  }

  try {
    // 3. Atomic Redemption against Postgres Store
    const redeemed = await redeemAccessKey(token, {
      ipAddress: getClientIp(req),
      userAgent: String(req.headers["user-agent"] || "unknown"),
      source: "gateway/terminal",
    });

    if (!redeemed.ok) {
      return res
        .status(403)
        .json({ ok: false, reason: redeemed.reason || "Unauthorized" });
    }

    // 4. Session Persistence Logic
    if (!redeemed.sessionId) {
      console.error(
        "[AUTH_FAILURE] Token redeemed but session creation failed."
      );
      return res
        .status(500)
        .json({ ok: false, reason: "System misconfiguration" });
    }

    // Set the secondary access cookie for the Vault
    setAccessCookie(res, redeemed.sessionId);

    // 5. Canonical Data Return
    // We normalize the tier here so the frontend AccessGate receives 
    // the exact key expected by the TIER_HIERARCHY map.
    const normalizedTier = normalizeUserTier(redeemed.tier);

    return res.status(200).json({
      ok: true,
      tier: normalizedTier,
    });
    
  } catch (err) {
    console.error("[CRITICAL_AUTH_ERROR]", err);
    return res
      .status(500)
      .json({ ok: false, reason: "Institutional auth failure" });
  }
}