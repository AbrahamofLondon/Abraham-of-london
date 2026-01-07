/* pages/api/inner-circle/register.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyRecaptchaDetailed } from "@/lib/recaptchaServer";
import { sendInnerCircleEmail } from "@/lib/inner-circle/email";
import { getClientIp } from "@/lib/rate-limit";
import { generateAccessKey, getEmailHash } from "@/lib/inner-circle/keys";
import { createOrUpdateMemberAndIssueKeyWithRateLimit } from "@/lib/inner-circle";

type ResponseData =
  | { 
      ok: true; 
      message: string; 
      keySuffix?: string;
      rateLimit?: {
        allowed: boolean;
        remaining: number;
        limit: number;
        resetAt: number;
      };
    }
  | { 
      ok: false; 
      error: string;
      retryAfter?: number;
    };

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ 
      ok: false, 
      error: "System requires POST for registration." 
    });
  }

  try {
    const ip = getClientIp(req);
    const { email, name, recaptchaToken, returnTo } = req.body || {};
    
    if (!email) {
      return res.status(400).json({ 
        ok: false, 
        error: "Identity required." 
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // reCAPTCHA verification
    const verification = await verifyRecaptchaDetailed(
      recaptchaToken || "", 
      "inner_circle_register", 
      ip
    );
    
    if (!verification.success) {
      return res.status(403).json({ 
        ok: false, 
        error: "Security verification failed." 
      });
    }

    // Create member with rate limiting (this will handle rate limiting internally)
    const { 
      result, 
      rateLimit, 
      headers 
    } = await createOrUpdateMemberAndIssueKeyWithRateLimit(
      {
        email: normalizedEmail,
        name: name?.trim() || "",
        note: "",
      },
      req
    );

    // Add rate limit headers
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    // Send welcome email
    const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const safeTo = (typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")) 
      ? returnTo 
      : "/canon";

    await sendInnerCircleEmail({
      to: normalizedEmail,
      type: "welcome",
      data: {
        name: name?.trim() || "Builder",
        accessKey: result.key.formattedKey,
        unlockUrl: `${site}/inner-circle/unlock?key=${encodeURIComponent(result.key.fullKey)}&returnTo=${encodeURIComponent(safeTo)}`,
      },
    });

    return res.status(200).json({ 
      ok: true, 
      message: "Access granted. Check your inbox.", 
      keySuffix: result.key.suffix,
      rateLimit: rateLimit ? {
        allowed: rateLimit.allowed,
        remaining: rateLimit.remaining,
        limit: rateLimit.limit,
        resetAt: rateLimit.resetAt,
      } : undefined,
    });

  } catch (error: any) {
    console.error("[InnerCircle] Register Error:", error);
    
    // Check if it's a rate limit error
    if (error.message.includes('Rate limit')) {
      // Get current rate limit info
      const { checkInnerCircleRateLimits } = await import('@/lib/inner-circle');
      const { ipResult, headers } = await checkInnerCircleRateLimits(req, req.body?.email);
      
      // Add rate limit headers
      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      
      return res.status(429).json({ 
        ok: false, 
        error: error.message,
        retryAfter: ipResult.blockUntil 
          ? Math.ceil((ipResult.blockUntil - Date.now()) / 1000)
          : undefined,
      });
    }
    
    return res.status(500).json({ 
      ok: false, 
      error: "Internal server error during registration." 
    });
  }
}