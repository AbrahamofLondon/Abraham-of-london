/**
 * Surface Access Guard — role-based page protection.
 *
 * Server-only. Used in getServerSideProps to enforce DecisionPermission
 * requirements before rendering a page.
 */

import type { GetServerSidePropsContext, Redirect } from "next";
import { resolvePageAccess } from "./server";
import { resolveDecisionRole } from "./role-resolver.server";
import { hasPermission } from "./role-contract";
import { logVisibilityAudit } from "./audit";
import type { DecisionRole } from "./role-contract";
import type { DecisionPermission } from "./role-contract";

type RoleCheckSuccess = {
  authorized: true;
  userId: string;
  email: string;
  role: DecisionRole;
};

type RoleCheckDenied = {
  redirect: Redirect;
};

/**
 * Check that the current session user has the required permission.
 *
 * Returns either an authorized result with user context, or a redirect
 * to the access-denied page. Always logs the visibility check.
 */
export async function requireRole(
  ctx: GetServerSidePropsContext,
  requiredPermission: DecisionPermission,
): Promise<RoleCheckSuccess | RoleCheckDenied> {
  const { session, access } = await resolvePageAccess(ctx);

  const userId = session?.user?.id ?? null;
  const email = typeof session?.user?.email === "string"
    ? session.user.email.trim().toLowerCase()
    : null;

  // Unauthenticated users get redirected to sign-in
  if (!access.permissions.isAuthenticated || !userId || !email) {
    await logVisibilityAudit({
      userId: null,
      email: null,
      role: null,
      surface: ctx.resolvedUrl,
      allowed: false,
      reason: "unauthenticated",
    });

    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  // Resolve the user's decision role
  const organisationId = typeof ctx.query.organisationId === "string"
    ? ctx.query.organisationId
    : null;

  const { role } = await resolveDecisionRole({ userId, email, organisationId });

  const allowed = hasPermission(role, requiredPermission);

  // Log the visibility check
  await logVisibilityAudit({
    userId,
    email,
    role,
    surface: ctx.resolvedUrl,
    allowed,
    reason: allowed ? undefined : `role=${role} lacks ${requiredPermission}`,
  });

  if (!allowed) {
    return {
      redirect: {
        destination: "/auth/access-denied",
        permanent: false,
      },
    };
  }

  return {
    authorized: true,
    userId,
    email,
    role,
  };
}
