/**
 * Assessment Theme — design tokens and constants for Purpose Alignment.
 * Extracted from PurposeAlignmentAssessment.tsx to reduce monolith size.
 */

import type { AlignmentDomain, CoherenceBand } from "./types";

export const GOLD = "#C9A96E";
export const BASE = "rgb(6 6 9)";
export const LIFT = "rgb(10 14 20)";

export const STAGE_DOMAINS: AlignmentDomain[][] = [
  ["identity", "decision"],
  ["environment", "behaviour"],
  ["emotional_order", "legacy"],
];

export const STAGE_LABELS = [
  "Identity & Decision Integrity",
  "Environment & Behaviour",
  "Internal Order & Legacy",
];

export const STAGE_INTROS = [
  "These two domains reveal whether you are operating from a coherent mandate or from accumulated momentum. Answer for the reality of the past 90 days — not your aspirations.",
  "Your environment and your daily behaviour either reinforce your direction or quietly erode it. This stage surfaces the gap between what you say you value and what you actually do.",
  "Emotional order is the foundation beneath every strategic decision. Legacy orientation reveals whether you are building or just moving. Answer precisely.",
];

export const BAND_CONFIG: Record<CoherenceBand, {
  border: string; bg: string; text: string; label: string; reading: string;
}> = {
  SOVEREIGN: {
    border: "rgba(52,211,153,0.25)", bg: "rgba(52,211,153,0.06)", text: "rgba(110,231,183,0.90)",
    label: "Sovereign",
    reading: "Operating at sovereign alignment. Identity, decisions, and behaviour are coherent with stated direction.",
  },
  ALIGNED: {
    border: `${GOLD}30`, bg: `${GOLD}08`, text: `${GOLD}CC`,
    label: "Aligned",
    reading: "Alignment is functional but not unconditional. Specific drift areas are compounding quietly.",
  },
  DRIFTING: {
    border: "rgba(251,146,60,0.25)", bg: "rgba(251,146,60,0.06)", text: "rgba(253,186,116,0.90)",
    label: "Drifting",
    reading: "Meaningful gaps between stated purpose and operational reality. Drift is structural, not circumstantial.",
  },
  FRAGMENTED: {
    border: "rgba(248,113,113,0.25)", bg: "rgba(248,113,113,0.06)", text: "rgba(252,165,165,0.90)",
    label: "Fragmented",
    reading: "Alignment has broken down across multiple domains. Strategic action without reconstruction will compound the problem.",
  },
};
