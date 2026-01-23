/* lib/auth/admin.ts */
import { prisma } from "@/lib/server/prisma";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";

export type AdminSession = {
  userId: string;
  token: string;
  role: string;
  isAdmin: boolean;
};

/**
 * STRATEGIC FIX: Explicitly export this function for gateway.ts
 */
export async function getAdminSession(request: Request | any): Promise<AdminSession | null> {
  // Extract token using the reconciled cookie utility
  const token = getAccessTokenFromReq(request);

  if (!token) return null;

  // Validate against your AdminSession table in Postgres
  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) return null;

  return {
    userId: session.userId,
    token: session.token,
    role: session.user.role,
    isAdmin: session.user.status === 'active'
  };
}