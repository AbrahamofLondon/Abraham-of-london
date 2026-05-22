// pages/api/admin/intelligence/gmi/digest.ts
// POST: Generates and returns a GMI intelligence digest for the given reportId.
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { generateGmiIntelligenceDigest } from "@/lib/intelligence/generate-gmi-digest";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "admin-intelligence-gmi-digest",
  });
  if (!session) return;

  const reportId = typeof req.body?.reportId === "string" && req.body.reportId.trim()
    ? req.body.reportId.trim()
    : "GMI-Q2-2026";

  const digest = await generateGmiIntelligenceDigest(reportId);
  return res.status(200).json(digest);
}
