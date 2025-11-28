// pages/api/inner-circle/register.ts
import type { NextApiRequest, NextApiResponse } from "next";

import { sendInnerCircleEmail } from "@/lib/email/sendInnerCircleEmail";
import {
  combinedRateLimit,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/server/rateLimit";
import { createOrUpdateMemberAndIssueKey } from "@/lib/innerCircleMembership";

type Success = {
  ok: true;
  message?: string;
};

type Failure = {
  ok: false;
  error: string;
};

type RegisterResponse = Success | Failure;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>,
) {
  if (req.method !== "POST") {
    console.warn(`⚠️ Method not allowed: ${req.method} for Inner Circle registration`);
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { email, name, returnTo } = (req.body ?? {}) as {
      email?: string;
      name?: string;
      returnTo?: string;
    };

    // Input validation
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        ok: false,
        error: "Please provide a valid email address.",
      });
    }

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        ok: false,
        error: "Please provide a valid name (minimum 2 characters).",
      });
    }

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedName = name.trim();
    const safeReturnTo =
      typeof returnTo === "string" &&
      returnTo.startsWith("/") &&
      !returnTo.startsWith("//")
        ? returnTo
        : "/canon";

    // Enhanced rate limiting with both IP and email protection
    const { 
      allowed, 
      hitIpLimit, 
      hitEmailLimit, 
      ip, 
      email: rateLimitEmail,
      ipResult,
      emailResult 
    } = combinedRateLimit(
      req,
      sanitizedEmail,
      "inner-circle-register",
      RATE_LIMIT_CONFIGS.INNER_CIRCLE_REGISTER,
      RATE_LIMIT_CONFIGS.INNER_CIRCLE_REGISTER_EMAIL
    );

    // Log rate limit hits for security monitoring
    if (!allowed) {
      if (hitIpLimit) {
        console.warn(`🚨 IP Rate limit exceeded for Inner Circle registration: ${ip}`, {
          ip,
          email: sanitizedEmail,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        });
      }
      if (hitEmailLimit) {
        console.warn(`🚨 Email Rate limit exceeded for Inner Circle registration: ${rateLimitEmail}`, {
          ip,
          email: rateLimitEmail,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        });
      }

      const headers = createRateLimitHeaders(hitIpLimit ? ipResult : emailResult!);
      Object.entries(headers).forEach(([key, value]) =>
        res.setHeader(key, value),
      );

      const errorMessage = hitEmailLimit 
        ? "Too many registration attempts for this email address. Please try again in an hour."
        : "Too many registration attempts from your location. Please try again in 15 minutes.";

      return res.status(429).json({
        ok: false,
        error: errorMessage,
      });
    }

    // Log successful rate limit passage
    console.log(`✅ Rate limit check passed for Inner Circle registration:`, {
      ip,
      email: sanitizedEmail,
      name: sanitizedName,
      remaining: Math.min(ipResult.remaining, emailResult?.remaining ?? Infinity),
      timestamp: new Date().toISOString()
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      console.error("❌ NEXT_PUBLIC_SITE_URL environment variable not set");
      return res.status(500).json({
        ok: false,
        error: "Inner Circle is not configured on the server.",
      });
    }

    // Create member record and issue access key
    const keyRecord = await createOrUpdateMemberAndIssueKey({
      email: sanitizedEmail,
      name: sanitizedName,
      ipAddress: ip,
      context: "register",
    });

    const unlockUrl = `${siteUrl}/api/inner-circle/unlock?key=${encodeURIComponent(
      keyRecord.key,
    )}&returnTo=${encodeURIComponent(safeReturnTo)}`;

    // Send welcome email with access key
    await sendInnerCircleEmail({
      email: sanitizedEmail,
      name: sanitizedName,
      accessKey: keyRecord.key,
      unlockUrl,
    });

    // Log successful registration
    console.log(`🎉 Inner Circle registration successful:`, {
      email: sanitizedEmail,
      name: sanitizedName,
      registrationId: keyRecord.id,
      ip,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({ 
      ok: true,
      message: "Registration successful! Check your email for access instructions."
    });

  } catch (error) {
    console.error("❌ Inner Circle registration error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      ok: false,
      error: "An unexpected error occurred. Please try again later.",
    });
  }
}