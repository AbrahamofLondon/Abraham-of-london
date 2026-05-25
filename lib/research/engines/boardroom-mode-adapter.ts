/**
 * lib/research/engines/boardroom-mode-adapter.ts
 *
 * Intelligence Foundry adapter for the Boardroom Mode engine.
 * Wraps real production boardroom qualification and dossier generation logic.
 *
 * Status: PRODUCTION_CALLABLE
 *   - Qualification gate: callable (qualifiesForBoardroom — cost threshold, accuracy gate)
 *   - Dossier generation: callable (generateBoardroomDossier — 9 sections, objections, decision paths)
 *   - Both functions are pure: no DB, no AI, no network calls.
 *
 * Production functions called:
 *   - qualifiesForBoardroom() from lib/constitution/boardroom-mode.ts
 *   - generateBoardroomDossier() from lib/constitution/boardroom-mode.ts
 *
 * Explicit limitations (never omitted):
 *   1. Uses synthetic IntelligenceSpine fixture — not a real user spine from DB.
 *   2. Does not render PDF. PDF export route is not called.
 *   3. Does not call executive-report-service.ts or fetch real ER run state.
 *   4. Does not persist boardroom artefacts (no DB writes, no archiveIntake).
 *   5. Does not issue client-facing board papers or BOARD_RESTRICTED documents.
 *   6. Does not validate payment or entitlement gate (DB-bound).
 *   7. getProofStatements() cohort data is empty — no real cohort aggregation called.
 *   8. Does not call enforceStrategyRoomAccess() or any session admission check.
 *
 * Promotion requirements (before FULL_PRODUCTION status):
 *   - Wire real Executive Reporting result → IntelligenceSpine transformation.
 *   - Add entitlement/payment gate dry-run check.
 *   - Add PDF render dry-run adapter (stub returns section list, no binary).
 *   - Add lineage event simulation for BOARDROOM_DOSSIER_GENERATED and BOARDROOM_DOSSIER_EXPORTED.
 *   - Validate Boardroom UI slide mapping against generated dossier sections.
 */

import "server-only";

import { z } from "zod";
import {
  qualifiesForBoardroom,
  generateBoardroomDossier,
  type BoardroomDossier,
} from "@/lib/constitution/boardroom-mode";
import { validateIntelligenceSpine } from "@/lib/decision/intelligence-spine";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ─────────────────────────────────────────────────────────

export const BOARDROOM_ENGINE_ID = "boardroom-dossier";
export const BOARDROOM_VERSION = "1.0.0";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXTURE_TIMESTAMP = "2026-05-25T08:00:00.000Z";

/** Strong qualifying spine — cost £8,500/month, accuracy "yes", authority condition */
const QUALIFYING_SPINE: IntelligenceSpine = {
  id: "foundry-fixture-qualifying-001",
  userId: undefined,
  email: undefined,
  case: {
    id: "foundry-fixture-qualifying-001",
    decision: "Whether to restructure the executive team and give regional directors full P&L ownership within Q3, or hold current authority structure until the board has reviewed all options.",
    priorAttempt: "Two off-site strategy days produced no structural change.",
    costOfDelay: "£8,500/month in execution overhead.",
    claimedOwner: "Chief Executive",
    blocker: "Board has not formally approved the restructure scope.",
    forcedAction: "Announce the restructure to the executive team within 72 hours.",
    contradiction: "Board approval stated as blocker, but forced action bypasses board.",
    inferredAvoidance: "Direct confrontation with team members who will lose authority.",
    conditionClass: "authority",
    signalStrength: "high",
    specificityScore: 0.82,
    createdAt: FIXTURE_TIMESTAMP,
    updatedAt: FIXTURE_TIMESTAMP,
  },
  c3: {
    clarity: 0.85, context: 0.80, consequence: 0.88, specificityScore: 0.82,
    mode: "SYNTHESIS_READY", tier: "FULL_SYNTHESIS", confidenceBand: "high",
    missing: [],
    scoringExplanation: { clarity: "Decision named and scoped.", context: "Prior attempts articulated.", consequence: "Monthly cost stated explicitly." },
    recoveryClassification: null,
  },
  deterministic: {
    conditionClass: "authority",
    signal: {
      key: "AUTHORITY_LEAKAGE", label: "Authority is unclear under urgency",
      verdict: "No one owns this decision under urgency.", contradiction: "Urgency without authority produces chaos.",
      move: "Name the decision owner within 24 hours.",
      ignored7: "Control begins transferring informally.", ignored30: "Informal authority replaces formal authority.", ignored90: "Decision structure rewritten by behaviour.",
      behaviourReveal: "Control defaults to position under pressure.", escalationLine: "Delay increases cost of reset.",
      boundaryStatement: "Analysis reflects stated inputs only.",
      primaryStatement: "Authority is unclear.", decisionStatement: "No named decision owner.",
      consequenceStatement: "Cost continues monthly.", moveStatement: "Name decision owner within 24 hours.",
    },
    contradictionSet: ["Board approval stated as blocker; forced action bypasses board."],
    blockerClass: "false_authority",
  },
  synthesis: {
    verdict: "The restructure is not blocked by the board. It is blocked by the conversation not yet held with those who will lose authority.",
    primaryContradiction: "Board named as blocker; forced action bypasses board entirely.",
    avoidedDecision: "Direct confrontation with senior team members losing P&L authority.",
    whyPriorAttemptsFailed: "Off-sites produced alignment on strategy but not accountability.",
    concreteMove: "Within 72 hours: name Chief Executive as sole P&L restructure authority and communicate this in writing.",
    defaultPathForecast: "Without action: £8,500/month continues. Senior attrition risk converts within 90 days.",
    signalStrength: "high",
    certaintyBoundary: "Does not model external board dynamics or individual stakeholder psychology.",
    quotedUserLanguage: ["Board has not formally approved", "Announce within 72 hours"],
    conditionClass: "authority",
    c3Score: {
      clarity: 0.85, context: 0.80, consequence: 0.88, specificityScore: 0.82,
      mode: "SYNTHESIS_READY", tier: "FULL_SYNTHESIS", confidenceBand: "high",
      missing: [], scoringExplanation: { clarity: "Named.", context: "Articulated.", consequence: "Stated." },
      recoveryClassification: null,
    },
  },
  forecast: {
    alreadyIncurred: "Two strategy off-sites — estimated sunk cost £12,000.",
    sevenDays: "Regional directors wait for signal.",
    thirtyDays: "One or two regional directors begin making scope decisions unilaterally.",
    ninetyDays: "Informal authority redistributed. Formal restructure now requires unwinding informal claims.",
    optionDecayRate: 0.30, controlShiftProbability: 0.65, structuralRiskShift: "accelerating",
  },
  memory: null, stakeholderMap: null,
  stage: "strategy_room",
  history: [{
    stage: "fast_diagnostic", completedAt: FIXTURE_TIMESTAMP,
    snapshot: { conditionClass: "authority", c3Tier: "FULL_SYNTHESIS", hasSynthesis: true, signalStrength: "high" },
    contribution: "Authority condition identified. Signal: AUTHORITY_LEAKAGE.",
  }],
  accuracyFeedback: { response: "yes", reason: "Contradiction is accurate.", capturedAt: FIXTURE_TIMESTAMP },
  economics: { estimatedMonthlyCost: 8500, costOfDelayMonthly: 8500, decisionOwner: "Chief Executive", deadline: "2026-09-30" },
  flags: { avoidanceSuspected: true, falseAuthority: true, economicSanitySuspicious: false, doNotSellTriggered: false },
  integrityScore: 0.88, pressureIndex: 72,
  createdAt: FIXTURE_TIMESTAMP, updatedAt: FIXTURE_TIMESTAMP,
};

/** Borderline spine — cost just above threshold (£5,200/month), accuracy "partial" */
const BORDERLINE_SPINE: IntelligenceSpine = {
  id: "foundry-fixture-borderline-002",
  userId: undefined, email: undefined,
  case: {
    id: "foundry-fixture-borderline-002",
    decision: "Whether to proceed with the digital platform migration in Q4 or defer to Q1 given resource constraints.",
    priorAttempt: "Initial scoping completed. Vendor selected. Migration has not started.",
    costOfDelay: "Around £5,000 to £6,000 per month in legacy licence costs.",
    claimedOwner: "CTO and CPO jointly.",
    blocker: "Resource allocation not confirmed by CFO.",
    forcedAction: "Instruct CTO to proceed with Phase 1 using current team capacity.",
    conditionClass: "execution",
    signalStrength: "medium",
    specificityScore: 0.64,
    createdAt: FIXTURE_TIMESTAMP, updatedAt: FIXTURE_TIMESTAMP,
  },
  c3: {
    clarity: 0.70, context: 0.62, consequence: 0.65, specificityScore: 0.64,
    mode: "SYNTHESIS_READY", tier: "SOFT_RECOVERY", confidenceBand: "medium",
    missing: ["context"],
    scoringExplanation: { clarity: "Decision stated, ownership split.", context: "Resource picture incomplete.", consequence: "Cost range not pinned." },
    recoveryClassification: "missing_owner",
  },
  deterministic: {
    conditionClass: "execution",
    signal: {
      key: "EXECUTION_AVOIDANCE", label: "Decision understood but avoided",
      verdict: "Decision understood. Not being made because cost of making it not accepted.",
      contradiction: "CFO cited as blocker; forced action bypasses CFO.",
      move: "Proceed with Phase 1 under current authority. Confirm resource formally within 5 days.",
      ignored7: "Vendor costs continue.", ignored30: "Q4 window narrows.", ignored90: "Legacy licence cost compounded.",
      behaviourReveal: "Real barrier is authority to commit resource.", escalationLine: "Each week increases migration complexity.",
      boundaryStatement: "Analysis based on stated inputs only.",
      primaryStatement: "Execution avoidance.", decisionStatement: "Decision understood, not made.",
      consequenceStatement: "Q4 window closes.", moveStatement: "Proceed under current authority.",
    },
    contradictionSet: ["CFO cited as blocker; forced action bypasses CFO.", "Joint ownership creates execution stall."],
    blockerClass: "resource_authority",
  },
  synthesis: null,
  forecast: {
    sevenDays: "Q4 planning window narrows.", thirtyDays: "Q1 deferral becomes inevitable.",
    ninetyDays: "Migration deferred by one full cycle.",
    optionDecayRate: 0.40, controlShiftProbability: 0.45, structuralRiskShift: "accelerating",
  },
  memory: null, stakeholderMap: null,
  stage: "fast_diagnostic",
  history: [{
    stage: "fast_diagnostic", completedAt: FIXTURE_TIMESTAMP,
    snapshot: { conditionClass: "execution", c3Tier: "SOFT_RECOVERY", hasSynthesis: false, signalStrength: "medium" },
    contribution: "Execution avoidance identified. Joint ownership flagged as structural stall.",
  }],
  accuracyFeedback: { response: "partial", reason: "Execution reading accurate; resource constraint is real.", capturedAt: FIXTURE_TIMESTAMP },
  economics: { estimatedMonthlyCost: 5200, costOfDelayMonthly: 5200, decisionOwner: "CTO", deadline: "2026-12-31" },
  flags: { avoidanceSuspected: false, falseAuthority: false, economicSanitySuspicious: false, doNotSellTriggered: false },
  integrityScore: 0.72, pressureIndex: 48,
  createdAt: FIXTURE_TIMESTAMP, updatedAt: FIXTURE_TIMESTAMP,
};

/** Non-qualifying spine — cost £1,800/month, accuracy "no" */
const NON_QUALIFYING_SPINE: IntelligenceSpine = {
  id: "foundry-fixture-non-qualifying-003",
  userId: undefined, email: undefined,
  case: {
    id: "foundry-fixture-non-qualifying-003",
    decision: "Whether to upgrade the internal project management tool to the enterprise tier.",
    priorAttempt: "Reviewed options. Team prefers the upgrade.",
    costOfDelay: "Roughly £1,800 per month in lost productivity.",
    claimedOwner: "Operations Manager.",
    blocker: "Budget approval from Finance.",
    forcedAction: "Approve upgrade from current budget, seek retrospective Finance sign-off.",
    conditionClass: "execution",
    signalStrength: "low",
    specificityScore: 0.42,
    createdAt: FIXTURE_TIMESTAMP, updatedAt: FIXTURE_TIMESTAMP,
  },
  c3: {
    clarity: 0.55, context: 0.45, consequence: 0.40, specificityScore: 0.42,
    mode: "PRECISION_RECOVERY", tier: "HARD_RECOVERY", confidenceBand: "low",
    missing: ["context", "consequence"],
    scoringExplanation: { clarity: "Operational decision, low stakes.", context: "No structural pattern.", consequence: "Below board threshold." },
    recoveryClassification: "insufficient_detail",
  },
  deterministic: {
    conditionClass: "execution",
    signal: {
      key: "EXECUTION_AVOIDANCE", label: "Decision understood but avoided",
      verdict: "Operational decision deferred by governance process.",
      contradiction: "Finance cited as blocker; forced action bypasses Finance.",
      move: "Approve under Operations Manager authority.", ignored7: "Productivity overhead continues.",
      ignored30: "Team workarounds increase.", ignored90: "Technical debt from workarounds becomes visible.",
      behaviourReveal: "Real barrier is permission-seeking, not Finance.", escalationLine: "Cost of deferral low but accumulates.",
      boundaryStatement: "Analysis based on stated inputs only.",
      primaryStatement: "Operational execution avoidance.", decisionStatement: "Operational; below board threshold.",
      consequenceStatement: "Productivity cost continues.", moveStatement: "Approve under current authority.",
    },
    contradictionSet: ["Finance cited as blocker; forced action bypasses Finance."],
    blockerClass: "permission_seeking",
  },
  synthesis: null,
  forecast: {
    sevenDays: "Productivity overhead continues.", thirtyDays: "Team workarounds increase.",
    ninetyDays: "Technical debt from workarounds visible.",
    optionDecayRate: 0.10, controlShiftProbability: 0.15, structuralRiskShift: "stable",
  },
  memory: null, stakeholderMap: null,
  stage: "fast_diagnostic",
  history: [{
    stage: "fast_diagnostic", completedAt: FIXTURE_TIMESTAMP,
    snapshot: { conditionClass: "execution", c3Tier: "HARD_RECOVERY", hasSynthesis: false, signalStrength: "low" },
    contribution: "Operational execution issue. Below board threshold.",
  }],
  accuracyFeedback: { response: "no", reason: "Figures are estimates.", capturedAt: FIXTURE_TIMESTAMP },
  economics: { estimatedMonthlyCost: 1800, costOfDelayMonthly: 1800, decisionOwner: "Operations Manager" },
  flags: { avoidanceSuspected: false, falseAuthority: false, economicSanitySuspicious: false, doNotSellTriggered: false },
  integrityScore: 0.60, pressureIndex: 22,
  createdAt: FIXTURE_TIMESTAMP, updatedAt: FIXTURE_TIMESTAMP,
};

// ─── Input Schema ─────────────────────────────────────────────────────────────

const boardroomInputSchema = z.object({
  /** Use the built-in qualifying fixture */
  useQualifyingFixture: z.boolean().optional().default(false),
  /** Use the built-in borderline fixture */
  useBorderlineFixture: z.boolean().optional().default(false),
  /** Use the built-in non-qualifying fixture */
  useNonQualifyingFixture: z.boolean().optional().default(false),
  /** Provide a custom synthetic IntelligenceSpine — must not contain real user data */
  spine: z.record(z.unknown()).optional(),
  /** Optional label for test run identification */
  scenarioLabel: z.string().optional(),
});

// ─── Formula Step Builder ─────────────────────────────────────────────────────
// All inputs/intermediate/output values must be string | number per FormulaStep contract.

function buildFormulaSteps(
  spine: IntelligenceSpine,
  gate: { qualified: boolean; reason: string },
  dossier: BoardroomDossier,
): FormulaStep[] {
  const cost = spine.economics?.estimatedMonthlyCost ?? 0;
  const accuracy = spine.accuracyFeedback?.response ?? "not provided";
  const condition = spine.deterministic.conditionClass;
  const validationErrors = validateIntelligenceSpine(spine);
  const blockCount = validationErrors.filter(e => e.severity === "BLOCK").length;

  return [
    {
      stepId: "spine-validation",
      label: "Spine integrity validation",
      inputs: {
        spineId: spine.id,
        hasDeterministicCondition: spine.deterministic?.conditionClass ? "true" : "false",
        hasCase: spine.case?.id ? "true" : "false",
        hasC3: spine.c3 ? "true" : "false",
        historyLength: spine.history.length,
      },
      intermediate: {
        validationErrorCount: validationErrors.length,
        blockLevelErrors: blockCount,
        stage: spine.stage,
        conditionClass: condition,
      },
      output: blockCount === 0 ? "VALID" : `BLOCKED — ${blockCount} error(s)`,
      sourceRule: "validateIntelligenceSpine() — lib/decision/intelligence-spine.ts",
      engineVersion: BOARDROOM_VERSION,
    },
    {
      stepId: "qualification-gate",
      label: "Boardroom activation gate",
      inputs: {
        estimatedMonthlyCost: cost,
        accuracyFeedback: accuracy,
        costThreshold5k: 5000,
        costThreshold20k: 20000,
      },
      intermediate: {
        costAbove5k: cost >= 5000 ? "true" : "false",
        costAbove20k: cost >= 20000 ? "true" : "false",
        accuracyYesOrPartial: accuracy === "yes" || accuracy === "partial" ? "true" : "false",
        rule1Applies: "cost >= 5000 AND accuracy yes/partial",
        rule2Applies: "cost >= 20000 regardless of accuracy",
      },
      output: gate.qualified ? `QUALIFIED — ${gate.reason}` : `NOT QUALIFIED — ${gate.reason}`,
      sourceRule: "qualifiesForBoardroom() — lib/constitution/boardroom-mode.ts",
      engineVersion: BOARDROOM_VERSION,
    },
    {
      stepId: "dossier-generation",
      label: "Boardroom dossier generation",
      inputs: {
        qualified: gate.qualified ? "true" : "false",
        conditionClass: condition,
        estimatedMonthlyCost: cost,
        hasSynthesis: spine.synthesis !== null ? "true" : "false",
        cohortDataProvided: "false",
      },
      intermediate: {
        sectionsGenerated: dossier.sections.length,
        sectionIds: dossier.sections.map(s => s.id).join(", "),
        objectionsGenerated: dossier.objectionHandling.length,
        decisionPathsGenerated: dossier.decisionPath.length,
        classificationApplied: dossier.classification,
      },
      output: gate.qualified
        ? `${dossier.sections.length} sections — ${dossier.title}`
        : "No dossier — not qualified",
      sourceRule: "generateBoardroomDossier() — lib/constitution/boardroom-mode.ts",
      engineVersion: BOARDROOM_VERSION,
    },
  ];
}

// ─── Findings Builder ─────────────────────────────────────────────────────────

function buildFindings(
  spine: IntelligenceSpine,
  gate: { qualified: boolean; reason: string },
  dossier: BoardroomDossier,
): Finding[] {
  const findings: Finding[] = [];
  const cost = spine.economics?.estimatedMonthlyCost ?? 0;
  const condition = spine.deterministic.conditionClass;

  // Finding 1: Qualification status
  findings.push({
    id: `boardroom-qualification-${Date.now()}`,
    title: gate.qualified
      ? `Board-level qualification: PASSED (${gate.reason})`
      : `Board-level qualification: NOT MET (${gate.reason})`,
    description: gate.qualified
      ? `SpineID ${spine.id}: cost £${cost.toLocaleString()}/month meets boardroom activation threshold. Dossier generated.`
      : `SpineID ${spine.id}: cost £${cost.toLocaleString()}/month does not meet boardroom threshold. No dossier generated.`,
    severity: "INFO",
    source: "boardroom-mode::qualifiesForBoardroom",
    evidence: gate.reason,
  });

  if (!gate.qualified) {
    return findings;
  }

  // Finding 2: Dossier section coverage
  findings.push({
    id: `boardroom-sections-${Date.now() + 1}`,
    title: `Dossier generated: ${dossier.sections.length} sections`,
    description: `Dossier covers: ${dossier.sections.map(s => s.label).join(", ")}.`,
    severity: "INFO",
    source: "boardroom-mode::generateBoardroomDossier::sections",
    evidence: `Sections: [${dossier.sections.map(s => s.id).join(", ")}]. Classification: ${dossier.classification}.`,
  });

  // Finding 3: Condition-specific risk
  const conditionRiskMap: Record<string, { severity: Finding["severity"]; note: string }> = {
    authority: { severity: "HIGH", note: "Authority condition — decision ownership is disputed or absent. Highest structural risk." },
    execution: { severity: "MEDIUM", note: "Execution condition — decision understood but not being made." },
    definition: { severity: "MEDIUM", note: "Definition condition — stakeholders operating from different interpretations." },
    instability: { severity: "HIGH", note: "Instability condition — untested assumptions active under real load." },
  };
  const riskInfo = conditionRiskMap[condition] ?? { severity: "MEDIUM" as const, note: "Structural condition detected." };
  findings.push({
    id: `boardroom-condition-risk-${Date.now() + 2}`,
    title: `Condition class: ${condition.toUpperCase()} — board-level structural risk`,
    description: riskInfo.note,
    severity: riskInfo.severity,
    source: "boardroom-mode::generateBoardroomDossier::failure_pattern",
    evidence: `Condition: ${condition}. Cost: £${cost.toLocaleString()}/month. 90-day projection: £${(cost * 3).toLocaleString()}.`,
    remediation: "Review dossier section: Failure Pattern and Required Action.",
  });

  // Finding 4: False authority flag
  if (spine.flags?.falseAuthority) {
    findings.push({
      id: `boardroom-false-authority-${Date.now() + 3}`,
      title: "False authority flag active",
      description: "The stated decision owner does not hold effective authority according to the diagnostic. Dossier reflects this in the Decision Owner section.",
      severity: "HIGH",
      source: "boardroom-mode::generateBoardroomDossier::owner",
      evidence: `Claimed owner: ${spine.case.claimedOwner ?? "not identified"}. flags.falseAuthority = true.`,
      remediation: "Identify the person with real decision authority and confirm their mandate in writing before board presentation.",
    });
  }

  // Finding 5: Objection handling presence
  if (dossier.objectionHandling.length > 0) {
    findings.push({
      id: `boardroom-objections-${Date.now() + 4}`,
      title: `Objection handling: ${dossier.objectionHandling.length} objections pre-addressed`,
      description: `Dossier pre-addresses: ${dossier.objectionHandling.map(o => `"${o.objection}"`).join("; ")}.`,
      severity: "INFO",
      source: "boardroom-mode::generateBoardroomDossier::objections",
      evidence: `Objections covered: ${dossier.objectionHandling.length}. Decision paths: ${dossier.decisionPath.length}.`,
    });
  }

  return findings;
}

// ─── Core Run Logic ───────────────────────────────────────────────────────────

async function runAdapter(payload: Record<string, unknown>): Promise<EngineRunOutput> {
  const startMs = Date.now();

  const parseResult = boardroomInputSchema.safeParse(payload);
  if (!parseResult.success) {
    return {
      findings: [{
        id: `boardroom-input-error-${Date.now()}`,
        title: "Invalid input",
        description: parseResult.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "),
        severity: "HIGH",
        source: "boardroom-mode-adapter::input-validation",
        evidence: JSON.stringify(parseResult.error.issues),
      }],
      summary: "Input validation failed.",
      severity: "HIGH",
      engineVersion: BOARDROOM_VERSION,
      durationMs: 0,
      rawOutput: {},
      limitations: LIMITATIONS,
      promotionRequirements: PROMOTION_REQUIREMENTS,
    };
  }

  const input = parseResult.data;

  // Select spine
  let spine: IntelligenceSpine | null = null;
  if (input.useQualifyingFixture) spine = QUALIFYING_SPINE;
  else if (input.useBorderlineFixture) spine = BORDERLINE_SPINE;
  else if (input.useNonQualifyingFixture) spine = NON_QUALIFYING_SPINE;
  else if (input.spine) spine = input.spine as IntelligenceSpine;
  else spine = QUALIFYING_SPINE; // default

  if (!spine) {
    return {
      findings: [{
        id: `boardroom-no-spine-${Date.now()}`,
        title: "No spine provided",
        description: "No IntelligenceSpine fixture selected and no custom spine provided.",
        severity: "HIGH",
        source: "boardroom-mode-adapter::input-validation",
        evidence: "No fixture flag set, no spine provided.",
        remediation: "Set useQualifyingFixture: true or provide a synthetic spine.",
      }],
      summary: "Adapter error: no spine provided.",
      severity: "HIGH",
      engineVersion: BOARDROOM_VERSION,
      durationMs: Date.now() - startMs,
      rawOutput: {},
      limitations: LIMITATIONS,
      promotionRequirements: PROMOTION_REQUIREMENTS,
    };
  }

  // Validate spine — return typed error on BLOCK-level failures
  const validationErrors = validateIntelligenceSpine(spine);
  const blockers = validationErrors.filter(e => e.severity === "BLOCK");
  if (blockers.length > 0) {
    return {
      findings: [{
        id: `boardroom-invalid-spine-${Date.now()}`,
        title: "Spine validation failed",
        description: `Spine has ${blockers.length} BLOCK-level validation error(s): ${blockers.map(e => e.message).join("; ")}`,
        severity: "HIGH",
        source: "boardroom-mode-adapter::spine-validation",
        evidence: JSON.stringify(blockers),
        remediation: "Provide a valid IntelligenceSpine with case.id, case.decision, c3, deterministic.conditionClass, and createdAt.",
      }],
      summary: `Spine validation blocked: ${blockers.map(e => e.message).join("; ")}`,
      severity: "HIGH",
      engineVersion: BOARDROOM_VERSION,
      durationMs: Date.now() - startMs,
      rawOutput: { validationErrors: blockers },
      limitations: LIMITATIONS,
      promotionRequirements: PROMOTION_REQUIREMENTS,
    };
  }

  // Call real production functions — no PDF, no DB, no AI
  const gate = qualifiesForBoardroom(spine);
  const dossier = generateBoardroomDossier(spine, []); // empty cohort data — no real aggregation

  const formulaSteps = buildFormulaSteps(spine, gate, dossier);
  const findings = buildFindings(spine, gate, dossier);
  const durationMs = Date.now() - startMs;

  const severity: EngineRunOutput["severity"] = findings.some(f => f.severity === "CRITICAL")
    ? "CRITICAL"
    : findings.some(f => f.severity === "HIGH")
      ? "HIGH"
      : findings.some(f => f.severity === "MEDIUM")
        ? "MEDIUM"
        : "INFO";

  return {
    findings,
    summary: gate.qualified
      ? `Boardroom Mode: QUALIFIED — ${dossier.sections.length} sections generated. Condition: ${spine.deterministic.conditionClass.toUpperCase()}.`
      : `Boardroom Mode: NOT QUALIFIED — ${gate.reason}`,
    severity,
    engineVersion: BOARDROOM_VERSION,
    durationMs,
    rawOutput: {
      engineId: BOARDROOM_ENGINE_ID,
      runAt: new Date().toISOString(),
      spineId: spine.id,
      conditionClass: spine.deterministic.conditionClass,
      estimatedMonthlyCost: spine.economics?.estimatedMonthlyCost ?? 0,
      accuracyFeedback: spine.accuracyFeedback?.response ?? null,
      scenarioLabel: input.scenarioLabel ?? null,
      qualification: {
        qualified: gate.qualified,
        reason: gate.reason,
      },
      dossier: {
        title: dossier.title,
        classification: dossier.classification,
        qualifiedForBoard: dossier.qualifiedForBoard,
        gateMessage: dossier.gateMessage,
        sections: dossier.sections,
        objectionHandling: dossier.objectionHandling,
        decisionPath: dossier.decisionPath,
      },
      formulaSteps,
      productionFunctionsCalled: [
        "validateIntelligenceSpine() — lib/decision/intelligence-spine.ts",
        "qualifiesForBoardroom() — lib/constitution/boardroom-mode.ts",
        "generateBoardroomDossier() — lib/constitution/boardroom-mode.ts",
      ],
      pipelineStagesNotCalled: [
        "PDF export route — not called (no binary rendering)",
        "executive-report-service.ts — DB-bound, not called",
        "archiveIntake() — no persistence in Foundry runs",
        "enforceStrategyRoomAccess() — session admission, not called",
        "Payment/entitlement gate — DB-bound, not called",
        "lineageEvent(BOARDROOM_DOSSIER_GENERATED) — not emitted in Foundry runs",
        "lineageEvent(BOARDROOM_DOSSIER_EXPORTED) — not emitted in Foundry runs",
        "getProofStatements() — called with empty cohort data; real aggregation not run",
      ],
      validationErrorCount: validationErrors.length,
    },
    limitations: LIMITATIONS,
    promotionRequirements: PROMOTION_REQUIREMENTS,
  };
}

// ─── Limitations & Promotion Requirements ────────────────────────────────────

const LIMITATIONS: string[] = [
  "Uses synthetic IntelligenceSpine fixtures — not a real user spine from production DB.",
  "Does not render PDF. PDF export route is not called.",
  "Does not call executive-report-service.ts or fetch real Executive Reporting run state.",
  "Does not persist boardroom artefacts — no DB writes, no archive events.",
  "Does not issue client-facing board papers or BOARD_RESTRICTED documents.",
  "Does not validate payment or entitlement gate (DB-bound, not callable).",
  "getProofStatements() called with empty cohort data — no real cohort aggregation run.",
  "Does not call any session admission check (enforceStrategyRoomAccess).",
];

const PROMOTION_REQUIREMENTS: string[] = [
  "Wire real Executive Reporting result → IntelligenceSpine transformation.",
  "Add entitlement/payment gate dry-run check.",
  "Add PDF render dry-run adapter (section list returned, no binary output).",
  "Add lineage event simulation for BOARDROOM_DOSSIER_GENERATED and BOARDROOM_DOSSIER_EXPORTED.",
  "Validate Boardroom UI slide mapping against generated dossier sections.",
];

// ─── Public Adapter Contract ──────────────────────────────────────────────────

export const boardroomModeAdapter = {
  id: BOARDROOM_ENGINE_ID,
  version: BOARDROOM_VERSION,

  async selfTest(): Promise<{ passed: boolean; message: string }> {
    try {
      const result = await runAdapter({ useQualifyingFixture: true });
      const rawOutput = result.rawOutput as Record<string, unknown>;
      const qualification = rawOutput?.qualification as { qualified: boolean } | undefined;
      const dossier = rawOutput?.dossier as { sections: unknown[] } | undefined;
      const formulaSteps = rawOutput?.formulaSteps as FormulaStep[] | undefined;

      if (!qualification?.qualified) {
        return { passed: false, message: "selfTest: qualifying fixture did not produce qualification=true" };
      }
      if (!dossier?.sections || dossier.sections.length < 3) {
        return { passed: false, message: "selfTest: dossier has fewer than 3 sections" };
      }
      if (!formulaSteps || formulaSteps.length !== 3) {
        return { passed: false, message: `selfTest: expected 3 formula steps, got ${formulaSteps?.length ?? 0}` };
      }
      return { passed: true, message: `selfTest passed — ${dossier.sections.length} sections, 3 formula steps, qualification=true` };
    } catch (err) {
      return { passed: false, message: `selfTest threw: ${err instanceof Error ? err.message : String(err)}` };
    }
  },

  getVersion(): string {
    return BOARDROOM_VERSION;
  },

  async run(input: EngineRunInput): Promise<EngineRunOutput> {
    return runAdapter(input.payload ?? {});
  },

  limitations: LIMITATIONS,
  promotionRequirements: PROMOTION_REQUIREMENTS,
  productionFunctionsCalled: [
    "validateIntelligenceSpine() — lib/decision/intelligence-spine.ts",
    "qualifiesForBoardroom() — lib/constitution/boardroom-mode.ts",
    "generateBoardroomDossier() — lib/constitution/boardroom-mode.ts",
  ],
  pipelineStagesNotCalled: [
    "PDF export route",
    "executive-report-service.ts (DB-bound)",
    "archiveIntake() (persistence)",
    "enforceStrategyRoomAccess() (session admission)",
    "Payment/entitlement gate (DB-bound)",
    "Boardroom lineage events",
    "getProofStatements() with real cohort data",
  ],
};
