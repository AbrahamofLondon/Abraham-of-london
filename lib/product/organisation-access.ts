/**
 * lib/product/organisation-access.ts — Organisation access helper.
 *
 * Evaluates whether a user can access organisation-level decision intelligence.
 * Uses OrganisationMembership from Prisma + admin auth as authority sources.
 *
 * Default: deny. Membership required for all non-admin access.
 * Anonymous campaign identity exposure: always false.
 * Raw response access: always false in v0.
 * Small sample suppression: always true.
 */

import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/access/admin-emails";
import {
  type OrganisationAccessDecision,
  type OrganisationAccessRole,
  type OrganisationAccessScope,
  ROLE_SCOPES,
  ROLE_PRIVACY,
} from "@/lib/product/organisation-access-contract";

// ─────────────────────────────────────────────────────────────────────────────
// ROLE DERIVATION
// ─────────────────────────────────────────────────────────────────────────────

function deriveMemberRole(membership: {
  roleTitle?: string | null;
  isExecutive?: boolean;
  status?: string;
} | null): OrganisationAccessRole | null {
  if (!membership || membership.status !== "active") return null;

  const role = (membership.roleTitle || "").toLowerCase();

  if (role.includes("owner") || role.includes("founder") || role.includes("ceo")) return "OWNER";
  if (role.includes("sponsor") || role.includes("director") || role.includes("principal")) return "SPONSOR";
  if (membership.isExecutive) return "SPONSOR";
  if (role.includes("decision") || role.includes("lead")) return "DECISION_OWNER";
  if (role.includes("observer") || role.includes("viewer")) return "OBSERVER";

  // Default active member → DECISION_OWNER (conservative)
  return "DECISION_OWNER";
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

export async function evaluateOrganisationAccess(input: {
  userId?: string | null;
  email?: string | null;
  organisationId: string;
  requestedScope: OrganisationAccessScope;
}): Promise<OrganisationAccessDecision> {
  const { email, organisationId, requestedScope } = input;

  // ── 1. Admin override ──
  if (isAdminEmail(email)) {
    const adminRole: OrganisationAccessRole = "OPERATOR";
    return {
      allowed: ROLE_SCOPES[adminRole].includes(requestedScope),
      role: adminRole,
      scopes: ROLE_SCOPES[adminRole],
      reason: "Admin operator access.",
      privacyBoundary: ROLE_PRIVACY[adminRole],
    };
  }

  // ── 2. No identity → deny ──
  if (!email) {
    return denied("No authenticated identity provided.");
  }

  // ── 3. Lookup organisation membership ──
  let membership: {
    roleTitle: string | null;
    isExecutive: boolean;
    status: string;
  } | null = null;

  try {
    membership = await prisma.organisationMembership.findUnique({
      where: {
        organisationId_email: {
          organisationId,
          email: email.toLowerCase(),
        },
      },
      select: {
        roleTitle: true,
        isExecutive: true,
        status: true,
      },
    });
  } catch {
    // Prisma error — deny by default
    return denied("Organisation membership lookup failed.");
  }

  // ── 4. No membership → deny ──
  if (!membership) {
    return denied("Not a member of this organisation.");
  }

  if (membership.status !== "active") {
    return denied(`Membership status is "${membership.status}". Active membership required.`);
  }

  // ── 5. Derive role and check scope ──
  const role = deriveMemberRole(membership);
  if (!role) {
    return denied("Could not determine organisation role from membership.");
  }

  const allowedScopes = ROLE_SCOPES[role];
  const hasScope = allowedScopes.includes(requestedScope);

  if (!hasScope) {
    return {
      allowed: false,
      role,
      scopes: allowedScopes,
      reason: `Role "${role}" does not include scope "${requestedScope}".`,
      privacyBoundary: ROLE_PRIVACY[role],
    };
  }

  return {
    allowed: true,
    role,
    scopes: allowedScopes,
    reason: `Access granted. Role: ${role}. Scope: ${requestedScope}.`,
    privacyBoundary: ROLE_PRIVACY[role],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function denied(reason: string): OrganisationAccessDecision {
  return {
    allowed: false,
    scopes: [],
    reason,
    privacyBoundary: {
      canViewRawResponses: false,
      canViewNamedRespondents: false,
      canViewAggregates: false,
      smallSampleSuppressionApplies: true,
    },
  };
}
