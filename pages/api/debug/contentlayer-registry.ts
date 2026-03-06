import type { NextApiRequest, NextApiResponse } from "next";
import { getAllContentlayerDocs, getAllCanons } from "@/lib/content/server";

// ✅ Force Node.js runtime (prevents Edge runtime from breaking fs)
export const config = {
  runtime: "nodejs",
};

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const docs = getAllContentlayerDocs() || [];
  const canons = getAllCanons() || [];

  const sample = docs.slice(0, 10).map((d: any) => ({
    type: d?.type,
    kind: d?.kind,
    slug: d?.slug,
    fp: d?._raw?.flattenedPath,
    sfp: d?._raw?.sourceFilePath,
  }));

  return res.status(200).json({
    ok: true,
    docs: docs.length,
    canons: canons.length,
    sample,
  });
}