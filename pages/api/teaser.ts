import type { NextApiRequest, NextApiResponse } from "next";
import {
  verifyRecaptchaDetailed, // ✅ Changed to Detailed version
} from "@/lib/recaptchaServer";
import {
  rateLimit,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/server/rate-limit-unified";
import {
  getClientIpWithAnalysis,
  getRateLimitKey,
  anonymizeIp,
} from "@/lib/server/ip";

// Email validation with comprehensive checks
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
  "getairmail.com",
  "maildrop.cc",
  "disposableemail.com",
];

interface TeaserRequestBody {
  email?: string;
  name?: string;
  website?: string; // honeypot
  confirm_email?: string; // additional honeypot
  recaptchaToken?: string;
  source?: string;
  userAgent?: string;
  timestamp?: string;
}

interface TeaserResponse {
  ok: boolean;
  message: string;
  errorCode?: string;
  requiresVerification?: boolean;
}

// Security event logger
function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[SECURITY] ${timestamp} - ${event}`, {
    ...details,
    ...(process.env.NODE_ENV === "production" && {
      email: details.email
        ? `${(details.email as string).substring(0, 3)}...`
        : undefined,
      ip: details.ip ? anonymizeIp(details.ip as string) : undefined,
    }),
  });
}

function extractEmailDomain(email: string): string | null {
  const trimmedEmail = email.trim().toLowerCase();
  const atIndex = trimmedEmail.lastIndexOf("@");

  if (atIndex <= 0 || atIndex >= trimmedEmail.length - 1) {
    return null;
  }

  const domain = trimmedEmail.slice(atIndex + 1).trim();
  return domain || null;
}

function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required" };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Length validation
  if (trimmedEmail.length > 254) {
    return { isValid: false, error: "Email address is too long" };
  }

  // Format validation
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  // Domain extraction
  const domain = extractEmailDomain(trimmedEmail);
  if (!domain) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  // Disposable email detection
  if (DISPOSABLE_DOMAINS.some((d) => domain.includes(d))) {
    logSecurityEvent("Disposable email detected", {
      email: trimmedEmail,
      domain,
    });
    return { isValid: false, error: "Please use a permanent email address" };
  }

  // Common fake email patterns
  const fakePatterns = [/^test@/i, /^admin@/i, /^user@/i, /^demo@/i];

  if (fakePatterns.some((pattern) => pattern.test(trimmedEmail))) {
    return { isValid: false, error: "Please use a valid email address" };
  }

  return { isValid: true };
}

function validateName(name: string): { isValid: boolean; error?: string } {
  if (!name) return { isValid: true };

  const trimmedName = name.trim();

  if (trimmedName.length > 100) {
    return { isValid: false, error: "Name is too long" };
  }

  const suspiciousPatterns = [
    /[<>{}[\]]/,
    /(.)\1{10,}/,
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(trimmedName))) {
    return { isValid: false, error: "Invalid name format" };
  }

  return { isValid: true };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TeaserResponse>,
): Promise<void> {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({
      ok: false,
      message: `Method ${req.method ?? "UNKNOWN"} Not Allowed`,
    });
    return;
  }

  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.includes("application/json")) {
    res.status(400).json({
      ok: false,
      message: "Content-Type must be application/json",
    });
    return;
  }

  let body: TeaserRequestBody;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (_error) {
    res.status(400).json({
      ok: false,
      message: "Invalid JSON body",
    });
    return;
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();
  const honeypot = (body.website ?? "").trim();
  const confirmEmailHoneypot = (body.confirm_email ?? "").trim();
  const recaptchaToken = body.recaptchaToken || "";
  const source = body.source || "teaser_api";
  const userAgent = body.userAgent || req.headers["user-agent"] || "unknown";

  const ipAnalysis = getClientIpWithAnalysis(req);
  const ip = ipAnalysis.ip;

  if (honeypot || confirmEmailHoneypot) {
    logSecurityEvent("Honeypot triggered", {
      ip,
      email,
      honeypot,
      confirmEmailHoneypot,
    });

    res.status(200).json({
      ok: true,
      message: "Teaser sent. Please check your inbox.",
    });
    return;
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    res.status(400).json({
      ok: false,
      message: emailValidation.error ?? "Invalid email",
      errorCode: "INVALID_EMAIL",
    });
    return;
  }

  const nameValidation = validateName(name);
  if (!nameValidation.isValid) {
    res.status(400).json({
      ok: false,
      message: nameValidation.error ?? "Invalid name",
      errorCode: "INVALID_NAME",
    });
    return;
  }

  const rateLimitKey = getRateLimitKey(req, "teaser");
  
  // The unified rateLimit expects (id, config)
  const rateLimitResult = await rateLimit(
    rateLimitKey,
    RATE_LIMIT_CONFIGS.CONTACT, // Using CONTACT config for teaser (5 per hour)
  );

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
      message: "Too many requests. Please try again later.",
      errorCode: "RATE_LIMIT_EXCEEDED",
    });
    return;
  }

  if (!recaptchaToken) {
    res.status(400).json({
      ok: false,
      message: "Security token is required",
      errorCode: "MISSING_RECAPTCHA",
    });
    return;
  }

  let recaptchaResult;
  try {
    // ✅ Use verifyRecaptchaDetailed to get the full result object
    recaptchaResult = await verifyRecaptchaDetailed(
      recaptchaToken,
      "teaser_request",
      ip,
    );

    if (!recaptchaResult.success) {
      logSecurityEvent("reCAPTCHA failed", {
        ip,
        email,
        score: recaptchaResult.score,
        errorCodes: recaptchaResult.errorCodes,
      });

      res.status(400).json({
        ok: false,
        message: "Security verification failed. Please try again.",
        errorCode: "RECAPTCHA_FAILED",
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
  } catch (error) {
    const recaptchaError = error as Error;

    logSecurityEvent("reCAPTCHA error", {
      ip,
      email,
      error: recaptchaError.message,
    });

    res.status(400).json({
      ok: false,
      message: "Security check failed. Please refresh and try again.",
      errorCode: "RECAPTCHA_ERROR",
    });
    return;
  }

  try {
    logSecurityEvent("Teaser request successful", {
      ip: anonymizeIp(ip),
      email: `${email.substring(0, 3)}...`,
      name: name ? `${name.substring(0, 1)}...` : "not provided",
      source,
      recaptchaScore: recaptchaResult.score,
      userAgent: String(userAgent).substring(0, 100),
    });

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[TEASER] Request details:", {
        email,
        name: name || "not provided",
        ip: anonymizeIp(ip),
        source,
        timestamp: new Date().toISOString(),
        recaptchaScore: recaptchaResult.score,
      });
    }

    // Here you would actually send the email
    // await sendTeaserEmail({ email, name, source });

    res.status(200).json({
      ok: true,
      message: "Teaser sent! Please check your inbox.",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[TEASER] Email sending error:", error);

    logSecurityEvent("Teaser email failed", {
      ip,
      email,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    res.status(500).json({
      ok: false,
      message: "Failed to send teaser. Please try again later.",
      errorCode: "EMAIL_SEND_FAILED",
    });
  }
}

// Health check endpoint (optional)
export function isTeaserApiHealthy(): boolean {
  return true;
}