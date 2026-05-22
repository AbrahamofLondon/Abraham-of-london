// pages/api/admin/reporting/lineage/[resourceId].ts
// Returns report chain-of-custody events for a given resourceId (campaignId).
// Admin view: actor email partially visible (sanitized=false).
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { getAdminReportLineage } from "@/lib/reporting/report-lineage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "admin-reporting-lineage",
  });
  if (!session) return;

  const { resourceId } = req.query;
  if (!resourceId || typeof resourceId !== "string" || !resourceId.trim()) {
    return res.status(400).json({ error: "Missing resourceId" });
  }

  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;

  const events = await getAdminReportLineage(resourceId.trim(), limit);
  return res.status(200).json({ events });
}
