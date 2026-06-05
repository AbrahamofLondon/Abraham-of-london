/* lib/inner-circle/commercial-bridge.ts — P0: Commercial Conversion Bridge */
/* Routes diagnostic risk levels to the correct product path with safe context passing. */

import { productRoute } from "@/lib/inner-circle/operating-layer";
import type { RiskLevel } from "@/lib/inner-circle/operating-layer";

export type ConversionAction =
  | "continue_inner_circle"
  | "start_boardroom_brief"
  | "start_strategy_room"
  | "request_private_council"
  | "request_enterprise_scan";

export type ConversionBridge = {
  action: ConversionAction;
  label: string;
  href: string;
  reason: string;
  prefillContext?: Record<string, string>;
};

/**
 * Determine the correct conversion action based on risk level and history.
 * 
 * - Low/Medium → continue Inner Circle path
 * - High → Boardroom Brief recommended
 * - Critical → Strategy Room recommended
 * - Repeated High/Critical → Private Council review available
 */
export function getConversionBridge(
  riskLevel: RiskLevel,
  isCouncilCandidate: boolean,
  diagnosticId?: string,
): ConversionBridge {
  // Council Candidates get Private Council as primary option
  if (isCouncilCandidate) {
    return {
      action: "request_private_council",
      label: "Request Private Council Review",
      href: "/inner-circle/council-request",
      reason: "Repeated high-severity diagnostics indicate board-level exposure requiring structured governance intervention.",
      prefillContext: diagnosticId ? {
        diagnosticId,
        source: "inner-circle-council-candidate",
      } : undefined,
    };
  }

  switch (riskLevel) {
    case "Critical":
      return {
        action: "start_strategy_room",
        label: "Start Strategy Room Review",
        href: "/strategy-room",
        reason: "This has exceeded self-guided review. A Strategy Room review is recommended to move severe decision risk into live intervention.",
        prefillContext: diagnosticId ? {
          diagnosticId,
          source: "inner-circle-critical",
        } : undefined,
      };

    case "High":
      return {
        action: "start_boardroom_brief",
        label: "Start Boardroom Brief",
        href: diagnosticId ? `/api/inner-circle/boardroom-bridge` : "/boardroom-brief",
        reason: "Your score indicates board-level exposure. A Boardroom Brief is recommended to convert the risk into a board-ready challenge dossier.",
        prefillContext: diagnosticId ? {
          diagnosticId,
          source: "inner-circle-high",
        } : undefined,
      };

    case "Medium":
      return {
        action: "continue_inner_circle",
        label: "Continue Inner Circle Path",
        href: "/inner-circle/dashboard",
        reason: "Your current risk is controlled. Complete your first 30-day worksheet action to maintain governed momentum.",
      };

    case "Low":
    default:
      return {
        action: "continue_inner_circle",
        label: "Continue Inner Circle Path",
        href: "/inner-circle/dashboard",
        reason: "Your current risk is low. Continue monitoring through the Inner Circle operating layer.",
      };
  }
}

/**
 * Build a safe context URL parameter string from prefill context.
 * Never includes raw user text, decision text, or concern text.
 * Only includes: diagnosticId, source, riskLevel (as score band).
 */
export function buildSafeContextQuery(context?: Record<string, string>): string {
  if (!context) return "";
  const safe: Record<string, string> = {};
  
  if (context.diagnosticId) safe.diag = context.diagnosticId.slice(0, 16);
  if (context.source) safe.src = context.source;
  
  const params = new URLSearchParams(safe);
  return params.toString();
}
