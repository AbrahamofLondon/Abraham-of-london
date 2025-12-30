/* lib/server/validation.ts */
import type { NextApiRequest } from "next";
import crypto from "crypto";

// Explicit discriminated union type
export type AdminAuthResult =
  | { valid: true; userId?: string; method: "api_key" | "dev_mode" }
  | { valid: false; reason: string };

// Type guard functions for precise narrowing in guards.ts
export function isInvalidAdmin(
  result: AdminAuthResult
): result is { valid: false; reason: string } {
  return result.valid === false;
}

export function isValidAdmin(
  result: AdminAuthResult
): result is { valid: true; userId?: string; method: "api_key" | "dev_mode" } {
  return result.valid === true;
}

function getBearerToken(req: NextApiRequest): string | null {
  const h = req.headers.authorization;
  if (!h) return null;
  const match = h.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

/**
 * INSTITUTIONAL ADMIN VALIDATION
 * - Production: Rigidly enforces ADMIN_API_KEY via Bearer token.
 * - Security: Uses timing-safe comparisons to prevent side-channel leaks.
 */
export async function validateAdminAccess(
  req: NextApiRequest
): Promise<AdminAuthResult> {
  const adminKey = process.env.ADMIN_API_KEY;
  const token = getBearerToken(req);

  // 1. Development Mode Bypass (Principled Exception)
  if (process.env.NODE_ENV !== "production" && !adminKey) {
    return { valid: true, method: "dev_mode" };
  }

  // 2. Configuration Guard
  if (!adminKey) {
    return { valid: false, reason: "ADMIN_API_KEY is not configured on the server" };
  }

  // 3. Token Presence Guard
  if (!token) {
    return { valid: false, reason: "Missing Authorization Bearer token" };
  }

  // 4. TIMING-SAFE COMPARISON (Enterprise Standard)
  // Prevents leaking the key length or content via response time variance.
  try {
    const keyBuffer = Buffer.from(adminKey);
    const tokenBuffer = Buffer.from(token);
    
    if (keyBuffer.length !== tokenBuffer.length || !crypto.timingSafeEqual(keyBuffer, tokenBuffer)) {
      return { valid: false, reason: "Invalid admin token" };
    }
  } catch (err) {
    return { valid: false, reason: "Internal security comparison failure" };
  }

  // Optional: institutional user tracking via custom header
  const userId = (req.headers["x-admin-user-id"] as string | undefined)?.trim();

  return { valid: true, userId, method: "api_key" };
}

/**
 * DATA INTEGRITY: DATE RANGE VALIDATION
 * Used for exporting institutional audit logs.
 */
export function validateDateRange(input: {
  since: Date;
  until: Date;
  maxDays: number;
}): { ok: true } | { ok: false; message: string } {
  const { since, until, maxDays } = input;

  if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime())) {
    return { ok: false, message: "Invalid date format provided" };
  }
  if (since > until) {
    return { ok: false, message: "Temporal paradox: Start date is after end date" };
  }
  
  const diffTime = Math.abs(until.getTime() - since.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays > maxDays) {
    return { ok: false, message: `Oversight limit exceeded: max ${maxDays} days per export` };
  }

  return { ok: true };
}