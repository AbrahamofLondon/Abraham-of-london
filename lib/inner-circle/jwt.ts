// lib/inner-circle/jwt.ts
// Institutional-grade JWT utilities for Inner Circle auth.
//
// Goals:
// - Single signing/verification source of truth via JOSE
// - Edge-safe (no Node Buffer dependency in runtime paths)
// - Base64URL-correct decoding
// - No silent insecure defaults in production
// - Clear separation: verify (trusted) vs decode (untrusted introspection)

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/* -----------------------------------------------------------------------------
  Types
----------------------------------------------------------------------------- */

export type InnerCircleRole = "member" | "patron" | "inner-circle" | "founder";
export type InnerCircleTier = "inner-circle";

export interface InnerCircleJWT extends JWTPayload {
  id: string;
  email: string;
  name: string;
  role: InnerCircleRole;
  tier: InnerCircleTier;
  iat: number;
  exp: number;
}

/* -----------------------------------------------------------------------------
  Secret handling (fail hard in production)
----------------------------------------------------------------------------- */

function getJwtSecret(): Uint8Array {
  const raw = process.env.INNER_CIRCLE_JWT_SECRET;

  // In production, never allow a missing secret.
  if (process.env.NODE_ENV === "production" && (!raw || raw.trim().length < 32)) {
    throw new Error(
      "[inner-circle/jwt] Missing or weak INNER_CIRCLE_JWT_SECRET in production. Set a strong secret (>= 32 chars)."
    );
  }

  // In non-prod, allow a default to prevent local dev friction.
  const fallback = "inner-circle-secret-change-in-production";
  const secret = (raw && raw.trim().length > 0 ? raw.trim() : fallback);

  return new TextEncoder().encode(secret);
}

// Compute once per module load.
// NOTE: If you change env at runtime (rare), restart the server.
const JWT_SECRET = getJwtSecret();

// Optional issuer/audience enforcement (recommended if you already have these conventions).
// If you don't use iss/aud, leave them undefined.
const JWT_ISSUER = process.env.INNER_CIRCLE_JWT_ISSUER?.trim() || undefined;
const JWT_AUDIENCE = process.env.INNER_CIRCLE_JWT_AUDIENCE?.trim() || undefined;

/* -----------------------------------------------------------------------------
  Helpers
----------------------------------------------------------------------------- */

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

// Base64URL decode (JWT uses base64url, NOT classic base64)
// Works in Node + Edge.
function base64UrlToString(b64url: string): string {
  // Convert base64url -> base64
  const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLen);

  // Prefer global atob (Edge/browsers), fallback to Buffer if present (Node).
  if (typeof atob === "function") {
    const binary = atob(padded);
    // binary -> utf8 string
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  // Node fallback (only if Buffer exists)
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

// Minimal structural validation for decoded payloads (decode is untrusted).
function isInnerCirclePayload(p: any): p is InnerCircleJWT {
  return (
    p &&
    isNonEmptyString(p.id) &&
    isNonEmptyString(p.email) &&
    isNonEmptyString(p.name) &&
    isNonEmptyString(p.role) &&
    p.tier === "inner-circle" &&
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
  role: InnerCircleRole;
}): Promise<string> {
  if (!isNonEmptyString(user.id) || !isNonEmptyString(user.email) || !isNonEmptyString(user.name)) {
    throw new Error("[inner-circle/jwt] Invalid user fields for token creation.");
  }

  // Put canonical user claims into the payload.
  // Consider adding a "sub" claim equal to user.id too; it’s standard.
  const jwt = new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tier: "inner-circle" as const,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("90d");

  if (JWT_ISSUER) jwt.setIssuer(JWT_ISSUER);
  if (JWT_AUDIENCE) jwt.setAudience(JWT_AUDIENCE);

  // Recommended standard subject:
  jwt.setSubject(user.id);

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

    // Hard validation to prevent “shape spoofing”
    if (!isInnerCirclePayload(payload)) return null;

    return payload as InnerCircleJWT;
  } catch (error) {
    // Keep logs minimal; do not leak token details.
    console.error("[inner-circle/jwt] JWT verification failed:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Decode payload WITHOUT verifying signature.
 * Use only for UX hints / non-security decisions (e.g., showing name).
 * NEVER use decode-only for gating.
 */
export function decodeTokenUnverified(token: string): InnerCircleJWT | null {
  if (!isNonEmptyString(token)) return null;

  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    // ✅ FIX: Check that parts[1] exists before using it
    const payloadPart = parts[1];
    if (!payloadPart) return null;

    const json = base64UrlToString(payloadPart);
    const payload = safeJsonParse<any>(json);
    if (!payload || !isInnerCirclePayload(payload)) return null;

    return payload as InnerCircleJWT;
  } catch (error) {
    console.error("[inner-circle/jwt] Token decode failed:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Client-side decode helper.
 * Same caveat: UNVERIFIED.
 */
export function decodeClientToken(token: string): InnerCircleJWT | null {
  if (typeof window === "undefined") return null;
  return decodeTokenUnverified(token);
}

/**
 * Validate token expiry (decode-only).
 * For access control: prefer verifyInnerCircleToken, which enforces signature + exp.
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeTokenUnverified(token);
  if (!decoded) return true;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Development-only fake token (UNSIGNED / INVALID).
 * Only useful if your dev flow checks decode-only (not verification).
 * If your gate uses verifyInnerCircleToken (recommended), this token will not pass.
 */
export function createDevToken(): string {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("[inner-circle/jwt] Dev tokens only available in development.");
  }

  const payload: InnerCircleJWT = {
    id: "dev_001",
    email: "dev@abrahamoflondon.org",
    name: "Development User",
    role: "inner-circle",
    tier: "inner-circle",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
  };

  // JWT base64url encoding
  const headerObj = { alg: "HS256", typ: "JWT" };
  const headerJson = JSON.stringify(headerObj);
  const payloadJson = JSON.stringify(payload);

  const toB64Url = (s: string) => {
    // encode utf8 -> bytes
    const bytes = new TextEncoder().encode(s);

    // bytes -> base64
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

    // base64 -> base64url (no padding)
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  };

  const header = toB64Url(headerJson);
  const payload64 = toB64Url(payloadJson);

  // Not a real signature. This is intentionally invalid.
  const signature = "dev-signature";

  return `${header}.${payload64}.${signature}`;
}