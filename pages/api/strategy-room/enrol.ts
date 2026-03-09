/* pages/api/strategy-room/enrol.ts — canonical intake endpoint */
import type { NextApiRequest, NextApiResponse } from "next";
import {
  normalizeCanonicalInput,
  processStrategyRoomEnrolment,
  type StrategyRoomApiResult,
} from "@/lib/strategy-room/enrol-core";

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded) && forwarded[0]) return String(forwarded[0]).trim();
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return String(req.socket?.remoteAddress || "");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StrategyRoomApiResult | Omit<StrategyRoomApiResult, "statusCode">>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" } as any);
  }

  const input = normalizeCanonicalInput(req.body);

  const result = await processStrategyRoomEnrolment(input, {
    ip: getClientIp(req),
    userAgent: String(req.headers["user-agent"] || ""),
  });

  if (!result.ok) {
    return res.status(result.statusCode).json(result);
  }

  return res.status(200).json(result);
}