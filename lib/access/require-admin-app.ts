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
import { getUserAccess } from "./get-user-access";
import type { EffectiveAccess } from "./types";

type AdminResolution =
  | { authorized: true; userId: string; email: string | null; access: EffectiveAccess }
  | { authorized: false; response: NextResponse };

export async function requireAdminAppRoute(): Promise<AdminResolution> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;
  const access = await getUserAccess(prisma, userId);

  if (!access.permissions.isAuthenticated || !userId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 },
      ),
    };
  }

  if (!access.permissions.isAdmin) {
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
