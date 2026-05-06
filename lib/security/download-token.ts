// lib/security/download-token.ts
import crypto from "crypto";

function getDownloadTokenSecret(): string {
  const secret =
    process.env.DOWNLOAD_SECRET?.trim() ||
    process.env.DOWNLOAD_TOKEN_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "[DOWNLOAD_TOKEN] Missing DOWNLOAD_SECRET or DOWNLOAD_TOKEN_SECRET",
    );
  }

  return secret;
}

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
  purpose: "download";
  subject: string;
  iat: number;
  exp: number;
  expSeconds?: number; // default 15 mins
};

export type VerifyResult =
  | { ok: true; subject: string; purpose: "download"; exp: number; iat: number }
  | { ok: false; reason: "format" | "signature" | "payload" | "expired" | "error" };

export function createDownloadToken(payload: DownloadTokenPayload): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const exp = issuedAt + (payload.expSeconds ?? 15 * 60);
  const body = {
    purpose: "download",
    subject: String(payload.subject || "").trim(),
    iat: issuedAt,
    exp,
  };

  const bodyStr = JSON.stringify(body);
  const sig = crypto
    .createHmac("sha256", getDownloadTokenSecret())
    .update(bodyStr)
    .digest();

  return `${b64urlEncode(bodyStr)}.${b64urlEncode(sig)}`;
}

export function verifyDownloadToken(token: string): VerifyResult {
  try {
    const [bodyB64, sigB64] = String(token || "").split(".");
    if (!bodyB64 || !sigB64) return { ok: false, reason: "format" };

    const bodyStr = b64urlDecodeToBuffer(bodyB64).toString("utf8");
    const sig = b64urlDecodeToBuffer(sigB64);

    const expected = crypto
      .createHmac("sha256", getDownloadTokenSecret())
      .update(bodyStr)
      .digest();

    // timingSafeEqual requires equal length
    if (sig.length !== expected.length) return { ok: false, reason: "signature" };
    if (!crypto.timingSafeEqual(sig, expected)) return { ok: false, reason: "signature" };

    const body = JSON.parse(bodyStr) as { purpose?: unknown; subject?: unknown; exp?: unknown; iat?: unknown };
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const iat = typeof body.iat === "number" ? body.iat : Number(body.iat);
    const exp = typeof body.exp === "number" ? body.exp : Number(body.exp);

    if (body.purpose !== "download" || !subject || !Number.isFinite(exp) || !Number.isFinite(iat)) {
      return { ok: false, reason: "payload" };
    }
    if (exp < Math.floor(Date.now() / 1000)) return { ok: false, reason: "expired" };

    return { ok: true, subject, purpose: "download", exp, iat };
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
