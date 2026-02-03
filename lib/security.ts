/* ============================================================================
 * ENTERPRISE SECURITY UTILITIES [V5.1.1 - SCOPE-HARDENED]
 * ============================================================================ */

import crypto from "crypto";
import { SignJWT } from "jose";

/**
 * 🔒 Encrypt sensitive content (AES-256-GCM)
 */
export function encryptDocument(text: string): { content: string; iv: string; authTag: string } {
  // LOOKUP AT RUNTIME - This fixes the "Missing" error in scripts
  const keyStr = process.env.ENCRYPTION_KEY;
  if (!keyStr) throw new Error('ENCRYPTION_KEY is missing from process.env');
  
  const key = Buffer.from(keyStr, 'base64');
  const iv = crypto.randomBytes(12); 
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    content: encrypted,
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex')
  };
}

/**
 * 🔓 Decrypt sensitive content
 */
export function decryptDocument(encryptedData: string, iv: string, authTag: string): string {
  const keyStr = process.env.ENCRYPTION_KEY;
  if (!keyStr) throw new Error('ENCRYPTION_KEY is missing from process.env');
  
  const key = Buffer.from(keyStr, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * 👤 Identity Obfuscation (SHA-256)
 */
export function hashEmail(email: string): string {
  return crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex");
}