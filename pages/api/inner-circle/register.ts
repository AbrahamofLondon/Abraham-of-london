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
  IssuedKey,
} from "@/lib/innerCircleMembership";
import { getClientIpWithAnalysis } from "@/lib/server/ip";
import { verifyRecaptcha } from "@/lib/recaptchaServer";

type Success = {
  ok: true;
  accessKey: string;
  unlockUrl: string;
  message?: string;
};

type Failure = {
  ok: false;
  error: string;
};

export type RegisterResponse = Success | Failure;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const RECAPTCHA_REQUIRED = process.env.INNER_CIRCLE_RECAPTCHA_REQUIRED === "1";
const RECAPTCHA_MIN_SCORE = parseFloat(
  process.env.RECAPTCHA_MIN_SCORE || "0.5"
);
const RECAPTCHA_SUSPICIOUS_THRESHOLD = 0.2;

type RecaptchaResult = {
  success: boolean;
  score: number;
  action?: string;
  errors?: string[];
};

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

function createRecaptchaResult(
  success: boolean,
  score: number = 1.0,
  errors?: string[]
): RecaptchaResult {
  return { success, score, errors };
}

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

  // ───────────────────────────────────────────────
  // reCAPTCHA handling
  // ───────────────────────────────────────────────
  if (RECAPTCHA_REQUIRED && !recaptchaToken) {
    logRegistration("recaptcha_missing", { required: true });
    res.status(400).json({
      ok: false,
      error: "Security check failed. Please refresh and try again.",
    });
    return;
  }

  const ipInfo = getClientIpWithAnalysis(req);
  const ip = ipInfo.ip;

  let recaptchaResult: RecaptchaResult | null = null;

  if (recaptchaToken) {
    try {
      const result = await verifyRecaptcha(
        recaptchaToken,
        "inner_circle_register",
        ip
      );

      if (typeof result === "boolean") {
        recaptchaResult = createRecaptchaResult(result, result ? 1.0 : 0.0);
      } else if (result && typeof result === "object") {
        recaptchaResult = {
          success: result.success || false,
          score: typeof result.score === "number" ? result.score : 0.0,
          action: result.action,
          errors: result.errors,
        };
      } else {
        throw new Error("Invalid reCAPTCHA response format");
      }

      logRegistration("recaptcha_result", {
        success: recaptchaResult.success,
        score: recaptchaResult.score,
        action: recaptchaResult.action,
        minScore: RECAPTCHA_MIN_SCORE,
        suspiciousThreshold: RECAPTCHA_SUSPICIOUS_THRESHOLD,
        ip,
      });

      if (!recaptchaResult.success || recaptchaResult.score < RECAPTCHA_MIN_SCORE) {
        const reason = !recaptchaResult.success
          ? "verification_failed"
          : "score_too_low";

        logRegistration(`recaptcha_${reason}`, {
          ip,
          score: recaptchaResult.score,
          minScore: RECAPTCHA_MIN_SCORE,
          required: RECAPTCHA_REQUIRED,
        });

        if (recaptchaResult.score < RECAPTCHA_SUSPICIOUS_THRESHOLD) {
          logRegistration("recaptcha_suspicious_bot", {
            ip,
            score: recaptchaResult.score,
            emailHashBase64: Buffer.from(email).toString("base64").slice(0, 16),
          });
        }

        if (RECAPTCHA_REQUIRED) {
          res.status(400).json({
            ok: false,
            error: "Security verification failed. Please try again.",
          });
          return;
        }

        logRegistration("recaptcha_bypassed_low_score", {
          ip,
          score: recaptchaResult.score,
        });
      }
    } catch (err) {
      logRegistration("recaptcha_error", {
        ip,
        error: err instanceof Error ? err.message : "unknown",
        required: RECAPTCHA_REQUIRED,
      });

      if (RECAPTCHA_REQUIRED) {
        res.status(400).json({
          ok: false,
          error: "Security verification failed. Please try again.",
        });
        return;
      }

      logRegistration("recaptcha_error_bypassed", { ip });
    }
  } else {
    logRegistration("recaptcha_optional_missing", { required: false });
  }

  const sanitizedEmail = email.toLowerCase().trim();
  const sanitizedName = name.trim();
  const safeReturnTo =
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//")
      ? returnTo
      : "/canon";

  const rateLimitKey =
    recaptchaResult && recaptchaResult.score < 0.3
      ? "inner-circle-register-low-score"
      : "inner-circle-register";

  const { allowed, hitIpLimit, hitEmailLimit, ipResult, emailResult } =
    combinedRateLimit(
      req,
      sanitizedEmail,
      rateLimitKey,
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
      recaptchaScore: recaptchaResult?.score,
      rateLimitKey,
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

  // ───────────────────────────────────────────────
  // Membership creation
  // ───────────────────────────────────────────────
  let keyRecord: IssuedKey;

  try {
    const context =
      recaptchaResult == null
        ? "register"
        : JSON.stringify({
            action: "register",
            recaptchaScore: recaptchaResult.score,
            recaptchaSuccess: recaptchaResult.success,
            ipAnalysis: ipInfo,
          });

    keyRecord = await createOrUpdateMemberAndIssueKey({
      email: sanitizedEmail,
      name: sanitizedName,
      ipAddress: ip,
      context,
    });
  } catch (err) {
    logRegistration("membership_error", {
      ip,
      error: err instanceof Error ? err.message : "unknown",
    });

    res.status(500).json({
      ok: false,
      error:
        "We couldn't create your Inner Circle record. Please try again or contact support.",
    });
    return;
  }

  const unlockUrl = `${siteUrl}/api/inner-circle/unlock?key=${encodeURIComponent(
    keyRecord.key
  )}&returnTo=${encodeURIComponent(safeReturnTo)}`;

  // ───────────────────────────────────────────────
  // Email sending (non-fatal – we still return key)
  // ───────────────────────────────────────────────
  try {
    await sendInnerCircleEmail({
      email: sanitizedEmail,
      name: sanitizedName,
      accessKey: keyRecord.key,
      unlockUrl,
    });
  } catch (err) {
    logRegistration("email_error", {
      ip,
      error: err instanceof Error ? err.message : "unknown",
    });

    // IMPORTANT: still return success with key + unlockUrl
    res.status(200).json({
      ok: true,
      accessKey: keyRecord.key,
      unlockUrl,
      message:
        "Your Inner Circle key was generated, but the email failed. Please contact us if you don't receive it.",
    });
    return;
  }

  logRegistration("success", {
    keySuffix: keyRecord.keySuffix,
    siteUrl,
    recaptchaScore: recaptchaResult?.score,
    ipAnalysis: ipInfo,
  });

  res.status(200).json({
    ok: true,
    accessKey: keyRecord.key,
    unlockUrl,
    message:
      "Registration successful. Check your email for your Inner Circle access key.",
  });
}

// Optional: make stats callable elsewhere
export async function getRegistrationStats() {
  return getPrivacySafeStats();
}