// lib/downloads/security.ts
import crypto from "crypto";

export type AccessTier =
  | "public"
  | "inner-circle"
  | "inner-circle-plus"
  | "inner-circle-elite"
  | "private";

export const TIER_ORDER: AccessTier[] = [
  "public",
  "inner-circle",
  "inner-circle-plus",
  "inner-circle-elite",
  "private",
];

export function tierAtLeast(user: AccessTier, required: AccessTier): boolean {
  return TIER_ORDER.indexOf(user) >= TIER_ORDER.indexOf(required);
}

export function getUserTierFromCookies(cookieHeader: string | undefined): AccessTier {
  const cookie = cookieHeader ?? "";

  // Back-compat: if innerCircleAccess exists, minimum is inner-circle
  const hasLegacy = cookie.includes("innerCircleAccess=");
  const tierMatch = cookie.match(/(?:^|;\s*)innerCircleTier=([^;]+)/i);
  const rawTier = tierMatch?.[1]?.trim() ?? "";

  const decoded = safeDecodeURIComponent(rawTier).toLowerCase();

  if (decoded === "inner-circle" || decoded === "inner-circle-plus" || decoded === "inner-circle-elite") {
    return decoded as AccessTier;
  }

  if (hasLegacy) return "inner-circle";
  return "public";
}

function safeDecodeURIComponent(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export type DownloadTokenPayload = {
  slug: string;
  exp: number; // unix seconds
  requiredTier: AccessTier;
  nonce: string;
};

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlToBuf(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(base64, "base64");
}

export function signDownloadToken(payload: DownloadTokenPayload, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encHeader = b64url(JSON.stringify(header));
  const encPayload = b64url(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;

  const sig = crypto.createHmac("sha256", secret).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

export function verifyDownloadToken(token: string, secret: string): DownloadTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encHeader, encPayload, encSig] = parts;
  const data = `${encHeader}.${encPayload}`;

  const expected = crypto.createHmac("sha256", secret).update(data).digest();
  const got = b64urlToBuf(encSig);

  // Timing-safe compare
  if (got.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(got, expected)) return null;

  let payload: DownloadTokenPayload;
  try {
    payload = JSON.parse(b64urlToBuf(encPayload).toString("utf8"));
  } catch {
    return null;
  }

  // Expiry check
  const now = Math.floor(Date.now() / 1000);
  if (!payload?.exp || payload.exp < now) return null;

  return payload;
}

export function newNonce(): string {
  return crypto.randomBytes(12).toString("hex");
}