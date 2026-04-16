// pages/api/pdfs/generate-all.ts
//
// DISABLED IN SERVERLESS — this route previously used Puppeteer +
// Chromium (~150 MB) to batch-regenerate PDF assets and write them to
// `public/assets/downloads/`. That pattern never worked on Netlify
// functions because the filesystem under `public/` is ephemeral and
// does not persist between invocations — generated files would
// immediately be lost.
//
// The authoritative PDF regeneration path is the build-time CLI at
// `scripts/pdf/unified-pdf-generator.ts`, which runs in CI before
// `next build` and commits the generated artifacts into the deployed
// `public/` directory.
//
// Keeping this stub as a 503 so any legacy caller receives a clear
// signal instead of a 404. Do NOT re-import SecurePuppeteerPDFGenerator
// here — that pulls Puppeteer + Chromium into the main Next server
// handler and blows the 250 MB Lambda package limit.

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  return res.status(503).json({
    ok: false,
    error: "PDF_BATCH_REGENERATION_DISABLED",
    message:
      "Admin-triggered PDF regeneration is no longer supported at runtime. " +
      "Regenerate via the build-time CLI (scripts/pdf/unified-pdf-generator.ts) " +
      "and redeploy.",
  });
}
