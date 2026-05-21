import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import {
  hashAdminMagicLinkToken,
  normalizeAdminMagicLinkEmail,
} from "@/lib/auth/admin-magic-link-token";
import { normalizeAdminReturnTo } from "@/lib/auth/admin-return-to";
import { encode } from "next-auth/jwt";
import { serialize } from "cookie";
import { consumePersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "unknown";
  return `${local.slice(0, 2)}***@${domain}`;
}

const ADMIN_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function usesSecureNextAuthCookies(): boolean {
  return process.env.NEXTAUTH_URL?.startsWith("https://") ?? Boolean(process.env.VERCEL);
}

function nextAuthSessionCookie() {
  const secure = usesSecureNextAuthCookies();
  return {
    name: secure ? "__Secure-next-auth.session-token" : "next-auth.session-token",
    secure,
  };
}

function logVerifyDev(event: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  console.info("[admin-auth-verify]", event, details);
}

function logInvalidTokenDev(details: {
  tokenHashComputed: boolean;
  tokenRecordFound: boolean;
  emailMatched: boolean;
  expired: boolean;
  consumedBeforeValidation: boolean;
}) {
  logVerifyDev("invalid_or_expired", {
    tokenHashComputed: details.tokenHashComputed,
    lookupBackendAttempted: "postgres",
    tokenRecordFound: details.tokenRecordFound,
    emailMatched: details.emailMatched,
    expired: details.expired,
    consumedBeforeValidation: details.consumedBeforeValidation,
    sessionWriteAttempted: false,
    redirectTarget: "/admin/login?error=invalid_or_expired",
  });
}

/**
 * GET /api/admin/auth/verify?token=...&email=...&returnTo=...
 *
 * Verifies the magic-link token and establishes an admin session.
 * Redirects to the returnTo path on success, or to /admin/login on failure.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limit: medium — 20 requests per 60s per IP
  const clientIp = String(
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
  const rl = await consumePersistentRateLimit({
    key: `admin-verify:${clientIp}`,
    limit: 20,
    windowMs: 60_000,
    failClosed: true,
  });
  if (!rl.allowed) {
    const retryAfter = Math.max(1, Math.ceil(rl.retryAfterMs / 1000));
    const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";
    if (process.env.NODE_ENV === "development") {
      console.warn("[admin-auth-verify] RATE_LIMIT_EXCEEDED", {
        routeKey: "admin-verify",
        source: rl.source,
        email: maskEmail(email),
      });
    }
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({
      ok: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: "Too many verification attempts. Please wait and request a fresh sign-in link.",
      retryAfter,
    });
  }

  const { token, email, returnTo } = req.query;
  const normalizedEmail = normalizeAdminMagicLinkEmail(email);
  const tokenStr = typeof token === "string" ? token : "";
  const safeReturnTo = normalizeAdminReturnTo(returnTo);

  if (!normalizedEmail || !tokenStr) {
    logVerifyDev("invalid_link", {
      tokenLookupFound: false,
      emailMatched: false,
      expired: false,
      cookieWriteAttempted: false,
      redirectTarget: "/admin/login?error=invalid_link",
    });
    return res.redirect(302, "/admin/login?error=invalid_link");
  }

  // Verify token exists and hasn't expired. Only the digest is stored.
  let tokenDigest: string | null = null;
  let stored;
  try {
    tokenDigest = hashAdminMagicLinkToken(tokenStr);
    stored = await prisma.verificationToken.findUnique({
      where: { token: tokenDigest },
    });
  } catch {
    logVerifyDev("lookup_failed", {
      tokenLookupFound: false,
      emailMatched: false,
      expired: false,
      cookieWriteAttempted: false,
      redirectTarget: "/admin/login?error=verification_failed",
    });
    return res.redirect(302, "/admin/login?error=verification_failed");
  }

  if (!stored) {
    logInvalidTokenDev({
      tokenHashComputed: Boolean(tokenDigest),
      tokenRecordFound: false,
      emailMatched: false,
      expired: false,
      consumedBeforeValidation: false,
    });
    return res.redirect(302, "/admin/login?error=invalid_or_expired");
  }

  const emailMatched = normalizeAdminMagicLinkEmail(stored.identifier) === normalizedEmail;
  const expired = new Date() > stored.expires;

  if (!emailMatched || expired) {
    // Preserve mismatched records; remove only records that are actually expired.
    if (expired) {
      await prisma.verificationToken.delete({
        where: { token: stored.token },
      }).catch(() => {});
    }
    logInvalidTokenDev({
      tokenHashComputed: Boolean(tokenDigest),
      tokenRecordFound: true,
      emailMatched,
      expired,
      consumedBeforeValidation: false,
    });
    return res.redirect(302, "/admin/login?error=invalid_or_expired");
  }

  // Token is valid — consume it
  await prisma.verificationToken.delete({
    where: { token: stored.token },
  }).catch(() => {});

  // Ensure user exists with admin role
  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, name: null, role: normalizedEmail === "info@abrahamoflondon.org" ? "OWNER" : "ADMIN" },
    update: { role: normalizedEmail === "info@abrahamoflondon.org" ? "OWNER" : "ADMIN" },
  });

  // Create a session token (JWT) that NextAuth can recognise
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("[admin-auth-verify] NEXTAUTH_SECRET not set");
    logVerifyDev("missing_secret", {
      tokenLookupFound: true,
      emailMatched,
      expired: false,
      cookieWriteAttempted: false,
      redirectTarget: "/admin/login?error=config_error",
    });
    return res.redirect(302, "/admin/login?error=config_error");
  }

  // Issue the same encrypted JWT format read by NextAuth getServerSession/getToken.
  const sessionToken = await encode({
    secret,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    token: {
      sub: user.id,
      email: normalizedEmail,
      role: user.role,
      name: user.name,
    },
  });

  // Cookie name and secure flag mirror NextAuth's NEXTAUTH_URL-based defaults.
  const cookie = nextAuthSessionCookie();
  if (process.env.NODE_ENV === "development" && cookie.secure) {
    console.warn("[admin-auth-verify] Local verification is using secure NextAuth cookies; confirm NEXTAUTH_URL is http://localhost:3000.");
  }

  res.setHeader("Set-Cookie", serialize(cookie.name, sessionToken, {
    httpOnly: true,
    secure: cookie.secure,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  }));

  logVerifyDev("session_cookie_written", {
    tokenLookupFound: true,
    emailMatched,
    expired: false,
    cookieWriteAttempted: true,
    cookieName: cookie.name,
    cookieSecure: cookie.secure,
    redirectTarget: safeReturnTo,
  });

  return res.redirect(302, safeReturnTo);
}
