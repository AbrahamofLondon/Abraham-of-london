/* pages/api/strategy-room/intake.ts — legacy adapter to canonical enrolment */
import type { NextApiRequest, NextApiResponse } from "next";
import {
  normalizeCanonicalInput,
  processStrategyRoomEnrolment,
} from "@/lib/strategy-room/enrol-core";

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];

  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).trim();
  }

  if (typeof forwarded === "string" && forwarded.trim()) {
    const first = forwarded.split(",")[0];
    return String(first || "").trim();
  }

  return String(req.socket?.remoteAddress || "").trim();
}

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
      referenceId: result.referenceId,
      priorityStatus: result.priorityStatus || null,
      warning: result.warning,
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