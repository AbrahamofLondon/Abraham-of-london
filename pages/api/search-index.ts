// pages/api/search-index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { buildSearchIndex } from "@/lib/searchIndex";

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
): void {
  const index = buildSearchIndex();

  // Reasonable caching for static-ish content
  res.setHeader(
    "Cache-Control",
    "s-maxage=600, stale-while-revalidate=3600",
  );

  res.status(200).json(index);
}