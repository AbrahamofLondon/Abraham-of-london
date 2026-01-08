/* eslint-disable no-console */
/**
 * Inner Circle access control and authorization.
 * Handles membership verification, access levels, and premium content access.
 */

import innerCircleStore from './inner-circle-store';
import type {
  InnerCircleMember,
  VerifyInnerCircleKeyResult,
  IssuedKey
} from './inner-circle-store';
import { getRedis } from '@/lib/redis';

export interface AccessLevel {
  level: 'basic' | 'premium' | 'vip' | 'admin';
  permissions: string[];
  description: string;
}

export interface AccessCheckResult {
  granted: boolean;
  member?: InnerCircleMember;
  key?: IssuedKey;
  accessLevel?: AccessLevel;
  reason?: string;
  remainingUses?: number;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface PremiumContentAccess {
  contentId: string;
  contentType: 'article' | 'video' | 'course' | 'download';
  requiredLevel: AccessLevel['level'];
  granted: boolean;
  member?: InnerCircleMember;
  accessGrantedAt?: Date;
  expiresAt?: Date;
}

export interface BatchAccessCheck {
  items: string[];
  memberKey: string;
  result: Record<string, boolean>;
  summary: {
    total: number;
    granted: number;
    denied: number;
    requiredLevels: Record<string, AccessLevel['level']>;
  };
}

export interface AccessAuditLog {
  timestamp: Date;
  memberEmail: string;
  action: string;
  resource?: string;
  granted: boolean;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface CachedAccessCheck {
  result: AccessCheckResult;
  cachedAt: Date;
  expiresAt: Date;
}

class InnerCircleAccessManager {
  private static instance: InnerCircleAccessManager;
  private accessLevels: Map<AccessLevel['level'], AccessLevel>;
  private memoryAuditLog: AccessAuditLog[] = [];
  private maxMemoryAuditLogSize = 1000;
  private auditLogRedisPrefix = 'ic:audit:';
  private accessCacheRedisPrefix = 'ic:accesscache:';
  private cacheTtl = 60000; // 1 minute cache for access checks
  private redisAvailable = false;

  private constructor() {
    // Define access levels
    this.accessLevels = new Map([
      ['basic', {
        level: 'basic',
        permissions: ['access_basic_content', 'view_preview'],
        description: 'Basic member access'
      }],
      ['premium', {
        level: 'premium',
        permissions: [
          'access_basic_content',
          'access_premium_content',
          'download_resources',
          'early_access'
        ],
        description: 'Premium member access'
      }],
      ['vip', {
        level: 'vip',
        permissions: [
          'access_basic_content',
          'access_premium_content',
          'access_vip_content',
          'download_resources',
          'early_access',
          'priority_support',
          'exclusive_events'
        ],
        description: 'VIP member access'
      }],
      ['admin', {
        level: 'admin',
        permissions: [
          'access_all_content',
          'manage_members',
          'view_analytics',
          'system_config'
        ],
        description: 'Administrator access'
      }]
    ]);

    // Check Redis availability
    this.checkRedis();
  }

  static getInstance(): InnerCircleAccessManager {
    if (!InnerCircleAccessManager.instance) {
      InnerCircleAccessManager.instance = new InnerCircleAccessManager();
    }
    return InnerCircleAccessManager.instance;
  }

  private async checkRedis(): Promise<void> {
    try {
      const redis = getRedis();
      if (redis) {
        // Test Redis connection
        await redis.ping();
        this.redisAvailable = true;
        console.log('[InnerCircleAccess] Redis audit logging enabled');
      }
    } catch (error) {
      console.warn('[InnerCircleAccess] Redis not available, using memory audit log');
      this.redisAvailable = false;
    }
  }

  private async logAudit(entry: Omit<AccessAuditLog, 'timestamp'>): Promise<void> {
    const auditEntry: AccessAuditLog = {
      timestamp: new Date(),
      ...entry
    };

    // Always keep in memory for immediate access
    this.memoryAuditLog.unshift(auditEntry);
    
    // Keep memory log at manageable size
    if (this.memoryAuditLog.length > this.maxMemoryAuditLogSize) {
      this.memoryAuditLog = this.memoryAuditLog.slice(0, this.maxMemoryAuditLogSize);
    }

    // Also store in Redis for persistence if available
    if (this.redisAvailable) {
      try {
        const redis = getRedis();
        if (redis) {
          const auditKey = `${this.auditLogRedisPrefix}${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
          await redis.setex(
            auditKey,
            86400 * 7, // Keep for 7 days
            JSON.stringify(auditEntry)
          );

          // Also add to time-sorted set for time-based queries
          const sortedSetKey = `${this.auditLogRedisPrefix}sorted`;
          await redis.zadd(
            sortedSetKey,
            auditEntry.timestamp.getTime(),
            auditKey
          );

          // Trim old entries (keep last 10,000)
          await redis.zremrangebyrank(sortedSetKey, 0, -10001);
        }
      } catch (error) {
        console.error('[InnerCircleAccess] Redis audit log error:', error);
        this.redisAvailable = false;
      }
    }
  }

  private async getCachedAccess(key: string, resource?: string): Promise<CachedAccessCheck | null> {
    if (!this.redisAvailable) return null;

    try {
      const redis = getRedis();
      if (!redis) return null;

      const cacheKey = this.getCacheKey(key, resource);
      const cached = await redis.get(cacheKey);
      
      if (!cached) return null;
      
      const parsed: CachedAccessCheck = JSON.parse(cached);
      
      // Check if cache is still valid
      if (new Date(parsed.expiresAt) > new Date()) {
        return parsed;
      }
      
      // Cache expired, remove it
      await redis.del(cacheKey);
      return null;
      
    } catch (error) {
      console.error('[InnerCircleAccess] Cache read error:', error);
      return null;
    }
  }

  private async setCachedAccess(
    key: string, 
    resource: string | undefined, 
    result: AccessCheckResult
  ): Promise<void> {
    if (!this.redisAvailable || !result.granted) return;

    try {
      const redis = getRedis();
      if (!redis) return;

      const cacheEntry: CachedAccessCheck = {
        result,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + this.cacheTtl)
      };

      const cacheKey = this.getCacheKey(key, resource);
      await redis.setex(
        cacheKey,
        Math.ceil(this.cacheTtl / 1000),
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      console.error('[InnerCircleAccess] Cache write error:', error);
    }
  }

  private getCacheKey(key: string, resource?: string): string {
    return resource 
      ? `${this.accessCacheRedisPrefix}${key}:${resource}`
      : `${this.accessCacheRedisPrefix}${key}`;
  }

  async verifyAccess(
    key: string,
    resource?: string,
    context?: {
      ip?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
      bypassCache?: boolean;
    }
  ): Promise<AccessCheckResult> {
    // Check cache first (if not bypassing)
    if (!context?.bypassCache) {
      const cached = await this.getCachedAccess(key, resource);
      if (cached) {
        // Log cached access
        await this.logAudit({
          memberEmail: cached.result.member?.email || 'cached',
          action: 'access_granted_cached',
          resource,
          granted: cached.result.granted,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
          metadata: {
            ...cached.result.metadata,
            cached: true,
            cachedAt: cached.cachedAt,
            ...context?.metadata
          }
        });

        return cached.result;
      }
    }

    try {
      // Verify the key
      const verification = await innerCircleStore.verifyInnerCircleKey(key);
      
      if (!verification.valid) {
        await this.logAudit({
          memberEmail: 'unknown',
          action: 'access_denied',
          resource,
          granted: false,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
          metadata: {
            reason: 'invalid_key',
            verificationReason: verification.reason,
            ...context?.metadata
          }
        });

        return {
          granted: false,
          reason: verification.reason || 'Invalid key'
        };
      }

      const { member, issuedKey } = verification;
      
      if (!member || !issuedKey) {
        await this.logAudit({
          memberEmail: 'unknown',
          action: 'access_denied',
          resource,
          granted: false,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
          metadata: {
            reason: 'missing_data',
            ...context?.metadata
          }
        });

        return {
          granted: false,
          reason: 'Member data not found'
        };
      }

      // Check if key is expired
      if (issuedKey.expiresAt && new Date() > issuedKey.expiresAt) {
        await this.logAudit({
          memberEmail: member.email,
          action: 'access_denied',
          resource,
          granted: false,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
          metadata: {
            reason: 'key_expired',
            expiresAt: issuedKey.expiresAt,
            ...context?.metadata
          }
        });

        return {
          granted: false,
          reason: 'Key has expired',
          member,
          key: issuedKey,
          expiresAt: issuedKey.expiresAt
        };
      }

      // Check remaining uses
      if (issuedKey.maxUses && issuedKey.usedCount >= issuedKey.maxUses) {
        await this.logAudit({
          memberEmail: member.email,
          action: 'access_denied',
          resource,
          granted: false,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
          metadata: {
            reason: 'max_uses_exceeded',
            usedCount: issuedKey.usedCount,
            maxUses: issuedKey.maxUses,
            ...context?.metadata
          }
        });

        return {
          granted: false,
          reason: 'Maximum uses exceeded',
          member,
          key: issuedKey,
          remainingUses: 0
        };
      }

      // Determine access level
      const accessLevel = this.determineAccessLevel(member);
      
      // Check if member is suspended
      if (member.suspended) {
        await this.logAudit({
          memberEmail: member.email,
          action: 'access_denied',
          resource,
          granted: false,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
          metadata: {
            reason: 'member_suspended',
            accessLevel: accessLevel.level,
            ...context?.metadata
          }
        });

        return {
          granted: false,
          reason: 'Member account is suspended',
          member,
          key: issuedKey,
          accessLevel
        };
      }

      // Calculate remaining uses
      const remainingUses = issuedKey.maxUses 
        ? Math.max(0, issuedKey.maxUses - issuedKey.usedCount)
        : undefined;

      const result: AccessCheckResult = {
        granted: true,
        member,
        key: issuedKey,
        accessLevel,
        remainingUses,
        expiresAt: issuedKey.expiresAt,
        metadata: {
          permissions: accessLevel.permissions,
          tier: member.tier
        }
      };

      // Log successful access
      await this.logAudit({
        memberEmail: member.email,
        action: 'access_granted',
        resource,
        granted: true,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        metadata: {
          accessLevel: accessLevel.level,
          remainingUses,
          expiresAt: issuedKey.expiresAt,
          ...context?.metadata
        }
      });

      // Cache successful access
      await this.setCachedAccess(key, resource, result);

      // Increment usage count
      await innerCircleStore.recordInnerCircleUnlock(issuedKey.key);

      return result;

    } catch (error) {
      console.error('[InnerCircleAccess] Error verifying access:', error);
      
      await this.logAudit({
        memberEmail: 'unknown',
        action: 'access_error',
        resource,
        granted: false,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          ...context?.metadata
        }
      });

      return {
        granted: false,
        reason: 'Internal server error'
      };
    }
  }

  async checkPremiumContentAccess(
    contentId: string,
    contentType: PremiumContentAccess['contentType'],
    key: string,
    context?: {
      ip?: string;
      userAgent?: string;
      bypassCache?: boolean;
    }
  ): Promise<PremiumContentAccess> {
    const requiredLevel = this.getRequiredLevelForContent(contentType);
    const accessCheck = await this.verifyAccess(key, contentId, {
      ...context,
      metadata: { contentType }
    });

    const result: PremiumContentAccess = {
      contentId,
      contentType,
      requiredLevel,
      granted: accessCheck.granted,
      member: accessCheck.member,
      accessGrantedAt: accessCheck.granted ? new Date() : undefined,
      expiresAt: accessCheck.expiresAt
    };

    if (!accessCheck.granted) {
      return result;
    }

    // Check if member's access level is sufficient
    if (accessCheck.accessLevel && 
        this.compareAccessLevels(accessCheck.accessLevel.level, requiredLevel) < 0) {
      result.granted = false;
      
      await this.logAudit({
        memberEmail: accessCheck.member!.email,
        action: 'content_access_denied',
        resource: contentId,
        granted: false,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        metadata: {
          reason: 'insufficient_access_level',
          memberLevel: accessCheck.accessLevel.level,
          requiredLevel,
          contentType
        }
      });
    }

    if (result.granted) {
      await this.logAudit({
        memberEmail: accessCheck.member!.email,
        action: 'content_access_granted',
        resource: contentId,
        granted: true,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        metadata: {
          contentType,
          memberLevel: accessCheck.accessLevel!.level,
          requiredLevel
        }
      });
    }

    return result;
  }

  async batchCheckAccess(
    items: string[],
    memberKey: string,
    context?: {
      ip?: string;
      userAgent?: string;
      bypassCache?: boolean;
    }
  ): Promise<BatchAccessCheck> {
    const accessCheck = await this.verifyAccess(memberKey, undefined, {
      ...context,
      metadata: { batchCheck: true, itemCount: items.length }
    });
    
    if (!accessCheck.granted || !accessCheck.accessLevel) {
      // If basic access is denied, all items are denied
      const result: Record<string, boolean> = {};
      items.forEach(item => result[item] = false);

      return {
        items,
        memberKey,
        result,
        summary: {
          total: items.length,
          granted: 0,
          denied: items.length,
          requiredLevels: {}
        }
      };
    }

    const result: Record<string, boolean> = {};
    const requiredLevels: Record<string, AccessLevel['level']> = {};

    for (const item of items) {
      // Determine required level for this item (simplified logic)
      const requiredLevel = this.estimateRequiredLevel(item);
      requiredLevels[item] = requiredLevel;
      
      result[item] = this.compareAccessLevels(
        accessCheck.accessLevel.level,
        requiredLevel
      ) >= 0;
    }

    const granted = Object.values(result).filter(Boolean).length;
    const denied = items.length - granted;

    await this.logAudit({
      memberEmail: accessCheck.member!.email,
      action: 'batch_access_check',
      granted: granted > 0,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      metadata: {
        totalItems: items.length,
        grantedItems: granted,
        deniedItems: denied,
        memberLevel: accessCheck.accessLevel.level,
        requiredLevels
      }
    });

    return {
      items,
      memberKey,
      result,
      summary: {
        total: items.length,
        granted,
        denied,
        requiredLevels
      }
    };
  }

  private determineAccessLevel(member: InnerCircleMember): AccessLevel {
    // Map member tier to access level
    switch (member.tier?.toLowerCase()) {
      case 'vip':
      case 'platinum':
        return this.accessLevels.get('vip')!;
      case 'premium':
      case 'gold':
        return this.accessLevels.get('premium')!;
      case 'admin':
      case 'superadmin':
        return this.accessLevels.get('admin')!;
      default:
        return this.accessLevels.get('basic')!;
    }
  }

  private getRequiredLevelForContent(contentType: PremiumContentAccess['contentType']): AccessLevel['level'] {
    switch (contentType) {
      case 'video':
      case 'course':
        return 'premium';
      case 'download':
        return 'vip';
      default:
        return 'basic';
    }
  }

  private estimateRequiredLevel(item: string): AccessLevel['level'] {
    // Simple heuristic based on item patterns
    if (item.includes('/premium/') || item.includes('/vip/')) {
      return 'premium';
    }
    if (item.includes('/exclusive/') || item.includes('/secret/')) {
      return 'vip';
    }
    if (item.includes('/admin/') || item.includes('/manage/')) {
      return 'admin';
    }
    return 'basic';
  }

  private compareAccessLevels(
    memberLevel: AccessLevel['level'],
    requiredLevel: AccessLevel['level']
  ): number {
    const levelOrder: AccessLevel['level'][] = ['basic', 'premium', 'vip', 'admin'];
    const memberIndex = levelOrder.indexOf(memberLevel);
    const requiredIndex = levelOrder.indexOf(requiredLevel);
    
    if (memberIndex === -1 || requiredIndex === -1) return -1;
    
    return memberIndex - requiredIndex; // Positive = sufficient, Negative = insufficient
  }

  async getAccessLevels(): Promise<AccessLevel[]> {
    return Array.from(this.accessLevels.values());
  }

  async getAccessLevel(level: AccessLevel['level']): Promise<AccessLevel | null> {
    return this.accessLevels.get(level) || null;
  }

  async getAuditLog(
    filters?: {
      memberEmail?: string;
      action?: string;
      granted?: boolean;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<AccessAuditLog[]> {
    let filtered: AccessAuditLog[] = [];

    // Combine memory and Redis logs if available
    if (this.redisAvailable) {
      try {
        const redis = getRedis();
        if (redis) {
          const sortedSetKey = `${this.auditLogRedisPrefix}sorted`;
          const start = filters?.startDate?.getTime() || 0;
          const end = filters?.endDate?.getTime() || Date.now();
          
          const auditKeys = await redis.zrangebyscore(
            sortedSetKey,
            start,
            end,
            'WITHSCORES'
          );

          // Process in chunks to avoid too many Redis calls
          const chunkSize = 100;
          for (let i = 0; i < auditKeys.length; i += chunkSize * 2) {
            const keysChunk = auditKeys.slice(i, i + chunkSize * 2);
            const keys = [];
            
            for (let j = 0; j < keysChunk.length; j += 2) {
              keys.push(keysChunk[j]);
            }
            
            if (keys.length > 0) {
              const auditData = await redis.mget(keys);
              auditData.forEach((data, index) => {
                if (data) {
                  try {
                    filtered.push(JSON.parse(data));
                  } catch (error) {
                    console.error('[InnerCircleAccess] Parse audit log error:', error);
                  }
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('[InnerCircleAccess] Redis audit log query error:', error);
        filtered = [...this.memoryAuditLog];
      }
    } else {
      filtered = [...this.memoryAuditLog];
    }

    // Apply filters
    if (filters?.memberEmail) {
      filtered = filtered.filter(log => 
        log.memberEmail.toLowerCase().includes(filters.memberEmail!.toLowerCase())
      );
    }

    if (filters?.action) {
      filtered = filtered.filter(log => 
        log.action === filters.action
      );
    }

    if (typeof filters?.granted === 'boolean') {
      filtered = filtered.filter(log => log.granted === filters.granted);
    }

    if (filters?.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
    }

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  async clearAuditLog(): Promise<void> {
    this.memoryAuditLog = [];
    
    if (this.redisAvailable) {
      try {
        const redis = getRedis();
        if (redis) {
          const sortedSetKey = `${this.auditLogRedisPrefix}sorted`;
          const keys = await redis.zrange(sortedSetKey, 0, -1);
          
          if (keys.length > 0) {
            await redis.del(...keys, sortedSetKey);
          }
        }
      } catch (error) {
        console.error('[InnerCircleAccess] Clear Redis audit log error:', error);
      }
    }
  }

  async getAccessStats(): Promise<{
    totalChecks: number;
    granted: number;
    denied: number;
    byLevel: Record<AccessLevel['level'], number>;
    recentActivity: AccessAuditLog[];
    peakHour?: string;
    cacheHits?: number;
    cacheMisses?: number;
  }> {
    const last24Hours = await this.getAuditLog({
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    const byLevel: Record<AccessLevel['level'], number> = {
      basic: 0,
      premium: 0,
      vip: 0,
      admin: 0
    };

    let cacheHits = 0;
    let cacheMisses = 0;

    last24Hours.forEach(log => {
      if (log.metadata?.accessLevel) {
        const level = log.metadata.accessLevel as AccessLevel['level'];
        byLevel[level] = (byLevel[level] || 0) + 1;
      }
      
      if (log.metadata?.cached) {
        cacheHits++;
      } else if (log.action.includes('access_')) {
        cacheMisses++;
      }
    });

    // Find peak hour
    const hourlyCounts: Record<string, number> = {};
    last24Hours.forEach(log => {
      const hour = log.timestamp.getHours().toString().padStart(2, '0') + ':00';
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });

    let peakHour: string | undefined;
    let maxCount = 0;
    Object.entries(hourlyCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    });

    return {
      totalChecks: last24Hours.length,
      granted: last24Hours.filter(log => log.granted).length,
      denied: last24Hours.filter(log => !log.granted).length,
      byLevel,
      recentActivity: last24Hours.slice(0, 10),
      peakHour,
      cacheHits,
      cacheMisses
    };
  }

  async validateMemberPermissions(
    memberEmail: string,
    requiredPermissions: string[]
  ): Promise<{
    valid: boolean;
    missingPermissions: string[];
    member?: InnerCircleMember;
    accessLevel?: AccessLevel;
  }> {
    try {
      const member = await innerCircleStore.getMemberByEmail(memberEmail);
      
      if (!member) {
        return {
          valid: false,
          missingPermissions: requiredPermissions,
          member: undefined,
          accessLevel: undefined
        };
      }

      const accessLevel = this.determineAccessLevel(member);
      const missingPermissions = requiredPermissions.filter(
        perm => !accessLevel.permissions.includes(perm)
      );

      return {
        valid: missingPermissions.length === 0,
        missingPermissions,
        member,
        accessLevel
      };

    } catch (error) {
      console.error('[InnerCircleAccess] Error validating permissions:', error);
      return {
        valid: false,
        missingPermissions: requiredPermissions
      };
    }
  }

  async invalidateCache(key: string, resource?: string): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) return;

      const cacheKey = this.getCacheKey(key, resource);
      await redis.del(cacheKey);
    } catch (error) {
      console.error('[InnerCircleAccess] Cache invalidation error:', error);
    }
  }

  async flushAllCaches(): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) return;

      const keys = await redis.keys(`${this.accessCacheRedisPrefix}*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error('[InnerCircleAccess] Cache flush error:', error);
    }
  }

  async getCacheStats(): Promise<{
    cacheSize: number;
    ttlMs: number;
    redisAvailable: boolean;
  }> {
    try {
      const redis = getRedis();
      let cacheSize = 0;
      
      if (redis) {
        const keys = await redis.keys(`${this.accessCacheRedisPrefix}*`);
        cacheSize = keys.length;
      }

      return {
        cacheSize,
        ttlMs: this.cacheTtl,
        redisAvailable: this.redisAvailable
      };
    } catch (error) {
      console.error('[InnerCircleAccess] Cache stats error:', error);
      return {
        cacheSize: 0,
        ttlMs: this.cacheTtl,
        redisAvailable: false
      };
    }
  }
}

// Export singleton instance
const innerCircleAccess = InnerCircleAccessManager.getInstance();

// Helper functions for API routes
export async function verifyInnerCircleAccess(
  key: string,
  resource?: string,
  context?: {
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    bypassCache?: boolean;
  }
) {
  return await innerCircleAccess.verifyAccess(key, resource, context);
}

export async function checkPremiumAccess(
  contentId: string,
  contentType: PremiumContentAccess['contentType'],
  key: string,
  context?: {
    ip?: string;
    userAgent?: string;
    bypassCache?: boolean;
  }
) {
  return await innerCircleAccess.checkPremiumContentAccess(
    contentId,
    contentType,
    key,
    context
  );
}

export async function batchAccessCheck(
  items: string[],
  memberKey: string,
  context?: {
    ip?: string;
    userAgent?: string;
    bypassCache?: boolean;
  }
) {
  return await innerCircleAccess.batchCheckAccess(items, memberKey, context);
}

export async function getAccessStats() {
  return await innerCircleAccess.getAccessStats();
}

export async function validatePermissions(
  memberEmail: string,
  requiredPermissions: string[]
) {
  return await innerCircleAccess.validateMemberPermissions(
    memberEmail,
    requiredPermissions
  );
}

export async function invalidateAccessCache(key: string, resource?: string) {
  return await innerCircleAccess.invalidateCache(key, resource);
}

export async function flushAccessCaches() {
  return await innerCircleAccess.flushAllCaches();
}

export async function getAccessCacheStats() {
  return await innerCircleAccess.getCacheStats();
}

// Export functions that were missing from the imports
export function createStrictApiHandler(handler: any) {
  return async (req: any, res: any) => {
    // Add strict access checking logic here
    const access = await innerCircleAccess.verifyAccess(
      req.headers.authorization || '', 
      req.url
    );
    if (!access.granted) {
      return res.status(403).json({ error: 'Access denied' });
    }
    return handler(req, res);
  };
}

export function createPublicApiHandler(handler: any) {
  return async (req: any, res: any) => {
    // Public API - no access checking
    return handler(req, res);
  };
}

// Export the instance and other needed exports
export default innerCircleAccess;

// Export manager class for testing/extensibility
export { InnerCircleAccessManager };

// Export types for external use
export type {
  AccessLevel,
  AccessCheckResult,
  PremiumContentAccess,
  BatchAccessCheck,
  AccessAuditLog,
  CachedAccessCheck
};