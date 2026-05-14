/**
 * GET /api/admin/client-safe-provenance?cycleId=...
 *
 * Returns a ClientSafeProvenanceSummary for a given oversight cycle.
 * Admin-gated. The summary is designed for sponsor/client consumption —
 * no operator internals, no suppression details, no raw evidence labels.
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
    const { loadClientSafeProvenance } = await import(
      "@/lib/admin/client-safe-provenance-composer"
    );
    const summary = await loadClientSafeProvenance({
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: cycleId,
    });
    return res.status(200).json({ ok: true, summary });
  } catch (err) {
    console.error("[client-safe-provenance] load error", err);
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : "Failed to compose client-safe provenance",
    });
  }
}
