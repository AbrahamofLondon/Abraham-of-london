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
const ENCRYPTION_KEY = Buffer.alloc(32, process.env.ENCRYPTION_KEY || 'default_institutional_key_32_chars'); 
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