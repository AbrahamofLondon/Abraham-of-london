import type { NextApiRequest, NextApiResponse } from "next";
import innerCircleStore, { type VerifyInnerCircleKeyResult } from "@/lib/server/inner-circle-store";
import { getCanonDocBySlug, getAccessLevel } from "@/lib/canon";

/**
 * Strict slug safety:
 * - no protocol
 * - no query fragments
 * - only URL-safe chars, slashes, dashes
 */
function safeSlug(v: unknown): string {
  if (typeof v !== "string") return "";
  const s = v.trim().replace(/^\/+/, "").replace(/\/+$/, "");

  // reject anything that looks like a full URL or contains query/hash
  if (/^https?:\/\//i.test(s)) return "";
  if (s.includes("?") || s.includes("#")) return "";

  // allow nested canon paths if you ever use them, but keep it tight
  if (!/^[a-z0-9/_-]+$/i.test(s)) return "";

  return s.toLowerCase();
}

function safeKey(v: unknown): string {
  if (typeof v !== "string") return "";
  // keep keys compact and avoid log junk / header injection
  const k = v.trim();
  if (!k) return "";
  if (k.length > 256) return "";
  return k;
}

function getClientIp(req: NextApiRequest): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(',')[0].trim();
  }
  return req.socket?.remoteAddress;
}

function getReturnTo(req: NextApiRequest, slug: string): string {
  // fixed internal redirect only
  return `/canon/${slug}`;
}

interface PreviewData {
  innerCircle: boolean;
  unlockedAt: number;
  slug: string;
  keySuffix?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ Only allow POST for key submission (prevents key leakage via URL logs)
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const slug = safeSlug(req.body?.slug ?? req.query?.slug);
    const key = safeKey(req.body?.key ?? req.query?.key);

    if (!slug) return res.status(400).send("Missing or invalid slug");

    const returnTo = getReturnTo(req, slug);

    // If no key, just bounce back (don't reveal anything)
    if (!key) return res.redirect(302, returnTo);

    // ✅ Check the canon doc exists & is actually gated
    const doc = getCanonDocBySlug(slug);
    if (!doc) return res.redirect(302, returnTo);

    const accessLevel = getAccessLevel(doc); // "public" | "inner-circle" | "private"

    // If the page is public, don't enable preview (it's pointless and messy)
    if (accessLevel === "public") {
      return res.redirect(302, returnTo);
    }

    // ✅ Verify the key
    const result: VerifyInnerCircleKeyResult = await innerCircleStore.verifyInnerCircleKey(key);
    if (!result?.valid) {
      // No hints. Just bounce.
      return res.redirect(302, returnTo);
    }

    // ✅ Enable Preview Mode (signed cookies)
    const previewData: PreviewData = {
      innerCircle: true,
      unlockedAt: Date.now(),
      slug,
      keySuffix: result.keySuffix
    };

    res.setPreviewData(
      previewData,
      { maxAge: 60 * 60 * 8 } // 8 hours
    );

    // ✅ Record the unlock event (audit trail)
    try {
      const clientIp = getClientIp(req);
      const userAgent = typeof req.headers["user-agent"] === "string" 
        ? req.headers["user-agent"] 
        : undefined;

      await innerCircleStore.recordInnerCircleUnlock(key, clientIp);
      
      console.log(`[InnerCircle] Preview unlocked for slug: ${slug}, key suffix: ${result.keySuffix}`);
    } catch (error) {
      // Don't block unlock on analytics/audit failure.
      console.warn("[InnerCircle] Failed to record unlock event:", error);
    }

    return res.redirect(302, returnTo);
  } catch (err) {
    // Don't leak internals
    console.error("[InnerCircle] Preview error:", err);
    return res.status(500).send("Server error");
  }
}

// API configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};