/* lib/admin/reporting/executive-report-builder.ts
   ---------------------------------------------------------------------------
   EXECUTIVE REPORT BUILDER
   Canonical composition layer for resonance, HCD, OGR, and financial exposure.
   --------------------------------------------------------------------------- */

import {
  deriveResonanceMetricsFromResponses,
  type DerivedResonanceMetric,
  type DerivedResonanceTelemetry,
  type RawExecutiveResponse,
} from "./derive-resonance-metrics";
import {
  calculateHCDelta,
  aggregateHCDMetrics,
  generateHCDBriefingSection,
  type HCDMetrics,
  type HCDResult,
  type HCDAggregate,
} from "@/lib/alignment/human-capital-delta";
import {
  calculateDerived,
  sanitizeMetrics,
  type OGRMetrics,
  type OGRComputed,
} from "@/lib/ogr/manifest-engine";

export type ExecutiveReportState =
  | "ORDERED"
  | "MISALIGNED"
  | "DISORDERED";

export type ExecutiveReportNarrative = {
  headline: string;
  summary: string;
  mandate: string;
};

export type ExecutiveFinancialExposure = {
  replacementCost: number;
  executionLoss: number;
  totalExposure: number;
};

export type ExecutiveReport = {
  state: ExecutiveReportState;
  narrative: ExecutiveReportNarrative;
  ogr: OGRComputed;
  resonance: {
    telemetry: DerivedResonanceTelemetry;
    metrics: DerivedResonanceMetric[];
  };
  hcd: HCDResult[];
  hcdAggregate: HCDAggregate;
  financialExposure: ExecutiveFinancialExposure;
  priorityStack: string[];
  failureModes: string[];
};

export type BuildExecutiveReportInput = {
  responses: RawExecutiveResponse[];
  hcdMetrics: HCDMetrics[];
  ogrMetrics: Partial<OGRMetrics>;
};

function roundTo(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function buildState(
  averageDissonance: number,
  hcdAggregate: HCDAggregate,
  ogr: OGRComputed
): ExecutiveReportState {
  if (
    averageDissonance > 30 ||
    hcdAggregate.riskScore === "CRITICAL"
  ) {
    return "DISORDERED";
  }

  if (
    averageDissonance > 12 ||
    hcdAggregate.riskScore === "HIGH" ||
    !ogr.isAuthorizedToExecute
  ) {
    return "MISALIGNED";
  }

  return "ORDERED";
}

function buildExecutionLoss(
  resonanceTelemetry: DerivedResonanceTelemetry,
  ogr: OGRComputed,
  ogrMetrics: OGRMetrics
): number {
  const dragRatio = resonanceTelemetry.averageDissonance / 100;
  const certaintyPenalty = Math.max(0, 100 - ogr.sovereignCertainty) / 100;
  const revenue = ogrMetrics.targetRevenue * 1000; // thousands for more realistic scaling

  return roundTo(revenue * (dragRatio * 0.55 + certaintyPenalty * 0.45), 0);
}

function buildNarrative(input: {
  state: ExecutiveReportState;
  resonanceTelemetry: DerivedResonanceTelemetry;
  hcdAggregate: HCDAggregate;
  ogr: OGRComputed;
  hcdSection: ReturnType<typeof generateHCDBriefingSection>;
}): ExecutiveReportNarrative {
  const {
    state,
    resonanceTelemetry,
    hcdAggregate,
    ogr,
    hcdSection,
  } = input;

  if (state === "DISORDERED") {
    return {
      headline: "Systemic Disorder Detected",
      summary: `Average dissonance has reached ${resonanceTelemetry.averageDissonance}%. Burnout risk is ${hcdAggregate.riskScore}. Execution authority is not credible under present conditions.`,
      mandate: `Suspend acceleration. Contain drift in ${resonanceTelemetry.weakestDomain ?? "the weakest domain"}, stabilize human capital exposure, and re-establish governable order.`,
    };
  }

  if (state === "MISALIGNED") {
    return {
      headline: "Structural Misalignment Identified",
      summary: `${hcdSection.summary} Sovereign certainty currently stands at ${ogr.sovereignCertainty.toFixed(2)}%. The system remains operational, but not clean.`,
      mandate: `Correct ${resonanceTelemetry.weakestDomain ?? "the weakest domain"}, reduce avoidable drag, and withhold full execution until the certainty threshold is restored.`,
    };
  }

  return {
    headline: "Institutional Order Verified",
    summary: `Average dissonance is ${resonanceTelemetry.averageDissonance}%. Burnout remains within controlled limits and the execution environment is governable.`,
    mandate: `Proceed with controlled execution. Maintain present discipline and monitor ${resonanceTelemetry.strongestDomain ?? "core domains"} for signal decay.`,
  };
}

function buildPriorityStack(input: {
  state: ExecutiveReportState;
  resonanceTelemetry: DerivedResonanceTelemetry;
  hcdSection: ReturnType<typeof generateHCDBriefingSection>;
  ogr: OGRComputed;
}): string[] {
  const items: string[] = [];

  if (!input.ogr.isAuthorizedToExecute) {
    items.push("Suspend execution — alignment not verified");
  }

  if (input.resonanceTelemetry.weakestDomain) {
    const weakest = input.resonanceTelemetry.metrics.find(
      (m) => m.label === input.resonanceTelemetry.weakestDomain
    );
    if (weakest) {
      items.push(
        `Correct ${weakest.label} (dissonance: ${roundTo(weakest.dissonance, 0)}%)`
      );
    }
  }

  for (const recommendation of input.hcdSection.recommendations.slice(0, 2)) {
    items.push(recommendation);
  }

  if (input.state === "ORDERED") {
    items.push("Maintain operating discipline and preserve signal integrity");
  }

  return [...new Set(items)];
}

function buildFailureModes(input: {
  state: ExecutiveReportState;
  resonanceTelemetry: DerivedResonanceTelemetry;
  hcdAggregate: HCDAggregate;
  ogr: OGRComputed;
}): string[] {
  const items = new Set<string>();

  if (input.resonanceTelemetry.averageDissonance >= 20) {
    items.add("Execution Stall");
  }

  if (input.hcdAggregate.overallBurnoutIndex >= 60) {
    items.add("Capacity Saturation");
  }

  if (input.resonanceTelemetry.weakestDomain === "LEADERSHIP_TRUST") {
    items.add("Leadership Signal Erosion");
  }

  if (!input.ogr.isAuthorizedToExecute) {
    items.add("Unauthorized Expansion");
  }

  if (input.state === "DISORDERED") {
    items.add("Systemic Governance Fracture");
  }

  return [...items];
}

export function buildExecutiveReport(
  input: BuildExecutiveReportInput
): ExecutiveReport {
  const resonanceTelemetry = deriveResonanceMetricsFromResponses(input.responses);
  const hcd = calculateHCDelta(input.hcdMetrics);
  const hcdAggregate = aggregateHCDMetrics(hcd);

  const ogrMetrics = sanitizeMetrics(input.ogrMetrics);
  const ogr = calculateDerived(ogrMetrics);

  const executionLoss = buildExecutionLoss(resonanceTelemetry, ogr, ogrMetrics);
  const financialExposure: ExecutiveFinancialExposure = {
    replacementCost: hcdAggregate.totalReplacementCost,
    executionLoss,
    totalExposure: roundTo(hcdAggregate.totalReplacementCost + executionLoss, 0),
  };

  const hcdSection = generateHCDBriefingSection(hcd, hcdAggregate);
  const state = buildState(
    resonanceTelemetry.averageDissonance,
    hcdAggregate,
    ogr
  );

  const narrative = buildNarrative({
    state,
    resonanceTelemetry,
    hcdAggregate,
    ogr,
    hcdSection,
  });

  const priorityStack = buildPriorityStack({
    state,
    resonanceTelemetry,
    hcdSection,
    ogr,
  });

  const failureModes = buildFailureModes({
    state,
    resonanceTelemetry,
    hcdAggregate,
    ogr,
  });

  return {
    state,
    narrative,
    ogr,
    resonance: {
      telemetry: resonanceTelemetry,
      metrics: resonanceTelemetry.metrics,
    },
    hcd,
    hcdAggregate,
    financialExposure,
    priorityStack,
    failureModes,
  };
}