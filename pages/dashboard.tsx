/**
 * pages/dashboard.tsx — RETIRED
 *
 * This was the OGR Sovereign Dashboard requiring sovereign session auth.
 * It is no longer part of the current product architecture.
 *
 * Redirect logic:
 *   OWNER/ADMIN → /admin (the real command center)
 *   Authenticated user → /access (their access summary)
 *   Anonymous → / (homepage)
 */
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { getUserAccess } from "@/lib/access/get-user-access";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const userId = (session?.user as any)?.id ?? null;
  const access = await getUserAccess(prisma, userId);

  if (access.permissions.isAdmin || access.permissions.isOwner) {
    return { redirect: { destination: "/admin", permanent: false } };
  }

  if (access.permissions.isAuthenticated) {
    return { redirect: { destination: "/access", permanent: false } };
  }

  return { redirect: { destination: "/", permanent: false } };
};

export default function DashboardRetired() {
  return null;
}
