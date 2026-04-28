/* pages/api/strategy-room/enrol.ts — canonical enrolment endpoint */
import type { NextApiRequest, NextApiResponse } from "next";
import {
  normalizeCanonicalInput,
  processStrategyRoomEnrolment,
} from "@/lib/strategy-room/enrol-core";
import {
  rateLimitCheck,
  getClientIp,
  createRateLimitHeaders,
} from "@/lib/server/rate-limit-unified";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      status: "declined",
      message: "Direct POST access required for this terminal.",
    });
  }

  // Rate limit: 30 submissions per 10 minutes per IP
  const ip = getClientIp(req);
  const rl = await rateLimitCheck({ key: "API_STRICT", id: `sr:${ip}` });
  const rlHeaders = createRateLimitHeaders(rl);
  for (const [k, v] of Object.entries(rlHeaders)) res.setHeader(k, v);

  if (!rl.allowed) {
    return res.status(429).json({
      ok: false,
      status: "declined",
      message: "Too many requests. Please try again later.",
    });
  }

  try {
    const input = normalizeCanonicalInput({
      ...req.body,
      source: req.body?.source || "strategy_room_enrol_pages",
    });

    const result = await processStrategyRoomEnrolment(input, {
      ip: getClientIp(req),
      userAgent: String(req.headers["user-agent"] || ""),
    });

    if (!result.ok) {
      return res.status(result.statusCode).json({
        ok: false,
        status: "declined",
        message: result.error,
        details: result.details,
      });
    }

    // Server-side conversion signal — highest-value event
    console.log("[STRATEGY_ROOM_CONVERSION]", {
      referenceId: result.referenceId,
      priorityStatus: result.priorityStatus || null,
      ip,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      ok: true,
      status: "accepted",
      message: result.message,
      referenceId: result.referenceId,
      priorityStatus: result.priorityStatus || null,
      warning: result.warning,
    });
  } catch (error) {
    console.error("[STRATEGY_ROOM_ENROL_ERROR]", error);

    return res.status(500).json({
      ok: false,
      status: "declined",
      message: "Internal enrolment failure.",
    });
  }
}
