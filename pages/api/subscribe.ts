// pages/api/subscribe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  subscribe,
  type SubscriptionResult,
  type SubscriptionPreferences,
} from "@/lib/server/subscription";
import { verifyRecaptcha } from "@/lib/verifyRecaptcha";

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

// Simple in-memory rate limiting
const rateLimitStore = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
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

function checkRateLimit(identifier: string): { allowed: boolean; remaining?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    rateLimitStore.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false };
  }

  record.count++;
  record.lastAttempt = now;
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

// Cleanup function for rate limit store
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.lastAttempt > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Cleanup every hour

function getClientIp(req: NextApiRequest): string {
  const headers = req.headers;
  
  // Cloudflare
  const cfConnectingIp = headers['cf-connecting-ip'];
  if (cfConnectingIp && typeof cfConnectingIp === 'string') {
    return cfConnectingIp;
  }

  // Standard headers
  const forwardedFor = headers['x-forwarded-for'];
  if (forwardedFor) {
    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0].split(',')[0].trim();
    }
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp;
  }

  const forwarded = headers['forwarded'];
  if (forwarded && typeof forwarded === 'string') {
    const forPart = forwarded.split(';').find(part => part.trim().startsWith('for='));
    if (forPart) {
      return forPart.split('=')[1].trim();
    }
  }

  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubscribeResponseBody>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ 
      ok: false, 
      message: "Method Not Allowed",
      error: "METHOD_NOT_ALLOWED" 
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

    // Enhanced honeypot validation
    if (website && website.trim() !== "") {
      console.warn("Honeypot field 'website' triggered", { email, website });
      return res.status(200).json({
        ok: true,
        message: "You have been subscribed successfully!",
      });
    }

    if (confirm_email && confirm_email.trim() !== "") {
      console.warn("Honeypot field 'confirm_email' triggered", { email, confirm_email });
      return res.status(200).json({
        ok: true,
        message: "You have been subscribed successfully!",
      });
    }

    // Email validation
    const emailValidation = validateEmail(email || '');
    if (!emailValidation.isValid) {
      return res.status(400).json({
        ok: false,
        message: emailValidation.error!,
        error: "INVALID_EMAIL",
      });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const clientIp = getClientIp(req);

    // Rate limiting by IP and email
    const ipRateLimit = checkRateLimit(`ip:${clientIp}`);
    const emailRateLimit = checkRateLimit(`email:${cleanEmail}`);

    if (!ipRateLimit.allowed || !emailRateLimit.allowed) {
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

    let recaptchaScore = 0;
    
    try {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, "generic_subscribe", clientIp);
      recaptchaScore = recaptchaResult.score;
      
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

      // Additional score check
      if (recaptchaResult.score < 0.3) {
        console.warn("Low reCAPTCHA score", {
          email: cleanEmail,
          score: recaptchaResult.score,
          ip: clientIp,
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

    // Use the robust subscription service
    const result: SubscriptionResult = await subscribe(cleanEmail, {
      preferences,
      metadata: {
        ...metadata,
        source: source || "api",
        ip: clientIp,
        userAgent: userAgent || req.headers["user-agent"],
        timestamp: timestamp || new Date().toISOString(),
        recaptchaScore: recaptchaScore,
      },
      tags: tags || ["api-subscriber"],
      referrer: referrer || (req.headers.referer as string | undefined) || "direct",
    });

    // Log successful subscription
    console.info("Subscription completed", {
      email: cleanEmail,
      source,
      ip: clientIp,
      timestamp: new Date().toISOString(),
    });

    // Return appropriate status code based on result
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