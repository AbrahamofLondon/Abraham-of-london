/**
 * lib/research/engines/cost-of-delay-adapter.ts
 *
 * Intelligence Foundry adapter for the Cost of Delay engine.
 *
 * Wraps: computeCostOfDelay() from lib/research/engines/cost-of-delay-engine.ts
 *
 * Status: PRODUCTION_CALLABLE
 * - All logic is deterministic WSJF arithmetic — no AI, no external calls
 * - No data mutation
 * - Accepts WSJF inputs (Fibonacci scale) + optional financial inputs (GBP)
 *
 * Payload fields:
 *   WSJF inputs (required):
 *     - userBusinessValue: number (Fibonacci 1–21)
 *     - timeCriticality: number (Fibonacci 1–21)
 *     - riskReduction: number (Fibonacci 1–21)
 *     - jobDuration: number (Fibonacci 1–21)
 *   Financial inputs (optional):
 *     - weeklyRevenueAtRisk: number (£)
 *     - weeksDelayed: number
 *     - governancePenaltyPerWeek: number (£)
 *     - weeklyOpportunityCost: number (£)
 *   Fixtures:
 *     - useCriticalFixture: true — high-value, long-delayed scenario
 *     - useMediumFixture: true — medium priority scenario
 *     - useLowFixture: true — low priority scenario
 */

import "server-only";

import {
  computeCostOfDelay,
  computeWsjf,
  classifyWsjf,
  COST_OF_DELAY_ENGINE_ID,
  COST_OF_DELAY_VERSION,
  type WSJFInputs,
  type FinancialInputs,
} from "@/lib/research/engines/cost-of-delay-engine";
import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CRITICAL_FIXTURE: { wsjf: WSJFInputs; financial: FinancialInputs } = {
  wsjf: {
    userBusinessValue: 13,
    timeCriticality: 21,
    riskReduction: 13,
    jobDuration: 2,
  },
  financial: {
    weeklyRevenueAtRisk: 28_000,
    weeksDelayed: 4,
    governancePenaltyPerWeek: 5_000,
    weeklyOpportunityCost: 12_000,
  },
};

const MEDIUM_FIXTURE: { wsjf: WSJFInputs; financial: FinancialInputs } = {
  wsjf: {
    userBusinessValue: 5,
    timeCriticality: 5,
    riskReduction: 3,
    jobDuration: 5,
  },
  financial: {
    weeklyRevenueAtRisk: 8_000,
    weeksDelayed: 2,
    governancePenaltyPerWeek: 1_000,
    weeklyOpportunityCost: 2_500,
  },
};

const LOW_FIXTURE: { wsjf: WSJFInputs; financial: FinancialInputs } = {
  wsjf: {
    userBusinessValue: 2,
    timeCriticality: 1,
    riskReduction: 1,
    jobDuration: 13,
  },
  financial: {
    weeklyRevenueAtRisk: 0,
    weeksDelayed: 1,
  },
};

// ─── Self-test ────────────────────────────────────────────────────────────────

async function selfTest(): Promise<{ ok: boolean; message: string }> {
  try {
    const critical = computeCostOfDelay(CRITICAL_FIXTURE.wsjf, CRITICAL_FIXTURE.financial);
    const medium = computeCostOfDelay(MEDIUM_FIXTURE.wsjf, MEDIUM_FIXTURE.financial);
    const low = computeCostOfDelay(LOW_FIXTURE.wsjf, LOW_FIXTURE.financial);

    if (critical.wsjfTier !== "CRITICAL") {
      return { ok: false, message: `Expected CRITICAL tier, got ${critical.wsjfTier}` };
    }
    if (medium.wsjfTier !== "MEDIUM") {
      return { ok: false, message: `Expected MEDIUM tier, got ${medium.wsjfTier}` };
    }
    if (low.wsjfTier !== "LOW") {
      return { ok: false, message: `Expected LOW tier, got ${low.wsjfTier}` };
    }

    return {
      ok: true,
      message: `WSJF: critical=${critical.wsjfScore} (${critical.wsjfTier}), medium=${medium.wsjfScore} (${medium.wsjfTier}), low=${low.wsjfScore} (${low.wsjfTier})`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Self-test failed" };
  }
}

function getVersion(): string {
  return COST_OF_DELAY_VERSION;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function run(input: EngineRunInput): Promise<EngineRunOutput> {
  const startTime = Date.now();

  const payload = (input?.payload ?? {}) as Record<string, unknown>;
  const findings: Finding[] = [];

  // ── Fixture resolution ──────────────────────────────────────────────────────
  let wsjfInputs: WSJFInputs;
  let financialInputs: FinancialInputs | undefined;

  if (payload.useCriticalFixture === true) {
    wsjfInputs = CRITICAL_FIXTURE.wsjf;
    financialInputs = CRITICAL_FIXTURE.financial;
  } else if (payload.useMediumFixture === true) {
    wsjfInputs = MEDIUM_FIXTURE.wsjf;
    financialInputs = MEDIUM_FIXTURE.financial;
  } else if (payload.useLowFixture === true) {
    wsjfInputs = LOW_FIXTURE.wsjf;
    financialInputs = LOW_FIXTURE.financial;
  } else if ("userBusinessValue" in payload) {
    wsjfInputs = {
      userBusinessValue: Number(payload.userBusinessValue) || 1,
      timeCriticality: Number(payload.timeCriticality) || 1,
      riskReduction: Number(payload.riskReduction) || 1,
      jobDuration: Number(payload.jobDuration) || 1,
    };
    if ("weeklyRevenueAtRisk" in payload) {
      financialInputs = {
        weeklyRevenueAtRisk: Number(payload.weeklyRevenueAtRisk) || 0,
        weeksDelayed: Number(payload.weeksDelayed) || 0,
        governancePenaltyPerWeek: payload.governancePenaltyPerWeek !== undefined
          ? Number(payload.governancePenaltyPerWeek)
          : undefined,
        weeklyOpportunityCost: payload.weeklyOpportunityCost !== undefined
          ? Number(payload.weeklyOpportunityCost)
          : undefined,
      };
    }
  } else {
    // Default: critical fixture
    wsjfInputs = CRITICAL_FIXTURE.wsjf;
    financialInputs = CRITICAL_FIXTURE.financial;
  }

  // ── Compute ────────────────────────────────────────────────────────────────
  const result = computeCostOfDelay(wsjfInputs, financialInputs);

  // ── Handle validation errors ────────────────────────────────────────────────
  if (result.validationErrors.length > 0) {
    return {
      findings: result.validationErrors.map((err, i) => ({
        id: `cod-validation-error-${i}-${Date.now()}`,
        title: "WSJF input validation error",
        description: err,
        severity: "HIGH" as const,
        source: `${COST_OF_DELAY_ENGINE_ID}::run::input-validation`,
        evidence: `Input error: ${err}`,
        remediation: "Provide valid WSJF inputs (Fibonacci scale 1–21, positive integers).",
      })),
      summary: `Input validation failed: ${result.validationErrors.join("; ")}`,
      severity: "HIGH",
      engineVersion: COST_OF_DELAY_VERSION,
      durationMs: Date.now() - startTime,
      limitations: [],
      rawOutput: { engineId: COST_OF_DELAY_ENGINE_ID, runAt: new Date().toISOString() },
    };
  }

  // ── Formula steps ───────────────────────────────────────────────────────────
  const formulaSteps: FormulaStep[] = [
    {
      stepId: "wsjf-inputs",
      label: "WSJF inputs (Fibonacci scale 1–21)",
      inputs: {
        userBusinessValue: wsjfInputs.userBusinessValue,
        timeCriticality: wsjfInputs.timeCriticality,
        riskReduction: wsjfInputs.riskReduction,
        jobDuration: wsjfInputs.jobDuration,
      },
      intermediate: {
        numerator: wsjfInputs.userBusinessValue + wsjfInputs.timeCriticality + wsjfInputs.riskReduction,
      },
      output: result.wsjfScore,
    },
    {
      stepId: "wsjf-classification",
      label: "WSJF tier classification",
      inputs: {
        wsjfScore: result.wsjfScore,
        criticalThreshold: 10,
        highThreshold: 5,
        mediumThreshold: 2,
      },
      output: result.wsjfTier,
    },
  ];

  if (financialInputs && result.financialExposure) {
    formulaSteps.push({
      stepId: "financial-exposure",
      label: "Financial exposure (GBP)",
      inputs: {
        weeklyRevenueAtRisk: financialInputs.weeklyRevenueAtRisk,
        weeksDelayed: financialInputs.weeksDelayed,
        governancePenaltyPerWeek: financialInputs.governancePenaltyPerWeek ?? 0,
        weeklyOpportunityCost: financialInputs.weeklyOpportunityCost ?? 0,
      },
      intermediate: {
        weeklyBurnRate: result.financialExposure.weeklyBurnRate,
      },
      output: result.financialExposure.totalCostOfDelay,
    });
  }

  formulaSteps.push({
    stepId: "escalation-determination",
    label: "Delay escalation level",
    inputs: {
      wsjfTier: result.wsjfTier,
      weeksDelayed: financialInputs?.weeksDelayed ?? 0,
    },
    output: result.delayEscalation.level,
  });

  // ── Map to findings ─────────────────────────────────────────────────────────
  const escalationLevel = result.delayEscalation.level;

  if (escalationLevel === "CRITICAL") {
    findings.push({
      id: `cod-critical-${Date.now()}`,
      title: "Cost of Delay: CRITICAL — Immediate resolution required",
      description: result.delayEscalation.signal,
      severity: "CRITICAL",
      source: `${COST_OF_DELAY_ENGINE_ID}::escalation::critical`,
      evidence: `WSJF: ${result.wsjfScore}, Weeks delayed: ${financialInputs?.weeksDelayed ?? 0}`,
      remediation: result.recommendation,
    });
  } else if (escalationLevel === "ESCALATE") {
    findings.push({
      id: `cod-escalate-${Date.now()}`,
      title: "Cost of Delay: Escalation required",
      description: result.delayEscalation.signal,
      severity: "HIGH",
      source: `${COST_OF_DELAY_ENGINE_ID}::escalation::escalate`,
      evidence: `WSJF: ${result.wsjfScore}, Weeks delayed: ${financialInputs?.weeksDelayed ?? 0}`,
      remediation: result.recommendation,
    });
  } else if (escalationLevel === "WATCH") {
    findings.push({
      id: `cod-watch-${Date.now()}`,
      title: "Cost of Delay: Watch — delay accumulating",
      description: result.delayEscalation.signal,
      severity: "MEDIUM",
      source: `${COST_OF_DELAY_ENGINE_ID}::escalation::watch`,
      evidence: `WSJF: ${result.wsjfScore}`,
      remediation: result.recommendation,
    });
  }

  if (result.financialExposure && result.financialExposure.totalCostOfDelay > 0) {
    findings.push({
      id: `cod-financial-${Date.now()}`,
      title: `Financial exposure: £${result.financialExposure.totalCostOfDelay.toLocaleString("en-GB")}`,
      description: `Total cost of delay over ${financialInputs?.weeksDelayed ?? 0} week(s): £${result.financialExposure.totalCostOfDelay.toLocaleString("en-GB")}. Weekly burn rate: £${result.financialExposure.weeklyBurnRate.toLocaleString("en-GB")}.`,
      severity: result.financialExposure.totalCostOfDelay >= 100_000 ? "HIGH" : result.financialExposure.totalCostOfDelay >= 25_000 ? "MEDIUM" : "LOW",
      source: `${COST_OF_DELAY_ENGINE_ID}::financial-exposure`,
      evidence: `Revenue at risk: £${result.financialExposure.revenueAtRisk.toLocaleString("en-GB")}, Governance penalty: £${result.financialExposure.governancePenalty.toLocaleString("en-GB")}, Opportunity cost: £${result.financialExposure.opportunityCost.toLocaleString("en-GB")}`,
      remediation: "Make the decision or initiate the programme. Every week of delay compounds this exposure.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: `cod-low-priority-${Date.now()}`,
      title: `Cost of Delay: ${result.wsjfTier} priority (WSJF: ${result.wsjfScore})`,
      description: result.recommendation,
      severity: "INFO",
      source: `${COST_OF_DELAY_ENGINE_ID}::summary`,
      evidence: `WSJF: ${result.wsjfScore}`,
    });
  }

  // ── Overall severity ────────────────────────────────────────────────────────
  const hasCritical = findings.some((f) => f.severity === "CRITICAL");
  const hasHigh = findings.some((f) => f.severity === "HIGH");
  const hasMedium = findings.some((f) => f.severity === "MEDIUM");

  const severity = hasCritical ? "CRITICAL" : hasHigh ? "HIGH" : hasMedium ? "MEDIUM" : "INFO";

  const durationMs = Date.now() - startTime;

  return {
    findings,
    summary: result.recommendation,
    severity,
    engineVersion: COST_OF_DELAY_VERSION,
    durationMs,
    limitations: [
      "WSJF inputs are relative estimates (Fibonacci scale) — not objective measures. Calibrate with your team.",
      "Financial exposure is an estimate based on provided inputs. Consult finance for exact figures.",
      "No integration with live financial or pipeline data. All inputs are explicit payload values.",
    ],
    rawOutput: {
      engineId: COST_OF_DELAY_ENGINE_ID,
      runAt: new Date().toISOString(),
      formulaSteps,
      wsjfScore: result.wsjfScore,
      wsjfTier: result.wsjfTier,
      financialExposure: result.financialExposure,
      delayEscalation: result.delayEscalation,
    },
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const costOfDelayAdapter = {
  id: COST_OF_DELAY_ENGINE_ID,
  run,
  selfTest,
  getVersion,
};
