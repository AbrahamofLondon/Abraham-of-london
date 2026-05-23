import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma.server";
import { canAccessAdmin } from "@/lib/access/checks";
import { getUserAccess } from "@/lib/access/get-user-access";
import { isAdminEmail, extractSessionRole } from "@/lib/auth/admin-authority";

export type RequireAdminPageResult =
  | { ok: true; session: Awaited<ReturnType<typeof getServerSession>>; adminEmail: string }
  | { ok: false; redirect: { destination: string; permanent: boolean } };

function encodeReturnTo(ctx: GetServerSidePropsContext): string {
  const raw = ctx.resolvedUrl || "/admin";
  if (raw.startsWith("//") || raw.includes("://")) return encodeURIComponent("/admin");
  return encodeURIComponent(raw);
}

export async function requireAdminPage(ctx: GetServerSidePropsContext): Promise<RequireAdminPageResult> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  if (!session) {
    return { ok: false, redirect: { destination: `/admin/login?returnTo=${encodeReturnTo(ctx)}`, permanent: false } };
  }

  const access = await getUserAccess(prisma, (session.user as any)?.id ?? null, (session.user as any)?.email);
  if (!canAccessAdmin(access)) {
    return { ok: false, redirect: { destination: "/auth/access-denied", permanent: false } };
  }

  return { ok: true, session, adminEmail: String(session.user?.email || "").toLowerCase() };
}

export function getAdminDebugIdentity(session: any) {
  return {
    email: session?.user?.email ?? null,
    role: extractSessionRole(session),
    emailAllowed: isAdminEmail(session?.user?.email),
  };
}
