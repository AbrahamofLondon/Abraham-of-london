/**
 * lib/client-portal/client-portal-token.ts
 *
 * Magic-link session tokens for the Client Portal.
 *
 * Design mirrors boardroom-access-token.ts:
 * - Raw token: 32 crypto-random bytes, hex-encoded (never stored)
 * - Stored: SHA-256 hash only
 * - URL form: /portal?token=<raw>
 * - Session expiry: default 30 days (configurable)
 * - Revocable by admin
 */

import "server-only";

import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma.server";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKEN_BYTES = 32;
const DEFAULT_EXPIRY_DAYS = 30;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientPortalSessionRecord = {
  id: string;
  clientEmail: string;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  useCount: number;
  createdBy: string;
  createdAt: Date;
};

export type CreateSessionResult = {
  rawToken: string;
  portalUrl: string;
  record: ClientPortalSessionRecord;
};

export type SessionValidationResult =
  | { valid: true; session: ClientPortalSessionRecord }
  | { valid: false; reason: "NOT_FOUND" | "REVOKED" | "EXPIRED" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateRawToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

function portalUrl(rawToken: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://abrahamoflondon.org";
  return `${base}/portal?token=${encodeURIComponent(rawToken)}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const ClientPortalTokenService = {
  /**
   * Create a new portal session token for a client email.
   * Returns the raw token exactly once.
   */
  async createSession(input: {
    clientEmail: string;
    expiryDays?: number;
    createdBy: string;
  }): Promise<CreateSessionResult> {
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiryDays = Math.min(Math.max(input.expiryDays ?? DEFAULT_EXPIRY_DAYS, 1), 90);
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const record = await prisma.clientPortalSession.create({
      data: {
        clientEmail: input.clientEmail.trim().toLowerCase(),
        tokenHash,
        expiresAt,
        createdBy: input.createdBy,
      },
    });

    return {
      rawToken,
      portalUrl: portalUrl(rawToken),
      record: {
        id: record.id,
        clientEmail: record.clientEmail,
        expiresAt: record.expiresAt,
        revokedAt: record.revokedAt,
        lastUsedAt: record.lastUsedAt,
        useCount: record.useCount,
        createdBy: record.createdBy,
        createdAt: record.createdAt,
      },
    };
  },

  /** Validate a raw token. Returns the session record if valid. */
  async validateSession(rawToken: string): Promise<SessionValidationResult> {
    const tokenHash = hashToken(rawToken);

    const session = await prisma.clientPortalSession.findUnique({
      where: { tokenHash },
    });

    if (!session) return { valid: false, reason: "NOT_FOUND" };
    if (session.revokedAt) return { valid: false, reason: "REVOKED" };
    if (session.expiresAt <= new Date()) return { valid: false, reason: "EXPIRED" };

    return {
      valid: true,
      session: {
        id: session.id,
        clientEmail: session.clientEmail,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
        lastUsedAt: session.lastUsedAt,
        useCount: session.useCount,
        createdBy: session.createdBy,
        createdAt: session.createdAt,
      },
    };
  },

  /** Record a session use (updates lastUsedAt, increments useCount). */
  async recordUse(sessionId: string): Promise<void> {
    await prisma.clientPortalSession.update({
      where: { id: sessionId },
      data: {
        lastUsedAt: new Date(),
        useCount: { increment: 1 },
      },
    });
  },

  /** Revoke a session token. */
  async revokeSession(sessionId: string): Promise<void> {
    await prisma.clientPortalSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  },

  /** List all active sessions for a client email. */
  async listActiveSessions(clientEmail: string): Promise<ClientPortalSessionRecord[]> {
    const sessions = await prisma.clientPortalSession.findMany({
      where: {
        clientEmail: clientEmail.trim().toLowerCase(),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    return sessions.map((s) => ({
      id: s.id,
      clientEmail: s.clientEmail,
      expiresAt: s.expiresAt,
      revokedAt: s.revokedAt,
      lastUsedAt: s.lastUsedAt,
      useCount: s.useCount,
      createdBy: s.createdBy,
      createdAt: s.createdAt,
    }));
  },
};
