import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { getUserAccess } from "@/lib/access/get-user-access";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;
  const access = await getUserAccess(prisma, userId);

  if (!access.permissions.isAuthenticated) {
    redirect("/api/auth/signin?callbackUrl=/admin");
  }

  if (!access.permissions.isAdmin) {
    redirect("/access");
  }

  return <>{children}</>;
}
