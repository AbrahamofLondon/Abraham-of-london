/* lib/server/auth/admin.ts - PRODUCTION SAFETY UPGRADE */
import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { readAccessCookie } from "@/lib/server/auth/cookies";

const isProduction = () => process.env.NODE_ENV === 'production';
const isDevelopment = () => process.env.NODE_ENV === 'development';

export type AdminAuthResult =
  | { valid: true; userId?: string; method: "api_key" | "dev_mode" | "jwt" | "session" }
  | { valid: false; reason: string; statusCode?: number };

export function isInvalidAdmin(result: AdminAuthResult): result is { valid: false; reason: string; statusCode?: number } {
  return result.valid === false;
}

export function isValidAdmin(result: AdminAuthResult): result is { valid: true; userId?: string; method: "api_key" | "dev_mode" | "jwt" | "session" } {
  return result.valid === true;
}

type ExtendedRequest = NextApiRequest | NextRequest;

/**
 * Standardize cookie extraction to satisfy build workers and edge runtime.
 */
export function getAccessTokenFromReq(req: any): string | null {
  try {
    return readAccessCookie(req);
  } catch {
    return null;
  }
}

function getBearerToken(req: ExtendedRequest): string | null {
  if (!req.headers) return null;
  let authHeader: string | undefined | null;

  try {
    if (typeof (req.headers as any).get === 'function') {
      authHeader = (req.headers as any).get('authorization');
    } else {
      authHeader = (req.headers as any).authorization;
    }
  } catch { return null; }
  
  if (typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1]?.trim();
    if (!token || token.length > 1024) return null;
    return token;
  }
  return null;
}

/**
 * INSTITUTIONAL ADMIN VALIDATION 
 * Checks for valid sessions or secure API keys.
 */
export async function validateAdminAccess(req: ExtendedRequest): Promise<AdminAuthResult> {
  const adminKey = process.env.ADMIN_API_KEY;

  // 1. Session Check (Database-backed)
  const sessionToken = getAccessTokenFromReq(req);
  if (sessionToken) {
    const session = await prisma.session.findUnique({
      where: { sessionId: sessionToken },
      include: { member: true }
    });

    if (session && session.expiresAt > new Date()) {
      const tier = session.member?.tier?.toLowerCase();
      // Ensure only high-clearance tiers pass as "Admin" here
      if (tier === "elite" || tier === "founder" || tier === "admin") {
        return { valid: true, userId: session.memberId || undefined, method: "session" };
      }
    }
  }

  // 2. API Key Check (Timing-safe)
  const token = getBearerToken(req);
  if (adminKey && token) {
    try {
      const keyBuffer = Buffer.from(adminKey, 'utf8');
      const tokenBuffer = Buffer.from(token, 'utf8');
      if (keyBuffer.length === tokenBuffer.length && crypto.timingSafeEqual(keyBuffer, tokenBuffer)) {
        return { valid: true, method: "api_key" };
      }
    } catch {
      return { valid: false, reason: "Security validation failure", statusCode: 500 };
    }
  }

  // 3. Development Fallback
  if (isDevelopment() && !adminKey) return { valid: true, method: "dev_mode" };

  return { valid: false, reason: "Unauthorized: Directorate Clearance Required.", statusCode: 401 };
}

/**
 * BRIDGE FOR GATEWAY.TS: getAdminSession
 */
export async function getAdminSession(req: any) {
  const result = await validateAdminAccess(req);
  if (isValidAdmin(result)) {
    return {
      userId: result.userId,
      isAdmin: true,
      method: result.method
    };
  }
  return null;
}

// Validation Logic Utilities (Standardized)
export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? { valid: true } : { valid: false, message: "Invalid email format" };
};

export const validatePassword = (password: string) => {
  return password.length >= 12 ? { valid: true, score: 5 } : { valid: false, message: "Security protocol requires 12+ chars", score: 1 };
};

const adminApi = {
  validateAdminAccess,
  getAdminSession,
  isValidAdmin,
  isInvalidAdmin,
  validateEmail,
  validatePassword
};

export default adminApi;