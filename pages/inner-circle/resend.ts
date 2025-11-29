// pages/api/inner-circle/resend.ts
import type { NextApiRequest, NextApiResponse } from "next";

import {
  combinedRateLimit,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/server/rateLimit";
import { createOrUpdateMemberAndIssueKey } from "@/lib/innerCircleMembership";
import { sendInnerCircleEmail } from "@/lib/email/sendInnerCircleEmail";
import { getClientIpWithAnalysis } from "@/lib/server/ip";

type ResendSuccess = { ok: true; message: string };
type ResendFailure = { ok: false; error: string };
export type ResendResponse = ResendSuccess | ResendFailure;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function logResend(action: string, meta: Record<string, unknown> = {}): void {
  // eslint-disable-next-line no-console
  console.log(`[InnerCircle:Resend] ${action}`, {
    ts: new Date().toISOString(),
    ...meta,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResendResponse>,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const { email, returnTo } = (req.body ?? {}) as {
    email?: string;
    returnTo?: string;
  };

  if (!email || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ ok: false, error: "Valid email is required." });
    return;
  }

  const sanitizedEmail = email.toLowerCase().trim();
  const ipInfo = getClientIpWithAnalysis(req);
  const ip = ipInfo.ip;

  const {
    allowed,
    hitIpLimit,
    hitEmailLimit,
    ipResult,
    emailResult,
  } = combinedRateLimit(
    req,
    sanitizedEmail,
    "inner-circle-resend",
    RATE_LIMIT_CONFIGS.INNER_CIRCLE_RESEND,
    RATE_LIMIT_CONFIGS.INNER_CIRCLE_RESEND_EMAIL,
  );

  if (!allowed) {
    const headers = createRateLimitHeaders(hitIpLimit ? ipResult : emailResult!);
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));

    const msg = hitEmailLimit
      ? "Too many email requests for this address. Try again later."
      : "Too many requests from this location. Try again later.";

    logResend("rate_limited", { ip, emailHash: Buffer.from(sanitizedEmail).toString("base64") });

    res.status(429).json({ ok: false, error: msg });
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    res.status(500).json({
      ok: false,
      error: "Inner Circle is not configured.",
    });
    return;
  }

  const safeReturnTo =
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//")
      ? returnTo
      : "/canon";

  try {
    const keyRecord = await createOrUpdateMemberAndIssueKey({
      email: sanitizedEmail,
      ipAddress: ip,
      context: "resend",
    });

    const unlockUrl = `${siteUrl}/api/inner-circle/unlock?key=${encodeURIComponent(
      keyRecord.key,
    )}&returnTo=${encodeURIComponent(safeReturnTo)}`;

    await sendInnerCircleEmail({
      email: sanitizedEmail,
      name: undefined,
      accessKey: keyRecord.key,
      unlockUrl,
      mode: "resend",
    });

    logResend("success", { keySuffix: keyRecord.keySuffix, ip });

    res.status(200).json({
      ok: true,
      message: "We've resent your Inner Circle access email.",
    });
  } catch (err) {
    logResend("error", { ip, error: err instanceof Error ? err.message : "unknown" });
    res.status(500).json({
      ok: false,
      error: "Could not resend your key. Please try again later.",
    });
  }
}