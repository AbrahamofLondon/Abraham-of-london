import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import {
  loadSuppressionLedger,
  reviewSuppression,
  buildSuppressionSummary,
} from "@/lib/product/suppression-ledger";
import type { SuppressionOverrideStatus } from "@/lib/product/suppression-ledger-contract";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await requireAdminServer(req, res, { routeKey: "admin-suppression-ledger" });
  if (!session) return;

  if (req.method === "GET") {
    try {
      const scopeId = typeof req.query.scopeId === "string" ? req.query.scopeId : undefined;
      const surface = typeof req.query.surface === "string" ? req.query.surface : undefined;
      const reason = typeof req.query.reason === "string" ? req.query.reason : undefined;
      const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;

      const [events, summary] = await Promise.all([
        loadSuppressionLedger({ scopeId, surface, reason, limit }),
        buildSuppressionSummary(scopeId),
      ]);

      return res.status(200).json({ events, summary });
    } catch (error) {
      console.error("[SUPPRESSION_LEDGER] Load error:", error);
      return res.status(500).json({ error: "Failed to load suppression ledger" });
    }
  }

  if (req.method === "POST") {
    try {
      const { eventId, decision, reason } = req.body as {
        eventId?: string;
        decision?: SuppressionOverrideStatus;
        reason?: string;
      };

      if (!eventId || !decision) {
        return res.status(400).json({ error: "eventId and decision are required" });
      }

      if (decision !== "APPROVED_FOR_RELEASE" && decision !== "REMAIN_SUPPRESSED") {
        return res.status(400).json({ error: "decision must be APPROVED_FOR_RELEASE or REMAIN_SUPPRESSED" });
      }

      const operatorId = (session as any).user?.id ?? (session as any).user?.email ?? "admin";
      await reviewSuppression(eventId, String(operatorId), decision, reason);

      return res.status(200).json({ ok: true, eventId, decision });
    } catch (error) {
      console.error("[SUPPRESSION_LEDGER] Review error:", error);
      return res.status(500).json({ error: "Failed to review suppression event" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
