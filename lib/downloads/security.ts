/* lib/downloads/security.ts — DOWNLOAD SECURITY (SSOT, STRICT TS, FORMAT-CONSISTENT) */

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, normalizeRequiredTier, hasAccess } from "@/lib/access/tier-policy";
import crypto from "crypto";

export interface DownloadToken {
  token: string; // signed payload token (colon-delimited)
  resourceId: string;
  userId?: string;
  tier: AccessTier;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface DownloadPolicy {
  maxDownloads?: number;
  requireAuth: boolean;
  allowedTiers: AccessTier[];
  ipRestriction?: boolean;
  expirationSeconds?: number;
}

const DEFAULT_POLICY: DownloadPolicy = {
  maxDownloads: 5,
  requireAuth: true,
  allowedTiers: ["member", "inner-circle", "client", "legacy", "architect", "owner"],
  ipRestriction: true,
  expirationSeconds: 3600, // 1 hour
};

function getSecret(): string {
  // fail-safe: keep build working, but you SHOULD set DOWNLOAD_SECRET in prod
  return process.env.DOWNLOAD_SECRET || "default-secret";
}

/**
 * Token format (colon-delimited):
 *   sig:tier:expiresAtMs:nonce
 *
 * Where:
 * - sig = HMAC-SHA256(payload) truncated (hex)
 * - payload = `${resourceId}:${tier}:${expiresAtMs}:${nonce}`
 */
function signPayload(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex").substring(0, 32);
}

function safeEqualHex(a: string, b: string): boolean {
  // constant-time compare; length mismatch should fail safely
  const ba = Buffer.from(String(a), "hex");
  const bb = Buffer.from(String(b), "hex");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Generate a secure download token
 */
export function generateDownloadToken(
  resourceId: string,
  userTier: string | AccessTier,
  options?: {
    userId?: string;
    expiresInSeconds?: number;
    metadata?: Record<string, any>;
  }
): DownloadToken {
  const tier = normalizeUserTier(userTier);
  const expiresInSeconds = options?.expiresInSeconds ?? DEFAULT_POLICY.expirationSeconds!;
  const expiresAtMs = Date.now() + expiresInSeconds * 1000;
  const expiresAt = new Date(expiresAtMs);

  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${resourceId}:${tier}:${expiresAtMs}:${nonce}`;
  const sig = signPayload(payload);

  // final token is parseable by verifyDownloadToken()
  const token = `${sig}:${tier}:${expiresAtMs}:${nonce}`;

  return {
    token,
    resourceId,
    userId: options?.userId,
    tier,
    expiresAt,
    metadata: options?.metadata,
  };
}

/**
 * Verify download token
 */
export function verifyDownloadToken(
  token: string,
  resourceId: string,
  requiredTier?: string | AccessTier
): { valid: boolean; reason?: string } {
  try {
    const parts = String(token || "").split(":");
    if (parts.length !== 4) {
      return { valid: false, reason: "INVALID_TOKEN_FORMAT" };
    }

    const [sig, tierRaw, expiresRaw, nonce] = parts;

    if (!sig || !tierRaw || !expiresRaw || !nonce) {
      return { valid: false, reason: "INVALID_TOKEN_FORMAT" };
    }

    const expiresAtMs = Number(expiresRaw);
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= 0) {
      return { valid: false, reason: "INVALID_EXPIRY" };
    }
    if (Date.now() > expiresAtMs) {
      return { valid: false, reason: "TOKEN_EXPIRED" };
    }

    const tier = normalizeUserTier(tierRaw);

    // Verify signature (constant-time)
    const payload = `${resourceId}:${tier}:${expiresAtMs}:${nonce}`;
    const expectedSig = signPayload(payload);

    if (!safeEqualHex(sig, expectedSig)) {
      return { valid: false, reason: "INVALID_SIGNATURE" };
    }

    // Check tier requirement if specified
    if (requiredTier) {
      const required = normalizeRequiredTier(requiredTier);
      if (!hasAccess(tier, required)) {
        return { valid: false, reason: `INSUFFICIENT_TIER: ${tier} cannot access ${required}` };
      }
    }

    return { valid: true };
  } catch (error) {
    console.error("[Download Security] Verification error:", error);
    return { valid: false, reason: "VERIFICATION_FAILED" };
  }
}

export function tierAtLeast(userTier: string | AccessTier | null | undefined, requiredTier: AccessTier): boolean {
  return hasAccess(userTier, requiredTier);
}

/**
 * Extract user tier from cookies (SSOT)
 */
export function getUserTierFromCookies(req: any): AccessTier {
  const cookieHeader = req?.headers?.cookie || "";
  const cookies: Record<string, string> = {};

  cookieHeader.split(";").forEach((part: string) => {
    const [key, ...val] = part.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(val.join("=") || "");
  });

  const rawTier =
    cookies.aol_tier ||
    cookies.aol_ic_tier ||
    cookies.inner_circle_tier ||
    cookies.ic_tier ||
    "public";

  return normalizeUserTier(rawTier);
}

/**
 * Check if user can download resource
 */
export function canDownload(
  userTier: string | AccessTier | null | undefined,
  resourceTier: string | AccessTier,
  policy: Partial<DownloadPolicy> = {}
): { allowed: boolean; reason?: string } {
  if (!userTier && (policy.requireAuth ?? DEFAULT_POLICY.requireAuth)) {
    return { allowed: false, reason: "AUTHENTICATION_REQUIRED" };
  }

  const normalizedUser = userTier ? normalizeUserTier(userTier) : "public";
  const normalizedRequired = normalizeRequiredTier(resourceTier);

  const allowedTiers = policy.allowedTiers ?? DEFAULT_POLICY.allowedTiers;
  if (!allowedTiers.includes(normalizedUser)) {
    return { allowed: false, reason: `TIER_NOT_ALLOWED: ${normalizedUser} not in allowed tiers` };
  }

  if (!hasAccess(normalizedUser, normalizedRequired)) {
    return { allowed: false, reason: `INSUFFICIENT_TIER: ${normalizedUser} cannot access ${normalizedRequired}` };
  }

  return { allowed: true };
}

/**
 * Create signed download URL
 */
export function createSignedDownloadUrl(
  baseUrl: string,
  resourceId: string,
  userTier: string | AccessTier,
  options?: {
    userId?: string;
    expiresInSeconds?: number;
    metadata?: Record<string, any>;
  }
): string {
  const tok = generateDownloadToken(resourceId, userTier, options);

  const url = new URL(baseUrl);
  url.searchParams.set("token", tok.token);
  url.searchParams.set("expires", tok.expiresAt.getTime().toString());
  if (options?.userId) url.searchParams.set("uid", options.userId.substring(0, 8));

  return url.toString();
}

/**
 * Rate limiting key for downloads
 */
export function getDownloadRateLimitKey(ip: string, userId?: string, resourceId?: string): string {
  const parts: string[] = ["download"];
  if (userId) parts.push(`user:${userId}`);
  if (resourceId) parts.push(`res:${resourceId}`);
  parts.push(`ip:${ip}`);
  return parts.join(":");
}