// pages/api/access/enter.ts — HARDENED (Atomic Redemption)

import type { NextApiRequest, NextApiResponse } from "next";
import { redeemAccessKey } from "@/lib/server/auth/tokenStore.postgres";
import { setAccessCookie } from "@/lib/server/auth/cookies";
import type { AccessTier as Tier } from "@/lib/access/tier-policy";

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
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, reason: "Method Not Allowed" });
  }

  const { token: tokenRaw } = req.body || {};

  if (!isNonEmptyString(tokenRaw)) {
    return res.status(400).json({ ok: false, reason: "Credential missing" });
  }

  const token = tokenRaw.trim();

  if (token.length < 8) {
    return res.status(400).json({ ok: false, reason: "Invalid format" });
  }

  if (token.length > 512) {
    return res.status(413).json({ ok: false, reason: "Payload excessive" });
  }

  try {
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

    if (!redeemed.sessionId) {
      console.error(
        "[AUTH_FAILURE] Token redeemed but session creation failed."
      );
      return res
        .status(500)
        .json({ ok: false, reason: "System misconfiguration" });
    }

    setAccessCookie(res, redeemed.sessionId);

    return res.status(200).json({
      ok: true,
      tier: redeemed.tier as Tier,
    });
  } catch (err) {
    console.error("[CRITICAL_AUTH_ERROR]", err);
    return res
      .status(500)
      .json({ ok: false, reason: "Institutional auth failure" });
  }
}