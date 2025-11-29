// lib/apiGuard.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { isRecaptchaValid } from "@/lib/verifyRecaptcha";

export type GuardOptions = {
  requireRecaptcha?: boolean;
  expectedAction?: string;
  requireHoneypot?: boolean;
  honeypotFieldNames?: string[];
};

interface ApiRequestBody {
  recaptchaToken?: string;
  token?: string;
  [key: string]: unknown;
}

function getClientIp(req: NextApiRequest): string | undefined {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (Array.isArray(forwardedFor)) return forwardedFor[0];
  if (typeof forwardedFor === "string")
    return forwardedFor.split(",")[0]?.trim();

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") return realIp;

  return req.socket?.remoteAddress ?? undefined;
}

export function withSecurity<T = unknown>(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse<T>
  ) => unknown | Promise<unknown>,
  options: GuardOptions = {}
): NextApiHandler<T> {
  const {
    requireRecaptcha = true,
    expectedAction,
    requireHoneypot = true,
    honeypotFieldNames = ["website", "middleName", "botField"],
  } = options;

  return async (req: NextApiRequest, res: NextApiResponse<T>) => {
    // Method-level CORS preflight shortcut if ever needed
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    // Origin enforcement (defence in depth alongside middleware)
    const origin = req.headers.origin;
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL;
    if (origin && allowedOrigin && origin !== allowedOrigin) {
      // Don't leak details
      res.status(403).json({} as T);
      return;
    }

    // Honeypot fields: if any are non-empty, silently succeed but drop
    if (requireHoneypot && req.body && typeof req.body === "object") {
      const body = req.body as Record<string, unknown>;
      for (const field of honeypotFieldNames) {
        const val = body[field];
        if (typeof val === "string" && val.trim().length > 0) {
          // Pretend success, don't process further
          res.status(200).json({} as T);
          return;
        }
      }
    }

    // reCAPTCHA v3 (using your verifyRecaptcha.ts)
    if (requireRecaptcha) {
      const body = req.body as ApiRequestBody;
      const token =
        body.recaptchaToken ||
        body.token ||
        (req.headers["x-recaptcha-token"] as string | undefined);

      if (!token || typeof token !== "string") {
        res.status(400).json({} as T);
        return;
      }

      const clientIp = getClientIp(req);
      const ok = await isRecaptchaValid(token, expectedAction, clientIp);

      if (!ok) {
        res.status(403).json({} as T);
        return;
      }
    }

    return handler(req, res);
  };
}
