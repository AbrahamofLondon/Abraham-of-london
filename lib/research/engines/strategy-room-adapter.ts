/**
 * lib/research/engines/strategy-room-adapter.ts
 *
 * Intelligence Foundry adapter for the Strategy Room engine.
 * Wraps real production intake-scoring and gate logic.
 *
 * Status: PRODUCTION_CALLABLE
 *   - Intake normalisation: callable (normalizePayload)
 *   - Intake scoring: callable (computeScore — 8-component weighted scoring, threshold 16/25)
 *   - Gate evaluation: callable (evaluateIntake — accepted/declined)
 *   - Decision directive: callable (deriveDecisionDirective — tension-thread→directive)
 *
 * Limitations (explicit — never omitted):
 *   1. Full admission check requires getDiagnosticJourney() (DB) — not called.
 *   2. enforceStrategyRoomAccess() requires durable thread from DB — not called.
 *   3. archiveIntake() (persistence) is not called — no DB writes.
 *   4. notifyDiscord() (external notification) is not called.
 *   5. reCAPTCHA token is not verified — adapter uses synthetic token.
 *   6. vetStrategyInquiry() (intelligence vetting) is not called.
 *   7. Server-side durable thread is not verified — directive uses synthetic TensionThread.
 *
 * What this adapter proves:
 *   - The 8-component intake scoring engine runs on real inputs.
 *   - The threshold gate (score < 16 → declined) is real production logic.
 *   - The decision directive derivation from a tension thread is real production logic.
 *   - No customer case records, sessions, or notifications are created.
 */

import "server-only";

import { z } from "zod";
import {
  computeScore,
  evaluateIntake,
  normalizePayload,
  type StrategyRoomIntakePayload,
  type StrategyRoomScoreBreakdown,
} from "@/lib/consulting/strategy-room";
import {
  deriveDecisionDirective,
} from "@/lib/diagnostics/decision-authority";
import type { TensionThread } from "@/lib/diagnostics/tension-thread";
import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ─────────────────────────────────────────────────────────

export const STRATEGY_ROOM_ENGINE_ID = "strategy-room";
export const STRATEGY_ROOM_VERSION = "1.2.0";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const authorityChoiceSchema = z.enum(["Yes, fully", "Yes, with board approval", "No"]);
const yesNoSchema = z.enum(["Yes", "No"]);

const strategyRoomInputSchema = z.object({
  /** Use the built-in strong fixture (passes threshold) */
  useDefaultFixture: z.boolean().optional().default(false),
  /** Use a weak fixture (below threshold, authority = No) */
  useWeakFixture: z.boolean().optional().default(false),

  // ── Intake fields (all optional — defaults from strong fixture) ──
  contact: z
    .object({
      fullName: z.string().optional(),
      email: z.string().optional(),
      organisation: z.string().optional(),
    })
    .optional(),

  authority: z
    .object({
      role: z.string().optional(),
      hasAuthority: authorityChoiceSchema.optional(),
      mandate: z.string().optional(),
    })
    .optional(),

  decision: z
    .object({
      statement: z.string().optional(),
      type: z.string().optional(),
      stuckReasons: z.array(z.string()).optional(),
    })
    .optional(),

  constraints: z
    .object({
      nonRemovableConstraints: z.string().nullable().optional(),
      avoidedTradeOff: z.string().optional(),
      unacceptableOutcome: z.string().optional(),
    })
    .optional(),

  timeCost: z
    .object({
      costOfDelay: z.array(z.string()).optional(),
      affected: z.string().optional(),
      breaksFirst: z.string().optional(),
    })
    .optional(),

  readiness: z
    .object({
      readyForUnpleasantDecision: yesNoSchema.optional(),
      willingAccountability: yesNoSchema.optional(),
      whyNow: z.string().optional(),
    })
    .optional(),

  declarationAccepted: z.boolean().optional().default(true),
});

// ─── Built-in Fixtures ────────────────────────────────────────────────────────

const STRONG_FIXTURE: StrategyRoomIntakePayload = {
  meta: {
    source: "web",
    page: "/strategy-room",
    submittedAtIso: new Date().toISOString(),
  },
  contact: {
    fullName: "Alex Principal",
    email: "alex@example.com",
    organisation: "Acme Strategic Ltd",
  },
  authority: {
    role: "Chief Executive",
    hasAuthority: "Yes, fully",
    mandate:
      "Full board mandate to resolve the growth ceiling decision and restructure the executive team within Q3.",
  },
  decision: {
    statement:
      "We must decide whether to restructure the leadership team and delegate full P&L ownership to regional directors within the next 90 days, or pause expansion until the current authority structure is resolved.",
    type: "structural",
    stuckReasons: [
      "Authority ambiguity between executive and regional directors",
      "Board alignment uncertainty on restructuring scope",
      "Resource conflicts blocking named decision owner",
    ],
  },
  constraints: {
    nonRemovableConstraints:
      "Must maintain revenue continuity during restructuring. Cannot exceed 90-day transition window.",
    avoidedTradeOff:
      "Cannot trade governance clarity for short-term revenue. The cost of authority ambiguity now exceeds the risk of restructuring.",
    unacceptableOutcome:
      "Another 90 days of drift without a named decision owner and accountable P&L holder.",
  },
  timeCost: {
    costOfDelay: [
      "£30k/month in execution overhead from authority duplication",
      "Senior talent attrition risk accelerating",
      "Board confidence eroding each missed milestone",
    ],
    affected:
      "Leadership team, board, and regional directors across three business units.",
    breaksFirst:
      "Regional director confidence breaks first — they are executing without mandate.",
  },
  readiness: {
    readyForUnpleasantDecision: "Yes",
    willingAccountability: "Yes",
    whyNow:
      "The board has set a Q3 structural milestone. We are 60 days from it and the authority question is still unresolved. Delay now costs the Q4 expansion window.",
  },
  declarationAccepted: true,
  recaptchaToken: "foundry-synthetic-token",
};

const WEAK_FIXTURE: StrategyRoomIntakePayload = {
  meta: {
    source: "web",
    page: "/strategy-room",
    submittedAtIso: new Date().toISOString(),
  },
  contact: {
    fullName: "Pat Applicant",
    email: "pat@example.com",
    organisation: "StartupCo",
  },
  authority: {
    role: "Manager",
    hasAuthority: "No",
    mandate: "",
  },
  decision: {
    statement: "Should we pivot?",
    type: "strategy",
    stuckReasons: [],
  },
  constraints: {
    nonRemovableConstraints: null,
    avoidedTradeOff: "",
    unacceptableOutcome: "",
  },
  timeCost: {
    costOfDelay: [],
    affected: "",
    breaksFirst: "",
  },
  readiness: {
    readyForUnpleasantDecision: "No",
    willingAccountability: "No",
    whyNow: "",
  },
  declarationAccepted: false,
  recaptchaToken: "foundry-synthetic-token",
};

// ─── Synthetic TensionThread Builder ─────────────────────────────────────────

/**
 * Build a synthetic TensionThread from the score breakdown.
 * Used to demonstrate the real directive derivation engine without DB.
 * This simulates what a user's thread might look like based on intake responses.
 */
function buildSyntheticTensionThread(score: StrategyRoomScoreBreakdown): TensionThread {
  const tensions: TensionThread["tensions"] = [];
  const dominantPatterns: string[] = [];
  let escalationLevel: TensionThread["escalationLevel"] = "none";

  if (score.components.authority === 0) {
    tensions.push({
      domain: "authority",
      signal: "mandate_vacuum",
      severity: "high",
      source: "constitutional",
      evidence: "hasAuthority=No — authority gate failed.",
    });
    dominantPatterns.push("mandate_vacuum");
  }

  if (score.components.decisionClarity < 2) {
    tensions.push({
      domain: "execution",
      signal: "structural_inconsistency",
      severity: "medium",
      source: "constitutional",
      evidence: "Decision statement below precision threshold.",
    });
    dominantPatterns.push("structural_inconsistency");
  }

  if (score.components.accountabilityReadiness === 0) {
    tensions.push({
      domain: "governance",
      signal: "reactive_decision_pattern",
      severity: "medium",
      source: "constitutional",
      evidence: "Both accountability readiness markers absent.",
    });
    dominantPatterns.push("reactive_decision_pattern");
  }

  if (tensions.filter((t) => t.severity === "high").length >= 1) {
    escalationLevel = "structural_risk";
  }
  if (tensions.filter((t) => t.severity === "high").length >= 2) {
    escalationLevel = "intervention_required";
  }

  return {
    id: `sr-synthetic-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stagesCompleted: ["constitutional"],
    tensions,
    dominantPatterns,
    escalationLevel,
  };
}

// ─── Formula Steps ────────────────────────────────────────────────────────────

function buildFormulaSteps(
  score: StrategyRoomScoreBreakdown,
  payload: StrategyRoomIntakePayload,
): FormulaStep[] {
  return [
    {
      stepId: "intake-normalisation",
      label: "Intake normalisation",
      inputs: {
        authority: payload.authority.hasAuthority,
        mandateLength: String(payload.authority.mandate?.length ?? 0),
        decisionLength: String(payload.decision.statement?.length ?? 0),
        declarationAccepted: String(payload.declarationAccepted),
      },
      intermediate: {
        contactOrganisation: payload.contact.organisation,
        stuckReasonsCount: String(payload.decision.stuckReasons?.length ?? 0),
      },
      output: "Payload normalised",
      sourceRule:
        "normalizePayload() — lib/consulting/strategy-room.ts",
      engineVersion: STRATEGY_ROOM_VERSION,
    },
    {
      stepId: "intake-scoring",
      label: "Intake scoring — 8 weighted components",
      inputs: {
        authority: String(score.components.authority),
        mandate: String(score.components.mandate),
        decisionClarity: String(score.components.decisionClarity),
        tradeoffMaturity: String(score.components.tradeoffMaturity),
        urgencyCredibility: String(score.components.urgencyCredibility),
        consequenceAwareness: String(score.components.consequenceAwareness),
        constraintRealism: String(score.components.constraintRealism),
        accountabilityReadiness: String(score.components.accountabilityReadiness),
      },
      intermediate: {
        total: String(score.total),
        max: String(score.max),
        threshold: String(score.threshold),
        gatesPassed: String(score.gatesPassed),
      },
      output: `${score.total}/${score.max} (threshold ${score.threshold})`,
      sourceRule:
        "computeScore() — lib/consulting/strategy-room.ts",
      engineVersion: STRATEGY_ROOM_VERSION,
    },
    {
      stepId: "gate-evaluation",
      label: "Gate evaluation — authority + accountability + score threshold",
      inputs: {
        authorityGate: payload.authority.hasAuthority,
        accountabilityGate: payload.readiness.willingAccountability,
        declarationGate: String(payload.declarationAccepted),
        scoreMeetsThreshold: String(score.total >= score.threshold),
      },
      intermediate: {
        score: String(score.total),
        threshold: String(score.threshold),
        gatesPassed: String(score.gatesPassed),
      },
      output: score.total >= score.threshold && score.gatesPassed ? "accepted" : "declined",
      sourceRule:
        "evaluateIntake() — lib/consulting/strategy-room.ts",
      engineVersion: STRATEGY_ROOM_VERSION,
    },
  ];
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export async function selfTest(): Promise<{ ok: boolean; detail?: string }> {
  try {
    const result = await run({ payload: { useDefaultFixture: true } });
    if (result.findings.length === 0) {
      return { ok: false, detail: "No findings produced" };
    }
    return {
      ok: true,
      detail: `${result.findings.length} findings, severity: ${result.severity}, engineVersion: ${result.engineVersion}`,
    };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

export async function getVersion(): Promise<{ version: string }> {
  return { version: STRATEGY_ROOM_VERSION };
}

export async function run(input: EngineRunInput): Promise<EngineRunOutput> {
  const startTime = Date.now();

  // ── Input validation ─────────────────────────────────────────────────────
  const parsed = strategyRoomInputSchema.safeParse(input.payload);
  if (!parsed.success) {
    return {
      findings: [
        {
          id: "sr-input-invalid",
          title: "Invalid input",
          description: `Input validation failed: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
          severity: "HIGH",
          source: "strategy-room-adapter::run::input-validation",
        },
      ],
      summary: "Input validation failed",
      severity: "HIGH",
      engineVersion: STRATEGY_ROOM_VERSION,
      durationMs: Date.now() - startTime,
      limitations: [
        "Input validation failure — provide valid intake fields or set useDefaultFixture: true.",
      ],
      promotionRequirements: [],
    };
  }

  const { useDefaultFixture, useWeakFixture, declarationAccepted, ...fieldOverrides } = parsed.data;

  // ── Construct intake payload ──────────────────────────────────────────────
  let baseFixture: StrategyRoomIntakePayload;
  if (useWeakFixture) {
    baseFixture = WEAK_FIXTURE;
  } else if (useDefaultFixture || !fieldOverrides.authority?.hasAuthority) {
    baseFixture = STRONG_FIXTURE;
  } else {
    baseFixture = STRONG_FIXTURE;
  }

  // Apply any caller-supplied field overrides on top of the base fixture
  const intakePayload: StrategyRoomIntakePayload = {
    meta: {
      source: "web",
      page: "/admin/intelligence-foundry/simulation/strategy-room",
      submittedAtIso: new Date().toISOString(),
    },
    contact: {
      fullName: fieldOverrides.contact?.fullName ?? baseFixture.contact.fullName,
      email: fieldOverrides.contact?.email ?? baseFixture.contact.email,
      organisation: fieldOverrides.contact?.organisation ?? baseFixture.contact.organisation,
    },
    authority: {
      role: fieldOverrides.authority?.role ?? baseFixture.authority.role,
      hasAuthority: fieldOverrides.authority?.hasAuthority ?? baseFixture.authority.hasAuthority,
      mandate: fieldOverrides.authority?.mandate ?? baseFixture.authority.mandate,
    },
    decision: {
      statement: fieldOverrides.decision?.statement ?? baseFixture.decision.statement,
      type: fieldOverrides.decision?.type ?? baseFixture.decision.type,
      stuckReasons:
        fieldOverrides.decision?.stuckReasons ?? baseFixture.decision.stuckReasons,
    },
    constraints: {
      nonRemovableConstraints:
        fieldOverrides.constraints?.nonRemovableConstraints !== undefined
          ? fieldOverrides.constraints.nonRemovableConstraints
          : baseFixture.constraints.nonRemovableConstraints,
      avoidedTradeOff:
        fieldOverrides.constraints?.avoidedTradeOff ?? baseFixture.constraints.avoidedTradeOff,
      unacceptableOutcome:
        fieldOverrides.constraints?.unacceptableOutcome ??
        baseFixture.constraints.unacceptableOutcome,
    },
    timeCost: {
      costOfDelay:
        fieldOverrides.timeCost?.costOfDelay ?? baseFixture.timeCost.costOfDelay,
      affected: fieldOverrides.timeCost?.affected ?? baseFixture.timeCost.affected,
      breaksFirst: fieldOverrides.timeCost?.breaksFirst ?? baseFixture.timeCost.breaksFirst,
    },
    readiness: {
      readyForUnpleasantDecision:
        fieldOverrides.readiness?.readyForUnpleasantDecision ??
        baseFixture.readiness.readyForUnpleasantDecision,
      willingAccountability:
        fieldOverrides.readiness?.willingAccountability ??
        baseFixture.readiness.willingAccountability,
      whyNow: fieldOverrides.readiness?.whyNow ?? baseFixture.readiness.whyNow,
    },
    declarationAccepted: declarationAccepted ?? baseFixture.declarationAccepted,
    recaptchaToken: "foundry-synthetic-token",
  };

  // ── Production function calls ─────────────────────────────────────────────
  // 1. Normalise payload (real production function)
  const normalised = normalizePayload(intakePayload);

  // 2. Score intake (real production function — 8 components, max 25)
  const score = computeScore(normalised);

  // 3. Evaluate gate (real production function — threshold + authority + accountability)
  const evaluation = evaluateIntake(normalised);

  // 4. Build synthetic tension thread from score outcomes
  const syntheticThread = buildSyntheticTensionThread(score);

  // 5. Derive decision directive (real production function)
  const directive = deriveDecisionDirective(syntheticThread);

  // ── Formula steps ─────────────────────────────────────────────────────────
  const formulaSteps = buildFormulaSteps(score, normalised);

  // ── Build findings ────────────────────────────────────────────────────────
  const findings: Finding[] = [];

  // 1. Gate decision
  const gateDecision = evaluation.result;
  findings.push({
    id: `sr-gate-${Date.now()}`,
    title: gateDecision.ok ? "Strategy Room: ACCEPTED" : `Strategy Room: DECLINED`,
    description: gateDecision.message,
    severity: gateDecision.ok ? "INFO" : score.total < 8 ? "HIGH" : "MEDIUM",
    source: `evaluateIntake() — lib/consulting/strategy-room.ts — score=${score.total}/${score.max} threshold=${score.threshold}`,
    evidence: `Score: ${score.total}/${score.max}. Gates passed: ${score.gatesPassed}. Authority: ${normalised.authority.hasAuthority}.`,
    remediation: gateDecision.ok
      ? undefined
      : score.reasons.slice(0, 2).join(". "),
  });

  // 2. Score component findings
  if (score.components.authority === 0) {
    findings.push({
      id: `sr-authority-${Date.now()}`,
      title: "Authority gate failed",
      description: `Authority status: "${normalised.authority.hasAuthority}". Entry requires decision-bearing authority.`,
      severity: "HIGH",
      source: `computeScore()::authority — lib/consulting/strategy-room.ts`,
      remediation: "Confirm the intake holder bears decision-making authority before escalating to Strategy Room.",
    });
  }

  if (score.components.decisionClarity < 2) {
    findings.push({
      id: `sr-decision-clarity-${Date.now()}`,
      title: `Decision clarity: ${score.components.decisionClarity}/4`,
      description: `Decision statement scored ${score.components.decisionClarity}/4. Minimum 2 required for threshold contribution.`,
      severity: score.components.decisionClarity === 0 ? "HIGH" : "MEDIUM",
      source: `computeScore()::decisionClarity — lib/consulting/strategy-room.ts`,
      evidence: `Statement length: ${normalised.decision.statement.length} characters. Weak threshold: 60, strong: 220.`,
      remediation: "Expand the decision statement to name the decision, owner, and 90-day consequence.",
    });
  }

  if (score.components.accountabilityReadiness === 0) {
    findings.push({
      id: `sr-accountability-${Date.now()}`,
      title: "Accountability readiness gate failed",
      description: `Both accountability markers (readyForUnpleasantDecision, willingAccountability) must be 'Yes'. Got: ready=${normalised.readiness.readyForUnpleasantDecision}, accountable=${normalised.readiness.willingAccountability}.`,
      severity: "HIGH",
      source: `computeScore()::accountabilityReadiness — lib/consulting/strategy-room.ts`,
      remediation: "The accountable principal must confirm readiness for both uncomfortable decisions and personal accountability before entry.",
    });
  }

  // 3. Decision directive finding
  findings.push({
    id: `sr-directive-${Date.now()}`,
    title: `Decision Directive: ${directive.level.toUpperCase()}`,
    description: directive.reason,
    severity:
      directive.level === "block"
        ? "CRITICAL"
        : directive.level === "restrict"
          ? "HIGH"
          : directive.level === "warn"
            ? "MEDIUM"
            : "INFO",
    source: `deriveDecisionDirective() — lib/diagnostics/decision-authority.ts — escalation=${syntheticThread.escalationLevel}`,
    evidence: `Synthetic tensions: ${syntheticThread.tensions.length}. Dominant patterns: ${syntheticThread.dominantPatterns.join(", ") || "none"}.`,
    remediation: directive.requiredAction,
  });

  // ── Severity ─────────────────────────────────────────────────────────────
  const severity = gateDecision.ok
    ? directive.level === "warn"
      ? "MEDIUM"
      : "INFO"
    : score.total < 8
      ? "HIGH"
      : "MEDIUM";

  const summary = gateDecision.ok
    ? `Strategy Room ACCEPTED — score ${score.total}/${score.max}. Directive: ${directive.level}.`
    : `Strategy Room DECLINED — score ${score.total}/${score.max} (threshold ${score.threshold}). Directive: ${directive.level}.`;

  return {
    findings,
    summary,
    severity,
    engineVersion: STRATEGY_ROOM_VERSION,
    durationMs: Date.now() - startTime,
    limitations: [
      "Full admission check requires getDiagnosticJourney() (DB) — not called in Foundry context.",
      "enforceStrategyRoomAccess() requires durable tension thread from DB — not called.",
      "archiveIntake() (persistence to StrategyIntake table) is not called.",
      "notifyDiscord() (external webhook notification) is not called.",
      "reCAPTCHA token is not verified — adapter uses synthetic token.",
      "vetStrategyInquiry() (intelligence vetting engine) is not called.",
      "Directive derives from synthetic TensionThread built from score — not from real user diagnostic history.",
    ],
    promotionRequirements: [
      "Wire evaluateStrategyRoomAdmission() with a mock/stub DiagnosticJourney to prove full admission logic.",
      "Add dry-run path to enforceStrategyRoomAccess() that uses client-only thread without DB lookup.",
      "Capture and return room-state-contract.ts signal pressure derivation from Foundry-supplied signals.",
      "Prove counselTrigger() and escalationGovernor() produce structured Finding output.",
    ],
    rawOutput: {
      score: {
        total: score.total,
        max: score.max,
        threshold: score.threshold,
        gatesPassed: score.gatesPassed,
        components: score.components,
        failureReasons: score.reasons,
      },
      evaluationStatus: gateDecision.status,
      directiveLevel: directive.level,
      directiveSummary: directive.summary ?? directive.reason,
      syntheticThreadEscalation: syntheticThread.escalationLevel,
      syntheticTensions: syntheticThread.tensions.length,
      productionFunctionsCalled: [
        "normalizePayload() — lib/consulting/strategy-room.ts",
        "computeScore() — lib/consulting/strategy-room.ts",
        "evaluateIntake() — lib/consulting/strategy-room.ts",
        "deriveDecisionDirective() — lib/diagnostics/decision-authority.ts",
      ],
      pipelineStagesNotCalled: [
        "evaluateStrategyRoomAdmission() — requires getDiagnosticJourney() (DB)",
        "enforceStrategyRoomAccess() — requires retrieveDurableThread() (DB)",
        "archiveIntake() — DB + filesystem persistence",
        "notifyDiscord() — external webhook",
        "vetStrategyInquiry() — intelligence vetting",
      ],
      formulaSteps,
    },
  };
}

export const strategyRoomAdapter = {
  engineId: STRATEGY_ROOM_ENGINE_ID,
  run,
  selfTest,
  getVersion,
};
