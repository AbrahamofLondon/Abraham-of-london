// pages/api/briefs/[slug].ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { normalizeSlug } from "@/lib/content/shared";
import { getRenderableBody } from "@/lib/content/render-body";
import { sendCompressedBodyCode } from "@/lib/content/api-payload";

import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

type OkResponse = {
  ok: true;
  bodyCode: string;
  compressed: true;
  encoding: "gzip-base64";
  requiredTier: string;
  tier: string;
  slugResolved: string;
};

type FailResponse = {
  ok: false;
  reason: string;
};

function cleanSlug(input: unknown): string {
  const s = String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  if (!s || s.includes("..")) return "";
  return s.split("/").filter(Boolean).pop() || "";
}

function isBriefDoc(doc: any): boolean {
  if (!doc) return false;

  const path = String(doc?._raw?.flattenedPath || "").toLowerCase();
  const source = String(doc?._raw?.sourceFilePath || "").toLowerCase();
  const slug = String(doc?.slug || "").toLowerCase();
  const kind = String(doc?.kind || doc?.type || doc?.docKind || "").toLowerCase();

  return (
    kind.includes("brief") ||
    path.startsWith("briefs/") ||
    path.startsWith("vault/briefs/") ||
    path.startsWith("content/briefs/") ||
    source.startsWith("briefs/") ||
    source.startsWith("vault/briefs/") ||
    source.startsWith("content/briefs/") ||
    slug.startsWith("briefs/") ||
    slug.startsWith("vault/briefs/")
  );
}

async function resolveBriefDoc(slug: string): Promise<any | null> {
  const { getAllCombinedDocs } = await import("@/lib/content/server");
  const docs = getAllCombinedDocs() || [];

  return (
    docs.find((d: any) => {
      if (!isBriefDoc(d) || d?.draft) return false;

      const flattened = normalizeSlug(String(d?._raw?.flattenedPath || ""));
      const source = normalizeSlug(String(d?._raw?.sourceFilePath || ""));
      const docSlug = normalizeSlug(String(d?.slug || ""));

      return (
        flattened.endsWith(`/${slug}`) ||
        flattened === slug ||
        source.endsWith(`/${slug}`) ||
        source === slug ||
        docSlug.endsWith(`/${slug}`) ||
        docSlug === slug
      );
    }) || null
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkResponse | FailResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  try {
    const slug = cleanSlug(req.query.slug);

    if (!slug) {
      return res.status(400).json({ ok: false, reason: "INVALID_SLUG" });
    }

    const doc = await resolveBriefDoc(slug);

    if (!doc || doc.draft) {
      return res.status(404).json({ ok: false, reason: "NOT_FOUND" });
    }

    const requiredTier = normalizeRequiredTier(requiredTierFromDoc(doc));
    const body = getRenderableBody(doc);
    const bodyCode = body.code || "";

    if (requiredTier === "public") {
      return sendCompressedBodyCode(
        res,
        {
          ok: true,
          tier: "public",
          requiredTier,
          slugResolved: slug,
          bodyCode,
        },
        200,
      );
    }

    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({
        ok: false,
        reason: "AUTH_REQUIRED",
      });
    }

    const userTier = normalizeUserTier((session.user as any)?.tier ?? "public");

    if (!hasAccess(userTier, requiredTier)) {
      return res.status(403).json({
        ok: false,
        reason: "INSUFFICIENT_TIER",
      });
    }

    return sendCompressedBodyCode(
      res,
      {
        ok: true,
        tier: userTier,
        requiredTier,
        slugResolved: slug,
        bodyCode,
      },
      200,
    );
  } catch (err) {
    console.error("[BRIEF_API_ERROR]", err);

    return res.status(500).json({
      ok: false,
      reason: "SERVER_ERROR",
    });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};