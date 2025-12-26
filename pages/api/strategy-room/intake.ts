// pages/api/strategy-room/intake.ts
import type { NextApiRequest, NextApiResponse } from "next";

import type {
  StrategyRoomIntakePayload,
  StrategyRoomIntakeResult,
} from "@/lib/consulting/strategy-room";
import { evaluateIntake } from "@/lib/consulting/strategy-room";
import { verifyRecaptchaDetailed } from "@/lib/recaptchaServer";

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function getClientIp(req: NextApiRequest): string | undefined {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    // x-forwarded-for can be a list: client, proxy1, proxy2...
    return xff.split(",")[0]?.trim() || undefined;
  }
  const xrip = req.headers["x-real-ip"];
  if (typeof xrip === "string" && xrip.length > 0) return xrip.trim();
  return undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StrategyRoomIntakeResult>
) {
  if (req.method !== "POST") {
    res.status(405).json({
      ok: false,
      status: "declined",
      message: "Method not allowed.",
    });
    return;
  }

  if (!isObject(req.body)) {
    res.status(400).json({
      ok: false,
      status: "declined",
      message: "Invalid payload.",
    });
    return;
  }

  const payload = req.body as StrategyRoomIntakePayload;

  if (!payload?.recaptchaToken || typeof payload.recaptchaToken !== "string") {
    res.status(400).json({
      ok: false,
      status: "declined",
      message: "Missing security token.",
    });
    return;
  }

  const expectedAction = "strategy_room_intake";
  const remoteIp = getClientIp(req);

  const recaptcha = await verifyRecaptchaDetailed(
    payload.recaptchaToken,
    expectedAction,
    remoteIp
  );

  if (!recaptcha.success) {
    res.status(400).json({
      ok: false,
      status: "declined",
      message:
        "Security verification failed. Please refresh and try again.",
    });
    return;
  }

  const evaluated = evaluateIntake(payload);
  res.status(200).json(evaluated);
}