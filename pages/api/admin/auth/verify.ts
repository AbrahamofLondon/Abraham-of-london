import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

/**
 * GET /api/admin/auth/verify?token=...&email=...&returnTo=...
 *
 * Verifies the magic-link token and establishes an admin session.
 * Redirects to the returnTo path on success, or to /admin/login on failure.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token, email, returnTo } = req.query;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const tokenStr = typeof token === "string" ? token : "";
  const safeReturnTo = typeof returnTo === "string" && returnTo.startsWith("/") ? returnTo : "/admin";

  if (!normalizedEmail || !tokenStr) {
    return res.redirect(302, "/admin/login?error=invalid_link");
  }

  // Verify token exists and hasn't expired
  let stored;
  try {
    stored = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: normalizedEmail, token: tokenStr } },
    });
  } catch {
    return res.redirect(302, "/admin/login?error=verification_failed");
  }

  if (!stored) {
    return res.redirect(302, "/admin/login?error=invalid_or_expired");
  }

  if (new Date() > stored.expires) {
    // Clean up expired token
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: normalizedEmail, token: tokenStr } },
    }).catch(() => {});
    return res.redirect(302, "/admin/login?error=link_expired");
  }

  // Token is valid — consume it
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: normalizedEmail, token: tokenStr } },
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
    return res.redirect(302, "/admin/login?error=config_error");
  }

  const sessionToken = jwt.sign(
    {
      sub: user.id,
      email: normalizedEmail,
      role: user.role,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    },
    secret,
  );

  // Set the NextAuth session cookie
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  res.setHeader("Set-Cookie", serialize(cookieName, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }));

  return res.redirect(302, safeReturnTo);
}
