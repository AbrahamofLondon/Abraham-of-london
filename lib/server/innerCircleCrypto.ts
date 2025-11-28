// lib/server/innerCircleCrypto.ts
import crypto from "node:crypto";

const HASH_SECRET = process.env.INNER_CIRCLE_HASH_SECRET;

/**
 * Normalise email for deterministic hashing
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function ensureHashSecret(): string {
  if (!HASH_SECRET) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[InnerCircle] INNER_CIRCLE_HASH_SECRET is not set. Refusing to operate in production.",
      );
    }
    // Dev fallback: still deterministic but less secure.
    // You should still set the real secret locally.
    return "DEV-INNER-CIRCLE-HASH-SECRET";
  }
  return HASH_SECRET;
}

/**
 * HMAC-SHA256 with a secret so hashes are not reversible
 * even if someone dumps the DB.
 */
function hmacSha256(value: string): string {
  const secret = ensureHashSecret();
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function hashEmail(email: string): string {
  const normalized = normalizeEmail(email);
  return hmacSha256(`email:${normalized}`);
}

export function normalizeKey(key: string): string {
  return key.trim().toUpperCase();
}

export function hashKey(key: string): string {
  const normalized = normalizeKey(key);
  return hmacSha256(`key:${normalized}`);
}

/**
 * Generate a user-facing access key, e.g. "IC-7F3K-9L2P-X8Q4"
 * using only unambiguous chars.
 */
export function generateDisplayKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0,1,O,I
  const bytes = crypto.randomBytes(12);
  let raw = "";

  for (let i = 0; i < 12; i += 1) {
    const idx = bytes[i] % alphabet.length;
    raw += alphabet[idx];
  }

  const part1 = raw.slice(0, 4);
  const part2 = raw.slice(4, 8);
  const part3 = raw.slice(8, 12);

  return `IC-${part1}-${part2}-${part3}`;
}