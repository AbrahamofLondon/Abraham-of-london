import "server-only";

/**
 * Identity Service — privacy-first user identity management.
 *
 * Core principle: decision data and user identity are NEVER stored together.
 * All joins go through SessionLink. Email is encrypted at rest using AES-256-GCM.
 *
 * This service handles:
 * - Email encryption/hashing for storage
 * - User identity creation (encrypted)
 * - Session linking (decision ↔ identity bridge)
 * - Full deletion (right to be forgotten)
 * - Retention purge (90-day inactive cleanup)
 */

import * as crypto from "crypto";
import { prisma } from "@/lib/prisma.server";
import { encrypt, decrypt } from "@/lib/integrations/encryption";

// ─── Email hashing (for lookup without decryption) ───────────────────────────

function hashEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create or retrieve a user identity from an email address.
 * Email is encrypted at rest. A SHA-256 hash is used for lookups.
 */
export async function resolveUserIdentity(email: string): Promise<{
  id: string;
  isNew: boolean;
}> {
  const emailHash = hashEmail(email);

  const existing = await prisma.userIdentity.findUnique({
    where: { emailHash },
  });

  if (existing) {
    if (existing.deletedAt) {
      // User previously deleted — reactivate
      await prisma.userIdentity.update({
        where: { id: existing.id },
        data: { deletedAt: null, emailEncrypted: encrypt(email.trim().toLowerCase()) },
      });
    }
    return { id: existing.id, isNew: false };
  }

  const created = await prisma.userIdentity.create({
    data: {
      emailEncrypted: encrypt(email.trim().toLowerCase()),
      emailHash,
    },
  });

  return { id: created.id, isNew: true };
}

/**
 * Decrypt a stored email. Use only when sending emails — never for display or logging.
 */
export function decryptEmail(encryptedEmail: string): string {
  return decrypt(encryptedEmail);
}

/**
 * Link a decision session to a user identity.
 * This is the ONLY bridge between PII and decision data.
 */
export async function linkSessionToUser(
  sessionId: string,
  userId: string,
): Promise<void> {
  await prisma.sessionLink.upsert({
    where: { sessionId },
    create: { sessionId, userId },
    update: { userId },
  });
}

/**
 * Store a decision session (PII-free).
 */
export async function storeDecisionSession(input: {
  sessionId: string;
  anchors?: Record<string, unknown> | null;
  pattern?: string | null;
  trajectory?: string | null;
  source?: string | null;
}): Promise<void> {
  await prisma.decisionSession.upsert({
    where: { sessionId: input.sessionId },
    create: {
      sessionId: input.sessionId,
      anchors: input.anchors ? JSON.parse(JSON.stringify(input.anchors)) : undefined,
      pattern: input.pattern,
      trajectory: input.trajectory,
      source: input.source,
    },
    update: {
      anchors: input.anchors ? JSON.parse(JSON.stringify(input.anchors)) : undefined,
      pattern: input.pattern,
      trajectory: input.trajectory,
      source: input.source,
    },
  });
}

/**
 * Capture email at a result screen — creates identity + links to session.
 * This is the privacy-safe replacement for the raw capture endpoint.
 */
export async function captureEmailForSession(input: {
  email: string;
  sessionId: string;
  source: string;
}): Promise<{ userId: string; isNew: boolean }> {
  const { id: userId, isNew } = await resolveUserIdentity(input.email);

  // Ensure the decision session exists
  await storeDecisionSession({
    sessionId: input.sessionId,
    source: input.source,
  });

  // Create the bridge
  await linkSessionToUser(input.sessionId, userId);

  return { userId, isNew };
}

/**
 * Check if a user has unsubscribed from communications.
 */
export async function isUnsubscribed(email: string): Promise<boolean> {
  const emailHash = hashEmail(email);
  const user = await prisma.userIdentity.findUnique({
    where: { emailHash },
    select: { unsubscribed: true },
  });
  return user?.unsubscribed ?? false;
}

export async function hasUserIdentity(email: string): Promise<boolean> {
  const emailHash = hashEmail(email);
  const user = await prisma.userIdentity.findUnique({
    where: { emailHash },
    select: { id: true },
  });
  return Boolean(user?.id);
}

/**
 * Unsubscribe a user from all communications.
 */
export async function unsubscribeUser(email: string): Promise<boolean> {
  const emailHash = hashEmail(email);
  try {
    await prisma.userIdentity.update({
      where: { emailHash },
      data: { unsubscribed: true },
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Deletion (Right to be forgotten) ────────────────────────────────────────

/**
 * Delete all user data — identity, session links, and associated decision sessions.
 */
export async function deleteUserData(email: string): Promise<{
  deleted: boolean;
  sessionsRemoved: number;
}> {
  const emailHash = hashEmail(email);

  const user = await prisma.userIdentity.findUnique({
    where: { emailHash },
    include: { links: true },
  });

  if (!user) {
    return { deleted: false, sessionsRemoved: 0 };
  }

  const sessionIds = user.links.map((link) => link.sessionId);

  // Delete in order: links → sessions → identity
  await prisma.sessionLink.deleteMany({
    where: { userId: user.id },
  });

  let sessionsRemoved = 0;
  if (sessionIds.length > 0) {
    const result = await prisma.decisionSession.deleteMany({
      where: { sessionId: { in: sessionIds } },
    });
    sessionsRemoved = result.count;
  }

  // Soft-delete identity (retain hash for unsubscribe enforcement)
  await prisma.userIdentity.update({
    where: { id: user.id },
    data: {
      emailEncrypted: "DELETED",
      deletedAt: new Date(),
      unsubscribed: true,
    },
  });

  return { deleted: true, sessionsRemoved };
}

// ─── Retention purge ─────────────────────────────────────────────────────────

/**
 * Purge inactive decision sessions older than 90 days with no linked user.
 */
export async function purgeInactiveSessions(): Promise<{ purged: number }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  // Find unlinked sessions older than 90 days
  const stale = await prisma.decisionSession.findMany({
    where: {
      createdAt: { lt: cutoff },
      link: null,
    },
    select: { id: true },
    take: 500,
  });

  if (stale.length === 0) {
    return { purged: 0 };
  }

  const result = await prisma.decisionSession.deleteMany({
    where: { id: { in: stale.map((s) => s.id) } },
  });

  return { purged: result.count };
}
