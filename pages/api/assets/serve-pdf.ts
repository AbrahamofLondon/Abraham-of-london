/* pages/api/assets/serve-pdf.ts — SECURE ASSET GATEWAY */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises"; // ✅ Better for handling stream closure
import { authOptions } from "@/lib/auth/config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Session Validation
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Institutional clearance required." });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid Asset ID." });
  }

  try {
    // 2. Resolve Path
    // NOTE: In Vercel, ensure this directory is included in your 'outputFileTracing'
    const filePath = path.join(process.cwd(), "vault", "briefs", `${id}.pdf`);

    // 3. Verify existence with access check (more robust than existsSync)
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch (e) {
      console.error(`[ASSET_NOT_FOUND]: ${id} at path ${filePath}`);
      return res.status(404).json({ error: "Dossier not found in registry." });
    }

    // 4. Set Secure Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(id)}.pdf"`);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'self';");

    // 5. Stream using Pipeline
    // This handles cleanup and error propagation automatically
    const fileStream = fs.createReadStream(filePath);
    
    await pipeline(fileStream, res);

  } catch (error) {
    console.error("[SERVE_PDF_ERROR]:", error);
    // Ensure we don't try to send another response if headers were already sent
    if (!res.writableEnded) {
      return res.status(500).json({ error: "Internal server error during asset retrieval." });
    }
  }
}
