/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";

// Dev-only diagnostic. Exposes internal content corpus structure (types, slugs,
// source paths). Must not be reachable in production — returns 404 outside development.
// Dynamic import keeps @/lib/content/server out of the production module graph even
// if the NODE_ENV guard were to fail at trace time.
export const config = {
  runtime: "nodejs",
};

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ error: "Not found" });
  }

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
