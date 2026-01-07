// pages/api/premium/content/download/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyDownloadToken } from "@/lib/premium/download-token";
import { withApiRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit-unified";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const id = String(req.query.id || "");
  const token = String(req.query.token || "");

  if (!id || !token) return res.status(400).json({ error: "missing_params" });

  const verified = verifyDownloadToken(token);
  if (!verified.ok || !verified.payload) return res.status(401).json({ error: "invalid_token" });
  if (verified.payload.rid !== id) return res.status(401).json({ error: "token_mismatch" });

  // ======= REPLACE THIS BLOCK WITH REAL STORAGE (S3/Netlify Blob/KV/etc) =======
  const fakePdf = Buffer.from(
    `%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 72 720 Td (Premium Report) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000015 00000 n \n0000000062 00000 n \n0000000117 00000 n \n0000000200 00000 n \ntrailer\n<< /Root 1 0 R /Size 5 >>\nstartxref\n292\n%%EOF\n`
  );
  // ===========================================================================

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${id}.pdf"`);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(fakePdf);
}

export default withApiRateLimit(handler, RATE_LIMIT_CONFIGS.DOWNLOADS);
