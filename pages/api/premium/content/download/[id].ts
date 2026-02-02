// pages/api/premium/content/download/[id].ts — SECURE STREAMING GATE
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyDownloadToken } from "@/lib/premium/download-token";
import { withApiRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit-unified";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const id = String(req.query.id || "");
  const token = String(req.query.token || "");

  if (!id || !token) {
    return res.status(400).json({ error: "Institutional parameters missing" });
  }

  // 1. Token Cryptographic Verification
  const verified = verifyDownloadToken(token);
  if (!verified.ok || !verified.payload) {
    return res.status(401).json({ error: "Access token invalid or expired" });
  }

  // 2. Resource Integrity Check
  // rid = reportId from the encoded payload
  if (verified.payload.rid !== id) {
    return res.status(401).json({ error: "Token-resource mismatch" });
  }

  try {
    // ======= INTEGRATION POINT: S3 / EDGE STORAGE =======
    // For now, serving the structured PDF buffer
    const reportBuffer = Buffer.from(
      `%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n...` 
    );
    // ====================================================

    // 3. Secure Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Abraham_Intel_${id}.pdf"`);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.status(200).send(reportBuffer);
  } catch (err) {
    console.error("[DOWNLOAD_STREAM_ERROR]", err);
    return res.status(500).json({ error: "Failed to stream asset" });
  }
}

export default withApiRateLimit(handler, RATE_LIMIT_CONFIGS.DOWNLOADS);