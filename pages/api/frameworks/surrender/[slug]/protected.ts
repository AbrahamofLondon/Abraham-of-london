// pages/api/frameworks/surrender/[slug]/protected.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiRequest, NextApiResponse } from "next";

import { normalizeSlug } from "@/lib/content/shared";
import { sendCompressedBodyCode } from "@/lib/content/api-payload";
import { withInnerCircleAccess } from "@/lib/server/with-inner-circle-access";

type ProtectedRequest = NextApiRequest & {
  innerCircleAccess?: {
    hasAccess: boolean;
    tier: string;
    userId: string | null;
    sessionId: string | null;
  };
};

type SuccessResponse = {
  ok: true;
  tier: string;
  requiredTier: string;
  bodyCode: string;
  compressed: true;
  encoding: "gzip-base64";
  slugResolved: string;
};

type ErrorResponse = {
  ok: false;
  reason: string;
  tried?: string[];
};

type ApiResponse = SuccessResponse | ErrorResponse;

function norm(input: unknown): string {
  return String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function isSafeSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/i.test(slug) && !slug.includes("..");
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

async function resolveDoc(slug: string): Promise<{ doc: any | null; tried: string[] }> {
  const { getDocBySlug, getAllCombinedDocs } = await import("@/lib/content/server");
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

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      reason: "METHOD_NOT_ALLOWED",
    });
  }

  const raw = req.query.slug;
  const slug = Array.isArray(raw) ? raw.join("/") : String(raw || "");

  if (!slug || !isSafeSlug(slug)) {
    return res.status(400).json({
      ok: false,
      reason: "INVALID_SLUG",
    });
  }

  const { doc, tried } = await resolveDoc(slug);

  if (!doc || doc.draft || !isSurrenderFrameworkDoc(doc)) {
    return res.status(404).json({
      ok: false,
      reason: "NOT_FOUND",
      tried,
    });
  }

  const access = (req as ProtectedRequest).innerCircleAccess;
  const bodyCode = String(doc?.body?.code || doc?.bodyCode || "");
  const slugResolved = norm(String(doc?.slug || doc?._raw?.flattenedPath || slug));

  return sendCompressedBodyCode(
    res,
    {
      ok: true,
      tier: access?.tier ?? "inner_circle",
      requiredTier: "inner_circle",
      slugResolved,
      bodyCode,
    },
    200,
  );
}

export default withInnerCircleAccess(handler, {
  requireAuth: true,
  requiredTier: "inner_circle",
});

export const config = {
  api: {
    responseLimit: false,
  },
};
