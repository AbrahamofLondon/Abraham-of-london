/**
 * Access Invite Service — server-side invite lifecycle management.
 *
 * Handles creation, validation, redemption, and revocation of
 * email-based access invitations.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma.server";
import { logAccessAudit } from "./audit";
import type { EntitlementGrant } from "./types";

// ---------------------------------------------------------------------------
// Token utilities
// ---------------------------------------------------------------------------

/** Generate a secure random invite token. */
export function generateInviteToken(): string {
  return `aoli_${crypto.randomBytes(32).toString("base64url")}`;
}

/** Hash a token for storage. Raw token is never persisted. */
export function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ---------------------------------------------------------------------------
// Create invite
// ---------------------------------------------------------------------------

export type CreateInviteInput = {
  recipientEmail: string;
  grants: EntitlementGrant[];
  maxUses?: number;
  expiresAt?: Date | null;
  issuedBy: string;
  metadata?: Record<string, unknown>;
};

export type CreateInviteResult = {
  id: string;
  token: string; // raw token — show once, never persist
  recipientEmail: string;
};

export async function createInvite(
  input: CreateInviteInput,
): Promise<CreateInviteResult> {
  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);

  const invite = await prisma.accessInvite.create({
    data: {
      recipientEmail: input.recipientEmail.toLowerCase().trim(),
      tokenHash,
      grants: input.grants,
      maxUses: input.maxUses ?? 1,
      expiresAt: input.expiresAt ?? null,
      issuedBy: input.issuedBy,
      metadata: input.metadata ?? {},
    },
  });

  await logAccessAudit({
    actorType: "ADMIN",
    actorEmail: input.issuedBy,
    action: "invite.created",
    targetType: "access_invite",
    targetKey: invite.id,
    success: true,
    metadata: {
      recipientEmail: input.recipientEmail,
      grants: input.grants,
    },
  });

  return {
    id: invite.id,
    token,
    recipientEmail: invite.recipientEmail,
  };
}

// ---------------------------------------------------------------------------
// Mark email sent
// ---------------------------------------------------------------------------

export async function markInviteEmailSent(
  inviteId: string,
  error?: string,
): Promise<void> {
  await prisma.accessInvite.update({
    where: { id: inviteId },
    data: error
      ? { emailError: error }
      : { emailSentAt: new Date(), emailError: null },
  });
}

// ---------------------------------------------------------------------------
// Validate + redeem invite
// ---------------------------------------------------------------------------

export type RedeemInviteResult =
  | { ok: true; grants: EntitlementGrant[] }
  | { ok: false; error: string };

export async function redeemInvite(
  rawToken: string,
  userId: string,
  userEmail: string,
): Promise<RedeemInviteResult> {
  const tokenHash = hashInviteToken(rawToken);
  const now = new Date();

  const invite = await prisma.accessInvite.findUnique({
    where: { tokenHash },
  });

  if (!invite) {
    await logAccessAudit({
      actorType: "USER",
      actorUserId: userId,
      action: "invite.redeem",
      targetType: "access_invite",
      targetKey: "unknown",
      success: false,
      reason: "not_found",
    });
    return { ok: false, error: "INVALID_INVITE" };
  }

  if (invite.status !== "PENDING") {
    return { ok: false, error: `INVITE_${invite.status}` };
  }

  if (invite.expiresAt && invite.expiresAt <= now) {
    await prisma.accessInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    return { ok: false, error: "INVITE_EXPIRED" };
  }

  if (invite.uses >= invite.maxUses) {
    return { ok: false, error: "INVITE_DEPLETED" };
  }

  // Email binding check — if invite has a specific recipient, verify match
  const recipientEmail = invite.recipientEmail.toLowerCase().trim();
  const callerEmail = userEmail.toLowerCase().trim();
  if (recipientEmail && recipientEmail !== callerEmail) {
    await logAccessAudit({
      actorType: "USER",
      actorUserId: userId,
      action: "invite.redeem",
      targetType: "access_invite",
      targetKey: invite.id,
      success: false,
      reason: "email_mismatch",
      metadata: { expected: recipientEmail, actual: callerEmail },
    });
    return { ok: false, error: "EMAIL_MISMATCH" };
  }

  // Parse grants
  let grants: EntitlementGrant[];
  try {
    grants = invite.grants as EntitlementGrant[];
    if (!Array.isArray(grants)) throw new Error("not array");
  } catch {
    return { ok: false, error: "INVALID_INVITE_FORMAT" };
  }

  // Issue entitlements + update invite in transaction
  await prisma.$transaction(async (tx) => {
    for (const grant of grants) {
      await tx.entitlement.create({
        data: {
          userId,
          type: grant.type === "tier" ? "TIER" : grant.type === "product" ? "PRODUCT" : "ARTIFACT",
          key: grant.key,
          status: "ACTIVE",
          issuedBy: `invite:${invite.id}`,
          metadata: {
            source: "access_invite",
            inviteId: invite.id,
          },
        },
      });
    }

    const newUses = invite.uses + 1;
    await tx.accessInvite.update({
      where: { id: invite.id },
      data: {
        uses: { increment: 1 },
        redeemedByUserId: userId,
        redeemedAt: now,
        status: newUses >= invite.maxUses ? "REDEEMED" : "PENDING",
      },
    });
  });

  await logAccessAudit({
    actorType: "USER",
    actorUserId: userId,
    actorEmail: userEmail,
    action: "invite.redeemed",
    targetType: "access_invite",
    targetKey: invite.id,
    success: true,
    metadata: { grants },
  });

  return { ok: true, grants };
}

// ---------------------------------------------------------------------------
// Revoke invite
// ---------------------------------------------------------------------------

export async function revokeInvite(
  inviteId: string,
  revokedBy: string,
  reason?: string,
): Promise<void> {
  await prisma.accessInvite.update({
    where: { id: inviteId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedBy,
      reason: reason ?? "Revoked by admin",
    },
  });

  await logAccessAudit({
    actorType: "ADMIN",
    actorEmail: revokedBy,
    action: "invite.revoked",
    targetType: "access_invite",
    targetKey: inviteId,
    success: true,
    metadata: { reason },
  });
}
