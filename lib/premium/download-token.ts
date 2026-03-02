/**
 * Premium content download token system
 * ABRAHAM OF LONDON: V2.7 Institutional Security
 */

// Import crypto properly with edge runtime support
let crypto: any;

if (typeof window === 'undefined') {
  try {
    crypto = require('crypto');
  } catch (error) {
    crypto = {
      randomBytes: (size: number) => {
        const bytes = new Uint8Array(size);
        if (typeof (global as any).crypto !== 'undefined' && (global as any).crypto.getRandomValues) {
          (global as any).crypto.getRandomValues(bytes);
        } else {
          for (let i = 0; i < size; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
          }
        }
        return bytes;
      }
    };
  }
} else {
  crypto = {
    randomBytes: (size: number) => {
      const bytes = new Uint8Array(size);
      window.crypto.getRandomValues(bytes);
      return bytes;
    }
  };
}

// 🏛️ [FIX]: These are already exported via 'export interface'
export interface DownloadToken {
  token: string;
  contentId: string;
  expiresAt: Date;
  maxDownloads: number;
  usedCount: number;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface TokenValidationResult {
  valid: boolean;
  reason?: string;
  token?: DownloadToken;
  remainingDownloads?: number;
}

class DownloadTokenManager {
  private tokens = new Map<string, DownloadToken>();
  private tokenExpiryCheck = Date.now();

  generateToken(
    contentId: string,
    options: {
      userId?: string;
      expiresIn?: number; 
      maxDownloads?: number;
      metadata?: Record<string, any>;
    } = {}
  ): DownloadToken {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + (options.expiresIn || 3600000));
    const maxDownloads = options.maxDownloads || 1;
    
    const downloadToken: DownloadToken = {
      token,
      contentId,
      expiresAt,
      maxDownloads,
      usedCount: 0,
      userId: options.userId,
      metadata: options.metadata
    };
    
    this.tokens.set(token, downloadToken);
    this.cleanupExpiredTokens();
    
    return downloadToken;
  }

  validateToken(token: string, contentId?: string): TokenValidationResult {
    this.cleanupExpiredTokens();
    
    const storedToken = this.tokens.get(token);
    
    if (!storedToken) {
      return { valid: false, reason: 'Token not found' };
    }
    
    if (contentId && storedToken.contentId !== contentId) {
      return { valid: false, reason: 'Token does not match content' };
    }
    
    if (storedToken.expiresAt < new Date()) {
      this.tokens.delete(token);
      return { valid: false, reason: 'Token expired' };
    }
    
    if (storedToken.usedCount >= storedToken.maxDownloads) {
      return { 
        valid: false, 
        reason: 'Maximum downloads exceeded',
        token: storedToken,
        remainingDownloads: 0
      };
    }
    
    return {
      valid: true,
      token: storedToken,
      remainingDownloads: storedToken.maxDownloads - storedToken.usedCount
    };
  }

  incrementUsage(token: string): boolean {
    const storedToken = this.tokens.get(token);
    if (!storedToken || storedToken.usedCount >= storedToken.maxDownloads) {
      return false;
    }
    storedToken.usedCount += 1;
    this.tokens.set(token, storedToken);
    return true;
  }

  revokeToken(token: string): boolean {
    return this.tokens.delete(token);
  }

  getTokensByUser(userId: string): DownloadToken[] {
    return Array.from(this.tokens.values()).filter(t => t.userId === userId);
  }

  getTokensByContent(contentId: string): DownloadToken[] {
    return Array.from(this.tokens.values()).filter(t => t.contentId === contentId);
  }

  private generateSecureToken(): string {
    try {
      const randomBytes = crypto.randomBytes(32);
      const b64 = (randomBytes instanceof Uint8Array) 
        ? Buffer.from(randomBytes).toString('base64')
        : randomBytes.toString('base64');
        
      return 'dl_' + 
        Date.now().toString(36) + 
        b64.replace(/[^a-zA-Z0-9]/g, '').substr(0, 24);
    } catch (error) {
      return 'dl_fallback_' + Math.random().toString(36).substr(2, 15);
    }
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    if (now - this.tokenExpiryCheck < 300000) return;
    
    for (const [token, tokenData] of this.tokens.entries()) {
      if (tokenData.expiresAt < new Date()) {
        this.tokens.delete(token);
      }
    }
    this.tokenExpiryCheck = now;
  }
}

// Singleton instance
const downloadTokenManager = new DownloadTokenManager();

// Export public API
export function generateDownloadToken(
  contentId: string,
  options?: {
    userId?: string;
    expiresIn?: number;
    maxDownloads?: number;
    metadata?: Record<string, any>;
  }
): DownloadToken {
  return downloadTokenManager.generateToken(contentId, options);
}

export function validateDownloadToken(token: string, contentId?: string): TokenValidationResult {
  return downloadTokenManager.validateToken(token, contentId);
}

export function incrementTokenUsage(token: string): boolean {
  return downloadTokenManager.incrementUsage(token);
}

export function revokeDownloadToken(token: string): boolean {
  return downloadTokenManager.revokeToken(token);
}

export function getUserDownloadTokens(userId: string): DownloadToken[] {
  return downloadTokenManager.getTokensByUser(userId);
}

export function getContentDownloadTokens(contentId: string): DownloadToken[] {
  return downloadTokenManager.getTokensByContent(contentId);
}

// Compatibility Aliases
export const createDownloadToken = generateDownloadToken;
export const verifyDownloadToken = validateDownloadToken;

// 🏛️ [INSTITUTIONAL EXPORTS]
export default downloadTokenManager;