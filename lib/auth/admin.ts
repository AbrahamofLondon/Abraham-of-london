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
      member: {
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
  if (!session.member) return null;

  return {
    userId: session.memberId,
    token: session.token,
    role: session.member.role,
    isAdmin: session.member.status === "active" && session.member.role === "ADMIN",
    email: session.member.email,
    name: session.member.name,
  };
}

export default getAdminSession;