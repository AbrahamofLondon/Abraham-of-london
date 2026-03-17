/* lib/downloads/security.ts — DOWNLOAD SECURITY (SYNCHRONIZED) */

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, normalizeRequiredTier, hasAccess } from "@/lib/access/tier-policy";
import crypto from "crypto";

export interface DownloadToken {
  token: string; // signed payload token (sig:tier:expiresAtMs:nonce)
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

/**
 * Robust secret retrieval
 */
function getSecret(): string {
  const secret = process.env.DOWNLOAD_SECRET || process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("[CRITICAL] Download security secret is missing in production.");
  }
  return secret || "default-secret-dev-only";
}

/**
 * Token format (colon-delimited):
 * sig:tier:expiresAtMs:nonce
 */
function signPayload(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex")
    .substring(0, 32);
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(String(a), "hex");
  const bb = Buffer.from(String(b), "hex");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Generate a secure download token for the Abraham of London protocol
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
 * Verify download token with enhanced return type for API auditing
 */
export function verifyDownloadToken(
  token: string,
  resourceId: string,
  requiredTier?: string | AccessTier
): { 
  valid: boolean; 
  reason?: string; 
  slug?: string; 
  requiredTier?: string; 
  exp?: number; 
  nonce?: string;
  payload?: any; // Add payload field for token data
} {
  try {
    const parts = String(token || "").split(":");
    if (parts.length !== 4) {
      return { valid: false, reason: "INVALID_TOKEN_FORMAT" };
    }

    const [sig, tierRaw, expiresRaw, nonce] = parts;
    const expiresAtMs = Number(expiresRaw);
    const tier = normalizeUserTier(tierRaw);

    // Prepare context for the API logDownloadEvent even if valid is false
    const payloadContext = {
      slug: resourceId,
      requiredTier: tierRaw,
      exp: expiresAtMs,
      nonce: nonce,
      payload: { tid: nonce, rid: resourceId, tier: tierRaw, exp: expiresAtMs / 1000 },
    };

    if (!sig || !tierRaw || !expiresRaw || !nonce) {
      return { valid: false, reason: "MALFORMED_COMPONENTS", ...payloadContext };
    }

    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= 0) {
      return { valid: false, reason: "INVALID_EXPIRY_TIMESTAMP", ...payloadContext };
    }

    if (Date.now() > expiresAtMs) {
      return { valid: false, reason: "TOKEN_EXPIRED", ...payloadContext };
    }

    // Verify HMAC Signature (Constant-Time)
    const payload = `${resourceId}:${tier}:${expiresAtMs}:${nonce}`;
    const expectedSig = signPayload(payload);

    if (!safeEqualHex(sig, expectedSig)) {
      return { valid: false, reason: "INVALID_SIGNATURE", ...payloadContext };
    }

    // Tier Authorization Check
    if (requiredTier) {
      const required = normalizeRequiredTier(requiredTier);
      if (!hasAccess(tier, required)) {
        return { valid: false, reason: "INSUFFICIENT_TIER_FOR_RESOURCE", ...payloadContext };
      }
    }

    return { valid: true, ...payloadContext };
  } catch (error) {
    console.error("[Download Security] Critical Verification Failure:", error);
    return { valid: false, reason: "VERIFICATION_EXCEPTION" };
  }
}

/**
 * Extract forensic data from token metadata
 * Provides backward compatibility for routes expecting premium token forensics
 */
export function getTokenForensics(
  metadata: Record<string, unknown> | null | undefined,
): {
  watermarkId: string | null;
  expectedFooter: string | null;
  fingerprint: string | null;
} {
  const base = metadata ?? {};
  const forensics =
    base.forensics &&
    typeof base.forensics === "object" &&
    !Array.isArray(base.forensics)
      ? (base.forensics as Record<string, unknown>)
      : {};

  return {
    watermarkId:
      typeof forensics.watermarkId === "string" ? forensics.watermarkId : null,
    expectedFooter:
      typeof forensics.expectedFooter === "string"
        ? forensics.expectedFooter
        : null,
    fingerprint:
      typeof forensics.fingerprint === "string" ? forensics.fingerprint : null,
  };
}

/**
 * Extract user tier from cookies (SSOT)
 * Expects NextApiRequest-like object: { headers: { cookie: string } }
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
 * Logic check for tier hierarchies
 */
export function tierAtLeast(userTier: string | AccessTier | null | undefined, requiredTier: AccessTier): boolean {
  return hasAccess(userTier, requiredTier);
}

/**
 * High-level check for download eligibility
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
    return { allowed: false, reason: "TIER_NOT_IN_POLICY_WHITELIST" };
  }

  if (!hasAccess(normalizedUser, normalizedRequired)) {
    return { allowed: false, reason: "INSUFFICIENT_ACCESS_LEVEL" };
  }

  return { allowed: true };
}

/**
 * Formats a signed URL for redemption
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