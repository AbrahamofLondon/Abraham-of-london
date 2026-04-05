import type { NextApiRequest, NextApiResponse } from "next";
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

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/u;

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

const ADMIN_NOTIFICATION_RECIPIENTS = [
  "info@abrahamoflondon.org",
  "seunadaramola@gmail.com",
  "abrahamadaramola@outlook.com",
];

function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString();

  console.log(`[NEWSLETTER_SECURITY] ${timestamp} - ${event}`, {
    ...details,
    ...(process.env.NODE_ENV === "production" && {
      email: details.email ? `${String(details.email).substring(0, 3)}...` : undefined,
      ip: details.ip ? anonymizeIp(String(details.ip)) : undefined,
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

  const parts = trimmedEmail.split("@");
  const domain = parts.length > 1 ? parts[1] ?? "" : "";

  if (!domain) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

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

  const suspiciousPatterns = [/[<>{}\[\]]/u, /(.)\1{10,}/u];

  if (suspiciousPatterns.some((pattern) => pattern.test(trimmedName))) {
    return { isValid: false, error: "Invalid name format" };
  }

  return { isValid: true };
}

async function subscribeToMailchimp(
  email: string,
  name?: string,
  tags: string[] = [],
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const apiServer = process.env.MAILCHIMP_API_SERVER;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !apiServer || !audienceId) {
    console.error("[NEWSLETTER] Mailchimp environment variables not configured");
    return { success: false, error: "Service configuration error" };
  }

  const url = `https://${apiServer}.api.mailchimp.com/3.0/lists/${audienceId}/members`;

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
        Authorization: `api_key ${apiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return { success: true };
    }

    const errorData = (await response.json()) as { title?: string };

    if (errorData.title === "Member Exists") {
      return {
        success: false,
        error: "This email is already subscribed to our newsletter",
      };
    }

    console.error("[NEWSLETTER] Mailchimp API error:", errorData);
    return {
      success: false,
      error: "Failed to subscribe. Please try again later.",
    };
  } catch (error) {
    console.error("[NEWSLETTER] Mailchimp subscription error:", error);
    return {
      success: false,
      error: "Subscription service temporarily unavailable",
    };
  }
}

async function sendNotificationToAbraham(subscriberData: {
  email: string;
  name?: string;
  source: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[NEWSLETTER] RESEND_API_KEY missing; admin notification skipped.");
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Abraham of London <info@abrahamoflondon.org>",
        to: ADMIN_NOTIFICATION_RECIPIENTS,
        reply_to: subscriberData.email,
        subject: "New Newsletter Subscriber",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5530;">New Newsletter Subscriber</h2>
            <p><strong>Email:</strong> ${subscriberData.email}</p>
            <p><strong>Name:</strong> ${subscriberData.name || "Not provided"}</p>
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
    console.error("[NEWSLETTER] Failed to send admin notification:", error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NewsletterResponseBody>,
): Promise<void> {
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
  const source = (body.source ?? "newsletter_api").trim() || "newsletter_api";
  const userAgent = String(body.userAgent || req.headers["user-agent"] || "unknown");

  const ipAnalysis = getClientIpWithAnalysis(req);
  const ip = ipAnalysis.ip;

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

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    res.status(400).json({
      ok: false,
      error: emailValidation.error ?? "Invalid email address",
    });
    return;
  }

  const nameValidation = validateName(name);
  if (!nameValidation.isValid) {
    res.status(400).json({
      ok: false,
      error: nameValidation.error ?? "Invalid name",
    });
    return;
  }

  const newsletterRateConfig =
    RATE_LIMIT_CONFIGS.newsletter ?? RATE_LIMIT_CONFIGS.subscribe;

  const rlKey = getRateLimitKey(req, "newsletter");
  const rateLimitResult = rateLimit(rlKey, newsletterRateConfig);

  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (!rateLimitResult.allowed) {
    logSecurityEvent("Rate limit exceeded", {
      ip,
      email,
      remaining: rateLimitResult.remaining,
      resetSeconds: rateLimitResult.resetSeconds,
    });

    res.status(429).json({
      ok: false,
      error: "Too many subscription attempts. Please try again later.",
    });
    return;
  }

  if (!recaptchaToken) {
    res.status(400).json({
      ok: false,
      error: "Security token is required",
    });
    return;
  }

  let recaptchaResult: unknown;
  try {
    recaptchaResult = await verifyRecaptcha(
      recaptchaToken,
      "newsletter_signup",
      ip,
    );

    const isSuccess =
      typeof recaptchaResult === "boolean"
        ? recaptchaResult
        : Boolean((recaptchaResult as { success?: boolean })?.success);

    const score =
      typeof recaptchaResult === "object" && recaptchaResult
        ? (recaptchaResult as { score?: number })?.score
        : undefined;

    if (!isSuccess) {
      logSecurityEvent("reCAPTCHA failed", {
        ip,
        email,
        score,
        reasons:
          typeof recaptchaResult === "object" && recaptchaResult
            ? (recaptchaResult as { reasons?: unknown })?.reasons
            : "unknown",
      });

      res.status(400).json({
        ok: false,
        error: "Security verification failed. Please try again.",
      });
      return;
    }

    if (typeof score === "number" && score < 0.3) {
      logSecurityEvent("Low reCAPTCHA score", {
        ip,
        email,
        score,
        action:
          typeof recaptchaResult === "object" && recaptchaResult
            ? (recaptchaResult as { action?: unknown })?.action
            : undefined,
      });
    }
  } catch (err) {
    const e = err as Error;

    logSecurityEvent("reCAPTCHA error", {
      ip,
      email,
      error: e.message,
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
        error: mailchimpResult.error || "Failed to subscribe. Please try again.",
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
      recaptchaScore:
        typeof recaptchaResult === "object" && recaptchaResult
          ? (recaptchaResult as { score?: unknown })?.score
          : "N/A",
      userAgent: userAgent.substring(0, 100),
    });

    if (process.env.NODE_ENV !== "production") {
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