// pages/api/inner-circle/resend.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { rateLimit } from "@/lib/rate-limit"; // Adjust the import path as needed

type ApiResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};

// Create rate limit instances with your function
const ipRateLimiter = rateLimit(3, 15 * 60 * 1000); // 3 requests per 15 minutes
const emailRateLimiter = rateLimit(5, 60 * 60 * 1000); // 5 requests per hour

function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { email, name, returnTo } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
      return res.status(400).json({ ok: false, error: "Invalid email address" });
    }

    const sanitizedEmail = sanitizeEmail(email);

    // Get IP address for rate limiting
    const ip = (Array.isArray(req.headers['x-forwarded-for']) 
      ? req.headers['x-forwarded-for'][0] 
      : req.headers['x-forwarded-for']) || req.socket.remoteAddress || 'unknown';

    // Check IP rate limit
    if (ipRateLimiter(ip)) {
      return res.status(429).json({
        ok: false,
        error: "Too many attempts from your IP address. Please try again in 15 minutes.",
      });
    }

    // Check email rate limit
    if (emailRateLimiter(sanitizedEmail)) {
      return res.status(429).json({
        ok: false,
        error: "Too many attempts for this email address. Please try again in an hour.",
      });
    }

    // TODO: Add your actual resend logic here
    console.log(`Inner Circle resend request:`, {
      email: sanitizedEmail,
      name: name || 'not provided',
      ip,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      ok: true,
      message: "A fresh Inner Circle access email has been sent. Please check your inbox.",
    });

  } catch (error) {
    console.error("Resend API error:", error);
    return res.status(500).json({
      ok: false,
      error: "Something went wrong. Please try again.",
    });
  }
}