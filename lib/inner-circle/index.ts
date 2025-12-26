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

/* =============================================================================
   TYPE ADAPTATIONS
   ============================================================================= */

// Export types from the store
export type {
  InnerCircleStatus,
  CreateOrUpdateMemberArgs,
  IssuedKey,
  VerifyInnerCircleKeyResult,
  InnerCircleMember,
  AdminExportRow,
};

// Define cleanup result type that matches API expectations
export type CleanupResult = {
  deletedMembers: number;
  deletedKeys: number;
  remainingTotal?: number; // Optional extra data
};

/* =============================================================================
   RE-EXPORTS WITH PROPER TYPING
   ============================================================================= */

export const createOrUpdateMemberAndIssueKey = innerCircleStore.createOrUpdateMemberAndIssueKey;
export const verifyInnerCircleKey = innerCircleStore.verifyInnerCircleKey;
export const getPrivacySafeStats = innerCircleStore.getPrivacySafeStats;
export const getPrivacySafeKeyRows = innerCircleStore.getPrivacySafeKeyRows;
export const getPrivacySafeKeyExport = innerCircleStore.getPrivacySafeKeyExport;
export const deleteMemberByEmail = innerCircleStore.deleteMemberByEmail;
export const getClientIp = innerCircleStore.getClientIp;

// Original cleanup function (returns full result)
export const cleanupExpiredData = innerCircleStore.cleanupExpiredData;

// API-compatible cleanup function (maps to expected shape)
export const cleanupOldData = async (): Promise<{ deletedMembers: number; deletedKeys: number }> => {
  const result = await innerCircleStore.cleanupExpiredData();
  return {
    deletedMembers: result.deletedMembers,
    deletedKeys: result.deletedKeys,
  };
};

/* =============================================================================
   EMAIL FUNCTIONALITY
   ============================================================================= */

export { sendInnerCircleEmail } from "@/lib/inner-circle/email";

/* =============================================================================
   OPTIONAL HELPERS (SAFE NO-OPS)
   ============================================================================= */

export const getMemberByEmail = async (email: string): Promise<InnerCircleMember | null> => {
  // In-memory store baseline doesn't expose direct reads for privacy
  void email; // Mark as intentionally unused
  return null;
};

export const recordInnerCircleUnlock = async (
  email: string,
  slug: string,
  ip?: string
): Promise<{ success: boolean; message?: string }> => {
  // Safe no-op implementation
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

/* =============================================================================
   DEFAULT EXPORT (FOR LEGACY IMPORTS)
   ============================================================================= */

export default innerCircleStore;