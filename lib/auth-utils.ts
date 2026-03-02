// lib/auth-utils.ts — SSOT Tier + Flag Utilities (Enterprise-grade)
/* eslint-disable @typescript-eslint/no-explicit-any */

import crypto from "crypto";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess, getTierLabel } from "@/lib/access/tier-policy";

/**
 * Internal/privileged markers that imply owner-grade clearance.
 * (These are NOT subscription tiers; they're governance markers.)
 */
const INTERNAL_MARKERS = ["internal", "staff", "private_access", "admin", "director", "root", "superadmin"];

/**
 * UTILITY: Deterministic Identity Hashing (SHA-256)
 */
export function sha256Hex(input: string): string {
  if (!input) return "";
  return crypto.createHash("sha256").update(input.trim().toLowerCase()).digest("hex");
}

/**
 * UTILITY: Flag Sanitization
 */
export function safeParseFlags(flagsJson?: string | null): string[] {
  if (!flagsJson) return [];
  try {
    const parsed = JSON.parse(flagsJson);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    // tolerate legacy CSV style
    if (typeof flagsJson === "string" && flagsJson.includes(",")) {
      return flagsJson.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }
}

/**
 * SECURITY: Internal Marker Check
 */
export function hasInternalFlag(flags: string[]): boolean {
  return flags.some((flag) => INTERNAL_MARKERS.includes(String(flag).toLowerCase()));
}

/**
 * TIER MAPPING: DB tier -> AccessTier (SSOT aligned)
 * Uses the SSOT alias map via normalizeUserTier
 */
export function mapMemberTierToAccessTier(dbTier: string | null, flags: string[]): AccessTier {
  // Internal flags override to highest tier
  if (hasInternalFlag(flags)) {
    return "owner";
  }

  // Let SSOT alias map handle everything else
  return normalizeUserTier(dbTier);
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use mapMemberTierToAccessTier instead
 */
export function mapMemberTierToAoLTier(dbTier: string | null, flags: string[]): any {
  return mapMemberTierToAccessTier(dbTier, flags);
}

/**
 * Resolve user tier from arbitrary inputs (claims, flags, DB strings).
 * - Safe default: public
 * - Never grant privilege by accident
 */
export function resolveAccessTier(input: unknown, flags?: unknown): AccessTier {
  const raw = String(input ?? "").toLowerCase();

  // If flags contain internal markers, treat as owner
  const f = Array.isArray(flags) ? flags.map((x) => String(x).toLowerCase()) : [];
  if (f.some((x) => INTERNAL_MARKERS.includes(x))) return "owner";

  // Let SSOT alias map handle everything else
  return normalizeUserTier(raw);
}

/**
 * Helper: extract tier from a JWT-ish / session-ish object safely.
 */
export function tierFromSession(session: any): AccessTier {
  const t =
    session?.user?.tier ??
    session?.user?.role ??
    session?.tier ??
    session?.role ??
    "public";

  const flags = session?.user?.flags ?? session?.flags ?? [];
  return resolveAccessTier(t, flags);
}

/**
 * Helper: boolean guards - check if user tier meets or exceeds required
 */
export function isAtLeast(userTier: unknown, required: AccessTier): boolean {
  const u = normalizeUserTier(userTier);
  return hasAccess(u, required);
}

/**
 * Helper: check if user has exactly a specific tier (or higher)
 * @deprecated Use isAtLeast instead - clearer intent
 */
export function hasTierLevel(userTier: unknown, required: AccessTier): boolean {
  return isAtLeast(userTier, required);
}

/**
 * Get all tiers a user can access (their level and below)
 */
export function getAccessibleTiers(userTier: unknown): AccessTier[] {
  const u = normalizeUserTier(userTier);
  const order: AccessTier[] = ["public", "member", "inner-circle", "client", "legacy", "architect", "owner"];
  const userIndex = order.indexOf(u);
  
  if (userIndex === -1) return ["public"];
  return order.slice(0, userIndex + 1);
}

/**
 * UX UTILITY: Tier Labeling (SSOT aligned)
 */
export function getClearanceLabel(tier: AccessTier | unknown): string {
  const normalized = normalizeUserTier(tier);
  
  const labels: Record<AccessTier, string> = {
    'public': 'Public // Level 0',
    'member': 'Member // Level 1',
    'inner-circle': 'Inner Circle // Level 2',
    'client': 'Client // Level 3',
    'legacy': 'Legacy // Level 4',
    'architect': 'Architect // Level 5',
    'owner': 'Owner // Level 6',
  };
  
  return labels[normalized] || `Level ${getTierLevel(normalized)}`;
}

/**
 * Get numeric tier level (1-7)
 */
export function getTierLevel(tier: AccessTier): number {
  const levels: Record<AccessTier, number> = {
    'public': 0,
    'member': 1,
    'inner-circle': 2,
    'client': 3,
    'legacy': 4,
    'architect': 5,
    'owner': 6,
  };
  return levels[tier] || 0;
}

/**
 * Get CSS classes for tier badge
 */
export function getTierBadgeClasses(tier: AccessTier | unknown): string {
  const normalized = normalizeUserTier(tier);
  
  const classes: Record<AccessTier, string> = {
    'public': 'bg-zinc-900 text-zinc-400 border-zinc-800',
    'member': 'bg-blue-950/30 text-blue-400 border-blue-900',
    'inner-circle': 'bg-purple-950/30 text-purple-400 border-purple-900',
    'client': 'bg-emerald-950/30 text-emerald-400 border-emerald-900',
    'legacy': 'bg-amber-950/30 text-amber-400 border-amber-900',
    'architect': 'bg-rose-950/30 text-rose-400 border-rose-900',
    'owner': 'bg-zinc-800 text-zinc-300 border-zinc-700',
  };
  
  return classes[normalized] || classes.public;
}

/**
 * Get icon for tier (emoji or component name)
 */
export function getTierIcon(tier: AccessTier | unknown): string {
  const normalized = normalizeUserTier(tier);
  
  const icons: Record<AccessTier, string> = {
    'public': '🌐',
    'member': '🔑',
    'inner-circle': '⚡',
    'client': '💼',
    'legacy': '🏛️',
    'architect': '🏗️',
    'owner': '👑',
  };
  
  return icons[normalized] || '🔒';
}

/**
 * Sort tiers by hierarchy (lowest to highest)
 */
export function sortTiersByLevel(tiers: (AccessTier | unknown)[]): AccessTier[] {
  return [...tiers]
    .map(t => normalizeUserTier(t))
    .sort((a, b) => getTierLevel(a) - getTierLevel(b));
}

/**
 * Get the highest tier from a list
 */
export function getHighestTier(tiers: (AccessTier | unknown)[]): AccessTier {
  const normalized = tiers.map(t => normalizeUserTier(t));
  return normalized.reduce((highest, current) => 
    getTierLevel(current) > getTierLevel(highest) ? current : highest
  , 'public');
}