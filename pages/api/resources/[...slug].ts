// pages/api/resources/[...slug].ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiRequest, NextApiResponse } from "next";

import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";
import {
  getDocBySlug,
  getAllContentlayerDocs,
  normalizeSlug,
} from "@/lib/content/server";
import { sendCompressedBodyCode } from "@/lib/content/api-payload";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type ResponseData =
  | {
      ok: true;
      tier: AccessTier;
      requiredTier: AccessTier;
      bodyCode: string;
      compressed: true;
      encoding: "gzip-base64";
      slugResolved: string;
    }
  | {
      ok: false;
      reason: string;
      tried?: string[];
    };

function pickSlug(req: NextApiRequest): string {
  const raw = req.query.slug;
  const joined = Array.isArray(raw) ? raw.join("/") : String(raw || "");
  return normalizeSlug(joined);
}

function isResourceDoc(doc: any): boolean {
  if (!doc) return false;

  const docKind = String(doc?.docKind || "").toLowerCase();
  if (docKind === "lexicon") return false;
  if (docKind === "resource") return true;

  const kind = String(doc?.kind || doc?.type || "").toLowerCase();
  if (kind === "resource") return true;

  const fp = String(doc?._raw?.flattenedPath || doc?._raw?.sourceFilePath || "").toLowerCase();
  return fp.startsWith("resources/") || fp.startsWith("content/resources/");
}

function normalizePathish(s: string): string {
  return String(s || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function findByRegistryScan(wanted: string): any | null {
  const w = normalizePathish(wanted);
  if (!w) return null;

  const all = getAllContentlayerDocs?.() || [];
  const lowerW = w.toLowerCase();

  return (
    all.find((d: any) => {
      const a = normalizePathish(String(d?.slug || ""));
      const b = normalizePathish(String(d?._raw?.flattenedPath || ""));
      const c = normalizePathish(String(d?._raw?.sourceFilePath || ""));
      const hay = [a, b, c].filter(Boolean).map((x) => x.toLowerCase());

      return (
        hay.includes(lowerW) ||
        hay.includes(`content/${lowerW}`) ||
        hay.includes(lowerW.replace(/^content\//, "")) ||
        hay.includes(`resources/${lowerW}`) ||
        hay.includes(`content/resources/${lowerW}`)
      );
    }) || null
  );
}

function firstDocBySlug(candidates: string[]): any | null {
  for (const candidate of candidates) {
    const doc = getDocBySlug(candidate);
    if (doc) return doc;
  }
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  const slug = pickSlug(req);
  if (!slug) {
    return res.status(400).json({ ok: false, reason: "SLUG_MISSING" });
  }

  const tries = [
    `resources/${slug}`,
    `content/resources/${slug}`,
    slug,
    slug.replace(/^resources\//, ""),
    `resources/${slug.replace(/^resources\//, "")}`,
  ].map(normalizePathish);

  let doc: any = firstDocBySlug(tries);

  if (!doc) {
    for (const t of tries) {
      doc = findByRegistryScan(t);
      if (doc) break;
    }
  }

  if (!doc || doc.draft) {
    return res.status(404).json({ ok: false, reason: "NOT_FOUND", tried: tries });
  }

  if (!isResourceDoc(doc)) {
    return res.status(404).json({ ok: false, reason: "NOT_A_RESOURCE", tried: tries });
  }

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const bodyCode = String(doc?.body?.code || doc?.bodyCode || "");
  const slugResolved = normalizePathish(
    String(doc?.slug || doc?._raw?.flattenedPath || slug),
  );

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

  const sessionId = getAccessCookie(req);
  if (!sessionId) {
    return res.status(401).json({ ok: false, reason: "CLEARANCE_REQUIRED" });
  }

  const session = await verifySession(sessionId);
  if (!session || !session.valid) {
    return res.status(401).json({ ok: false, reason: "SESSION_INVALID" });
  }

  const userTier = tiers.normalizeUser(session.tier);
  if (!tiers.hasAccess(userTier, requiredTier)) {
    return res.status(403).json({ ok: false, reason: "INSUFFICIENT_CLEARANCE" });
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