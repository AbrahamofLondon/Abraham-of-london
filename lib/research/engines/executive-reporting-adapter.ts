/**
 * lib/research/engines/executive-reporting-adapter.ts
 *
 * Intelligence Foundry adapter for the Executive Reporting engine.
 * Wraps real production executive report generation logic.
 *
 * Status: PRODUCTION_CALLABLE
 *   - buildExecutiveReport() is pure: no DB, no AI, no network calls.
 *   - Composes resonance telemetry, HCD delta analysis, OGR manifest derivation,
 *     state classification, financial exposure, and narrative generation.
 *
 * Production functions called:
 *   - buildExecutiveReport() from lib/admin/reporting/executive-report-builder.ts
 *   - Internally: deriveResonanceMetricsFromResponses(), calculateHCDelta(),
 *     aggregateHCDMetrics(), sanitizeMetrics(), calculateDerived(),
 *     generateHCDBriefingSection()
 *
 * Explicit limitations (never omitted):
 *   1. Uses synthetic RawExecutiveResponse fixtures — not real campaign responses.
 *   2. Uses synthetic HCDMetrics fixtures — not real human capital data from DB.
 *   3. Uses synthetic OGRMetrics — not real organisational governance readings.
 *   4. Does not persist executive reports — no DB writes, no archive events.
 *   5. Does not trigger executive-report-service.ts (DB-bound, not called).
 *   6. Does not emit lineage events for report generation or delivery.
 *   7. Does not notify advisory channels or Discord.
 *   8. Financial exposure figures are illustrative — derived from synthetic inputs only.
 *
 * Promotion requirements (before FULL_PRODUCTION status):
 *   - Wire real campaign RawExecutiveResponse[] from assessment runs.
 *   - Wire real HCDMetrics[] from human capital diagnostic sessions.
 *   - Wire real OGRMetrics from governance manifest reads.
 *   - Emit lineage event: EXECUTIVE_REPORT_GENERATED with input/output hashes.
 *   - Integrate executive-report-service.ts run state check.
 */

import "server-only";

import { z } from "zod";
import {
  buildExecutiveReport,
  type BuildExecutiveReportInput,
  type ExecutiveReport,
  type ExecutiveReportState,
} from "@/lib/admin/reporting/executive-report-builder";
import type { RawExecutiveResponse } from "@/lib/admin/reporting/derive-resonance-metrics";
import type { HCDMetrics } from "@/lib/alignment/human-capital-delta";
import type { OGRMetrics } from "@/lib/ogr/manifest-engine";
import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ──────────────────────────────────────────────────────────

export const ER_ENGINE_ID = "executive-reporting";
export const ER_VERSION = "2.0.0";

// ─── Fixtures ─────────────────────────────────────────────────────────────────
// All fixtures use illustrative data only. No real user, org, or campaign data.

/**
 * DISORDERED fixture — high dissonance (>30%) across leadership and governance domains.
 * LEADERSHIP_TRUST: intent=85, reality=17.5 → dissonance=67.5
 * EXECUTION_AUTHORITY: intent=85, reality=25 → dissonance=60
 * GOVERNANCE_DISCIPLINE: intent=85, reality=18 → dissonance=67
 * averageDissonance ≈ 64.8 → triggers DISORDERED state (threshold: 30).
 * HCD: leadership burnoutIndex=82 → CRITICAL riskScore → also triggers DISORDERED.
 */
const DISORDERED_RESPONSES: RawExecutiveResponse[] = [
  { domain: "LEADERSHIP_TRUST", intent: 85, reality: 15 },
  { domain: "LEADERSHIP_TRUST", intent: 85, reality: 20 },
  { domain: "EXECUTION_AUTHORITY", intent: 85, reality: 25 },
  { domain: "GOVERNANCE_DISCIPLINE", intent: 85, reality: 20 },
  { domain: "GOVERNANCE_DISCIPLINE", intent: 85, reality: 16 },
];

const DISORDERED_HCD: HCDMetrics[] = [
  {
    label: "LEADERSHIP_EXHAUSTION",
    intent: 90,
    reality: 30,
    burnoutIndex: 82,
    wellbeing: 35,
    headcount: 5,
    tenure: 42,
    attritionRisk: "HIGH",
  },
  {
    label: "ENGINEERING_VELOCITY",
    intent: 100,
    reality: 42,
    burnoutIndex: 58,
    wellbeing: 42,
    headcount: 12,
    tenure: 18,
    attritionRisk: "MODERATE",
  },
];

const DISORDERED_OGR: Partial<OGRMetrics> = {
  resonanceScore: 35,
  marketFriction: 55,
  targetRevenue: 600,
  // sovereignCertainty = (35*0.7) + ((100-55)*0.3) = 24.5 + 13.5 = 38 → not authorized
};

/**
 * MISALIGNED fixture — moderate dissonance (12–30%) and not authorized to execute.
 * MARKET_RESONANCE: intent=80, reality=62.5 → dissonance=17.5
 * STAKEHOLDER_ALIGNMENT: intent=75, reality=60 → dissonance=15
 * averageDissonance ≈ 16.25 → triggers MISALIGNED state (>12, not >30).
 * OGR: sovereignCertainty ≈ 67 → not authorized → confirms MISALIGNED.
 */
const MISALIGNED_RESPONSES: RawExecutiveResponse[] = [
  { domain: "MARKET_RESONANCE", intent: 80, reality: 60 },
  { domain: "MARKET_RESONANCE", intent: 80, reality: 65 },
  { domain: "STAKEHOLDER_ALIGNMENT", intent: 75, reality: 60 },
];

const MISALIGNED_HCD: HCDMetrics[] = [
  {
    label: "WORKLOAD_DISTRIBUTION",
    intent: 80,
    reality: 60,
    burnoutIndex: 45,
    wellbeing: 62,
    headcount: 18,
    tenure: 24,
    attritionRisk: "MODERATE",
  },
];

const MISALIGNED_OGR: Partial<OGRMetrics> = {
  resonanceScore: 65,
  marketFriction: 28,
  targetRevenue: 350,
  // sovereignCertainty = (65*0.7) + ((100-28)*0.3) = 45.5 + 21.6 = 67.1 → not authorized
};

/**
 * ORDERED fixture — low dissonance (<12%) and authorized to execute.
 * MARKET_RESONANCE: intent=85, reality=82 → dissonance=3
 * PURPOSE_ALIGNMENT: intent=88, reality=85 → dissonance=3
 * averageDissonance = 3 → not DISORDERED, not MISALIGNED.
 * OGR: sovereignCertainty ≈ 92 → authorized → ORDERED.
 */
const ORDERED_RESPONSES: RawExecutiveResponse[] = [
  { domain: "MARKET_RESONANCE", intent: 85, reality: 82 },
  { domain: "PURPOSE_ALIGNMENT", intent: 88, reality: 85 },
];

const ORDERED_HCD: HCDMetrics[] = [
  {
    label: "ENGINEERING_VELOCITY",
    intent: 90,
    reality: 88,
    burnoutIndex: 18,
    wellbeing: 82,
    headcount: 14,
    tenure: 22,
    attritionRisk: "LOW",
  },
];

const ORDERED_OGR: Partial<OGRMetrics> = {
  resonanceScore: 92,
  marketFriction: 8,
  targetRevenue: 250,
  // sovereignCertainty = (92*0.7) + ((100-8)*0.3) = 64.4 + 27.6 = 92 → authorized
};

const FIXTURES: Record<string, BuildExecutiveReportInput> = {
  disordered: {
    responses: DISORDERED_RESPONSES,
    hcdMetrics: DISORDERED_HCD,
    ogrMetrics: DISORDERED_OGR,
  },
  misaligned: {
    responses: MISALIGNED_RESPONSES,
    hcdMetrics: MISALIGNED_HCD,
    ogrMetrics: MISALIGNED_OGR,
  },
  ordered: {
    responses: ORDERED_RESPONSES,
    hcdMetrics: ORDERED_HCD,
    ogrMetrics: ORDERED_OGR,
  },
};

// ─── Input Schema ─────────────────────────────────────────────────────────────

const erInputSchema = z.object({
  /** Use the DISORDERED fixture (high dissonance, critical HCD risk) */
  useDisorderedFixture: z.boolean().optional().default(false),
  /** Use the MISALIGNED fixture (moderate dissonance, not authorized) */
  useMisalignedFixture: z.boolean().optional().default(false),
  /** Use the ORDERED fixture (low dissonance, authorized, stable HCD) */
  useOrderedFixture: z.boolean().optional().default(false),
  /** Optional label for test run identification */
  scenarioLabel: z.string().optional(),
});

// ─── Formula Step Builder ─────────────────────────────────────────────────────
// All inputs/intermediate/output values must be string | number per FormulaStep contract.

function buildFormulaSteps(
  fixtureInput: BuildExecutiveReportInput,
  report: ExecutiveReport,
): FormulaStep[] {
  const resonance = report.resonance.telemetry;
  const hcdAgg = report.hcdAggregate;
  const ogr = report.ogr;

  return [
    {
      stepId: "resonance-derivation",
      label: "Resonance telemetry derivation",
      inputs: {
        responseCount: fixtureInput.responses.length,
        domainCount: resonance.domainCount,
        totalResponses: resonance.totalResponses,
      },
      intermediate: {
        averageDissonance: resonance.averageDissonance,
        weakestDomain: resonance.weakestDomain ?? "none",
        strongestDomain: resonance.strongestDomain ?? "none",
        isDisordered: resonance.isDisordered ? "true" : "false",
        disorderThreshold: 30,
      },
      output: resonance.averageDissonance,
      sourceRule:
        "deriveResonanceMetricsFromResponses() — lib/admin/reporting/derive-resonance-metrics.ts",
      engineVersion: ER_VERSION,
    },
    {
      stepId: "hcd-analysis",
      label: "Human capital delta analysis",
      inputs: {
        hcdMetricsCount: fixtureInput.hcdMetrics.length,
        criticalCount: hcdAgg.criticalCount,
        elevatedCount: hcdAgg.elevatedCount,
      },
      intermediate: {
        averageDelta: hcdAgg.averageDelta,
        overallBurnoutIndex: hcdAgg.overallBurnoutIndex,
        riskScore: hcdAgg.riskScore,
        criticalDomains: hcdAgg.criticalDomains.join(", ") || "none",
        totalReplacementCost: hcdAgg.totalReplacementCost,
      },
      output: `${hcdAgg.riskScore} — avg delta ${hcdAgg.averageDelta.toFixed(1)}`,
      sourceRule:
        "calculateHCDelta() + aggregateHCDMetrics() — lib/alignment/human-capital-delta.ts",
      engineVersion: ER_VERSION,
    },
    {
      stepId: "ogr-computation",
      label: "OGR manifest derivation",
      inputs: {
        resonanceScore: fixtureInput.ogrMetrics.resonanceScore ?? 0,
        marketFriction: fixtureInput.ogrMetrics.marketFriction ?? 0,
        targetRevenue: fixtureInput.ogrMetrics.targetRevenue ?? 0,
      },
      intermediate: {
        integrationTax: ogr.integrationTax,
        velocityMultiplier: ogr.velocityMultiplier,
        resonanceAlpha: ogr.resonanceAlpha,
        sovereignCertainty: ogr.sovereignCertainty,
        isAuthorizedToExecute: ogr.isAuthorizedToExecute ? "true" : "false",
        sovereignThreshold: 90,
      },
      output: ogr.sovereignCertainty,
      sourceRule: "sanitizeMetrics() + calculateDerived() — lib/ogr/manifest-engine.ts",
      engineVersion: ER_VERSION,
    },
    {
      stepId: "state-classification",
      label: "Executive report state classification",
      inputs: {
        averageDissonance: resonance.averageDissonance,
        hcdRiskScore: hcdAgg.riskScore,
        isAuthorizedToExecute: ogr.isAuthorizedToExecute ? "true" : "false",
        disorderThreshold: 30,
        misalignedThreshold: 12,
      },
      intermediate: {
        dissonanceAbove30: resonance.averageDissonance > 30 ? "true" : "false",
        dissonanceAbove12: resonance.averageDissonance > 12 ? "true" : "false",
        hcdCritical: hcdAgg.riskScore === "CRITICAL" ? "true" : "false",
        executionAuthorized: ogr.isAuthorizedToExecute ? "true" : "false",
        financialExposureTotal: report.financialExposure.totalExposure,
      },
      output: report.state,
      sourceRule: "buildExecutiveReport() — lib/admin/reporting/executive-report-builder.ts",
      engineVersion: ER_VERSION,
    },
  ];
}

// ─── Findings Builder ─────────────────────────────────────────────────────────

const STATE_SEVERITY: Record<ExecutiveReportState, Finding["severity"]> = {
  DISORDERED: "CRITICAL",
  MISALIGNED: "HIGH",
  ORDERED: "INFO",
};

function buildFindings(report: ExecutiveReport): Finding[] {
  const findings: Finding[] = [];
  const t = Date.now();

  // Finding 1: Executive state
  const stateSeverity = STATE_SEVERITY[report.state];
  findings.push({
    id: `er-state-${t}`,
    title: `Executive report state: ${report.state}`,
    description: report.narrative.headline,
    severity: stateSeverity,
    source: "executive-reporting::buildExecutiveReport::state",
    evidence: report.narrative.summary,
    remediation:
      report.state !== "ORDERED" ? report.narrative.mandate : undefined,
  });

  // Finding 2: Financial exposure (only if non-zero)
  if (report.financialExposure.totalExposure > 0) {
    findings.push({
      id: `er-financial-${t + 1}`,
      title: `Financial exposure: £${Math.round(report.financialExposure.totalExposure).toLocaleString()}`,
      description: `Replacement cost: £${Math.round(report.financialExposure.replacementCost).toLocaleString()}. Execution loss: £${Math.round(report.financialExposure.executionLoss).toLocaleString()}.`,
      severity: report.financialExposure.totalExposure > 50000 ? "HIGH" : "MEDIUM",
      source: "executive-reporting::buildExecutiveReport::financialExposure",
      evidence: `Total: £${Math.round(report.financialExposure.totalExposure).toLocaleString()}. Replacement: £${Math.round(report.financialExposure.replacementCost).toLocaleString()}. Execution loss: £${Math.round(report.financialExposure.executionLoss).toLocaleString()}.`,
    });
  }

  // Finding 3: OGR authorization status
  findings.push({
    id: `er-ogr-${t + 2}`,
    title: report.ogr.isAuthorizedToExecute
      ? "Execution authority: VERIFIED"
      : "Execution authority: NOT VERIFIED",
    description: `Sovereign certainty: ${report.ogr.sovereignCertainty.toFixed(2)}% (threshold: 90%).`,
    severity: report.ogr.isAuthorizedToExecute ? "INFO" : "HIGH",
    source: "executive-reporting::buildExecutiveReport::ogr",
    evidence: `sovereignCertainty=${report.ogr.sovereignCertainty.toFixed(4)}. integrationTax=${report.ogr.integrationTax}. velocityMultiplier=${report.ogr.velocityMultiplier}.`,
    remediation: !report.ogr.isAuthorizedToExecute
      ? "Reduce market friction and improve resonance score before proceeding."
      : undefined,
  });

  // Finding 4: Priority stack (always present)
  if (report.priorityStack.length > 0) {
    findings.push({
      id: `er-priority-${t + 3}`,
      title: `Priority stack: ${report.priorityStack.length} actions required`,
      description: report.priorityStack[0] ?? "No items",
      severity: "INFO",
      source: "executive-reporting::buildExecutiveReport::priorityStack",
      evidence: report.priorityStack.join(" | "),
    });
  }

  // Finding 5: Failure modes (only if any detected)
  if (report.failureModes.length > 0) {
    findings.push({
      id: `er-failure-modes-${t + 4}`,
      title: `Failure modes detected: ${report.failureModes.join(", ")}`,
      description: `${report.failureModes.length} active failure mode(s) identified by the executive reporting engine.`,
      severity: report.failureModes.length >= 3 ? "HIGH" : "MEDIUM",
      source: "executive-reporting::buildExecutiveReport::failureModes",
      evidence: report.failureModes.join(", "),
      remediation: "Address priority stack items before failure modes become structural.",
    });
  }

  return findings;
}

// ─── Core Run Logic ───────────────────────────────────────────────────────────

async function runAdapter(payload: Record<string, unknown>): Promise<EngineRunOutput> {
  const startMs = Date.now();

  const parseResult = erInputSchema.safeParse(payload);
  if (!parseResult.success) {
    return {
      findings: [
        {
          id: `er-input-error-${Date.now()}`,
          title: "Invalid input",
          description: parseResult.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
          severity: "HIGH",
          source: "executive-reporting-adapter::input-validation",
          evidence: JSON.stringify(parseResult.error.issues),
        },
      ],
      summary: "Input validation failed.",
      severity: "HIGH",
      engineVersion: ER_VERSION,
      durationMs: 0,
      rawOutput: {},
      limitations: LIMITATIONS,
      promotionRequirements: PROMOTION_REQUIREMENTS,
    };
  }

  const input = parseResult.data;

  // Select fixture
  let fixtureKey = "disordered"; // default to disordered — most informative
  if (input.useDisorderedFixture) fixtureKey = "disordered";
  else if (input.useMisalignedFixture) fixtureKey = "misaligned";
  else if (input.useOrderedFixture) fixtureKey = "ordered";

  const fixtureInput = FIXTURES[fixtureKey]!;

  // Call real production function — no DB, no AI, no external calls
  const report = buildExecutiveReport(fixtureInput);

  const formulaSteps = buildFormulaSteps(fixtureInput, report);
  const findings = buildFindings(report);
  const durationMs = Date.now() - startMs;

  const severity: EngineRunOutput["severity"] = findings.some((f) => f.severity === "CRITICAL")
    ? "CRITICAL"
    : findings.some((f) => f.severity === "HIGH")
      ? "HIGH"
      : findings.some((f) => f.severity === "MEDIUM")
        ? "MEDIUM"
        : "INFO";

  return {
    findings,
    summary: `Executive Reporting: ${report.state} — ${report.narrative.headline}. Dissonance: ${report.resonance.telemetry.averageDissonance}%. HCD: ${report.hcdAggregate.riskScore}. Execution: ${report.ogr.isAuthorizedToExecute ? "AUTHORIZED" : "NOT AUTHORIZED"}.`,
    severity,
    engineVersion: ER_VERSION,
    durationMs,
    rawOutput: {
      engineId: ER_ENGINE_ID,
      runAt: new Date().toISOString(),
      fixtureKey,
      scenarioLabel: input.scenarioLabel ?? null,
      report: {
        state: report.state,
        narrative: report.narrative,
        ogr: report.ogr,
        resonance: {
          averageDissonance: report.resonance.telemetry.averageDissonance,
          domainCount: report.resonance.telemetry.domainCount,
          totalResponses: report.resonance.telemetry.totalResponses,
          weakestDomain: report.resonance.telemetry.weakestDomain,
          strongestDomain: report.resonance.telemetry.strongestDomain,
          isDisordered: report.resonance.telemetry.isDisordered,
          metrics: report.resonance.metrics,
        },
        hcd: report.hcd,
        hcdAggregate: report.hcdAggregate,
        financialExposure: report.financialExposure,
        priorityStack: report.priorityStack,
        failureModes: report.failureModes,
      },
      formulaSteps,
      productionFunctionsCalled: PRODUCTION_FUNCTIONS_CALLED,
      pipelineStagesNotCalled: PIPELINE_STAGES_NOT_CALLED,
    },
    limitations: LIMITATIONS,
    promotionRequirements: PROMOTION_REQUIREMENTS,
  };
}

// ─── Limitations & Promotion Requirements ────────────────────────────────────

const LIMITATIONS: string[] = [
  "Uses synthetic RawExecutiveResponse fixtures — not real campaign responses from production DB.",
  "Uses synthetic HCDMetrics fixtures — not real human capital data.",
  "Uses synthetic OGRMetrics — not real organisational governance readings.",
  "Does not persist executive reports — no DB writes, no archive events.",
  "Does not trigger executive-report-service.ts (DB-bound, not called).",
  "Does not emit lineage events for report generation or delivery.",
  "Does not notify advisory channels or Discord.",
  "Financial exposure figures are illustrative — derived from synthetic inputs only.",
];

const PROMOTION_REQUIREMENTS: string[] = [
  "Wire real campaign RawExecutiveResponse[] from assessment runs.",
  "Wire real HCDMetrics[] from human capital diagnostic sessions.",
  "Wire real OGRMetrics from governance manifest reads.",
  "Emit lineage event: EXECUTIVE_REPORT_GENERATED with input/output hashes.",
  "Integrate executive-report-service.ts run state check.",
];

const PRODUCTION_FUNCTIONS_CALLED: string[] = [
  "buildExecutiveReport() — lib/admin/reporting/executive-report-builder.ts",
  "deriveResonanceMetricsFromResponses() — lib/admin/reporting/derive-resonance-metrics.ts",
  "calculateHCDelta() — lib/alignment/human-capital-delta.ts",
  "aggregateHCDMetrics() — lib/alignment/human-capital-delta.ts",
  "generateHCDBriefingSection() — lib/alignment/human-capital-delta.ts",
  "sanitizeMetrics() — lib/ogr/manifest-engine.ts",
  "calculateDerived() — lib/ogr/manifest-engine.ts",
];

const PIPELINE_STAGES_NOT_CALLED: string[] = [
  "executive-report-service.ts (DB-bound, not called)",
  "DiagnosticJourney queries (DB-bound, not called)",
  "Lineage event emission (not called in Foundry runs)",
  "Discord/advisory channel notification (not called)",
  "Executive report persistence (no DB writes)",
];

// ─── Public Adapter Contract ──────────────────────────────────────────────────

export const executiveReportingAdapter = {
  id: ER_ENGINE_ID,
  version: ER_VERSION,

  async selfTest(): Promise<{ passed: boolean; message: string }> {
    try {
      const result = await runAdapter({ useDisorderedFixture: true });
      const rawOutput = result.rawOutput as Record<string, unknown>;
      const report = rawOutput?.report as Record<string, unknown> | undefined;
      const formulaSteps = rawOutput?.formulaSteps as FormulaStep[] | undefined;

      if (!report?.state) {
        return { passed: false, message: "selfTest: report.state missing from rawOutput" };
      }
      if (report.state !== "DISORDERED") {
        return {
          passed: false,
          message: `selfTest: expected DISORDERED state, got ${String(report.state)}`,
        };
      }
      if (!formulaSteps || formulaSteps.length !== 4) {
        return {
          passed: false,
          message: `selfTest: expected 4 formula steps, got ${formulaSteps?.length ?? 0}`,
        };
      }
      if (!result.findings || result.findings.length === 0) {
        return { passed: false, message: "selfTest: no findings returned" };
      }
      return {
        passed: true,
        message: `selfTest passed — state=DISORDERED, 4 formula steps, ${result.findings.length} findings`,
      };
    } catch (err) {
      return {
        passed: false,
        message: `selfTest threw: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },

  getVersion(): string {
    return ER_VERSION;
  },

  async run(input: EngineRunInput): Promise<EngineRunOutput> {
    return runAdapter(input.payload ?? {});
  },

  limitations: LIMITATIONS,
  promotionRequirements: PROMOTION_REQUIREMENTS,
  productionFunctionsCalled: PRODUCTION_FUNCTIONS_CALLED,
  pipelineStagesNotCalled: PIPELINE_STAGES_NOT_CALLED,
};
