/* lib/auth/key-generator.ts — TOKENSTORE ALIGNED (DETERMINISTIC HASH) */
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { KeyStatus, Prisma } from "@prisma/client";
import { hashAccessKey } from "@/lib/server/auth/tokenStore.postgres";

export type GenerateKeyOptions = {
  keyType?: string; // stored as string in schema
  expiresInDays?: number; // default: 365 here (tokenStore default is 30)
  metadata?: Prisma.JsonObject; // ✅ Prisma-safe JSON object
};

function normalizeKeyType(input?: string): string {
  const raw = (input ?? "member").trim();
  const normalized = raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 64);
  return normalized || "member";
}

export async function generatePrincipalKey(memberId: string, options: GenerateKeyOptions = {}) {
  if (!memberId) throw new Error("memberId is required");

  // 1) Generate raw key (return ONCE)
  const rawKey = `AOL-${crypto.randomBytes(24).toString("hex").toUpperCase()}`;
  const keySuffix = rawKey.slice(-4);

  // 2) Deterministic hash that matches tokenStore.redeemAccessKey()
  const keyHash = hashAccessKey(rawKey);

  // 3) Persist schema-aligned record
  const keyType = normalizeKeyType(options.keyType);

  const expiresInDays =
    Number.isFinite(options.expiresInDays as number)
      ? Math.max(1, Math.floor(options.expiresInDays as number))
      : 365;

  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  // NOTE:
  // If your generated Prisma client still does not include `keySuffix` (stale client),
  // comment out the `keySuffix` line below and keep it only inside metadata.
  await prisma.innerCircleKey.create({
    data: {
      memberId,
      keyHash,
      keySuffix,
      keyType,
      status: KeyStatus.active,
      expiresAt,
      lastUsedAt: null,
      // ✅ must be Prisma InputJsonValue-compatible
      metadata: (options.metadata ?? { keySuffix }) as Prisma.InputJsonValue,
    },
  });

  return {
    rawKey,
    keySuffix,
    keyType,
    expiresAt,
    instructions: "Provide this key to the Principal. It cannot be recovered once this session ends.",
  };
}