// lib/inner-circle/jwt.ts — SSOT JWT Utilities (JOSE, Edge-safe)

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";

/* -----------------------------------------------------------------------------
  Types
----------------------------------------------------------------------------- */

export type InnerCircleTier = AccessTier;

export interface InnerCircleJWT extends JWTPayload {
  id: string;
  email: string;
  name: string;
  tier: InnerCircleTier;
  iat: number;
  exp: number;
}

/* -----------------------------------------------------------------------------
  Secret handling (fail hard in production)
----------------------------------------------------------------------------- */

function getJwtSecret(): Uint8Array {
  const raw = process.env.INNER_CIRCLE_JWT_SECRET;

  if (process.env.NODE_ENV === "production" && (!raw || raw.trim().length < 32)) {
    throw new Error(
      "[inner-circle/jwt] Missing or weak INNER_CIRCLE_JWT_SECRET in production. Set >= 32 chars."
    );
  }

  const fallback = "inner-circle-secret-change-in-production";
  const secret = raw && raw.trim().length > 0 ? raw.trim() : fallback;

  return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJwtSecret();
const JWT_ISSUER = process.env.INNER_CIRCLE_JWT_ISSUER?.trim() || undefined;
const JWT_AUDIENCE = process.env.INNER_CIRCLE_JWT_AUDIENCE?.trim() || undefined;

/* -----------------------------------------------------------------------------
  Helpers
----------------------------------------------------------------------------- */

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function base64UrlToString(b64url: string): string {
  const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLen);

  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  // Node fallback if Buffer exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B: any = (globalThis as any).Buffer;
  if (B) return B.from(padded, "base64").toString("utf8");

  throw new Error("No base64 decoder available in this runtime.");
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function isAccessTier(v: any): v is AccessTier {
  return v === "public" ||
    v === "member" ||
    v === "inner-circle" ||
    v === "client" ||
    v === "legacy" ||
    v === "architect" ||
    v === "owner";
}

// Decode-only shape validation (untrusted)
function isInnerCirclePayload(p: any): p is InnerCircleJWT {
  return (
    p &&
    isNonEmptyString(p.id) &&
    isNonEmptyString(p.email) &&
    isNonEmptyString(p.name) &&
    isAccessTier(p.tier) &&
    typeof p.iat === "number" &&
    typeof p.exp === "number"
  );
}

/* -----------------------------------------------------------------------------
  Public API
----------------------------------------------------------------------------- */

export async function createInnerCircleToken(user: {
  id: string;
  email: string;
  name: string;
  tier?: AccessTier | string;
}): Promise<string> {
  if (!isNonEmptyString(user.id) || !isNonEmptyString(user.email) || !isNonEmptyString(user.name)) {
    throw new Error("[inner-circle/jwt] Invalid user fields for token creation.");
  }

  const tier: AccessTier = normalizeUserTier(user.tier ?? "member");

  const jwt = new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    tier,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .setSubject(user.id);

  if (JWT_ISSUER) jwt.setIssuer(JWT_ISSUER);
  if (JWT_AUDIENCE) jwt.setAudience(JWT_AUDIENCE);

  return jwt.sign(JWT_SECRET);
}

export async function verifyInnerCircleToken(token: string): Promise<InnerCircleJWT | null> {
  if (!isNonEmptyString(token)) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    // strict payload validation
    if (!isInnerCirclePayload(payload)) return null;

    // normalize tier defensively (even verified tokens could come from older issuers)
    const normalizedTier = normalizeUserTier((payload as any).tier);

    return {
      ...(payload as any),
      tier: normalizedTier,
    } as InnerCircleJWT;
  } catch (error) {
    console.error(
      "[inner-circle/jwt] JWT verification failed:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Decode payload WITHOUT verifying signature.
 * Use only for non-security hints.
 */
export function decodeTokenUnverified(token: string): InnerCircleJWT | null {
  if (!isNonEmptyString(token)) return null;

  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payloadPart = parts[1];
    if (!payloadPart) return null;

    const json = base64UrlToString(payloadPart);
    const payload = safeJsonParse<any>(json);
    if (!payload) return null;

    // If shape is old/partial, reject
    if (!isInnerCirclePayload(payload)) return null;

    // Normalize tier defensively
    payload.tier = normalizeUserTier(payload.tier);

    return payload as InnerCircleJWT;
  } catch (error) {
    console.error(
      "[inner-circle/jwt] Token decode failed:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

export function decodeClientToken(token: string): InnerCircleJWT | null {
  if (typeof window === "undefined") return null;
  return decodeTokenUnverified(token);
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeTokenUnverified(token);
  if (!decoded) return true;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Development-only fake token (UNSIGNED / INVALID).
 * Only useful if your dev flow checks decode-only (not verification).
 */
export function createDevToken(): string {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("[inner-circle/jwt] Dev tokens only available in development.");
  }

  const payload: InnerCircleJWT = {
    id: "dev_001",
    email: "dev@abrahamoflondon.org",
    name: "Development User",
    tier: "inner-circle",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
  };

  const headerObj = { alg: "HS256", typ: "JWT" };
  const headerJson = JSON.stringify(headerObj);
  const payloadJson = JSON.stringify(payload);

  const toB64Url = (s: string) => {
    const bytes = new TextEncoder().encode(s);

    let base64: string;
    if (typeof btoa === "function") {
      let bin = "";
      bytes.forEach((b) => (bin += String.fromCharCode(b)));
      base64 = btoa(bin);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const B: any = (globalThis as any).Buffer;
      if (!B) throw new Error("No base64 encoder available in this runtime.");
      base64 = B.from(bytes).toString("base64");
    }

    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  };

  const header = toB64Url(headerJson);
  const payload64 = toB64Url(payloadJson);

  // Intentionally invalid signature
  const signature = "dev-signature";

  return `${header}.${payload64}.${signature}`;
}