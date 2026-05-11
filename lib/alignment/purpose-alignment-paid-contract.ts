/**
 * lib/alignment/purpose-alignment-paid-contract.ts
 *
 * THE PAID RESULT CONTRACT — Purpose Alignment £49 output specification.
 *
 * This contract defines what the paid version MUST deliver that the free
 * version does not. It is the single source of truth for the paid result
 * shape, used by:
 *   - The assessment API to enrich paid results
 *   - The PDF dossier generator
 *   - The Decision Centre memory writer
 *   - The Executive Reporting bridge
 *   - The Strategy Room bridge
 *   - The commercial entitlement resolver
 *
 * The free result (PurposeProfileResult) is a subset. The paid result
 * is a superset that adds governed memory, dossier, constitution summary,
 * drift warning, execution implication, and corridor bridges.
 *
 * Product promise (from the execution brief):
 *   1. Mandate clarity reading
 *   2. Obligation conflict map
 *   3. Decision behaviour pattern
 *   4. Alignment drift warning
 *   5. Execution integrity implication
 *   6. Personal decision constitution summary
 *   7. Next admissible move
 *   8. Decision Centre memory write
 *   9. PDF dossier
 *   10. ER/Strategy Room bridge where justified
 */

import type {
  PurposeProfileResult,
  AlignmentDomain,
  AlignmentContradiction,
  CoherenceBand,
  DiagnosticSeverity,
  DomainProfile,
  PatternScore,
  PurposePatternId,
  RoutingRecommendation,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// PAID RESULT TYPE — the full £49 output
// ─────────────────────────────────────────────────────────────────────────────

export type PurposeAlignmentPaidResult = {
  /** Unique result identifier */
  resultId: string;
  /** User email if captured */
  userEmail?: string | null;

  // ── 1. MANDATE CLARITY READING ─────────────────────────────────────────
  mandateReading: {
    /** What the user declared as their mandate (from context) */
    declaredMandate: string;
    /** What their decision behaviour actually reveals about their mandate */
    inferredMandatePressure: string;
    /** The alignment band — how well declared and inferred match */
    alignmentBand: "COHERENT" | "PARTIALLY_COHERENT" | "CONFLICTED" | "ABSENT";
    /** Specific mandate statement derived from evidence */
    mandateStatement: string;
    /** Whether the mandate is structurally viable */
    mandateViability: "VIABLE" | "FRAGILE" | "UNVIABLE";
    /** The single sentence that captures their real operating mandate */
    operatingMandateSentence: string;
  };

  // ── 2. OBLIGATION CONFLICT MAP ─────────────────────────────────────────
  obligationConflictMap: {
    /** The primary competing obligation the user identified */
    primaryCompetingObligation: string;
    /** The consequence if unresolved */
    consequenceIfUnresolved: string;
    /** How the obligation distorts decision posture */
    distortionEffect: string;
    /** Whether the obligation can be renegotiated, removed, or must be accepted */
    obligationNature: "RENEGOTIABLE" | "REMOVABLE" | "MUST_ACCEPT" | "UNKNOWN";
    /** Specific renegotiation path if applicable */
    renegotiationPath?: string;
    /** The cost of keeping this obligation active */
    carryingCost: string;
  };

  // ── 3. DECISION BEHAVIOUR PATTERN ──────────────────────────────────────
  decisionBehaviourPattern: {
    /** The primary pattern identified */
    primaryPattern: PatternScore;
    /** Secondary pattern if present */
    secondaryPattern: PatternScore | null;
    /** How this pattern manifests in daily decisions */
    manifestation: string;
    /** The trigger conditions that activate the pattern */
    triggerConditions: string[];
    /** How the pattern has historically resolved (or not) */
    historicalResolution: string;
    /** Pattern recurrence risk */
    recurrenceRisk: "HIGH" | "MEDIUM" | "LOW";
  };

  // ── 4. ALIGNMENT DRIFT WARNING ─────────────────────────────────────────
  alignmentDriftWarning: {
    /** Whether drift is currently active */
    driftActive: boolean;
    /** The direction of drift */
    driftDirection: string;
    /** When drift was first detected (from assessment) */
    firstDetectedAt: string;
    /** Projected state if drift continues unchecked */
    projectedStateAt30Days: string;
    projectedStateAt60Days: string;
    projectedStateAt90Days: string;
    /** The specific domain(s) where drift is most acute */
    driftEpicentre: AlignmentDomain[];
    /** The corrective vector required */
    correctiveVector: string;
  };

  // ── 5. EXECUTION INTEGRITY IMPLICATION ─────────────────────────────────
  executionIntegrityImplication: {
    /** Whether the pattern affects execution integrity */
    integrityImpacted: boolean;
    /** How the pattern manifests in execution */
    executionManifestation: string;
    /** The specific execution risk */
    executionRisk: string;
    /** What must be protected during execution */
    mustProtect: string[];
    /** What must stop during execution */
    mustStop: string[];
    /** Execution integrity score (0-100) */
    integrityScore: number;
  };

  // ── 6. PERSONAL DECISION CONSTITUTION SUMMARY ──────────────────────────
  personalDecisionConstitution: {
    /** The governing principle derived from the assessment */
    governingPrinciple: string;
    /** Decision rules that should govern future choices */
    decisionRules: string[];
    /** Authority boundaries */
    authorityBoundaries: string[];
    /** What requires escalation */
    escalationTriggers: string[];
    /** The decision rights statement */
    decisionRightsStatement: string;
    /** Obligations the user has accepted */
    acceptedObligations: string[];
    /** Obligations the user must renegotiate or shed */
    contestedObligations: string[];
  };

  // ── 7. NEXT ADMISSIBLE MOVE ────────────────────────────────────────────
  nextAdmissibleMove: {
    /** The single next move */
    move: string;
    /** Why this move and not another */
    rationale: string;
    /** The condition that must be met before this move */
    precondition?: string;
    /** What happens if this move is not taken */
    costOfDelay: string;
    /** Time sensitivity */
    timeSensitivity: "IMMEDIATE" | "THIS_WEEK" | "THIS_MONTH" | "THIS_QUARTER";
    /** Whether this move qualifies for escalation */
    escalationQualified: boolean;
    /** If escalation qualified, the target surface */
    escalationTarget?: "EXECUTIVE_REPORTING" | "STRATEGY_ROOM" | "BOARDROOM";
  };

  // ── 8. DECISION CENTRE MEMORY ──────────────────────────────────────────
  decisionCentreMemory: {
    /** Whether memory was written */
    written: boolean;
    /** The memory record ID if written */
    memoryId?: string;
    /** Memory summary for display */
    summary: string;
    /** Memory status */
    status: "ACTIVE" | "PENDING" | "FAILED";
  };

  // ── 9. PDF DOSSIER ─────────────────────────────────────────────────────
  pdfDossier: {
    /** Whether dossier generation was requested */
    requested: boolean;
    /** Whether dossier was generated */
    generated: boolean;
    /** URL to download the dossier */
    downloadUrl?: string;
    /** Dossier generation timestamp */
    generatedAt?: string;
  };

  // ── 10. ER/STRATEGY ROOM BRIDGE ────────────────────────────────────────
  corridorBridge: {
    /** Whether bridge is justified */
    bridgeJustified: boolean;
    /** The justification */
    justification: string;
    /** Target surface */
    targetSurface: "EXECUTIVE_REPORTING" | "STRATEGY_ROOM" | "BOARDROOM" | "NONE";
    /** Evidence that justifies the bridge */
    bridgeEvidence: string[];
    /** The bridge payload */
    bridgePayload?: Record<string, unknown>;
  };

  // ── DERIVED FROM FREE RESULT ───────────────────────────────────────────
  freeResult: PurposeProfileResult;
  coherenceBand: CoherenceBand;
  severity: DiagnosticSeverity;
  domainProfiles: DomainProfile[];
  contradictions: AlignmentContradiction[];
  weakestDomains: AlignmentDomain[];
  corrections: string[];
  createdAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// PAID RESULT BUILDER — enriches a free result into a paid result
// ─────────────────────────────────────────────────────────────────────────────

export type PaidResultBuildInput = {
  freeResult: PurposeProfileResult;
  resultId: string;
  userEmail?: string | null;
  contextAnswers: {
    avoidedDecision: string;
    competingObligation: string;
    consequence: string;
  };
  /** Whether PDF generation was requested */
  pdfRequested?: boolean;
  /** Whether to write to Decision Centre memory */
  writeMemory?: boolean;
};

/**
 * Build the full £49 paid result from the free engine output.
 * This is the canonical enrichment function.
 */
export function buildPaidResult(input: PaidResultBuildInput): PurposeAlignmentPaidResult {
  const { freeResult, resultId, userEmail, contextAnswers, pdfRequested, writeMemory } = input;
  const primary = freeResult.primaryPattern;
  const secondary = freeResult.secondaryPattern;

  // ── Mandate Reading ────────────────────────────────────────────────────
  const declaredMandate = contextAnswers.avoidedDecision || "Not explicitly declared";
  const identityScore = freeResult.domainProfiles.find((d) => d.domain === "identity")?.percent ?? 50;
  const decisionScore = freeResult.domainProfiles.find((d) => d.domain === "decision")?.percent ?? 50;
  const behaviourScore = freeResult.domainProfiles.find((d) => d.domain === "behaviour")?.percent ?? 50;

  const inferredMandatePressure = identityScore >= 70
    ? "Your identity signal is strong — your mandate is clear but may not yet be tested under pressure."
    : identityScore >= 45
      ? "Your mandate is partially formed. Pressure reveals the gaps."
      : "Your mandate is not yet structurally distinct from your environment.";

  const alignmentBand = (() => {
    if (identityScore >= 70 && decisionScore >= 65) return "COHERENT" as const;
    if (identityScore >= 50 || decisionScore >= 50) return "PARTIALLY_COHERENT" as const;
    if (identityScore >= 30) return "CONFLICTED" as const;
    return "ABSENT" as const;
  })();

  const mandateViability = (() => {
    if (freeResult.coherenceBand === "SOVEREIGN") return "VIABLE" as const;
    if (freeResult.coherenceBand === "ALIGNED") return "VIABLE" as const;
    if (freeResult.coherenceBand === "DRIFTING") return "FRAGILE" as const;
    return "UNVIABLE" as const;
  })();

  const operatingMandateSentence = (() => {
    if (primary?.id === "mandate_fracture") {
      return `Your current operating mandate is governed by proximity and pressure rather than declared intent. The evidence shows you are serving "${contextAnswers.competingObligation}" more reliably than your stated direction.`;
    }
    if (primary?.id === "pressure_override") {
      return `Your mandate is clear in principle but overridden under pressure. The operating rule is: urgency decides, not mandate.`;
    }
    if (contextAnswers.avoidedDecision) {
      return `Your operating mandate is defined by what you are avoiding: ${contextAnswers.avoidedDecision}. Until this is resolved, your mandate remains reactive.`;
    }
    return "Your mandate is present but not yet governing your decisions under pressure.";
  })();

  // ── Obligation Conflict Map ────────────────────────────────────────────
  const obligationNature = (() => {
    const obligation = (contextAnswers.competingObligation || "").toLowerCase();
    if (/(can leave|can quit|can resign|can sell|can end|can stop)/i.test(obligation)) return "REMOVABLE" as const;
    if (/(renegotiate|renegotiation|discuss|talk|conversation|meeting)/i.test(obligation)) return "RENEGOTIABLE" as const;
    if (/(family|child|parent|health|illness|permanent|irreversible)/i.test(obligation)) return "MUST_ACCEPT" as const;
    return "UNKNOWN" as const;
  })();

  // ── Decision Behaviour Pattern ─────────────────────────────────────────
  const manifestation = primary
    ? `Your decisions reveal a "${primary.label}" pattern. ${primary.consequence}`
    : "Your decision behaviour pattern is not yet fully resolved by the engine.";

  const triggerConditions = (() => {
    const triggers: string[] = [];
    if (freeResult.weakestDomains.includes("emotional_order")) triggers.push("Emotional pressure or fatigue");
    if (freeResult.weakestDomains.includes("environment")) triggers.push("Environmental noise or conflict");
    if (freeResult.weakestDomains.includes("decision")) triggers.push("High-stakes or time-constrained decisions");
    if (contextAnswers.competingObligation) triggers.push(`Conflict with: ${contextAnswers.competingObligation}`);
    if (triggers.length === 0) triggers.push("Pattern triggers are not yet fully resolved");
    return triggers;
  })();

  // ── Alignment Drift Warning ────────────────────────────────────────────
  const driftActive = freeResult.coherenceBand === "DRIFTING" || freeResult.coherenceBand === "FRAGMENTED";
  const driftDirection = (() => {
    if (freeResult.weakestDomains.includes("identity")) return "Mandate erosion — identity is weakening relative to environment";
    if (freeResult.weakestDomains.includes("behaviour")) return "Behaviour-environment decoupling — actions no longer serve stated direction";
    if (freeResult.weakestDomains.includes("emotional_order")) return "Internal order degradation — pressure is distorting decision quality";
    return "Distributed drift — no single domain explains the condition";
  })();

  // ── Execution Integrity Implication ────────────────────────────────────
  const integrityScore = (() => {
    const base = freeResult.percent;
    const behaviourPenalty = behaviourScore < 40 ? 15 : behaviourScore < 55 ? 8 : 0;
    const contradictionPenalty = (freeResult.contradictions?.length ?? 0) * 5;
    return Math.max(0, Math.min(100, Math.round(base - behaviourPenalty - contradictionPenalty)));
  })();

  const mustProtect: string[] = [];
  const mustStop: string[] = [];

  if (freeResult.weakestDomains.includes("identity")) {
    mustProtect.push("Time for mandate clarification — protect at least one uninterrupted block per week");
  }
  if (freeResult.weakestDomains.includes("decision")) {
    mustProtect.push("Decision journal — record the principle behind each major choice");
    mustStop.push("Making high-stakes decisions under time pressure without written rationale");
  }
  if (freeResult.weakestDomains.includes("environment")) {
    mustStop.push("Engaging with the single most confusing or misaligned input in your environment");
  }
  if (freeResult.weakestDomains.includes("behaviour")) {
    mustProtect.push("One non-negotiable daily action tied to long-term outcome");
    mustStop.push("Saying yes to commitments that do not survive calendar inspection");
  }
  if (freeResult.weakestDomains.includes("emotional_order")) {
    mustProtect.push("Recovery rhythm — sleep, input quality, response delay");
  }
  if (freeResult.weakestDomains.includes("legacy")) {
    mustProtect.push("One weekly block for structure-building (not output)");
  }

  // ── Personal Decision Constitution ─────────────────────────────────────
  const decisionRules: string[] = [];
  if (freeResult.weakestDomains.includes("decision")) {
    decisionRules.push("No high-stakes decision without written principle and consequence mapping");
  }
  if (freeResult.weakestDomains.includes("emotional_order")) {
    decisionRules.push("Delay major decisions by 24 hours when emotional pressure is elevated");
  }
  if (contextAnswers.competingObligation) {
    decisionRules.push(`Renegotiate or remove "${contextAnswers.competingObligation}" before taking on new commitments`);
  }
  decisionRules.push("Test every commitment against the operating mandate sentence before accepting");
  if (decisionRules.length === 1) {
    decisionRules.push("Record the principle behind each decision and review weekly");
  }

  const escalationTriggersList: string[] = [];
  if (freeResult.severity === "high" || freeResult.severity === "critical") {
    escalationTriggersList.push("Pattern severity exceeds personal correction capacity");
  }
  if (freeResult.routingRecommendation?.spilloverLikely) {
    escalationTriggersList.push("Personal pattern is affecting structural decision quality");
  }
  if (contextAnswers.consequence && /(organisation|company|team|board|institution|staff|revenue)/i.test(contextAnswers.consequence)) {
    escalationTriggersList.push("Consequence has institutional or team-level implications");
  }
  if (escalationTriggersList.length === 0) {
    escalationTriggersList.push("Pattern recurs after 30 days without material improvement");
  }

  // ── Next Admissible Move ───────────────────────────────────────────────
  const escalationQualified = freeResult.routingRecommendation?.spilloverLikely === true
    || (freeResult.severity === "high" || freeResult.severity === "critical");

  const escalationTarget = (() => {
    if (!escalationQualified) return undefined;
    if (freeResult.routingRecommendation?.href?.includes("constitutional")) return "EXECUTIVE_REPORTING" as const;
    if (freeResult.routingRecommendation?.href?.includes("strategy")) return "STRATEGY_ROOM" as const;
    return "EXECUTIVE_REPORTING" as const;
  })();

  // ── Corridor Bridge ────────────────────────────────────────────────────
  const bridgeJustified = escalationQualified;
  const bridgeEvidence: string[] = [];
  if (freeResult.severity === "high" || freeResult.severity === "critical") {
    bridgeEvidence.push(`Assessment severity: ${freeResult.severity}`);
  }
  if (freeResult.routingRecommendation?.spilloverLikely) {
    bridgeEvidence.push("Spillover likely — personal pattern affects structural decision quality");
  }
  if (contextAnswers.consequence && /(organisation|company|team|board|institution|staff|revenue)/i.test(contextAnswers.consequence)) {
    bridgeEvidence.push("Institutional consequence identified in user context");
  }
  if (primary) {
    bridgeEvidence.push(`Primary pattern: ${primary.label}`);
  }

  return {
    resultId,
    userEmail: userEmail ?? null,

    // 1
    mandateReading: {
      declaredMandate,
      inferredMandatePressure,
      alignmentBand,
      mandateStatement: operatingMandateSentence,
      mandateViability,
      operatingMandateSentence,
    },

    // 2
    obligationConflictMap: {
      primaryCompetingObligation: contextAnswers.competingObligation || "Not identified",
      consequenceIfUnresolved: contextAnswers.consequence || "Not identified",
      distortionEffect: `The obligation "${contextAnswers.competingObligation || "unknown"}" pulls against the declared direction "${contextAnswers.avoidedDecision || "unknown"}", creating a structural conflict that prevents clean execution in either direction.`,
      obligationNature,
      renegotiationPath: obligationNature === "RENEGOTIABLE"
        ? `Schedule a conversation to redefine the terms of "${contextAnswers.competingObligation}" within 14 days. Name the minimum viable commitment and the cost of exceeding it.`
        : obligationNature === "REMOVABLE"
          ? `Plan the exit or removal of "${contextAnswers.competingObligation}" with a concrete timeline and替代 arrangement.`
          : undefined,
      carryingCost: `The active cost of maintaining "${contextAnswers.competingObligation || "this obligation"}" while "${contextAnswers.avoidedDecision || "the avoided decision"}" remains unresolved is that neither receives full attention, and both degrade over time.`,
    },

    // 3
    decisionBehaviourPattern: {
      primaryPattern: primary ?? {
        id: "distributed_drift" as PurposePatternId,
        label: "Distributed drift",
        score: 0,
        reasons: ["Pattern not fully resolved by engine"],
        consequence: "Continue monitoring",
        firstAction: freeResult.firstAction || "Name the avoided decision",
      },
      secondaryPattern: secondary ?? null,
      manifestation,
      triggerConditions,
      historicalResolution: primary?.consequence ?? "Pattern history not yet established",
      recurrenceRisk: freeResult.coherenceBand === "FRAGMENTED" ? "HIGH" : freeResult.coherenceBand === "DRIFTING" ? "MEDIUM" : "LOW",
    },

    // 4
    alignmentDriftWarning: {
      driftActive,
      driftDirection,
      firstDetectedAt: freeResult.createdAt,
      projectedStateAt30Days: driftActive
        ? `Without correction, ${driftDirection.toLowerCase()} will compound. The gap between stated intent and operating reality will widen.`
        : "Current trajectory is stable. Maintain the conditions that produced this reading.",
      projectedStateAt60Days: driftActive
        ? `Structural damage begins to settle. The pattern becomes how decisions are made, not just how they feel.`
        : "Continued stability expected if current conditions are protected.",
      projectedStateAt90Days: driftActive
        ? `The pattern becomes embedded. Recovery requires structural intervention rather than behavioural correction.`
        : "Long-term coherence is achievable if drift prevention is maintained.",
      driftEpicentre: freeResult.weakestDomains.slice(0, 2) as AlignmentDomain[],
      correctiveVector: freeResult.firstAction || "Name the avoided decision and define the correction.",
    },

    // 5
    executionIntegrityImplication: {
      integrityImpacted: integrityScore < 65,
      executionManifestation: integrityScore < 65
        ? `Execution integrity is ${integrityScore < 40 ? "critically" : "moderately"} impacted. The ${freeResult.weakestDomains[0] || "primary"} domain weakness is creating execution risk that will compound with each cycle.`
        : "Execution integrity is stable. The current pattern does not materially threaten execution quality.",
      executionRisk: integrityScore < 65
        ? `The risk is that ${freeResult.weakestDomains.includes("behaviour") ? "daily behaviour does not serve stated outcomes" : "the weakest domain degrades execution quality over time"}.`
        : "No immediate execution risk detected.",
      mustProtect: mustProtect.length > 0 ? mustProtect : ["Maintain current conditions"],
      mustStop: mustStop.length > 0 ? mustStop : ["No immediate behavioural stops required"],
      integrityScore,
    },

    // 6
    personalDecisionConstitution: {
      governingPrinciple: `Your decisions must serve your declared mandate. When a decision conflicts with "${contextAnswers.avoidedDecision || "your stated direction"}", the mandate prevails unless the competing obligation has been explicitly renegotiated.`,
      decisionRules,
      authorityBoundaries: [
        "You have authority over your own decisions, commitments, and time allocation.",
        "You do not have authority over outcomes that depend on others' choices without their consent.",
        ...(contextAnswers.competingObligation ? [`"${contextAnswers.competingObligation}" must be renegotiated before it governs your decisions.`] : []),
      ],
      escalationTriggers: escalationTriggersList,
      decisionRightsStatement: `I have the right to make decisions that serve my declared mandate. I have the obligation to renegotiate or remove competing obligations that prevent clean execution. I must escalate when the pattern exceeds my personal correction capacity.`,
      acceptedObligations: [
        "Serve the declared mandate with integrity",
        "Test decisions against principle before pressure",
        "Record and review decision patterns weekly",
        ...(freeResult.firstAction ? [freeResult.firstAction] : []),
      ],
      contestedObligations: contextAnswers.competingObligation
        ? [`"${contextAnswers.competingObligation}" — this obligation competes with the declared mandate and must be renegotiated or removed.`]
        : [],
    },

    // 7
    nextAdmissibleMove: {
      move: freeResult.firstAction || "Name the avoided decision as a binary choice and record the consequence of choosing neither option.",
      rationale: primary
        ? `This move directly addresses the "${primary.label}" pattern by targeting the weakest structural element.`
        : "This move creates the first structural correction from which all others follow.",
      precondition: undefined,
      costOfDelay: freeResult.primaryPattern?.consequence ?? "Delay compounds the pattern and increases correction cost.",
      timeSensitivity: freeResult.severity === "critical" ? "IMMEDIATE" : freeResult.severity === "high" ? "THIS_WEEK" : "THIS_MONTH",
      escalationQualified,
      escalationTarget,
    },

    // 8
    decisionCentreMemory: {
      written: Boolean(writeMemory),
      memoryId: undefined,
      summary: `Purpose Alignment assessment completed. Primary pattern: ${primary?.label ?? "Distributed drift"}. Weakest domain: ${freeResult.weakestDomains[0] ?? "Unknown"}. First action: ${freeResult.firstAction ?? "Not specified"}.`,
      status: "PENDING",
    },

    // 9
    pdfDossier: {
      requested: Boolean(pdfRequested),
      generated: false,
      downloadUrl: undefined,
      generatedAt: undefined,
    },

    // 10
    corridorBridge: {
      bridgeJustified,
      justification: bridgeJustified
        ? `The assessment reveals a ${freeResult.severity} severity pattern with spillover potential. The evidence justifies escalation to ${escalationTarget ?? "Executive Reporting"} for structural resolution.`
        : "The current pattern does not justify escalation. Continue with personal correction before seeking structural intervention.",
      targetSurface: escalationTarget ?? "NONE",
      bridgeEvidence,
      bridgePayload: bridgeJustified ? {
        sourceSurface: "PURPOSE_ALIGNMENT",
        assessedAt: freeResult.createdAt,
        coherenceBand: freeResult.coherenceBand,
        severity: freeResult.severity,
        primaryPattern: primary?.label ?? null,
        weakestDomains: freeResult.weakestDomains,
        competingObligation: contextAnswers.competingObligation,
        consequence: contextAnswers.consequence,
        firstAction: freeResult.firstAction,
        contradictions: (freeResult.contradictions ?? []).map((c) => ({
          type: c.type,
          severity: c.severity,
          evidence: c.evidence,
        })),
        domainScores: freeResult.domainProfiles.map((d) => ({
          domain: d.domain,
          label: d.label,
          percent: d.percent,
        })),
      } : undefined,
    },

    // Derived
    freeResult,
    coherenceBand: freeResult.coherenceBand,
    severity: freeResult.severity ?? "low",
    domainProfiles: freeResult.domainProfiles,
    contradictions: freeResult.contradictions ?? [],
    weakestDomains: freeResult.weakestDomains as AlignmentDomain[],
    corrections: freeResult.corrections,
    createdAt: freeResult.createdAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PAID RESULT VALIDATOR — ensures all required fields are present
// ─────────────────────────────────────────────────────────────────────────────

export type PaidResultValidationError = {
  field: string;
  message: string;
};

/**
 * Validate that a paid result meets the £49 contract.
 * Returns empty array if valid, array of errors if not.
 */
export function validatePaidResult(result: PurposeAlignmentPaidResult): PaidResultValidationError[] {
  const errors: PaidResultValidationError[] = [];

  if (!result.resultId) errors.push({ field: "resultId", message: "Result ID is required" });
  if (!result.mandateReading.declaredMandate) errors.push({ field: "mandateReading.declaredMandate", message: "Declared mandate is required" });
  if (!result.mandateReading.operatingMandateSentence) errors.push({ field: "mandateReading.operatingMandateSentence", message: "Operating mandate sentence is required" });
  if (!result.obligationConflictMap.primaryCompetingObligation) errors.push({ field: "obligationConflictMap.primaryCompetingObligation", message: "Primary competing obligation is required" });
  if (!result.decisionBehaviourPattern.primaryPattern) errors.push({ field: "decisionBehaviourPattern.primaryPattern", message: "Primary pattern is required" });
  if (result.decisionBehaviourPattern.triggerConditions.length === 0) errors.push({ field: "decisionBehaviourPattern.triggerConditions", message: "At least one trigger condition is required" });
  if (!result.alignmentDriftWarning.driftDirection) errors.push({ field: "alignmentDriftWarning.driftDirection", message: "Drift direction is required" });
  if (result.personalDecisionConstitution.decisionRules.length === 0) errors.push({ field: "personalDecisionConstitution.decisionRules", message: "At least one decision rule is required" });
  if (!result.nextAdmissibleMove.move) errors.push({ field: "nextAdmissibleMove.move", message: "Next admissible move is required" });
  if (result.personalDecisionConstitution.escalationTriggers.length === 0) errors.push({ field: "personalDecisionConstitution.escalationTriggers", message: "At least one escalation trigger is required" });

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAID RESULT CONTRACT METADATA
// ─────────────────────────────────────────────────────────────────────────────

export const PAID_RESULT_CONTRACT = {
  /** The commercial product code this contract serves */
  productCode: "personal_decision_audit",
  /** The price in GBP (pence) */
  priceInPence: 4900,
  /** The display price */
  displayPrice: "£49",
  /** Contract version for schema migration */
  contractVersion: "1.0.0",
  /** The number of deliverables promised */
  deliverableCount: 10,
  /** Each deliverable label */
  deliverables: [
    "Mandate clarity reading",
    "Obligation conflict map",
    "Decision behaviour pattern",
    "Alignment drift warning",
    "Execution integrity implication",
    "Personal decision constitution summary",
    "Next admissible move",
    "Decision Centre memory write",
    "PDF dossier",
    "ER/Strategy Room bridge where justified",
  ] as const,
} as const;
