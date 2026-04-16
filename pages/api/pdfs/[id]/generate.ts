// pages/api/pdfs/[id]/generate.ts
//
// DISABLED IN SERVERLESS — see pages/api/pdfs/generate-all.ts for the
// full rationale. This route previously ran Puppeteer to render a
// single PDF and write it to `public/assets/downloads/`, which
// cannot persist on Netlify functions.
//
// The build-time CLI at `scripts/pdf/unified-pdf-generator.ts` is the
// supported regeneration path.

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  return res.status(503).json({
    ok: false,
    error: "PDF_SINGLE_REGENERATION_DISABLED",
    message:
      "Admin-triggered PDF regeneration is no longer supported at runtime. " +
      "Regenerate via the build-time CLI (scripts/pdf/unified-pdf-generator.ts) " +
      "and redeploy.",
  });
}
