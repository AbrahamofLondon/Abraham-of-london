import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { requireAdminPage } from "./server";

type AdminGuardResult<T> =
  | { authorized: true; userId: string; props: T }
  | { authorized: false; redirect: GetServerSidePropsResult<any> };

export async function requireAdmin<T = Record<string, never>>(
  ctx: GetServerSidePropsContext,
  extraProps?: T,
): Promise<AdminGuardResult<T>> {
  const resolved = await requireAdminPage(ctx, extraProps);
  if (!resolved.authorized) {
    return {
      authorized: false,
      redirect: resolved.redirect,
    };
  }

  return {
    authorized: true,
    userId: resolved.userId,
    props: resolved.props,
  };
}
