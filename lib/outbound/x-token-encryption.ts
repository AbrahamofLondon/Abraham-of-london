/**
 * lib/outbound/x-token-encryption.ts
 *
 * AES-256-GCM encryption for X (Twitter) OAuth tokens.
 * Tokens are never stored in plaintext or returned to the client.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getXTokenEncryptionSecret(): string {
  const secret = String(
    process.env.X_TOKEN_ENCRYPTION_KEY ||
    process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY || // shared fallback in dev
    ""
  ).trim();
  if (!secret) {
    throw new Error("[X_TOKEN_ENCRYPTION] Missing X_TOKEN_ENCRYPTION_KEY");
  }
  return secret;
}

function deriveKey(): Buffer {
  return crypto
    .createHash("sha256")
    .update(getXTokenEncryptionSecret())
    .digest();
}

export function encryptXToken(plaintext: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptXToken(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("[X_TOKEN_ENCRYPTION] Invalid ciphertext format");
  }
  const [ivHex, tagHex, encHex] = parts;
  const key = deriveKey();
  const iv = Buffer.from(ivHex!, "hex");
  const tag = Buffer.from(tagHex!, "hex");
  const enc = Buffer.from(encHex!, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
