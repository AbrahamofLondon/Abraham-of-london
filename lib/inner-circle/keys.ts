// lib/inner-circle/keys.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/inner-circle/keys.ts
// Deterministic façade: always exports the SAME named exports.
// Server uses keys.server; client uses keys.client.
// This avoids Next.js build-time “not exported from './keys'” failures.

const isServer = typeof window === "undefined";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const impl = isServer ? require("./keys.server") : require("./keys.client");

export const generateAccessKey = impl.generateAccessKey;
export const storeKey = impl.storeKey;
export const getKey = impl.getKey;
export const revokeKey = impl.revokeKey;
export const renewKey = impl.renewKey;
export const incrementKeyUsage = impl.incrementKeyUsage;
export const getKeysByMember = impl.getKeysByMember;
export const getKeysByTier = impl.getKeysByTier;
export const getActiveKeys = impl.getActiveKeys;
export const cleanupExpiredKeys = impl.cleanupExpiredKeys;
export const isExpired = impl.isExpired;
export const getMemoryStoreSize = impl.getMemoryStoreSize;
export const getEmailHash = impl.getEmailHash;

export const createOrUpdateMemberAndIssueKey = impl.createOrUpdateMemberAndIssueKey;
export const verifyInnerCircleKey = impl.verifyInnerCircleKey;
export const getPrivacySafeStats = impl.getPrivacySafeStats;
export const recordInnerCircleUnlock = impl.recordInnerCircleUnlock;
export const cleanupExpiredData = impl.cleanupExpiredData;

// Types: re-export from client file (safe)
export type {
  KeyTier,
  StoredKey,
  CreateOrUpdateMemberArgs,
  IssuedKey,
  VerifyInnerCircleKeyResult,
  InnerCircleStats,
  CleanupResult,
} from "./keys.client";

export default impl.default || impl;