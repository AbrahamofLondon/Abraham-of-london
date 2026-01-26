// lib/server/access.ts
import crypto from "crypto";
import { safeSlice } from "@/lib/utils/safe";


export type Tier = "public" | "inner-circle" | "private";

type TokenRecord = {
  token: string;
  tier: Tier;
  status?: "active" | "revoked" | "suspended";
  expiresAt?: string; // ISO
  note?: string;
};

const COOKIE_NAME = "aol_access";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sha256(data: string) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmac(data: string, secret: string) {
  return base64url(crypto.createHmac("sha256", secret).update(data).digest());
}

function timingSafeEq(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  const parts = header.split(";").map((p) => p.trim()).filter(Boolean);
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = safeSlice(p, 0, idx).trim();
    const v = safeSlice(p, idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

export function setCookieHeader(opts: {
  name: string;
  value: string;
  maxAgeSec?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
  path?: string;
}) {
  const {
    name,
    value,
    maxAgeSec = COOKIE_MAX_AGE_SEC,
    httpOnly = true,
    secure = true,
    sameSite = "Lax",
    path = "/",
  } = opts;

  const segments = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `Max-Age=${maxAgeSec}`,
    `SameSite=${sameSite}`,
  ];
  if (httpOnly) segments.push("HttpOnly");
  if (secure) segments.push("Secure");
  return segments.join("; ");
}

export function clearCookieHeader(name: string) {
  return `${name}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly; Secure`;
}

/**
 * We store: payload.signature
 * payload is base64url(JSON)
 * signature = hmac(payload, secret)
 */
export function signSession(payloadObj: any, secret: string) {
  const payload = base64url(JSON.stringify(payloadObj));
  const sig = hmac(payload, secret);
  return `${payload}.${sig}`;
}

export function verifySession(sessionValue: string, secret: string): any | null {
  const [payload, sig] = sessionValue.split(".");
  if (!payload || !sig) return null;
  const expected = hmac(payload, secret);
  if (!timingSafeEq(sig, expected)) return null;

  try {
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function readTokenStoreFromEnv(): TokenRecord[] {
  const raw = process.env.ACCESS_TOKENS_JSON || "[]";
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x: any) => ({
        token: String(x?.token || "").trim(),
        tier: (String(x?.tier || "public").trim() as Tier) || "public",
        status: (x?.status || "active") as any,
        expiresAt: x?.expiresAt ? String(x.expiresAt) : undefined,
        note: x?.note ? String(x.note) : undefined,
      }))
      .filter((x: TokenRecord) => !!x.token);
  } catch {
    return [];
  }
}

export async function validateAccessToken(rawToken: string): Promise<{
  ok: boolean;
  tier?: Tier;
  reason?: string;
  expiresAt?: string | null;
}> {
  const token = String(rawToken || "").trim();
  if (!token) return { ok: false, reason: "Missing token" };

  // ✅ Pluggable store (currently env JSON for fastest deploy)
  const store = readTokenStoreFromEnv();

  // Hash compare optional: if you later store only token hashes, swap this.
  const rec = store.find((r) => r.token === token);

  if (!rec) return { ok: false, reason: "Invalid token" };
  if (rec.status && rec.status !== "active") return { ok: false, reason: `Token ${rec.status}` };

  if (rec.expiresAt) {
    const t = new Date(rec.expiresAt).getTime();
    if (Number.isFinite(t) && Date.now() > t) return { ok: false, reason: "Token expired" };
  }

  return { ok: true, tier: rec.tier, expiresAt: rec.expiresAt || null };
}

export function requiredTierAllows(required: Tier, current: Tier) {
  const order: Tier[] = ["public", "inner-circle", "private"];
  return order.indexOf(current) >= order.indexOf(required);
}

export function getCookieName() {
  return COOKIE_NAME;
}

export function getCookieSecret() {
  const secret = process.env.ACCESS_COOKIE_SECRET || "";
  if (!secret || secret.length < 16) {
    throw new Error("ACCESS_COOKIE_SECRET missing/too short");
  }
  return secret;
}

export function makeSessionValue(params: { tier: Tier; tokenHash: string }) {
  return signSession(
    {
      v: 1,
      tier: params.tier,
      th: params.tokenHash,
      iat: Date.now(),
    },
    getCookieSecret()
  );
}

export function readSessionFromReq(req: { headers?: any }) {
  const cookies = parseCookies(req.headers?.cookie);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;
  return verifySession(raw, getCookieSecret());
}

export function tokenHash(token: string) {
  // store only a hash in cookie (never the raw token)
  return sha256(`aol:${token}`);
}

export async function getAccessFromRequest(req: { headers?: any }): Promise<{
  ok: boolean;
  tier: Tier;
}> {
  const session = readSessionFromReq(req);
  if (!session?.tier || !session?.th) return { ok: false, tier: "public" };

  // If you later add server-side session store/revocation, check it here.
  // For now, session validity is signature-based.

  return { ok: true, tier: session.tier as Tier };
}