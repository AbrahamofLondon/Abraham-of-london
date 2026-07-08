/**
 * POST /api/demo/funnel-event — persist one flagship-journey funnel event.
 *
 * §10 hardening: same-origin content-type, strict field bounds (no arbitrary metadata,
 * no free-text decision content), and per-caller rate limiting so a competitor cannot
 * inflate conversion with a flood of POSTs. Only allow-listed structured fields are read.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { recordFunnelEvent, isFunnelEvent } from "@/lib/demo/funnel-event-store.composed";
import { checkRateLimit, clientIpFrom } from "@/lib/runtime/simple-rate-limit";

export const config = { api: { bodyParser: { sizeLimit: "4kb" } } }; // bound payload size

const MAX_STR = 200;
const clean = (v: unknown, max = MAX_STR): string | null =>
  typeof v === "string" && v.length > 0 ? v.slice(0, max) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed" }); }

  // content-type must be JSON (rejects naive cross-site form posts)
  const ct = req.headers["content-type"] ?? "";
  if (!ct.includes("application/json")) return res.status(415).json({ error: "content-type must be application/json" });

  const b = (req.body ?? {}) as Record<string, unknown>;
  if (!isFunnelEvent(b.eventType)) return res.status(400).json({ error: "unknown event type" });
  const sessionId = clean(b.sessionId, 64);
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  // rate limit per (session + ip): 60 events / minute is generous for a real journey,
  // ruinous for a flood. Per-instance (documented) — production global limit needs a shared store.
  const key = `${sessionId}:${clientIpFrom(req.headers)}`;
  const rl = checkRateLimit(key, 60, 60_000);
  if (!rl.ok) { res.setHeader("Retry-After", Math.ceil(rl.resetInMs / 1000).toString()); return res.status(429).json({ error: "rate limited" }); }

  try {
    const rec = await recordFunnelEvent({
      eventType: b.eventType,
      sessionId,
      sourceRoute: clean(b.sourceRoute) ?? "unknown",
      journeyVersion: clean(b.journeyVersion, 32) ?? undefined,
      tenantId: clean(b.tenantId, 128),
      caseId: clean(b.caseId, 128),
      productCode: clean(b.productCode, 128),
      recommendationId: clean(b.recommendationId, 128),
      // any b.decisionStatement / intake answers are intentionally NOT read.
    });
    return res.status(201).json({ eventId: rec.eventId });
  } catch (err) {
    console.error("[funnel-event] record failed:", err);
    return res.status(500).json({ error: "could not record" });
  }
}
