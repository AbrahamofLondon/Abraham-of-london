// lib/premium/download-token.ts
/**
 * Premium content download token system
 */

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
      expiresIn?: number; // milliseconds
      maxDownloads?: number;
      metadata?: Record<string, any>;
    } = {}
  ): DownloadToken {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + (options.expiresIn || 3600000)); // 1 hour default
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
    
    if (!storedToken) {
      return false;
    }
    
    if (storedToken.usedCount >= storedToken.maxDownloads) {
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
    return Array.from(this.tokens.values())
      .filter(token => token.userId === userId);
  }

  getTokensByContent(contentId: string): DownloadToken[] {
    return Array.from(this.tokens.values())
      .filter(token => token.contentId === contentId);
  }

  private generateSecureToken(): string {
    return 'dl_' + 
      Date.now().toString(36) + 
      Math.random().toString(36).substr(2, 9) +
      Buffer.from(crypto.randomUUID()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    
    // Only cleanup every 5 minutes
    if (now - this.tokenExpiryCheck < 300000) {
      return;
    }
    
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

export function validateDownloadToken(
  token: string, 
  contentId?: string
): TokenValidationResult {
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

export default downloadTokenManager;