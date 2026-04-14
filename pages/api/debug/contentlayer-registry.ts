/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";

// ✅ Force Node.js runtime (prevents Edge runtime from breaking fs)
export const config = {
  runtime: "nodejs",
};

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const { getAllContentlayerDocs, getAllCanons } = await import(
    "@/lib/content/server"
  );

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
