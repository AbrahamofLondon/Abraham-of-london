// pages/api/inner-circle/register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sendInnerCircleEmail } from "@/lib/email/sendInnerCircleEmail";
import {
  combinedRateLimit,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/server/rateLimit";
import {
  createOrUpdateMemberAndIssueKey,
  getPrivacySafeStats,
} from "@/lib/innerCircleMembership";
import { verifyRecaptcha } from "@/lib/verifyRecaptcha";
import { getClientIpWithAnalysis } from "@/lib/server/ip";

type Success = {
  ok: true;
  message?: string;
};

type Failure = {
  ok: false;
  error: string;
};

export type RegisterResponse = Success | Failure;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function logRegistration(
  action: string,
  meta: Record<string, unknown> = {}
): void {
  // eslint-disable-next-line no-console
  console.log(`[InnerCircle:Register] ${action}`, {
    ts: new Date().toISOString(),
    ...meta,
  });
}

// Optional: simple flag to allow hard-enforcing reCAPTCHA later
const RECAPTCHA_REQUIRED =
  process.env.INNER_CIRCLE_RECAPTCHA_REQUIRED === "1";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>
): Promise<void> {
  if (req.method !== "POST") {
    logRegistration("method_not_allowed", { method: req.method });
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const { email, name, returnTo, recaptchaToken } = (req.body ?? {}) as {
    email?: string;
    name?: string;
    returnTo?: string;
    recaptchaToken?: string;
  };

  if (!email || !EMAIL_REGEX.test(email)) {
    logRegistration("invalid_email", { hasEmail: !!email });
    res.status(400).json({
      ok: false,
      error: "Please provide a valid email address.",
    });
    return;
  }

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    logRegistration("invalid_name", { hasName: !!name, len: name?.length });
    res.status(400).json({
      ok: false,
      error: "Please provide a valid name (min 2 characters).",
    });
    return;
  }

  const ipInfo = getClientIpWithAnalysis(req);
  const ip = ipInfo.ip;

  // ─────────────────────────────────────────────────────────────
  // reCAPTCHA verification – soft if no token, hard if flagged
  // ─────────────────────────────────────────────────────────────
  if (RECAPTCHA_REQUIRED && !recaptchaToken) {
    logRegistration("recaptcha_missing_hard_fail", { ip });
    res.status(400).json({
      ok: false,
      error: "Security check failed. Please refresh and try again.",
    });
    return;
  }

  if (recaptchaToken) {
    try {
      const result = await verifyRecaptcha(
        recaptchaToken,
        "inner_circle_register",
        ip
      );

      if (!result.success || result.score < 0.2) {
        logRegistration("recaptcha_failed", {
          ip,
          score: result.score,
          reasons: result.reasons,
        });
        res.status(400).json({
          ok: false,
          error: "Security verification failed. Please try again.",
        });
        return;
      }
    } catch (err) {
      logRegistration("recaptcha_error", {
        ip,
        error: err instanceof Error ? err.message : "unknown",
      });

      if (RECAPTCHA_REQUIRED) {
        res.status(400).json({
          ok: false,
          error: "Security verification failed. Please try again.",
        });
        return;
      }

      // If not strictly required, log and continue
    }
  } else {
    // No token supplied and not hard-required – log for audit and continue
    logRegistration("recaptcha_skipped_no_token", { ip });
  }

  const sanitizedEmail = email.toLowerCase().trim();
  const sanitizedName = name.trim();
  const safeReturnTo =
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//")
      ? returnTo
      : "/canon";

  // Rate limit (IP + email)
  const { allowed, hitIpLimit, hitEmailLimit, ipResult, emailResult } =
    combinedRateLimit(
      req,
      sanitizedEmail,
      "inner-circle-register",
      RATE_LIMIT_CONFIGS.INNER_CIRCLE_REGISTER,
      RATE_LIMIT_CONFIGS.INNER_CIRCLE_REGISTER_EMAIL
    );

  if (!allowed) {
    const headers = createRateLimitHeaders(
      hitIpLimit ? ipResult : emailResult!
    );
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));

    const msg = hitEmailLimit
      ? "Too many registrations for this email. Try again in an hour."
      : "Too many attempts from this location. Try again in 15 minutes.";

    logRegistration("rate_limited", {
      ip,
      emailHashBase64: Buffer.from(sanitizedEmail).toString("base64"),
      hitIpLimit,
      hitEmailLimit,
    });

    res.status(429).json({ ok: false, error: msg });
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    logRegistration("missing_site_url");
    res.status(500).json({
      ok: false,
      error: "Inner Circle is not configured on the server.",
    });
    return;
  }

  try {
    const keyRecord = await createOrUpdateMemberAndIssueKey({
      email: sanitizedEmail,
      name: sanitizedName,
      ipAddress: ip,
      context: "register",
    });

    const unlockUrl = `${siteUrl}/api/inner-circle/unlock?key=${encodeURIComponent(
      keyRecord.key
    )}&returnTo=${encodeURIComponent(safeReturnTo)}`;

    await sendInnerCircleEmail({
      email: sanitizedEmail,
      name: sanitizedName,
      accessKey: keyRecord.key,
      unlockUrl,
    });

    logRegistration("success", {
      keySuffix: keyRecord.keySuffix,
      siteUrl,
    });

    res.status(200).json({
      ok: true,
      message:
        "Registration successful. Check your email for your Inner Circle access key.",
    });
  } catch (err) {
    logRegistration("error", {
      error: err instanceof Error ? err.message : "unknown",
    });
    res.status(500).json({
      ok: false,
      error: "Something went wrong processing your registration.",
    });
  }
}

// Optional: make stats callable elsewhere
export async function getRegistrationStats() {
  return getPrivacySafeStats();
}