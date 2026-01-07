// lib/server/inner-circle-access.ts
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

class InnerCircleAccessManager {
  private static instance: InnerCircleAccessManager;
  private accessLevels: Map<AccessLevel['level'], AccessLevel>;
  private auditLog: AccessAuditLog[] = [];
  private maxAuditLogSize = 1000;

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
  }

  static getInstance(): InnerCircleAccessManager {
    if (!InnerCircleAccessManager.instance) {
      InnerCircleAccessManager.instance = new InnerCircleAccessManager();
    }
    return InnerCircleAccessManager.instance;
  }

  private logAudit(entry: Omit<AccessAuditLog, 'timestamp'>): void {
    const auditEntry: AccessAuditLog = {
      timestamp: new Date(),
      ...entry
    };

    this.auditLog.unshift(auditEntry);
    
    // Keep log at manageable size
    if (this.auditLog.length > this.maxAuditLogSize) {
      this.auditLog = this.auditLog.slice(0, this.maxAuditLogSize);
    }
  }

  async verifyAccess(
    key: string,
    resource?: string,
    context?: {
      ip?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<AccessCheckResult> {
    try {
      // Verify the key
      const verification = await innerCircleStore.verifyInnerCircleKey(key);
      
      if (!verification.valid) {
        this.logAudit({
          memberEmail: 'unknown',
          action: 'access_denied',
          resource,
          granted: false,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
          metadata: {
            reason: 'invalid_key',
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
        this.logAudit({
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
        this.logAudit({
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
        this.logAudit({
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
        this.logAudit({
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

      // Log successful access
      this.logAudit({
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

      // Increment usage count
      await innerCircleStore.recordInnerCircleUnlock(issuedKey.key);

      return {
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

    } catch (error) {
      console.error('[InnerCircleAccess] Error verifying access:', error);
      
      this.logAudit({
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
    }
  ): Promise<PremiumContentAccess> {
    const requiredLevel = this.getRequiredLevelForContent(contentType);
    const accessCheck = await this.verifyAccess(key, contentId, context);

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
      
      this.logAudit({
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
      this.logAudit({
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
    }
  ): Promise<BatchAccessCheck> {
    const accessCheck = await this.verifyAccess(memberKey, undefined, context);
    
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

    this.logAudit({
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
    let filtered = [...this.auditLog];

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
    this.auditLog = [];
  }

  async getAccessStats(): Promise<{
    totalChecks: number;
    granted: number;
    denied: number;
    byLevel: Record<AccessLevel['level'], number>;
    recentActivity: AccessAuditLog[];
    peakHour?: string;
  }> {
    const last24Hours = this.auditLog.filter(log => {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return log.timestamp > dayAgo;
    });

    const byLevel: Record<AccessLevel['level'], number> = {
      basic: 0,
      premium: 0,
      vip: 0,
      admin: 0
    };

    last24Hours.forEach(log => {
      if (log.metadata?.accessLevel) {
        const level = log.metadata.accessLevel as AccessLevel['level'];
        byLevel[level] = (byLevel[level] || 0) + 1;
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
      peakHour
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

export default innerCircleAccess;