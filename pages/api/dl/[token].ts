// pages/api/dl/[token].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { 
  getDownloadBySlug,
  resolveDocDownloadUrl,
} from "@/lib/content/server"; 
import { sanitizeData } from "@/lib/content/shared";
import {
  verifyDownloadToken,
  getUserTierFromCookies,
  tierAtLeast,
  type InnerCircleTier
} from "@/lib/downloads/security";
import { logDownloadEvent } from "@/lib/downloads/audit";
import { safeSlice } from "@/lib/utils/safe";


// Local validateDownloadAccess function
function validateDownloadAccess(params: {
  userTier: InnerCircleTier;
  requiredTier: string;
  slug: string;
  userId?: string;
}): { allowed: boolean; reason?: string } {
  // Cast requiredTier to InnerCircleTier since it comes from token
  const required = params.requiredTier as InnerCircleTier;
  const user = params.userTier;
  
  // Check if tier meets requirement
  if (!tierAtLeast(user, required)) {
    return {
      allowed: false,
      reason: `Insufficient tier: ${user} < ${required}`
    };
  }
  
  return { allowed: true };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Method restriction
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2) Token extraction
  const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
  if (!token) return res.status(400).json({ error: "Missing token" });

  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret) {
    console.error("[CRITICAL] DOWNLOAD_SIGNING_SECRET is undefined");
    return res.status(500).json({ error: "Internal configuration error" });
  }

  // Audit metadata
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || 
             req.socket.remoteAddress || "0.0.0.0";
  const ua = req.headers["user-agent"] || "unknown-ua";
  const ref = req.headers.referer || "direct";

  try {
    // 3) Verify token
    const verificationResult = verifyDownloadToken(token, secret);
    
    // Handle token verification result
    if (!verificationResult.valid) {
      await logDownloadEvent({
        eventType: "TOKEN_REJECTED",
        slug: verificationResult.slug || "unknown",
        requiredTier: verificationResult.requiredTier || "public",
        userTier: getUserTierFromCookies(req.headers.cookie),
        ip,
        userAgent: ua,
        referrer: ref,
        note: verificationResult.reason || "Token verification failed",
      });
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Type-safe payload
    const { slug, requiredTier, exp, nonce } = verificationResult;

    // 4) Resolve document - USING getDocBySlug INSTEAD OF getDownloadBySlug
    const doc = getDocBySlug(slug);
    if (!doc) {
      await logDownloadEvent({
        eventType: "DOWNLOAD_NOT_FOUND",
        slug,
        requiredTier,
        userTier: getUserTierFromCookies(req.headers.cookie),
        ip,
        userAgent: ua,
        referrer: ref,
        note: "Document not found",
      });
      return res.status(404).json({ error: "Document not found" });
    }

    // 5) Resolve download URL
    const url = resolveDocDownloadUrl(doc);
    if (!url) {
      await logDownloadEvent({
        eventType: "URL_RESOLVE_FAILED",
        slug,
        requiredTier,
        userTier: getUserTierFromCookies(req.headers.cookie),
        ip,
        userAgent: ua,
        referrer: ref,
        note: "Could not resolve download URL",
      });
      return res.status(500).json({ error: "Internal error resolving URL" });
    }

    // 6) Tier check at redemption-time
    const userTier = getUserTierFromCookies(req.headers.cookie);
    
    // Additional validation using local function
    const accessCheck = validateDownloadAccess({
      userTier,
      requiredTier,
      slug,
      // userId not available in current payload, but we could extract it if needed
    });

    if (!accessCheck.allowed) {
      await logDownloadEvent({
        eventType: "DOWNLOAD_DENIED",
        slug,
        requiredTier,
        userTier,
        ip,
        userAgent: ua,
        referrer: ref,
        note: accessCheck.reason || "Access denied",
      });

      // Redirect to appropriate error page
      if (accessCheck.reason?.includes('tier')) {
        return res.redirect(302, "/inner-circle?error=insufficient_tier");
      }
      return res.redirect(302, "/inner-circle?error=access_denied");
    }

    // 7) Success - log and redirect
    await logDownloadEvent({
      eventType: "DOWNLOAD_GRANTED",
      slug,
      requiredTier,
      userTier,
      ip,
      userAgent: ua,
      referrer: ref,
      tokenExp: exp,
      downloadUrl: url,
      nonce, // Log nonce for audit trail
    });

    // Set security headers
    res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    
    // Add download tracking header
    res.setHeader("X-Download-ID", slug);
    
    return res.redirect(302, url);
  } catch (err) {
    console.error(`[DOWNLOAD_SYSTEM_EXCEPTION] ${token}:`, err);
    
    // Log the error
    await logDownloadEvent({
      eventType: "DOWNLOAD_ERROR",
      slug: "unknown",
      requiredTier: "unknown",
      userTier: getUserTierFromCookies(req.headers.cookie),
      ip,
      userAgent: ua,
      referrer: ref,
      note: `System error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
    
    return res.status(500).json({ 
      error: "Internal server error",
      reference: safeSlice(token, 0, 8) // Partial token for debugging
    });
  }
}

// Optional: Add API configuration
export const config = {
  api: {
    responseLimit: false, // Allow large file downloads
    bodyParser: false,    // No body parsing for GET requests
  },
};