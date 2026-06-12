/**
 * pages/api/admin/boardroom/orders/[id]/reconcile.ts
 *
 * POST — Reconcile a legacy Boardroom order into the governed delivery pipeline.
 *
 * Detects legacy contradictions (e.g. dossier_generated + ProductArtifact PENDING)
 * and repairs them safely:
 *   - Maps legacy status to governed equivalent
 *   - Updates ProductArtifact to DRAFT / AWAITING_REVIEW
 *   - Populates adminPreviewUrl
 *   - Writes audit + governance events
 *
 * Safety: Does NOT generate customer access or mark delivered.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { reconcileLegacyOrder, detectLegacyContradictions } from "@/lib/boardroom/reconcile-boardroom-legacy-order";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-boardroom-reconcile" });
  if (!session) return;

  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ ok: false, error: "INVALID_ID" });

  try {
    // First, detect contradictions
    const detection = await detectLegacyContradictions(id);

    if (!detection.order) {
      return res.status(404).json({ ok: false, error: "ORDER_NOT_FOUND" });
    }

    if (detection.contradictions.length === 1 && detection.contradictions[0] === "none") {
      return res.status(200).json({
        ok: true,
        reconciled: false,
        message: "No legacy contradictions detected. Order is already in a governed state.",
        contradictions: [],
        orderId: id,
      });
    }

    // Run reconciliation
    const result = await reconcileLegacyOrder(id, session.user?.email ?? "admin");

    if (result.errors.length > 0 && !result.reconciled) {
      return res.status(422).json({
        ok: false,
        error: "RECONCILIATION_FAILED",
        details: result.errors,
        result,
      });
    }

    return res.status(200).json({
      ok: true,
      reconciled: result.reconciled,
      message: result.reconciled
        ? "Legacy order reconciled into governed delivery pipeline."
        : "Reconciliation partially completed. Review errors above.",
      result,
    });
  } catch (error) {
    console.error("[admin-boardroom-reconcile]", error);
    const message = error instanceof Error ? error.message : "RECONCILIATION_FAILED";
    return res.status(500).json({ ok: false, error: message });
  }
}
