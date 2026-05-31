/**
 * lib/intelligence/decision-class-taxonomy.ts
 *
 * Decision Class Taxonomy — the stable, finite, commercially useful
 * classification of decision types.
 *
 * Each class defines:
 *   - mandatoryLenses       lenses the kernel must run
 *   - optionalLenses        lenses the kernel may run based on signals
 *   - adversarialVectors    how hostile reviewers attack this class
 *   - regulatedBoundaryTriggers   when to surface regulated advice warning
 *   - defaultTier           default disclosure tier before buyer upgrade
 *   - humanReviewThreshold  conditions that force human review queue
 *   - forbiddenClaims       statements the system must never output
 *   - qualityChecks         assertions the kernel must pass before delivery
 *
 * This taxonomy prevents the kernel from improvising like a chatbot.
 */

// ─── Core type ────────────────────────────────────────────────────────────────

export type DecisionClass =
  | "COMPLIANCE_AND_FILING"       // Tax, statutory accounts, regulatory filings
  | "GOVERNANCE_AND_BOARD"        // Board decisions, fiduciary duty, mandate
  | "COMMERCIAL_AND_MARKET"       // Claims, positioning, offers, buyer proof
  | "OPERATIONAL_AND_EXECUTION"   // Releases, deployments, operational commitments
  | "STRATEGIC_AND_POSITIONING"   // Market entry, repositioning, strategic bets
  | "REPUTATIONAL_AND_EXPOSURE"   // PR, brand risk, public statement, crisis
  | "FINANCIAL_AND_CAPITAL"       // Investment, funding, debt, capital allocation
  | "LEGAL_AND_CONTRACTUAL"       // Disputes, contracts, court, regulation
  | "PEOPLE_AND_AUTHORITY"        // Hiring, firing, delegation, succession
  | "TECHNOLOGY_AND_DEPENDENCY"   // Vendor lock, migration, system dependency
  | "CONTINUITY_AND_TRANSITION"   // Succession, handover, wind-down, pivot
  | "LOW_STAKES_PREFERENCE";      // Preference, scheduling, low-consequence choice

export type LensId =
  | "CONSTRAINT_REALITY"
  | "FAILURE_MODE"
  | "AUTHORITY"
  | "OBLIGATION"
  | "EVIDENCE"
  | "ADVERSARIAL"
  | "MARKET_CLAIM"
  | "RELEASE_RISK"
  | "CONTINUITY"
  | "REGULATED_BOUNDARY";

export type DisclosureTier =
  | "FREE_SIGNAL"
  | "BASIC_BRIEF"
  | "FULL_DOSSIER"
  | "URGENT_OPERATIONAL"
  | "EXECUTIVE_BOARD"
  | "RETAINED_CONTINUITY";

export type HumanReviewCondition =
  | "board_or_fiduciary_exposure"
  | "regulated_boundary_hit"
  | "penalty_exposure_over_threshold"
  | "active_reputational_crisis"
  | "legal_dispute_active"
  | "investment_or_financial_promotion_risk"
  | "continuity_or_transition_case"
  | "executive_board_tier"
  | "low_confidence_on_authority"
  | "low_confidence_on_obligation"
  | "low_confidence_on_constraint"
  | "kernel_contradiction_high_or_critical"
  | "founder_review_requested";

export type DecisionClassConfig = {
  mandatoryLenses: LensId[];
  optionalLenses: LensId[];
  adversarialVectors: string[];
  regulatedBoundaryTriggers: string[];
  defaultTier: DisclosureTier;
  humanReviewThreshold: HumanReviewCondition[];
  forbiddenClaims: string[];
  qualityChecks: string[];
};

// ─── Class configurations ─────────────────────────────────────────────────────

export const DECISION_CLASS_CONFIGS: Record<DecisionClass, DecisionClassConfig> = {

  COMPLIANCE_AND_FILING: {
    mandatoryLenses: ["CONSTRAINT_REALITY", "OBLIGATION", "FAILURE_MODE", "REGULATED_BOUNDARY"],
    optionalLenses: ["EVIDENCE", "CONTINUITY"],
    adversarialVectors: [
      "Was the obligation confirmed or assumed?",
      "Is the deadline statutory or self-imposed?",
      "Was a provisional filing treated as a completed obligation?",
      "Was professional advice avoided due to cost, not absence of risk?",
      "Is the turnover/profit relationship accurately represented?",
    ],
    regulatedBoundaryTriggers: [
      "tax advice",
      "liability calculation",
      "specific HMRC interpretation",
      "Companies House specific advice",
      "penalty calculation",
      "VAT advice",
      "CT600 specific guidance",
    ],
    defaultTier: "FREE_SIGNAL",
    humanReviewThreshold: [
      "regulated_boundary_hit",
      "penalty_exposure_over_threshold",
      "low_confidence_on_obligation",
    ],
    forbiddenClaims: [
      "You do not need to file",
      "This penalty will not apply to you",
      "HMRC will grant an extension",
      "The turnover threshold does not apply",
      "Your accounts do not require professional preparation",
    ],
    qualityChecks: [
      "obligation_state_not_none",
      "deadline_detected_or_flagged_absent",
      "constraint_graph_not_empty_when_constrained_rescue",
      "regulated_boundary_surfaced",
      "minimum_viable_path_includes_free_options_when_cash_constrained",
    ],
  },

  GOVERNANCE_AND_BOARD: {
    mandatoryLenses: ["AUTHORITY", "OBLIGATION", "FAILURE_MODE", "ADVERSARIAL"],
    optionalLenses: ["EVIDENCE", "CONTINUITY", "CONSTRAINT_REALITY"],
    adversarialVectors: [
      "Does the decision-maker have formal board mandate or informal authority?",
      "Were all directors notified before the vote?",
      "Is there a conflict of interest undisclosed?",
      "Was the decision ratified or just made by one person?",
      "Can the board minutes be produced?",
    ],
    regulatedBoundaryTriggers: [
      "fiduciary duty advice",
      "Companies Act compliance",
      "director liability",
      "shareholder rights specific advice",
      "regulatory approval specific guidance",
    ],
    defaultTier: "BASIC_BRIEF",
    humanReviewThreshold: [
      "board_or_fiduciary_exposure",
      "regulated_boundary_hit",
      "kernel_contradiction_high_or_critical",
      "executive_board_tier",
    ],
    forbiddenClaims: [
      "The board approval is sufficient",
      "This decision does not require board ratification",
      "Director liability does not apply",
    ],
    qualityChecks: [
      "authority_state_not_absent",
      "adversarial_challenge_present",
      "obligation_state_confirmed_or_flagged",
    ],
  },

  COMMERCIAL_AND_MARKET: {
    mandatoryLenses: ["MARKET_CLAIM", "EVIDENCE", "ADVERSARIAL"],
    optionalLenses: ["REGULATED_BOUNDARY", "FAILURE_MODE"],
    adversarialVectors: [
      "Can every claim in the statement be evidenced under challenge?",
      "Would an informed buyer believe this without qualification?",
      "Is the comparison set defined for any comparative claim?",
      "Has a lawyer reviewed the guarantee language?",
      "Is there buyer validation beyond internal belief?",
    ],
    regulatedBoundaryTriggers: [
      "financial promotion",
      "investment return claims",
      "medical claims",
      "legal guarantee",
      "consumer protection",
      "advertising standards",
      "FCA regulated claim",
    ],
    defaultTier: "FREE_SIGNAL",
    humanReviewThreshold: [
      "regulated_boundary_hit",
      "investment_or_financial_promotion_risk",
    ],
    forbiddenClaims: [
      "This claim is legally safe",
      "No buyer will challenge this",
      "This guarantee is enforceable",
      "The superlative is accurate",
    ],
    qualityChecks: [
      "evidence_state_not_absent",
      "overclaim_count_surfaced",
      "buyer_validation_state_assessed",
      "legal_exposure_signals_checked",
    ],
  },

  OPERATIONAL_AND_EXECUTION: {
    mandatoryLenses: ["RELEASE_RISK", "FAILURE_MODE", "CONSTRAINT_REALITY"],
    optionalLenses: ["AUTHORITY", "EVIDENCE", "CONTINUITY"],
    adversarialVectors: [
      "Who approved this release and when was that recorded?",
      "What is the rollback path and who owns it?",
      "What is the revenue or customer exposure if this fails?",
      "Has the testing evidence been independently reviewed?",
      "Is the deployment date driven by readiness or by a commercial commitment?",
    ],
    regulatedBoundaryTriggers: [
      "regulated system deployment",
      "financial system release",
      "health system release",
      "data protection compliance",
    ],
    defaultTier: "FREE_SIGNAL",
    humanReviewThreshold: [
      "regulated_boundary_hit",
      "kernel_contradiction_high_or_critical",
    ],
    forbiddenClaims: [
      "This release is safe",
      "The risk is acceptable",
      "Rollback is simple",
    ],
    qualityChecks: [
      "approval_state_detected_or_flagged",
      "rollback_state_detected_or_flagged",
      "monitoring_state_detected_or_flagged",
      "directive_not_proceed_when_blockers_present",
    ],
  },

  STRATEGIC_AND_POSITIONING: {
    mandatoryLenses: ["FAILURE_MODE", "EVIDENCE", "ADVERSARIAL"],
    optionalLenses: ["MARKET_CLAIM", "AUTHORITY", "CONTINUITY"],
    adversarialVectors: [
      "What evidence supports the market assumption this strategy depends on?",
      "Who has approved this direction and on what mandate?",
      "What is the cost of being wrong — is it reversible?",
      "What are the strongest arguments against this strategy?",
      "Is the competitive landscape accurately represented?",
    ],
    regulatedBoundaryTriggers: [
      "investment advice",
      "market abuse",
      "financial promotion",
      "competition law",
    ],
    defaultTier: "BASIC_BRIEF",
    humanReviewThreshold: [
      "executive_board_tier",
      "investment_or_financial_promotion_risk",
    ],
    forbiddenClaims: [
      "This strategy will succeed",
      "The market opportunity is confirmed",
      "The competitive moat is durable",
    ],
    qualityChecks: [
      "adversarial_challenge_present",
      "evidence_state_assessed",
      "reversibility_assessed",
    ],
  },

  REPUTATIONAL_AND_EXPOSURE: {
    mandatoryLenses: ["FAILURE_MODE", "ADVERSARIAL", "REGULATED_BOUNDARY"],
    optionalLenses: ["EVIDENCE", "AUTHORITY", "CONTINUITY"],
    adversarialVectors: [
      "What is the worst-case public interpretation of this action?",
      "Who holds accountability if this escalates?",
      "Has legal reviewed the public statement?",
      "Are all affected parties identified?",
      "Is the response timeline defensible?",
    ],
    regulatedBoundaryTriggers: [
      "legal statement advice",
      "defamation risk",
      "regulatory disclosure",
      "media injunction",
    ],
    defaultTier: "BASIC_BRIEF",
    humanReviewThreshold: [
      "active_reputational_crisis",
      "legal_dispute_active",
      "regulated_boundary_hit",
    ],
    forbiddenClaims: [
      "This statement will not be challenged",
      "The reputational risk is low",
      "Media will not cover this",
    ],
    qualityChecks: [
      "adversarial_challenge_present",
      "authority_state_confirmed_or_flagged",
      "regulated_boundary_checked",
    ],
  },

  FINANCIAL_AND_CAPITAL: {
    mandatoryLenses: ["CONSTRAINT_REALITY", "FAILURE_MODE", "REGULATED_BOUNDARY"],
    optionalLenses: ["EVIDENCE", "ADVERSARIAL", "AUTHORITY"],
    adversarialVectors: [
      "What is the return assumption and how was it derived?",
      "Who approved this capital commitment and on what mandate?",
      "Is the downside scenario modelled?",
      "Are all covenants and conditions documented?",
      "Can this decision be reversed if conditions change?",
    ],
    regulatedBoundaryTriggers: [
      "investment advice",
      "financial promotion",
      "FCA regulated advice",
      "prospectus requirement",
      "insider trading adjacent",
    ],
    defaultTier: "BASIC_BRIEF",
    humanReviewThreshold: [
      "investment_or_financial_promotion_risk",
      "regulated_boundary_hit",
      "executive_board_tier",
    ],
    forbiddenClaims: [
      "This investment is safe",
      "The return is guaranteed",
      "This does not constitute financial advice",
    ],
    qualityChecks: [
      "regulated_boundary_surfaced_if_investment_present",
      "authority_state_assessed",
      "reversibility_assessed",
    ],
  },

  LEGAL_AND_CONTRACTUAL: {
    mandatoryLenses: ["OBLIGATION", "FAILURE_MODE", "REGULATED_BOUNDARY"],
    optionalLenses: ["CONSTRAINT_REALITY", "AUTHORITY", "EVIDENCE"],
    adversarialVectors: [
      "What is the legal position if this is challenged?",
      "Has qualified legal advice been obtained?",
      "Is the limitation period correct?",
      "Are all parties to the contract identified?",
      "What is the cost of litigation vs settlement?",
    ],
    regulatedBoundaryTriggers: [
      "legal advice",
      "solicitor advice",
      "court proceedings",
      "contract interpretation",
      "legal liability",
      "settlement advice",
    ],
    defaultTier: "BASIC_BRIEF",
    humanReviewThreshold: [
      "legal_dispute_active",
      "regulated_boundary_hit",
      "penalty_exposure_over_threshold",
    ],
    forbiddenClaims: [
      "You have a strong legal case",
      "This contract is enforceable",
      "You will win this dispute",
      "The limitation period has not passed",
    ],
    qualityChecks: [
      "regulated_boundary_surfaced",
      "obligation_state_confirmed",
      "free_path_provided_when_cash_constrained",
    ],
  },

  PEOPLE_AND_AUTHORITY: {
    mandatoryLenses: ["AUTHORITY", "FAILURE_MODE"],
    optionalLenses: ["OBLIGATION", "EVIDENCE", "CONTINUITY"],
    adversarialVectors: [
      "Who authorised this people decision and is that mandate documented?",
      "Are all employment law requirements met?",
      "Is this decision consistent with existing authority structures?",
      "What is the impact on remaining team members?",
      "Is there a documented performance record supporting this decision?",
    ],
    regulatedBoundaryTriggers: [
      "employment law specific advice",
      "TUPE advice",
      "discrimination claim risk",
      "settlement agreement advice",
    ],
    defaultTier: "BASIC_BRIEF",
    humanReviewThreshold: [
      "regulated_boundary_hit",
      "legal_dispute_active",
    ],
    forbiddenClaims: [
      "This dismissal is legally safe",
      "No employment claim will result",
      "The role is not protected",
    ],
    qualityChecks: [
      "authority_state_confirmed_or_flagged",
      "regulated_boundary_checked",
    ],
  },

  TECHNOLOGY_AND_DEPENDENCY: {
    mandatoryLenses: ["FAILURE_MODE", "CONSTRAINT_REALITY"],
    optionalLenses: ["RELEASE_RISK", "EVIDENCE", "CONTINUITY"],
    adversarialVectors: [
      "What happens to existing operations if this vendor or system fails?",
      "Is there a tested exit path from this dependency?",
      "Who approved this technical dependency and is that documented?",
      "What is the blast radius of failure?",
      "Is the migration path reversible?",
    ],
    regulatedBoundaryTriggers: [
      "data protection dependency",
      "regulated system dependency",
      "critical national infrastructure",
    ],
    defaultTier: "FREE_SIGNAL",
    humanReviewThreshold: [
      "regulated_boundary_hit",
      "kernel_contradiction_high_or_critical",
    ],
    forbiddenClaims: [
      "This vendor is reliable",
      "The migration is low-risk",
      "The dependency is manageable",
    ],
    qualityChecks: [
      "dependency_risks_surfaced",
      "reversibility_assessed",
    ],
  },

  CONTINUITY_AND_TRANSITION: {
    mandatoryLenses: ["CONTINUITY", "AUTHORITY", "FAILURE_MODE"],
    optionalLenses: ["OBLIGATION", "EVIDENCE"],
    adversarialVectors: [
      "What institutional knowledge is at risk of being lost?",
      "Are all handover obligations documented?",
      "Who carries accountability after the transition?",
      "Is there a verified continuity record?",
      "What decisions will become ungoverned after the transition?",
    ],
    regulatedBoundaryTriggers: [
      "fiduciary handover obligation",
      "director resignation requirements",
      "regulated handover requirements",
    ],
    defaultTier: "BASIC_BRIEF",
    humanReviewThreshold: [
      "continuity_or_transition_case",
      "board_or_fiduciary_exposure",
    ],
    forbiddenClaims: [
      "The transition is complete",
      "Continuity is maintained",
      "The handover is sufficient",
    ],
    qualityChecks: [
      "continuity_record_surfaced",
      "authority_state_post_transition_confirmed",
    ],
  },

  LOW_STAKES_PREFERENCE: {
    mandatoryLenses: [],
    optionalLenses: ["FAILURE_MODE"],
    adversarialVectors: [
      "Is this actually low-stakes, or is it misclassified?",
      "Does this decision have hidden dependencies?",
    ],
    regulatedBoundaryTriggers: [],
    defaultTier: "FREE_SIGNAL",
    humanReviewThreshold: [],
    forbiddenClaims: [
      "This decision has no consequences",
    ],
    qualityChecks: [
      "stakes_confirmed_low_before_low_classification",
    ],
  },

};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getClassConfig(cls: DecisionClass): DecisionClassConfig {
  return DECISION_CLASS_CONFIGS[cls];
}

export function getMandatoryLenses(cls: DecisionClass): LensId[] {
  return DECISION_CLASS_CONFIGS[cls].mandatoryLenses;
}

export function requiresHumanReview(
  cls: DecisionClass,
  conditions: HumanReviewCondition[],
): boolean {
  const threshold = DECISION_CLASS_CONFIGS[cls].humanReviewThreshold;
  return conditions.some(c => threshold.includes(c));
}

export function getForbiddenClaims(cls: DecisionClass): string[] {
  return DECISION_CLASS_CONFIGS[cls].forbiddenClaims;
}
