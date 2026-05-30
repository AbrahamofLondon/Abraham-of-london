/**
 * lib/decision/decision-failure-map.ts
 *
 * Decision Failure Map — the universal decision failure model.
 *
 * Every serious decision fails in one of ten places:
 *   1.  Obligation   — what external duty exists and is unmet?
 *   2.  Authority    — who can make this binding, and is that unclear?
 *   3.  Evidence     — what is known, assumed, missing, or stale?
 *   4.  Constraint   — what limits action: money, time, access, power, records?
 *   5.  Consequence  — what worsens if delayed or wrong?
 *   6.  Reversibility — can the decision be corrected later?
 *   7.  Dependency   — who or what must act before this can succeed?
 *   8.  Exposure     — who carries legal, financial, reputational, or operational risk?
 *   9.  Viability    — what can actually be done now?
 *   10. Continuity   — what must be preserved so this decision doesn't disappear?
 *
 * Product doctrine:
 *   Abraham of London detects the failure point before the decision
 *   becomes damage.
 *
 * Architecture:
 *   The DFM calls the Constraint Reality Layer for domain/constraint/
 *   directive analysis, then adds the remaining nine failure dimensions
 *   on top. The CRL is one part of the DFM, not the whole thing.
 *
 * GUARDRAILS (same as CRL):
 *   - Does not provide tax, legal, financial, or professional advice.
 *   - Does not claim certainty about outcomes.
 *   - Does not recommend only paid help without a free/low-cost fallback.
 *   - Does not return NO_CRITICAL_FAILURE when external obligation risk exists.
 *
 * Pure TypeScript. No side effects. Browser-safe.
 */

import {
  analyzeConstraintReality,
  type CRLResult,
  type DecisionDomain,
  type ConstraintSignal,
  type PressureType,
  type RiskDirective,
  type ActionFeasibility,
} from "./constraint-reality-layer";

// ─── Failure point types ──────────────────────────────────────────────────────

export type FailurePoint =
  | "OBLIGATION_FAILURE"     // External duty unmet or at risk
  | "AUTHORITY_FAILURE"      // No named decision-maker or mandate unclear
  | "EVIDENCE_FAILURE"       // Key facts absent, assumed, or stale
  | "CONSTRAINT_FAILURE"     // Resource/capability/access limitation is blocking
  | "CONSEQUENCE_FAILURE"    // Downside underestimated or not acknowledged
  | "REVERSIBILITY_FAILURE"  // Window closing or commitment irrevocable
  | "DEPENDENCY_FAILURE"     // Someone/something must act first — unresolved
  | "EXPOSURE_FAILURE"       // Risk to person, organisation, or third party unaddressed
  | "VIABILITY_FAILURE"      // Recommended path inaccessible under actual constraints
  | "CONTINUITY_FAILURE"     // No record, tracking, or follow-through
  | "NO_CRITICAL_FAILURE";   // Genuinely low-stakes, no dimension failing

// ─── Dimension state types ────────────────────────────────────────────────────

export type ObligationLevel =
  | "none"         // No external obligation detected
  | "informal"     // Commitment or expectation set
  | "contractual"  // Contract or SLA in force
  | "regulatory"   // Regulatory or compliance requirement
  | "statutory";   // Legal/statutory duty (strongest)

export type AuthorityState =
  | "confirmed"    // Named decision-maker confirmed
  | "delegated"    // Authority delegated to named party
  | "unclear"      // Authority exists but not confirmed
  | "absent"       // No authority identified at all
  | "contested";   // Multiple parties claim or dispute authority

export type EvidenceState =
  | "verified"     // Data or evidence explicitly cited and confirmed
  | "partial"      // Some evidence present, some gaps
  | "assumed"      // Beliefs or assumptions driving the decision
  | "absent"       // No evidence referenced
  | "stale";       // Evidence present but time-qualified as old/outdated

export type ReversibilityLevel =
  | "freely_reversible"      // Can be changed at low cost
  | "costly_to_reverse"      // Reversal is possible but expensive
  | "difficult_to_reverse"   // Reversal requires significant effort
  | "irreversible";          // Cannot be undone once committed

export type ConsequenceSeverity =
  | "low"       // Low-stakes, limited impact
  | "moderate"  // Meaningful impact, recoverable
  | "high"      // Significant impact, costly to recover
  | "severe";   // Material or irreversible harm

export type ExposureType =
  | "legal"           // Lawsuit, regulatory, liability
  | "financial"       // Loss, penalty, fine, cost
  | "reputational"    // Brand, trust, customer perception
  | "operational"     // Service, system, delivery failure
  | "relational"      // Team, partner, client relationship
  | "personal";       // Individual wellbeing, family, health

export type FailureSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FailureRisk = {
  point: FailurePoint;
  severity: FailureSeverity;
  label: string;       // Human-readable failure name
  description: string; // What is failing and why
};

export type ViableMove = {
  label: string;
  description: string;
  accessibility: ActionFeasibility;
  requiresFunds: boolean;
  priority: "urgent" | "important" | "useful";
};

// ─── Full DFM result type ─────────────────────────────────────────────────────

export type DecisionFailureMapResult = {
  // ── Identity ────────────────────────────────────────────────────────────────
  decisionType: DecisionDomain;
  directive: RiskDirective;
  score: number;

  // ── 10 failure dimensions ────────────────────────────────────────────────────
  obligations: ObligationLevel;
  authorityState: AuthorityState;
  evidenceState: EvidenceState;
  constraintSignals: ConstraintSignal[];
  consequenceSeverity: ConsequenceSeverity;
  reversibility: ReversibilityLevel;
  dependencyRisks: string[];
  exposureTypes: ExposureType[];
  viabilityBlocked: boolean;
  continuityAtRisk: boolean;

  // ── Failure architecture ─────────────────────────────────────────────────────
  failureRisks: FailureRisk[];
  primaryFailurePoint: FailurePoint;
  secondaryFailurePoint: FailurePoint | null;
  pressureTypes: PressureType[];

  // ── Narrative outputs ─────────────────────────────────────────────────────────
  situationSummary: string;
  primaryTension: string | null;

  // ── Actionable outputs (from CRL, surfaced here) ─────────────────────────────
  viableMoves: ViableMove[];
  impossibleAdvice: string[];    // What the system will NOT recommend given constraints
  minimumViableNextMove: string;
  fallbackPath: string;
  whatMustNotBeDelayed: string[];
  escalationThreshold: string;
  evidenceNeeded: string[];

  // ── Confidence ────────────────────────────────────────────────────────────────
  confidence: "low" | "medium" | "high";
};

// ─── Obligation detector ──────────────────────────────────────────────────────

function detectObligation(lower: string, domain: DecisionDomain): ObligationLevel {
  if (
    domain === "compliance_statutory" ||
    (/\b(statutory|legal duty|legal obligation|filing obligation|tax obligation|must file|required by law|legally required|companies act|hmrc requirement|court order|tribunal order)\b/.test(lower) &&
     !/\bno (statutory|legal|regulatory) (obligation|duty|requirement)\b/.test(lower))
  ) return "statutory";

  if (
    domain === "legal_regulatory" ||
    /\b(regulatory requirement|compliance requirement|gdpr obligation|regulatory deadline|regulator|ofcom|fca|ico|data protection requirement)\b/.test(lower)
  ) return "regulatory";

  if (
    /\b(contract|sla|service level|agreement|deliverable|committed to|promised|contractual|under agreement|contract requires|breach)\b/.test(lower)
  ) return "contractual";

  if (
    /\b(expected to|should|ought to|committed|promised|told (them|him|her|us)|people expect|team expects)\b/.test(lower) &&
    !/\b(statutory|legal|regulatory|compliance)\b/.test(lower)
  ) return "informal";

  return "none";
}

// ─── Authority detector ───────────────────────────────────────────────────────

function detectAuthority(lower: string, signals: Set<ConstraintSignal>): AuthorityState {
  if (/\b(board (approved|has approved|sign.?off confirmed)|ceo (approved|has signed)|formally approved by|authority confirmed|signed off by|decision made by|mandate confirmed)\b/.test(lower)) {
    return "confirmed";
  }
  if (/\b(delegated to|delegated authority|acting on behalf|on behalf of|acting (ceo|cfo|director)|delegation)\b/.test(lower)) {
    return "delegated";
  }
  if (/\b(contested|competing (claim|authority)|two (people|teams|parties) (claim|believe)|dispute over who|authority dispute|both (want|claim))\b/.test(lower)) {
    return "contested";
  }
  if (signals.has("authority_unclear")) {
    return "unclear";
  }
  // No authority language at all in a high-stakes decision
  if (!/\b(approved|authorised|authorized|signed|authority|mandate|decision.?maker|responsible for deciding)\b/.test(lower)) {
    return "absent";
  }
  return "unclear";
}

// ─── Evidence detector ────────────────────────────────────────────────────────

function detectEvidence(lower: string): EvidenceState {
  const hasVerified =
    /\b(data shows|research confirms|analysis (shows|indicates|confirms)|study found|according to|evidence (shows|confirms|indicates)|benchmark|measured|tested|proven|validated|confirmed by)\b/.test(lower);

  const hasStale =
    /\b(last year.?s (data|report|analysis|figures)|old (report|data|analysis|research)|previous (year|quarter|period)|outdated|historic(al)? data|from \d{4} (data|figures|report)|hasn.?t been updated)\b/.test(lower);

  const hasAssumption =
    /\b(assume|assuming|believe|think|probably|likely|expect|hope|maybe|perhaps|should be|might be|could be|seems (like|to be)|i (think|believe|assume))\b/.test(lower);

  const hasEvidence =
    /\b(data|evidence|research|analysis|report|study|survey|benchmark|metrics|figures|numbers|statistics)\b/.test(lower);

  if (hasStale) return "stale";
  if (hasVerified) return hasAssumption ? "partial" : "verified";
  if (hasEvidence && !hasAssumption) return "partial";
  if (hasAssumption && !hasEvidence) return "assumed";
  if (!hasEvidence && !hasAssumption) return "absent";
  return "partial";
}

// ─── Consequence severity ─────────────────────────────────────────────────────

function detectConsequence(lower: string, crl: CRLResult): ConsequenceSeverity {
  const hasPenalty = crl.constraintSignals.includes("penalty_exposure");
  const hasDelay = crl.constraintSignals.includes("delay_compounds_harm");
  const hasIrreversible = crl.constraintSignals.includes("irreversible_window");
  const isHighDomain =
    crl.decisionType === "compliance_statutory" ||
    crl.decisionType === "legal_regulatory" ||
    crl.decisionType === "family_legal_admin";

  const hasMaterialAmount =
    /£[\d,]{4,}|€[\d,]{4,}|\$[\d,]{4,}|\d+[km]? (fine|penalty|cost|loss)|material (impact|loss|damage)|significant (loss|damage|exposure)/.test(lower);

  if ((hasPenalty && hasDelay) || (isHighDomain && hasIrreversible)) return "severe";
  if (hasPenalty || (isHighDomain && hasMaterialAmount)) return "high";
  if (hasDelay || hasMaterialAmount || crl.directive === "HIGH") return "moderate";
  return "low";
}

// ─── Reversibility ────────────────────────────────────────────────────────────

function detectReversibility(lower: string, crl: CRLResult): ReversibilityLevel {
  if (
    crl.constraintSignals.includes("irreversible_window") ||
    /\b(irreversible|can.?t undo|no going back|irrevocable|once (filed|submitted|signed|executed|committed)|final (decision|filing|submission)|can.?t reverse|point of no return)\b/.test(lower)
  ) return "irreversible";

  if (
    /\b(hard to (undo|reverse|change)|difficult to (undo|change|reverse)|costly (to reverse|to change)|expensive (to reverse|to change)|penalty (for|if) (changing|reversing)|contract (locks|binds))\b/.test(lower) ||
    crl.decisionType === "compliance_statutory" // Filed submissions can be amended but at cost
  ) return "difficult_to_reverse";

  if (
    /\b(can (change|reverse|amend|update) later|flexible|can be amended|can be revised|draft|provisional|not final)\b/.test(lower)
  ) return "freely_reversible";

  // Default for high-consequence domains
  if (
    crl.decisionType === "legal_regulatory" ||
    crl.decisionType === "family_legal_admin"
  ) return "difficult_to_reverse";

  return "costly_to_reverse";
}

// ─── Dependency detector ──────────────────────────────────────────────────────

function detectDependencies(lower: string, crl: CRLResult): string[] {
  const deps: string[] = [];

  if (/\b(waiting for|blocked by|depends on|need (x|y|them|it|him|her) (to|first)|can.?t proceed (until|without)|requires (sign.?off|approval|data|records|confirmation) (from|before)|pending (approval|sign.?off|review|data|records))\b/.test(lower)) {
    deps.push("Blocked dependency — something must happen before this can proceed");
  }
  if (/\b(third party|supplier|vendor|partner|external (party|team|agency|consultant)|contractor)\b/.test(lower)) {
    deps.push("External party dependency — relies on action from outside your control");
  }
  if (/\b(waiting for (legal|legal team|solicitor|lawyer|compliance|regulator)|legal (review|clearance) (pending|not|incomplete))\b/.test(lower)) {
    deps.push("Legal clearance dependency — legal review not confirmed complete");
  }
  if (crl.constraintSignals.includes("records_incomplete")) {
    deps.push("Records dependency — complete records required before this can proceed");
  }
  if (crl.constraintSignals.includes("authority_unclear")) {
    deps.push("Authority dependency — sign-off or mandate needed from a named party");
  }

  return deps;
}

// ─── Exposure detector ────────────────────────────────────────────────────────

function detectExposure(lower: string, crl: CRLResult): ExposureType[] {
  const exposures = new Set<ExposureType>();

  if (
    crl.decisionType === "legal_regulatory" ||
    crl.decisionType === "family_legal_admin" ||
    /\b(legal (risk|exposure|liability|claim|action)|lawsuit|litigation|breach|court|tribunal|regulatory (action|risk|exposure))\b/.test(lower)
  ) exposures.add("legal");

  if (
    crl.constraintSignals.includes("penalty_exposure") ||
    /\b(penalty|financial (loss|exposure|risk)|cost (overrun|escalation)|cash (flow|position) (risk|exposure)|monetary|revenue (at risk|loss|impact))\b/.test(lower) ||
    (/\bfine\b/.test(lower) && /\b(risk|avoid|pay|face|incur|owe|liable|charge|issue|receive|huge|large|significant|late|penalty|financial)\b/.test(lower))
  ) exposures.add("financial");

  if (
    /\b(reput(ation|ational)|brand (risk|damage|trust)|customer (trust|perception|confidence)|public (perception|trust|relations)|pr (risk|crisis)|press|media (risk|exposure))\b/.test(lower)
  ) exposures.add("reputational");

  if (
    /\b(operational (risk|impact|failure)|system (failure|outage|impact)|service (disruption|failure|impact)|production (incident|failure)|delivery (risk|failure|delay))\b/.test(lower) ||
    crl.decisionType === "product_release"
  ) exposures.add("operational");

  if (
    /\b(team (trust|confidence|morale)|partner (relationship|trust)|client (relationship|trust|retention)|stakeholder (confidence|trust)|investor (confidence|trust|relation))\b/.test(lower)
  ) exposures.add("relational");

  if (
    crl.decisionType === "family_legal_admin" ||
    /\b(personal (risk|exposure|consequence)|health|wellbeing|family (impact|consequence)|personal (financial|legal) (risk|exposure))\b/.test(lower)
  ) exposures.add("personal");

  return [...exposures];
}

// ─── Viability and continuity ─────────────────────────────────────────────────

function detectViabilityBlocked(crl: CRLResult): boolean {
  return (
    crl.actionFeasibility === "ideal_but_inaccessible" ||
    (crl.constraintSignals.includes("cash_constraint") &&
      crl.constraintSignals.includes("professional_help_unavailable"))
  );
}

function detectContinuityAtRisk(lower: string, crl: CRLResult): boolean {
  return (
    !/\b(document|record|track|note|log|written|confirmed (in writing|by email|by letter)|commit(ment|ted) (in|to) writing|minute|minutes of|formal record|official record)\b/.test(lower) &&
    (crl.directive === "ESCALATE" ||
      crl.directive === "CONSTRAINED_RESCUE" ||
      crl.directive === "HIGH")
  );
}

// ─── Build failure risks ──────────────────────────────────────────────────────

function buildFailureRisks(
  crl: CRLResult,
  obligations: ObligationLevel,
  authority: AuthorityState,
  evidence: EvidenceState,
  consequence: ConsequenceSeverity,
  reversibility: ReversibilityLevel,
  dependencies: string[],
  exposures: ExposureType[],
  viabilityBlocked: boolean,
  continuityAtRisk: boolean,
): FailureRisk[] {
  const risks: FailureRisk[] = [];

  // OBLIGATION_FAILURE
  if (obligations === "statutory") {
    risks.push({
      point: "OBLIGATION_FAILURE",
      severity: "CRITICAL",
      label: "Obligation / Statutory Duty",
      description: "A statutory or legal obligation is present and at risk. This is not optional — it is a legal duty with enforceable consequences.",
    });
  } else if (obligations === "regulatory") {
    risks.push({
      point: "OBLIGATION_FAILURE",
      severity: "HIGH",
      label: "Obligation / Regulatory Requirement",
      description: "A regulatory requirement is present. Non-compliance creates enforcement risk.",
    });
  } else if (obligations === "contractual" && crl.constraintSignals.includes("deadline_external")) {
    risks.push({
      point: "OBLIGATION_FAILURE",
      severity: "HIGH",
      label: "Obligation / Contractual Commitment",
      description: "A contractual commitment with an external deadline is at risk.",
    });
  }

  // AUTHORITY_FAILURE — severity depends on domain context
  const isLowStakesDomain = crl.decisionType === "personal_low_stakes" || crl.decisionType === "unclear";
  if (authority === "absent") {
    if (!isLowStakesDomain) {
      risks.push({
        point: "AUTHORITY_FAILURE",
        severity: "HIGH",
        label: "Authority / No Decision-Maker Named",
        description: "No decision-maker or authority has been identified. Without a named authority, this decision cannot be binding.",
      });
    } else {
      risks.push({
        point: "AUTHORITY_FAILURE",
        severity: "LOW",
        label: "Authority / No Decision-Maker Named",
        description: "No decision-maker was identified, but this may not require formal authority for the type of decision described.",
      });
    }
  } else if (authority === "unclear") {
    risks.push({
      point: "AUTHORITY_FAILURE",
      severity: isLowStakesDomain ? "LOW" : "MEDIUM",
      label: "Authority / Mandate Unclear",
      description: "The decision-maker has not been confirmed. Authority ambiguity creates reversal risk.",
    });
  } else if (authority === "contested") {
    risks.push({
      point: "AUTHORITY_FAILURE",
      severity: "HIGH",
      label: "Authority / Contested Mandate",
      description: "Multiple parties have competing claims to decision authority. This must be resolved before the decision can be binding.",
    });
  }

  // EVIDENCE_FAILURE — severity depends on domain context
  const isEvidenceSensitive = crl.decisionType !== "personal_low_stakes" && crl.decisionType !== "unclear";
  if (evidence === "absent") {
    risks.push({
      point: "EVIDENCE_FAILURE",
      severity: isEvidenceSensitive ? "HIGH" : "LOW",
      label: "Evidence / No Evidence Referenced",
      description: isEvidenceSensitive
        ? "No data, evidence, or analysis supports this decision. Decisions without evidence are highly vulnerable to reversal."
        : "No evidence was referenced, but this type of decision may not require formal evidence.",
    });
  } else if (evidence === "assumed") {
    risks.push({
      point: "EVIDENCE_FAILURE",
      severity: isEvidenceSensitive ? "MEDIUM" : "LOW",
      label: "Evidence / Assumption-Based",
      description: "The decision appears to rest on beliefs or assumptions rather than verified evidence. Each untested assumption is a reversal risk.",
    });
  } else if (evidence === "stale") {
    risks.push({
      point: "EVIDENCE_FAILURE",
      severity: "MEDIUM",
      label: "Evidence / Potentially Stale",
      description: "Evidence is referenced but may be out of date. Stale data supporting active commitments is a governance risk.",
    });
  }

  // CONSTRAINT_FAILURE
  const constraintCount = crl.constraintSignals.length;
  if (crl.directive === "CONSTRAINED_RESCUE") {
    risks.push({
      point: "CONSTRAINT_FAILURE",
      severity: "CRITICAL",
      label: "Constraint / Ideal Path Inaccessible",
      description: "The required resources, access, or professional support are not available. The ideal path cannot be followed — a viable rescue path is needed instead.",
    });
  } else if (constraintCount >= 3 || crl.constraintSignals.includes("cash_constraint")) {
    risks.push({
      point: "CONSTRAINT_FAILURE",
      severity: "HIGH",
      label: "Constraint / Multiple Constraints Active",
      description: `${constraintCount} constraint signal${constraintCount !== 1 ? "s" : ""} detected. Constraints limit the viable paths available and increase the risk of inaction or wrong action.`,
    });
  } else if (constraintCount >= 1) {
    risks.push({
      point: "CONSTRAINT_FAILURE",
      severity: "MEDIUM",
      label: "Constraint / Resource or Access Limitation",
      description: "At least one constraint is limiting what can be done. Ensure this is acknowledged in the decision record.",
    });
  }

  // CONSEQUENCE_FAILURE
  if (consequence === "severe") {
    risks.push({
      point: "CONSEQUENCE_FAILURE",
      severity: "CRITICAL",
      label: "Consequence / Severe Downside if Delayed or Wrong",
      description: "The consequence of inaction or an error is severe and may be irreversible. The cost of delay or wrong action materially exceeds the cost of intervention.",
    });
  } else if (consequence === "high") {
    risks.push({
      point: "CONSEQUENCE_FAILURE",
      severity: "HIGH",
      label: "Consequence / High-Impact Downside",
      description: "A significant consequence follows from delay or wrong action. This elevates the decision above routine governance.",
    });
  }

  // REVERSIBILITY_FAILURE
  if (reversibility === "irreversible") {
    risks.push({
      point: "REVERSIBILITY_FAILURE",
      severity: "CRITICAL",
      label: "Reversibility / Irrevocable Commitment",
      description: "This decision cannot be undone once committed. The irreversibility window demands higher certainty before proceeding.",
    });
  } else if (reversibility === "difficult_to_reverse") {
    risks.push({
      point: "REVERSIBILITY_FAILURE",
      severity: "HIGH",
      label: "Reversibility / Difficult to Reverse",
      description: "Reversing this decision would require significant cost or effort. Treat it as near-irreversible and require higher evidence standards.",
    });
  }

  // DEPENDENCY_FAILURE
  if (dependencies.length >= 2) {
    risks.push({
      point: "DEPENDENCY_FAILURE",
      severity: "HIGH",
      label: "Dependency / Multiple Unresolved Dependencies",
      description: `${dependencies.length} unresolved dependencies detected. These must be addressed before the decision can proceed.`,
    });
  } else if (dependencies.length === 1) {
    risks.push({
      point: "DEPENDENCY_FAILURE",
      severity: "MEDIUM",
      label: "Dependency / Unresolved Prerequisite",
      description: dependencies[0] ?? "A dependency exists that must be resolved before this decision can be executed.",
    });
  }

  // EXPOSURE_FAILURE
  if (exposures.length >= 2) {
    risks.push({
      point: "EXPOSURE_FAILURE",
      severity: "HIGH",
      label: `Exposure / ${exposures.slice(0, 2).map(e => e.charAt(0).toUpperCase() + e.slice(1)).join(" + ")}`,
      description: `${exposures.length} exposure type${exposures.length !== 1 ? "s" : ""} detected (${exposures.join(", ")}). The decision carries risk to parties beyond the immediate decision-maker.`,
    });
  } else if (exposures.length === 1) {
    risks.push({
      point: "EXPOSURE_FAILURE",
      severity: "MEDIUM",
      label: `Exposure / ${(exposures[0] ?? "Unknown").charAt(0).toUpperCase() + (exposures[0] ?? "unknown").slice(1)} Risk`,
      description: `${(exposures[0] ?? "Unknown")} exposure is present. This should be documented and acknowledged in the decision record.`,
    });
  }

  // VIABILITY_FAILURE
  if (viabilityBlocked) {
    risks.push({
      point: "VIABILITY_FAILURE",
      severity: "HIGH",
      label: "Viability / Ideal Path Inaccessible",
      description: "The standard recommended path (professional help, adequate time, full records) is not accessible under current constraints. A constrained viable path must be built instead.",
    });
  }

  // CONTINUITY_FAILURE
  if (continuityAtRisk) {
    risks.push({
      point: "CONTINUITY_FAILURE",
      severity: "MEDIUM",
      label: "Continuity / No Decision Record",
      description: "This decision is not being formally recorded. High-consequence decisions without records cannot be audited, verified, or built upon.",
    });
  }

  // Sort: CRITICAL first, then HIGH, MEDIUM, LOW
  const severityOrder: Record<FailureSeverity, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  return risks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

// ─── Primary failure point ────────────────────────────────────────────────────

function identifyPrimaryFailurePoint(
  risks: FailureRisk[],
  crl: CRLResult,
): FailurePoint {
  if (risks.length === 0) return "NO_CRITICAL_FAILURE";

  // CRITICAL takes priority
  const critical = risks.find(r => r.severity === "CRITICAL");
  if (critical) return critical.point;

  // HIGH takes priority over MEDIUM and LOW
  const high = risks.find(r => r.severity === "HIGH");
  if (high) return high.point;

  // MEDIUM takes priority over LOW
  const medium = risks.find(r => r.severity === "MEDIUM");
  if (medium) return medium.point;

  // All risks are LOW — return NO_CRITICAL_FAILURE
  return "NO_CRITICAL_FAILURE";
}

// ─── Viable moves ─────────────────────────────────────────────────────────────

function buildViableMoves(
  crl: CRLResult,
  primary: FailurePoint,
): ViableMove[] {
  const moves: ViableMove[] = [];
  const { decisionType, constraintSignals } = crl;
  const hasConstraint = constraintSignals.includes("cash_constraint") || constraintSignals.includes("professional_help_unavailable");

  if (primary === "OBLIGATION_FAILURE" || primary === "REVERSIBILITY_FAILURE") {
    moves.push({
      label: "Confirm exact obligation and deadline",
      description: "Identify the specific filing, response, or action required, and the precise deadline. Separate each obligation — they may have different deadlines and different consequences.",
      accessibility: "must_act_now",
      requiresFunds: false,
      priority: "urgent",
    });
  }

  if (primary === "AUTHORITY_FAILURE" || crl.constraintSignals.includes("authority_unclear")) {
    moves.push({
      label: "Identify and confirm the decision authority",
      description: "Name the specific person with mandate to make this decision binding. If authority is unclear, escalate to the next level with a one-page brief.",
      accessibility: "requires_authority",
      requiresFunds: false,
      priority: "urgent",
    });
  }

  if (primary === "EVIDENCE_FAILURE" || primary === "CONSTRAINT_FAILURE") {
    moves.push({
      label: "Build the minimum evidence pack",
      description: "Compile what is known, explicitly note what is assumed, and identify the one or two critical unknowns. A decision with documented assumptions is stronger than one with hidden ones.",
      accessibility: hasConstraint ? "possible_with_low_funds" : "requires_external_help",
      requiresFunds: false,
      priority: "important",
    });
  }

  if (hasConstraint) {
    const freeOptionLabel =
      decisionType === "compliance_statutory" ? "Contact HMRC, Citizens Advice, or ICAEW for free guidance" :
      decisionType === "legal_regulatory" || decisionType === "family_legal_admin" ? "Check legal aid eligibility; contact LawWorks or Citizens Advice" :
      "Seek a fixed-scope or free initial consultation for the specific question";

    moves.push({
      label: freeOptionLabel,
      description: "When ideal professional support is unaffordable, fixed-scope or free-advice routes address the specific question without requiring full engagement.",
      accessibility: "possible_with_low_funds",
      requiresFunds: false,
      priority: "urgent",
    });
  }

  if (primary === "DEPENDENCY_FAILURE") {
    moves.push({
      label: "Resolve the blocking dependency",
      description: "Identify the specific person, data, or action that is blocking this decision. Set a firm deadline for resolution and escalate if it is not met.",
      accessibility: "requires_external_help",
      requiresFunds: false,
      priority: "urgent",
    });
  }

  moves.push({
    label: "Document the decision and constraints",
    description: "Record the decision, the constraints, what was attempted, and the reasoning — regardless of whether the ideal path was available. This is the minimum continuity requirement.",
    accessibility: "possible_with_low_funds",
    requiresFunds: false,
    priority: "useful",
  });

  return moves.slice(0, 4);
}

// ─── Impossible advice ────────────────────────────────────────────────────────

function buildImpossibleAdvice(crl: CRLResult): string[] {
  const advice: string[] = [];

  if (crl.constraintSignals.includes("cash_constraint") && crl.constraintSignals.includes("professional_help_unavailable")) {
    advice.push("Recommend only paid professional help — without a free or fixed-scope alternative");
  }
  if (crl.constraintSignals.includes("records_incomplete") && crl.constraintSignals.includes("deadline_external")) {
    advice.push("Suggest completing records fully before acting — deadline does not allow it");
  }
  if (crl.constraintSignals.includes("capability_gap") && crl.constraintSignals.includes("deadline_external")) {
    advice.push("Suggest self-completing a complex process without any external check");
  }
  if (crl.constraintSignals.includes("authority_unclear")) {
    advice.push("Proceed as if authority is confirmed — it is not");
  }
  if (crl.directive === "CONSTRAINED_RESCUE" || crl.directive === "ESCALATE") {
    advice.push("Return LOW RISK — external obligation and consequence signals are present");
  }

  return advice;
}

// ─── Confidence ───────────────────────────────────────────────────────────────

function computeConfidence(lower: string, crl: CRLResult): "low" | "medium" | "high" {
  const wordCount = lower.split(/\s+/).filter(Boolean).length;
  const hasDeadline = crl.constraintSignals.includes("deadline_external") || crl.constraintSignals.includes("deadline_self_imposed");
  const hasDomain = crl.decisionType !== "unclear";
  const hasPressure = crl.pressureTypes.length > 0;

  if (wordCount >= 40 && hasDomain && hasDeadline) return "high";
  if (wordCount >= 20 && (hasDomain || hasPressure)) return "medium";
  return "low";
}

// ─── Situation summary ────────────────────────────────────────────────────────

function buildSituationSummary(
  primary: FailurePoint,
  secondary: FailurePoint | null,
  crl: CRLResult,
): string {
  if (primary === "NO_CRITICAL_FAILURE") {
    return crl.situationSummary;
  }

  const failureLabels: Partial<Record<FailurePoint, string>> = {
    OBLIGATION_FAILURE: "obligation",
    AUTHORITY_FAILURE: "authority",
    EVIDENCE_FAILURE: "evidence",
    CONSTRAINT_FAILURE: "constraint",
    CONSEQUENCE_FAILURE: "consequence",
    REVERSIBILITY_FAILURE: "reversibility",
    DEPENDENCY_FAILURE: "dependency",
    EXPOSURE_FAILURE: "exposure",
    VIABILITY_FAILURE: "viability",
    CONTINUITY_FAILURE: "continuity",
  };

  const primaryLabel = failureLabels[primary] ?? "unknown";
  const secondaryLabel = secondary ? failureLabels[secondary] : null;

  const failurePhrase = secondaryLabel
    ? `most likely to fail at ${primaryLabel} and ${secondaryLabel}`
    : `most likely to fail at ${primaryLabel}`;

  const directivePhrase =
    crl.directive === "CONSTRAINED_RESCUE" ? "The available options are constrained, but a viable rescue path exists." :
    crl.directive === "ESCALATE" ? "Immediate escalation is required." :
    crl.directive === "HIGH" ? "This decision carries significant risk." :
    crl.directive === "MODERATE" ? "This decision has addressable gaps." :
    "This decision appears structurally sound.";

  return `This decision is ${failurePhrase}. ${directivePhrase}`;
}

// ─── Main analyser ────────────────────────────────────────────────────────────

export function analyzeDecisionFailureMap(text: string): DecisionFailureMapResult {
  const lower = text.toLowerCase();

  // Step 1: Run the Constraint Reality Layer
  const crl = analyzeConstraintReality(text);

  // Step 2: Add the remaining failure dimensions
  const obligations = detectObligation(lower, crl.decisionType);
  const authority = detectAuthority(lower, new Set(crl.constraintSignals));
  const evidence = detectEvidence(lower);
  const consequence = detectConsequence(lower, crl);
  const reversibility = detectReversibility(lower, crl);
  const dependencies = detectDependencies(lower, crl);
  const exposures = detectExposure(lower, crl);
  const viabilityBlocked = detectViabilityBlocked(crl);
  const continuityAtRisk = detectContinuityAtRisk(lower, crl);

  // Step 3: Build failure risks
  const failureRisks = buildFailureRisks(
    crl, obligations, authority, evidence, consequence,
    reversibility, dependencies, exposures, viabilityBlocked, continuityAtRisk,
  );

  // Step 4: Primary and secondary failure points
  const primaryFailurePoint = identifyPrimaryFailurePoint(failureRisks, crl);
  const secondaryFailurePoint =
    failureRisks.length > 1 && failureRisks[1]?.point !== primaryFailurePoint
      ? (failureRisks[1]?.point ?? null)
      : null;

  // Step 5: Actionable outputs
  const viableMoves = buildViableMoves(crl, primaryFailurePoint);
  const impossibleAdvice = buildImpossibleAdvice(crl);
  const confidence = computeConfidence(lower, crl);

  return {
    // Identity
    decisionType: crl.decisionType,
    directive: crl.directive,
    score: crl.score,

    // 10 dimensions
    obligations,
    authorityState: authority,
    evidenceState: evidence,
    constraintSignals: crl.constraintSignals,
    consequenceSeverity: consequence,
    reversibility,
    dependencyRisks: dependencies,
    exposureTypes: exposures,
    viabilityBlocked,
    continuityAtRisk,

    // Failure architecture
    failureRisks,
    primaryFailurePoint,
    secondaryFailurePoint,
    pressureTypes: crl.pressureTypes,

    // Narrative
    situationSummary: buildSituationSummary(primaryFailurePoint, secondaryFailurePoint, crl),
    primaryTension: crl.primaryTension,

    // Actionable
    viableMoves,
    impossibleAdvice,
    minimumViableNextMove: crl.minimumViableNextMove,
    fallbackPath: crl.fallback,
    whatMustNotBeDelayed: crl.mustNotDelay,
    escalationThreshold: crl.escalationThreshold,
    evidenceNeeded: crl.evidenceNeeded,
    confidence,
  };
}
