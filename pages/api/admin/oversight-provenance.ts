/**
 * pages/api/admin/oversight-provenance.ts
 *
 * GET /api/admin/oversight-provenance?cycleId=...
 * Returns the DecisionProvenanceRecord for a given cycle.
 * Admin-only. Read-only — no mutations.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminPage } from "@/lib/access/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminPage(req as any);
  if (!guard.authorized) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const cycleId = typeof req.query.cycleId === "string" ? req.query.cycleId.trim() : "";
  if (!cycleId) {
    return res.status(400).json({ ok: false, error: "cycleId is required" });
  }

  try {
    const { loadDecisionProvenanceRecord } = await import(
      "@/lib/admin/decision-provenance-record"
    );
    const record = await loadDecisionProvenanceRecord(cycleId);
    return res.status(200).json({ ok: true, record });
  } catch (err) {
    console.error("[oversight-provenance] load error", err);
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load provenance record",
    });
  }
}
