/* lib/auth/admin.ts */
import "server-only";

import { prisma } from "@/lib/server/prisma";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";

export type AdminSessionResult = {
  userId: string;
  token: string;
  role: string;
  isAdmin: boolean;
  email?: string | null;
  name?: string | null;
};

/**
 * Reads admin session token from cookie/header and resolves the linked user.
 */
export async function getAdminSession(request: Request | any): Promise<AdminSessionResult | null> {
  const token = getAccessTokenFromReq(request);

  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          status: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  if (!session.user) return null;

  return {
    userId: session.userId,
    token: session.token,
    role: session.user.role,
    isAdmin: session.user.status === "active" && session.user.role === "ADMIN",
    email: session.user.email,
    name: session.user.name,
  };
}

export default getAdminSession;