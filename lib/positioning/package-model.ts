// lib/positioning/package-model.ts
// Canonical offer/package architecture. Executive Reporting = core. Everything else orbits.

import type { BuyerType } from "./category-model";

export type OfferPackage =
  | "executive_report_single"
  | "executive_report_sponsored"
  | "team_reality_campaign"
  | "monitoring_subscription"
  | "strategy_room_escalation"
  | "asset_access_membership";

export type PackageDefinition = {
  id: OfferPackage;
  label: string;
  description: string;
  includes: string[];
  requiredEvidence: string[];
  deliveryMode: string;
  primaryBuyer: BuyerType[];
  flagshipRole: "core" | "adjacent" | "support";
  entrySurface: string;
  nextValidOffers: OfferPackage[];
  priceIndicator: string;
};

export const PACKAGES: Record<OfferPackage, PackageDefinition> = {
  executive_report_single: {
    id: "executive_report_single",
    label: "Executive Report",
    description: "The governed executive brief. Position, consequence, priority stack.",
    includes: [
      "Constitutional position statement",
      "Financial exposure estimate",
      "Governed priority stack",
      "Failure mode identification",
      "Trajectory outlook (bounded scenario)",
      "3-page PDF + 1-page boardroom briefing",
    ],
    requiredEvidence: ["Structured executive intake (22 fields)"],
    deliveryMode: "Immediate digital report + PDF export",
    primaryBuyer: ["executive", "founder", "board_sponsor"],
    flagshipRole: "core",
    entrySurface: "/diagnostics/executive-reporting",
    nextValidOffers: ["strategy_room_escalation", "monitoring_subscription", "team_reality_campaign"],
    priceIndicator: "£95",
  },
  executive_report_sponsored: {
    id: "executive_report_sponsored",
    label: "Sponsored Executive Report",
    description: "Direct institutional intake. Bypasses public diagnostic ladder.",
    includes: [
      "All executive report outputs",
      "Direct institutional intake mode",
      "Board-sponsor attribution",
      "Dedicated campaign context",
    ],
    requiredEvidence: ["Sponsored intake form", "Institutional identity verification"],
    deliveryMode: "Governed digital report + PDF export",
    primaryBuyer: ["board_sponsor", "institutional_client"],
    flagshipRole: "core",
    entrySurface: "/diagnostics/executive-reporting",
    nextValidOffers: ["strategy_room_escalation", "monitoring_subscription"],
    priceIndicator: "£95",
  },
  team_reality_campaign: {
    id: "team_reality_campaign",
    label: "Team Reality Campaign",
    description: "Respondent-based team evidence. Strengthens Executive Reporting.",
    includes: [
      "Campaign creation + invite management",
      "Anonymous respondent collection",
      "Multi-respondent sentiment aggregation",
      "Leader-vs-team gap analysis",
      "Confidence and coverage metrics",
    ],
    requiredEvidence: ["Minimum 3 respondents for directional signal", "5+ for anonymity-safe reporting"],
    deliveryMode: "Ongoing campaign with aggregated reporting",
    primaryBuyer: ["executive", "founder", "operator"],
    flagshipRole: "adjacent",
    entrySurface: "/diagnostics/team-assessment",
    nextValidOffers: ["executive_report_single", "executive_report_sponsored"],
    priceIndicator: "Included with Executive Reporting",
  },
  monitoring_subscription: {
    id: "monitoring_subscription",
    label: "Monitoring",
    description: "Longitudinal observation. Extends Executive Reporting over time.",
    includes: [
      "Recurring diagnostic snapshots",
      "Movement-over-time tracking",
      "Persistent tension monitoring",
      "Trajectory progression",
      "Intervention effect assessment",
    ],
    requiredEvidence: ["At least 2 recurring snapshots for monitoring claim"],
    deliveryMode: "Recurring governed observation",
    primaryBuyer: ["executive", "board_sponsor", "institutional_client"],
    flagshipRole: "adjacent",
    entrySurface: "/diagnostics/watch",
    nextValidOffers: ["executive_report_single", "strategy_room_escalation"],
    priceIndicator: "Contact",
  },
  strategy_room_escalation: {
    id: "strategy_room_escalation",
    label: "Strategy Room",
    description: "Escalation environment. Opens when intervention is warranted.",
    includes: [
      "Governed escalation intake",
      "Constitutional decision authority enforcement",
      "Strategic intervention framework",
      "Mandate development",
    ],
    requiredEvidence: [
      "Constitutional route = STRATEGY",
      "Escalation governor: confidence >= 0.55",
      "No active disqualifiers",
    ],
    deliveryMode: "Governed escalation session",
    primaryBuyer: ["executive", "board_sponsor", "institutional_client"],
    flagshipRole: "adjacent",
    entrySurface: "/strategy-room",
    nextValidOffers: ["monitoring_subscription"],
    priceIndicator: "£395",
  },
  asset_access_membership: {
    id: "asset_access_membership",
    label: "Inner Circle",
    description: "Continuous access. Removes per-asset friction.",
    includes: [
      "All paid frameworks and decision assets",
      "Intelligence briefs",
      "Reports as published",
      "No per-asset purchase gates",
    ],
    requiredEvidence: [],
    deliveryMode: "Continuous access",
    primaryBuyer: ["executive", "founder", "advisor"],
    flagshipRole: "support",
    entrySurface: "/inner-circle",
    nextValidOffers: ["executive_report_single", "team_reality_campaign"],
    priceIndicator: "Invitation-controlled",
  },
};

export function resolvePackage(id: OfferPackage): PackageDefinition {
  return PACKAGES[id];
}

export function listPackages(): PackageDefinition[] {
  return Object.values(PACKAGES);
}

export function listPackagesByRole(role: "core" | "adjacent" | "support"): PackageDefinition[] {
  return Object.values(PACKAGES).filter((p) => p.flagshipRole === role);
}
