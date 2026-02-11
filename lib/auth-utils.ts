import crypto from "crypto";
import type { AoLTier } from "@/types/next-auth";

/**
 * UTILITY: Deterministic Identity Hashing (SHA-256)
 * Used for anonymizing member emails and validating Master Keys.
 */
export function sha256Hex(input: string): string {
  if (!input) return "";
  return crypto.createHash("sha256").update(input.trim().toLowerCase()).digest("hex");
}

/**
 * UTILITY: Flag Sanitization
 * Safely parses the JSON string storage from Neon/Prisma into a string array.
 */
export function safeParseFlags(flagsJson?: string | null): string[] {
  if (!flagsJson) return [];
  try {
    // Handle cases where data might already be an array or a JSON string
    const parsed = typeof flagsJson === 'string' ? JSON.parse(flagsJson) : flagsJson;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (e) {
    console.warn("[AUTH_UTILS]: Failed to parse flags", e);
    return [];
  }
}

/**
 * SECURITY: Internal Marker Check
 * Determines if a user carries administrative or staff-level clearance.
 */
export function hasInternalFlag(flags: string[]): boolean {
  const internalMarkers = ["internal", "staff", "private_access", "admin", "director"];
  return flags.some(flag => internalMarkers.includes(flag.toLowerCase()));
}

/**
 * TIER MAPPING: Logic Engine
 * Translates database-level subscription tiers into Directorate OS access levels.
 */
export function mapMemberTierToAoLTier(dbTier: string | null, flags: string[]): AoLTier {
  // 1. Internal/Director flags take absolute precedence
  if (hasInternalFlag(flags) || dbTier?.toLowerCase() === "director") {
    return "private";
  }

  const t = (dbTier || "").toLowerCase();
  
  // 2. High-tier "Inner Circle" mappings
  if (t.includes("elite") || t.includes("enterprise") || t.includes("l4")) {
    return "inner-circle-elite";
  }
  
  if (t.includes("plus") || t.includes("premium") || t.includes("l3")) {
    return "inner-circle-plus";
  }
  
  // 3. Standard active membership
  if (t.includes("member") || t.includes("inner") || t.includes("l2")) {
    return "inner-circle";
  }

  // 4. Fallback for unverified or public status
  return "public";
}

/**
 * UX UTILITY: Tier Labeling
 * Returns the human-readable clearance label used in the AccessGate.
 */
export function getClearanceLabel(tier: AoLTier): string {
  switch (tier) {
    case "private": return "Classified // Level 5";
    case "inner-circle-elite": return "Elite // Level 4";
    case "inner-circle-plus": return "Premium // Level 3";
    case "inner-circle": return "Inner Circle // Level 2";
    default: return "Standard // Level 1";
  }
}