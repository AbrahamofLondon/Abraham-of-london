/* pages/api/strategy-room/intake.ts — legacy adapter to canonical enrolment */

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

type ApiSuccess = {
  ok: true;
  status: "accepted";
  message: string;
  referenceId: string | null;
  priorityStatus: string | null;
  warning?: string | null;
};

type ApiFailure = {
  ok: false;
  status: "declined";
  message: string;
  details?: unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccess | ApiFailure>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      status: "declined",
      message: "Direct POST access required for this terminal.",
    });
  }

  // Rate limit parity with canonical /api/strategy-room/enrol
  const ip = getClientIp(req);
  const rl = rateLimitCheck({ key: "API_STRICT", id: `sr:${ip}` });
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
      source: req.body?.source || "strategy_room_intake_legacy",
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

    return res.status(200).json({
      ok: true,
      status: "accepted",
      message: result.message,
      referenceId: result.referenceId ?? null,
      priorityStatus: result.priorityStatus ?? null,
      warning: result.warning ?? null,
    });
  } catch (error) {
    console.error("[STRATEGY_ROOM_INTAKE_ERROR]", error);

    return res.status(500).json({
      ok: false,
      status: "declined",
      message: "Internal enrolment failure.",
    });
  }
}