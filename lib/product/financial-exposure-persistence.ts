/**
 * lib/product/financial-exposure-persistence.ts
 *
 * Canonical Financial Exposure Persistence Policy.
 *
 * Governing standard:
 *   Persist computed numeric exposure snapshot when generated.
 *   Persist:
 *     - userCostOfDelayText
 *     - estimatedFinancialExposure (numeric, computed)
 *     - exposureBand
 *     - exposureBasis (revenueBand, urgencyScore, ownershipScore, clarityScore,
 *       accountabilityScore, stateScore, decisionValue)
 *     - computedAt (ISO timestamp)
 *     - sourceSurface (where it was computed)
 *     - schemaVersion
 *
 * This is NOT a redesign of the cost-of-delay engine.
 * This is a persistence layer that ensures financial exposure evidence
 * is captured, persisted, and available for downstream consumption.
 */

import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";
import { getDiagnosticJourney } from "@/lib/diagnostics/journey-store";
import type { GovernedMemoryItem } from "@/lib/product/governed-memory-contract";
import { normaliseFinancialExposureSnapshot } from "@/lib/product/field-provenance-normaliser";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type FinancialExposureSnapshot = {
  /** User's free-text description of cost of delay */
  userCostOfDelayText: string | null;
  /** Computed numeric exposure estimate */
  estimatedFinancialExposure: number | null;
  /** Exposure band classification */
  exposureBand: "low" | "moderate" | "high" | "critical" | "undisclosed" | null;
  /** Input basis for the exposure calculation */
  exposureBasis: {
    revenueBand?: string | null;
    urgencyScore?: number | null;
    ownershipScore?: number | null;
    clarityScore?: number | null;
    accountabilityScore?: number | null;
    stateScore?: number | null;
    decisionValue?: number | null;
  } | null;
  /** When the snapshot was computed */
  computedAt: string;
  /** Source surface identifier */
  sourceSurface: string;
  /** Schema version */
  schemaVersion: string;
};

export type PersistFinancialExposureInput = {
  email?: string | null;
  subjectId?: string | null;
  campaignId?: string | null;
  userCostOfDelayText?: string | null;
  estimatedFinancialExposure?: number | null;
  exposureBand?: "low" | "moderate" | "high" | "critical" | "undisclosed" | null;
  exposureBasis?: {
    revenueBand?: string | null;
    urgencyScore?: number | null;
    ownershipScore?: number | null;
    clarityScore?: number | null;
    accountabilityScore?: number | null;
    stateScore?: number | null;
    decisionValue?: number | null;
  } | null;
  sourceSurface?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// COST OF INACTION PROJECTION — qualitative horizon narrative
// ─────────────────────────────────────────────────────────────────────────────

export type CostOfInactionProjectionSnapshot = {
  sourceSurface: string;
  computedAt: string;
  schemaVersion: string;
  /** The exposure band at time of computation */
  exposureBand: "low" | "moderate" | "high" | "critical" | "undisclosed" | null;
  /** 7-day horizon narrative */
  horizon7: string;
  /** 30-day horizon narrative */
  horizon30: string;
  /** 60-day horizon narrative (may be absent in Fast Diagnostic) */
  horizon60?: string;
  /** 90-day horizon narrative */
  horizon90: string;
  /** Executive warning narrative */
  executiveWarning: string;
};

export type PersistCostOfInactionProjectionInput = {
  email?: string | null;
  subjectId?: string | null;
  campaignId?: string | null;
  exposureBand?: "low" | "moderate" | "high" | "critical" | "undisclosed" | null;
  horizon7: string;
  horizon30: string;
  horizon60?: string;
  horizon90: string;
  executiveWarning: string;
  sourceSurface?: string;
};

/**
 * Persist costOfInaction projections as a governed narrative snapshot.
 * These are qualitative projections, not evidence — but they are part of the
 * user's first consequence encounter and should be available to downstream
 * surfaces that talk about delay, consequence, or inaction.
 */
export async function persistCostOfInactionProjection(
  input: PersistCostOfInactionProjectionInput,
): Promise<void> {
  const snapshot: CostOfInactionProjectionSnapshot = {
    sourceSurface: input.sourceSurface ?? "fast_diagnostic",
    computedAt: new Date().toISOString(),
    schemaVersion: "1.0.0",
    exposureBand: input.exposureBand ?? null,
    horizon7: input.horizon7,
    horizon30: input.horizon30,
    horizon60: input.horizon60,
    horizon90: input.horizon90,
    executiveWarning: input.executiveWarning,
  };

  try {
    await persistDiagnosticStage({
      email: input.email ?? undefined,
      subjectId: input.subjectId ?? undefined,
      campaignId: input.campaignId ?? undefined,
      stage: "purpose_alignment",
      payload: {
        ...snapshot,
        _type: "cost_of_inaction_projection",
      },
      snapshot: {
        timestamp: snapshot.computedAt,
        stage: "cost_of_inaction_projection",
        coreMetrics: {
          exposureBand: snapshot.exposureBand === "critical" ? 4
            : snapshot.exposureBand === "high" ? 3
            : snapshot.exposureBand === "moderate" ? 2
            : snapshot.exposureBand === "low" ? 1 : 0,
        },
        tensions: [],
        escalationLevel: snapshot.exposureBand === "critical" ? 3
          : snapshot.exposureBand === "high" ? 2
          : snapshot.exposureBand === "moderate" ? 1 : 0,
        directive: null,
      },
    });
  } catch {
    // Non-fatal: persistence failure should not crash the caller
  }
}

/**
 * Load the latest costOfInaction projection from the journey store.
 */
export async function loadLatestCostOfInactionProjection(input: {
  email?: string | null;
  subjectId?: string | null;
  campaignId?: string | null;
}): Promise<CostOfInactionProjectionSnapshot | null> {
  try {
    const journey = await getDiagnosticJourney({
      email: input.email ?? undefined,
      subjectId: input.subjectId ?? undefined,
      campaignId: input.campaignId ?? undefined,
    });

    const paStage = journey.stages["purpose_alignment"] as Record<string, unknown> | undefined;
    if (!paStage) return null;

    const payload = (paStage.payload ?? paStage) as Record<string, unknown>;
    if (payload._type !== "cost_of_inaction_projection") return null;

    return {
      sourceSurface: (payload.sourceSurface as string) ?? "fast_diagnostic",
      computedAt: (payload.computedAt as string) ?? "",
      schemaVersion: (payload.schemaVersion as string) ?? "1.0.0",
      exposureBand: (payload.exposureBand as CostOfInactionProjectionSnapshot["exposureBand"]) ?? null,
      horizon7: (payload.horizon7 as string) ?? "",
      horizon30: (payload.horizon30 as string) ?? "",
      horizon60: (payload.horizon60 as string) ?? undefined,
      horizon90: (payload.horizon90 as string) ?? "",
      executiveWarning: (payload.executiveWarning as string) ?? "",
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSIST
// ─────────────────────────────────────────────────────────────────────────────

export async function persistFinancialExposureSnapshot(
  input: PersistFinancialExposureInput,
): Promise<void> {
  const snapshot: FinancialExposureSnapshot = {
    userCostOfDelayText: input.userCostOfDelayText ?? null,
    estimatedFinancialExposure: input.estimatedFinancialExposure ?? null,
    exposureBand: input.exposureBand ?? null,
    exposureBasis: input.exposureBasis ?? null,
    computedAt: new Date().toISOString(),
    sourceSurface: input.sourceSurface ?? "unknown",
    schemaVersion: "1.0.0",
  };

  try {
    await persistDiagnosticStage({
      email: input.email ?? undefined,
      subjectId: input.subjectId ?? undefined,
      campaignId: input.campaignId ?? undefined,
      stage: "purpose_alignment", // Co-locate with PA evidence in the journey store
      payload: {
        ...snapshot,
        _type: "financial_exposure_snapshot",
      },
      snapshot: {
        timestamp: snapshot.computedAt,
        stage: "financial_exposure",
        coreMetrics: {
          estimatedFinancialExposure: snapshot.estimatedFinancialExposure ?? 0,
          exposureBand: snapshot.exposureBand === "critical" ? 4
            : snapshot.exposureBand === "high" ? 3
            : snapshot.exposureBand === "moderate" ? 2
            : snapshot.exposureBand === "low" ? 1 : 0,
        },
        tensions: [],
        escalationLevel: snapshot.exposureBand === "critical" ? 3
          : snapshot.exposureBand === "high" ? 2
          : snapshot.exposureBand === "moderate" ? 1 : 0,
        directive: null,
      },
    });
  } catch {
    // Non-fatal: persistence failure should not crash the caller
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadLatestFinancialExposure(input: {
  email?: string | null;
  subjectId?: string | null;
  campaignId?: string | null;
}): Promise<FinancialExposureSnapshot | null> {
  try {
    const journey = await getDiagnosticJourney({
      email: input.email ?? undefined,
      subjectId: input.subjectId ?? undefined,
      campaignId: input.campaignId ?? undefined,
    });

    const paStage = journey.stages["purpose_alignment"] as Record<string, unknown> | undefined;
    if (!paStage) return null;

    const payload = (paStage.payload ?? paStage) as Record<string, unknown>;
    if (payload._type !== "financial_exposure_snapshot") return null;

    return {
      userCostOfDelayText: (payload.userCostOfDelayText as string) ?? null,
      estimatedFinancialExposure: (payload.estimatedFinancialExposure as number) ?? null,
      exposureBand: (payload.exposureBand as FinancialExposureSnapshot["exposureBand"]) ?? null,
      exposureBasis: (payload.exposureBasis as FinancialExposureSnapshot["exposureBasis"]) ?? null,
      computedAt: (payload.computedAt as string) ?? "",
      sourceSurface: (payload.sourceSurface as string) ?? "unknown",
      schemaVersion: (payload.schemaVersion as string) ?? "1.0.0",
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RETURN BRIEF COST CLOCK HELPER
// ─────────────────────────────────────────────────────────────────────────────

export function buildReturnBriefCostClockBlock(
  exposure: FinancialExposureSnapshot | null,
): Record<string, unknown> | null {
  if (!exposure) return null;

  return {
    source: "FINANCIAL_EXPOSURE_SNAPSHOT",
    computedAt: exposure.computedAt,
    estimatedFinancialExposure: exposure.estimatedFinancialExposure,
    exposureBand: exposure.exposureBand,
    userCostOfDelayText: exposure.userCostOfDelayText,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DECISION CENTRE COST CLOCK HELPER
// ─────────────────────────────────────────────────────────────────────────────

export function buildDecisionCentreCostClockBlock(
  exposure: FinancialExposureSnapshot | null,
): Record<string, unknown> | null {
  if (!exposure) return null;

  return {
    source: "FINANCIAL_EXPOSURE_SNAPSHOT",
    computedAt: exposure.computedAt,
    estimatedFinancialExposure: exposure.estimatedFinancialExposure,
    exposureBand: exposure.exposureBand,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERSIGHT BRIEF COST / CANCELLATION HELPER
// ─────────────────────────────────────────────────────────────────────────────

export function buildOversightBriefCostBlock(
  exposure: FinancialExposureSnapshot | null,
): Record<string, unknown> | null {
  if (!exposure || !exposure.estimatedFinancialExposure) return null;

  return {
    source: "FINANCIAL_EXPOSURE_SNAPSHOT",
    computedAt: exposure.computedAt,
    estimatedFinancialExposure: exposure.estimatedFinancialExposure,
    exposureBand: exposure.exposureBand,
    cancellationRisk: exposure.exposureBand === "critical" || exposure.exposureBand === "high"
      ? "ELEVATED"
      : "STANDARD",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GOVERNED MEMORY CONVERTER — renders financial exposure via GovernanceEvidenceCarryForward
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a FinancialExposureSnapshot into GovernedMemoryItem[] for rendering
 * via the existing GovernanceEvidenceCarryForward component.
 *
 * Every visible use is labelled as:
 *   - estimated
 *   - based on diagnostic inputs
 *   - not independently verified
 */
export function convertFinancialExposureToGovernedMemory(
  exposure: FinancialExposureSnapshot | null,
): GovernedMemoryItem[] {
  if (!exposure) return [];

  const surface = exposure.sourceSurface === "fast_diagnostic"
    ? ("FAST_DIAGNOSTIC" as const)
    : ("EXECUTIVE_REPORTING" as const);

  const items: GovernedMemoryItem[] = [];
  const provenance = normaliseFinancialExposureSnapshot(exposure);
  const base = {
    sourceSurface: surface,
    capturedAt: exposure.computedAt,
    evidenceOrigin: "SELF_REPORTED" as const,
    audienceSafe: true,
  };

  if (exposure.estimatedFinancialExposure != null && exposure.estimatedFinancialExposure > 0) {
    items.push({
      ...base,
      id: "fe_estimated_exposure",
      label: "Estimated exposure",
      summary: `Estimated financial exposure: \u00a3${exposure.estimatedFinancialExposure.toLocaleString()}${exposure.exposureBand ? ` (${exposure.exposureBand})` : ""}. This is an estimate based on diagnostic inputs and has not been independently verified.`,
      status: "ACTIVE",
      confidenceLabel: "REPORTED",
      provenance: provenance.filter((item) => item.fieldKey === "estimatedFinancialExposure" || item.fieldKey === "exposureBand"),
    });
  }

  if (exposure.exposureBand && !items.length) {
    items.push({
      ...base,
      id: "fe_exposure_band",
      label: "Estimated exposure band",
      summary: `Exposure band: ${exposure.exposureBand}. This is estimated from diagnostic inputs and has not been independently verified.`,
      status: "ACTIVE",
      confidenceLabel: "REPORTED",
      provenance: provenance.filter((item) => item.fieldKey === "exposureBand"),
    });
  }

  if (exposure.userCostOfDelayText) {
    items.push({
      ...base,
      id: "fe_cost_of_delay",
      label: "Reported cost of delay",
      summary: exposure.userCostOfDelayText,
      status: "ACTIVE",
      confidenceLabel: "REPORTED",
      provenance: provenance.filter((item) => item.fieldKey === "userCostOfDelayText"),
    });
  }

  return items;
}
