/* pages/api/downloads/mdx.ts — RAW MDX GATE (SSOT, Pages Router) */

import type { NextApiRequest, NextApiResponse } from "next";

import { getSessionTier } from "@/lib/server/auth/tokenStore.redis";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";
import { getTokenForensics } from "@/lib/premium/download-token";

import { normalizeSlug } from "@/lib/content/shared";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeRequiredTier,
  normalizeUserTier,
  hasAccess,
  getTierLabel,
} from "@/lib/access/tier-policy";

type OkResponse = {
  ok: true;
  tier: AccessTier;
  requiredTier: AccessTier;
  mdx: string;
  tierLabel: string;
  watermarkId?: string | null;
  tokenId?: string | null;
  forensicFooter?: string | null;
};

type FailResponse = {
  ok: false;
  reason: string;
  requiredTier?: AccessTier;
};

type ResponseData = OkResponse | FailResponse;

function safeStr(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function cleanPathish(input: unknown): string {
  return safeStr(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function stripDownloadsPrefix(input: unknown): string {
  let s = cleanPathish(normalizeSlug(safeStr(input)));
  if (!s) return "";

  const lower = s.toLowerCase();
  if (lower.startsWith("downloads/")) {
    s = s.slice("downloads/".length).replace(/^\/+/, "");
  }

  s = cleanPathish(s);
  return s.includes("..") ? "" : s;
}

function rawMdxFromDoc(doc: unknown): string {
  const value = doc as {
    body?: { raw?: unknown } | unknown;
    content?: unknown;
    mdx?: unknown;
  } | null;

  if (typeof value?.body === "object" && value?.body && "raw" in value.body) {
    const raw = (value.body as { raw?: unknown }).raw;
    if (typeof raw === "string") return raw;
  }

  if (typeof value?.body === "string") return value.body;
  if (typeof value?.content === "string") return value.content;
  if (typeof value?.mdx === "string") return value.mdx;

  return "";
}

function extractWatermarkFromDoc(doc: any): {
  watermarkId?: string | null;
  tokenId?: string | null;
  forensicFooter?: string | null;
} {
  const metadata = doc?.metadata ?? doc?.forensics ?? {};

  const watermarkId = metadata?.watermarkId ?? doc?.watermarkId ?? null;
  const tokenId = metadata?.tokenId ?? doc?.tokenId ?? null;
  const forensicFooter = metadata?.expectedFooter ?? doc?.footer ?? null;

  if (tokenId && !watermarkId) {
    try {
      const forensics = getTokenForensics(metadata);
      return {
        watermarkId: forensics.watermarkId,
        tokenId,
        forensicFooter: forensics.expectedFooter,
      };
    } catch {
      return {
        watermarkId: null,
        tokenId,
        forensicFooter,
      };
    }
  }

  return {
    watermarkId,
    tokenId,
    forensicFooter,
  };
}

async function resolveDownloadDoc(slug: string): Promise<any | null> {
  const { getDocumentBySlug } = await import("@/lib/content/server");
  const tryDirect = cleanPathish(slug);
  const tryPrefixed = cleanPathish(`downloads/${slug}`);

  return getDocumentBySlug(tryDirect) || getDocumentBySlug(tryPrefixed) || null;
}

function requiredTierFromDownloadDoc(doc: any): AccessTier {
  return normalizeRequiredTier(
    doc?.accessLevelSafe ??
      doc?.accessLevel ??
      doc?.tier ??
      doc?.classification ??
      doc?.clearance ??
      "member",
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      reason: "METHOD_NOT_ALLOWED",
    });
  }

  const slug = stripDownloadsPrefix(req.query.slug);
  if (!slug) {
    return res.status(400).json({
      ok: false,
      reason: "SLUG_MISSING",
    });
  }

  try {
    const { isDraftContent } = await import("@/lib/content/server");
    const doc = await resolveDownloadDoc(slug);

    if (!doc || isDraftContent(doc)) {
      return res.status(404).json({
        ok: false,
        reason: "NOT_FOUND",
      });
    }

    const requiredTier = requiredTierFromDownloadDoc(doc);
    const mdx = rawMdxFromDoc(doc);

    if (!mdx) {
      return res.status(500).json({
        ok: false,
        reason: "INVALID_DOCUMENT_FORMAT",
      });
    }

    const { watermarkId, tokenId, forensicFooter } = extractWatermarkFromDoc(doc);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Vary", "Cookie");
    res.setHeader(
      "Cache-Control",
      requiredTier === "public"
        ? "public, s-maxage=300, stale-while-revalidate=600"
        : "no-store, no-cache, must-revalidate, private",
    );

    if (watermarkId) {
      res.setHeader("X-AOL-Watermark-Id", watermarkId);
    }

    if (tokenId) {
      res.setHeader("X-AOL-Token-Id", tokenId);
    }

    if (requiredTier === "public") {
      return res.status(200).json({
        ok: true,
        tier: "public",
        requiredTier: "public",
        mdx,
        tierLabel: getTierLabel("public"),
        watermarkId,
        tokenId,
        forensicFooter,
      });
    }

    const accessToken = getAccessTokenFromReq(req);
    if (!accessToken) {
      return res.status(401).json({
        ok: false,
        reason: "ACCESS_REQUIRED",
        requiredTier,
      });
    }

    const sessionTierRaw = await getSessionTier(accessToken);
    if (!sessionTierRaw) {
      return res.status(401).json({
        ok: false,
        reason: "SESSION_EXPIRED",
        requiredTier,
      });
    }

    const userTier = normalizeUserTier(sessionTierRaw);

    if (!hasAccess(userTier, requiredTier)) {
      return res.status(403).json({
        ok: false,
        reason: "INSUFFICIENT_ACCESS",
        requiredTier,
      });
    }

    return res.status(200).json({
      ok: true,
      tier: userTier,
      requiredTier,
      mdx,
      tierLabel: getTierLabel(userTier),
      watermarkId,
      tokenId,
      forensicFooter,
    });
  } catch (error) {
    console.error("[API_DOWNLOADS_MDX_ERROR]", error);

    return res.status(500).json({
      ok: false,
      reason: "SERVER_ERROR",
    });
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
};