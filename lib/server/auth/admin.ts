// lib/server/auth/admin.ts
import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { normalizeUserTier, hasAccess as tierHasAccess } from "@/lib/access/tier-policy";
import type { AccessTier } from "@/lib/access/tier-policy";

export type AdminAuthResult =
  | { valid: true; userId?: string; tier?: AccessTier; method: "api_key" | "dev_mode" | "session" }
  | { valid: false; reason: string; statusCode?: number };

export function isInvalidAdmin(
  result: AdminAuthResult
): result is { valid: false; reason: string; statusCode?: number } {
  return result.valid === false;
}

export function isValidAdmin(
  result: AdminAuthResult
): result is { valid: true; userId?: string; tier?: AccessTier; method: "api_key" | "dev_mode" | "session" } {
  return result.valid === true;
}

type ExtendedRequest = NextApiRequest | NextRequest;

const isDevelopment = () => process.env.NODE_ENV === "development";

/**
 * Admin policy: minimum tier required for admin clearance.
 * Change here once. No other file should hardcode "admin".
 */
const ADMIN_MIN_TIER: AccessTier = "architect";

function getBearerToken(req: ExtendedRequest): string | null {
  try {
    const anyHeaders = (req as any)?.headers;
    if (!anyHeaders) return null;

    const auth =
      typeof anyHeaders.get === "function"
        ? String(anyHeaders.get("authorization") || "")
        : String(anyHeaders.authorization || "");

    if (!auth) return null;

    const match = auth.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1]?.trim();
    if (!token || token.length > 1024) return null;

    return token;
  } catch {
    return null;
  }
}

function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * INSTITUTIONAL ADMIN VALIDATION
 * 1) DB session tier (cookie -> prisma.session -> member tier normalized)
 * 2) Bearer API key
 * 3) Dev fallback
 */
export async function validateAdminAccess(req: ExtendedRequest): Promise<AdminAuthResult> {
  const adminKey = process.env.ADMIN_API_KEY;

  // 1) Session Check (Database-backed)
  const sessionToken = readAccessCookie(req as any);
  if (sessionToken) {
    try {
      const session = await prisma.session.findUnique({
        where: { sessionId: sessionToken },
        include: { member: true },
      });

      if (session && session.expiresAt && session.expiresAt > new Date()) {
        const tier = normalizeUserTier(session.member?.tier ?? "public");
        if (tierHasAccess(tier, ADMIN_MIN_TIER)) {
          return {
            valid: true,
            userId: session.memberId || undefined,
            tier,
            method: "session",
          };
        }
      }
    } catch (e) {
      console.error("[validateAdminAccess] session check error:", e);
      // continue to API key
    }
  }

  // 2) API Key Check (Timing-safe)
  const bearer = getBearerToken(req);
  if (adminKey && bearer) {
    try {
      if (timingSafeEqualString(adminKey, bearer)) {
        return { valid: true, method: "api_key" };
      }
      return { valid: false, reason: "Unauthorized", statusCode: 401 };
    } catch (e) {
      console.error("[validateAdminAccess] api key check error:", e);
      return { valid: false, reason: "Security validation failure", statusCode: 500 };
    }
  }

  // 3) Development Fallback
  if (isDevelopment() && !adminKey) {
    return { valid: true, method: "dev_mode" };
  }

  return { valid: false, reason: "Unauthorized: Directorate Clearance Required.", statusCode: 401 };
}

/**
 * BRIDGE FOR gateway.ts: getAdminSession
 */
export async function getAdminSession(req: any) {
  const result = await validateAdminAccess(req);
  if (isValidAdmin(result)) {
    return { userId: result.userId, isAdmin: true, tier: result.tier, method: result.method };
  }
  return null;
}

// Lightweight format validators (not “security”, just hygiene)
export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? { valid: true } : { valid: false, message: "Invalid email format" };
};

export const validatePassword = (password: string) => {
  const ok = typeof password === "string" && password.length >= 12;
  return ok
    ? { valid: true, score: 5 }
    : { valid: false, message: "Security protocol requires 12+ chars", score: 1 };
};

const adminApi = {
  validateAdminAccess,
  getAdminSession,
  isValidAdmin,
  isInvalidAdmin,
  validateEmail,
  validatePassword,
};

export default adminApi;