// pages/api/canon/[slug].ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiRequest, NextApiResponse } from "next";

import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { sendCompressedBodyCode } from "@/lib/content/api-payload";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type OkResponse = {
  ok: true;
  tier: AccessTier;
  requiredTier: AccessTier;
  bodyCode: string;
  compressed: true;
  encoding: "gzip-base64";
  slugResolved: string;
};

type FailResponse = {
  ok: false;
  reason: string;
  tried?: string[];
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

function stripPrefixOnce(source: string, prefix: string): string {
  const normalizedPrefix = `${prefix.toLowerCase()}/`;
  if (source.toLowerCase().startsWith(normalizedPrefix)) {
    return source.slice(normalizedPrefix.length).replace(/^\/+/, "");
  }
  return source;
}

function canonBareSlug(input: unknown): string {
  let s = cleanPathish(input);
  if (!s || s.includes("..")) return "";

  let changed = true;
  while (changed) {
    changed = false;

    const nextA = stripPrefixOnce(s, "content");
    if (nextA !== s) {
      s = nextA;
      changed = true;
    }

    const nextB = stripPrefixOnce(s, "vault");
    if (nextB !== s) {
      s = nextB;
      changed = true;
    }

    const nextC = stripPrefixOnce(s, "canon");
    if (nextC !== s) {
      s = nextC;
      changed = true;
    }
  }

  s = cleanPathish(s);
  return !s || s.includes("..") ? "" : s;
}

async function getAllCanonDocuments(): Promise<any[]> {
  const { allCanons, allDocuments } = await import("contentlayer/generated");

  if (Array.isArray(allCanons) && allCanons.length > 0) {
    return allCanons;
  }

  if (Array.isArray(allDocuments)) {
    return allDocuments.filter((doc: any) => {
      const docType = String(
        doc?.type || doc?.docType || doc?._raw?.sourceFilePath?.split("/")[0] || "",
      ).toLowerCase();

      return docType === "canon";
    });
  }

  return [];
}

function extractBodyCode(doc: any): string {
  return String(doc?.body?.code || doc?.bodyCode || "");
}

async function resolveCanonDoc(bare: string): Promise<{ doc: any | null; tried: string[] }> {
  const tryCanon = cleanPathish(`canon/${bare}`);
  const tryContentCanon = cleanPathish(`content/canon/${bare}`);
  const tryVaultCanon = cleanPathish(`vault/canon/${bare}`);
  const tryBare = cleanPathish(bare);

  const tried = [tryCanon, tryContentCanon, tryVaultCanon, tryBare];

  const allCanonDocs = await getAllCanonDocuments();

  const direct =
    allCanonDocs.find((doc: any) => {
      if (doc?.draft) return false;

      const fp = cleanPathish(doc?._raw?.flattenedPath || "");
      const slug = cleanPathish(doc?.slug || doc?.slugSafe || "");
      const href = cleanPathish(doc?.href || doc?.hrefSafe || "");

      return (
        fp === tryCanon ||
        fp === tryContentCanon ||
        fp === tryVaultCanon ||
        slug === tryBare ||
        slug === tryCanon ||
        href === tryCanon ||
        href === tryBare
      );
    }) || null;

  if (direct) {
    return { doc: direct, tried };
  }

  const { getDocBySlug } = await import("@/lib/content/server");
  const fallback =
    getDocBySlug(tryCanon) ||
    getDocBySlug(tryContentCanon) ||
    getDocBySlug(tryVaultCanon) ||
    getDocBySlug(tryBare) ||
    null;

  return { doc: fallback, tried };
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

  const raw = req.query.slug;
  const joined = Array.isArray(raw) ? raw.join("/") : safeStr(raw);
  const bare = canonBareSlug(joined);

  if (!bare) {
    return res.status(400).json({
      ok: false,
      reason: "SLUG_MISSING",
    });
  }

  const { doc, tried } = await resolveCanonDoc(bare);

  if (!doc || doc.draft) {
    return res.status(404).json({
      ok: false,
      reason: "MANUSCRIPT_NOT_FOUND",
      tried,
    });
  }

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const slugResolved = canonBareSlug(
    doc?.slug || doc?.slugSafe || doc?._raw?.flattenedPath || bare,
  );
  const bodyCode = extractBodyCode(doc);

  if (requiredTier === "public") {
    return sendCompressedBodyCode(
      res,
      {
        ok: true,
        tier: "public",
        requiredTier: "public",
        slugResolved,
        bodyCode,
      },
      200,
    );
  }

  const sessionId = readAccessCookie(req);
  if (!sessionId) {
    return res.status(401).json({
      ok: false,
      reason: "CLEARANCE_REQUIRED",
    });
  }

  const session = await verifySession(sessionId);
  if (!session || !session.valid) {
    return res.status(401).json({
      ok: false,
      reason: "SESSION_INVALID",
    });
  }

  const userTier = tiers.normalizeUser(session.tier);
  if (!tiers.hasAccess(userTier, requiredTier)) {
    return res.status(403).json({
      ok: false,
      reason: "INSUFFICIENT_CLEARANCE",
    });
  }

  return sendCompressedBodyCode(
    res,
    {
      ok: true,
      tier: userTier,
      requiredTier,
      slugResolved,
      bodyCode,
    },
    200,
  );
}

export const config = {
  api: {
    responseLimit: false,
  },
};