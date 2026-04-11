// lib/constitution/sovereign-data.ts
// ─── SOVEREIGN DATA SEPARATION & ENCRYPTION ───────────────────────────────────

import crypto from 'crypto';

export interface SovereignDataContainer {
  id: string;
  campaignId: string;
  encryptedData: string;
  encryptionKeyHash: string;
  iv: string;
  authTag: string;
  accessLog: AccessLogEntry[];
  createdAt: string;
  accessedAt: string;
}

export interface AccessLogEntry {
  userId: string;
  timestamp: string;
  action: 'READ' | 'WRITE' | 'DELETE';
  reason: string;
  authoritySignature: string;
}

/**
 * Sovereign Data Encryption - Law 5
 * Campaign data must be cryptographically isolated.
 */
export class SovereignDataEncryption {
  private static algorithm = 'aes-256-gcm';

  static encrypt(data: unknown, campaignId: string, userKey: string): SovereignDataContainer {
    // Derive campaign-specific key from user key
    const campaignKey = crypto
      .createHash('sha256')
      .update(`${userKey}:${campaignId}`)
      .digest();

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, campaignKey, iv) as crypto.CipherGCM;

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      id: crypto.randomUUID(),
      campaignId,
      encryptedData: encrypted,
      encryptionKeyHash: crypto.createHash('sha256').update(campaignKey).digest('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      accessLog: [],
      createdAt: new Date().toISOString(),
      accessedAt: new Date().toISOString(),
    };
  }

  static decrypt(container: SovereignDataContainer, userKey: string): unknown {
    const campaignKey = crypto
      .createHash('sha256')
      .update(`${userKey}:${container.campaignId}`)
      .digest();

    const iv = Buffer.from(container.iv, 'base64');
    const authTag = Buffer.from(container.authTag, 'base64');
    const decipher = crypto.createDecipheriv(this.algorithm, campaignKey, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(container.encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  static logAccess(
    container: SovereignDataContainer,
    userId: string,
    action: AccessLogEntry['action'],
    reason: string,
    authoritySignature: string
  ): SovereignDataContainer {
    return {
      ...container,
      accessLog: [
        ...container.accessLog,
        {
          userId,
          timestamp: new Date().toISOString(),
          action,
          reason,
          authoritySignature,
        },
      ],
      accessedAt: new Date().toISOString(),
    };
  }
}