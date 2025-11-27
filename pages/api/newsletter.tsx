// pages/api/newsletter.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  subscribe,
  type SubscriptionResult,
  type SubscriptionPreferences,
} from "@/lib/server/subscription";
import { withSecurity } from "@/lib/apiGuard";
import { verifyRecaptcha } from "@/lib/verifyRecaptcha";

interface SubscribeRequestBody {
  email?: string;
  preferences?: SubscriptionPreferences;
  metadata?: Record<string, unknown>;
  tags?: string[];
  referrer?: string;
  website?: string;        // honeypot
  confirm_email?: string;  // additional honeypot
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
  requiresVerification?: boolean;
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Email validation regex
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

  // Check for disposable email domains
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', 'mailinator.com', 
    '10minutemail.com', 'yopmail.com', 'throwaway.com'
  ];
  
  const domain = trimmedEmail.split('@')[1];
  if (disposableDomains.some(d => domain.includes(d))) {
    return { isValid: false, error: "Please use a permanent email address" };
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

  // Clean old records
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

async function sendVerificationEmail(email: string, verificationToken: string): Promise<boolean> {
  try {
    // Implementation for sending verification email
    const verificationLink = `${process.env.NEXTAUTH_URL}/api/verify-newsletter?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    
    // Use your email service (Resend, SendGrid, etc.)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Fathering Without Fear <newsletter@fatheringwithoutfear.com>',
        to: email,
        subject: 'Verify your newsletter subscription',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5530;">Verify Your Newsletter Subscription</h2>
            <p>Thank you for subscribing to Fathering Without Fear!</p>
            <p>Please click the link below to verify your email address and start receiving updates:</p>
            <a href="${verificationLink}" 
               style="background-color: #2c5530; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
               Verify Email Address
            </a>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              If you didn't request this subscription, please ignore this email.
            </p>
          </div>
        `,
      }),
    });

    return emailResponse.ok;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

async function sendNotificationToAbraham(subscriberData: {
  email: string;
  source: string;
  preferences?: SubscriptionPreferences;
}): Promise<void> {
  try {
    // Send notification to Abraham
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Newsletter System <system@fatheringwithoutfear.com>',
        to: 'Abraham@AbrahamofLondon.com',
        subject: 'New Newsletter Subscriber - Verification Required',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5530;">New Newsletter Subscriber</h2>
            <p><strong>Email:</strong> ${subscriberData.email}</p>
            <p><strong>Source:</strong> ${subscriberData.source}</p>
            <p><strong>Preferences:</strong> ${JSON.stringify(subscriberData.preferences || {})}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p style="color: #666; font-size: 14px;">
              This subscriber has been sent a verification email. They will be fully subscribed once they verify their email address.
            </p>
          </div>
        `,
      }),
    });
  } catch (error) {
    console.error('Failed to send notification to Abraham:', error);
    // Don't throw - this shouldn't block the subscription process
  }
}

async function subscribeHandler(
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
      website, // honeypot
      confirm_email, // additional honeypot
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

    // reCAPTCHA verification (already handled by withSecurity, but double-check)
    if (recaptchaToken) {
      try {
        const recaptchaResult = await verifyRecaptcha(recaptchaToken, "newsletter_signup", clientIp);
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
    }

    // Generate verification token
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification data (in production, use your database)
    // For now, we'll simulate storage - implement with your DB
    const verificationData = {
      email: cleanEmail,
      token: verificationToken,
      expires: verificationExpires,
      preferences,
      metadata: {
        ...metadata,
        source,
        ip: clientIp,
        userAgent: userAgent || req.headers["user-agent"],
        timestamp: timestamp || new Date().toISOString(),
        referrer: referrer || req.headers.referer || "direct",
      },
      tags: tags || ["pending-verification"],
    };

    // Send verification email
    const emailSent = await sendVerificationEmail(cleanEmail, verificationToken);
    
    if (!emailSent) {
      return res.status(500).json({
        ok: false,
        message: "Failed to send verification email. Please try again.",
        error: "EMAIL_SEND_FAILED",
      });
    }

    // Send notification to Abraham
    await sendNotificationToAbraham({
      email: cleanEmail,
      source: source,
      preferences,
    });

    // Log the subscription attempt
    console.info("Newsletter subscription initiated", {
      email: cleanEmail,
      source,
      ip: clientIp,
      userAgent: userAgent?.substring(0, 100), // Limit length
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      ok: true,
      message: "Please check your email to verify your subscription.",
      requiresVerification: true,
    });

  } catch (error: unknown) {
    console.error("Subscription API error:", error);

    // Don't expose internal errors to clients
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    
    return res.status(500).json({
      ok: false,
      message: "An unexpected error occurred. Please try again later.",
      error: "INTERNAL_ERROR",
    });
  }
}

function getClientIp(req: NextApiRequest): string {
  // Comprehensive IP extraction
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

  // Fallback to socket (least reliable)
  return req.socket?.remoteAddress || 'unknown';
}

export default withSecurity(subscribeHandler, {
  requireRecaptcha: true,
  expectedAction: "newsletter_signup",
  requireHoneypot: true,
  honeypotFieldNames: ["website", "confirm_email", "botField"],
  minRecaptchaScore: 0.3,
});