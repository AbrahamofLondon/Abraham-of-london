/**
 * GET /api/downloads/instrument-pdf?slug=decision-exposure-instrument
 *
 * Controlled PDF delivery for paid instruments.
 * Reads from private/assets/paid-instruments/[slug].pdf.
 * No entitlement check for now (PDF is secondary to interactive instrument).
 */

import type { NextApiRequest, NextApiResponse } from "next";
import * as fs from "fs";
import * as path from "path";

const ALLOWED_SLUGS = new Set([
  "decision-exposure-instrument",
  "mandate-clarity-framework",
  "intervention-path-selector",
]);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const slug = typeof req.query.slug === "string" ? req.query.slug.trim() : "";
  if (!slug || !ALLOWED_SLUGS.has(slug)) {
    return res.status(404).json({ error: "Instrument not found" });
  }

  const filePath = path.join(process.cwd(), "private", "assets", "paid-instruments", `${slug}.pdf`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "PDF not available" });
  }

  const stat = fs.statSync(filePath);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Content-Disposition", `attachment; filename="${slug}.pdf"`);
  res.setHeader("Cache-Control", "private, max-age=3600");

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}
