// pages/api/frameworks/surrender/[slug].ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiRequest, NextApiResponse } from "next";

import { getDocBySlug, getAllCombinedDocs, normalizeSlug } from "@/lib/content/server";
import { sendCompressedBodyCode } from "@/lib/content/api-payload";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";

type Ok = {
  ok: true;
  tier: AccessTier;
  requiredTier: AccessTier;
  bodyCode: string;
  compressed: true;
  encoding: "gzip-base64";
  slugResolved: string;
};

type Fail = {
  ok: false;
  reason: string;
  tried?: string[];
};

type ResponseData = Ok | Fail;

function norm(input: unknown): string {
  return String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function pick(req: NextApiRequest): string {
  const raw = req.query.slug;
  const joined = Array.isArray(raw) ? raw.join("/") : String(raw || "");
  return norm(joined);
}

function isSurrenderFrameworkDoc(doc: any): boolean {
  const dir = String(doc?._raw?.sourceFileDir || "").toLowerCase().replace(/\\/g, "/");
  const flat = String(doc?._raw?.flattenedPath || "").toLowerCase().replace(/\\/g, "/");
  const slug = String(doc?.slug || "").toLowerCase().replace(/\\/g, "/");

  return (
    dir.includes("resources/surrender-framework") ||
    flat.startsWith("resources/surrender-framework/") ||
    slug.startsWith("resources/surrender-framework/")
  );
}

function resolveDoc(slug: string): { doc: any | null; tried: string[] } {
  const cleaned = normalizeSlug(slug);
  const tries = [
    `resources/surrender-framework/${cleaned}`,
    `content/resources/surrender-framework/${cleaned}`,
    `surrender-framework/${cleaned}`,
    cleaned,
  ].map(norm);

  const [t0, t1, t2, t3] = tries;

  let doc =
    (t0 ? getDocBySlug(t0) : null) ||
    (t1 ? getDocBySlug(t1) : null) ||
    (t2 ? getDocBySlug(t2) : null) ||
    (t3 ? getDocBySlug(t3) : null) ||
    null;

  if (!doc) {
    const all = getAllCombinedDocs?.() || [];
    const wanted = tries.map((x) => x.toLowerCase());

    doc =
      all.find((d: any) => {
        const a = norm(d?.slug).toLowerCase();
        const b = norm(d?._raw?.flattenedPath).toLowerCase();
        const c = norm(d?._raw?.sourceFilePath).toLowerCase();
        return wanted.includes(a) || wanted.includes(b) || wanted.includes(c);
      }) || null;
  }

  return { doc, tried: tries };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  const slug = pick(req);
  if (!slug || slug.includes("..")) {
    return res.status(400).json({ ok: false, reason: "INVALID_SLUG" });
  }

  const { doc, tried } = resolveDoc(slug);

  if (!doc || doc.draft || !isSurrenderFrameworkDoc(doc)) {
    return res.status(404).json({ ok: false, reason: "NOT_FOUND", tried });
  }

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const bodyCode = String(doc?.body?.code || doc?.bodyCode || "");
  const slugResolved = norm(String(doc?.slug || doc?._raw?.flattenedPath || slug));

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