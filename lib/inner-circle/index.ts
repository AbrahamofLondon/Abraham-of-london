/* eslint-disable no-console */
/**
 * Public Inner Circle module surface.
 *
 * Use in:
 * - pages/api/**
 * - server utilities
 *
 * Do NOT import this into client components.
 */

import innerCircleStore, {
  type InnerCircleStatus,
  type CreateOrUpdateMemberArgs,
  type IssuedKey,
  type VerifyInnerCircleKeyResult,
  type InnerCircleMember,
  type AdminExportRow,
  type CleanupResult,
  type PaginationParams,
  type PaginatedResult,
  type PrivacySafeKeyRow,
  type MemberKeyRow,
  type ActiveKeyRow,
} from "@/lib/server/inner-circle-store";

// FIX: Import RateLimitResult from its source of truth
import type { RateLimitResult } from "@/lib/rate-limit";

/* ============================================================================
   PUBLIC FUNCTION EXPORTS (DIRECT PASSTHROUGH)
   ============================================================================ */

export const createOrUpdateMemberAndIssueKey =
  innerCircleStore.createOrUpdateMemberAndIssueKey;

export const verifyInnerCircleKey = innerCircleStore.verifyInnerCircleKey;

export const getPrivacySafeStats = innerCircleStore.getPrivacySafeStats;

export const getPrivacySafeKeyRows = innerCircleStore.getPrivacySafeKeyRows;

export const getPrivacySafeKeyExport = innerCircleStore.getPrivacySafeKeyExport;

export const deleteMemberByEmail = innerCircleStore.deleteMemberByEmail;

export const cleanupExpiredData = innerCircleStore.cleanupExpiredData;

export const getClientIp = innerCircleStore.getClientIp;

export const getMemberByEmail = innerCircleStore.getMemberByEmail;

export const getMemberKeys = innerCircleStore.getMemberKeys;

export const getActiveKeysForMember = innerCircleStore.getActiveKeysForMember;

export const recordInnerCircleUnlock = innerCircleStore.recordInnerCircleUnlock;

export const revokeInnerCircleKey = innerCircleStore.revokeInnerCircleKey;

export const suspendKey = innerCircleStore.suspendKey;

export const renewKey = innerCircleStore.renewKey;

export const healthCheck = innerCircleStore.healthCheck;

/* ============================================================================
   BACKWARD COMPAT: NORMALIZED CLEANUP ALIAS
   ============================================================================ */

export type CleanupOldDataStats = {
  deletedMembers: number;
  deletedKeys: number;
  total: number;
};

function normalizeCleanupStats(raw: unknown): CleanupOldDataStats {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

  const removed = n(obj.removed);
  const totalLegacy = n(obj.total);
  const deletedMembers = n(obj.deletedMembers);
  const deletedKeys = n(obj.deletedKeys);
  const totalNew = n(obj.total);

  if (deletedMembers > 0 || deletedKeys > 0) {
    const total = totalNew || deletedMembers + deletedKeys;
    return { deletedMembers, deletedKeys, total };
  }

  return {
    deletedMembers: removed,
    deletedKeys: 0,
    total: totalLegacy || removed,
  };
}

export async function cleanupOldData(): Promise<CleanupOldDataStats> {
  const raw = await innerCircleStore.cleanupExpiredData();
  return normalizeCleanupStats(raw);
}

/* ============================================================================
   TYPES RE-EXPORT
   ============================================================================ */

export type {
  InnerCircleStatus,
  CreateOrUpdateMemberArgs,
  IssuedKey,
  VerifyInnerCircleKeyResult,
  InnerCircleMember,
  AdminExportRow,
  CleanupResult,
  PaginationParams,
  PaginatedResult,
  PrivacySafeKeyRow,
  MemberKeyRow,
  ActiveKeyRow,
  RateLimitResult,
};

/* ============================================================================
   EMAIL EXPORT (Lazy Load)
   ============================================================================ */

// Note: This pattern assumes email module is always present in production
// but prevents build crashes if it's temporarily missing during refactors.
let sendEmailFn: any = async () => ({ success: false, error: "Email module not loaded" });

try {
  // Using require to avoid top-level await issues in some Next.js configs
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const emailModule = require("@/lib/inner-circle/email");
  if (emailModule.sendInnerCircleEmail) {
    sendEmailFn = emailModule.sendInnerCircleEmail;
  }
} catch (e) {
  // Silent fail on build, will fail at runtime if called
}

export const sendInnerCircleEmail = sendEmailFn;

/* ============================================================================
   DEFAULT EXPORT
   ============================================================================ */

export default innerCircleStore;