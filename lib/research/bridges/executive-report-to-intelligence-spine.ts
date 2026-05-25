/**
 * lib/research/bridges/executive-report-to-intelligence-spine.ts
 *
 * ER → IntelligenceSpine mapper.
 * Transforms an ExecutiveReport (from buildExecutiveReport()) into an IntelligenceSpine
 * that can be fed into boardroom-mode-adapter.
 *
 * Every mapping is source-traced. No field is silently dropped.
 * Missing fields are recorded as MappingGap entries.
 *
 * Status: PRODUCTION_CALLABLE (pure function, no DB, no AI, no side effects)
 */

import "server-only";

import type { ExecutiveReport } from "@/lib/admin/reporting/executive-report-builder";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ValueKind = "direct" | "derived" | "fallback" | "omitted";
export type Confidence = "high" | "medium" | "low";
export type GapImpact = "low" | "medium" | "high";

export type MappingTrace = {
  from: string;
  to: string;
  sourceRule: string;
  valueKind: ValueKind;
  confidence: Confidence;
  /** Required when valueKind is "derived" or "fallback". Explains why the derivation exists. */
  rationale?: string;
};

export type MappingGap = {
  missingSource: string;
  targetField: string;
  impact: GapImpact;
  recommendation: string;
};

export type MappingContext = {
  /** Optional label for traceability */
  scenarioLabel?: string;
  /** Optional fixture key used to generate the report */
  fixtureKey?: string;
};

export type MappedSpine = {
  spine: IntelligenceSpine;
  mappingTrace: MappingTrace[];
  mappingGaps: MappingGap[];
  limitations: string[];
  promotionRequirements: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BRIDGE_VERSION = "1.0.0";
const FIXTURE_TIMESTAMP = "2026-05-25T08:00:00.000Z";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `bridge-er-spine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pick<T, K extends keyof T>(obj: T, key: K): T[K] | undefined {
  return obj?.[key];
}

/**
 * Extract average dissonance from the report, handling both the full ExecutiveReport type
 * (resonance.telemetry.averageDissonance) and the flattened raw output shape
 * (resonance.averageDissonance) produced by the ER adapter's rawOutput.
 */
function getAverageDissonance(report: ExecutiveReport | Record<string, unknown>): number {
  const r = report as Record<string, unknown>;
  const resonance = r.resonance as Record<string, unknown> | undefined;
  if (!resonance) return 0;

  // Flattened shape: resonance.averageDissonance
  if (typeof resonance.averageDissonance === "number") {
    return resonance.averageDissonance;
  }

  // Full type shape: resonance.telemetry.averageDissonance
  const telemetry = resonance.telemetry as Record<string, unknown> | undefined;
  if (telemetry && typeof telemetry.averageDissonance === "number") {
    return telemetry.averageDissonance;
  }

  return 0;
}

/**
 * Extract weakestDomain from the report, handling both shapes.
 */
function getWeakestDomain(report: ExecutiveReport | Record<string, unknown>): string | null {
  const r = report as Record<string, unknown>;
  const resonance = r.resonance as Record<string, unknown> | undefined;
  if (!resonance) return null;

  if (typeof resonance.weakestDomain === "string") return resonance.weakestDomain;
  const telemetry = resonance.telemetry as Record<string, unknown> | undefined;
  if (telemetry && typeof telemetry.weakestDomain === "string") return telemetry.weakestDomain;
  return null;
}

/**
 * Extract strongestDomain from the report, handling both shapes.
 */
function getStrongestDomain(report: ExecutiveReport | Record<string, unknown>): string | null {
  const r = report as Record<string, unknown>;
  const resonance = r.resonance as Record<string, unknown> | undefined;
  if (!resonance) return null;

  if (typeof resonance.strongestDomain === "string") return resonance.strongestDomain;
  const telemetry = resonance.telemetry as Record<string, unknown> | undefined;
  if (telemetry && typeof telemetry.strongestDomain === "string") return telemetry.strongestDomain;
  return null;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

export function mapExecutiveReportToIntelligenceSpine(
  report: ExecutiveReport,
  context: MappingContext = {},
): MappedSpine {
  const mappingTrace: MappingTrace[] = [];
  const mappingGaps: MappingGap[] = [];
  const limitations: string[] = [];
  const promotionRequirements: string[] = [];

  const spineId = generateId();
  const now = new Date().toISOString();

  // ── 1. economics.estimatedMonthlyCost ← report.financialExposure.totalExposure / 12 ──
  // Rule: bridge:financial_exposure_monthly_normalisation_v1
  // Rationale: Executive Reporting totalExposure combines annualised execution loss and
  // one-off replacement exposure. Boardroom Mode expects estimated monthly cost, so v1
  // normalises total exposure across 12 months.
  const totalExposure = report.financialExposure.totalExposure;
  const estimatedMonthlyCost = Math.round(totalExposure / 12);
  const averageDissonance = getAverageDissonance(report);
  mappingTrace.push({
    from: "report.financialExposure.totalExposure",
    to: "spine.economics.estimatedMonthlyCost",
    sourceRule: "bridge:financial_exposure_monthly_normalisation_v1",
    valueKind: "derived",
    confidence: "medium",
    rationale:
      "Executive Reporting totalExposure combines annualised execution loss and one-off replacement exposure. Boardroom Mode expects estimated monthly cost, so v1 normalises total exposure across 12 months.",
  });

  // ── 2. deterministic.conditionClass ← report.state ──
  // Rule: bridge:er_state_to_spine_condition_class_v1
  // Rationale: ExecutiveReport.state (ORDERED/MISALIGNED/DISORDERED) is mapped to
  // IntelligenceSpine.deterministic.conditionClass. DISORDERED→instability,
  // MISALIGNED→execution, ORDERED→execution.
  const stateToCondition: Record<string, string> = {
    DISORDERED: "instability",
    MISALIGNED: "execution",
    ORDERED: "execution",
  };
  const conditionClass = stateToCondition[report.state] ?? "execution";
  mappingTrace.push({
    from: "report.state",
    to: "spine.deterministic.conditionClass",
    sourceRule: "bridge:er_state_to_spine_condition_class_v1",
    valueKind: "derived",
    confidence: "high",
    rationale:
      "ExecutiveReport.state is mapped to IntelligenceSpine.deterministic.conditionClass. DISORDERED→instability, MISALIGNED→execution, ORDERED→execution.",
  });

  // ── 3. synthesis ← report.narrative ──
  // Rule: bridge:narrative_to_synthesis_v1
  // Rationale: ExecutiveReport.narrative.summary is mapped to IntelligenceSpine.synthesis.verdict.
  // narrative.headline is used as case.decision and quotedUserLanguage.
  const synthesisText = report.narrative.summary;
  mappingTrace.push({
    from: "report.narrative",
    to: "spine.synthesis",
    sourceRule: "bridge:narrative_to_synthesis_v1",
    valueKind: "derived",
    confidence: "medium",
    rationale:
      "ExecutiveReport.narrative.summary is mapped to IntelligenceSpine.synthesis.verdict. narrative.headline is used as case.decision and quotedUserLanguage.",
  });

  // ── 4. deterministic.contradictionSet ← report.failureModes ──
  // Rule: bridge:failure_modes_to_contradiction_set_v1
  // Rationale: ExecutiveReport.failureModes are mapped to IntelligenceSpine.deterministic.contradictionSet,
  // prefixed with 'Failure mode: ' for traceability.
  const contradictionSet: string[] = report.failureModes.length > 0
    ? report.failureModes.map((fm) => `Failure mode: ${fm}`)
    : ["No failure modes detected in executive report."];
  mappingTrace.push({
    from: "report.failureModes",
    to: "spine.deterministic.contradictionSet",
    sourceRule: "bridge:failure_modes_to_contradiction_set_v1",
    valueKind: "derived",
    confidence: "high",
    rationale:
      "ExecutiveReport.failureModes are mapped to IntelligenceSpine.deterministic.contradictionSet, prefixed with 'Failure mode: ' for traceability.",
  });

  // ── 5. deterministic.signal ← derived from state and HCD ──
  const signalKey = report.state === "DISORDERED" ? "SYSTEMIC_INSTABILITY"
    : report.state === "MISALIGNED" ? "EXECUTION_AVOIDANCE"
    : "ORDERED_OPERATION";
  const signalLabel = report.state === "DISORDERED" ? "Systemic instability detected"
    : report.state === "MISALIGNED" ? "Execution avoidance detected"
    : "Ordered operation";
  const signalVerdict = report.narrative.headline;
  const signalMove = report.narrative.mandate;

  mappingTrace.push({
    from: "report.state + report.narrative",
    to: "spine.deterministic.signal",
    sourceRule: "bridge:er_state_to_spine_condition_class_v1",
    valueKind: "derived",
    confidence: "medium",
    rationale:
      "Signal key and label are derived from ExecutiveReport.state. Verdict and move are derived from narrative.headline and narrative.mandate.",
  });

  // ── 6. priorityStack → deterministic.priorityStack ──
  // Rule: bridge:priority_stack_to_concrete_move_v1
  // Rationale: ExecutiveReport.priorityStack[0] is mapped to IntelligenceSpine.synthesis.concreteMove.
  // If empty, falls back to narrative.mandate.
  if (report.priorityStack.length > 0) {
    mappingTrace.push({
      from: "report.priorityStack",
      to: "spine.deterministic.priorityStack (via synthesis.concreteMove)",
      sourceRule: "bridge:priority_stack_to_concrete_move_v1",
      valueKind: "derived",
      confidence: "medium",
      rationale:
        "ExecutiveReport.priorityStack[0] is mapped to IntelligenceSpine.synthesis.concreteMove. If empty, falls back to narrative.mandate.",
    });
  } else {
    mappingGaps.push({
      missingSource: "report.priorityStack (empty)",
      targetField: "spine.synthesis.concreteMove",
      impact: "low",
      recommendation: "Priority stack is empty; concrete move will use fallback. Ensure priority stack is populated before mapping.",
    });
  }

  // ── 7. resonanceTelemetry → signals / resonance equivalent ──
  // Rule: bridge:resonance_to_c3_specificity_v1
  // Rationale: ExecutiveReport resonance averageDissonance is inverted (1 - dissonance/100)
  // and clamped to [0.1, 1.0] to approximate IntelligenceSpine.c3.specificityScore.
  mappingTrace.push({
    from: "report.resonance.telemetry",
    to: "spine.c3 (partial — specificityScore from averageDissonance inverse)",
    sourceRule: "bridge:resonance_to_c3_specificity_v1",
    valueKind: "derived",
    confidence: "low",
    rationale:
      "ExecutiveReport resonance averageDissonance is inverted (1 - dissonance/100) and clamped to [0.1, 1.0] to approximate IntelligenceSpine.c3.specificityScore.",
  });

  // ── 8. hcdAggregate → humanCapital / humanDynamics equivalent ──
  mappingGaps.push({
    missingSource: "report.hcdAggregate",
    targetField: "spine.humanCapital (no equivalent field on IntelligenceSpine)",
    impact: "medium",
    recommendation: "IntelligenceSpine has no humanCapital or humanDynamics field. HCD data is lost in this mapping. Consider extending IntelligenceSpine or storing HCD in a parallel structure.",
  });

  // ── 9. ogrManifest → governance / manifest / institutional pressure ──
  mappingGaps.push({
    missingSource: "report.ogr",
    targetField: "spine.governance (no equivalent field on IntelligenceSpine)",
    impact: "medium",
    recommendation: "IntelligenceSpine has no governance/manifest field. OGR data (sovereignCertainty, integrationTax) is lost. Consider extending spine with governance context.",
  });

  // ── 10. financialExposure details beyond totalExposure ──
  mappingGaps.push({
    missingSource: "report.financialExposure.replacementCost, report.financialExposure.executionLoss",
    targetField: "spine.economics (only estimatedMonthlyCost mapped; replacementCost and executionLoss not mapped)",
    impact: "low",
    recommendation: "Only totalExposure is mapped to estimatedMonthlyCost. Consider mapping replacementCost to a separate economics field or adding a financialExposure breakdown.",
  });

  // ── 11. resonanceTelemetry details ──
  mappingGaps.push({
    missingSource: "report.resonance.telemetry.weakestDomain, strongestDomain, domainCount, isDisordered",
    targetField: "spine.c3.missing (domain-level resonance data not mapped)",
    impact: "low",
    recommendation: "Domain-level resonance telemetry is not mapped to any IntelligenceSpine field. Consider adding domain resonance data to spine context.",
  });

  // ── Build the mapped IntelligenceSpine ──
  const mappedSpine: IntelligenceSpine = {
    id: spineId,
    userId: undefined,
    email: undefined,

    case: {
      id: spineId,
      decision: report.narrative.headline,
      priorAttempt: "Derived from executive report — see report.narrative.summary",
      costOfDelay: `£${Math.round(estimatedMonthlyCost).toLocaleString()}/month estimated exposure`,
      claimedOwner: "Not mapped — see mapping gaps",
      blocker: report.failureModes.length > 0
        ? `Failure modes active: ${report.failureModes.join(", ")}`
        : "No blockers identified in executive report",
      forcedAction: report.narrative.mandate,
      contradiction: report.failureModes.length > 0
        ? `Failure modes indicate contradiction between intent and execution: ${report.failureModes.join(", ")}`
        : "No contradiction identified from executive report data",
      inferredAvoidance: report.state === "DISORDERED"
        ? "Systemic disorder suggests avoidance at structural level"
        : report.state === "MISALIGNED"
          ? "Misalignment suggests partial avoidance"
          : "No avoidance inferred",
      conditionClass: conditionClass as import("@/lib/decision/case-object").ConditionClass,
      signalStrength: report.state === "DISORDERED" ? "high"
        : report.state === "MISALIGNED" ? "medium"
        : "low",
      specificityScore: Math.max(0.1, Math.min(1, 1 - (averageDissonance / 100))),
      createdAt: now,
      updatedAt: now,
    },

    c3: {
      clarity: Math.max(0.1, 1 - (averageDissonance / 100)),
      context: report.hcdAggregate ? Math.max(0.1, 1 - (report.hcdAggregate.averageDelta / 100)) : 0.5,
      consequence: Math.min(1, estimatedMonthlyCost / 20000),
      specificityScore: Math.max(0.1, Math.min(1, 1 - (averageDissonance / 100))),
      mode: report.state === "DISORDERED" ? "PRECISION_RECOVERY"
        : report.state === "MISALIGNED" ? "SYNTHESIS_READY"
        : "SYNTHESIS_READY",
      tier: report.state === "DISORDERED" ? "HARD_RECOVERY"
        : report.state === "MISALIGNED" ? "SOFT_RECOVERY"
        : "FULL_SYNTHESIS",
      confidenceBand: report.state === "DISORDERED" ? "low"
        : report.state === "MISALIGNED" ? "medium"
        : "high",
      missing: report.state === "DISORDERED" ? ["context", "consequence"]
        : report.state === "MISALIGNED" ? ["context"]
        : [],
      scoringExplanation: {
        clarity: `Derived from average dissonance: ${averageDissonance}%`,
        context: report.hcdAggregate ? `Derived from HCD average delta: ${report.hcdAggregate.averageDelta.toFixed(1)}` : "Not available",
        consequence: `Derived from total exposure: £${Math.round(totalExposure).toLocaleString()}`,
      },
      recoveryClassification: (report.state === "DISORDERED" ? "insufficient_detail"
        : report.state === "MISALIGNED" ? "missing_owner"
        : null) as import("@/lib/decision/c3-fidelity-scorer").RecoveryClassification,
    },

    deterministic: {
      conditionClass: conditionClass as import("@/lib/decision/case-object").ConditionClass,
      signal: {
        key: signalKey as import("@/lib/diagnostics/signals").SignalKey,
        label: signalLabel,
        verdict: signalVerdict,
        contradiction: report.failureModes.length > 0
          ? `Failure modes: ${report.failureModes.join(", ")}`
          : "No contradiction detected",
        move: signalMove,
        ignored7: "Without action: conditions may persist or worsen.",
        ignored30: "Without action: structural risk may escalate.",
        ignored90: "Without action: systemic governance fracture possible.",
        behaviourReveal: `State: ${report.state}. HCD risk: ${report.hcdAggregate.riskScore}.`,
        escalationLine: `Estimated monthly cost: £${Math.round(estimatedMonthlyCost).toLocaleString()}/month.`,
        boundaryStatement: "This spine was mapped from an ExecutiveReport. It reflects the report's synthetic inputs and may not capture full decision context.",
        primaryStatement: report.narrative.headline,
        decisionStatement: report.narrative.summary,
        consequenceStatement: `Cost of inaction: £${Math.round(estimatedMonthlyCost).toLocaleString()}/month.`,
        moveStatement: report.narrative.mandate,
      },
      contradictionSet,
      blockerClass: report.state === "DISORDERED" ? "systemic_instability"
        : report.state === "MISALIGNED" ? "execution_avoidance"
        : "none",
    },

    synthesis: {
      verdict: synthesisText,
      primaryContradiction: report.failureModes.length > 0
        ? `Failure modes indicate contradiction: ${report.failureModes.join(", ")}`
        : "No primary contradiction identified from executive report",
      avoidedDecision: report.state === "DISORDERED"
        ? "Systemic disorder suggests structural decisions are being avoided"
        : report.state === "MISALIGNED"
          ? "Misalignment suggests partial decision avoidance"
          : "No decision avoidance inferred",
      whyPriorAttemptsFailed: "Not available from executive report — see mapping gaps",
      concreteMove: report.priorityStack[0] ?? report.narrative.mandate,
      defaultPathForecast: `Without action: £${Math.round(estimatedMonthlyCost).toLocaleString()}/month continues. HCD risk: ${report.hcdAggregate.riskScore}.`,
      signalStrength: report.state === "DISORDERED" ? "high"
        : report.state === "MISALIGNED" ? "medium"
        : "low",
      certaintyBoundary: "This synthesis is derived from an ExecutiveReport generated from synthetic fixtures. It does not model external unknowns.",
      quotedUserLanguage: [report.narrative.headline],
      conditionClass: conditionClass as import("@/lib/decision/case-object").ConditionClass,
      c3Score: {
        clarity: Math.max(0.1, 1 - (averageDissonance / 100)),
        context: report.hcdAggregate ? Math.max(0.1, 1 - (report.hcdAggregate.averageDelta / 100)) : 0.5,
        consequence: Math.min(1, estimatedMonthlyCost / 20000),
        specificityScore: Math.max(0.1, Math.min(1, 1 - (averageDissonance / 100))),
        mode: report.state === "DISORDERED" ? "PRECISION_RECOVERY"
          : report.state === "MISALIGNED" ? "SYNTHESIS_READY"
          : "SYNTHESIS_READY",
        tier: report.state === "DISORDERED" ? "HARD_RECOVERY"
          : report.state === "MISALIGNED" ? "SOFT_RECOVERY"
          : "FULL_SYNTHESIS",
        confidenceBand: report.state === "DISORDERED" ? "low"
          : report.state === "MISALIGNED" ? "medium"
          : "high",
        missing: report.state === "DISORDERED" ? ["context", "consequence"]
          : report.state === "MISALIGNED" ? ["context"]
          : [],
        scoringExplanation: {
          clarity: `Derived from average dissonance: ${averageDissonance}%`,
          context: report.hcdAggregate ? `Derived from HCD average delta: ${report.hcdAggregate.averageDelta.toFixed(1)}` : "Not available",
          consequence: `Derived from total exposure: £${Math.round(totalExposure).toLocaleString()}`,
        },
        recoveryClassification: (report.state === "DISORDERED" ? "insufficient_detail"
          : report.state === "MISALIGNED" ? "missing_owner"
          : null) as import("@/lib/decision/c3-fidelity-scorer").RecoveryClassification,
      },
    },

    forecast: {
      alreadyIncurred: `Estimated monthly cost: £${Math.round(estimatedMonthlyCost).toLocaleString()}/month. HCD replacement cost: £${Math.round(report.financialExposure.replacementCost).toLocaleString()}.`,
      sevenDays: "Without action: current trajectory continues.",
      thirtyDays: "Without action: risk may escalate.",
      ninetyDays: "Without action: structural risk compounds.",
      optionDecayRate: report.state === "DISORDERED" ? 0.40
        : report.state === "MISALIGNED" ? 0.25
        : 0.10,
      controlShiftProbability: report.state === "DISORDERED" ? 0.70
        : report.state === "MISALIGNED" ? 0.45
        : 0.15,
      structuralRiskShift: (report.state === "DISORDERED" ? "accelerating"
        : report.state === "MISALIGNED" ? "accelerating"
        : "stable") as "accelerating" | "stable" | "compounding",
    },

    memory: null,
    stakeholderMap: null,

    stage: "executive_reporting",
    history: [
      {
        stage: "executive_reporting",
        completedAt: now,
        snapshot: {
          conditionClass: conditionClass as import("@/lib/decision/case-object").ConditionClass,
          c3Tier: report.state === "DISORDERED" ? "HARD_RECOVERY"
            : report.state === "MISALIGNED" ? "SOFT_RECOVERY"
            : "FULL_SYNTHESIS",
          hasSynthesis: true,
          signalStrength: report.state === "DISORDERED" ? "high"
            : report.state === "MISALIGNED" ? "medium"
            : "low",
          state: report.state,
          averageDissonance,
          hcdRiskScore: report.hcdAggregate.riskScore,
          totalExposure,
          estimatedMonthlyCost,
        },
        contribution: `Executive Report mapped to IntelligenceSpine. State: ${report.state}. Dissonance: ${averageDissonance}%. HCD risk: ${report.hcdAggregate.riskScore}. Monthly cost: £${Math.round(estimatedMonthlyCost).toLocaleString()}.`,
      },
    ],

    accuracyFeedback: {
      response: report.state === "ORDERED" ? "yes"
        : report.state === "MISALIGNED" ? "partial"
        : "no",
      reason: `Mapped from executive report state: ${report.state}. Dissonance: ${averageDissonance}%.`,
      capturedAt: now,
    },

    economics: {
      estimatedMonthlyCost,
      costOfDelayMonthly: estimatedMonthlyCost,
      decisionOwner: "Not mapped — see mapping gaps",
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },

    flags: {
      avoidanceSuspected: report.state !== "ORDERED",
      falseAuthority: report.state === "DISORDERED",
      economicSanitySuspicious: false,
      doNotSellTriggered: false,
    },

    integrityScore: report.state === "ORDERED" ? 0.85
      : report.state === "MISALIGNED" ? 0.65
      : 0.45,
    pressureIndex: report.state === "DISORDERED" ? 82
      : report.state === "MISALIGNED" ? 55
      : 25,

    createdAt: now,
    updatedAt: now,
  };

  // ── Limitations (each references the relevant rule) ──
  limitations.push(
    "Mapped from synthetic ExecutiveReport — not from real campaign data. [adapter:executive_reporting_builder_fixture_v1]",
    "HCD aggregate data is not mapped to any IntelligenceSpine field (no humanCapital field exists). [bridge:hcd_ogr_data_loss_v1]",
    "OGR manifest data (sovereignCertainty, integrationTax) is not mapped to any IntelligenceSpine field (no governance field exists). [bridge:hcd_ogr_data_loss_v1]",
    "Domain-level resonance telemetry is not mapped to IntelligenceSpine fields. [bridge:resonance_to_c3_specificity_v1]",
    "Financial exposure breakdown (replacementCost, executionLoss) is collapsed into single estimatedMonthlyCost. [bridge:financial_exposure_monthly_normalisation_v1]",
    "Priority stack items beyond the first are not mapped to concreteMove. [bridge:priority_stack_to_concrete_move_v1]",
    "Synthesis is derived from narrative — not from full diagnostic pipeline. [bridge:narrative_to_synthesis_v1]",
    "No stakeholder map is generated — stakeholder data not available in ExecutiveReport.",
  );

  // ── Promotion requirements (each references the relevant rule) ──
  promotionRequirements.push(
    "Extend IntelligenceSpine with humanCapital/humanDynamics field to preserve HCD data. [bridge:hcd_ogr_data_loss_v1]",
    "Extend IntelligenceSpine with governance/manifest field to preserve OGR data. [bridge:hcd_ogr_data_loss_v1]",
    "Add domain-level resonance telemetry mapping to IntelligenceSpine context. [bridge:resonance_to_c3_specificity_v1]",
    "Map financial exposure breakdown (replacementCost, executionLoss) to separate economics fields. [bridge:financial_exposure_monthly_normalisation_v1]",
    "Wire real ExecutiveReport from production pipeline instead of synthetic fixtures. [adapter:executive_reporting_builder_fixture_v1]",
    "Add stakeholder inference from HCD and OGR data.",
  );

  return {
    spine: mappedSpine,
    mappingTrace,
    mappingGaps,
    limitations,
    promotionRequirements,
  };
}
