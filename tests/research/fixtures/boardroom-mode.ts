/**
 * tests/research/fixtures/boardroom-mode.ts
 *
 * Synthetic IntelligenceSpine fixtures for Boardroom Mode adapter tests.
 * No real customer data. No personally identifiable information.
 * All economics figures are illustrative only.
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

const FIXTURE_TIMESTAMP = "2026-05-25T08:00:00.000Z";

// ─── Qualifying Spine ─────────────────────────────────────────────────────────
// cost >= £5k/month, accuracy = "yes"
// conditionClass: authority — clear structural contradiction in decision ownership

export const QUALIFYING_SPINE: IntelligenceSpine = {
  id: "fixture-qualifying-001",
  userId: undefined,
  email: undefined,

  case: {
    id: "fixture-qualifying-001",
    decision: "Whether to restructure the executive team and give regional directors full P&L ownership within Q3, or hold current authority structure until the board has reviewed all options.",
    priorAttempt: "Two off-site strategy days produced no structural change. Authority remained ambiguous.",
    costOfDelay: "£8,500/month in execution overhead and senior attrition risk.",
    claimedOwner: "Chief Executive",
    blocker: "Board has not formally approved the restructure scope.",
    forcedAction: "Announce the restructure to the executive team within 72 hours and begin role transitions.",
    contradiction: "The stated blocker (board approval) is bypassed by the stated forced action (announce and begin). The board approval is not the real blocker.",
    inferredAvoidance: "The conversation required to confront the senior team members who would lose authority.",
    conditionClass: "authority",
    signalStrength: "high",
    specificityScore: 0.82,
    createdAt: FIXTURE_TIMESTAMP,
    updatedAt: FIXTURE_TIMESTAMP,
  },

  c3: {
    clarity: 0.85,
    context: 0.80,
    consequence: 0.88,
    specificityScore: 0.82,
    mode: "SYNTHESIS_READY",
    tier: "FULL_SYNTHESIS",
    confidenceBand: "high",
    missing: [],
    scoringExplanation: {
      clarity: "Decision is named, scoped, and time-bound.",
      context: "Prior attempts and blockers are articulated.",
      consequence: "Monthly cost stated explicitly.",
    },
    recoveryClassification: null,
  },

  deterministic: {
    conditionClass: "authority",
    signal: {
      key: "AUTHORITY_LEAKAGE",
      label: "Authority is unclear under urgency",
      verdict: "No one owns this decision. Under urgency, it will be made by whoever acts first.",
      contradiction: "You claim urgency. But no one is authorised to decide.",
      move: "Within 24 hours, name the person who can make this decision without further permission.",
      ignored7: "Control begins transferring to whoever acts first.",
      ignored30: "Informal authority has replaced formal authority.",
      ignored90: "The decision structure has been rewritten by behaviour, not by design.",
      behaviourReveal: "Under pressure, control defaults to position rather than mandate.",
      escalationLine: "The longer this continues, the more expensive the reset.",
      boundaryStatement: "This analysis reflects stated inputs only. External unknowns are not modelled.",
      primaryStatement: "Authority is unclear under urgency.",
      decisionStatement: "No one owns this decision.",
      consequenceStatement: "Delay increases the cost of eventual restructure.",
      moveStatement: "Name a decision owner within 24 hours.",
    },
    contradictionSet: [
      "Board approval stated as blocker, but forced action bypasses board.",
      "CEO claims ownership but defers to board that has not been formally asked.",
    ],
    blockerClass: "false_authority",
  },

  synthesis: {
    verdict: "The restructure is not blocked by the board. It is blocked by the conversation you have not had with the people who will lose authority in it.",
    primaryContradiction: "You named the board as the blocker but your forced action bypasses them entirely. The board is not the blocker.",
    avoidedDecision: "The direct confrontation with the senior leadership team members who will lose P&L authority.",
    whyPriorAttemptsFailed: "The two off-site sessions generated alignment on strategy but not on accountability. Without a named decision owner, each session reset to the previous state.",
    concreteMove: "Within 72 hours: name the Chief Executive as the sole P&L restructure authority. Send one written communication to the executive team.",
    defaultPathForecast: "Without action: cost continues at £8,500/month. Senior attrition risk converts to actual attrition within 90 days. Regional directors disengage from informal authority.",
    signalStrength: "high",
    certaintyBoundary: "This analysis is based on stated inputs. It does not model market conditions, board composition dynamics, or individual stakeholder psychology.",
    quotedUserLanguage: [
      "Board has not formally approved the restructure scope",
      "Announce the restructure to the executive team within 72 hours",
    ],
    conditionClass: "authority",
    c3Score: {
      clarity: 0.85,
      context: 0.80,
      consequence: 0.88,
      specificityScore: 0.82,
      mode: "SYNTHESIS_READY",
      tier: "FULL_SYNTHESIS",
      confidenceBand: "high",
      missing: [],
      scoringExplanation: {
        clarity: "Decision is named, scoped, and time-bound.",
        context: "Prior attempts and blockers are articulated.",
        consequence: "Monthly cost stated explicitly.",
      },
      recoveryClassification: null,
    },
  },

  forecast: {
    alreadyIncurred: "Two strategy off-sites with no structural change — estimated sunk cost £12,000.",
    sevenDays: "Authority remains ambiguous. Regional directors wait for signal.",
    thirtyDays: "One or two regional directors begin making scope decisions unilaterally.",
    ninetyDays: "Informal authority has redistributed. Formal restructure now requires unwinding informal claims.",
    optionCompression: "Each month without decision narrows the restructure options available.",
    consequenceShift: "From internal execution risk to market-visible attrition risk.",
    optionDecayRate: 0.30,
    controlShiftProbability: 0.65,
    structuralRiskShift: "accelerating",
  },

  memory: null,
  stakeholderMap: null,

  stage: "strategy_room",
  history: [
    {
      stage: "fast_diagnostic",
      completedAt: FIXTURE_TIMESTAMP,
      snapshot: {
        conditionClass: "authority",
        c3Tier: "FULL_SYNTHESIS",
        hasSynthesis: true,
        signalStrength: "high",
      },
      contribution: "Authority condition identified. Signal: AUTHORITY_LEAKAGE. C3 tier: FULL_SYNTHESIS.",
    },
  ],

  accuracyFeedback: {
    response: "yes",
    reason: "The contradiction about the board is accurate.",
    capturedAt: FIXTURE_TIMESTAMP,
  },

  economics: {
    estimatedMonthlyCost: 8500,
    costOfDelayMonthly: 8500,
    decisionOwner: "Chief Executive",
    deadline: "2026-09-30",
  },

  flags: {
    avoidanceSuspected: true,
    falseAuthority: true,
    economicSanitySuspicious: false,
    doNotSellTriggered: false,
  },

  integrityScore: 0.88,
  pressureIndex: 72,

  createdAt: FIXTURE_TIMESTAMP,
  updatedAt: FIXTURE_TIMESTAMP,
};

// ─── Borderline Spine ─────────────────────────────────────────────────────────
// cost = £5,200/month (just above threshold), accuracy = "partial"
// conditionClass: execution — deferred decision, less clear ownership

export const BORDERLINE_SPINE: IntelligenceSpine = {
  id: "fixture-borderline-002",
  userId: undefined,
  email: undefined,

  case: {
    id: "fixture-borderline-002",
    decision: "Whether to proceed with the digital platform migration in Q4 or defer to Q1 next year given current resource constraints.",
    priorAttempt: "Initial scoping completed. Vendor selected. Migration has not started.",
    costOfDelay: "Around £5,000 to £6,000 per month in legacy licence costs and engineering drag.",
    claimedOwner: "CTO and CPO jointly.",
    blocker: "Resource allocation has not been confirmed by the CFO.",
    forcedAction: "Instruct the CTO to proceed with Phase 1 of migration using current team capacity.",
    conditionClass: "execution",
    signalStrength: "medium",
    specificityScore: 0.64,
    createdAt: FIXTURE_TIMESTAMP,
    updatedAt: FIXTURE_TIMESTAMP,
  },

  c3: {
    clarity: 0.70,
    context: 0.62,
    consequence: 0.65,
    specificityScore: 0.64,
    mode: "SYNTHESIS_READY",
    tier: "SOFT_RECOVERY",
    confidenceBand: "medium",
    missing: ["context"],
    scoringExplanation: {
      clarity: "Decision stated but ownership is split — reduces clarity.",
      context: "Prior attempt present but resource picture is incomplete.",
      consequence: "Cost range given but not pinned to specific figure.",
    },
    recoveryClassification: "missing_owner",
  },

  deterministic: {
    conditionClass: "execution",
    signal: {
      key: "EXECUTION_AVOIDANCE",
      label: "The decision is understood but avoided",
      verdict: "This decision is understood. It is not being made because the cost of making it has not been accepted.",
      contradiction: "Resource confirmation is cited as blocker, but forced action bypasses CFO confirmation.",
      move: "Proceed with Phase 1 under current authority. Confirm resource formally within 5 working days.",
      ignored7: "Vendor costs continue. Team uncertainty increases.",
      ignored30: "Q4 window narrows. Q1 deferral becomes the de facto decision.",
      ignored90: "Legacy licence cost has compounded. Team has disengaged from migration planning.",
      behaviourReveal: "The real barrier is not resource — it is authority to commit the resource.",
      escalationLine: "Each week of deferral increases migration complexity and legacy cost.",
      boundaryStatement: "Analysis is based on stated inputs only.",
      primaryStatement: "Execution is being avoided.",
      decisionStatement: "The decision is understood but not being made.",
      consequenceStatement: "Q4 window closes if no action taken.",
      moveStatement: "Proceed with Phase 1 under current authority.",
    },
    contradictionSet: [
      "CFO cited as blocker but forced action bypasses CFO.",
      "Joint ownership (CTO + CPO) creates execution stall by design.",
    ],
    blockerClass: "resource_authority",
  },

  synthesis: null,

  forecast: {
    sevenDays: "Q4 planning window narrows. Legacy costs continue.",
    thirtyDays: "Q1 deferral becomes inevitable. Team re-planning costs added.",
    ninetyDays: "Migration deferred by one full cycle. Legacy costs: £15,000–£18,000 additional.",
    optionDecayRate: 0.40,
    controlShiftProbability: 0.45,
    structuralRiskShift: "accelerating",
  },

  memory: null,
  stakeholderMap: null,

  stage: "fast_diagnostic",
  history: [
    {
      stage: "fast_diagnostic",
      completedAt: FIXTURE_TIMESTAMP,
      snapshot: {
        conditionClass: "execution",
        c3Tier: "SOFT_RECOVERY",
        hasSynthesis: false,
        signalStrength: "medium",
      },
      contribution: "Execution avoidance identified. Joint ownership flagged as structural stall.",
    },
  ],

  accuracyFeedback: {
    response: "partial",
    reason: "The execution avoidance reading is accurate but the resource constraint is real.",
    capturedAt: FIXTURE_TIMESTAMP,
  },

  economics: {
    estimatedMonthlyCost: 5200,
    costOfDelayMonthly: 5200,
    decisionOwner: "CTO",
    deadline: "2026-12-31",
  },

  flags: {
    avoidanceSuspected: false,
    falseAuthority: false,
    economicSanitySuspicious: false,
    doNotSellTriggered: false,
  },

  integrityScore: 0.72,
  pressureIndex: 48,

  createdAt: FIXTURE_TIMESTAMP,
  updatedAt: FIXTURE_TIMESTAMP,
};

// ─── Non-Qualifying Spine ─────────────────────────────────────────────────────
// cost = £1,800/month (below £5k), accuracy = "no"
// Boardroom mode should not activate

export const NON_QUALIFYING_SPINE: IntelligenceSpine = {
  id: "fixture-non-qualifying-003",
  userId: undefined,
  email: undefined,

  case: {
    id: "fixture-non-qualifying-003",
    decision: "Whether to upgrade the internal project management tool from the current plan to the enterprise tier.",
    priorAttempt: "Reviewed options. Team prefers the upgrade.",
    costOfDelay: "Roughly £1,800 per month in lost productivity.",
    claimedOwner: "Operations Manager.",
    blocker: "Budget approval from Finance.",
    forcedAction: "Approve the upgrade from current budget and seek retrospective Finance sign-off.",
    conditionClass: "execution",
    signalStrength: "low",
    specificityScore: 0.42,
    createdAt: FIXTURE_TIMESTAMP,
    updatedAt: FIXTURE_TIMESTAMP,
  },

  c3: {
    clarity: 0.55,
    context: 0.45,
    consequence: 0.40,
    specificityScore: 0.42,
    mode: "PRECISION_RECOVERY",
    tier: "HARD_RECOVERY",
    confidenceBand: "low",
    missing: ["context", "consequence"],
    scoringExplanation: {
      clarity: "Decision is low-stakes and operational.",
      context: "No structural pattern evident.",
      consequence: "Cost stated but below board-level threshold.",
    },
    recoveryClassification: "insufficient_detail",
  },

  deterministic: {
    conditionClass: "execution",
    signal: {
      key: "EXECUTION_AVOIDANCE",
      label: "The decision is understood but avoided",
      verdict: "This is an operational decision deferred by governance process.",
      contradiction: "Finance cited as blocker but forced action bypasses Finance approval.",
      move: "Approve under Operations Manager authority. Notify Finance same day.",
      ignored7: "Team productivity impact continues.",
      ignored30: "Tool workarounds add overhead.",
      ignored90: "Team builds workarounds that become technical debt.",
      behaviourReveal: "The real barrier is not Finance — it is authority to commit without permission.",
      escalationLine: "Cost of deferral is low but accumulates.",
      boundaryStatement: "Analysis based on stated inputs only.",
      primaryStatement: "Execution avoidance at operational level.",
      decisionStatement: "The decision is operational and should not require board involvement.",
      consequenceStatement: "Productivity cost continues.",
      moveStatement: "Approve under current authority.",
    },
    contradictionSet: [
      "Finance cited as blocker, forced action bypasses Finance.",
    ],
    blockerClass: "permission_seeking",
  },

  synthesis: null,

  forecast: {
    sevenDays: "Productivity overhead continues.",
    thirtyDays: "Team workarounds increase.",
    ninetyDays: "Technical debt from workarounds becomes visible.",
    optionDecayRate: 0.10,
    controlShiftProbability: 0.15,
    structuralRiskShift: "stable",
  },

  memory: null,
  stakeholderMap: null,

  stage: "fast_diagnostic",
  history: [
    {
      stage: "fast_diagnostic",
      completedAt: FIXTURE_TIMESTAMP,
      snapshot: {
        conditionClass: "execution",
        c3Tier: "HARD_RECOVERY",
        hasSynthesis: false,
        signalStrength: "low",
      },
      contribution: "Operational execution issue. Below board threshold.",
    },
  ],

  accuracyFeedback: {
    response: "no",
    reason: "The productivity number is an estimate.",
    capturedAt: FIXTURE_TIMESTAMP,
  },

  economics: {
    estimatedMonthlyCost: 1800,
    costOfDelayMonthly: 1800,
    decisionOwner: "Operations Manager",
  },

  flags: {
    avoidanceSuspected: false,
    falseAuthority: false,
    economicSanitySuspicious: false,
    doNotSellTriggered: false,
  },

  integrityScore: 0.60,
  pressureIndex: 22,

  createdAt: FIXTURE_TIMESTAMP,
  updatedAt: FIXTURE_TIMESTAMP,
};

// ─── Minimal / Malformed Spine ─────────────────────────────────────────────────
// Missing required fields — adapter must handle gracefully with typed error

export const MALFORMED_SPINE = {
  id: "fixture-malformed-004",
  // case is missing the required `decision` field
  case: {
    id: "fixture-malformed-004",
    decision: "",          // empty — validation should catch this
    specificityScore: 0,
    createdAt: FIXTURE_TIMESTAMP,
    updatedAt: FIXTURE_TIMESTAMP,
  },
  // deterministic is missing conditionClass
  deterministic: {
    conditionClass: undefined as unknown as "authority",
    contradictionSet: [],
    blockerClass: "",
    signal: undefined as never,
  },
  c3: undefined as never,
  synthesis: null,
  forecast: undefined as never,
  memory: null,
  stakeholderMap: null,
  stage: "fast_diagnostic" as const,
  history: [],
  createdAt: FIXTURE_TIMESTAMP,
  updatedAt: FIXTURE_TIMESTAMP,
} as Partial<IntelligenceSpine>;

// ─── High-Cost Qualifying Spine ───────────────────────────────────────────────
// cost >= £20k/month — qualifies by default regardless of accuracy feedback

export const HIGH_COST_QUALIFYING_SPINE: IntelligenceSpine = {
  ...QUALIFYING_SPINE,
  id: "fixture-high-cost-005",
  case: {
    ...QUALIFYING_SPINE.case,
    id: "fixture-high-cost-005",
  },
  economics: {
    estimatedMonthlyCost: 22000,
    costOfDelayMonthly: 22000,
    decisionOwner: "Group Chief Executive",
    deadline: "2026-07-31",
  },
  accuracyFeedback: {
    response: "no",    // accuracy is "no" — but cost >= 20k overrides
    reason: "Some figures are estimates.",
    capturedAt: FIXTURE_TIMESTAMP,
  },
};
