/* pages/api/briefs/[slug].ts — SECURE BRIEF UNLOCK (SSOT, Pages Router) */

import type { NextApiRequest, NextApiResponse } from "next";

import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { readAccessCookie } from "@/lib/server/auth/cookies";

import {
  getDocBySlug,
  getAllCombinedDocs,
  normalizeSlug,
} from "@/lib/content/server";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type OkResponse = {
  ok: true;
  tier: AccessTier;
  requiredTier: AccessTier;
  bodyCode: string;
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

function briefsBareSlug(input: unknown): string {
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

    const nextC = stripPrefixOnce(s, "briefs");
    if (nextC !== s) {
      s = nextC;
      changed = true;
    }
  }

  s = cleanPathish(s);
  return !s || s.includes("..") ? "" : s;
}

function extractBodyCode(doc: unknown): string {
  const value = doc as {
    body?: { code?: unknown };
    bodyCode?: unknown;
    content?: unknown;
    mdx?: unknown;
    bodyRaw?: unknown;
  } | null;

  return safeStr(
    value?.body?.code ??
      value?.bodyCode ??
      value?.content ??
      value?.mdx ??
      value?.bodyRaw ??
      "",
  );
}

function isBriefDoc(doc: any): boolean {
  if (!doc) return false;

  const docKind = safeStr(doc?.docKind).toLowerCase();
  const type = safeStr(doc?.type || doc?._type).toLowerCase();
  const kind = safeStr(doc?.kind).toLowerCase();
  const category = safeStr(doc?.category).toLowerCase();
  const series = safeStr(doc?.series).toLowerCase();
  const flattened = safeStr(doc?._raw?.flattenedPath).toLowerCase();
  const sourceFilePath = safeStr(doc?._raw?.sourceFilePath).toLowerCase();
  const slug = safeStr(doc?.slug).toLowerCase();

  if (docKind === "brief") return true;
  if (type === "brief") return true;
  if (kind === "brief") return true;
  if (category.includes("brief")) return true;
  if (series.includes("brief")) return true;

  if (flattened.startsWith("briefs/")) return true;
  if (flattened.startsWith("content/briefs/")) return true;
  if (flattened.startsWith("vault/briefs/")) return true;

  if (sourceFilePath.startsWith("briefs/")) return true;
  if (sourceFilePath.startsWith("content/briefs/")) return true;
  if (sourceFilePath.startsWith("vault/briefs/")) return true;

  if (slug.startsWith("briefs/")) return true;
  if (slug.startsWith("content/briefs/")) return true;
  if (slug.startsWith("vault/briefs/")) return true;

  return false;
}

function resolveBriefDoc(bare: string): { doc: any | null; tried: string[] } {
  const tryBrief = cleanPathish(`briefs/${bare}`);
  const tryContentBrief = cleanPathish(`content/briefs/${bare}`);
  const tryVaultBrief = cleanPathish(`vault/briefs/${bare}`);
  const tryBare = cleanPathish(bare);
  const tryNormalized = cleanPathish(normalizeSlug(bare));

  const tried = [
    tryBrief,
    tryContentBrief,
    tryVaultBrief,
    tryBare,
    tryNormalized,
  ];

  const directCandidates = [
    getDocBySlug(tryBrief),
    getDocBySlug(tryContentBrief),
    getDocBySlug(tryVaultBrief),
    getDocBySlug(tryBare),
    getDocBySlug(tryNormalized),
  ];

  const direct = directCandidates.find((entry) => isBriefDoc(entry)) || null;
  if (direct) {
    return { doc: direct, tried };
  }

  const allDocs = getAllCombinedDocs() || [];
  const scanned =
    allDocs.find((entry: any) => {
      if (!entry || entry.draft) return false;
      if (!isBriefDoc(entry)) return false;

      const flattened = briefsBareSlug(entry?._raw?.flattenedPath || "");
      const slug = briefsBareSlug(entry?.slug || "");
      const sourcePath = briefsBareSlug(entry?._raw?.sourceFilePath || "");

      return flattened === bare || slug === bare || sourcePath === bare;
    }) || null;

  return { doc: scanned, tried };
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
  const bare = briefsBareSlug(joined);

  if (!bare) {
    return res.status(400).json({
      ok: false,
      reason: "SLUG_MISSING",
    });
  }

  const { doc, tried } = resolveBriefDoc(bare);

  if (!doc || doc.draft) {
    return res.status(404).json({
      ok: false,
      reason: "NOT_FOUND",
      tried,
    });
  }

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const slugResolved = briefsBareSlug(
    doc?.slug || doc?._raw?.flattenedPath || bare,
  );

  if (requiredTier === "public") {
    return res.status(200).json({
      ok: true,
      tier: "public",
      requiredTier: "public",
      bodyCode: extractBodyCode(doc),
      slugResolved,
    });
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

  return res.status(200).json({
    ok: true,
    tier: userTier,
    requiredTier,
    bodyCode: extractBodyCode(doc),
    slugResolved,
  });
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
};