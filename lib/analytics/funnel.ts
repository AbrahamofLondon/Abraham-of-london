/**
 * lib/analytics/funnel.ts — Diagnostics funnel journey tracking
 *
 * Uses sessionStorage for lightweight, same-session journey state.
 * Fires GA4 events via track.ts.
 * Never throws. Never blocks rendering. No PII stored.
 */

import { track } from "./track";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FunnelStage =
  | "constitutional"
  | "team"
  | "enterprise"
  | "executive"
  | "strategy-room";

export type FunnelPath = "unknown" | "diagnostic" | "strategy";

export type FunnelOutcome = "reject" | "diagnostic" | "strategy" | "complete";

type JourneyState = {
  startedAt: number;
  stagesCompleted: FunnelStage[];
  currentStage: FunnelStage | null;
  currentStageStartedAt: number | null;
  pathType: FunnelPath;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "aol_diagnostics_session";

const STAGE_NUMBERS: Record<FunnelStage, number> = {
  constitutional: 1,
  team: 2,
  enterprise: 3,
  executive: 4,
  "strategy-room": 5,
};

// ---------------------------------------------------------------------------
// Session state helpers
// ---------------------------------------------------------------------------

function getJourney(): JourneyState {
  if (typeof window === "undefined") {
    return makeEmpty();
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return makeEmpty();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return makeEmpty();
    return parsed as JourneyState;
  } catch {
    return makeEmpty();
  }
}

function saveJourney(state: JourneyState): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — degrade silently
  }
}

function makeEmpty(): JourneyState {
  return {
    startedAt: Date.now(),
    stagesCompleted: [],
    currentStage: null,
    currentStageStartedAt: null,
    pathType: "unknown",
  };
}

// ---------------------------------------------------------------------------
// Public API — called from page components
// ---------------------------------------------------------------------------

/**
 * Called when a user first enters the diagnostics funnel.
 * Initializes the journey session if not already started.
 */
export function trackFunnelEntry(entryRoute: string): void {
  let journey = getJourney();

  // Only initialize if the session is fresh (no stages completed)
  if (journey.stagesCompleted.length === 0 && !journey.currentStage) {
    journey = {
      ...makeEmpty(),
      startedAt: Date.now(),
    };
    saveJourney(journey);
  }

  track("diagnostics_entry", {
    entry_route: entryRoute,
    referrer: typeof document !== "undefined" ? document.referrer || "direct" : "unknown",
  });
}

/**
 * Called when a user begins a diagnostic stage.
 * Fires exactly once per stage start (idempotent within a render).
 */
export function trackStageStart(stage: FunnelStage): void {
  const journey = getJourney();

  // Already tracking this stage — skip duplicate fire
  if (journey.currentStage === stage) return;

  journey.currentStage = stage;
  journey.currentStageStartedAt = Date.now();
  saveJourney(journey);

  // Persist funnel stage for cross-event context
  try { sessionStorage.setItem("aol_funnel_stage", `${stage}_started`); } catch {}

  track("diagnostics_stage_start", {
    stage,
    step_number: STAGE_NUMBERS[stage] ?? 0,
    path_type: journey.pathType,
    stages_completed: journey.stagesCompleted.length,
    origin: typeof sessionStorage !== "undefined" ? sessionStorage.getItem("aol_diagnostics_origin") || "direct" : "direct",
  });
}

/**
 * Called when a user completes a diagnostic stage.
 * Records outcome and duration, advances journey state.
 */
export function trackStageComplete(
  stage: FunnelStage,
  outcome: FunnelOutcome,
  nextStep?: string,
): void {
  const journey = getJourney();
  const durationMs = journey.currentStageStartedAt
    ? Date.now() - journey.currentStageStartedAt
    : 0;

  // Update path type based on routing outcome
  if (outcome === "diagnostic" && journey.pathType === "unknown") {
    journey.pathType = "diagnostic";
  } else if (outcome === "strategy" && journey.pathType === "unknown") {
    journey.pathType = "strategy";
  }

  // Add to completed stages (no duplicates)
  if (!journey.stagesCompleted.includes(stage)) {
    journey.stagesCompleted.push(stage);
  }

  journey.currentStage = null;
  journey.currentStageStartedAt = null;
  saveJourney(journey);

  // Persist funnel stage for cross-event context
  try { sessionStorage.setItem("aol_funnel_stage", `${stage}_completed`); } catch {}

  track("diagnostics_stage_complete", {
    stage,
    outcome,
    duration_ms: durationMs,
    duration_seconds: Math.round(durationMs / 1000),
    next_step: nextStep || "none",
    path_type: journey.pathType,
    stages_completed: journey.stagesCompleted.length,
    origin: typeof sessionStorage !== "undefined" ? sessionStorage.getItem("aol_diagnostics_origin") || "direct" : "direct",
  });
}

/**
 * Called when a user enters the Strategy Room (highest-value event).
 */
export function trackStrategyRoomEntry(sourceStage?: FunnelStage): void {
  const journey = getJourney();
  const totalJourneyTime = Date.now() - journey.startedAt;

  track("strategy_room_entry", {
    source_stage: sourceStage || journey.stagesCompleted[journey.stagesCompleted.length - 1] || "direct",
    path_type: journey.pathType,
    total_journey_time_ms: totalJourneyTime,
    stages_completed: journey.stagesCompleted.length,
    stages_list: journey.stagesCompleted.join(","),
  });
}

/**
 * Called when a Strategy Room enrolment is submitted.
 */
export function trackStrategyRoomConversion(): void {
  const journey = getJourney();
  const totalJourneyTime = Date.now() - journey.startedAt;

  track("strategy_room_conversion", {
    journey_depth: journey.stagesCompleted.length,
    path_type: journey.pathType,
    total_journey_time_ms: totalJourneyTime,
    stages_list: journey.stagesCompleted.join(","),
  });
}

/**
 * Called on page unload to detect drop-off.
 * Uses navigator.sendBeacon for reliability.
 */
export function trackDropoff(stage: FunnelStage): void {
  const journey = getJourney();
  const timeSpentMs = journey.currentStageStartedAt
    ? Date.now() - journey.currentStageStartedAt
    : 0;

  // Only track if user actually spent time on the stage (>5s)
  if (timeSpentMs < 5000) return;

  track("diagnostics_dropoff", {
    stage,
    time_spent_ms: timeSpentMs,
    stages_completed: journey.stagesCompleted.length,
    path_type: journey.pathType,
  });
}

/**
 * Returns the current journey state for UI display (e.g., progress indicators).
 * Read-only, never modifies state.
 */
export function getJourneySnapshot(): {
  stagesCompleted: FunnelStage[];
  currentStage: FunnelStage | null;
  pathType: FunnelPath;
} {
  const journey = getJourney();
  return {
    stagesCompleted: journey.stagesCompleted,
    currentStage: journey.currentStage,
    pathType: journey.pathType,
  };
}
