/**
 * POST /api/demo/funnel-event — persist one flagship-journey funnel event.
 *
 * Only allow-listed structured fields are read from the body; any free-text decision
 * content a caller might attach is ignored (never persisted). Unknown event types 400.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { recordFunnelEvent, isFunnelEvent } from "@/lib/demo/funnel-event-store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed" }); }
  const b = req.body ?? {};
  if (!isFunnelEvent(b.eventType)) return res.status(400).json({ error: "unknown event type" });
  if (typeof b.sessionId !== "string" || !b.sessionId) return res.status(400).json({ error: "sessionId required" });
  try {
    const rec = recordFunnelEvent({
      eventType: b.eventType,
      sessionId: String(b.sessionId).slice(0, 64),
      sourceRoute: typeof b.sourceRoute === "string" ? b.sourceRoute.slice(0, 200) : "unknown",
      journeyVersion: typeof b.journeyVersion === "string" ? b.journeyVersion : undefined,
      tenantId: typeof b.tenantId === "string" ? b.tenantId : null,
      caseId: typeof b.caseId === "string" ? b.caseId : null,
      productCode: typeof b.productCode === "string" ? b.productCode : null,
      recommendationId: typeof b.recommendationId === "string" ? b.recommendationId : null,
      // NOTE: any b.decisionStatement / intake answers are intentionally NOT read.
    });
    return res.status(201).json({ eventId: rec.eventId });
  } catch (err) {
    console.error("[funnel-event] record failed:", err);
    return res.status(500).json({ error: "could not record" });
  }
}
