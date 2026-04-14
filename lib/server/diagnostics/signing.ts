// server-only guard removed — Pages Router incompatible

// lib/server/diagnostics/signing.ts
import crypto from "crypto";

function secret() {
  const s = process.env.DIAGNOSTIC_HMAC_SECRET;
  if (!s) throw new Error("DIAGNOSTIC_HMAC_SECRET missing");
  return s;
}

export function sha256Hex(input: Buffer | string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function hmacHex(input: string): string {
  return crypto.createHmac("sha256", secret()).update(input).digest("hex");
}

export function signPayload<T extends object>(payload: T) {
  const body = JSON.stringify(payload);
  const sig = hmacHex(body);
  return { body, sig };
}

export function verifyPayload(body: string, sig: string) {
  const expected = hmacHex(body);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

