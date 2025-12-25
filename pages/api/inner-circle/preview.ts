// pages/api/inner-circle/preview.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyInnerCircleKey, recordInnerCircleUnlock } from "@/lib/inner-circle";
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

function getReturnTo(req: NextApiRequest, slug: string): string {
  // fixed internal redirect only
  return `/canon/${slug}`;
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
    const result = await verifyInnerCircleKey(key);
    if (!result?.ok) {
      // No hints. Just bounce.
      return res.redirect(302, returnTo);
    }

    // ✅ Enable Preview Mode (signed cookies)
    // Also store a tiny bit of context - helpful for UI logic if you want it later.
    res.setPreviewData(
      { innerCircle: true, unlockedAt: Date.now(), slug },
      { maxAge: 60 * 60 * 8 } // 8 hours
    );

    // ✅ Optional but recommended: record the unlock event (audit trail)
    // Only call if your store supports it safely.
    try {
      await recordInnerCircleUnlock({
        accessKey: key,
        slug,
        // You can add IP / userAgent if your implementation expects them.
        // Keep it privacy-safe.
        userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined,
        ip:
          typeof req.headers["x-forwarded-for"] === "string"
            ? req.headers["x-forwarded-for"].split(",")[0].trim()
            : undefined,
      } as any);
    } catch {
      // Don't block unlock on analytics/audit failure.
    }

    return res.redirect(302, returnTo);
  } catch (err) {
    // Don't leak internals
    return res.status(500).send("Server error");
  }
}