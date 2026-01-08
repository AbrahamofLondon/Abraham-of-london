import crypto from "crypto";

const SECRET = process.env.DOWNLOAD_SECRET || process.env.JWT_SECRET || "dev-secret";

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function createDownloadToken(payload: { id: string; expSeconds?: number }) {
  const exp = Math.floor(Date.now() / 1000) + (payload.expSeconds ?? 15 * 60);
  const body = { id: payload.id, exp };
  const bodyStr = JSON.stringify(body);
  const sig = crypto.createHmac("sha256", SECRET).update(bodyStr).digest();
  return `${b64url(bodyStr)}.${b64url(sig)}`;
}

export function verifyDownloadToken(token: string) {
  try {
    const [bodyB64, sigB64] = token.split(".");
    if (!bodyB64 || !sigB64) return { ok: false as const, reason: "format" };

    const bodyStr = Buffer.from(bodyB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const sig = Buffer.from(sigB64.replace(/-/g, "+").replace(/_/g, "/"), "base64");

    const expected = crypto.createHmac("sha256", SECRET).update(bodyStr).digest();
    if (!crypto.timingSafeEqual(sig, expected)) return { ok: false as const, reason: "signature" };

    const body = JSON.parse(bodyStr) as { id: string; exp: number };
    if (!body.id || !body.exp) return { ok: false as const, reason: "payload" };
    if (body.exp < Math.floor(Date.now() / 1000)) return { ok: false as const, reason: "expired" };

    return { ok: true as const, id: body.id, exp: body.exp };
  } catch {
    return { ok: false as const, reason: "error" };
  }
}

export default { createDownloadToken, verifyDownloadToken };