/* lib/resources/tier-metadata.ts — SSOT ALIGNED (LOGIC GAP CLOSED) */

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier, getTierLabel } from "@/lib/access/tier-policy";

export interface TierDirective {
  /** SSOT access tier required */
  tier: AccessTier;

  /** Original display value for UI (e.g., "Board", "Founder") */
  displayTier: string;

  mandate: string;
  focusNodes: string[];
  riskLevel: string;
}

/**
 * Display tiers (domain language)
 * Strictly typed to prevent undefined mappings.
 */
export type DisplayTier =
  | "Board"
  | "Founder"
  | "Household"
  | "Director"
  | "Partner"
  | "Principal";

/**
 * Strict mapping: DisplayTier -> AccessTier
 * ✅ Maintains the 1-to-Many relationship (Tiers can have multiple Roles)
 */
const tierMapping: Record<DisplayTier, AccessTier> = {
  Board: "architect",
  Founder: "architect",
  Household: "client",
  Director: "owner",
  Partner: "architect",
  Principal: "owner",
};

/**
 * Internal helper: Hardened normalization to guarantee a valid AccessTier
 */
function normalizeTier(tier: AccessTier | string | undefined | null): AccessTier {
  const raw = typeof tier === "string" ? tier : "public";
  const normalized = normalizeRequiredTier(raw);
  return (normalized || "public") as AccessTier;
}

/**
 * Canon directives (UI metadata + governance framing)
 */
export const TIER_DIRECTIVES: Record<DisplayTier, TierDirective> = {
  Board: {
    tier: tierMapping.Board,
    displayTier: "Board",
    mandate: "Fiduciary Sovereignty & Long-Range Survival",
    focusNodes: ["Capital Structure", "Governance", "Succession"],
    riskLevel: "Existential / Systemic",
  },

  Founder: {
    tier: tierMapping.Founder,
    displayTier: "Founder",
    mandate: "Operational Agency & Velocity Calibration",
    focusNodes: ["Product-Logic", "Talent Density", "Market-Entry"],
    riskLevel: "Strategic / Competitive",
  },

  Household: {
    tier: tierMapping.Household,
    displayTier: "Household",
    mandate: "Legacy Persistence & Private Stability",
    focusNodes: ["Asset Protection", "Knowledge Transfer", "Privacy"],
    riskLevel: "Generational / Personal",
  },

  Director: {
    tier: tierMapping.Director,
    displayTier: "Director",
    mandate: "Control, Stewardship & Institutional Integrity",
    focusNodes: ["Controls", "Risk", "Governance Cadence"],
    riskLevel: "Board / Enterprise",
  },

  Partner: {
    tier: tierMapping.Partner,
    displayTier: "Partner",
    mandate: "Strategic Leverage & Coalition Execution",
    focusNodes: ["Partnership Architecture", "Distribution", "Credibility"],
    riskLevel: "Strategic / Market",
  },

  Principal: {
    tier: tierMapping.Principal,
    displayTier: "Principal",
    mandate: "Ownership Authority & Final Accountability",
    focusNodes: ["Decision Rights", "Capital Allocation", "Succession Logic"],
    riskLevel: "Existential / Ultimate",
  },
};

/**
 * Get directive by SSOT tier (e.g., "architect").
 * @param tier - The system AccessTier
 * @param preferredDisplay - Optional role (e.g., "Founder") to resolve many-to-one conflicts.
 */
export function getDirectiveByTier(
  tier: AccessTier | string,
  preferredDisplay?: string
): TierDirective | undefined {
  const normalized = normalizeTier(tier);
  const allDirectives = Object.values(TIER_DIRECTIVES);

  // 1. If we have a preference (from user profile/role), try to find that specific match first.
  if (preferredDisplay) {
    const specificMatch = allDirectives.find(
      (d) => d.displayTier.toLowerCase() === preferredDisplay.toLowerCase() && d.tier === normalized
    );
    if (specificMatch) return specificMatch;
  }

  // 2. Fallback: Return the first directive that matches the system tier.
  return allDirectives.find((d) => d.tier === normalized);
}

/**
 * Get the label shown in UI for a tier.
 * Prioritizes the specific metadata label over the generic policy label.
 */
export function getDirectiveLabel(tier: AccessTier | string, preferredDisplay?: string): string {
  const normalized = normalizeTier(tier);
  const directive = getDirectiveByTier(normalized, preferredDisplay);
  return directive?.displayTier || getTierLabel(normalized);
}

export default TIER_DIRECTIVES;