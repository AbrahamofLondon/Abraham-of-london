/**
 * GET /api/downloads/instrument-pdf?slug=decision-exposure-instrument
 *
 * Controlled PDF delivery for paid instruments.
 * Reads from private/assets/paid-instruments/[slug].pdf.
 * No entitlement check for now (PDF is secondary to interactive instrument).
 */

import type { NextApiRequest, NextApiResponse } from "next";

const ALLOWED_SLUGS = new Set([
  "decision-exposure-instrument",
  "mandate-clarity-framework",
  "intervention-path-selector",
  "operator-decision-pack",
]);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const slug = typeof req.query.slug === "string" ? req.query.slug.trim() : "";
  if (!slug || !ALLOWED_SLUGS.has(slug)) {
    return res.status(404).json({ error: "Instrument not found" });
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Location", `/api/downloads/${encodeURIComponent(slug)}`);
  return res.status(307).end();
}
