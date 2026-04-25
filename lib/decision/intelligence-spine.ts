/**
 * IntelligenceSpine — the single contract across every stage.
 *
 * Every stage reads from spine. Every stage writes to spine.
 * No stage computes in isolation. No stage feels like a reset.
 *
 * Fast creates it. Constitutional deepens it. Team validates it.
 * Enterprise prices it. Executive Reporting enforces it.
 * Strategy Room simulates it. Outcome verifies it.
 */

import type { CaseObject, ConditionClass } from "./case-object";
import type { C3Score } from "./c3-fidelity-scorer";
import type { GovernedSynthesis } from "./synthesis-engine";
import type { DefaultPathForecast } from "./default-path-forecast";
import type { CaseMemoryResult } from "./case-memory";
import type { SignalDefinition } from "@/lib/diagnostics/signals";
import type { DecisionKernelOutput } from "./kernel";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SpineStage =
  | "fast_diagnostic"
  | "constitutional"
  | "team"
  | "enterprise"
  | "executive_reporting"
  | "strategy_room"
  | "outcome_verification";

export type C3Tier = "HARD_RECOVERY" | "SOFT_RECOVERY" | "FULL_SYNTHESIS";

export type ConfidenceBand = "low" | "medium" | "high";

export type SpineC3 = C3Score & {
  tier: C3Tier;
  confidenceBand: ConfidenceBand;
};

export type DeterministicOutput = {
  conditionClass: ConditionClass;
  signal: SignalDefinition;
  contradictionSet: string[];
  blockerClass: string;
};

export type StakeholderMap = {
  formalOwner: string | null;
  realOwner: string | null;
  blockers: string[];
  silentInfluencers: string[];
  misalignedParties: string[];
};

export type SpineEvent = {
  stage: SpineStage;
  completedAt: string;
  /** Stage-specific findings snapshot */
  snapshot: Record<string, unknown>;
  /** What this stage contributed to the overall reading */
  contribution: string;
};

export type IntelligenceSpine = {
  id: string;
  userId?: string;
  email?: string;

  /** The user's case in their words */
  case: CaseObject;

  /** Fidelity gate with tiered enforcement */
  c3: SpineC3;

  /** Deterministic authority — always computed, never nullable */
  deterministic: DeterministicOutput;

  /** LLM synthesis — null if tier < FULL_SYNTHESIS or arbiter rejected */
  synthesis: GovernedSynthesis | null;

  /** What happens if they don't act */
  forecast: DefaultPathForecast;

  /** Cross-session recurrence detection — null for first-time users */
  memory: CaseMemoryResult | null;

  /** Stakeholder contradiction map — null until populated */
  stakeholderMap: StakeholderMap | null;

  /** Current stage in the ladder */
  stage: SpineStage;

  /** Accumulated history from every completed stage */
  history: SpineEvent[];

  /** Kernel output — accumulated contradiction graph + simulation */
  kernelOutput?: DecisionKernelOutput;

  createdAt: string;
  updatedAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create the initial spine from fast diagnostic output.
 * This is the only entry point. Every user starts here.
 */
export function createSpine(input: {
  caseObj: CaseObject;
  c3: SpineC3;
  deterministic: DeterministicOutput;
  synthesis: GovernedSynthesis | null;
  forecast: DefaultPathForecast;
  memory?: CaseMemoryResult | null;
}): IntelligenceSpine {
  const now = new Date().toISOString();

  return {
    id: input.caseObj.id,
    userId: undefined,
    email: input.caseObj.email,

    case: input.caseObj,
    c3: input.c3,
    deterministic: input.deterministic,
    synthesis: input.synthesis,
    forecast: input.forecast,
    memory: input.memory ?? null,
    stakeholderMap: null,

    stage: "fast_diagnostic",
    history: [
      {
        stage: "fast_diagnostic",
        completedAt: now,
        snapshot: {
          conditionClass: input.deterministic.conditionClass,
          c3Tier: input.c3.tier,
          hasSynthesis: input.synthesis !== null,
          signalStrength: input.synthesis?.signalStrength ?? "low",
        },
        contribution: input.synthesis?.verdict
          ?? `Condition classified as ${input.deterministic.conditionClass}. Awaiting deeper assessment.`,
      },
    ],

    createdAt: now,
    updatedAt: now,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE ADVANCEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Advance the spine to the next stage. Appends stage findings to history.
 * Does NOT mutate — returns a new spine.
 */
export function advanceSpine(
  spine: IntelligenceSpine,
  stage: SpineStage,
  stageSnapshot: Record<string, unknown>,
  contribution: string,
): IntelligenceSpine {
  const now = new Date().toISOString();

  return {
    ...spine,
    stage,
    history: [
      ...spine.history,
      {
        stage,
        completedAt: now,
        snapshot: stageSnapshot,
        contribution,
      },
    ],
    updatedAt: now,
  };
}

/**
 * Update spine fields without advancing stage.
 * Used when a stage enriches the spine mid-assessment.
 */
export function enrichSpine(
  spine: IntelligenceSpine,
  patch: Partial<Pick<IntelligenceSpine, "synthesis" | "forecast" | "memory" | "stakeholderMap" | "kernelOutput" | "c3">>,
): IntelligenceSpine {
  return {
    ...spine,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Get the accumulated contradiction narrative across all stages */
export function getContradictionConvergence(spine: IntelligenceSpine): string[] {
  const lines: string[] = [];

  // Primary contradiction from synthesis or deterministic
  const primary = spine.synthesis?.primaryContradiction
    ?? (spine.deterministic.contradictionSet[0] || null);
  if (primary) {
    lines.push(`Stage 1 (Fast): ${primary}`);
  }

  // Stage-specific reinforcements from history
  for (const event of spine.history) {
    if (event.stage === "fast_diagnostic") continue; // already covered
    const snap = event.snapshot;
    if (snap.contradictionReinforcement && typeof snap.contradictionReinforcement === "string") {
      lines.push(`${formatStageName(event.stage)}: ${snap.contradictionReinforcement}`);
    }
    if (snap.patternTitle && typeof snap.patternTitle === "string") {
      lines.push(`${formatStageName(event.stage)}: Pattern — ${snap.patternTitle}`);
    }
  }

  return lines;
}

/** Get the journey summary for display */
export function getSpineJourneySummary(spine: IntelligenceSpine): string[] {
  return spine.history.map((event) =>
    `${formatStageName(event.stage)}: ${event.contribution}`,
  );
}

/** Check whether a specific stage has been completed */
export function hasCompletedStage(spine: IntelligenceSpine, stage: SpineStage): boolean {
  return spine.history.some((e) => e.stage === stage);
}

function formatStageName(stage: SpineStage): string {
  const names: Record<SpineStage, string> = {
    fast_diagnostic: "Fast Diagnostic",
    constitutional: "Constitutional",
    team: "Team Assessment",
    enterprise: "Enterprise Assessment",
    executive_reporting: "Executive Reporting",
    strategy_room: "Strategy Room",
    outcome_verification: "Outcome Verification",
  };
  return names[stage];
}
