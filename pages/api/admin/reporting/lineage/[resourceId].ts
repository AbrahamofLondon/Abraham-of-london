// pages/api/admin/reporting/lineage/[resourceId].ts
// Returns report chain-of-custody events for a given resourceId (campaignId).
// Admin view: actor email partially visible (sanitized=false).
// This is a Pages Router route — auth is enforced here directly, NOT via
// the app/admin layout. requireAdminServer handles session, admin check,
// rate limiting, and audit logging.
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { getAdminReportLineage } from "@/lib/reporting/report-lineage";

function isValidResourceId(id: string): boolean {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "admin-reporting-lineage",
    rateLimit: { limit: 60, windowMs: 15 * 60_000 },
  });
  if (!session) return;

  const { resourceId } = req.query;
  if (!resourceId || typeof resourceId !== "string" || !isValidResourceId(resourceId.trim())) {
    return res.status(400).json({ error: "INVALID_RESOURCE_ID" });
  }

  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;

  let events: Awaited<ReturnType<typeof getAdminReportLineage>>;
  try {
    events = await getAdminReportLineage(resourceId.trim(), limit);
  } catch {
    return res.status(500).json({ error: "LINEAGE_UNAVAILABLE" });
  }

  return res.status(200).json({ events });
}
