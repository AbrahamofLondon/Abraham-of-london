// pages/api/auth/session.ts
//
// ✅ Production-safe session endpoint that remains compatible with NextAuth's expected
// session shape ({ user, expires, ... }).
//
// Why this matters:
// - NextAuth already provides /api/auth/session via /api/auth/[...nextauth].ts
// - If you keep this file, it overrides the default route and MUST return
//   a NextAuth-compatible session payload, otherwise next-auth/client will choke
//   (JSON.parse errors, hydration errors, etc.)
//
// This version:
// - Uses getServerSession
// - Enriches session.user with role + permissions + membership metadata
// - Never returns HTML
// - Avoids mutating the "DB" object in-place (serverless-safe pattern)

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import type { User, UserRole } from "@/types/auth";

/**
 * -----------------------------------------------------------------------------
 * Permissions / roles
 * -----------------------------------------------------------------------------
 * Keep this aligned with your app gating logic.
 */

type Permission =
  | "admin:all"
  | "content:read"
  | "content:write"
  | "downloads:read"
  | "downloads:premium"
  | "inner-circle:access"
  | "billing:read";

function getPermissionsForRole(role: UserRole): Permission[] {
  const base: Permission[] = ["content:read"];

  switch (role) {
    case "admin":
      return ["admin:all", "content:read", "content:write", "downloads:read", "downloads:premium", "inner-circle:access", "billing:read"];

    case "inner-circle":
    case "basic":
      return [...base, "downloads:read", "inner-circle:access"];

    case "premium":
    case "enterprise":
      return [...base, "downloads:read", "downloads:premium", "inner-circle:access"];

    case "public":
    case "free":
    default:
      return base;
  }
}

/**
 * -----------------------------------------------------------------------------
 * Mock user "DB" (replace with your actual database query)
 * -----------------------------------------------------------------------------
 */

const USERS_DB: User[] = [
  {
    id: "admin_001",
    email: "admin@abrahamoflondon.org",
    name: "System Admin",
    role: "admin",
    permissions: getPermissionsForRole("admin"),
    membershipDate: "2024-01-01",
    lastAccess: new Date().toISOString(),
  },
  {
    id: "inner_001",
    email: "member@innercircle.org",
    name: "Inner Circle Member",
    role: "inner-circle",
    permissions: getPermissionsForRole("inner-circle"),
    membershipDate: "2024-01-01",
    lastAccess: new Date().toISOString(),
  },
];

/**
 * -----------------------------------------------------------------------------
 * Handler
 * -----------------------------------------------------------------------------
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Always JSON. Never cache.
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const session = await getServerSession(req, res, authOptions);

    // NextAuth expects "null" if unauthenticated
    if (!session?.user?.email) {
      return res.status(200).json(null);
    }

    const email = session.user.email.toLowerCase().trim();

    // In production: query your DB by email
    const userData = USERS_DB.find((u) => u.email.toLowerCase() === email);

    if (!userData) {
      // Authenticated with provider but not provisioned in your app
      // Keep shape compatible: still return a session, but with minimal user info
      return res.status(200).json({
        ...session,
        user: {
          ...session.user,
          role: "public" as UserRole,
          permissions: getPermissionsForRole("public"),
        },
      });
    }

    const enrichedUser: User = {
      ...userData,
      // avoid mutating DB state; compute current access timestamp on the fly
      lastAccess: new Date().toISOString(),
      // ensure permissions always align to role (in case role changed)
      permissions: getPermissionsForRole(userData.role),
    };

    // Return NextAuth-compatible session payload
    return res.status(200).json({
      ...session,
      user: {
        ...session.user,
        // ensure name/email/image remain what NextAuth expects
        name: session.user.name ?? enrichedUser.name ?? null,
        email: session.user.email,
        image: (session.user as any).image ?? null,

        // your custom additions
        id: enrichedUser.id,
        role: enrichedUser.role,
        permissions: enrichedUser.permissions,
        membershipDate: (enrichedUser as any).membershipDate ?? null,
        lastAccess: (enrichedUser as any).lastAccess ?? null,
      },
    });
  } catch (err: any) {
    // Never let this route return HTML error pages (breaks next-auth client JSON.parse)
    return res.status(200).json(null);
  }
}