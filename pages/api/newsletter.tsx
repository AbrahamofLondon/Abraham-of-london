// pages/api/subscribe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  subscribe,
  type SubscriptionResult,
  type SubscriptionPreferences,
} from "@/lib/server/subscription";
import { withSecurity } from "@/lib/apiGuard";

interface SubscribeRequestBody {
  email?: string;
  preferences?: SubscriptionPreferences;
  metadata?: Record<string, unknown>;
  tags?: string[];
  referrer?: string;
  website?: string;        // honeypot
  recaptchaToken?: string; // v3 token
}

type SubscribeResponseBody =
  | SubscriptionResult
  | {
      ok?: boolean;
      message: string;
      error?: string;
    };

async function subscribeHandler(
  req: NextApiRequest,
  res: NextApiResponse<SubscribeResponseBody>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const {
      email,
      preferences,
      metadata,
      tags,
      referrer,
    } = (req.body ?? {}) as SubscribeRequestBody;

    if (!email) {
      return res.status(400).json({
        ok: false,
        message: "Email is required",
        error: "MISSING_EMAIL",
      });
    }

    const clientIp = getClientIp(req);

    const result: SubscriptionResult = await subscribe(email, {
      preferences,
      metadata: {
        ...metadata,
        source: "api",
        ip: clientIp,
        userAgent: req.headers["user-agent"],
        timestamp: new Date().toISOString(),
      },
      tags: tags || ["api-subscriber"],
      referrer:
        referrer ||
        (req.headers.referer as string | undefined) ||
        "direct",
    });

    const statusCode = result.ok ? 200 : result.status || 400;
    return res.status(statusCode).json(result);
  } catch (error: unknown) {
    console.error("Subscription API error:", error);

    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: "SERVER_ERROR",
    });
  }
}

function getClientIp(req: NextApiRequest): string | undefined {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (Array.isArray(forwardedFor)) return forwardedFor[0];
  if (typeof forwardedFor === "string") return forwardedFor.split(",")[0].trim();

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") return realIp;

  return req.socket?.remoteAddress ?? undefined;
}

export default withSecurity(subscribeHandler, {
  requireRecaptcha: true,
  expectedAction: "generic_subscribe",
  requireHoneypot: true,
  honeypotFieldNames: ["website", "botField"],
});