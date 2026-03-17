/* pages/api/auth/mint.ts - INSTITUTIONAL SESSION MINT (PRISMA) */
import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";

// ✅ Import types and normalization from your SSOT policy
import { type AccessTier, normalizeUserTier } from "@/lib/access/tier-policy";
import { redeemAccessKey, mintSession } from "@/lib/server/auth/tokenStore.postgres";
import { setAccessCookie } from "@/lib/server/auth/cookies";

// Define the expected shape of the redemption success to fix the emailHash error
interface RedemptionSuccess {
  ok: true;
  tier: string;
  memberId?: string | null;
  emailHash?: string | null; // ✅ This matches your database/logic requirements
  keyId?: string;
  reason?: never;
}

interface RedemptionFailure {
  ok: false;
  reason: string;
  tier?: never;
  memberId?: never;
  emailHash?: never;
  keyId?: never;
}

type RedemptionResult = RedemptionSuccess | RedemptionFailure;

type OkResponse = { ok: true; tier: AccessTier };
type FailResponse = { ok: false; reason: string };
type Data = OkResponse | FailResponse;

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function getClientIp(req: NextApiRequest): string | null {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    return xff.split(",")[0]?.trim() || null;
  }
  return req.socket?.remoteAddress || null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  const tokenRaw = (req.body as any)?.token;
  if (!isNonEmptyString(tokenRaw)) {
    return res.status(400).json({ ok: false, reason: "Token is required" });
  }
  const token = tokenRaw.trim();

  try {
    // 1) Redeem key - Cast result to our local interface to ensure emailHash is recognized
    const redemption = (await redeemAccessKey(token, {
      ipAddress: getClientIp(req) || undefined,
      userAgent: req.headers["user-agent"] || undefined,
      source: "api/auth/mint",
    })) as RedemptionResult;

    if (!redemption.ok) {
      return res.status(403).json({ ok: false, reason: redemption.reason || "Access denied" });
    }

    // 2) Normalize the tier using the SSOT policy before minting
    const userTier = normalizeUserTier(redemption.tier);
    const sessionId = uuidv4();

    // 3) Persist session in Postgres
    // ✅ Type-safe minting without 'as any'
    await mintSession({
      sessionId,
      tier: userTier,
      memberId: String(redemption.memberId || ""),
      emailHash: redemption.emailHash || "",
      userAgent: req.headers["user-agent"] || undefined,
      ipAddress: getClientIp(req) || undefined,
      metadata: {
        keyId: redemption.keyId || "unknown",
        source: "api/auth/mint",
      },
    });

    // 4) Issue cookie
    setAccessCookie(res, sessionId);

    return res.status(200).json({ ok: true, tier: userTier });
  } catch (error) {
    console.error("[MINT_ERROR]", error);
    return res.status(500).json({ ok: false, reason: "Institutional auth failure" });
  }
}