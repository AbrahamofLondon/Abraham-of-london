// lib/security/download-token.ts
import crypto from "crypto";

const SECRET = process.env.DOWNLOAD_SECRET || process.env.JWT_SECRET || "dev-secret";

/**
 * Base64url encode (RFC 4648 §5)
 */
function b64urlEncode(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Base64url decode (handles missing padding)
 */
function b64urlDecodeToBuffer(b64url: string): Buffer {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64");
}

export type DownloadTokenPayload = {
  id: string;
  expSeconds?: number; // default 15 mins
};

export type VerifyResult =
  | { ok: true; id: string; exp: number }
  | { ok: false; reason: "format" | "signature" | "payload" | "expired" | "error" };

export function createDownloadToken(payload: DownloadTokenPayload): string {
  const exp = Math.floor(Date.now() / 1000) + (payload.expSeconds ?? 15 * 60);
  const body = { id: String(payload.id || "").trim(), exp };

  const bodyStr = JSON.stringify(body);
  const sig = crypto.createHmac("sha256", SECRET).update(bodyStr).digest();

  return `${b64urlEncode(bodyStr)}.${b64urlEncode(sig)}`;
}

export function verifyDownloadToken(token: string): VerifyResult {
  try {
    const [bodyB64, sigB64] = String(token || "").split(".");
    if (!bodyB64 || !sigB64) return { ok: false, reason: "format" };

    const bodyStr = b64urlDecodeToBuffer(bodyB64).toString("utf8");
    const sig = b64urlDecodeToBuffer(sigB64);

    const expected = crypto.createHmac("sha256", SECRET).update(bodyStr).digest();

    // timingSafeEqual requires equal length
    if (sig.length !== expected.length) return { ok: false, reason: "signature" };
    if (!crypto.timingSafeEqual(sig, expected)) return { ok: false, reason: "signature" };

    const body = JSON.parse(bodyStr) as { id?: unknown; exp?: unknown };
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const exp = typeof body.exp === "number" ? body.exp : Number(body.exp);

    if (!id || !Number.isFinite(exp)) return { ok: false, reason: "payload" };
    if (exp < Math.floor(Date.now() / 1000)) return { ok: false, reason: "expired" };

    return { ok: true, id, exp };
  } catch {
    return { ok: false, reason: "error" };
  }
}

// ✅ Single default export (no redeclare)
const downloadTokenApi = {
  createDownloadToken,
  verifyDownloadToken,
};

export default downloadTokenApi;