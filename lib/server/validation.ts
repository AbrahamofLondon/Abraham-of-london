// lib/server/validation.ts
import type { NextApiRequest } from "next";

// Explicit discriminated union type
export type AdminAuthResult =
  | { valid: true; userId?: string; method: "api_key" | "dev_mode" }
  | { valid: false; reason: string };

// Type guard functions for better type narrowing
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
 * Minimal, strong default:
 * - In production: requires ADMIN_API_KEY in env and a matching Bearer token.
 * - In development: allows through if NODE_ENV !== "production" and token missing (optional).
 */
export async function validateAdminAccess(
  req: NextApiRequest
): Promise<AdminAuthResult> {
  const adminKey = process.env.ADMIN_API_KEY;

  const token = getBearerToken(req);

  if (process.env.NODE_ENV !== "production") {
    // If you want dev to also require a key, remove this block.
    if (!adminKey) return { valid: true, method: "dev_mode" };
  }

  if (!adminKey) {
    return { valid: false, reason: "ADMIN_API_KEY is not configured" };
  }

  if (!token) {
    return { valid: false, reason: "Missing Authorization Bearer token" };
  }

  if (token !== adminKey) {
    return { valid: false, reason: "Invalid admin token" };
  }

  // Optional: allow caller to pass a stable admin id for audit trails
  const userId = (req.headers["x-admin-user-id"] as string | undefined)?.trim();

  return { valid: true, userId, method: "api_key" };
}

export function validateDateRange(input: {
  since: Date;
  until: Date;
  maxDays: number;
}): { ok: true } | { ok: false; message: string } {
  const { since, until, maxDays } = input;

  if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime())) {
    return { ok: false, message: "Invalid date format" };
  }
  if (since > until) {
    return { ok: false, message: "Start date must be before end date" };
  }
  const days =
    (until.getTime() - since.getTime()) / (1000 * 60 * 60 * 24);

  if (days > maxDays) {
    return { ok: false, message: `Date range too large (max ${maxDays} days)` };
  }

  return { ok: true };
}