import crypto from "crypto";
import { prisma } from "@/lib/prisma.server";
import type { Prisma } from "@prisma/client";
import { logAccessAudit } from "./audit";
import { auditGrantedEntitlements, grantEntitlements } from "./entitlement-service";
import type { EntitlementGrant } from "./types";

export function generateInviteToken(): string {
  return `aoli_${crypto.randomBytes(32).toString("base64url")}`;
}

export function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

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
  token: string;
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
      metadata: (input.metadata ?? {}) as Prisma.InputJsonObject,
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
      recipientEmail: invite.recipientEmail,
      grants: input.grants,
    },
  });

  return {
    id: invite.id,
    token,
    recipientEmail: invite.recipientEmail,
  };
}

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

  await logAccessAudit({
    actorType: "SYSTEM",
    action: "invite.sent",
    targetType: "access_invite",
    targetKey: inviteId,
    success: !error,
    reason: error ?? null,
  });
}

export async function getInvitePreview(rawToken: string) {
  const tokenHash = hashInviteToken(rawToken);
  const invite = await prisma.accessInvite.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      recipientEmail: true,
      status: true,
      grants: true,
      expiresAt: true,
      issuedAt: true,
      uses: true,
      maxUses: true,
    },
  });

  if (!invite) return null;
  return invite;
}

export type RedeemInviteResult =
  | { ok: true; grants: EntitlementGrant[]; inviteId: string }
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
      actorEmail: userEmail,
      action: "invite.redeemed",
      targetType: "access_invite",
      targetKey: null,
      success: false,
      reason: "not_found",
    });
    return { ok: false, error: "INVALID_INVITE" };
  }

  if (invite.status === "REVOKED") {
    return { ok: false, error: "INVITE_REVOKED" };
  }

  if (invite.status === "REDEEMED" && invite.uses >= invite.maxUses) {
    return { ok: false, error: "INVITE_REDEEMED" };
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

  const recipientEmail = invite.recipientEmail.toLowerCase().trim();
  const callerEmail = userEmail.toLowerCase().trim();
  if (recipientEmail && recipientEmail !== callerEmail) {
    await logAccessAudit({
      actorType: "USER",
      actorUserId: userId,
      actorEmail: userEmail,
      action: "invite.redeemed",
      targetType: "access_invite",
      targetKey: invite.id,
      success: false,
      reason: "email_mismatch",
      metadata: { expected: recipientEmail, actual: callerEmail },
    });
    return { ok: false, error: "EMAIL_MISMATCH" };
  }

  const grants = Array.isArray(invite.grants)
    ? (invite.grants as unknown as EntitlementGrant[])
    : [];

  if (grants.length === 0) {
    return { ok: false, error: "INVALID_INVITE_FORMAT" };
  }

  const granted = await prisma.$transaction(async (tx) => {
    const grantedEntitlements = await grantEntitlements(tx, {
      userId,
      grants,
      issuedBy: `invite:${invite.id}`,
      metadata: {
        source: "access_invite",
        inviteId: invite.id,
      },
    });

    const nextUses = invite.uses + 1;
    await tx.accessInvite.update({
      where: { id: invite.id },
      data: {
        uses: { increment: 1 },
        redeemedByUserId: userId,
        redeemedAt: now,
        status: nextUses >= invite.maxUses ? "REDEEMED" : "PENDING",
      },
    });

    return grantedEntitlements;
  });

  await auditGrantedEntitlements({
    actorType: "USER",
    actorUserId: userId,
    actorEmail: userEmail,
    targetUserId: userId,
    grants: granted,
    source: `invite:${invite.id}`,
  });

  await logAccessAudit({
    actorType: "USER",
    actorUserId: userId,
    actorEmail: userEmail,
    action: "invite.redeemed",
    targetType: "access_invite",
    targetKey: invite.id,
    success: true,
    metadata: { grants: granted },
  });

  return { ok: true, grants: granted, inviteId: invite.id };
}

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
