/**
 * lib/boardroom/boardroom-access-token.ts
 *
 * Secure token-based access for client-facing Boardroom Dossier delivery.
 *
 * Design:
 * - Raw token: 48 crypto-random bytes, base64url-encoded (never stored)
 * - Stored:    SHA-256 hash of raw token only
 * - URL form:  /boardroom/dossier/:id?token=<raw>
 * - Validation: hash raw token, compare against DB, check expiry + revocation
 * - Governance: BOARDROOM_SECURE_LINK_CREATED / BOARDROOM_SECURE_LINK_REVOKED emitted
 *
 * This replaces the legacy ?email= query-parameter access pattern.
 */

import "server-only";

import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma.server";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Raw token byte length. 48 bytes → 64-char base64url string. */
const TOKEN_BYTES = 48;

/** Default expiry: 7 days from creation. */
const DEFAULT_EXPIRY_DAYS = 7;

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateTokenInput = {
  dossierId: string;
  createdBy: string;
  clientEmail?: string;
  clientName?: string;
  /** Expiry in days from now. Defaults to 7. */
  expiryDays?: number;
};

export type TokenValidationResult =
  | { valid: true; tokenRecord: BoardroomTokenRecord }
  | { valid: false; reason: "NOT_FOUND" | "REVOKED" | "EXPIRED" };

export type BoardroomTokenRecord = {
  id: string;
  dossierId: string;
  clientEmail: string | null;
  clientName: string | null;
  expiresAt: string;
  revokedAt: string | null;
  lastViewedAt: string | null;
  viewCount: number;
  createdBy: string;
  createdAt: string;
};

export type CreateTokenResult = {
  /** Raw token — return to caller, never persist. */
  rawToken: string;
  /** Delivery URL for the dossier. */
  deliveryUrl: string;
  record: BoardroomTokenRecord;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a cryptographically secure raw token (base64url). */
function generateRawToken(): string {
  return randomBytes(TOKEN_BYTES)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Hash a raw token with SHA-256. Returns hex string. */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

/** Map a Prisma token record to the public type. */
function mapRecord(r: any): BoardroomTokenRecord {
  return {
    id: r.id,
    dossierId: r.dossierId,
    clientEmail: r.clientEmail ?? null,
    clientName: r.clientName ?? null,
    expiresAt: r.expiresAt.toISOString(),
    revokedAt: r.revokedAt?.toISOString() ?? null,
    lastViewedAt: r.lastViewedAt?.toISOString() ?? null,
    viewCount: r.viewCount,
    createdBy: r.createdBy,
    createdAt: r.createdAt.toISOString(),
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const BoardroomAccessTokenService = {

  /**
   * Create a secure delivery token for a Boardroom Dossier.
   *
   * Returns the raw token exactly once — it is never stored.
   * Caller must transmit it to the client immediately (e.g., via email link).
   *
   * Emits BOARDROOM_SECURE_LINK_CREATED governance event.
   */
  async createToken(input: CreateTokenInput): Promise<CreateTokenResult> {
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiryDays = input.expiryDays ?? DEFAULT_EXPIRY_DAYS;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const record = await prisma.boardroomDossierAccessToken.create({
      data: {
        dossierId: input.dossierId,
        tokenHash,
        clientEmail: input.clientEmail ?? null,
        clientName: input.clientName ?? null,
        expiresAt,
        createdBy: input.createdBy,
      },
    });

    await routeGovernanceEvent({
      eventType: "BOARDROOM_SECURE_LINK_CREATED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomDossier",
      canonicalRecordId: input.dossierId,
      actorId: input.createdBy,
      severity: "HIGH",
      payload: {
        tokenId: record.id,
        expiresAt: expiresAt.toISOString(),
        expiryDays,
        hasClientEmail: !!input.clientEmail,
      },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    const deliveryUrl = `/boardroom/dossier/${input.dossierId}?token=${rawToken}`;

    return {
      rawToken,
      deliveryUrl,
      record: mapRecord(record),
    };
  },

  /**
   * Validate a raw token presented by a client.
   *
   * Hashes the raw token, looks up by hash, checks expiry and revocation.
   * Does NOT increment viewCount — call recordTokenView() separately.
   */
  async validateToken(rawToken: string): Promise<TokenValidationResult> {
    if (!rawToken || typeof rawToken !== "string") {
      return { valid: false, reason: "NOT_FOUND" };
    }

    const tokenHash = hashToken(rawToken);

    const record = await prisma.boardroomDossierAccessToken.findUnique({
      where: { tokenHash },
    });

    if (!record) {
      return { valid: false, reason: "NOT_FOUND" };
    }

    if (record.revokedAt !== null) {
      return { valid: false, reason: "REVOKED" };
    }

    if (record.expiresAt < new Date()) {
      return { valid: false, reason: "EXPIRED" };
    }

    return { valid: true, tokenRecord: mapRecord(record) };
  },

  /**
   * Record a view against a token record.
   * Increments viewCount and updates lastViewedAt.
   * Call after successful validation + dossier retrieval.
   */
  async recordTokenView(tokenId: string): Promise<void> {
    await prisma.boardroomDossierAccessToken.update({
      where: { id: tokenId },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });
  },

  /**
   * Revoke a specific token before expiry.
   * Emits BOARDROOM_SECURE_LINK_REVOKED governance event.
   */
  async revokeToken(tokenId: string, revokedBy: string): Promise<BoardroomTokenRecord> {
    const record = await prisma.boardroomDossierAccessToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    await routeGovernanceEvent({
      eventType: "BOARDROOM_SECURE_LINK_REVOKED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomDossier",
      canonicalRecordId: record.dossierId,
      actorId: revokedBy,
      severity: "HIGH",
      payload: {
        tokenId: record.id,
        revokedAt: record.revokedAt?.toISOString(),
      },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    return mapRecord(record);
  },

  /**
   * List all active (non-revoked, non-expired) tokens for a dossier.
   */
  async listActiveTokens(dossierId: string): Promise<BoardroomTokenRecord[]> {
    const records = await prisma.boardroomDossierAccessToken.findMany({
      where: {
        dossierId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    return records.map(mapRecord);
  },

  /**
   * List all tokens for a dossier (admin view — includes revoked/expired).
   */
  async listAllTokens(dossierId: string): Promise<BoardroomTokenRecord[]> {
    const records = await prisma.boardroomDossierAccessToken.findMany({
      where: { dossierId },
      orderBy: { createdAt: "desc" },
    });
    return records.map(mapRecord);
  },
};
