/* pages/api/subscribe.ts — ROBUST SUBSCRIPTION ENDPOINT */

import type { NextApiRequest, NextApiResponse } from "next";

import {
  subscribe,
  type SubscriptionResult,
  type SubscriptionPreferences,
} from "@/lib/server/subscription";
import { verifyRecaptcha } from "@/lib/recaptchaServer";

import {
  rateLimit,
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
} from "@/lib/server/rate-limit-unified";

import {
  getClientIpWithAnalysis,
  anonymizeIp,
  getRateLimitKey,
} from "@/lib/server/ip";

interface SubscribeRequestBody {
  email?: string;
  preferences?: SubscriptionPreferences;
  metadata?: Record<string, unknown>;
  tags?: string[];
  referrer?: string;
  website?: string;
  confirm_email?: string;
  recaptchaToken?: string;
  source?: string;
  userAgent?: string;
  timestamp?: string;
}

interface SubscribeResponseBody {
  ok: boolean;
  message: string;
  error?: string;
  status?: number;
}

type RecaptchaVerificationResult = {
  success: boolean;
  score: number;
  reasons: string[];
};

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required" };
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedEmail.length > 254) {
    return { isValid: false, error: "Email address is too long" };
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
}

function normalizeRecaptchaResult(value: unknown): RecaptchaVerificationResult {
  // Case 1: verifyRecaptcha returns boolean
  if (typeof value === "boolean") {
    return {
      success: value,
      score: value ? 1 : 0,
      reasons: value ? [] : ["verification_failed"],
    };
  }

  // Case 2: verifyRecaptcha returns structured object
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;

    const success =
      typeof obj.success === "boolean"
        ? obj.success
        : typeof obj.ok === "boolean"
          ? obj.ok
          : false;

    const score =
      typeof obj.score === "number" && Number.isFinite(obj.score)
        ? obj.score
        : success
          ? 1
          : 0;

    const reasons = Array.isArray(obj.reasons)
      ? obj.reasons.map((r) => String(r))
      : Array.isArray(obj["error-codes"])
        ? (obj["error-codes"] as unknown[]).map((r) => String(r))
        : [];

    return { success, score, reasons };
  }

  // Case 3: anything else
  return {
    success: false,
    score: 0,
    reasons: ["invalid_recaptcha_response_shape"],
  };
}

async function subscribeHandler(
  req: NextApiRequest,
  res: NextApiResponse<SubscribeResponseBody>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      message: "Method Not Allowed",
      error: "METHOD_NOT_ALLOWED",
    });
  }

  try {
    const {
      email,
      preferences,
      metadata,
      tags,
      referrer,
      website,
      confirm_email,
      recaptchaToken,
      source = "unknown",
      userAgent,
      timestamp,
    } = (req.body || {}) as SubscribeRequestBody;

    // Honeypots — smile and wave.
    if (website && website.trim() !== "") {
      console.warn("Honeypot field 'website' triggered", { email });
      return res.status(200).json({
        ok: true,
        message: "You have been subscribed successfully!",
      });
    }

    if (confirm_email && confirm_email.trim() !== "") {
      console.warn("Honeypot field 'confirm_email' triggered", { email });
      return res.status(200).json({
        ok: true,
        message: "You have been subscribed successfully!",
      });
    }

    const emailValidation = validateEmail(email || "");
    if (!emailValidation.isValid) {
      return res.status(400).json({
        ok: false,
        message: emailValidation.error || "Invalid email",
        error: "INVALID_EMAIL",
      });
    }

    const cleanEmail = String(email || "").trim().toLowerCase();

    const ipInfo = getClientIpWithAnalysis(req);
    const clientIp = ipInfo.ip;

    const rlKey = getRateLimitKey(req, RATE_LIMIT_CONFIGS.API_GENERAL.keyPrefix);
    const rl = await rateLimit(rlKey, RATE_LIMIT_CONFIGS.API_GENERAL);

    const rlHeaders = createRateLimitHeaders(rl);
    Object.entries(rlHeaders).forEach(([k, v]) => res.setHeader(k, v));

    if (!rl.allowed) {
      console.warn("Subscribe API rate limit exceeded", {
        email: cleanEmail,
        ip: anonymizeIp(clientIp),
        remaining: rl.remaining,
      });

      return res.status(429).json({
        ok: false,
        message: "Too many subscription attempts. Please try again later.",
        error: "RATE_LIMITED",
      });
    }

    if (!recaptchaToken) {
      return res.status(400).json({
        ok: false,
        message: "Security token is required",
        error: "MISSING_RECAPTCHA",
      });
    }

    let recaptchaResult: RecaptchaVerificationResult;

    try {
      const rawRecaptchaResult = await verifyRecaptcha(
        recaptchaToken,
        "generic_subscribe",
        clientIp,
      );

      recaptchaResult = normalizeRecaptchaResult(rawRecaptchaResult);

      if (!recaptchaResult.success) {
        console.warn("reCAPTCHA verification failed", {
          email: cleanEmail,
          score: recaptchaResult.score,
          reasons: recaptchaResult.reasons,
        });

        return res.status(400).json({
          ok: false,
          message: "Security verification failed. Please try again.",
          error: "RECAPTCHA_FAILED",
        });
      }

      if (recaptchaResult.score < 0.3) {
        console.warn("Low reCAPTCHA score", {
          email: cleanEmail,
          score: recaptchaResult.score,
          ip: anonymizeIp(clientIp),
        });
      }
    } catch (recaptchaError) {
      console.error("reCAPTCHA verification error:", recaptchaError);

      return res.status(400).json({
        ok: false,
        message: "Security check failed. Please refresh and try again.",
        error: "RECAPTCHA_ERROR",
      });
    }

    const result: SubscriptionResult = await subscribe(cleanEmail, {
      preferences,
      metadata: {
        ...metadata,
        source: source || "api",
        ip: anonymizeIp(clientIp),
        userAgent: userAgent || req.headers["user-agent"] || "unknown",
        timestamp: timestamp || new Date().toISOString(),
        recaptchaScore: recaptchaResult.score,
        recaptchaReasons: recaptchaResult.reasons,
      },
      tags: tags || ["api-subscriber"],
      referrer:
        referrer ||
        (typeof req.headers.referer === "string" ? req.headers.referer : undefined) ||
        "direct",
    });

    console.info("Subscription completed", {
      email: cleanEmail,
      source,
      ip: anonymizeIp(clientIp),
      timestamp: new Date().toISOString(),
    });

    const statusCode = result.ok ? 200 : result.status || 400;

    return res.status(statusCode).json({
      ok: result.ok,
      message: result.message || "Subscription completed successfully",
      error: result.error,
      status: statusCode,
    });
  } catch (error: unknown) {
    console.error("Subscription API error:", error);

    return res.status(500).json({
      ok: false,
      message: "An unexpected error occurred. Please try again later.",
      error: "INTERNAL_ERROR",
    });
  }
}

export default subscribeHandler;