// lib/positioning/buyer-paths.ts
// Maps buyer state to the correct product path. No dead-end commercial branches.

import type { BuyerType } from "./category-model";
import type { OfferPackage } from "./package-model";

export type BuyerState =
  | "first_time_structural_pressure"
  | "board_sponsor_direct"
  | "institutional_direct"
  | "leader_team_validation"
  | "monitored_account"
  | "escalated_case"
  | "returning_with_evidence"
  | "asset_seeker";

export type BuyerPathResult = {
  buyerType: BuyerType;
  currentState: BuyerState;
  recommendedPackage: OfferPackage;
  reason: string;
  nextSurface: string;
  alternatePackages: OfferPackage[];
};

type BuyerPathInput = {
  buyerType?: BuyerType;
  hasCompletedDiagnostics?: boolean;
  hasPriorReport?: boolean;
  hasTeamCampaign?: boolean;
  hasMonitoringHistory?: boolean;
  constitutionalRoute?: "STRATEGY" | "DIAGNOSTIC" | "REJECT" | null;
  isSponsored?: boolean;
  isInstitutional?: boolean;
};

export function resolveBuyerPath(input: BuyerPathInput): BuyerPathResult {
  const buyerType = input.buyerType ?? "executive";

  // Board sponsor / institutional → direct sponsored Executive Reporting
  if (input.isSponsored || input.isInstitutional || buyerType === "board_sponsor" || buyerType === "institutional_client") {
    return {
      buyerType: input.isInstitutional ? "institutional_client" : "board_sponsor",
      currentState: input.isInstitutional ? "institutional_direct" : "board_sponsor_direct",
      recommendedPackage: "executive_report_sponsored",
      reason: "Direct institutional intake. Diagnostic ladder optional — evidence is collected in the sponsored intake.",
      nextSurface: "/diagnostics/executive-reporting",
      alternatePackages: ["strategy_room_escalation", "monitoring_subscription"],
    };
  }

  // Escalated case with STRATEGY route → Strategy Room
  if (input.constitutionalRoute === "STRATEGY" && input.hasCompletedDiagnostics) {
    return {
      buyerType,
      currentState: "escalated_case",
      recommendedPackage: "strategy_room_escalation",
      reason: "Constitutional route is STRATEGY and diagnostic evidence is complete. Escalation is justified.",
      nextSurface: "/strategy-room",
      alternatePackages: ["executive_report_single"],
    };
  }

  // Monitored account with recurring evidence → monitoring subscription
  if (input.hasMonitoringHistory && input.hasPriorReport) {
    return {
      buyerType,
      currentState: "monitored_account",
      recommendedPackage: "monitoring_subscription",
      reason: "Prior report and monitoring history exist. Longitudinal observation extends the flagship.",
      nextSurface: "/diagnostics/watch",
      alternatePackages: ["executive_report_single", "strategy_room_escalation"],
    };
  }

  // Leader needing team validation → Team Reality Campaign → Executive Reporting
  if (input.hasTeamCampaign || buyerType === "operator") {
    return {
      buyerType,
      currentState: "leader_team_validation",
      recommendedPackage: "team_reality_campaign",
      reason: "Team evidence strengthens Executive Reporting. Respondent-based assessment produces higher-confidence findings.",
      nextSurface: "/diagnostics/team-assessment",
      alternatePackages: ["executive_report_single"],
    };
  }

  // Returning with evidence → Executive Reporting directly
  if (input.hasCompletedDiagnostics || input.hasPriorReport) {
    return {
      buyerType,
      currentState: "returning_with_evidence",
      recommendedPackage: "executive_report_single",
      reason: "Diagnostic evidence exists. Executive Reporting translates evidence into governed position.",
      nextSurface: "/diagnostics/executive-reporting",
      alternatePackages: ["team_reality_campaign", "monitoring_subscription"],
    };
  }

  // First-time executive with structural pressure → diagnostic ladder → Executive Reporting
  return {
    buyerType,
    currentState: "first_time_structural_pressure",
    recommendedPackage: "executive_report_single",
    reason: "Start with the diagnostic ladder to build evidence. Executive Reporting is the destination.",
    nextSurface: "/diagnostics",
    alternatePackages: ["team_reality_campaign"],
  };
}

export function resolveBuyerPathFromQuery(query: Record<string, string | string[] | undefined>): BuyerPathResult {
  return resolveBuyerPath({
    buyerType: (typeof query.buyer === "string" ? query.buyer : undefined) as BuyerType | undefined,
    isSponsored: query.sponsored === "true",
    isInstitutional: query.institutional === "true",
    hasCompletedDiagnostics: query.diagnostics === "complete",
    hasPriorReport: query.prior === "true",
    hasTeamCampaign: query.team === "true",
    hasMonitoringHistory: query.monitoring === "true",
    constitutionalRoute: (typeof query.route === "string" ? query.route : null) as "STRATEGY" | "DIAGNOSTIC" | "REJECT" | null,
  });
}
