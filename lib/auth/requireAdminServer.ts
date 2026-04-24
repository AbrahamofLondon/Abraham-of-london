import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { getUserAccess } from "@/lib/access/get-user-access";

export async function requireAdminServer() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;
  const access = await getUserAccess(prisma, userId);

  if (!access.permissions.isAuthenticated) {
    redirect("/admin/login");
  }

  if (!access.permissions.isAdmin) {
    redirect("/auth/access-denied");
  }

  return { session, access };
}
