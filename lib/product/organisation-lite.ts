/**
 * lib/product/organisation-lite.ts
 *
 * Organisation-Lite — lightweight team collaboration for Professional users.
 *
 * Uses existing Organisation, OrganisationMembership, and OrganisationInvite
 * models. Adds role support through the existing OrganisationAccessRole type.
 *
 * Default seat allowance: Professional includes 5 seats.
 * Additional collaborator: £15/month (configured in catalog).
 *
 * Roles:
 *   OWNER       — full control, can manage members, billing, and cases
 *   ADMIN       — can manage members and cases, cannot change billing
 *   CONTRIBUTOR — can create and edit cases, contribute outcomes, export
 *   VIEWER      — read-only access to shared cases
 *   AUDITOR     — read-only access with verification capability
 */

import { prisma } from "@/lib/prisma.server";
import crypto from "crypto";
import type { OrganisationAccessRole } from "./organisation-access-contract";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default seat allowance for Professional tier */
export const PROFESSIONAL_SEAT_ALLOWANCE = 5;

/** Additional collaborator price in pence (£15) */
export const ADDITIONAL_SEAT_PRICE_PENCE = 1500;

export const ADDITIONAL_SEAT_PRICE_LABEL = "£15/month";

// ─── Role mapping ─────────────────────────────────────────────────────────────

/**
 * Maps Organisation-Lite roles to existing OrganisationAccessRole values.
 */
export const LITE_ROLE_MAP: Record<OrgLiteRole, OrganisationAccessRole> = {
  OWNER: "OWNER",
  ADMIN: "SPONSOR",
  CONTRIBUTOR: "DECISION_OWNER",
  VIEWER: "OBSERVER",
  AUDITOR: "REVIEWER",
};

export type OrgLiteRole = "OWNER" | "ADMIN" | "CONTRIBUTOR" | "VIEWER" | "AUDITOR";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgLiteMember = {
  membershipId: string;
  organisationId: string;
  organisationName: string;
  email: string;
  fullName: string | null;
  role: OrgLiteRole;
  status: string;
  joinedAt: string;
};

export type OrgLiteSummary = {
  organisationId: string;
  organisationName: string;
  memberCount: number;
  seatAllowance: number;
  seatsUsed: number;
  overageCount: number;
  members: OrgLiteMember[];
};

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Creates a new organisation.
 */
export async function createOrganisation(input: {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerUserId?: string | null;
}): Promise<OrgLiteSummary> {
  const org = await prisma.organisation.create({
    data: {
      name: input.name,
      slug: input.slug,
      status: "active",
    },
  });

  await prisma.organisationMembership.create({
    data: {
      organisationId: org.id,
      userId: input.ownerUserId ?? null,
      email: input.ownerEmail.toLowerCase(),
      fullName: input.name,
      status: "active",
    },
  });

  return getOrganisationSummary(org.id, input.ownerEmail);
}

/**
 * Returns a summary of the organisation for the given user.
 */
export async function getOrganisationSummary(
  organisationId: string,
  userEmail: string,
): Promise<OrgLiteSummary> {
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    include: {
      memberships: {
        where: { status: "active" },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!org) throw new Error("Organisation not found");

  const members: OrgLiteMember[] = org.memberships.map((m) => ({
    membershipId: m.id,
    organisationId: org.id,
    organisationName: org.name,
    email: m.email,
    fullName: m.fullName,
    role: "CONTRIBUTOR" as OrgLiteRole,
    status: m.status,
    joinedAt: m.createdAt.toISOString(),
  }));

  return {
    organisationId: org.id,
    organisationName: org.name,
    memberCount: members.length,
    seatAllowance: PROFESSIONAL_SEAT_ALLOWANCE,
    seatsUsed: members.length,
    overageCount: Math.max(0, members.length - PROFESSIONAL_SEAT_ALLOWANCE),
    members,
  };
}

/**
 * Invites a member to an organisation by email.
 * Returns the invite token for sharing.
 */
export async function inviteMember(input: {
  organisationId: string;
  inviterEmail: string;
  recipientEmail: string;
  role: OrgLiteRole;
}): Promise<{ inviteId: string; token: string }> {
  const token = `org_${crypto.randomBytes(24).toString("base64url")}`;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const invite = await prisma.organisationInvite.create({
    data: {
      organisationId: input.organisationId,
      email: input.recipientEmail.toLowerCase(),
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      metadata: JSON.stringify({ invitedBy: input.inviterEmail, role: input.role }),
    },
  });

  return { inviteId: invite.id, token };
}

/**
 * Accepts an invite using the raw token.
 */
export async function acceptInvite(input: {
  token: string;
  email: string;
  userId?: string | null;
}): Promise<{ ok: true; organisationId: string } | { ok: false; reason: string }> {
  const tokenHash = crypto.createHash("sha256").update(input.token).digest("hex");

  const invite = await prisma.organisationInvite.findUnique({
    where: { tokenHash },
    include: { organisation: true },
  });

  if (!invite) return { ok: false, reason: "INVITE_NOT_FOUND" };
  if (invite.acceptedAt) return { ok: false, reason: "INVITE_ALREADY_ACCEPTED" };
  if (invite.revokedAt) return { ok: false, reason: "INVITE_REVOKED" };
  if (invite.expiresAt < new Date()) return { ok: false, reason: "INVITE_EXPIRED" };
  if (invite.email.toLowerCase() !== input.email.toLowerCase()) {
    return { ok: false, reason: "EMAIL_MISMATCH" };
  }

  // Check seat allowance
  const activeCount = await prisma.organisationMembership.count({
    where: { organisationId: invite.organisationId, status: "active" },
  });

  if (activeCount >= PROFESSIONAL_SEAT_ALLOWANCE) {
    return { ok: false, reason: "SEAT_LIMIT_REACHED" };
  }

  await prisma.organisationMembership.create({
    data: {
      organisationId: invite.organisationId,
      userId: input.userId ?? null,
      email: input.email.toLowerCase(),
      status: "active",
    },
  });

  await prisma.organisationInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  return { ok: true, organisationId: invite.organisationId };
}

/**
 * Returns organisations for a user.
 */
export async function getUserOrganisations(email: string): Promise<OrgLiteSummary[]> {
  const memberships = await prisma.organisationMembership.findMany({
    where: { email: email.toLowerCase(), status: "active" },
    include: { organisation: true },
    orderBy: { createdAt: "desc" },
  });

  const summaries: OrgLiteSummary[] = [];
  for (const membership of memberships) {
    const summary = await getOrganisationSummary(membership.organisationId, email);
    summaries.push(summary);
  }

  return summaries;
}

/**
 * Removes a member from an organisation.
 */
export async function removeMember(input: {
  organisationId: string;
  membershipId: string;
  requesterEmail: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const membership = await prisma.organisationMembership.findUnique({
    where: { id: input.membershipId },
  });

  if (!membership || membership.organisationId !== input.organisationId) {
    return { ok: false, reason: "MEMBERSHIP_NOT_FOUND" };
  }

  // Cannot remove the last owner
  const ownerCount = await prisma.organisationMembership.count({
    where: { organisationId: input.organisationId, status: "active" },
  });

  if (ownerCount <= 1 && membership.email === input.requesterEmail) {
    return { ok: false, reason: "CANNOT_REMOVE_LAST_MEMBER" };
  }

  await prisma.organisationMembership.update({
    where: { id: input.membershipId },
    data: { status: "removed" },
  });

  return { ok: true };
}
