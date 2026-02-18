// lib/auth-utils.ts
import crypto from "crypto";
import type { AoLTier } from "@/types/next-auth";

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
  const internalMarkers = ["internal", "staff", "private_access", "admin", "director"];
  return flags.some((flag) => internalMarkers.includes(String(flag).toLowerCase()));
}

/**
 * TIER MAPPING: DB tier -> AoLTier
 * IMPORTANT: Do NOT use "inner-circle" if AoLTier doesn't define it.
 */
export function mapMemberTierToAoLTier(dbTier: string | null, flags: string[]): AoLTier {
  if (hasInternalFlag(flags) || String(dbTier || "").toLowerCase() === "director") {
    return "private" as AoLTier;
  }

  const t = String(dbTier || "").toLowerCase();

  // Highest tiers
  if (t.includes("elite") || t.includes("enterprise") || t.includes("l4") || t.includes("architect")) {
    return "architect" as AoLTier;
  }

  // Premium tiers
  if (t.includes("plus") || t.includes("premium") || t.includes("l3")) {
    return "premium" as AoLTier;
  }

  // Standard member tiers (map "inner-circle" concept to "member")
  if (t.includes("member") || t.includes("inner") || t.includes("l2") || t.includes("standard")) {
    return "member" as AoLTier;
  }

  // Free tier
  if (t.includes("free") || t.includes("trial") || t.includes("l1")) {
    return "free" as AoLTier;
  }

  return "public" as AoLTier;
}

/**
 * UX UTILITY: Tier Labeling
 */
export function getClearanceLabel(tier: AoLTier): string {
  switch (tier) {
    case "private":
      return "Classified // Level 5";
    case "architect":
      return "Architect // Level 4";
    case "premium":
      return "Premium // Level 3";
    case "member":
      return "Member // Level 2";
    case "free":
      return "Free // Level 1";
    case "public":
    default:
      return "Standard // Level 1";
  }
}