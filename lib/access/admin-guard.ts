/**
 * Admin route guard — server-side only.
 *
 * Use in getServerSideProps for /admin/* pages.
 * Checks role from session, NOT client-side.
 */

import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getUserAccess } from "@/lib/access/entitlements";

type AdminGuardResult<T> =
  | { authorized: true; userId: string; props: T }
  | { authorized: false; redirect: GetServerSidePropsResult<any> };

/**
 * requireAdmin — call from getServerSideProps to protect admin pages.
 *
 * Returns the user ID if authorized, or a redirect if not.
 *
 * Usage:
 * ```ts
 * export const getServerSideProps = async (ctx) => {
 *   const guard = await requireAdmin(ctx);
 *   if (!guard.authorized) return guard.redirect;
 *   // guard.userId is available
 *   return { props: { ... } };
 * };
 * ```
 */
export async function requireAdmin<T = Record<string, never>>(
  ctx: GetServerSidePropsContext,
  extraProps?: T,
): Promise<AdminGuardResult<T>> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  if (!session?.user) {
    return {
      authorized: false,
      redirect: {
        redirect: {
          destination: "/inner-circle?callbackUrl=" + encodeURIComponent(ctx.resolvedUrl),
          permanent: false,
        },
      },
    };
  }

  const userId = (session.user as any).id || (session as any).aol?.memberId;
  if (!userId) {
    return {
      authorized: false,
      redirect: {
        redirect: { destination: "/inner-circle", permanent: false },
      },
    };
  }

  const access = await getUserAccess(userId);

  if (!access.permissions.isAdmin) {
    return {
      authorized: false,
      redirect: {
        redirect: { destination: "/", permanent: false },
      },
    };
  }

  return {
    authorized: true,
    userId,
    props: (extraProps ?? {}) as T,
  };
}
