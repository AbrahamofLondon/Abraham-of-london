/**
 * lib/analytics/journey-client.ts — Client-side journey event emitter
 *
 * Lightweight fire-and-forget. Never throws. Never blocks rendering.
 * Uses navigator.sendBeacon where available for reliability on unload.
 */

import type { JourneyStage, JourneyContext } from "./decision-journey";

// Re-export types for convenience
export type { JourneyStage, JourneyContext };

const ENDPOINT = "/api/analytics/journey";
const SESSION_KEY = "aol_journey_session_id";

// ---------------------------------------------------------------------------
// Session ID management
// ---------------------------------------------------------------------------

function getSessionId(): string {
  if (typeof window === "undefined") return "server";

  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `j_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `j_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

// ---------------------------------------------------------------------------
// Core emit function
// ---------------------------------------------------------------------------

export function emitJourneyEvent(
  stage: JourneyStage,
  context?: JourneyContext,
): void {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    sessionId: getSessionId(),
    stage,
    context: context ?? {},
  });

  // Prefer sendBeacon for reliability (works during page unload)
  if (navigator.sendBeacon) {
    try {
      navigator.sendBeacon(ENDPOINT, payload);
      return;
    } catch {
      // Fall through to fetch
    }
  }

  // Fallback to fetch (fire-and-forget)
  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Silent — never block the UI
  });
}

// ---------------------------------------------------------------------------
// Convenience functions for mandatory tracking points
// ---------------------------------------------------------------------------

// Homepage
export function trackLanding(entryPath?: string): void {
  emitJourneyEvent("landing", { entryPath: entryPath ?? window.location.pathname });
}

export function trackBundleClick(bundleId: string, price?: number): void {
  emitJourneyEvent("bundle_click", { bundleId, price });
}

// Diagnostics
export function trackDiagnosticStart(diagnosticRoute?: string): void {
  emitJourneyEvent("diagnostic_start", { diagnosticRoute });
}

export function trackDiagnosticComplete(
  diagnosticRoute?: string,
  evidenceDepth?: number,
): void {
  emitJourneyEvent("diagnostic_complete", { diagnosticRoute, evidenceDepth });
}

export function trackDiagnosticAbandon(stageIndex: number): void {
  emitJourneyEvent("diagnostic_abandon", { stageIndex });
}

// Team Assessment
export function trackTeamModeSelected(buyerState: string): void {
  emitJourneyEvent("team_mode_selected", { buyerState });
}

export function trackCampaignCreated(sessionKey?: string): void {
  emitJourneyEvent("campaign_created", { sessionKey });
}

export function trackFirstRespondent(sessionKey?: string): void {
  emitJourneyEvent("first_respondent", { sessionKey });
}

export function trackCampaignClosed(sessionKey?: string): void {
  emitJourneyEvent("campaign_closed", { sessionKey });
}

// Enterprise
export function trackEnterpriseComplete(evidenceDepth?: number): void {
  emitJourneyEvent("enterprise_complete", { evidenceDepth });
}

// Executive Reporting
export function trackExecGateView(): void {
  emitJourneyEvent("exec_gate_view");
}

export function trackExecPurchaseStart(): void {
  emitJourneyEvent("exec_purchase_start");
}

export function trackExecPurchase(price?: number): void {
  emitJourneyEvent("exec_purchase", { price: price ?? 95 });
}

export function trackExecRunStart(): void {
  emitJourneyEvent("exec_run_start");
}

export function trackExecReportGenerated(): void {
  emitJourneyEvent("exec_report_generated");
}

// Decision instruments
export function trackAssetPurchaseStart(bundleId: string, price?: number): void {
  emitJourneyEvent("asset_purchase_start", { bundleId, price });
}

export function trackAssetPurchase(bundleId: string, price?: number): void {
  emitJourneyEvent("asset_purchase", { bundleId, price });
}

export function trackAssetOpen(bundleId: string): void {
  emitJourneyEvent("asset_open", { bundleId });
}

export function trackAssetComplete(bundleId: string, diagnosticRoute?: string): void {
  emitJourneyEvent("asset_complete", { bundleId, diagnosticRoute });
}

export function trackAssetTransition(bundleId: string, diagnosticRoute: string): void {
  emitJourneyEvent("asset_transition", { bundleId, diagnosticRoute });
}

// WATCH
export function trackWatchState(): void {
  emitJourneyEvent("watch_state");
}

export function trackWatchFollowup(): void {
  emitJourneyEvent("watch_followup");
}

// Strategy Room
export function trackStrategyGateView(): void {
  emitJourneyEvent("strategy_gate_view");
}

export function trackStrategyAttempt(escalationLevel?: string): void {
  emitJourneyEvent("strategy_attempt", { escalationLevel });
}

export function trackStrategyAllowed(): void {
  emitJourneyEvent("strategy_allowed");
}

export function trackStrategyBlocked(escalationLevel?: string): void {
  emitJourneyEvent("strategy_blocked", { escalationLevel });
}
