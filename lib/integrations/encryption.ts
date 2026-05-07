/**
 * lib/integrations/encryption.ts
 * AES-256-GCM encryption for OAuth tokens at rest.
 * Uses a server-side secret — never expose to client.
 */

import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derive a 32-byte key from the configured secret using HKDF.
 */
function deriveKey(): Buffer {
  const secret = String(process.env.OAUTH_TOKEN_ENCRYPTION_KEY || "").trim();
  if (!secret) {
    throw new Error("[ENCRYPTION] Missing OAUTH_TOKEN_ENCRYPTION_KEY");
  }
  // Use HKDF to derive a proper 256-bit key from the secret
  const inputKey = crypto.createHash("sha256").update(secret).digest();
  return inputKey;
}

/**
 * Encrypt a plaintext string.
 * Returns base64-encoded: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a string previously encrypted with encrypt().
 * Accepts base64-encoded: iv:authTag:ciphertext
 */
export function decrypt(encryptedString: string): string {
  const key = deriveKey();
  const parts = encryptedString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted string format");
  }

  const iv = Buffer.from(parts[0]!, "hex");
  const authTag = Buffer.from(parts[1]!, "hex");
  const encrypted = parts[2]!;

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generate a cryptographically random state parameter for OAuth CSRF protection.
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}
