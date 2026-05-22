// pages/api/admin/intelligence/gmi/events.ts
// GET: Returns stored GMI release events for a given reportId.
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { getGmiEventsForReport, getRecentGmiEvents } from "@/lib/intelligence/gmi-event-store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "admin-intelligence-gmi-events",
  });
  if (!session) return;

  const { reportId, limit: limitRaw } = req.query;
  const limit = Number.isFinite(Number(limitRaw)) && Number(limitRaw) > 0
    ? Math.min(Number(limitRaw), 200)
    : 50;

  if (reportId && typeof reportId === "string") {
    const events = await getGmiEventsForReport(reportId.trim(), limit);
    return res.status(200).json({ reportId, events, total: events.length });
  }

  // No reportId: return recent events across all reports
  const events = await getRecentGmiEvents(limit);
  return res.status(200).json({ events, total: events.length });
}
