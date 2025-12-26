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
  type AdminExportRow,
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
  // - deletedKeys unknown => 0 (don’t fabricate)
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
   TYPES RE-EXPORT
   ============================================================================ */

export type {
  InnerCircleStatus,
  CreateOrUpdateMemberArgs,
  IssuedKey,
  VerifyInnerCircleKeyResult,
  InnerCircleMember,
  AdminExportRow,
};

/* ============================================================================
   EMAIL EXPORT
   ============================================================================ */

export { sendInnerCircleEmail } from "@/lib/inner-circle/email";

/* ============================================================================
   OPTIONAL HELPERS (SAFE NO-OPS)
   ============================================================================ */

export const getMemberByEmail = async (
  email: string
): Promise<InnerCircleMember | null> => {
  void email;
  return null;
};

export const recordInnerCircleUnlock = async (
  email: string,
  slug: string,
  ip?: string
): Promise<{ success: boolean; message?: string }> => {
  void email;
  void slug;
  void ip;
  return { success: true, message: "Access logged (baseline no-op)" };
};

export const revokeInnerCircleKey = async (
  email: string
): Promise<{ success: boolean; message?: string }> => {
  const ok = await innerCircleStore.deleteMemberByEmail(email);
  return { success: ok, message: ok ? "Member deleted" : "Member not found" };
};

/**
 * Default export for legacy imports.
 */
export default innerCircleStore;