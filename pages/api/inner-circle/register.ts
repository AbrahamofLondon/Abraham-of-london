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

type Success = { ok: true; message?: string };
type Failure = { ok: false; error: string };
type RegisterResponse = Success | Failure;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function logRegistration(action: string, metadata?: unknown): void {
  // eslint-disable-next-line no-console
  console.log(`📝 InnerCircle register: ${action}`, {
    timestamp: new Date().toISOString(),
    metadata,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>,
): Promise<void> {
  if (req.method !== "POST") {
    logRegistration("method_not_allowed", { method: req.method });
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const { email, name, returnTo } = (req.body ?? {}) as {
      email?: string;
      name?: string;
      returnTo?: string;
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
      logRegistration("invalid_name", { hasName: !!name, length: name?.length });
      res.status(400).json({
        ok: false,
        error: "Please provide a valid name (minimum 2 characters).",
      });
      return;
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();
    const safeReturnTo =
      typeof returnTo === "string" &&
      returnTo.startsWith("/") &&
      !returnTo.startsWith("//")
        ? returnTo
        : "/canon";

    // Rate limiting (IP + email)
    const {
      allowed,
      hitIpLimit,
      hitEmailLimit,
      ip,
      ipResult,
      emailResult,
    } = combinedRateLimit(
      req,
      sanitizedEmail,
      "inner-circle-register",
      RATE_LIMIT_CONFIGS.INNER_CIRCLE_REGISTER,
      RATE_LIMIT_CONFIGS.INNER_CIRCLE_REGISTER_EMAIL,
    );

    if (!allowed) {
      const headers = createRateLimitHeaders(hitIpLimit ? ipResult : emailResult!);
      Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));

      const errorMessage = hitEmailLimit
        ? "Too many registration attempts for this email. Please try again in an hour."
        : "Too many attempts from your location. Please try again in 15 minutes.";

      logRegistration("rate_limited", { ip, hitIpLimit, hitEmailLimit });
      res.status(429).json({ ok: false, error: errorMessage });
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

    // Issue key
    const keyRecord = createOrUpdateMemberAndIssueKey({
      email: sanitizedEmail,
      name: sanitizedName,
      ipAddress: ip,
      context: "register",
    });

    const unlockUrl = `${siteUrl}/api/inner-circle/unlock?key=${encodeURIComponent(
      keyRecord.key,
    )}&returnTo=${encodeURIComponent(safeReturnTo)}`;

    await sendInnerCircleEmail({
      email: sanitizedEmail,
      name: sanitizedName,
      accessKey: keyRecord.key,
      unlockUrl,
    });

    logRegistration("success", {
      keySuffix: keyRecord.keySuffix,
      hasName: !!sanitizedName,
    });

    // Optional: log stats for monitoring (privacy-safe)
    const stats = getPrivacySafeStats();
    logRegistration("stats_snapshot", stats);

    res.status(200).json({
      ok: true,
      message: "Registration successful. Check your email for your access key.",
    });
  } catch (err) {
    logRegistration("error", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    res.status(500).json({
      ok: false,
      error: "An unexpected error occurred. Please try again later.",
    });
  }
}

export async function getRegistrationStats() {
  return getPrivacySafeStats();
}