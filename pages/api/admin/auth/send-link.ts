import type { NextApiRequest, NextApiResponse } from "next";
import { BOOTSTRAP_ADMIN_EMAILS } from "@/lib/access/admin-emails";
import { sendEmail } from "@/lib/email/core/sendEmail";
import { EmailLinks } from "@/lib/email/links";
import { prisma } from "@/lib/prisma.server";
import { consumePersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";
import { applyShield } from "@/lib/server/security/shield-middleware";
import crypto from "crypto";

/**
 * POST /api/admin/auth/send-link
 *
 * Sends a magic sign-in link to an authorised admin email via Resend.
 * Always returns JSON. Never returns HTML or redirects.
 *
 * Response contract:
 * - 200 { ok: true, message: "..." } — always, even for non-admin emails (no enumeration)
 * - 400 { ok: false, error: "...", message: "..." } — only for missing/invalid email format
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  // Anti-reconnaissance shield
  const shield = await applyShield(req, "/api/admin/auth/send-link");
  if (shield.blocked) return res.status(429).json({ ok: false, error: "REQUEST_THROTTLED" });
  if (shield.delayMs > 0) await new Promise((r) => setTimeout(r, shield.delayMs));

  // Rate limit: strict — 5 requests per 60s per IP
  const clientIp = String(
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
  const rl = await consumePersistentRateLimit({
    key: `admin-send-link:${clientIp}`,
    limit: 5,
    windowMs: 60_000,
    failClosed: true,
  });
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(Math.ceil(rl.retryAfterMs / 1000)));
    return res.status(429).json({ ok: false, error: "RATE_LIMIT_EXCEEDED" });
  }

  const { email, returnTo } = req.body ?? {};
  const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalized || !normalized.includes("@")) {
    return res.status(400).json({
      ok: false,
      error: "INVALID_EMAIL",
      message: "Enter a valid administrative email.",
    });
  }

  // Neutral response for non-admin emails (prevents enumeration)
  if (!BOOTSTRAP_ADMIN_EMAILS.has(normalized)) {
    console.warn("[admin-auth] Non-admin email attempted login:", normalized);
    return res.status(200).json({
      ok: true,
      message: "If this email is authorised, a secure sign-in link has been sent.",
    });
  }

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store verification token
  try {
    await prisma.verificationToken.create({
      data: { identifier: normalized, token, expires },
    });
  } catch (err) {
    console.error("[admin-auth] Failed to store verification token:", err);
    return res.status(500).json({
      ok: false,
      error: "TOKEN_STORAGE_FAILED",
      message: "Unable to prepare sign-in. Please try again.",
    });
  }

  // Ensure user exists
  await prisma.user.upsert({
    where: { email: normalized },
    create: { email: normalized, name: null },
    update: {},
  });

  // Build sign-in link
  const safeReturnTo = typeof returnTo === "string" && returnTo.startsWith("/") ? returnTo : "/admin";
  const signInUrl = EmailLinks.adminVerify(token, normalized, safeReturnTo);

  // Send via Resend
  const mailResult = await sendEmail({
    type: "SYSTEM",
    to: normalized,
    subject: "Sign in to Abraham of London",
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <p style="font-size: 14px; color: #666; margin-bottom: 24px;">
          Sign in to the Abraham of London system.
        </p>
        <a href="${signInUrl}" style="display: inline-block; padding: 12px 24px; background: #C9A96E; color: #000; text-decoration: none; font-family: monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;">
          Sign in
        </a>
        <p style="font-size: 12px; color: #999; margin-top: 24px;">
          This link expires in 15 minutes. If you did not request this, ignore this email.
        </p>
      </div>
    `,
    text: [
      "Sign in to Abraham of London.",
      "",
      `Sign in: ${signInUrl}`,
      "This link expires in 15 minutes.",
    ].join("\n"),
    from: process.env.EMAIL_FROM || "Abraham of London <noreply@abrahamoflondon.org>",
    meta: {
      source: "admin-auth:send-link",
    },
  });

  if (!mailResult.ok) {
    console.error("[admin-auth] Email send failed:", mailResult.error);
    return res.status(500).json({
      ok: false,
      error: "EMAIL_SEND_FAILED",
      message: "Failed to send sign-in link. Please try again.",
    });
  }

  return res.status(200).json({
    ok: true,
    message: "If this email is authorised, a secure sign-in link has been sent.",
  });
}
