import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logging";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type DownloadTokenPayload = {
  tid: string;
  rid: string;
  uid?: string;
  sid?: string;
  exp: number;
  iat: number;
  md?: Record<string, unknown>;
};

export type DownloadTokenRecord = {
  token: string;
  tokenId: string;
  contentId: string;
  expiresAt: Date;
  maxDownloads: number;
  usedCount: number;
  userId?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type TokenValidationResult = {
  valid: boolean;
  reason?: string;
  token?: DownloadTokenRecord;
  payload?: DownloadTokenPayload;
  remainingDownloads?: number;
};

export type DownloadAccessBinding = {
  sessionId?: string | null;
  userId?: string | null;
};

export type TokenForensics = {
  watermarkId: string | null;
  expectedFooter: string | null;
  fingerprint: string | null;
};

export type TokenStats = {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  exhausted: number;
};

export type CleanupResult = {
  deleted: number;
  details: {
    expired: number;
    revoked: number;
  };
};

function getDownloadTokenSecret(): string {
  const secret = String(
    process.env.DOWNLOAD_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || "",
  ).trim();

  if (!secret) {
    throw new Error(
      "[DOWNLOAD_TOKEN] Missing DOWNLOAD_TOKEN_SECRET or NEXTAUTH_SECRET",
    );
  }

  return secret;
}

// -----------------------------------------------------------------------------
// CORE UTILITIES
// -----------------------------------------------------------------------------

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): string {
  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = normalized.length % 4;
    const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
    return Buffer.from(padded, "base64").toString("utf8");
  } catch (error) {
    logger.error("[BASE64_DECODE_ERROR]", {
      error: error instanceof Error ? error.message : "Unknown error",
      inputLength: typeof input === "string" ? input.length : 0,
    });
    return "";
  }
}

function sign(input: string): string {
  return base64UrlEncode(
    crypto.createHmac("sha256", getDownloadTokenSecret()).update(input).digest(),
  );
}

function safeJsonParse<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

function timingSafeEqualStr(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

type PrismaJsonInput =
  | Prisma.InputJsonValue
  | Prisma.NullableJsonNullValueInput;

function toPrismaJson(value: unknown): PrismaJsonInput {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    try {
      JSON.stringify(value);
      return value as Prisma.InputJsonValue;
    } catch {
      return [];
    }
  }

  if (typeof value === "object") {
    try {
      JSON.stringify(value);
      return value as Prisma.InputJsonValue;
    } catch {
      return {};
    }
  }

  return {};
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function rowMetadataToRecord(value: unknown): Record<string, unknown> | null {
  return asRecord(value);
}

function buildMergedTokenMetadata(params: {
  metadata?: Record<string, unknown>;
  watermarkId?: string | null;
  expectedFooter?: string | null;
  fingerprint?: string | null;
  pdfTitle?: string | null;
  pdfCreator?: string | null;
  pdfProducer?: string | null;
}): Record<string, unknown> {
  const base = params.metadata ?? {};
  const forensics = asRecord(base.forensics) ?? {};
  const pdf = asRecord(base.pdf) ?? {};

  return {
    ...base,
    forensics: {
      ...forensics,
      watermarkId: params.watermarkId ?? null,
      expectedFooter: params.expectedFooter ?? null,
      fingerprint: params.fingerprint ?? null,
    },
    pdf: {
      ...pdf,
      title: params.pdfTitle ?? null,
      creator: params.pdfCreator ?? null,
      producer: params.pdfProducer ?? null,
    },
  };
}

function buildWatermarkId(input: {
  tokenId: string;
  contentId: string;
  userId?: string | null;
  sessionId?: string | null;
  tier?: string | null;
}): string {
  return `wm_${crypto
    .createHash("sha256")
    .update(
      [
        input.tokenId,
        input.contentId,
        input.userId ?? "",
        input.sessionId ?? "",
        input.tier ?? "",
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 16)}`;
}

function buildExpectedFooter(input: {
  contentId: string;
  tokenId: string;
  userId?: string | null;
  sessionId?: string | null;
  watermarkId: string;
}): string {
  return [
    "Licensed copy",
    `Content: ${input.contentId}`,
    `Token: ${input.tokenId}`,
    input.userId ? `User: ${input.userId}` : null,
    input.sessionId ? `Session: ${input.sessionId}` : null,
    `WM: ${input.watermarkId}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

// -----------------------------------------------------------------------------
// PUBLIC API
// -----------------------------------------------------------------------------

export async function createDownloadToken(params: {
  contentId: string;
  userId?: string | null;
  sessionId?: string | null;
  expiresIn: number;
  maxDownloads?: number;
  metadata?: Record<string, unknown>;
  watermarkId?: string | null;
  expectedFooter?: string | null;
  fingerprint?: string | null;
  pdfTitle?: string | null;
  pdfCreator?: string | null;
  pdfProducer?: string | null;
}): Promise<DownloadTokenRecord> {
  try {
    const nowMs = Date.now();
    const tokenId = crypto.randomUUID();
    const expiresIn = Math.max(1000, Number(params.expiresIn || 0));
    const expiresAt = new Date(nowMs + expiresIn);
    const maxDownloads = Math.max(1, Number(params.maxDownloads || 1));

    const tier =
      typeof params.metadata?.tier === "string"
        ? String(params.metadata.tier)
        : null;

    const watermarkId =
      params.watermarkId ??
      buildWatermarkId({
        tokenId,
        contentId: params.contentId,
        userId: params.userId ?? null,
        sessionId: params.sessionId ?? null,
        tier,
      });

    const expectedFooter =
      params.expectedFooter ??
      buildExpectedFooter({
        contentId: params.contentId,
        tokenId,
        userId: params.userId ?? null,
        sessionId: params.sessionId ?? null,
        watermarkId,
      });

    const mergedMetadata = buildMergedTokenMetadata({
      metadata: params.metadata,
      watermarkId,
      expectedFooter,
      fingerprint: params.fingerprint ?? null,
      pdfTitle: params.pdfTitle ?? null,
      pdfCreator: params.pdfCreator ?? null,
      pdfProducer: params.pdfProducer ?? null,
    });

    const payload: DownloadTokenPayload = {
      tid: tokenId,
      rid: params.contentId,
      uid: params.userId || undefined,
      sid: params.sessionId || undefined,
      iat: Math.floor(nowMs / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
      md: mergedMetadata,
    };

    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsigned = `${encodedHeader}.${encodedPayload}`;
    const signature = sign(unsigned);
    const token = `${unsigned}.${signature}`;

    await prisma.premiumDownloadToken.create({
      data: {
        tokenId,
        contentId: params.contentId,
        userId: params.userId ?? null,
        sessionId: params.sessionId ?? null,
        tier,
        issuedAt: new Date(nowMs),
        expiresAt,
        maxDownloads,
        usedCount: 0,
        metadata: JSON.stringify(mergedMetadata),
      },
    });

    logger.info("[TOKEN_CREATED]", {
      tokenId,
      contentId: params.contentId,
      userId: params.userId ?? null,
      sessionId: params.sessionId ?? null,
      expiresAt: expiresAt.toISOString(),
      maxDownloads,
    });

    return {
      token,
      tokenId,
      contentId: params.contentId,
      expiresAt,
      maxDownloads,
      usedCount: 0,
      userId: params.userId ?? null,
      sessionId: params.sessionId ?? null,
      metadata: mergedMetadata,
    };
  } catch (error) {
    logger.error("[TOKEN_CREATION_ERROR]", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      contentId: params.contentId,
      userId: params.userId ?? null,
      sessionId: params.sessionId ?? null,
      maxDownloads: params.maxDownloads ?? null,
      expiresIn: params.expiresIn,
      watermarkId: params.watermarkId ?? null,
      pdfTitle: params.pdfTitle ?? null,
      metadataKeys: params.metadata ? Object.keys(params.metadata) : [],
    });

    throw new Error("Failed to create download token");
  }
}

export async function verifyDownloadToken(
  token: string,
  expectedContentId?: string,
): Promise<TokenValidationResult> {
  try {
    const raw = String(token || "").trim();
    const parts = raw.split(".");
    if (parts.length !== 3) {
      return { valid: false, reason: "MALFORMED_TOKEN" };
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return { valid: false, reason: "MALFORMED_TOKEN" };
    }

    const unsigned = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = sign(unsigned);

    if (!timingSafeEqualStr(encodedSignature, expectedSignature)) {
      return { valid: false, reason: "INVALID_SIGNATURE" };
    }

    const payload = safeJsonParse<DownloadTokenPayload>(
      base64UrlDecode(encodedPayload),
    );

    if (!payload?.tid || !payload?.rid || !payload?.exp) {
      return { valid: false, reason: "INVALID_PAYLOAD" };
    }

    if (payload.exp * 1000 <= Date.now()) {
      return { valid: false, reason: "TOKEN_EXPIRED", payload };
    }

    if (expectedContentId && payload.rid !== expectedContentId) {
      return { valid: false, reason: "RESOURCE_MISMATCH", payload };
    }

    const row = await prisma.premiumDownloadToken.findUnique({
      where: { tokenId: payload.tid },
    });

    if (!row) {
      return { valid: false, reason: "TOKEN_NOT_FOUND", payload };
    }

    if (row.revokedAt) {
      return { valid: false, reason: "TOKEN_REVOKED", payload };
    }

    if (expectedContentId && row.contentId !== expectedContentId) {
      return { valid: false, reason: "DATABASE_MISMATCH", payload };
    }

    if (row.usedCount >= row.maxDownloads) {
      return {
        valid: false,
        reason: "MAX_DOWNLOADS_EXCEEDED",
        payload,
        token: {
          token: raw,
          tokenId: row.tokenId,
          contentId: row.contentId,
          expiresAt: row.expiresAt,
          maxDownloads: row.maxDownloads,
          usedCount: row.usedCount,
          userId: row.userId ?? null,
          sessionId: row.sessionId ?? null,
          metadata: rowMetadataToRecord(row.metadata),
        },
        remainingDownloads: 0,
      };
    }

    return {
      valid: true,
      payload,
      token: {
        token: raw,
        tokenId: row.tokenId,
        contentId: row.contentId,
        expiresAt: row.expiresAt,
        maxDownloads: row.maxDownloads,
        usedCount: row.usedCount,
        userId: row.userId ?? null,
        sessionId: row.sessionId ?? null,
        metadata: rowMetadataToRecord(row.metadata),
      },
      remainingDownloads: Math.max(0, row.maxDownloads - row.usedCount),
    };
  } catch (error) {
    logger.error("[TOKEN_VERIFY_ERROR]", {
      error: error instanceof Error ? error.message : "Unknown error",
      tokenPrefix: `${token?.substring(0, 10) || ""}...`,
    });
    return { valid: false, reason: "VERIFICATION_FAILED" };
  }
}

/**
 * Get the most recent valid token for a given content ID
 */
export async function getDownloadTokenByContentId(
  contentId: string,
): Promise<DownloadTokenRecord | null> {
  try {
    const row = await prisma.premiumDownloadToken.findFirst({
      where: {
        contentId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        usedCount: { lt: prisma.premiumDownloadToken.fields.maxDownloads },
      },
      orderBy: { issuedAt: "desc" },
    });

    if (!row) return null;

    return {
      token: "",
      tokenId: row.tokenId,
      contentId: row.contentId,
      expiresAt: row.expiresAt,
      maxDownloads: row.maxDownloads,
      usedCount: row.usedCount,
      userId: row.userId ?? null,
      sessionId: row.sessionId ?? null,
      metadata: rowMetadataToRecord(row.metadata),
    };
  } catch (error) {
    logger.error("[GET_TOKEN_BY_CONTENT_ERROR]", {
      contentId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

export function getTokenForensics(
  metadata: Record<string, unknown> | null | undefined,
): TokenForensics {
  try {
    const base = metadata ?? {};
    const forensics = asRecord(base.forensics) ?? {};

    return {
      watermarkId:
        typeof forensics.watermarkId === "string"
          ? forensics.watermarkId
          : null,
      expectedFooter:
        typeof forensics.expectedFooter === "string"
          ? forensics.expectedFooter
          : null,
      fingerprint:
        typeof forensics.fingerprint === "string"
          ? forensics.fingerprint
          : null,
    };
  } catch {
    return { watermarkId: null, expectedFooter: null, fingerprint: null };
  }
}

export async function incrementTokenUsage(token: string): Promise<boolean> {
  try {
    const raw = String(token || "").trim();
    const parts = raw.split(".");
    if (parts.length !== 3) return false;

    const encodedPayload = parts[1];
    if (!encodedPayload) return false;

    const payload = safeJsonParse<DownloadTokenPayload>(
      base64UrlDecode(encodedPayload),
    );
    if (!payload?.tid) return false;

    return await prisma.$transaction(async (tx) => {
      const row = await tx.premiumDownloadToken.findUnique({
        where: { tokenId: payload.tid },
      });

      if (!row) return false;
      if (row.revokedAt) return false;
      if (row.expiresAt.getTime() <= Date.now()) return false;
      if (row.usedCount >= row.maxDownloads) return false;

      await tx.premiumDownloadToken.update({
        where: { tokenId: payload.tid },
        data: {
          usedCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      return true;
    });
  } catch (error) {
    logger.error("[TOKEN_INCREMENT_ERROR]", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

export function doesTokenMatchBinding(
  payload: DownloadTokenPayload,
  binding: DownloadAccessBinding,
): boolean {
  try {
    const tokenSessionId =
      typeof payload.sid === "string" && payload.sid.trim()
        ? payload.sid.trim()
        : null;

    const tokenUserId =
      typeof payload.uid === "string" && payload.uid.trim()
        ? payload.uid.trim()
        : null;

    const currentSessionId =
      typeof binding.sessionId === "string" && binding.sessionId.trim()
        ? binding.sessionId.trim()
        : null;

    const currentUserId =
      typeof binding.userId === "string" && binding.userId.trim()
        ? binding.userId.trim()
        : null;

    if (
      tokenSessionId &&
      currentSessionId &&
      tokenSessionId !== currentSessionId
    ) {
      return false;
    }

    if (tokenUserId && currentUserId && tokenUserId !== currentUserId) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function revokeDownloadTokenByTokenId(
  tokenId: string,
): Promise<boolean> {
  try {
    const result = await prisma.premiumDownloadToken.updateMany({
      where: { tokenId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (result.count > 0) {
      logger.info("[TOKEN_REVOKED]", { tokenId });
    }

    return result.count > 0;
  } catch (error) {
    logger.error("[TOKEN_REVOKE_ERROR]", {
      tokenId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

export async function revokeDownloadTokensByContentId(
  contentId: string,
): Promise<number> {
  try {
    const result = await prisma.premiumDownloadToken.updateMany({
      where: { contentId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (result.count > 0) {
      logger.info("[TOKENS_REVOKED_BY_CONTENT]", {
        contentId,
        count: result.count,
      });
    }

    return result.count;
  } catch (error) {
    logger.error("[TOKEN_REVOKE_BY_CONTENT_ERROR]", {
      contentId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return 0;
  }
}

export async function revokeDownloadTokensByUserId(
  userId: string,
): Promise<number> {
  try {
    const result = await prisma.premiumDownloadToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (result.count > 0) {
      logger.info("[TOKENS_REVOKED_BY_USER]", {
        userId,
        count: result.count,
      });
    }

    return result.count;
  } catch (error) {
    logger.error("[TOKEN_REVOKE_BY_USER_ERROR]", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return 0;
  }
}

export async function cleanupExpiredDownloadTokens(
  daysOld = 7,
): Promise<CleanupResult> {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  try {
    const expired = await prisma.premiumDownloadToken.deleteMany({
      where: {
        expiresAt: { lt: cutoff },
      },
    });

    const revoked = await prisma.premiumDownloadToken.deleteMany({
      where: {
        revokedAt: { lt: cutoff },
      },
    });

    const total = expired.count + revoked.count;

    logger.info("[TOKEN_CLEANUP_COMPLETED]", {
      deleted: total,
      expired: expired.count,
      revoked: revoked.count,
      cutoff: cutoff.toISOString(),
    });

    return {
      deleted: total,
      details: {
        expired: expired.count,
        revoked: revoked.count,
      },
    };
  } catch (error) {
    logger.error("[TOKEN_CLEANUP_ERROR]", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { deleted: 0, details: { expired: 0, revoked: 0 } };
  }
}

export async function getTokenInfo(tokenId: string): Promise<{
  exists: boolean;
  isValid?: boolean;
  expiresIn?: number;
  usedCount?: number;
  remaining?: number;
  revoked?: boolean;
} | null> {
  try {
    const token = await prisma.premiumDownloadToken.findUnique({
      where: { tokenId },
      select: {
        expiresAt: true,
        revokedAt: true,
        usedCount: true,
        maxDownloads: true,
      },
    });

    if (!token) return { exists: false };

    const now = Date.now();
    const expiresAt = token.expiresAt.getTime();

    return {
      exists: true,
      isValid:
        !token.revokedAt &&
        expiresAt > now &&
        token.usedCount < token.maxDownloads,
      expiresIn: Math.max(0, expiresAt - now),
      usedCount: token.usedCount,
      remaining: Math.max(0, token.maxDownloads - token.usedCount),
      revoked: !!token.revokedAt,
    };
  } catch (error) {
    logger.error("[GET_TOKEN_INFO_ERROR]", {
      tokenId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

export async function getTokenStats(): Promise<TokenStats> {
  try {
    const now = new Date();

    const [total, active, expired, revoked, exhausted] = await Promise.all([
      prisma.premiumDownloadToken.count(),
      prisma.premiumDownloadToken.count({
        where: {
          expiresAt: { gt: now },
          revokedAt: null,
          usedCount: { lt: prisma.premiumDownloadToken.fields.maxDownloads },
        },
      }),
      prisma.premiumDownloadToken.count({
        where: { expiresAt: { lt: now } },
      }),
      prisma.premiumDownloadToken.count({
        where: { revokedAt: { not: null } },
      }),
      prisma.premiumDownloadToken.count({
        where: {
          usedCount: { gte: prisma.premiumDownloadToken.fields.maxDownloads },
          revokedAt: null,
          expiresAt: { gt: now },
        },
      }),
    ]);

    return { total, active, expired, revoked, exhausted };
  } catch (error) {
    logger.error("[GET_TOKEN_STATS_ERROR]", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { total: 0, active: 0, expired: 0, revoked: 0, exhausted: 0 };
  }
}

// Aliases for backward compatibility
export const generateDownloadToken = createDownloadToken;
export const validateDownloadToken = verifyDownloadToken;
export const createToken = createDownloadToken;
export const verifyToken = verifyDownloadToken;
