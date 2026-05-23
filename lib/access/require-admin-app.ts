/**
 * App Router admin guard.
 *
 * Use this in app/ API routes and server components to enforce admin access.
 * Returns the resolved access or a 401/403 NextResponse.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { canAccessAdmin } from "./checks";
import { getUserAccess } from "./get-user-access";
import type { EffectiveAccess } from "./types";

type AdminResolution =
  | { authorized: true; userId: string; email: string | null; access: EffectiveAccess }
  | { authorized: false; response: NextResponse };

export async function requireAdminAppRoute(): Promise<AdminResolution> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;
  const email = session?.user?.email ?? null;

  // Pass email alongside userId — bootstrap admin must be authorised by email
  // even when userId is absent or DB lookup fails.
  const access = await getUserAccess(prisma, userId, email);

  // Authentication gate: isAuthenticated covers both DB-resolved users and
  // bootstrap admin emails (which getUserAccess marks authenticated by email).
  // Do NOT gate on userId alone — a bootstrap admin may have no DB row yet.
  if (!access.permissions.isAuthenticated) {
    return {
      authorized: false,
      response: NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 },
      ),
    };
  }

  if (!canAccessAdmin(access)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { ok: false, error: "Administrative access required" },
        { status: 403 },
      ),
    };
  }

  return {
    authorized: true,
    userId,
    email: session?.user?.email ?? access.email,
    access,
  };
}
