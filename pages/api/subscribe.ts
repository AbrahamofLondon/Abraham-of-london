// pages/api/subscribe.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { subscribe, type SubscriptionResult } from "@/lib/server/subscription";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const {
      email,
      preferences,
      metadata,
      tags,
      referrer,
    } = req.body as {
      email?: string;
      preferences?: any;
      metadata?: Record<string, unknown>;
      tags?: string[];
      referrer?: string;
    };

    // Validate required fields
    if (!email) {
      return res.status(400).json({ 
        ok: false, 
        message: "Email is required",
        error: "MISSING_EMAIL" 
      });
    }

    // Get client IP for rate limiting (optional but recommended)
    const clientIp = getClientIp(req);

    // Use the robust subscription service
    const result: SubscriptionResult = await subscribe(email, {
      preferences,
      metadata: {
        ...metadata,
        source: "api",
        ip: clientIp,
        userAgent: req.headers["user-agent"],
        timestamp: new Date().toISOString(),
      },
      tags: tags || ["api-subscriber"],
      referrer: referrer || req.headers.referer || "direct",
    });

    // Return appropriate status code based on result
    const statusCode = result.ok ? 200 : result.status || 400;

    return res.status(statusCode).json(result);

  } catch (error: any) {
    console.error("Subscription API error:", error);

    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: "SERVER_ERROR",
    });
  }
}

// Helper function to extract client IP
function getClientIp(req: NextApiRequest): string | undefined {
  // Try common headers for client IP (behind proxies)
  const forwardedFor = req.headers["x-forwarded-for"];
  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0];
  } else if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") {
    return realIp;
  }

  // Fallback to connection remote address
  return req.socket?.remoteAddress;
}