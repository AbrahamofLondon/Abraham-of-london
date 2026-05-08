// lib/security.ts — INSTITUTIONAL CRYPTOGRAPHY CORE [V4.1.0]
import crypto from 'crypto';

/** * Institutional Design Specifications
 * - Algorithm: AES-256-GCM
 * - Key Management: Fixed 32-byte Buffer allocation
 * - IV Length: 16 bytes
 */
const ALGORITHM = 'aes-256-gcm';

/** * Institutional Requirement: Ensure the key is exactly 32 bytes.
 * We use Buffer.alloc to guarantee length regardless of the env string.
 */
const rawEncryptionKey = String(process.env.ENCRYPTION_KEY || "").trim();
// Defer the missing-key check to runtime, not module load time.
// During build (e.g. Netlify page data collection), ENCRYPTION_KEY may not be set.
const ENCRYPTION_KEY = rawEncryptionKey
  ? Buffer.alloc(32, rawEncryptionKey)
  : Buffer.alloc(32);
const IV_LENGTH = 16;

/**
 * Hashes emails for secure indexing. 
 * Essential for comparing credentials without storing raw PII.
 */
export function hashEmail(email: string): string {
  return crypto
    .createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
}

/**
 * Encrypts institutional data for private storage.
 * Returns the hex-encoded content, IV, and GCM Authentication Tag.
 */
export function encryptDocument(text: string) {
  if (!rawEncryptionKey) {
    throw new Error("[security] ENCRYPTION_KEY is not configured. Cannot encrypt at runtime.");
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    content: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag
  };
}

/**
 * Decrypts data for authorized onboarding sessions.
 * Reconstructs the cipher state using the stored IV and Auth Tag.
 */
export function decryptDocument(encryptedText: string, iv: string, authTag: string) {
  if (!rawEncryptionKey) {
    throw new Error("[security] ENCRYPTION_KEY is not configured. Cannot decrypt at runtime.");
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    ENCRYPTION_KEY, 
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
