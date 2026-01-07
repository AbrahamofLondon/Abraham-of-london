import crypto from "crypto";

// Constants for key generation
const KEY_CONFIG = {
  PREFIX: "IC-", // Inner Circle prefix
  BYTES_LENGTH: 16, // 128-bit key
  FORMAT: "hex" as const,
  SEPARATOR: "-", // Optional: IC-ABCD-EFGH-IJKL-MNOP
  CHECKSUM_LENGTH: 2, // Optional: Add checksum digits
};

// Enhanced access key generation
export function generateAccessKey() {
  // Generate cryptographically secure random bytes
  const buffer = crypto.randomBytes(KEY_CONFIG.BYTES_LENGTH);
  const rawHex = buffer.toString(KEY_CONFIG.FORMAT).toUpperCase();
  
  // Add a simple checksum (last 2 chars as hex of first byte)
  const checksumByte = buffer[0] & 0xFF; // First byte
  const checksum = checksumByte.toString(16).toUpperCase().padStart(2, '0');
  
  // Format with separators for readability (IC-XXXX-XXXX-XXXX-XXXX)
  const parts = [];
  for (let i = 0; i < rawHex.length; i += 4) {
    parts.push(rawHex.slice(i, i + 4));
  }
  const formattedKey = `${KEY_CONFIG.PREFIX}${parts.join(KEY_CONFIG.SEPARATOR)}-${checksum}`;
  
  // Create multiple identifiers for different use cases
  const fullKey = `${KEY_CONFIG.PREFIX}${rawHex}${checksum}`; // Full key without separators
  const suffix = parts[parts.length - 1] || rawHex.slice(-4); // Last 4 chars of raw
  const hash = crypto.createHash("sha256").update(fullKey).digest("hex"); // For storage
  
  return {
    // User-facing formatted key (with separators)
    formattedKey,
    
    // Machine-readable full key (without separators)
    fullKey,
    
    // Short identifier for display
    suffix,
    
    // Hash for secure storage (never store plain keys!)
    hash,
    
    // Checksum for validation
    checksum,
    
    // Raw components
    rawHex,
    
    // Generation timestamp
    timestamp: new Date().toISOString(),
  };
}

// Validate an access key
export function validateAccessKey(key: string): {
  isValid: boolean;
  formattedKey?: string;
  hash?: string;
  error?: string;
} {
  try {
    // Remove prefix and separators
    const cleanKey = key.replace(/^IC-/, '').replace(/-/g, '').toUpperCase();
    
    if (cleanKey.length !== 34) { // 32 hex chars + 2 checksum
      return { isValid: false, error: "Invalid key length" };
    }
    
    // Extract components
    const rawKey = cleanKey.slice(0, 32);
    const providedChecksum = cleanKey.slice(32);
    
    // Validate hex format
    if (!/^[0-9A-F]{32}$/.test(rawKey)) {
      return { isValid: false, error: "Invalid key format" };
    }
    
    // Validate checksum (simple first-byte checksum)
    const buffer = Buffer.from(rawKey, "hex");
    const calculatedChecksum = (buffer[0] & 0xFF).toString(16)
      .toUpperCase()
      .padStart(2, '0');
    
    if (calculatedChecksum !== providedChecksum) {
      return { isValid: false, error: "Checksum mismatch" };
    }
    
    // Format key for display
    const parts = [];
    for (let i = 0; i < rawKey.length; i += 4) {
      parts.push(rawKey.slice(i, i + 4));
    }
    const formattedKey = `${KEY_CONFIG.PREFIX}${parts.join(KEY_CONFIG.SEPARATOR)}-${providedChecksum}`;
    
    // Generate hash for lookup
    const hash = crypto.createHash("sha256").update(cleanKey).digest("hex");
    
    return {
      isValid: true,
      formattedKey,
      hash,
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}

// Normalize a key (strip formatting, convert to uppercase)
export function normalizeAccessKey(key: string): string {
  return key.replace(/^IC-/, '').replace(/-/g, '').toUpperCase();
}

// Generate a batch of access keys
export function generateAccessKeyBatch(count: number): Array<ReturnType<typeof generateAccessKey>> {
  const keys = [];
  for (let i = 0; i < count; i++) {
    keys.push(generateAccessKey());
  }
  return keys;
}

// Get email hash with salt for better security
export function getEmailHash(email: string, salt?: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  const saltedEmail = salt ? `${normalizedEmail}:${salt}` : normalizedEmail;
  
  // Use SHA-256 for email hashing (consider using a slow hash like bcrypt for extra security)
  const hash = crypto.createHash("sha256")
    .update(saltedEmail)
    .digest("hex");
  
  // Add pepper (additional secret) if available
  const pepper = process.env.HASH_PEPPER;
  if (pepper) {
    const pepperedHash = crypto.createHash("sha256")
      .update(hash + pepper)
      .digest("hex");
    return pepperedHash;
  }
  
  return hash;
}

// Generate a secure token for password reset, etc.
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

// Create a deterministic but unpredictable key for a user
export function generateUserAccessKey(userId: string, timestamp: number): string {
  const secret = process.env.KEY_GENERATION_SECRET || "fallback-secret-change-in-production";
  const data = `${userId}:${timestamp}:${secret}`;
  
  const hash = crypto.createHash("sha256")
    .update(data)
    .digest("hex")
    .toUpperCase()
    .slice(0, 32); // Take first 32 chars
  
  // Add checksum
  const buffer = Buffer.from(hash, "hex");
  const checksum = (buffer[0] & 0xFF).toString(16).toUpperCase().padStart(2, '0');
  
  return `${KEY_CONFIG.PREFIX}${hash}${checksum}`;
}

export default {
  generateAccessKey,
  generateAccessKeyBatch,
  validateAccessKey,
  normalizeAccessKey,
  getEmailHash,
  generateSecureToken,
  generateUserAccessKey,
};