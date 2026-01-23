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
 * STRATEGIC FIX: Standardize cookie extraction to satisfy build worker.
 */
export function getAccessTokenFromReq(req: any): string | null {
  return readAccessCookie(req);
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
    if (!token || token.length > 1024 || /[\x00-\x1F\x7F]/.test(token)) return null;
    return token;
  }
  return null;
}

/**
 * INSTITUTIONAL ADMIN VALIDATION 
 * Logic: Checks API Key (headers) OR Session Token (cookies) against Postgres.
 */
export async function validateAdminAccess(req: ExtendedRequest): Promise<AdminAuthResult> {
  const adminKey = process.env.ADMIN_API_KEY;

  // 1. Session Check (Postgres-backed)
  const sessionToken = getAccessTokenFromReq(req);
  if (sessionToken) {
    const session = await prisma.session.findUnique({
      where: { sessionId: sessionToken },
      include: { member: true }
    });

    if (session && session.expiresAt > new Date()) {
      const tier = session.member?.tier?.toLowerCase();
      if (tier === "private" || tier === "elite") {
        return { valid: true, userId: session.memberId || undefined, method: "session" };
      }
    }
  }

  // 2. API Key Check
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

  if (isDevelopment() && !adminKey) return { valid: true, method: "dev_mode" };

  return { valid: false, reason: "Unauthorized", statusCode: 401 };
}

/**
 * BRIDGE FOR GATEWAY.TS: getAdminSession
 * Resolves the "Module not found" error by providing the expected export.
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

// Validation Utilities
export function validateIpAddress(ip: string, allowlist: string[] = []): { valid: boolean; reason?: string } {
  if (!ip || typeof ip !== 'string' || ip.length > 45) return { valid: false, reason: "Invalid IP format" };
  if (allowlist.length === 0 || allowlist.includes(ip)) return { valid: true };
  for (const allowed of allowlist) {
    if (allowed.includes('/') && isIpInCidr(ip, allowed)) return { valid: true };
  }
  return { valid: false, reason: `IP ${ip} not in allowlist` };
}

function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, prefix] = cidr.split('/');
    const prefixInt = parseInt(prefix, 10);
    const mask = ~(Math.pow(2, 32 - prefixInt) - 1);
    return (ipToLong(ip) & mask) === (ipToLong(range) & mask);
  } catch { return false; }
}

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function validateDateRange(input: { since: Date; until: Date; maxDays: number }): { ok: true } | { ok: false; message: string; statusCode?: number } {
  if (isNaN(input.since.getTime()) || isNaN(input.until.getTime())) return { ok: false, message: "Invalid date", statusCode: 400 };
  if (input.since > input.until) return { ok: false, message: "Temporal paradox", statusCode: 400 };
  const diffDays = Math.abs(input.until.getTime() - input.since.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > input.maxDays ? { ok: false, message: "Limit exceeded", statusCode: 400 } : { ok: true };
}

export function validateEmail(email: string): { valid: boolean; message?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (!email || email.length > 254 || !emailRegex.test(email)) ? { valid: false, message: "Invalid email" } : { valid: true };
}

export function validatePassword(password: string): { valid: boolean; message?: string; score: number } {
  const messages: string[] = [];
  if (!password || password.length < 12) messages.push("Min 12 characters");
  if (!/[A-Z]/.test(password)) messages.push("Require uppercase");
  if (!/[0-9]/.test(password)) messages.push("Require number");
  return { valid: messages.length === 0, message: messages.join(', '), score: 5 - messages.length };
}

export function validateUuid(uuid: string): { valid: boolean; message?: string } {
  return { valid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid) };
}

export function validateRequestBody<T>(body: any, schema: Record<string, (v: any) => { valid: boolean; message?: string }>): { valid: boolean; data?: T; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const validData: any = {};
  if (!body || typeof body !== 'object') return { valid: false, errors: { _root: 'Body required' } };
  for (const [key, validator] of Object.entries(schema)) {
    const res = validator(body[key]);
    if (!res.valid) errors[key] = res.message || 'Invalid';
    else validData[key] = body[key];
  }
  return { valid: Object.keys(errors).length === 0, data: validData as T, errors };
}

export function validateFileUpload(file: { name: string; size: number; type: string; }, options: any = {}): { valid: boolean; message?: string } {
  const { allowedTypes = [], maxSize = 10485760 } = options;
  if (!file || file.size > maxSize) return { valid: false, message: "File too large" };
  return { valid: true };
}

export function withValidation<T>(handler: any, schema: any) {
  return async (req: ExtendedRequest, ...args: any[]) => {
    try {
      const body = 'json' in req ? await (req as any).json() : (req as any).body;
      const result = validateRequestBody<T>(body, schema);
      if (!result.valid) return new Response(JSON.stringify({ error: 'Validation failed', details: result.errors }), { status: 400 });
      return await handler(req, result.data!, ...args);
    } catch (e) {
      return new Response(JSON.stringify({ error: isProduction() ? 'Internal error' : String(e) }), { status: 500 });
    }
  };
}

const adminApi = {
  validateAdminAccess, validateDateRange, validateEmail, validatePassword, 
  validateUuid, validateRequestBody, validateFileUpload, validateIpAddress, 
  withValidation, isInvalidAdmin, isValidAdmin, getAdminSession
};

export default adminApi;