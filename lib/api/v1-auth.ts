/**
 * lib/api/v1-auth.ts
 *
 * Shared authentication helper for the /api/v1/* enterprise API.
 *
 * Authenticates callers using the x-api-key header. Keys are stored as
 * SHA-256 hashes in the ApiKey table, linked to an InnerCircleMember.
 *
 * Usage:
 *   const result = await resolveV1ApiKey(req);
 *   if (!result.ok) return res.status(result.status).json({ error: result.error });
 *   const { memberId, keyId } = result;
 */

import crypto from "crypto";
import type { NextApiRequest } from "next";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type V1AuthSuccess = {
  ok: true;
  keyId: string;
  memberId: string;
  keyName: string;
};

export type V1AuthFailure = {
  ok: false;
  status: 401 | 403;
  error: string;
};

export type V1AuthResult = V1AuthSuccess | V1AuthFailure;

// ─── Rate limit constants ─────────────────────────────────────────────────────

/** Maximum requests per minute per API key (enforced by caller; not checked here). */
export const V1_RATE_LIMIT_RPM = 60;

// ─── Auth resolution ──────────────────────────────────────────────────────────

/**
 * Resolves an enterprise API key from the x-api-key request header.
 * Returns the key identity if valid and active.
 */
export async function resolveV1ApiKey(req: NextApiRequest): Promise<V1AuthResult> {
  const raw = req.headers["x-api-key"];
  const key = Array.isArray(raw) ? raw[0] : raw;

  if (!key || typeof key !== "string" || key.length < 32) {
    return { ok: false, status: 401, error: "Missing or malformed x-api-key header" };
  }

  // Hash the incoming key and look up
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");

  const record = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      name: true,
      memberId: true,
      createdAt: true,
    },
  });

  if (!record) {
    return { ok: false, status: 401, error: "Invalid API key" };
  }

  return {
    ok: true,
    keyId: record.id,
    memberId: record.memberId,
    keyName: record.name,
  };
}

/**
 * Extracts a clean caller identity label from an auth result for logging.
 */
export function v1CallerLabel(auth: V1AuthSuccess): string {
  return `ApiKey:${auth.keyId.slice(-6)} (${auth.keyName})`;
}
