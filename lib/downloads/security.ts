/* lib/downloads/security.ts — CANONICAL DOWNLOAD SECURITY WRAPPER */

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
} from "@/lib/access/tier-policy";

import {
  createDownloadToken,
  verifyDownloadToken as verifyPremiumDownloadToken,
  getTokenForensics as getPremiumTokenForensics,
} from "@/lib/premium/download-token";

export type DownloadGrantPayload = {
  slug: string;
  contentType: string;
  requiredTier: AccessTier;
  userTier: AccessTier;
  contentId: string;
  userId?: string;
  sessionId?: string;
  expiresInMs: number;
  maxDownloads: number;
  metadata?: Record<string, unknown>;
};

export type DownloadGrantToken = {
  token: string;
  tokenId: string | null;
  metadata?: Record<string, unknown> | null;
};

export type DownloadVerificationResult = {
  valid: boolean;
  reason?: string;
  slug?: string;
  contentType?: string;
  requiredTier?: AccessTier;
  contentId?: string;
  tokenId?: string | null;
  payload?: any;
  metadata?: Record<string, unknown> | null;
};

function safeTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toMs(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

export function getUserTierFromCookies(reqLike: {
  headers?: { cookie?: string | undefined };
}): AccessTier {
  const cookieHeader = String(reqLike?.headers?.cookie || "");
  const cookies: Record<string, string> = {};

  cookieHeader.split(";").forEach((part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return;
    cookies[key] = decodeURIComponent(rest.join("=") || "");
  });

  const rawTier =
    cookies.aol_tier ||
    cookies.aol_ic_tier ||
    cookies.inner_circle_tier ||
    cookies.ic_tier ||
    "public";

  return normalizeUserTier(rawTier);
}

export function canDownload(params: {
  userTier: unknown;
  requiredTier: unknown;
}): { allowed: boolean; reason?: string } {
  const userTier = normalizeUserTier(params.userTier);
  const requiredTier = normalizeRequiredTier(params.requiredTier);

  if (!hasAccess(userTier, requiredTier)) {
    return {
      allowed: false,
      reason: `INSUFFICIENT_ACCESS_LEVEL: ${userTier} < ${requiredTier}`,
    };
  }

  return { allowed: true };
}

export async function createDownloadGrantToken(
  input: DownloadGrantPayload,
): Promise<DownloadGrantToken> {
  const slug = safeTrim(input.slug);
  const contentType = safeTrim(input.contentType || "downloads");
  const requiredTier = normalizeRequiredTier(input.requiredTier);
  const userTier = normalizeUserTier(input.userTier);
  const contentId = safeTrim(input.contentId || slug);

  const expiresIn = toMs(input.expiresInMs, 5 * 60 * 1000);
  const maxDownloads =
    typeof input.maxDownloads === "number" && input.maxDownloads > 0
      ? input.maxDownloads
      : 1;

  const metadata = {
    ...(input.metadata || {}),
    slug,
    contentType,
    requiredTier,
    tier: userTier,
    forensics: {
      watermarkId: `wm_${contentType}_${slug}_${Date.now()}`,
      expectedFooter: `${slug} • ${requiredTier} • Abraham of London`,
    },
  };

  const token = await createDownloadToken({
    contentId,
    userId: input.userId,
    sessionId: input.sessionId,
    expiresIn,
    maxDownloads,
    metadata,
  });

  return {
    token: String((token as any)?.token || ""),
    tokenId: typeof (token as any)?.tokenId === "string" ? (token as any).tokenId : null,
    metadata: ((token as any)?.metadata || metadata) as Record<string, unknown>,
  };
}

export async function verifyDownloadGrantToken(
  rawToken: string,
): Promise<DownloadVerificationResult> {
  const token = safeTrim(rawToken);
  if (!token) {
    return { valid: false, reason: "MISSING_TOKEN" };
  }

  const verified = await verifyPremiumDownloadToken(token, "");

  if (!verified?.valid || !verified?.payload) {
    const md = (verified as any)?.payload?.md;
    return {
      valid: false,
      reason: verified?.reason || "TOKEN_INVALID",
      slug: typeof md?.slug === "string" ? md.slug : undefined,
      contentType: typeof md?.contentType === "string" ? md.contentType : undefined,
      requiredTier:
        typeof md?.requiredTier === "string"
          ? normalizeRequiredTier(md.requiredTier)
          : undefined,
      contentId: typeof (verified as any)?.payload?.rid === "string"
        ? (verified as any).payload.rid
        : undefined,
      tokenId:
        typeof (verified as any)?.payload?.tid === "string"
          ? (verified as any).payload.tid
          : null,
      metadata: md && typeof md === "object" ? md : null,
    };
  }

  const payload = verified.payload;
  const md =
    payload?.md && typeof payload.md === "object" && !Array.isArray(payload.md)
      ? payload.md
      : {};

  return {
    valid: true,
    slug: typeof md.slug === "string" ? md.slug : safeTrim(payload.rid),
    contentType: typeof md.contentType === "string" ? md.contentType : "downloads",
    requiredTier:
      typeof md.requiredTier === "string"
        ? normalizeRequiredTier(md.requiredTier)
        : normalizeRequiredTier(md.tier || "public"),
    contentId: safeTrim(payload.rid),
    tokenId: typeof payload.tid === "string" ? payload.tid : null,
    payload,
    metadata: md as Record<string, unknown>,
  };
}

export function getTokenForensics(
  metadata: Record<string, unknown> | null | undefined,
): {
  watermarkId: string | null;
  expectedFooter: string | null;
  fingerprint: string | null;
} {
  return getPremiumTokenForensics(metadata);
}

export default {
  getUserTierFromCookies,
  canDownload,
  createDownloadGrantToken,
  verifyDownloadGrantToken,
  getTokenForensics,
};