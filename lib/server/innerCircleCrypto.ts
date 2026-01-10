import crypto from "crypto";

/**
 * Normalise email before hashing - trim + lowercase
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Hash email with SHA-256 (for lookups, not reversible).
 */
export function hashEmail(email: string): string {
  const normalized = normalizeEmail(email);
  return crypto.createHash("sha256").update(normalized, "utf8").digest("hex");
}

/**
 * Hash an Inner Circle key with SHA-256.
 */
export function hashKey(key: string): string {
  const normalized = normalizeKey(key);
  return crypto.createHash("sha256").update(normalized, "utf8").digest("hex");
}

/**
 * Generate a high-entropy, human-readable display key.
 *
 * Example:  "A3F9-7C2B-1D8E-9F40"
 */
export function generateDisplayKey(): string {
  // 16 bytes -> 32 hex chars -> 8 groups of 4 for readability
  const raw = crypto.randomBytes(16).toString("hex").toUpperCase(); // e.g. "A3F97C2B1D8E9F40"
  const groups: string[] = [];

  for (let i = 0; i < raw.length; i += 4) {
    groups.push(raw.slice(i, i + 4));
  }

  return groups.join("-");
}

/**
 * Validate Inner Circle key format
 */
export function isValidKeyFormat(key: string): boolean {
  const keyRegex = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
  return keyRegex.test(key);
}

/**
 * Normalize key by removing hyphens and converting to uppercase
 */
export function normalizeKey(key: string): string {
  return key.replace(/-/g, "").toUpperCase();
}

/**
 * Get email hash prefix for safe display (first 8 chars)
 */
export function getEmailHashPrefix(email: string): string {
  return hashEmail(email).substring(0, 8);
}

/**
 * Get key suffix for safe display (last 4 chars)
 */
export function getKeySuffix(key: string): string {
  const normalized = normalizeKey(key);
  return normalized.slice(-4);
}

/**
 * Generate a verified unique display key
 */
export function generateVerifiedDisplayKey(
  existingHashes: Set<string> = new Set(),
  maxAttempts: number = 10
): string {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const key = generateDisplayKey();
    const keyHash = hashKey(key);

    if (!existingHashes.has(keyHash)) {
      return key;
    }
  }

  throw new Error("Failed to generate unique key after maximum attempts");
}

/**
 * Constant-time comparison to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  try {
    // FIX: Explicitly cast Buffer to Uint8Array to satisfy strict TypeScript definitions
    return crypto.timingSafeEqual(
      Buffer.from(a, "utf8") as unknown as Uint8Array,
      Buffer.from(b, "utf8") as unknown as Uint8Array
    );
  } catch {
    return false;
  }
}


