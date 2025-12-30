import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/server/ip";

const COOKIE_ACCESS = "innerCircleAccess";
const COOKIE_TIER = "innerCircleTier";

type Tier = "inner-circle" | "inner-circle-plus" | "inner-circle-elite";

type UnlockJsonResponse =
  | { ok: true; message: string; redirectTo: string; tier: Tier }
  | { ok: false; error: string; message?: string };

/**
 * 1. INFRASTRUCTURE HELPERS
 */
function isSecureRequest(req: NextApiRequest): boolean {
  const proto = req.headers["x-forwarded-proto"];
  if (typeof proto === "string") return proto.split(",")[0].trim() === "https";
  return !(req.headers.host || "").includes("localhost");
}

function setCookie(res: NextApiResponse, name: string, value: string, secure: boolean): void {
  const maxAge = 60 * 60 * 24 * 365; // 1 year institutional persistence
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  
  const existing = res.getHeader("Set-Cookie");
  const next = parts.join("; ");
  if (!existing) res.setHeader("Set-Cookie", [next]);
  else if (Array.isArray(existing)) res.setHeader("Set-Cookie", [...existing, next]);
  else res.setHeader("Set-Cookie", [String(existing), next]);
}

function safeReturnTo(v: unknown): string {
  if (typeof v !== "string") return "/canon";
  const trimmed = v.trim();
  if (!trimmed.startsWith("/")) return "/canon";
  if (trimmed.startsWith("//")) return "/canon";
  return trimmed;
}

function normalizeTier(v: unknown): Tier {
  const t = String(v ?? "").trim().toLowerCase();
  if (t === "inner-circle-plus") return "inner-circle-plus";
  if (t === "inner-circle-elite") return "inner-circle-elite";
  return "inner-circle";
}

/**
 * 2. PRIMARY HANDLER
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UnlockJsonResponse>
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const key = req.method === "GET" ? req.query.key : (req.body?.key as unknown);
  const returnTo = req.method === "GET" ? req.query.returnTo : (req.body?.returnTo as unknown);

  const trimmedKey = typeof key === "string" ? key.trim() : "";
  if (!trimmedKey) {
    return res.status(400).json({ ok: false, error: "Security key is required." });
  }

  try {
    /**
     * PRISMA VERIFICATION
     * Validates key existence, active status, and expiry in a single query.
     */
    const keyRecord = await prisma.innerCircleKey.findUnique({
      where: { keyHash: trimmedKey },
      include: { member: true }
    });

    // Validations
    if (!keyRecord || keyRecord.status !== "active") {
      return res.status(403).json({ ok: false, error: "Invalid or inactive key." });
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return res.status(403).json({ ok: false, error: "Access key has expired." });
    }

    /**
     * AUDIT UPDATE (Outcome Focused)
     * Records the unlock and current IP to the Neon database.
     */
    await prisma.innerCircleKey.update({
      where: { id: keyRecord.id },
      data: {
        totalUnlocks: { increment: 1 },
        lastUsedAt: new Date(),
        lastIp: getClientIp(req)
      }
    });

    const secure = isSecureRequest(req);

    // Set Legacy Authorization Cookie
    setCookie(res, COOKIE_ACCESS, "true", secure);

    // Set Tiered Authorization Cookie
    const tier = normalizeTier(keyRecord.member.tier);
    setCookie(res, COOKIE_TIER, tier, secure);

    const redirectTo = safeReturnTo(returnTo);
    return res.status(200).json({ 
      ok: true, 
      message: "Vault authorized.", 
      redirectTo, 
      tier 
    });

  } catch (error) {
    console.error("[InnerCircle] Unlock error:", error);
    return res.status(500).json({ ok: false, error: "Authorization subsystem offline." });
  }
}