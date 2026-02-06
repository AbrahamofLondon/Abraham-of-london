/* pages/api/assets/serve-pdf.ts — SECURE ASSET GATEWAY */
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import fs from "fs";
import path from "path";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Session Validation: Only authenticated nodes can request assets
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: "Institutional clearance required." });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid Asset ID." });
  }

  try {
    // 2. Resolve the absolute path to the PDF dossier
    // Assuming your PDFs are stored in a non-public 'vault' directory
    const filePath = path.join(process.cwd(), "vault/briefs", `${id}.pdf`);

    // 3. Verify existence
    if (!fs.existsSync(filePath)) {
      console.error(`[ASSET_NOT_FOUND]: ${id}`);
      return res.status(404).json({ error: "Dossier not found in registry." });
    }

    // 4. Set Secure Headers
    // 'inline' ensures it opens in our Viewer iframe, not a download prompt
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${id}.pdf"`);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");

    // 5. Stream the file directly
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error("[SERVE_PDF_ERROR]:", error);
    return res.status(500).json({ error: "Internal server error during asset retrieval." });
  }
}