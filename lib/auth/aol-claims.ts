// lib/auth/aol-claims.ts — SSOT Claims Types
import type { AccessTier } from "@/lib/access/tier-policy";

export type AoLClaimTier = AccessTier;

export type AoLClaims = {
  tier?: AoLClaimTier | string; // tolerate legacy from providers
  flags?: string[];
  roles?: string[];
  [k: string]: unknown;
};