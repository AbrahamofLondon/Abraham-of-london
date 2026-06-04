/**
 * lib/boardroom/boardroom-dev-spine.ts
 *
 * Qualifying IntelligenceSpine fixture for the v1 Boardroom delivery admin route.
 * Used by app/api/admin/boardroom-delivery/generate/route.ts as a hardcoded
 * spine source until the route is wired to load a real spine from the database
 * by spineId.
 *
 * NOT test infrastructure — this is a production stub. When the DB load path
 * is implemented, delete this file and update the route.
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

const FIXTURE_TIMESTAMP = "2026-05-25T08:00:00.000Z";

export const QUALIFYING_SPINE: IntelligenceSpine = {
  id: "fixture-qualifying-001",
  userId: undefined,
  email: undefined,

  case: {
    id: "fixture-qualifying-001",
    decision:
      "Whether to restructure the executive team and give regional directors full P&L ownership within Q3, or hold current authority structure until the board has reviewed all options.",
    priorAttempt:
      "Two off-site strategy days produced no structural change. Authority remained ambiguous.",
    costOfDelay: "£8,500/month in execution overhead and senior attrition risk.",
    claimedOwner: "Chief Executive",
    blocker: "Board has not formally approved the restructure scope.",
    forcedAction:
      "Announce the restructure to the executive team within 72 hours and begin role transitions.",
    contradiction:
      "The stated blocker (board approval) is bypassed by the stated forced action (announce and begin). The board approval is not the real blocker.",
    inferredAvoidance:
      "The conversation required to confront the senior team members who would lose authority.",
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
      verdict:
        "No one owns this decision. Under urgency, it will be made by whoever acts first.",
      contradiction: "You claim urgency. But no one is authorised to decide.",
      move: "Within 24 hours, name the person who can make this decision without further permission.",
      ignored7: "Control begins transferring to whoever acts first.",
      ignored30: "Informal authority has replaced formal authority.",
      ignored90: "The decision structure has been rewritten by behaviour, not by design.",
      behaviourReveal:
        "Under pressure, control defaults to position rather than mandate.",
      escalationLine:
        "The longer this continues, the more expensive the reset.",
      boundaryStatement:
        "This analysis reflects stated inputs only. External unknowns are not modelled.",
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
    verdict:
      "The restructure is not blocked by the board. It is blocked by the conversation you have not had with the people who will lose authority in it.",
    primaryContradiction:
      "You named the board as the blocker but your forced action bypasses them entirely. The board is not the blocker.",
    avoidedDecision:
      "The direct confrontation with the senior leadership team members who will lose P&L authority.",
    whyPriorAttemptsFailed:
      "The two off-site sessions generated alignment on strategy but not on accountability. Without a named decision owner, each session reset to the previous state.",
    concreteMove:
      "Within 72 hours: name the Chief Executive as the sole P&L restructure authority. Send one written communication to the executive team.",
    defaultPathForecast:
      "Without action: cost continues at £8,500/month. Senior attrition risk converts to actual attrition within 90 days. Regional directors disengage from informal authority.",
    signalStrength: "high",
    certaintyBoundary:
      "This analysis is based on stated inputs. It does not model market conditions, board composition dynamics, or individual stakeholder psychology.",
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
    alreadyIncurred:
      "Two strategy off-sites with no structural change — estimated sunk cost £12,000.",
    sevenDays: "Authority remains ambiguous. Regional directors wait for signal.",
    thirtyDays:
      "One or two regional directors begin making scope decisions unilaterally.",
    ninetyDays:
      "Informal authority has redistributed. Formal restructure now requires unwinding informal claims.",
    optionCompression:
      "Each month without decision narrows the restructure options available.",
    consequenceShift:
      "From internal execution risk to market-visible attrition risk.",
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
      contribution:
        "Authority condition identified. Signal: AUTHORITY_LEAKAGE. C3 tier: FULL_SYNTHESIS.",
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
