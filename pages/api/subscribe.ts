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
} from "@/lib/server/rateLimit";
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
  website?: string;        // Honeypot
  confirm_email?: string;  // Honeypot
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
    } = req.body as SubscribeRequestBody;

    // Honeypots - silently pretend success
    if (website && website.trim() !== "") {
      // eslint-disable-next-line no-console
      console.warn("Honeypot field 'website' triggered", { email, website });
      return res.status(200).json({
        ok: true,
        message: "You have been subscribed successfully!",
      });
    }

    if (confirm_email && confirm_email.trim() !== "") {
      // eslint-disable-next-line no-console
      console.warn("Honeypot field 'confirm_email' triggered", {
        email,
        confirm_email,
      });
      return res.status(200).json({
        ok: true,
        message: "You have been subscribed successfully!",
      });
    }

    // Email validation
    const emailValidation = validateEmail(email || "");
    if (!emailValidation.isValid) {
      return res.status(400).json({
        ok: false,
        message: emailValidation.error!,
        error: "INVALID_EMAIL",
      });
    }

    const cleanEmail = (email || "").trim().toLowerCase();

    // IP analysis
    const ipInfo = getClientIpWithAnalysis(req);
    const clientIp = ipInfo.ip;

    // 🔒 Shared per-IP rate limiting (generic API profile)
    const rlKey = getRateLimitKey(
      req,
      RATE_LIMIT_CONFIGS.API_GENERAL.keyPrefix,
    );
    const rl = rateLimit(rlKey, RATE_LIMIT_CONFIGS.API_GENERAL);
    const rlHeaders = createRateLimitHeaders(rl);
    Object.entries(rlHeaders).forEach(([k, v]) => res.setHeader(k, v));

    if (!rl.allowed) {
      // eslint-disable-next-line no-console
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

    // reCAPTCHA verification
    if (!recaptchaToken) {
      return res.status(400).json({
        ok: false,
        message: "Security token is required",
        error: "MISSING_RECAPTCHA",
      });
    }

    let recaptchaResult;
    try {
      recaptchaResult = await verifyRecaptcha(
        recaptchaToken,
        "generic_subscribe",
        clientIp,
      );
      if (!recaptchaResult.success) {
        // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.warn("Low reCAPTCHA score", {
          email: cleanEmail,
          score: recaptchaResult.score,
          ip: anonymizeIp(clientIp),
        });
      }
    } catch (recaptchaError) {
      // eslint-disable-next-line no-console
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
        userAgent: userAgent || req.headers["user-agent"],
        timestamp: timestamp || new Date().toISOString(),
        recaptchaScore: recaptchaResult.score,
      },
      tags: tags || ["api-subscriber"],
      referrer:
        referrer || (req.headers.referer as string | undefined) || "direct",
    });

    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.error("Subscription API error:", error);

    return res.status(500).json({
      ok: false,
      message: "An unexpected error occurred. Please try again later.",
      error: "INTERNAL_ERROR",
    });
  }
}

export default subscribeHandler;