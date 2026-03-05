/* lib/resources/tier-metadata.ts — SSOT ALIGNED (NO UNDEFINED) */

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier, getTierLabel } from "@/lib/access/tier-policy";

export interface TierDirective {
  /** SSOT access tier required */
  tier: AccessTier;

  /** Original display value for UI (e.g., "Board", "Founder") */
  displayTier?: string;

  mandate: string;
  focusNodes: string[];
  riskThreshold: string;
}

/**
 * Display tiers (your domain language)
 * Keep this list closed so TS can never return "undefined" for mappings.
 */
type DisplayTier =
  | "Board"
  | "Founder"
  | "Household"
  | "Director"
  | "Partner"
  | "Principal";

/**
 * Strict mapping: DisplayTier -> AccessTier
 * ✅ No undefined possible.
 */
const tierMapping: Record<DisplayTier, AccessTier> = {
  Board: "architect",
  Founder: "architect",
  Household: "client",
  Director: "owner",
  Partner: "architect",
  Principal: "owner",
};

/** Small helper: normalize + guarantee a valid AccessTier */
function normalizeTier(tier: AccessTier | string | undefined | null): AccessTier {
  // normalizeRequiredTier should return AccessTier, but we still harden it.
  const normalized = normalizeRequiredTier((tier ?? "public") as any);
  return (normalized ?? "public") as AccessTier;
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
    riskThreshold: "Existential / Systemic",
  },

  Founder: {
    tier: tierMapping.Founder,
    displayTier: "Founder",
    mandate: "Operational Agency & Velocity Calibration",
    focusNodes: ["Product-Logic", "Talent Density", "Market-Entry"],
    riskThreshold: "Strategic / Competitive",
  },

  Household: {
    tier: tierMapping.Household,
    displayTier: "Household",
    mandate: "Legacy Persistence & Private Stability",
    focusNodes: ["Asset Protection", "Knowledge Transfer", "Privacy"],
    riskThreshold: "Generational / Personal",
  },

  Director: {
    tier: tierMapping.Director,
    displayTier: "Director",
    mandate: "Control, Stewardship & Institutional Integrity",
    focusNodes: ["Controls", "Risk", "Governance Cadence"],
    riskThreshold: "Board / Enterprise",
  },

  Partner: {
    tier: tierMapping.Partner,
    displayTier: "Partner",
    mandate: "Strategic Leverage & Coalition Execution",
    focusNodes: ["Partnership Architecture", "Distribution", "Credibility"],
    riskThreshold: "Strategic / Market",
  },

  Principal: {
    tier: tierMapping.Principal,
    displayTier: "Principal",
    mandate: "Ownership Authority & Final Accountability",
    focusNodes: ["Decision Rights", "Capital Allocation", "Succession Logic"],
    riskThreshold: "Existential / Ultimate",
  },
};

/**
 * Get directive by SSOT tier (e.g., "member", "client", "architect", etc.)
 * Returns the first directive that maps to that AccessTier.
 */
export function getDirectiveByTier(tier: AccessTier | string): TierDirective | undefined {
  const normalized = normalizeTier(tier);
  return Object.values(TIER_DIRECTIVES).find((d) => d.tier === normalized);
}

/**
 * Get the label shown in UI for a tier.
 * If a directive exists, use its displayTier; otherwise fallback to tier-policy label.
 */
export function getDirectiveLabel(tier: AccessTier | string): string {
  const normalized = normalizeTier(tier);
  const directive = getDirectiveByTier(normalized);
  return directive?.displayTier || getTierLabel(normalized);
}

export default TIER_DIRECTIVES;