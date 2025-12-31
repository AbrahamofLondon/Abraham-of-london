// lib/inner-circle/index.ts
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
  type AdminExportRow, // This imports the type from inner-circle-store.ts
  type CleanupResult,
  type PaginationParams,
  type PaginatedResult,
  type PrivacySafeKeyRow,
  type MemberKeyRow,
  type ActiveKeyRow,
  type RateLimitResult,
} from "@/lib/server/inner-circle-store";

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

/**
 * Canonical cleanup stats shape for API surfaces.
 * Keep this stable even if the underlying store evolves.
 */
export type CleanupOldDataStats = {
  deletedMembers: number;
  deletedKeys: number;
  total: number; // total removed (members + keys, or store-specific total)
};

/**
 * Robust adapter:
 * - Supports legacy store shape: { removed, total }
 * - Supports future shape: { deletedMembers, deletedKeys } (and/or total)
 * - Never throws for missing numeric fields; defaults to 0
 */
function normalizeCleanupStats(raw: unknown): CleanupOldDataStats {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

  // legacy store returns:
  // { removed: number; total: number }
  const removed = n(obj.removed);
  const totalLegacy = n(obj.total);

  // future/alternate store returns:
  // { deletedMembers: number; deletedKeys: number; total?: number }
  const deletedMembers = n(obj.deletedMembers);
  const deletedKeys = n(obj.deletedKeys);
  const totalNew = n(obj.total);

  // If store already provides member/key split, use it.
  if (deletedMembers > 0 || deletedKeys > 0) {
    const total = totalNew || deletedMembers + deletedKeys;
    return { deletedMembers, deletedKeys, total };
  }

  // If only legacy "removed/total" exists, we map:
  // - deletedKeys unknown => 0 (don't fabricate)
  // - deletedMembers = removed (best available signal)
  // - total = totalLegacy or removed
  return {
    deletedMembers: removed,
    deletedKeys: 0,
    total: totalLegacy || removed,
  };
}

/**
 * Backward-compatible alias for older admin endpoints:
 * returns stable { deletedMembers, deletedKeys, total }.
 */
export async function cleanupOldData(): Promise<CleanupOldDataStats> {
  const raw = await innerCircleStore.cleanupExpiredData();
  return normalizeCleanupStats(raw);
}

/* ============================================================================
   TYPES RE-EXPORT - REMOVE DUPLICATE AdminExportRow
   ============================================================================ */

// Only re-export types that are imported above
// Remove AdminExportRow from here since it's already imported and will be re-exported automatically
// through the import statement above
export type {
  InnerCircleStatus,
  CreateOrUpdateMemberArgs,
  IssuedKey,
  VerifyInnerCircleKeyResult,
  InnerCircleMember,
  AdminExportRow, // Keep this here - it re-exports the imported type
  CleanupResult,
  PaginationParams,
  PaginatedResult,
  PrivacySafeKeyRow,
  MemberKeyRow,
  ActiveKeyRow,
  RateLimitResult,
};

/* ============================================================================
   EMAIL EXPORT
   ============================================================================ */

// Only export if the file exists, otherwise provide a stub
let emailModule: any;
try {
  emailModule = await import("@/lib/inner-circle/email");
} catch {
  emailModule = {
    sendInnerCircleEmail: async () => ({ success: false, error: "Email module not found" })
  };
}

export const sendInnerCircleEmail = emailModule.sendInnerCircleEmail;

/* ============================================================================
   OPTIONAL HELPERS (SAFE NO-OPS) - REMOVE IF NOT NEEDED
   ============================================================================ */

// Remove these if they conflict with the real exports above
// export const getMemberByEmail = async (
//   email: string
// ): Promise<InnerCircleMember | null> => {
//   void email;
//   return null;
// };

// export const recordInnerCircleUnlock = async (
//   email: string,
//   slug: string,
//   ip?: string
// ): Promise<{ success: boolean; message?: string }> => {
//   void email;
//   void slug;
//   void ip;
//   return { success: true, message: "Access logged (baseline no-op)" };
// };

// export const revokeInnerCircleKey = async (
//   email: string
// ): Promise<{ success: boolean; message?: string }> => {
//   const ok = await innerCircleStore.deleteMemberByEmail(email);
//   return { success: ok, message: ok ? "Member deleted" : "Member not found" };
// };

/* ============================================================================
   DEFAULT EXPORT
   ============================================================================ */

export default innerCircleStore;