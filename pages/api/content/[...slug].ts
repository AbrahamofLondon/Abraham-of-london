import type { NextApiRequest, NextApiResponse } from "next";

import { getRenderableBody } from "@/lib/content/render-body";

import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function cleanSlug(input: string[]): string {
  return input.join("/").replace(/\\/g, "/").replace(/\.\./g, "");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const slugParts = req.query.slug as string[];
    const slug = cleanSlug(slugParts);

    if (!slug) {
      return res.status(400).json({ ok: false });
    }

    const { getDocBySlug } = await import("@/lib/content/server");
    const doc =
      getDocBySlug(slug) ||
      getDocBySlug(`content/${slug}`);

    if (!doc || doc.draft) {
      return res.status(404).json({ ok: false });
    }

    const requiredTier = normalizeRequiredTier(requiredTierFromDoc(doc));

    if (requiredTier === "public") {
      return res.json({
        ok: true,
        bodyCode: getRenderableBody(doc).code || "",
      });
    }

    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({ ok: false });
    }

    const userTier = normalizeUserTier((session.user as any)?.tier);

    if (!hasAccess(userTier, requiredTier)) {
      return res.status(403).json({ ok: false });
    }

    return res.json({
      ok: true,
      bodyCode: getRenderableBody(doc).code || "",
    });

  } catch {
    return res.status(500).json({ ok: false });
  }
}