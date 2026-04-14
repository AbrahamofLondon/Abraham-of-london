/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";

// Dev-only diagnostic. Dynamic import keeps contentlayer/generated out
// of the module graph at build time so this file cannot drag the full
// content corpus into a production server chunk even if the NODE_ENV
// guard fails to evaluate at trace time.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ error: "Not found" });
  }

  const Contentlayer = await import("contentlayer/generated");

  const exports = Object.keys(Contentlayer);
  const arrays = exports.filter((key) => Array.isArray((Contentlayer as any)[key]));
  const arrayLengths: Record<string, number> = {};

  for (const key of arrays) {
    arrayLengths[key] = (Contentlayer as any)[key]?.length || 0;
  }

  // Find canon-related exports
  const canonExports = exports.filter((key) =>
    key.toLowerCase().includes("canon"),
  );

  // Get sample of canon documents if available
  let sampleDocs: any[] = [];
  for (const exportName of canonExports) {
    const data = (Contentlayer as any)[exportName];
    if (Array.isArray(data) && data.length > 0) {
      sampleDocs = data.slice(0, 2).map((doc: any) => ({
        id: doc._id,
        type: doc.type,
        slug: doc.slug,
        flattenedPath: doc._raw?.flattenedPath,
        title: doc.title,
      }));
      break;
    }
  }

  return res.status(200).json({
    allExports: exports,
    arraysWithLengths: arrayLengths,
    canonRelatedExports: canonExports,
    sampleCanonDocuments: sampleDocs,
  });
}
