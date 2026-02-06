/* lib/resources/tier-metadata.ts */

export interface TierDirective {
  tier: string;
  mandate: string;
  focusNodes: string[];
  riskThreshold: string;
}

export const TIER_DIRECTIVES: Record<string, TierDirective> = {
  Board: {
    tier: "Board",
    mandate: "Fiduciary Sovereignty & Long-Range Survival",
    focusNodes: ["Capital Structure", "Governance", "Succession"],
    riskThreshold: "Existential / Systemic",
  },
  Founder: {
    tier: "Founder",
    mandate: "Operational Agency & Velocity Calibration",
    focusNodes: ["Product-Logic", "Talent Density", "Market-Entry"],
    riskThreshold: "Strategic / Competitive",
  },
  Household: {
    tier: "Household",
    mandate: "Legacy Persistence & Private Stability",
    focusNodes: ["Asset Protection", "Knowledge Transfer", "Privacy"],
    riskThreshold: "Generational / Personal",
  },
};