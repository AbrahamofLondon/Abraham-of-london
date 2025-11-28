// pages/api/newsletter.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyRecaptcha, RecaptchaError } from "@/lib/verifyRecaptcha";
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

interface NewsletterRequestBody {
  email?: string;
  name?: string;
  company?: string;
  website?: string;
  recaptchaToken?: string;
  source?: string;
  userAgent?: string;
  timestamp?: string;
}

interface NewsletterResponseBody {
  ok: boolean;
  message?: string;
  error?: string;
  requiresVerification?: boolean;
}

// Email validation
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Disposable email domains
const DISPOSABLE_DOMAINS = [
  "tempmail.com",
  "guerrillamail.com",
  "mailinator.com",
  "10minutemail.com",
  "yopmail.com",
  "throwaway.com",
  "fakeinbox.com",
  "trashmail.com",
];

// Security event logger
function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[NEWSLETTER_SECURITY] ${timestamp} - ${event}`, {
    ...details,
    ...(process.env.NODE_ENV === "production" && {
      email: details.email
        ? `${(details.email as string).substring(0, 3)}...`
        : undefined,
      ip: details.ip ? anonymizeIp(details.ip as string) : undefined,
    }),
  });
}

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

  const domain = trimmedEmail.split("@")[1];
  if (DISPOSABLE_DOMAINS.some((d) => domain.includes(d))) {
    logSecurityEvent("Disposable email detected", {
      email: trimmedEmail,
      domain,
    });
    return { isValid: false, error: "Please use a permanent email address" };
  }

  return { isValid: true };
}

function validateName(name: string): { isValid: boolean; error?: string } {
  if (!name) return { isValid: true };

  const trimmedName = name.trim();

  if (trimmedName.length > 100) {
    return { isValid: false, error: "Name is too long" };
  }

  const suspiciousPatterns = [/[\<\>\{\}\[\]]/, /(.)\1{10,}/];

  if (suspiciousPatterns.some((pattern) => pattern.test(trimmedName))) {
    return { isValid: false, error: "Invalid name format" };
  }

  return { isValid: true };
}

// Mailchimp integration function
async function subscribeToMailchimp(
  email: string,
  name?: string,
  tags: string[] = [],
): Promise<{ success: boolean; error?: string }> {
  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const API_SERVER = process.env.MAILCHIMP_API_SERVER;
  const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!API_KEY || !API_SERVER || !AUDIENCE_ID) {
    // eslint-disable-next-line no-console
    console.error("Mailchimp environment variables not configured");
    return { success: false, error: "Service configuration error" };
  }

  const url = `https://${API_SERVER}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`;

  const data: Record<string, unknown> = {
    email_address: email,
    status: "subscribed",
    tags: ["website-signup", ...tags],
  };

  if (name) {
    data.merge_fields = { FNAME: name };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `api_key ${API_KEY}`,
      },
      body: JSON.stringify(data),
    });

    if (response.status === 200) {
      return { success: true };
    }

    const errorData = (await response.json()) as { title?: string };

    if (errorData.title === "Member Exists") {
      return {
        success: false,
        error: "This email is already subscribed to our newsletter",
      };
    }

    // eslint-disable-next-line no-console
    console.error("Mailchimp API error:", errorData);
    return {
      success: false,
      error: "Failed to subscribe. Please try again later.",
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Mailchimp subscription error:", error);
    return {
      success: false,
      error: "Subscription service temporarily unavailable",
    };
  }
}

// Send notification to Abraham
async function sendNotificationToAbraham(subscriberData: {
  email: string;
  name?: string;
  source: string;
}): Promise<void> {
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Newsletter System <system@fatheringwithoutfear.com>",
        to: "Abraham@AbrahamofLondon.com",
        subject: "🎉 New Newsletter Subscriber",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5530;">New Newsletter Subscriber!</h2>
            <p><strong>Email:</strong> ${subscriberData.email}</p>
            <p><strong>Name:</strong> ${
              subscriberData.name || "Not provided"
            }</p>
            <p><strong>Source:</strong> ${subscriberData.source}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p style="color: #2c5530; font-weight: bold;">
              This subscriber has been added to the Mailchimp audience.
            </p>
          </div>
        `,
      }),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to send notification to Abraham:", error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NewsletterResponseBody>,
): Promise<void> {
  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({
      ok: false,
      error: `Method ${req.method ?? "UNKNOWN"} Not Allowed`,
    });
    return;
  }

  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.includes("application/json")) {
    res.status(400).json({
      ok: false,
      error: "Content-Type must be application/json",
    });
    return;
  }

  let body: NewsletterRequestBody;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json({
      ok: false,
      error: "Invalid JSON body",
    });
    return;
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();
  const companyHoneypot = (body.company ?? "").trim();
  const websiteHoneypot = (body.website ?? "").trim();
  const recaptchaToken = (body.recaptchaToken ?? "").trim();
  const source = body.source || "newsletter_api";
  const userAgent = body.userAgent || req.headers["user-agent"] || "unknown";

  const ipAnalysis = getClientIpWithAnalysis(req);
  const ip = ipAnalysis.ip;

  // Honeypots
  if (companyHoneypot || websiteHoneypot) {
    logSecurityEvent("Honeypot triggered", {
      ip,
      email,
      companyHoneypot,
      websiteHoneypot,
    });

    res.status(200).json({
      ok: true,
      message: "You have been subscribed successfully.",
    });
    return;
  }

  // Email validation
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    res.status(400).json({
      ok: false,
      error: emailValidation.error!,
    });
    return;
  }

  // Name validation
  const nameValidation = validateName(name);
  if (!nameValidation.isValid) {
    res.status(400).json({
      ok: false,
      error: nameValidation.error!,
    });
    return;
  }

  // 🔒 Shared per-IP rate limiting
  const rlKey = getRateLimitKey(
    req,
    RATE_LIMIT_CONFIGS.NEWSLETTER_SUBSCRIBE.keyPrefix,
  );
  const rateLimitResult = rateLimit(rlKey, RATE_LIMIT_CONFIGS.NEWSLETTER_SUBSCRIBE);

  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (!rateLimitResult.allowed) {
    logSecurityEvent("Rate limit exceeded", {
      ip,
      email,
      remaining: rateLimitResult.remaining,
      retryAfterMs: rateLimitResult.retryAfterMs,
    });

    res.status(429).json({
      ok: false,
      error: "Too many subscription attempts. Please try again later.",
    });
    return;
  }

  // reCAPTCHA verification (required)
  if (!recaptchaToken) {
    res.status(400).json({
      ok: false,
      error: "Security token is required",
    });
    return;
  }

  let recaptchaResult;
  try {
    recaptchaResult = await verifyRecaptcha(
      recaptchaToken,
      "newsletter_signup",
      ip,
    );

    if (!recaptchaResult.success) {
      logSecurityEvent("reCAPTCHA failed", {
        ip,
        email,
        score: recaptchaResult.score,
        reasons: recaptchaResult.reasons,
      });

      res.status(400).json({
        ok: false,
        error: "Security verification failed. Please try again.",
      });
      return;
    }

    if (recaptchaResult.score < 0.3) {
      logSecurityEvent("Low reCAPTCHA score", {
        ip,
        email,
        score: recaptchaResult.score,
        action: recaptchaResult.action,
      });
    }
  } catch (err) {
    const e = err as RecaptchaError;
    logSecurityEvent("reCAPTCHA error", {
      ip,
      email,
      error: e.message,
      code: e.code,
    });

    res.status(400).json({
      ok: false,
      error: "Security check failed. Please refresh and try again.",
    });
    return;
  }

  try {
    const mailchimpResult = await subscribeToMailchimp(email, name, [source]);

    if (!mailchimpResult.success) {
      res.status(400).json({
        ok: false,
        error:
          mailchimpResult.error ||
          "Failed to subscribe. Please try again.",
      });
      return;
    }

    await sendNotificationToAbraham({
      email,
      name: name || undefined,
      source,
    });

    logSecurityEvent("Newsletter subscription successful", {
      ip: anonymizeIp(ip),
      email: `${email.substring(0, 3)}...`,
      name: name ? `${name.substring(0, 1)}...` : "not provided",
      source,
      recaptchaScore: recaptchaResult.score,
      userAgent: userAgent.substring(0, 100),
    });

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[NEWSLETTER] Subscription details:", {
        email,
        name: name || "not provided",
        ip: anonymizeIp(ip),
        source,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      ok: true,
      message: "Awesome! You have successfully subscribed!",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[NEWSLETTER] Subscription error:", error);

    logSecurityEvent("Newsletter subscription failed", {
      ip,
      email,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    res.status(500).json({
      ok: false,
      error: "An unexpected error occurred. Please try again later.",
    });
  }
}