// pages/api/inner-circle/register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyRecaptchaDetailed } from "@/lib/recaptcha"; // Unified helper we reviewed
// NOTE: Ensure these exist in your lib/inner-circle engine
import { 
  createOrUpdateMemberAndIssueKey, 
  sendInnerCircleEmail 
} from "@/lib/inner-circle"; 

type ResponseData = {
  ok: boolean;
  message?: string;
  accessKey?: string;
  keySuffix?: string;
  error?: string;
};

/**
 * THE REGISTRATION ENGINE - Unified Production Version
 * Hardened for reCAPTCHA v3 and persistent member management.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // 1. Method Restriction
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "System requires POST for registration." });
  }

  // 2. Body Parsing & Validation
  const { email, name, recaptchaToken, returnTo } = req.body || {};

  if (!email || typeof email !== "string") {
    return res.status(400).json({ ok: false, error: "Identity (email) is required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ ok: false, error: "Invalid identity format." });
  }

  // 3. Security Check: reCAPTCHA v3 Validation
  try {
    const verification = await verifyRecaptchaDetailed(
      recaptchaToken,
      "inner_circle_register"
    );

    if (!verification.success) {
      console.warn(`[Security Alert] Bot detected or reCAPTCHA failed for: ${email}`);
      return res.status(403).json({ 
        ok: false, 
        error: "Security verification failed. Please refresh and try again." 
      });
    }
  } catch (secError) {
    console.error("[Security Exception] reCAPTCHA system error:", secError);
    return res.status(500).json({ ok: false, error: "Security subsystem offline." });
  }

  // 4. Persistence & Issue Key
  try {
    const ipAddress = Array.isArray(req.headers["x-forwarded-for"])
      ? req.headers["x-forwarded-for"][0]
      : req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    const keyRecord = await createOrUpdateMemberAndIssueKey({
      email: email.toLowerCase().trim(),
      name: name?.trim(),
      ipAddress,
      context: "web-registration"
    });

    // 5. Professional Email Dispatch
    // This utilizes your actual email templates defined in the library
    await sendInnerCircleEmail({
      to: email,
      type: "welcome",
      data: {
        name: name || "Builder",
        accessKey: keyRecord.key,
        unlockUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/inner-circle?key=${keyRecord.key}&returnTo=${encodeURIComponent(returnTo || "/canon")}`
      }
    });

    // 6. Success Response (Privacy-Safe)
    return res.status(200).json({
      ok: true,
      message: "Access granted. Check your inbox for the security key.",
      keySuffix: keyRecord.keySuffix // Return suffix for UI confirmation
    });

  } catch (error: any) {
    console.error("[Build Error] Inner Circle Registration failed:", error);
    
    // Forgiving error handling for existing members
    if (error.code === "ALREADY_MEMBER") {
      return res.status(200).json({
        ok: true,
        message: "Identity already registered. A fresh key has been dispatched to your inbox."
      });
    }

    return res.status(500).json({ 
      ok: false, 
      error: "Internal server error during vault registration." 
    });
  }
}