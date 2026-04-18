import crypto from "crypto";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma.server";
import { getUserAccess } from "@/lib/access/get-user-access";
import { hasTier, normalizeTier } from "@/lib/access/tier";

type Ok<T> = { ok: true } & T;
type Fail = { ok: false; reason: string };

export type SessionContext = {
  ok: boolean;
  valid?: boolean;
  sessionId?: string;
  memberId?: string | null;
  tier?: string;
  displayRole?: string | null;
  directive?: null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  flags?: string[];
  expiresAt?: string;
  reason?: string;
};

async function decodeSessionToken(sessionId: string) {
  if (!sessionId || sessionId.startsWith("sess_")) {
    return null;
  }

  try {
    return await getToken({
      req: {
        headers: {
          cookie: `next-auth.session-token=${encodeURIComponent(sessionId)}; __Secure-next-auth.session-token=${encodeURIComponent(sessionId)}`,
        },
      } as any,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });
  } catch {
    return null;
  }
}

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(String(input || ""), "utf8").digest("hex");
}

export function hashAccessKey(rawKey: string): string {
  return sha256Hex(String(rawKey || "").trim().toLowerCase());
}

export function tierAtLeast(userTier: unknown, requiredTier: unknown): boolean {
  return hasTier(
    normalizeTier(String(userTier ?? "")),
    normalizeTier(String(requiredTier ?? "")),
  );
}

export async function verifySession(
  sessionId: string,
): Promise<
  | Ok<{
      valid: true;
      tier: string;
      memberId: string | null;
      expiresAt: string;
    }>
  | Ok<{ valid: false; reason: string }>
> {
  const token = await decodeSessionToken(String(sessionId || "").trim());
  const userId = typeof token?.sub === "string" ? token.sub : null;
  if (!token || !userId) {
    return { ok: true, valid: false, reason: "SESSION_NOT_FOUND" };
  }

  const access = await getUserAccess(prisma, userId);
  return {
    ok: true,
    valid: true,
    tier: access.tier,
    memberId: access.userId,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

export async function getSessionTier(sessionId: string): Promise<string> {
  const verified = await verifySession(sessionId);
  return verified.ok && verified.valid ? verified.tier : "public";
}

export async function getSessionContext(sessionId: string): Promise<SessionContext> {
  const token = await decodeSessionToken(String(sessionId || "").trim());
  const userId = typeof token?.sub === "string" ? token.sub : null;
  const email = typeof token?.email === "string" ? token.email : null;
  const name = typeof token?.name === "string" ? token.name : null;

  if (!token || !userId) {
    return { ok: false, reason: "SESSION_NOT_FOUND" };
  }

  const access = await getUserAccess(prisma, userId);

  return {
    ok: true,
    valid: true,
    sessionId,
    memberId: access.userId,
    tier: access.tier,
    displayRole: access.role,
    directive: null,
    email,
    name,
    role: access.role,
    flags: [],
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

export async function mintSession(): Promise<Fail> {
  return {
    ok: false,
    reason: "LEGACY_SESSION_MINT_DISABLED",
  };
}

export async function redeemAccessKey(): Promise<Fail> {
  return {
    ok: false,
    reason: "LEGACY_KEY_REDEMPTION_DISABLED",
  };
}

export async function revokeSession(): Promise<Ok<{ revoked: true }>> {
  return { ok: true, revoked: true };
}

export async function revokeKeyByHash(): Promise<Ok<{ revoked: true }>> {
  return { ok: true, revoked: true };
}

export default {
  sha256Hex,
  hashAccessKey,
  tierAtLeast,
  verifySession,
  getSessionTier,
  getSessionContext,
  mintSession,
  revokeSession,
  revokeKeyByHash,
  redeemAccessKey,
};
