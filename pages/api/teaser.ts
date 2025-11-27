// pages/api/teaser.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyRecaptcha, RecaptchaError, type RecaptchaVerificationResult } from "@/lib/verifyRecaptcha";
import { rateLimit, createRateLimitHeaders, RATE_LIMIT_CONFIGS } from "@/lib/server/rateLimit";
import { getClientIp, getClientIpWithAnalysis, getRateLimitKey, anonymizeIp } from "@/lib/server/ip";

// Email validation with comprehensive checks
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Disposable email domains
const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', 'mailinator.com', 
  '10minutemail.com', 'yopmail.com', 'throwaway.com',
  'fakeinbox.com', 'trashmail.com', 'getairmail.com',
  'maildrop.cc', 'disposableemail.com'
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
function logSecurityEvent(event: string, details: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${event}`, {
    ...details,
    // Don't log sensitive data in production
    ...(process.env.NODE_ENV === 'production' && {
      email: details.email ? `${(details.email as string).substring(0, 3)}...` : undefined,
      ip: details.ip ? anonymizeIp(details.ip as string) : undefined,
    }),
  });
}

function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
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

  // Disposable email detection
  const domain = trimmedEmail.split('@')[1];
  if (DISPOSABLE_DOMAINS.some(d => domain.includes(d))) {
    logSecurityEvent('Disposable email detected', { email: trimmedEmail, domain });
    return { isValid: false, error: "Please use a permanent email address" };
  }

  // Common fake email patterns
  const fakePatterns = [
    /^test@/i,
    /^admin@/i,
    /^user@/i,
    /^demo@/i,
  ];

  if (fakePatterns.some(pattern => pattern.test(trimmedEmail))) {
    return { isValid: false, error: "Please use a valid email address" };
  }

  return { isValid: true };
}

function validateName(name: string): { isValid: boolean; error?: string } {
  if (!name) return { isValid: true }; // Name is optional
  
  const trimmedName = name.trim();
  
  if (trimmedName.length > 100) {
    return { isValid: false, error: "Name is too long" };
  }

  // Check for suspicious patterns (excessive special characters, etc.)
  const suspiciousPatterns = [
    /[<>{}[\]]/, // HTML/script tags
    /(.)\1{10,}/, // Repeated characters
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(trimmedName))) {
    return { isValid: false, error: "Invalid name format" };
  }

  return { isValid: true };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TeaserResponse>,
): Promise<void> {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ 
      ok: false, 
      message: `Method ${req.method ?? "UNKNOWN"} Not Allowed` 
    });
    return;
  }

  // Validate Content-Type
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    res.status(400).json({ 
      ok: false, 
      message: "Content-Type must be application/json" 
    });
    return;
  }

  let body: TeaserRequestBody;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (error) {
    res.status(400).json({ 
      ok: false, 
      message: "Invalid JSON body" 
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

  // Enhanced honeypot detection
  if (honeypot || confirmEmailHoneypot) {
    logSecurityEvent('Honeypot triggered', { 
      ip, 
      email, 
      honeypot, 
      confirmEmailHoneypot 
    });
    
    // Return success to confuse bots
    res.status(200).json({
      ok: true,
      message: "Teaser sent. Please check your inbox.",
    });
    return;
  }

  // Email validation
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    res.status(400).json({ 
      ok: false, 
      message: emailValidation.error!,
      errorCode: "INVALID_EMAIL",
    });
    return;
  }

  // Name validation
  const nameValidation = validateName(name);
  if (!nameValidation.isValid) {
    res.status(400).json({ 
      ok: false, 
      message: nameValidation.error!,
      errorCode: "INVALID_NAME",
    });
    return;
  }

  // 🔒 Enhanced rate limiting
  const rateLimitKey = getRateLimitKey(req, RATE_LIMIT_CONFIGS.TEASER_REQUEST.keyPrefix);
  const rateLimitResult = rateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.TEASER_REQUEST);

  // Add rate limit headers to response
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (!rateLimitResult.allowed) {
    logSecurityEvent('Rate limit exceeded', { 
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

  // 🔒 reCAPTCHA verification
  if (!recaptchaToken) {
    res.status(400).json({
      ok: false,
      message: "Security token is required",
      errorCode: "MISSING_RECAPTCHA",
    });
    return;
  }

  let recaptchaResult: RecaptchaVerificationResult;
  try {
    recaptchaResult = await verifyRecaptcha(recaptchaToken, "teaser_request", ip);
    
    if (!recaptchaResult.success) {
      logSecurityEvent('reCAPTCHA failed', { 
        ip, 
        email, 
        score: recaptchaResult.score,
        reasons: recaptchaResult.reasons,
      });
      
      res.status(400).json({
        ok: false,
        message: "Security verification failed. Please try again.",
        errorCode: "RECAPTCHA_FAILED",
      });
      return;
    }

    // Additional score threshold check
    if (recaptchaResult.score < 0.3) {
      logSecurityEvent('Low reCAPTCHA score', { 
        ip, 
        email, 
        score: recaptchaResult.score,
        action: recaptchaResult.action,
      });
      
      // You might want to require additional verification for low scores
      // For now, we'll just log and proceed
    }
  } catch (err) {
    const error = err as RecaptchaError;
    logSecurityEvent('reCAPTCHA error', { 
      ip, 
      email, 
      error: error.message,
      code: error.code,
    });
    
    res.status(400).json({
      ok: false,
      message: "Security check failed. Please refresh and try again.",
      errorCode: error.code ?? "RECAPTCHA_ERROR",
    });
    return;
  }

  try {
    // TODO: Implement actual email sending with Resend/Mail provider
    // await sendTeaserEmail({ email, name, source });
    
    // Log successful request
    logSecurityEvent('Teaser request successful', {
      ip: anonymizeIp(ip),
      email: `${email.substring(0, 3)}...`,
      name: name ? `${name.substring(0, 1)}...` : 'not provided',
      source,
      recaptchaScore: recaptchaResult.score,
      userAgent: userAgent.substring(0, 100), // Limit length
    });

    // In development, log the details
    if (process.env.NODE_ENV !== "production") {
      console.log("[TEASER] Request details:", {
        email,
        name: name || 'not provided',
        ip: anonymizeIp(ip),
        source,
        timestamp: new Date().toISOString(),
        recaptchaScore: recaptchaResult.score,
      });
    }

    res.status(200).json({
      ok: true,
      message: "Teaser sent! Please check your inbox.",
    });
  } catch (error) {
    console.error("[TEASER] Email sending error:", error);
    
    logSecurityEvent('Teaser email failed', {
      ip,
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
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
  // Add any health checks needed (database, email service, etc.)
  return true;
}