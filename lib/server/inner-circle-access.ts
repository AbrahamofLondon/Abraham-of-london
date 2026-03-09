/* eslint-disable no-console */
/**
 * lib/server/inner-circle-access.ts
 *
 * Strict, edge-safe compatibility access layer for Inner Circle.
 *
 * Design choices:
 * - Uses the actual inner-circle-store contract (member-based)
 * - Treats "key" as a compatibility identifier (member id or email)
 * - Uses memory cache + memory audit log only
 * - Exports strict/public API handlers expected elsewhere in the codebase
 * - Avoids Redis / Node-only runtime dependencies
 */

import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import innerCircleStore from "./inner-circle-store";
import type { InnerCircleMember } from "./inner-circle-store";
import type { AccessTier } from "@/lib/access/tier-policy";
import { safeSlice } from "@/lib/utils/safe";

export type IssuedKey = {
  key: string;
  issuedTo?: string | null;
  expiresAt?: Date;
  maxUses?: number;
  usedCount?: number;
  metadata?: Record<string, unknown>;
};

export type AccessLevelName = "basic" | "premium" | "vip" | "admin";

export interface AccessLevel {
  level: AccessLevelName;
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
  metadata?: Record<string, unknown>;
}

export interface PremiumContentAccess {
  contentId: string;
  contentType: "article" | "video" | "course" | "download";
  requiredLevel: AccessLevelName;
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
    requiredLevels: Record<string, AccessLevelName>;
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
  metadata?: Record<string, unknown>;
}

export interface CachedAccessCheck {
  result: AccessCheckResult;
  cachedAt: Date;
  expiresAt: Date;
}

type VerifyContext = {
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  bypassCache?: boolean;
};

class InnerCircleAccessManager {
  private static instance: InnerCircleAccessManager;

  private readonly accessLevels: Map<AccessLevelName, AccessLevel>;
  private memoryAuditLog: AccessAuditLog[] = [];
  private readonly maxMemoryAuditLogSize = 1000;

  private readonly cacheTtlMs = 60_000;
  private readonly accessCache = new Map<string, CachedAccessCheck>();

  private constructor() {
    this.accessLevels = new Map<AccessLevelName, AccessLevel>([
      [
        "basic",
        {
          level: "basic",
          permissions: ["access_basic_content", "view_preview"],
          description: "Basic member access",
        },
      ],
      [
        "premium",
        {
          level: "premium",
          permissions: [
            "access_basic_content",
            "access_premium_content",
            "download_resources",
            "early_access",
          ],
          description: "Premium member access",
        },
      ],
      [
        "vip",
        {
          level: "vip",
          permissions: [
            "access_basic_content",
            "access_premium_content",
            "access_vip_content",
            "download_resources",
            "early_access",
            "priority_support",
            "exclusive_events",
          ],
          description: "VIP member access",
        },
      ],
      [
        "admin",
        {
          level: "admin",
          permissions: [
            "access_all_content",
            "manage_members",
            "view_analytics",
            "system_config",
          ],
          description: "Administrator access",
        },
      ],
    ]);
  }

  static getInstance(): InnerCircleAccessManager {
    if (!InnerCircleAccessManager.instance) {
      InnerCircleAccessManager.instance = new InnerCircleAccessManager();
    }
    return InnerCircleAccessManager.instance;
  }

  private getCacheKey(key: string, resource?: string): string {
    return resource ? `${key}::${resource}` : key;
  }

  private pruneExpiredCache(): void {
    const now = Date.now();
    for (const [cacheKey, entry] of this.accessCache.entries()) {
      if (entry.expiresAt.getTime() <= now) {
        this.accessCache.delete(cacheKey);
      }
    }
  }

  private getCachedAccess(key: string, resource?: string): CachedAccessCheck | null {
    this.pruneExpiredCache();
    const cacheKey = this.getCacheKey(key, resource);
    const cached = this.accessCache.get(cacheKey);
    if (!cached) return null;
    if (cached.expiresAt.getTime() <= Date.now()) {
      this.accessCache.delete(cacheKey);
      return null;
    }
    return cached;
  }

  private setCachedAccess(
    key: string,
    resource: string | undefined,
    result: AccessCheckResult
  ): void {
    if (!result.granted) return;

    const cacheKey = this.getCacheKey(key, resource);
    const cacheEntry: CachedAccessCheck = {
      result,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + this.cacheTtlMs),
    };

    this.accessCache.set(cacheKey, cacheEntry);
  }

  private async logAudit(entry: Omit<AccessAuditLog, "timestamp">): Promise<void> {
    const auditEntry: AccessAuditLog = {
      timestamp: new Date(),
      ...entry,
    };

    this.memoryAuditLog.unshift(auditEntry);

    if (this.memoryAuditLog.length > this.maxMemoryAuditLogSize) {
      this.memoryAuditLog = safeSlice(
        this.memoryAuditLog,
        0,
        this.maxMemoryAuditLogSize
      );
    }
  }

  private async resolveMemberFromKey(key: string): Promise<InnerCircleMember | null> {
    const raw = String(key || "").trim();
    if (!raw) return null;

    try {
      const byId = await innerCircleStore.getMemberById(raw);
      if (byId) return byId;
    } catch (error) {
      console.error("[InnerCircleAccess] getMemberById error:", error);
    }

    try {
      if (raw.includes("@")) {
        const byEmail = await innerCircleStore.getMemberByEmail(raw);
        if (byEmail) return byEmail;
      }
    } catch (error) {
      console.error("[InnerCircleAccess] getMemberByEmail error:", error);
    }

    return null;
  }

  private syntheticKey(key: string, member?: InnerCircleMember): IssuedKey {
    return {
      key,
      issuedTo: member?.email ?? member?.id ?? null,
      usedCount: 0,
      metadata: {
        compatibilityMode: true,
        backingStore: "member_store_only",
      },
    };
  }

  private determineAccessLevel(member: InnerCircleMember): AccessLevel {
    const tier = String(member.tier || "").toLowerCase() as AccessTier | string;

    switch (tier) {
      case "vip":
      case "platinum":
        return this.accessLevels.get("vip")!;
      case "premium":
      case "gold":
        return this.accessLevels.get("premium")!;
      case "admin":
      case "superadmin":
      case "founder":
        return this.accessLevels.get("admin")!;
      default:
        return this.accessLevels.get("basic")!;
    }
  }

  private compareAccessLevels(
    memberLevel: AccessLevelName,
    requiredLevel: AccessLevelName
  ): number {
    const order: AccessLevelName[] = ["basic", "premium", "vip", "admin"];
    return order.indexOf(memberLevel) - order.indexOf(requiredLevel);
  }

  private getRequiredLevelForContent(
    contentType: PremiumContentAccess["contentType"]
  ): AccessLevelName {
    switch (contentType) {
      case "video":
      case "course":
        return "premium";
      case "download":
        return "vip";
      default:
        return "basic";
    }
  }

  private estimateRequiredLevel(item: string): AccessLevelName {
    if (item.includes("/admin/") || item.includes("/manage/")) return "admin";
    if (item.includes("/exclusive/") || item.includes("/secret/")) return "vip";
    if (item.includes("/premium/") || item.includes("/vip/")) return "premium";
    return "basic";
  }

  async verifyAccess(
    key: string,
    resource?: string,
    context?: VerifyContext
  ): Promise<AccessCheckResult> {
    const rawKey = String(key || "").trim();

    if (!rawKey) {
      return {
        granted: false,
        reason: "Missing key",
      };
    }

    if (!context?.bypassCache) {
      const cached = this.getCachedAccess(rawKey, resource);
      if (cached) {
        await this.logAudit({
          memberEmail: cached.result.member?.email || "cached",
          action: "access_granted_cached",
          resource,
          granted: cached.result.granted,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
          metadata: {
            ...cached.result.metadata,
            cached: true,
            cachedAt: cached.cachedAt.toISOString(),
            ...context?.metadata,
          },
        });

        return cached.result;
      }
    }

    try {
      const member = await this.resolveMemberFromKey(rawKey);

      if (!member) {
        await this.logAudit({
          memberEmail: "unknown",
          action: "access_denied",
          resource,
          granted: false,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
          metadata: {
            reason: "member_not_found",
            ...context?.metadata,
          },
        });

        return {
          granted: false,
          reason: "Member not found",
        };
      }

      if (member.status !== "active") {
        await this.logAudit({
          memberEmail: member.email || "unknown",
          action: "access_denied",
          resource,
          granted: false,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
          metadata: {
            reason: "member_inactive",
            status: member.status,
            ...context?.metadata,
          },
        });

        return {
          granted: false,
          reason: "Member is not active",
          member,
          key: this.syntheticKey(rawKey, member),
        };
      }

      const accessLevel = this.determineAccessLevel(member);

      const result: AccessCheckResult = {
        granted: true,
        member,
        key: this.syntheticKey(rawKey, member),
        accessLevel,
        metadata: {
          permissions: accessLevel.permissions,
          tier: member.tier,
          compatibilityMode: true,
        },
      };

      await this.logAudit({
        memberEmail: member.email || "unknown",
        action: "access_granted",
        resource,
        granted: true,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        metadata: {
          accessLevel: accessLevel.level,
          ...context?.metadata,
        },
      });

      this.setCachedAccess(rawKey, resource, result);

      return result;
    } catch (error) {
      console.error("[InnerCircleAccess] Error verifying access:", error);

      await this.logAudit({
        memberEmail: "unknown",
        action: "access_error",
        resource,
        granted: false,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
          ...context?.metadata,
        },
      });

      return {
        granted: false,
        reason: "Internal server error",
      };
    }
  }

  async checkPremiumContentAccess(
    contentId: string,
    contentType: PremiumContentAccess["contentType"],
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
      metadata: { contentType },
    });

    const result: PremiumContentAccess = {
      contentId,
      contentType,
      requiredLevel,
      granted: accessCheck.granted,
      member: accessCheck.member,
      accessGrantedAt: accessCheck.granted ? new Date() : undefined,
      expiresAt: accessCheck.expiresAt,
    };

    if (!accessCheck.granted) return result;

    if (
      accessCheck.accessLevel &&
      this.compareAccessLevels(accessCheck.accessLevel.level, requiredLevel) < 0
    ) {
      result.granted = false;

      await this.logAudit({
        memberEmail: accessCheck.member?.email || "unknown",
        action: "content_access_denied",
        resource: contentId,
        granted: false,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        metadata: {
          reason: "insufficient_access_level",
          memberLevel: accessCheck.accessLevel.level,
          requiredLevel,
          contentType,
        },
      });
    }

    if (result.granted) {
      await this.logAudit({
        memberEmail: accessCheck.member?.email || "unknown",
        action: "content_access_granted",
        resource: contentId,
        granted: true,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        metadata: {
          contentType,
          memberLevel: accessCheck.accessLevel?.level,
          requiredLevel,
        },
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
      metadata: { batchCheck: true, itemCount: items.length },
    });

    if (!accessCheck.granted || !accessCheck.accessLevel) {
      const result: Record<string, boolean> = {};
      items.forEach((item) => {
        result[item] = false;
      });

      return {
        items,
        memberKey,
        result,
        summary: {
          total: items.length,
          granted: 0,
          denied: items.length,
          requiredLevels: {},
        },
      };
    }

    const result: Record<string, boolean> = {};
    const requiredLevels: Record<string, AccessLevelName> = {};

    for (const item of items) {
      const requiredLevel = this.estimateRequiredLevel(item);
      requiredLevels[item] = requiredLevel;
      result[item] =
        this.compareAccessLevels(accessCheck.accessLevel.level, requiredLevel) >= 0;
    }

    const granted = Object.values(result).filter(Boolean).length;
    const denied = items.length - granted;

    await this.logAudit({
      memberEmail: accessCheck.member?.email || "unknown",
      action: "batch_access_check",
      granted: granted > 0,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      metadata: {
        totalItems: items.length,
        grantedItems: granted,
        deniedItems: denied,
        memberLevel: accessCheck.accessLevel.level,
        requiredLevels,
      },
    });

    return {
      items,
      memberKey,
      result,
      summary: {
        total: items.length,
        granted,
        denied,
        requiredLevels,
      },
    };
  }

  async getAuditLog(filters?: {
    memberEmail?: string;
    action?: string;
    granted?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AccessAuditLog[]> {
    let filtered: AccessAuditLog[] = [...this.memoryAuditLog];

    const memberEmail = filters?.memberEmail?.toLowerCase();
    if (memberEmail) {
      filtered = filtered.filter((log) =>
        log.memberEmail.toLowerCase().includes(memberEmail)
      );
    }

    const action = filters?.action;
    if (action) {
      filtered = filtered.filter((log) => log.action === action);
    }

    const granted = filters?.granted;
    if (typeof granted === "boolean") {
      filtered = filtered.filter((log) => log.granted === granted);
    }

    const startDate = filters?.startDate;
    if (startDate) {
      filtered = filtered.filter((log) => log.timestamp >= startDate);
    }

    const endDate = filters?.endDate;
    if (endDate) {
      filtered = filtered.filter((log) => log.timestamp <= endDate);
    }

    const limit = filters?.limit;
    if (typeof limit === "number" && limit > 0) {
      filtered = safeSlice(filtered, 0, limit);
    }

    return filtered;
  }

  async getAccessStats() {
    const last24Hours = await this.getAuditLog({
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    const byLevel: Record<AccessLevelName, number> = {
      basic: 0,
      premium: 0,
      vip: 0,
      admin: 0,
    };

    let cacheHits = 0;
    let cacheMisses = 0;

    last24Hours.forEach((log) => {
      const maybeLevel = log.metadata?.accessLevel;
      if (
        maybeLevel === "basic" ||
        maybeLevel === "premium" ||
        maybeLevel === "vip" ||
        maybeLevel === "admin"
      ) {
        byLevel[maybeLevel] += 1;
      }

      if (log.metadata?.cached === true) cacheHits += 1;
      else if (log.action.includes("access_")) cacheMisses += 1;
    });

    return {
      totalChecks: last24Hours.length,
      granted: last24Hours.filter((log) => log.granted).length,
      denied: last24Hours.filter((log) => !log.granted).length,
      byLevel,
      recentActivity: safeSlice(last24Hours, 0, 10),
      peakHour: undefined as string | undefined,
      cacheHits,
      cacheMisses,
    };
  }

  async validateMemberPermissions(
    memberEmail: string,
    requiredPermissions: string[]
  ) {
    try {
      const member = await innerCircleStore.getMemberByEmail(memberEmail);

      if (!member) {
        return {
          valid: false,
          missingPermissions: requiredPermissions,
        };
      }

      const accessLevel = this.determineAccessLevel(member);
      const missingPermissions = requiredPermissions.filter(
        (perm) => !accessLevel.permissions.includes(perm)
      );

      return {
        valid: missingPermissions.length === 0,
        missingPermissions,
        member,
        accessLevel,
      };
    } catch (error) {
      console.error("[InnerCircleAccess] Error validating permissions:", error);
      return {
        valid: false,
        missingPermissions: requiredPermissions,
      };
    }
  }

  async invalidateCache(key: string, resource?: string): Promise<void> {
    const cacheKey = this.getCacheKey(key, resource);
    this.accessCache.delete(cacheKey);
  }

  async flushAllCaches(): Promise<void> {
    this.accessCache.clear();
  }

  async getCacheStats(): Promise<{
    cacheSize: number;
    ttlMs: number;
    redisAvailable: boolean;
  }> {
    this.pruneExpiredCache();
    return {
      cacheSize: this.accessCache.size,
      ttlMs: this.cacheTtlMs,
      redisAvailable: false,
    };
  }
}

const innerCircleAccess = InnerCircleAccessManager.getInstance();

export async function verifyInnerCircleAccess(
  key: string,
  resource?: string,
  context?: VerifyContext
) {
  return innerCircleAccess.verifyAccess(key, resource, context);
}

export async function checkPremiumAccess(
  contentId: string,
  contentType: PremiumContentAccess["contentType"],
  key: string,
  context?: {
    ip?: string;
    userAgent?: string;
    bypassCache?: boolean;
  }
) {
  return innerCircleAccess.checkPremiumContentAccess(
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
  return innerCircleAccess.batchCheckAccess(items, memberKey, context);
}

export async function getAccessStats() {
  return innerCircleAccess.getAccessStats();
}

export async function validatePermissions(
  memberEmail: string,
  requiredPermissions: string[]
) {
  return innerCircleAccess.validateMemberPermissions(
    memberEmail,
    requiredPermissions
  );
}

export async function invalidateAccessCache(key: string, resource?: string) {
  return innerCircleAccess.invalidateCache(key, resource);
}

export async function flushAccessCaches() {
  return innerCircleAccess.flushAllCaches();
}

export async function getAccessCacheStats() {
  return innerCircleAccess.getCacheStats();
}

export function createStrictApiHandler(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader =
      typeof req.headers.authorization === "string"
        ? req.headers.authorization
        : "";

    const access = await innerCircleAccess.verifyAccess(authHeader, req.url || "");

    if (!access.granted) {
      return res.status(403).json({
        ok: false,
        error: "Access denied",
        reason: access.reason || "Forbidden",
      });
    }

    return handler(req, res);
  };
}

export function createPublicApiHandler(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    return handler(req, res);
  };
}

export default innerCircleAccess;
export { InnerCircleAccessManager };