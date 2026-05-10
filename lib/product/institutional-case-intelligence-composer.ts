/**
 * Institutional Case Intelligence Composer
 *
 * Single canonical server-side composer that prepares buyer-safe institutional
 * intelligence for qualified institutional records.
 *
 * Consumers: Boardroom, Counsel, Oversight, Portfolio Memory, Strategy Room, Proof Pack.
 *
 * Contract:
 * - No thresholds, no raw graph, no kernel language, no formulas.
 * - evaluateDecision() is called server-side only when evidence exists.
 * - Thin states are returned honestly when evidence is insufficient.
 * - Every field is source-labelled.
 * - Suppression summary always present.
 */

// Server-only module
import type { DecisionRole } from "@/lib/access/role-contract";
import type { KernelSafeSummary } from "@/lib/product/kernel-safe-summary";
import type {
  StakeholderPressureSummary,
  SimulationSafeSummary,
  IrreversibilityEstimate,
  CostOfInactionEstimate,
  CorridorSurfaceStatus,
} from "@/lib/product/institutional-case-summary";
import type { ContradictionGraphSafeMetrics } from "@/lib/analytics/contradiction-graph-presenter";

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSER OUTPUT — expanded contract
// ─────────────────────────────────────────────────────────────────────────────

export type SuppressionSummaryView = {
  suppressedCount: number;
  visibleSuppressionCount: number;
  reasons: Array<"privacy" | "sample_size" | "role_boundary" | "unsafe_detail">;
  explanation: string;
  /** @deprecated — use reasons[0] for backward compat with surfaces */
  reason: "privacy" | "sample_size" | "role_boundary" | "unsafe_detail";
  /** @deprecated — use reasons for backward compat with surfaces */
  suppressionTypes: string[];
  /** @deprecated — derived from viewerRole */
  visibleToSponsor: boolean;
};

export type EvidencePostureBlock = {
  status: "SUFFICIENT" | "THIN" | "INSUFFICIENT";
  sourceCount: number;
  completedStages: string[];
  thinStateReasons: string[];
};

export type CaseReferenceBlock = {
  caseId?: string;
  journeyId?: string;
  executiveRunId?: string;
  strategyRoomSessionId?: string;
  organisationId?: string;
  generatedAt: string;
};

export type ReadinessBlock = {
  institutionalCorridorReady: boolean;
  missingForHighValueRetainer: string[];
};

export type InstitutionalCaseIntelligence = {
  status: "COMPOSED" | "INSUFFICIENT_EVIDENCE" | "NOT_INSTITUTIONAL";

  caseReference: CaseReferenceBlock;
  evidencePosture: EvidencePostureBlock;
  readiness: ReadinessBlock;

  stakeholderPressure: StakeholderPressureSummary | null;
  scenarioPressure: SimulationSafeSummary | null;
  contradictionPressure: ContradictionGraphSafeMetrics | null;
  irreversibility: IrreversibilityEstimate | null;
  costOfInaction: CostOfInactionEstimate | null;
  crossAssessmentIntelligence: string | null;
  recommendationEffectiveness: {
    actedOn: number;
    blocked: number;
    abandoned: number;
    disputed: number;
    totalOutcomeScore: number;
    sourceLabel: string;
    thinState: boolean;
  } | null;

  decisionRecordSummary: KernelSafeSummary | null;
  corridorStatus: CorridorSurfaceStatus;
  suppressionSummary: SuppressionSummaryView;
  generatedAt: string;
  sourceLabels: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSER INPUT
// ─────────────────────────────────────────────────────────────────────────────

export type ComposerInput = {
  caseId?: string;
  journeyId?: string;
  email?: string;
  strategyRoomSessionId?: string;
  executiveRunId?: string;
  organisationId?: string;
  portfolioScopeId?: string;
  viewerRole: DecisionRole;
  viewerEmail?: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSER
// ─────────────────────────────────────────────────────────────────────────────

export async function composeInstitutionalCaseIntelligence(
  input: ComposerInput,
): Promise<InstitutionalCaseIntelligence> {
  const thinStateReasons: string[] = [];
  const sourceLabels: string[] = [];
  const now = new Date().toISOString();

  // ── 1. Resolve institutional case ──
  let caseReference: string | null = null;
  let corridorStatus: CorridorSurfaceStatus = {
    executiveReport: false,
    strategyRoom: false,
    counsel: false,
    boardroom: false,
    oversight: false,
    cadence: false,
    outcomeHistory: false,
    portfolioMemory: false,
  };

  try {
    if (input.email) {
      const { resolveInstitutionalCase } = await import("@/lib/product/institutional-case-resolver");
      const ic = await resolveInstitutionalCase(input.email);
      if (ic) {
        caseReference = ic.caseId;
        corridorStatus = {
          executiveReport: ic.institutionalFlags.hasExecutiveReport,
          strategyRoom: ic.institutionalFlags.hasStrategyRoomSession,
          counsel: ic.institutionalFlags.hasCounselCase,
          boardroom: ic.institutionalFlags.hasBoardroomDossier,
          oversight: ic.institutionalFlags.hasOversightBrief,
          cadence: ic.institutionalFlags.hasCadence,
          outcomeHistory: ic.institutionalFlags.hasOutcomeHistory,
          portfolioMemory: ic.institutionalFlags.hasPortfolioMemory,
        };
      }
    }
  } catch { /* degrade */ }

  if (!caseReference && !input.email && !input.journeyId) {
    return buildInsufficientResult("NOT_INSTITUTIONAL", "No institutional case could be identified.", now);
  }

  // ── 2. Load spine (server-side only) ──
  let spine: Awaited<ReturnType<typeof import("@/lib/decision/spine-persistence")["loadSpineFromJourney"]>> = null;
  try {
    if (input.email) {
      const { loadSpineFromJourney } = await import("@/lib/decision/spine-persistence");
      const { prisma } = await import("@/lib/prisma");
      spine = await loadSpineFromJourney(input.email, prisma as any);
    }
  } catch { /* degrade */ }

  if (!spine) {
    thinStateReasons.push("No decision record spine available. Intelligence is limited to diagnostic evidence.");
  }

  // ── 3. Evaluate decision (server-side kernel call) ──
  let decisionRecordSummary: KernelSafeSummary | null = null;
  let crossAssessmentIntelligence: string | null = null;

  if (spine) {
    try {
      const { evaluateDecision } = await import("@/lib/decision/kernel");
      const kernelOutput = evaluateDecision({
        id: caseReference ?? input.email ?? "anon",
        source: "retainer",
        condition: spine.deterministic?.conditionClass ?? "instability",
        decisionRequired: spine.synthesis?.avoidedDecision ?? "Decision not yet identified",
        evidenceChain: spine.history.map((h) => ({
          inputSource: h.stage,
          observedPattern: String(h.snapshot?.conditionClass ?? h.contribution ?? "unknown"),
          weight: 1,
          explanation: String(h.contribution ?? "Evidence from assessment stage"),
        })),
        internalContradictions: spine.memory?.recurrenceSignals
          ?.filter((s) => s.type === "ownership_conflict" || s.type === "recurring_blocker")
          .map((s) => s.message ?? "Unresolved contradiction") ?? [],
        scores: {},
        signalStrength: spine.c3?.specificityScore >= 0.7 ? "STRONG"
          : spine.c3?.specificityScore >= 0.4 ? "MODERATE"
          : "WEAK",
        sources: [{ type: "multi_respondent" as const, count: spine.history.length }],
        existingGraph: null,
        daysSinceIdentification: spine.history.length > 0
          ? Math.round((Date.now() - new Date(spine.history[0]!.completedAt).getTime()) / 86400000)
          : 0,
      });

      const { buildKernelSafeSummary } = await import("@/lib/product/kernel-safe-summary");
      decisionRecordSummary = buildKernelSafeSummary(kernelOutput);
      sourceLabels.push(...decisionRecordSummary.sourceSurfaces);

      // Cross-assessment intelligence
      if (kernelOutput.crossAssessmentInterference.length > 0) {
        const top = kernelOutput.crossAssessmentInterference[0]!;
        crossAssessmentIntelligence = `Signals from ${top.stageA} and ${top.stageB} show material tension. This pattern requires review if used for decision-making.`;
      }
    } catch {
      thinStateReasons.push("Decision record evaluation was unavailable. Summary is based on diagnostic evidence only.");
    }
  } else {
    const { buildThinKernelSafeSummary } = await import("@/lib/product/kernel-safe-summary");
    decisionRecordSummary = buildThinKernelSafeSummary();
  }

  // ── 4. Stakeholder pressure ──
  let stakeholderPressure: StakeholderPressureSummary | null = null;
  if (spine) {
    try {
      const { buildStakeholderMapFromCase } = await import("@/lib/decision/stakeholder-map");
      const { buildStakeholderPressureSummary } = await import("@/lib/product/institutional-case-summary");
      const map = buildStakeholderMapFromCase(spine.case);
      stakeholderPressure = buildStakeholderPressureSummary(map);
      sourceLabels.push(stakeholderPressure.sourceLabel);
      if (stakeholderPressure.thinState) {
        thinStateReasons.push("Insufficient stakeholder evidence.");
      }
    } catch { /* degrade */ }
  } else {
    thinStateReasons.push("Insufficient stakeholder evidence.");
  }

  // ── 5. Simulation / scenario pressure ──
  let scenarioPressure: SimulationSafeSummary | null = null;
  if (spine) {
    try {
      const { simulateAction } = await import("@/lib/decision/simulation-engine");
      const { buildSimulationSafeSummary } = await import("@/lib/product/institutional-case-summary");
      const stakeholderMap = stakeholderPressure
        ? undefined // Already computed, but simulateAction needs raw map
        : undefined;
      const sim = simulateAction({ action: "do_nothing", spine, stakeholderMap });
      scenarioPressure = buildSimulationSafeSummary(sim);
      sourceLabels.push(scenarioPressure.sourceLabel);
      if (scenarioPressure.thinState) {
        thinStateReasons.push("Scenario estimates have low confidence.");
      }
    } catch { /* degrade */ }
  }

  // ── 6. Contradiction pressure ──
  let contradictionPressure: ContradictionGraphSafeMetrics | null = null;
  if (decisionRecordSummary && decisionRecordSummary.posture !== "INSUFFICIENT_EVIDENCE") {
    try {
      const { buildThinContradictionMetrics } = await import("@/lib/analytics/contradiction-graph-presenter");
      // Use kernel-derived metrics if available
      if (decisionRecordSummary.contradictionPressure) {
        contradictionPressure = {
          activeContradictions: decisionRecordSummary.unresolvedDependencies?.length ?? 0,
          unresolvedDependencies: decisionRecordSummary.unresolvedDependencies?.length ?? 0,
          pressureBand: decisionRecordSummary.contradictionPressure,
          firstDetected: null,
          recurrenceCount: 0,
          recurrenceSignal: null,
          resolutionTrend: null,
          provenanceDate: now,
          sourceLabel: "Derived from decision record",
          limitations: ["Contradiction metrics are derived from the decision record and are not independently verified."],
        };
      } else {
        contradictionPressure = buildThinContradictionMetrics();
      }
    } catch { /* degrade */ }
  }

  // ── 7. Irreversibility ──
  let irreversibility: IrreversibilityEstimate | null = null;
  if (spine) {
    try {
      const { computeIrreversibilityIndex } = await import("@/lib/product/irreversibility-index");
      const { buildIrreversibilityEstimate } = await import("@/lib/product/institutional-case-summary");
      const idx = computeIrreversibilityIndex({
        daysWithoutAction: spine.history.length > 0
          ? Math.round((Date.now() - new Date(spine.history[0]!.completedAt).getTime()) / 86400000)
          : 0,
        executionFailures: spine.memory?.recurrenceSignals?.length ?? 0,
      });
      irreversibility = buildIrreversibilityEstimate(idx);
      sourceLabels.push(irreversibility.sourceLabel);
    } catch { /* degrade */ }
  }

  // ── 8. Cost of inaction ──
  let costOfInaction: CostOfInactionEstimate | null = null;
  if (spine && spine.history.length > 0) {
    try {
      const { calculateCostOfInactionClock } = await import("@/lib/product/cost-of-inaction-clock");
      const { buildCostOfInactionEstimate } = await import("@/lib/product/institutional-case-summary");
      const result = calculateCostOfInactionClock({
        startedAt: spine.history[0]!.completedAt,
      });
      if (result.basis !== "UNAVAILABLE") {
        costOfInaction = buildCostOfInactionEstimate(result);
        sourceLabels.push(costOfInaction.sourceLabel);
      }
    } catch { /* degrade */ }
  }

  // ── 9. Recommendation effectiveness ──
  let recommendationEffectiveness: InstitutionalCaseIntelligence["recommendationEffectiveness"] = null;
  try {
    if (input.email || input.organisationId) {
      const { buildRetainedOutcomeSummary } = await import("@/lib/product/retained-outcome-summary");
      const outcomeSummary = await buildRetainedOutcomeSummary({
        email: input.email,
        organisationId: input.organisationId,
      });
      if (outcomeSummary.recommendationEffectiveness) {
        recommendationEffectiveness = outcomeSummary.recommendationEffectiveness;
      }
    }
  } catch { /* degrade */ }

  // ── 10. Suppression summary ──
  const suppressionSummary = await buildSuppressionSummaryView(
    caseReference ?? input.email ?? "unknown",
    input.viewerRole,
  );

  // ── 11. Evidence posture block ──
  const completedStages: string[] = [];
  if (corridorStatus.executiveReport) completedStages.push("Executive Report");
  if (corridorStatus.strategyRoom) completedStages.push("Strategy Room");
  if (corridorStatus.counsel) completedStages.push("Counsel");
  if (corridorStatus.boardroom) completedStages.push("Boardroom");
  if (corridorStatus.oversight) completedStages.push("Oversight");
  if (spine) {
    for (const h of spine.history) {
      if (!completedStages.includes(h.stage)) completedStages.push(h.stage);
    }
  }

  const evidencePosture: EvidencePostureBlock = {
    status: spine && completedStages.length >= 2 ? "SUFFICIENT"
      : completedStages.length >= 1 ? "THIN"
      : "INSUFFICIENT",
    sourceCount: completedStages.length,
    completedStages,
    thinStateReasons,
  };

  // ── 12. Readiness block ──
  const missingForHighValueRetainer: string[] = [];
  if (!corridorStatus.executiveReport) missingForHighValueRetainer.push("Executive report not present");
  if (!corridorStatus.strategyRoom) missingForHighValueRetainer.push("Strategy Room session not present");
  if (!corridorStatus.oversight) missingForHighValueRetainer.push("Oversight brief not present");
  if (!corridorStatus.cadence) missingForHighValueRetainer.push("Cadence not configured");
  if (!corridorStatus.outcomeHistory) missingForHighValueRetainer.push("No outcome verification history");
  if (!spine) missingForHighValueRetainer.push("Decision record spine not available");

  const readiness: ReadinessBlock = {
    institutionalCorridorReady: missingForHighValueRetainer.length <= 2
      && corridorStatus.executiveReport
      && corridorStatus.strategyRoom,
    missingForHighValueRetainer,
  };

  return {
    status: "COMPOSED",
    caseReference: {
      caseId: caseReference ?? undefined,
      journeyId: input.journeyId,
      executiveRunId: input.executiveRunId,
      strategyRoomSessionId: input.strategyRoomSessionId,
      organisationId: input.organisationId,
      generatedAt: now,
    },
    evidencePosture,
    readiness,
    stakeholderPressure,
    scenarioPressure,
    contradictionPressure,
    irreversibility,
    costOfInaction,
    crossAssessmentIntelligence,
    recommendationEffectiveness,
    decisionRecordSummary,
    corridorStatus,
    suppressionSummary,
    generatedAt: now,
    sourceLabels: [...new Set(sourceLabels)],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function buildInsufficientResult(
  status: "INSUFFICIENT_EVIDENCE" | "NOT_INSTITUTIONAL",
  reason: string,
  now: string,
): InstitutionalCaseIntelligence {
  return {
    status,
    caseReference: { generatedAt: now },
    evidencePosture: {
      status: "INSUFFICIENT",
      sourceCount: 0,
      completedStages: [],
      thinStateReasons: [reason],
    },
    readiness: {
      institutionalCorridorReady: false,
      missingForHighValueRetainer: [reason],
    },
    stakeholderPressure: null,
    scenarioPressure: null,
    contradictionPressure: null,
    irreversibility: null,
    costOfInaction: null,
    crossAssessmentIntelligence: null,
    recommendationEffectiveness: null,
    decisionRecordSummary: null,
    corridorStatus: {
      executiveReport: false,
      strategyRoom: false,
      counsel: false,
      boardroom: false,
      oversight: false,
      cadence: false,
      outcomeHistory: false,
      portfolioMemory: false,
    },
    suppressionSummary: {
      suppressedCount: 0,
      visibleSuppressionCount: 0,
      reasons: ["role_boundary"],
      explanation: "No data available for this scope.",
      reason: "role_boundary",
      suppressionTypes: [],
      visibleToSponsor: false,
    },
    generatedAt: now,
    sourceLabels: [],
  };
}

async function buildSuppressionSummaryView(
  scopeId: string,
  viewerRole: DecisionRole,
): Promise<SuppressionSummaryView> {
  try {
    const { loadSuppressionLedger } = await import("@/lib/product/suppression-ledger");
    const events = await loadSuppressionLedger({ scopeId, limit: 100 });

    if (events.length === 0) {
      return {
        suppressedCount: 0,
        visibleSuppressionCount: 0,
        reasons: [],
        explanation: "No suppressed content in this scope.",
        reason: "privacy",
        suppressionTypes: [],
        visibleToSponsor: true,
      };
    }

    const types = [...new Set(events.map((e) => e.suppressionRuleCategory ?? e.suppressionRule))];
    const reasons: SuppressionSummaryView["reasons"] = [];
    if (events.some((e) => e.suppressionRuleCategory === "PRIVACY_BOUNDARY")) reasons.push("privacy");
    if (events.some((e) => e.suppressionRuleCategory === "SMALL_SAMPLE")) reasons.push("sample_size");
    if (events.some((e) => e.suppressionRuleCategory === "UNSAFE_DETAIL")) reasons.push("unsafe_detail");
    if (reasons.length === 0) reasons.push("role_boundary");

    const visibleToSponsor = viewerRole === "OWNER" || viewerRole === "OPERATOR"
      || viewerRole === "ADMIN" || viewerRole === "COUNSEL_REVIEWER";
    const visibleCount = visibleToSponsor ? events.length : 0;

    return {
      suppressedCount: events.length,
      visibleSuppressionCount: visibleCount,
      reasons,
      explanation: `${events.length} detail${events.length !== 1 ? "s" : ""} withheld (${reasons.join(", ")}). Operator review available where applicable.`,
      reason: reasons[0]!,
      suppressionTypes: types.slice(0, 5),
      visibleToSponsor,
    };
  } catch {
    return {
      suppressedCount: 0,
      visibleSuppressionCount: 0,
      reasons: ["role_boundary"],
      explanation: "Suppression status unavailable.",
      reason: "role_boundary",
      suppressionTypes: [],
      visibleToSponsor: false,
    };
  }
}
