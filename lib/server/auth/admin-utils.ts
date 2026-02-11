// lib/server/auth/admin-utils.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export type AdminRole = "admin" | "superadmin" | "editor";

export type AdminAuthResult = {
  success: boolean;
  user?: {
    id: string;
    username: string;
    role: AdminRole;
    permissions: string[];
    mfaEnabled: boolean;
  };
  error?: string;
  requiresMFA?: boolean;
};

type AdminJwtPayload = {
  sub: string; // admin user id
  username: string;
  role: AdminRole;
  permissions: string[];
  typ: "admin";
  iat?: number;
  exp?: number;
};

function getAdminJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_JWT_SECRET (or NEXTAUTH_SECRET fallback).");
  }
  return secret;
}

async function audit(event: string, meta: Record<string, unknown>) {
  // If you don’t have an AuditLog model, either create it or replace this with console logging.
  try {
    await prisma.auditLog.create({
      data: {
        event,
        meta: JSON.stringify(meta),
      },
    });
  } catch {
    // fail-closed on auth, but fail-open on logging
  }
}

/**
 * Verifies admin credentials against your DB.
 *
 * Expected Prisma model (example):
 * model AdminUser {
 *   id           String  @id @default(cuid())
 *   username     String  @unique
 *   passwordHash String
 *   role         String
 *   permissions  String[] // postgres
 *   mfaEnabled   Boolean @default(false)
 *   disabled     Boolean @default(false)
 * }
 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<AdminAuthResult> {
  try {
    const normalized = username.trim().toLowerCase();
    if (!normalized || !password) return { success: false, error: "Invalid credentials" };

    const user = await prisma.adminUser.findUnique({
      where: { username: normalized },
      select: {
        id: true,
        username: true,
        role: true,
        permissions: true,
        mfaEnabled: true,
        disabled: true,
        passwordHash: true,
      },
    });

    if (!user || user.disabled) {
      await audit("admin_login_failed", { username: normalized, reason: "not_found_or_disabled" });
      return { success: false, error: "Invalid credentials" };
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await audit("admin_login_failed", { username: normalized, reason: "bad_password" });
      return { success: false, error: "Invalid credentials" };
    }

    // If MFA is enabled, your login route should now challenge for OTP.
    if (user.mfaEnabled) {
      await audit("admin_login_mfa_required", { adminId: user.id, username: user.username });
      return {
        success: false,
        requiresMFA: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role as AdminRole,
          permissions: user.permissions ?? [],
          mfaEnabled: true,
        },
      };
    }

    await audit("admin_login_success", { adminId: user.id, username: user.username });

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role as AdminRole,
        permissions: user.permissions ?? [],
        mfaEnabled: user.mfaEnabled,
      },
    };
  } catch (err) {
    await audit("admin_login_error", { error: String(err), username });
    return { success: false, error: "Authentication failed" };
  }
}

/**
 * Issue an admin session token (JWT).
 * Store this in an httpOnly cookie from your API route.
 */
export function issueAdminSessionToken(input: {
  id: string;
  username: string;
  role: AdminRole;
  permissions: string[];
}): string {
  const secret = getAdminJwtSecret();

  const payload: AdminJwtPayload = {
    sub: input.id,
    username: input.username,
    role: input.role,
    permissions: input.permissions ?? [],
    typ: "admin",
  };

  // 8h is a sane default for an admin console
  return jwt.sign(payload, secret, { expiresIn: "8h" });
}

/**
 * Verifies an admin session token (JWT).
 * Returns the embedded identity/permissions if valid, else null.
 */
export async function verifyAdminSession(
  sessionToken: string
): Promise<{
  id: string;
  username: string;
  role: AdminRole;
  permissions: string[];
} | null> {
  try {
    if (!sessionToken) return null;

    const secret = getAdminJwtSecret();
    const decoded = jwt.verify(sessionToken, secret) as AdminJwtPayload;

    if (!decoded || decoded.typ !== "admin" || !decoded.sub) return null;

    // Optional hardening: confirm user still exists / not disabled (recommended)
    const user = await prisma.adminUser.findUnique({
      where: { id: decoded.sub },
      select: { id: true, username: true, role: true, permissions: true, disabled: true },
    });

    if (!user || user.disabled) return null;

    return {
      id: user.id,
      username: user.username,
      role: user.role as AdminRole,
      permissions: user.permissions ?? [],
    };
  } catch {
    return null;
  }
}