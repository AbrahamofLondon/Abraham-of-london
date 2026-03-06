// lib/server/auth/admin-utils.ts
import "server-only";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticator } from "@otplib/preset-default";

import { prisma } from "@/lib/prisma";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";
import { normalizeUserTier, hasAccess as tierHasAccess } from "@/lib/access/tier-policy";
import type { AccessTier } from "@/lib/access/tier-policy";

export type AdminRole = "admin" | "superadmin" | "editor";

export type AdminAuthResult = {
  success: boolean;
  user?: {
    id: string;
    username: string; // email
    role: AdminRole;
    permissions: string[];
    mfaEnabled: boolean;
    tier?: AccessTier;
  };
  error?: string;
  requiresMFA?: boolean;

  // If requiresMFA=true, caller should prompt for TOTP and call verifyAdminTotp()
  mfa?: {
    method: "totp";
    setupId: string;
  };
};

type AdminJwtPayload = {
  sub: string; // InnerCircleMember.id
  username: string; // email
  role: AdminRole;
  permissions: string[];
  typ: "admin";
  iat?: number;
  exp?: number;
};

const ADMIN_MIN_TIER: AccessTier = "architect";

function getAdminJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Missing ADMIN_JWT_SECRET (or NEXTAUTH_SECRET fallback).");
  return secret;
}

async function audit(event: string, meta: Record<string, unknown>) {
  try {
    await logAuditEvent({
      actorType: "system",
      action: event,
      resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
      resourceId: "admin-auth",
      status: "success",
      severity: "medium",
      details: meta,
    });
  } catch {
    // fail-open
  }
}

/**
 * ✅ Phase 1: Verify credentials + tier gate.
 * ✅ If MFA is enabled+verified, return requiresMFA=true (do NOT issue admin token yet).
 */
export async function verifyAdminCredentials(username: string, password: string): Promise<AdminAuthResult> {
  try {
    const normalized = String(username || "").trim().toLowerCase();
    if (!normalized || !password) return { success: false, error: "Invalid credentials" };

    const passwordHash = process.env.ADMIN_PASSWORD_HASH || "";
    if (!passwordHash) {
      await audit(AUDIT_ACTIONS.LOGIN_FAILED, { username: normalized, reason: "ADMIN_PASSWORD_HASH_missing" });
      return { success: false, error: "Admin authentication not configured" };
    }

    // Optional allowlist hardening
    const allowRaw = String(process.env.ADMIN_ALLOWED_EMAILS || "").trim();
    if (allowRaw) {
      const allow = new Set(
        allowRaw
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      );
      if (!allow.has(normalized)) {
        await audit(AUDIT_ACTIONS.ACCESS_DENIED, { username: normalized, reason: "email_not_allowlisted" });
        return { success: false, error: "Invalid credentials" };
      }
    }

    const member = await prisma.innerCircleMember.findUnique({
      where: { email: normalized },
      select: {
        id: true,
        email: true,
        role: true,
        tier: true,
        status: true,
        permissions: true,
      },
    });

    if (!member || String(member.status || "").toLowerCase() !== "active") {
      await audit(AUDIT_ACTIONS.LOGIN_FAILED, { username: normalized, reason: "not_found_or_inactive" });
      return { success: false, error: "Invalid credentials" };
    }

    const tier = normalizeUserTier((member.tier as any) ?? "public");
    if (!tierHasAccess(tier, ADMIN_MIN_TIER)) {
      await audit(AUDIT_ACTIONS.ACCESS_DENIED, { username: normalized, reason: "tier_insufficient", tier });
      return { success: false, error: "Invalid credentials" };
    }

    const ok = await bcrypt.compare(password, passwordHash);
    if (!ok) {
      await audit(AUDIT_ACTIONS.LOGIN_FAILED, { username: normalized, reason: "bad_password" });
      return { success: false, error: "Invalid credentials" };
    }

    // ✅ DB-backed MFA gate (schema exists)
    const setup = await prisma.mfaSetup.findUnique({
      where: { userId: member.id },
      select: { id: true, enabled: true, totpVerified: true, methods: true },
    });

    const mfaEnabled = !!(setup?.enabled && setup?.totpVerified && Array.isArray(setup?.methods) && setup.methods.includes("totp"));

    const role: AdminRole = String(member.role || "").toUpperCase() === "ADMIN" ? "superadmin" : "admin";

    if (mfaEnabled) {
      await audit("admin_login_mfa_required", { adminId: member.id, username: member.email, tier, role });

      return {
        success: false,
        requiresMFA: true,
        user: {
          id: member.id,
          username: member.email || normalized,
          role,
          permissions: (member.permissions as any) ?? [],
          mfaEnabled: true,
          tier,
        },
        mfa: {
          method: "totp",
          setupId: setup!.id,
        },
      };
    }

    await audit(AUDIT_ACTIONS.LOGIN_SUCCESS, { adminId: member.id, username: member.email, tier, role });

    return {
      success: true,
      user: {
        id: member.id,
        username: member.email || normalized,
        role,
        permissions: (member.permissions as any) ?? [],
        mfaEnabled: false,
        tier,
      },
    };
  } catch (err) {
    await audit(AUDIT_ACTIONS.API_ERROR, { error: String(err), username });
    return { success: false, error: "Authentication failed" };
  }
}

/**
 * ✅ Phase 2: Verify TOTP code (only after verifyAdminCredentials returns requiresMFA=true)
 */
export async function verifyAdminTotp(input: { userId: string; code: string }): Promise<{ ok: boolean; error?: string }> {
  const userId = String(input.userId || "").trim();
  const code = String(input.code || "").trim();

  if (!userId || !code) return { ok: false, error: "Missing userId or code" };
  if (code.length > 12) return { ok: false, error: "Invalid code format" };

  const setup = await prisma.mfaSetup.findUnique({
    where: { userId },
    select: { enabled: true, totpVerified: true, totpSecret: true, methods: true },
  });

  if (!setup?.enabled || !setup?.totpVerified || !setup?.totpSecret) {
    return { ok: false, error: "MFA not configured" };
  }

  if (!Array.isArray(setup.methods) || !setup.methods.includes("totp")) {
    return { ok: false, error: "TOTP not enabled" };
  }

  // TOTP verify (default otplib window is okay; if you want drift tolerance, set authenticator.options.window)
  const ok = authenticator.verify({ token: code, secret: setup.totpSecret });

  await audit(ok ? "admin_mfa_totp_verified" : "admin_mfa_totp_failed", { userId });

  return ok ? { ok: true } : { ok: false, error: "Invalid code" };
}

/**
 * Issue an admin session token (JWT).
 * Only call this after MFA (if required) passes.
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

  return jwt.sign(payload, secret, { expiresIn: "8h" });
}

export async function verifyAdminSession(sessionToken: string): Promise<{
  id: string;
  username: string;
  role: AdminRole;
  permissions: string[];
  tier?: AccessTier;
} | null> {
  try {
    if (!sessionToken) return null;

    const secret = getAdminJwtSecret();
    const decoded = jwt.verify(sessionToken, secret) as AdminJwtPayload;

    if (!decoded || decoded.typ !== "admin" || !decoded.sub) return null;

    const member = await prisma.innerCircleMember.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, status: true, tier: true },
    });

    if (!member || String(member.status || "").toLowerCase() !== "active") return null;

    const tier = normalizeUserTier((member.tier as any) ?? "public");
    if (!tierHasAccess(tier, ADMIN_MIN_TIER)) return null;

    return {
      id: member.id,
      username: member.email || decoded.username,
      role: decoded.role,
      permissions: decoded.permissions ?? [],
      tier,
    };
  } catch {
    return null;
  }
}