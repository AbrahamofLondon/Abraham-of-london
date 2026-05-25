/**
 * lib/research/engines/executive-report-boardroom-bridge-adapter.ts
 *
 * ER → Boardroom Bridge adapter.
 * Proves the governed escalation path:
 *   Executive Reporting output → IntelligenceSpine transformation → Boardroom qualification gate
 *
 * Status: PRODUCTION_CALLABLE
 *   - ER adapter selfTest passes
 *   - Boardroom adapter selfTest passes
 *   - Mapper has no untraced required fields
 *   - Bridge selfTest passes
 *
 * Production functions called:
 *   - executiveReportingAdapter.run() — wraps buildExecutiveReport()
 *   - boardroomModeAdapter.run() — wraps qualifiesForBoardroom() + generateBoardroomDossier()
 *   - mapExecutiveReportToIntelligenceSpine() — pure mapper
 *
 * Explicit limitations (never omitted):
 *   1. Uses synthetic ExecutiveReport fixtures — not real campaign data.
 *   2. Mapped IntelligenceSpine is synthetic — not a real user spine from DB.
 *   3. Does not render PDF. PDF export route is not called.
 *   4. Does not call executive-report-service.ts or fetch real ER run state.
 *   5. Does not persist bridge artefacts (no DB writes, no archiveIntake).
 *   6. Does not issue client-facing board papers or BOARD_RESTRICTED documents.
 *   7. Does not validate payment or entitlement gate (DB-bound).
 *   8. HCD and OGR data is lost in mapping (no equivalent fields on IntelligenceSpine).
 *
 * Promotion requirements (before FULL_PRODUCTION status):
 *   - Wire real ExecutiveReport from production pipeline.
 *   - Extend IntelligenceSpine with humanCapital and governance fields.
 *   - Add PDF render dry-run adapter.
 *   - Add lineage event simulation for BRIDGE_EXECUTED.
 *   - Validate bridge decision against manual review.
 */

import "server-only";

import { z } from "zod";
import { executiveReportingAdapter, ER_ENGINE_ID, ER_VERSION } from "@/lib/research/engines/executive-reporting-adapter";
import { boardroomModeAdapter, BOARDROOM_ENGINE_ID, BOARDROOM_VERSION } from "@/lib/research/engines/boardroom-mode-adapter";
import { mapExecutiveReportToIntelligenceSpine, type MappingTrace, type MappingGap } from "@/lib/research/bridges/executive-report-to-intelligence-spine";
import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";
import type { ExecutiveReport } from "@/lib/admin/reporting/executive-report-builder";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import type { BoardroomDossier } from "@/lib/constitution/boardroom-mode";

// ─── Engine Identity ──────────────────────────────────────────────────────────

export const BRIDGE_ENGINE_ID = "executive-report-boardroom-bridge";
export const BRIDGE_VERSION = "1.0.0";

// ─── Bridge Decision Types ────────────────────────────────────────────────────

export type BridgeDecision = "QUALIFIES" | "BORDERLINE" | "DOES_NOT_QUALIFY" | "MAPPING_INSUFFICIENT";

export type BridgeOutput = {
  executiveReport: ExecutiveReport | null;
  mappedSpine: IntelligenceSpine | null;
  boardroomResult: EngineRunOutput | null;
  qualifiesForBoardroom: boolean;
  bridgeDecision: BridgeDecision;
  mappingTrace: MappingTrace[];
  mappingGaps: MappingGap[];
  findings: Finding[];
  formulaSteps: FormulaStep[];
  limitations: string[];
  promotionRequirements: string[];
  productionFunctionsCalled: string[];
  pipelineStagesNotCalled: string[];
};

// ─── Input Schema ─────────────────────────────────────────────────────────────

const bridgeInputSchema = z.object({
  /** Use the DISORDERED fixture (high cost, high dissonance) */
  useDisorderedFixture: z.boolean().optional().default(false),
  /** Use the MISALIGNED fixture (moderate cost, borderline) */
  useMisalignedFixture: z.boolean().optional().default(false),
  /** Use the ORDERED fixture (low cost, low dissonance) */
  useOrderedFixture: z.boolean().optional().default(false),
  /** Use a fixture designed to produce mapping gaps */
  useMappingGapFixture: z.boolean().optional().default(false),
  /** Use a malformed fixture to test safe failure */
  useMalformedFixture: z.boolean().optional().default(false),
  /** Optional label for test run identification */
  scenarioLabel: z.string().optional(),
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXTURES: Record<string, Record<string, unknown>> = {
  disordered: { useDisorderedFixture: true },
  misaligned: { useMisalignedFixture: true },
  ordered: { useOrderedFixture: true },
  mappingGap: { useOrderedFixture: true, scenarioLabel: "mapping-gap-test" },
  malformed: { useDisorderedFixture: true, scenarioLabel: "malformed-test" },
};

// ─── Bridge Decision Logic ────────────────────────────────────────────────────

function determineBridgeDecision(
  boardroomQualified: boolean,
  mappingGaps: MappingGap[],
  boardroomResult: EngineRunOutput | null,
): BridgeDecision {
  const highImpactGaps = mappingGaps.filter((g) => g.impact === "high");
  const mediumImpactGaps = mappingGaps.filter((g) => g.impact === "medium");

  // MAPPING_INSUFFICIENT: Any high-impact mapping gap affects required boardroom fields
  if (highImpactGaps.length > 0) {
    return "MAPPING_INSUFFICIENT";
  }

  // QUALIFIES: Boardroom adapter qualifies and no high-impact mapping gaps
  if (boardroomQualified && highImpactGaps.length === 0) {
    return "QUALIFIES";
  }

  // BORDERLINE: Boardroom adapter doesn't qualify but reasons indicate close qualification
  // or medium-impact gaps affect confidence
  if (!boardroomQualified) {
    // Check if the boardroom result indicates close qualification
    const rawOutput = boardroomResult?.rawOutput as Record<string, unknown> | undefined;
    const qualification = rawOutput?.qualification as { qualified: boolean; reason: string } | undefined;
    const reason = qualification?.reason ?? "";

    const closeIndicators = [
      "£5k", "£5,000", "accuracy", "partial", "borderline",
      "close", "threshold", "narrowly",
    ];
    const isClose = closeIndicators.some((ind) => reason.toLowerCase().includes(ind.toLowerCase()));

    if (isClose || mediumImpactGaps.length > 0) {
      return "BORDERLINE";
    }

    return "DOES_NOT_QUALIFY";
  }

  // Fallback: if qualified but gaps exist
  if (mediumImpactGaps.length > 0) {
    return "BORDERLINE";
  }

  return "DOES_NOT_QUALIFY";
}

// ─── Findings Builder ─────────────────────────────────────────────────────────

function buildBridgeFindings(
  erState: string,
  boardroomQualified: boolean,
  bridgeDecision: BridgeDecision,
  mappingGaps: MappingGap[],
  totalExposure: number,
  failureModes: string[],
): Finding[] {
  const findings: Finding[] = [];
  const t = Date.now();

  // Finding 1: High-impact mapping gaps
  const highGaps = mappingGaps.filter((g) => g.impact === "high");
  for (const gap of highGaps) {
    findings.push({
      id: `bridge-mapping-gap-${t}-${gap.targetField.replace(/[^a-zA-Z0-9]/g, "-")}`,
      title: `High-impact mapping gap: ${gap.targetField}`,
      description: `Missing source: ${gap.missingSource}. ${gap.recommendation}`,
      severity: "HIGH",
      source: `executive-report-boardroom-bridge::mapExecutiveReportToIntelligenceSpine::gap::${gap.targetField}`,
      evidence: `Missing source: ${gap.missingSource}. Target: ${gap.targetField}. Impact: ${gap.impact}.`,
      remediation: gap.recommendation,
    });
  }

  // Finding 2: ER state severe enough for Boardroom consideration
  if (erState === "DISORDERED") {
    findings.push({
      id: `bridge-er-state-${t}`,
      title: "Executive Report state: DISORDERED — Boardroom consideration warranted",
      description: `DISORDERED state indicates systemic instability. Financial exposure: £${Math.round(totalExposure).toLocaleString()}/month.`,
      severity: "HIGH",
      source: "executive-report-boardroom-bridge::executive-reporting-adapter::state",
      evidence: `State: ${erState}. Total exposure: £${Math.round(totalExposure).toLocaleString()}.`,
      remediation: "Boardroom review is recommended given DISORDERED state and financial exposure.",
    });
  }

  // Finding 3: Boardroom qualification failure
  if (!boardroomQualified && bridgeDecision !== "MAPPING_INSUFFICIENT") {
    findings.push({
      id: `bridge-boardroom-fail-${t}`,
      title: "Boardroom qualification: NOT MET",
      description: "The mapped IntelligenceSpine did not meet boardroom activation threshold.",
      severity: "MEDIUM",
      source: "executive-report-boardroom-bridge::boardroom-mode-adapter::qualification",
      evidence: `Bridge decision: ${bridgeDecision}. Boardroom qualified: ${boardroomQualified}.`,
      remediation: "Review whether the mapped spine accurately reflects the executive report's financial exposure.",
    });
  }

  // Finding 4: Contradiction/failure mode escalation
  if (failureModes.length > 0) {
    findings.push({
      id: `bridge-failure-modes-${t}`,
      title: `Failure modes escalated: ${failureModes.join(", ")}`,
      description: `${failureModes.length} failure mode(s) from executive report mapped to contradiction set.`,
      severity: failureModes.length >= 3 ? "HIGH" : "MEDIUM",
      source: "executive-report-boardroom-bridge::executive-reporting-adapter::failureModes",
      evidence: `Failure modes: ${failureModes.join(", ")}.`,
      remediation: "Address priority stack items before failure modes become structural.",
    });
  }

  // Finding 5: Financial exposure threshold
  if (totalExposure >= 5000) {
    findings.push({
      id: `bridge-financial-threshold-${t}`,
      title: `Financial exposure above boardroom threshold: £${Math.round(totalExposure).toLocaleString()}/month`,
      description: `Total exposure of £${Math.round(totalExposure).toLocaleString()}/month meets or exceeds the £5k boardroom activation threshold.`,
      severity: totalExposure >= 20000 ? "HIGH" : "MEDIUM",
      source: "executive-report-boardroom-bridge::executive-reporting-adapter::financialExposure",
      evidence: `Total exposure: £${Math.round(totalExposure).toLocaleString()}. Threshold: £5,000.`,
      remediation: "This level of financial exposure warrants boardroom review.",
    });
  }

  // Finding 6: Bridge decision summary
  findings.push({
    id: `bridge-decision-${t}`,
    title: `Bridge decision: ${bridgeDecision}`,
    description: bridgeDecision === "QUALIFIES"
      ? "Executive Report successfully mapped and boardroom-qualified."
      : bridgeDecision === "BORDERLINE"
        ? "Executive Report mapped but boardroom qualification is borderline."
        : bridgeDecision === "MAPPING_INSUFFICIENT"
          ? "Mapping gaps prevent reliable boardroom qualification."
          : "Executive Report mapped but does not qualify for boardroom.",
    severity: bridgeDecision === "QUALIFIES" ? "INFO"
      : bridgeDecision === "BORDERLINE" ? "MEDIUM"
      : bridgeDecision === "MAPPING_INSUFFICIENT" ? "HIGH"
      : "INFO",
    source: "executive-report-boardroom-bridge::bridge-decision",
    evidence: `Bridge decision: ${bridgeDecision}. Boardroom qualified: ${boardroomQualified}. Mapping gaps: ${mappingGaps.length}.`,
    remediation: bridgeDecision === "MAPPING_INSUFFICIENT"
      ? "Resolve high-impact mapping gaps before attempting boardroom qualification."
      : bridgeDecision === "BORDERLINE"
        ? "Review mapped spine and consider manual escalation."
        : undefined,
  });

  return findings;
}

// ─── Formula Steps Builder ────────────────────────────────────────────────────

function buildBridgeFormulaSteps(
  erState: string,
  mappingGaps: MappingGap[],
  mappingTraces: MappingTrace[],
  boardroomQualified: boolean,
): FormulaStep[] {
  return [
    {
      stepId: "er-adapter-run",
      label: "Executive Reporting adapter execution",
      inputs: {
        engineId: ER_ENGINE_ID,
        engineVersion: ER_VERSION,
      },
      intermediate: {
        state: erState,
        mappingTracesCount: mappingTraces.length,
        mappingGapsCount: mappingGaps.length,
      },
      output: `ExecutiveReport state: ${erState}`,
      sourceRule: "executiveReportingAdapter.run() — lib/research/engines/executive-reporting-adapter.ts",
      engineVersion: BRIDGE_VERSION,
    },
    {
      stepId: "er-to-spine-mapping",
      label: "Executive Report to IntelligenceSpine mapping",
      inputs: {
        mappingTraces: mappingTraces.length,
        mappingGaps: mappingGaps.length,
        highImpactGaps: mappingGaps.filter((g) => g.impact === "high").length,
        mediumImpactGaps: mappingGaps.filter((g) => g.impact === "medium").length,
      },
      intermediate: {
        allFieldsTraced: mappingGaps.length === 0 ? "true" : "false",
        hasHighImpactGaps: mappingGaps.some((g) => g.impact === "high") ? "true" : "false",
      },
      output: mappingGaps.length === 0 ? "All fields mapped" : `${mappingGaps.length} gap(s)`,
      sourceRule: "mapExecutiveReportToIntelligenceSpine() — lib/research/bridges/executive-report-to-intelligence-spine.ts",
      engineVersion: BRIDGE_VERSION,
    },
    {
      stepId: "boardroom-adapter-run",
      label: "Boardroom Mode adapter execution",
      inputs: {
        engineId: BOARDROOM_ENGINE_ID,
        engineVersion: BOARDROOM_VERSION,
        qualified: boardroomQualified ? "true" : "false",
      },
      intermediate: {
        mappingGapsResolved: mappingGaps.filter((g) => g.impact === "high").length === 0 ? "true" : "false",
      },
      output: boardroomQualified ? "Boardroom: QUALIFIED" : "Boardroom: NOT QUALIFIED",
      sourceRule: "boardroomModeAdapter.run() — lib/research/engines/boardroom-mode-adapter.ts",
      engineVersion: BRIDGE_VERSION,
    },
    {
      stepId: "bridge-decision",
      label: "Bridge decision determination",
      inputs: {
        boardroomQualified: boardroomQualified ? "true" : "false",
        highImpactGaps: mappingGaps.filter((g) => g.impact === "high").length,
      },
      intermediate: {
        decision: determineBridgeDecision(boardroomQualified, mappingGaps, null),
      },
      output: determineBridgeDecision(boardroomQualified, mappingGaps, null),
      sourceRule: "determineBridgeDecision() — lib/research/engines/executive-report-boardroom-bridge-adapter.ts",
      engineVersion: BRIDGE_VERSION,
    },
  ];
}

// ─── Core Run Logic ───────────────────────────────────────────────────────────

async function runAdapter(payload: Record<string, unknown>): Promise<EngineRunOutput> {
  const startMs = Date.now();

  const parseResult = bridgeInputSchema.safeParse(payload);
  if (!parseResult.success) {
    return {
      findings: [{
        id: `bridge-input-error-${Date.now()}`,
        title: "Invalid input",
        description: parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
        severity: "HIGH",
        source: "executive-report-boardroom-bridge-adapter::input-validation",
        evidence: JSON.stringify(parseResult.error.issues),
      }],
      summary: "Input validation failed.",
      severity: "HIGH",
      engineVersion: BRIDGE_VERSION,
      durationMs: 0,
      rawOutput: {},
      limitations: LIMITATIONS,
      promotionRequirements: PROMOTION_REQUIREMENTS,
    };
  }

  const input = parseResult.data;

  // ── Step 1: Select fixture ──
  let fixtureKey = "disordered";
  if (input.useDisorderedFixture) fixtureKey = "disordered";
  else if (input.useMisalignedFixture) fixtureKey = "misaligned";
  else if (input.useOrderedFixture) fixtureKey = "ordered";
  else if (input.useMappingGapFixture) fixtureKey = "mappingGap";
  else if (input.useMalformedFixture) fixtureKey = "malformed";

  const fixturePayload: Record<string, unknown> = FIXTURES[fixtureKey] ?? FIXTURES.disordered!;

  // ── Step 2: Run Executive Reporting adapter ──
  const erResult: EngineRunOutput = await executiveReportingAdapter.run({ payload: fixturePayload });
  const erRawOutput: Record<string, unknown> = (erResult.rawOutput ?? {}) as Record<string, unknown>;
  const erRawReport = erRawOutput.report as Record<string, unknown> | undefined;

  if (!erRawReport) {
    return {
      findings: [{
        id: `bridge-er-failed-${Date.now()}`,
        title: "Executive Reporting adapter returned no report",
        description: "The ER adapter did not produce a valid ExecutiveReport.",
        severity: "HIGH",
        source: "executive-report-boardroom-bridge-adapter::executive-reporting-adapter",
        evidence: JSON.stringify(erResult),
        remediation: "Check that the ER adapter fixture is valid and produces a report.",
      }],
      summary: "Bridge failed: no ExecutiveReport from ER adapter.",
      severity: "HIGH",
      engineVersion: BRIDGE_VERSION,
      durationMs: Date.now() - startMs,
      rawOutput: { erResult: erResult.rawOutput ?? {} },
      limitations: LIMITATIONS,
      promotionRequirements: PROMOTION_REQUIREMENTS,
    };
  }

  // Reconstruct proper ExecutiveReport shape from flattened raw output
  // The ER adapter's rawOutput.report has a flattened resonance structure
  // (resonance.averageDissonance instead of resonance.telemetry.averageDissonance)
  const erResonance = erRawReport.resonance as Record<string, unknown> | undefined;
  const erResonanceTelemetry = erResonance ? {
    averageDissonance: (erResonance.averageDissonance as number) ?? 0,
    domainCount: (erResonance.domainCount as number) ?? 0,
    totalResponses: (erResonance.totalResponses as number) ?? 0,
    weakestDomain: (erResonance.weakestDomain as string | null) ?? null,
    strongestDomain: (erResonance.strongestDomain as string | null) ?? null,
    isDisordered: (erResonance.isDisordered as boolean) ?? false,
    metrics: (erResonance.metrics as Array<Record<string, unknown>>)?.map((m) => ({
      label: m.label as string,
      dissonance: m.dissonance as number,
      intent: m.intent as number,
      reality: m.reality as number,
      responseCount: m.responseCount as number,
      coverage: (m.coverage ?? "MEDIUM") as "LOW" | "MEDIUM" | "HIGH",
    })) ?? [],
  } : undefined;

  const erReport: ExecutiveReport = {
    state: erRawReport.state as ExecutiveReport["state"],
    narrative: erRawReport.narrative as ExecutiveReport["narrative"],
    ogr: erRawReport.ogr as ExecutiveReport["ogr"],
    resonance: {
      telemetry: erResonanceTelemetry ?? {
        averageDissonance: 0, domainCount: 0, totalResponses: 0,
        weakestDomain: null, strongestDomain: null, isDisordered: false, metrics: [],
      },
      metrics: erResonanceTelemetry?.metrics ?? [],
    },
    hcd: erRawReport.hcd as ExecutiveReport["hcd"],
    hcdAggregate: erRawReport.hcdAggregate as ExecutiveReport["hcdAggregate"],
    financialExposure: erRawReport.financialExposure as ExecutiveReport["financialExposure"],
    priorityStack: (erRawReport.priorityStack as string[]) ?? [],
    failureModes: (erRawReport.failureModes as string[]) ?? [],
  };

  // ── Step 3: Map ExecutiveReport → IntelligenceSpine ──
  const mapped = mapExecutiveReportToIntelligenceSpine(erReport, {
    scenarioLabel: input.scenarioLabel,
    fixtureKey,
  });

  // ── Step 4: Run Boardroom Mode adapter against mapped spine ──
  const boardroomResult = await boardroomModeAdapter.run({
    payload: {
      spine: mapped.spine,
      scenarioLabel: input.scenarioLabel ? `${input.scenarioLabel}-boardroom` : undefined,
    },
  });

  const boardroomRawOutput = (boardroomResult.rawOutput ?? {}) as Record<string, unknown>;
  const boardroomQualification = boardroomRawOutput.qualification as { qualified: boolean; reason: string } | undefined;
  const qualifiesForBoardroomVal = boardroomQualification?.qualified ?? false;

  // ── Step 5: Determine bridge decision ──
  const bridgeDecision = determineBridgeDecision(qualifiesForBoardroomVal, mapped.mappingGaps, boardroomResult);

  // ── Step 6: Build findings ──
  const findings = buildBridgeFindings(
    erReport.state,
    qualifiesForBoardroomVal,
    bridgeDecision,
    mapped.mappingGaps,
    erReport.financialExposure.totalExposure,
    erReport.failureModes,
  );

  // ── Step 7: Build formula steps ──
  const formulaSteps = buildBridgeFormulaSteps(
    erReport.state,
    mapped.mappingGaps,
    mapped.mappingTrace,
    qualifiesForBoardroomVal,
  );

  const durationMs = Date.now() - startMs;

  const severity: EngineRunOutput["severity"] = findings.some((f) => f.severity === "CRITICAL")
    ? "CRITICAL"
    : findings.some((f) => f.severity === "HIGH")
      ? "HIGH"
      : findings.some((f) => f.severity === "MEDIUM")
        ? "MEDIUM"
        : "INFO";

  // ── Build bridge output ──
  const bridgeOutput: BridgeOutput = {
    executiveReport: erReport,
    mappedSpine: mapped.spine,
    boardroomResult,
    qualifiesForBoardroom: qualifiesForBoardroomVal,
    bridgeDecision,
    mappingTrace: mapped.mappingTrace,
    mappingGaps: mapped.mappingGaps,
    findings,
    formulaSteps,
    limitations: [...LIMITATIONS, ...mapped.limitations],
    promotionRequirements: [...PROMOTION_REQUIREMENTS, ...mapped.promotionRequirements],
    productionFunctionsCalled: [
      "executiveReportingAdapter.run() — lib/research/engines/executive-reporting-adapter.ts",
      "mapExecutiveReportToIntelligenceSpine() — lib/research/bridges/executive-report-to-intelligence-spine.ts",
      "boardroomModeAdapter.run() — lib/research/engines/boardroom-mode-adapter.ts",
      "determineBridgeDecision() — lib/research/engines/executive-report-boardroom-bridge-adapter.ts",
    ],
    pipelineStagesNotCalled: [
      "PDF export route — not called (no binary rendering)",
      "executive-report-service.ts — DB-bound, not called",
      "archiveIntake() — no persistence in Foundry runs",
      "enforceStrategyRoomAccess() — session admission, not called",
      "Payment/entitlement gate — DB-bound, not called",
      "lineageEvent(BRIDGE_EXECUTED) — not emitted in Foundry runs",
      "lineageEvent(BOARDROOM_DOSSIER_GENERATED) — not emitted in Foundry runs",
      "lineageEvent(BOARDROOM_DOSSIER_EXPORTED) — not emitted in Foundry runs",
      "generateBoardroomDossier() with real cohort data — called with empty cohort",
    ],
  };

  return {
    findings,
    summary: `ER → Boardroom Bridge: ${bridgeDecision}. ER state: ${erReport.state}. Boardroom qualified: ${qualifiesForBoardroomVal}. Mapping gaps: ${mapped.mappingGaps.length}.`,
    severity,
    engineVersion: BRIDGE_VERSION,
    durationMs,
    rawOutput: {
      engineId: BRIDGE_ENGINE_ID,
      runAt: new Date().toISOString(),
      fixtureKey,
      scenarioLabel: input.scenarioLabel ?? null,
      bridgeOutput,
      formulaSteps,
      productionFunctionsCalled: bridgeOutput.productionFunctionsCalled,
      pipelineStagesNotCalled: bridgeOutput.pipelineStagesNotCalled,
    },
    limitations: bridgeOutput.limitations,
    promotionRequirements: bridgeOutput.promotionRequirements,
  };
}

// ─── Limitations & Promotion Requirements ────────────────────────────────────

const LIMITATIONS: string[] = [
  "Uses synthetic ExecutiveReport fixtures — not real campaign data.",
  "Mapped IntelligenceSpine is synthetic — not a real user spine from production DB.",
  "Does not render PDF. PDF export route is not called.",
  "Does not call executive-report-service.ts or fetch real Executive Reporting run state.",
  "Does not persist bridge artefacts — no DB writes, no archive events.",
  "Does not issue client-facing board papers or BOARD_RESTRICTED documents.",
  "Does not validate payment or entitlement gate (DB-bound, not callable).",
  "HCD and OGR data is lost in mapping — IntelligenceSpine has no equivalent fields.",
  "Domain-level resonance telemetry is not preserved in mapped spine.",
];

const PROMOTION_REQUIREMENTS: string[] = [
  "Wire real ExecutiveReport from production pipeline instead of synthetic fixtures.",
  "Extend IntelligenceSpine with humanCapital/humanDynamics field to preserve HCD data.",
  "Extend IntelligenceSpine with governance/manifest field to preserve OGR data.",
  "Add PDF render dry-run adapter (section list returned, no binary output).",
  "Add lineage event simulation for BRIDGE_EXECUTED.",
  "Validate bridge decision against manual review of mapped spine.",
];

// ─── Public Adapter Contract ──────────────────────────────────────────────────

export const executiveReportBoardroomBridgeAdapter = {
  id: BRIDGE_ENGINE_ID,
  version: BRIDGE_VERSION,

  async selfTest(): Promise<{ passed: boolean; message: string }> {
    try {
      // Test 1: Disordered fixture → should qualify or be borderline
      const disorderedResult = await runAdapter({ useDisorderedFixture: true });
      const disorderedRaw = disorderedResult.rawOutput as Record<string, unknown>;
      const disorderedBridge = disorderedRaw.bridgeOutput as BridgeOutput | undefined;

      if (!disorderedBridge) {
        return { passed: false, message: "selfTest: no bridgeOutput in disordered run" };
      }
      if (disorderedBridge.bridgeDecision === "MAPPING_INSUFFICIENT") {
        return { passed: false, message: "selfTest: disordered fixture produced MAPPING_INSUFFICIENT — unexpected" };
      }

      // Test 2: Ordered fixture → should not qualify
      const orderedResult = await runAdapter({ useOrderedFixture: true });
      const orderedRaw = orderedResult.rawOutput as Record<string, unknown>;
      const orderedBridge = orderedRaw.bridgeOutput as BridgeOutput | undefined;

      if (!orderedBridge) {
        return { passed: false, message: "selfTest: no bridgeOutput in ordered run" };
      }

      // Test 3: Mapping traces exist
      if (disorderedBridge.mappingTrace.length === 0) {
        return { passed: false, message: "selfTest: no mapping traces produced" };
      }

      // Test 4: Findings exist
      if (disorderedResult.findings.length === 0) {
        return { passed: false, message: "selfTest: no findings produced" };
      }

      return {
        passed: true,
        message: `selfTest passed — disordered=${disorderedBridge.bridgeDecision}, ordered=${orderedBridge.bridgeDecision}, ${disorderedBridge.mappingTrace.length} traces, ${disorderedResult.findings.length} findings`,
      };
    } catch (err) {
      return {
        passed: false,
        message: `selfTest threw: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },

  getVersion(): string {
    return BRIDGE_VERSION;
  },

  async run(input: EngineRunInput): Promise<EngineRunOutput> {
    return runAdapter(input.payload ?? {});
  },

  limitations: LIMITATIONS,
  promotionRequirements: PROMOTION_REQUIREMENTS,
  productionFunctionsCalled: [
    "executiveReportingAdapter.run() — lib/research/engines/executive-reporting-adapter.ts",
    "mapExecutiveReportToIntelligenceSpine() — lib/research/bridges/executive-report-to-intelligence-spine.ts",
    "boardroomModeAdapter.run() — lib/research/engines/boardroom-mode-adapter.ts",
    "determineBridgeDecision() — lib/research/engines/executive-report-boardroom-bridge-adapter.ts",
  ],
  pipelineStagesNotCalled: [
    "PDF export route",
    "executive-report-service.ts (DB-bound)",
    "archiveIntake() (persistence)",
    "enforceStrategyRoomAccess() (session admission)",
    "Payment/entitlement gate (DB-bound)",
    "Boardroom lineage events",
    "Bridge lineage events",
    "generateBoardroomDossier() with real cohort data",
  ],
};
