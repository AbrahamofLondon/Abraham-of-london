import type { NextApiRequest, NextApiResponse } from "next";
import { isBootstrapAdminEmail } from "@/lib/access/admin-emails";
import { classifyAuthError } from "@/lib/auth/auth-error-classifier";
import { normalizeAdminReturnTo } from "@/lib/auth/admin-return-to";
import { sendEmail } from "@/lib/email/core/sendEmail";
import { EmailLinks } from "@/lib/email/links";
import { prisma } from "@/lib/prisma.server";
import { consumePersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";
import { applyShield } from "@/lib/server/security/shield-middleware";
import crypto from "crypto";

function classifyTokenStorageError(
  err: unknown,
): "DATABASE_URL_INVALID" | "DATABASE_AUTHENTICATION_FAILED" | "AUTH_DATABASE_UNAVAILABLE" | "TOKEN_STORAGE_FAILED" {
  const safe = classifyAuthError(err);
  if (safe.code === "AUTH_DATABASE_AUTHENTICATION_FAILED") return "DATABASE_AUTHENTICATION_FAILED";
  if (safe.code === "AUTH_DATABASE_UNAVAILABLE") return "AUTH_DATABASE_UNAVAILABLE";
  if (!(err instanceof Error)) return "TOKEN_STORAGE_FAILED";
  const msg = err.message ?? "";
  if (
    msg.includes("url must start with the protocol") ||
    msg.includes("DATABASE_URL") ||
    msg.includes("datasource") ||
    msg.includes("Invalid `prisma") && msg.includes("datasource")
  ) {
    return "DATABASE_URL_INVALID";
  }
  return "TOKEN_STORAGE_FAILED";
}

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
  if (!isBootstrapAdminEmail(normalized)) {
    console.warn("[admin-auth] Non-admin email attempted login:", normalized);
    return res.status(200).json({
      ok: true,
      message: "If this email is authorised, a secure sign-in link has been sent.",
    });
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    console.warn("[admin-auth] send-link: EMAIL_PROVIDER_NOT_CONFIGURED — RESEND_API_KEY is absent");
    return res.status(503).json({
      ok: false,
      error: "EMAIL_PROVIDER_NOT_CONFIGURED",
      message: "Email sign-in is not configured in this environment. Use Google sign-in or configure RESEND_API_KEY.",
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
    const errorCode = classifyTokenStorageError(err);
    if (errorCode === "DATABASE_URL_INVALID") {
      console.error("[admin-auth] TOKEN_STORAGE: DATABASE_URL_INVALID — DATABASE_URL must be a valid postgresql:// or postgres:// URL");
    } else if (errorCode === "DATABASE_AUTHENTICATION_FAILED") {
      console.error("[admin-auth] TOKEN_STORAGE: DATABASE_AUTHENTICATION_FAILED");
    } else if (errorCode === "AUTH_DATABASE_UNAVAILABLE") {
      console.error("[admin-auth] TOKEN_STORAGE: AUTH_DATABASE_UNAVAILABLE");
    } else {
      console.error("[admin-auth] TOKEN_STORAGE_FAILED");
    }
    return res.status(500).json({
      ok: false,
      error: errorCode,
      message: errorCode === "DATABASE_URL_INVALID"
        ? "Admin sign-in requires a valid PostgreSQL DATABASE_URL in this environment."
        : errorCode === "DATABASE_AUTHENTICATION_FAILED"
          ? "Admin sign-in could not authenticate to the configured database."
          : errorCode === "AUTH_DATABASE_UNAVAILABLE"
            ? "Admin sign-in could not reach the configured database."
            : "Unable to prepare sign-in. Please try again.",
    });
  }

  // Ensure user exists
  await prisma.user.upsert({
    where: { email: normalized },
    create: { email: normalized, name: null },
    update: {},
  });

  // Build sign-in link
  const safeReturnTo = normalizeAdminReturnTo(returnTo);
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
    from: process.env.EMAIL_FROM || "Abraham of London <admin@abrahamoflondon.org>",
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
