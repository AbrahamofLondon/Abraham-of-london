/**
 * Role Resolver — maps authenticated sessions to DecisionRole.
 *
 * Server-only. Queries organisation membership and admin authority
 * to produce a canonical role assignment for the current user.
 */

import { prisma } from "@/lib/prisma.server";
import { isAdminEmail, ADMIN_EMAILS } from "@/lib/auth/admin-authority";
import type { DecisionRole } from "./role-contract";

type RoleResolution = {
  role: DecisionRole;
  source: string;
};

type ResolveInput = {
  userId: string | null;
  email: string | null;
  organisationId?: string | null;
};

/**
 * Map raw roleTitle strings from OrganisationMembership to DecisionRole.
 */
const ROLE_TITLE_MAP: Record<string, DecisionRole> = {
  OWNER: "OWNER",
  SPONSOR: "SPONSOR",
  EXECUTIVE: "SPONSOR",
  CLIENT: "CLIENT",
  RESPONDENT: "RESPONDENT",
  OPERATOR: "OPERATOR",
  COUNSEL: "COUNSEL_REVIEWER",
  REVIEWER: "COUNSEL_REVIEWER",
};

/**
 * Resolve the DecisionRole for a given user context.
 *
 * Priority:
 * 1. Owner email (first in ADMIN_EMAILS list) → OWNER
 * 2. Admin email → ADMIN
 * 3. Organisation membership with recognised roleTitle → mapped role
 * 4. Authenticated fallback → CLIENT
 */
export async function resolveDecisionRole(input: ResolveInput): Promise<RoleResolution> {
  const { userId, email, organisationId } = input;

  // 1. Check owner (first admin email is the canonical owner)
  if (email && isAdminEmail(email)) {
    const normalised = email.trim().toLowerCase();
    if (normalised === ADMIN_EMAILS[0]) {
      return { role: "OWNER", source: "admin-authority:owner" };
    }
    return { role: "ADMIN", source: "admin-authority:admin-email" };
  }

  // 2. Check organisation membership for a known roleTitle
  if (email) {
    try {
      const membership = await prisma.organisationMembership.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          status: "active",
          ...(organisationId ? { organisationId } : {}),
        },
        select: { roleTitle: true, isExecutive: true },
        orderBy: { createdAt: "desc" },
      });

      if (membership) {
        const title = (membership.roleTitle ?? "").toUpperCase().trim();
        const mapped = ROLE_TITLE_MAP[title];
        if (mapped) {
          return { role: mapped, source: `org-membership:${title}` };
        }

        // isExecutive flag without explicit roleTitle → SPONSOR
        if (membership.isExecutive) {
          return { role: "SPONSOR", source: "org-membership:executive-flag" };
        }
      }
    } catch {
      // If the query fails (e.g. model not yet migrated), fall through
    }
  }

  // 3. Authenticated user with no special role → CLIENT
  if (userId || email) {
    return { role: "CLIENT", source: "fallback:authenticated" };
  }

  // 4. Unauthenticated — treat as RESPONDENT (minimal access)
  return { role: "RESPONDENT", source: "fallback:unauthenticated" };
}
