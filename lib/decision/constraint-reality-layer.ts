/**
 * lib/decision/constraint-reality-layer.ts
 *
 * Constraint Reality Layer — the core decision triage engine.
 *
 * Classifies a free-text decision description into:
 *   - decision domain
 *   - active constraint signals
 *   - pressure types
 *   - directive (LOW / MODERATE / HIGH / ESCALATE / CONSTRAINED_RESCUE)
 *
 * Then builds a 9-point output that answers:
 *   1. What kind of decision is this?
 *   2. What pressure is acting on it?
 *   3. What is the downside if delayed?
 *   4. What is impossible for the user?
 *   5. What is the cheapest viable next move?
 *   6. What must not be delayed?
 *
 * PRODUCT RULE:
 *   LOW is only returned when there is no external obligation, no hard
 *   deadline, no penalty exposure, no irreversible consequence, no obvious
 *   capability gap, and no resource impossibility.
 *   If uncertain, MODERATE is returned, never false LOW.
 *
 * GUARDRAILS:
 *   - Does not provide tax, legal, financial, or medical advice.
 *   - Does not calculate liabilities or penalties.
 *   - Does not claim certainty about outcomes.
 *   - Does not recommend only paid professional help without a low-resource fallback.
 *   - Does not return LOW when external obligation risk is present.
 *
 * Pure TypeScript — no imports, no side effects, safe for browser use.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type DecisionDomain =
  | "compliance_statutory"
  | "financial_exposure"
  | "legal_regulatory"
  | "deadline_bound"
  | "product_release"
  | "market_claim"
  | "board_sensitive"
  | "family_legal_admin"
  | "operational_dependency"
  | "personal_low_stakes"
  | "unclear";

export type ConstraintSignal =
  | "cash_constraint"
  | "capability_gap"
  | "professional_help_unavailable"
  | "records_incomplete"
  | "authority_unclear"
  | "deadline_external"
  | "deadline_self_imposed"
  | "penalty_exposure"
  | "wrong_action_exposure"
  | "delay_compounds_harm"
  | "irreversible_window"
  | "emotional_overload";

export type PressureType =
  | "statutory_deadline"
  | "commercial_pressure"
  | "cashflow_pressure"
  | "reputational_pressure"
  | "governance_pressure"
  | "legal_pressure"
  | "family_pressure"
  | "operational_pressure";

export type ActionFeasibility =
  | "ideal_but_inaccessible"
  | "possible_with_low_funds"
  | "requires_external_help"
  | "requires_authority"
  | "requires_records"
  | "requires_delay"
  | "must_act_now";

export type RiskDirective =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "ESCALATE"
  | "CONSTRAINED_RESCUE";

export type CRLFinding = {
  label: string;
  detail: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
};

export type CRLResult = {
  // 1. Classification
  decisionType: DecisionDomain;
  constraintSignals: ConstraintSignal[];
  pressureTypes: PressureType[];

  // 2. Directive + score
  directive: RiskDirective;
  score: number; // 0–100 for display

  // 3–9. Structured output
  situationSummary: string;
  primaryTension: string | null;
  downsideOfDelay: string;
  downsideOfWrongAction: string;
  minimumViableNextMove: string;
  fallback: string;
  evidenceNeeded: string[];
  mustNotDelay: string[];
  escalationThreshold: string;

  // Findings for display
  findings: CRLFinding[];

  // Feasibility label
  actionFeasibility: ActionFeasibility;
};

// ─── Domain classifier ────────────────────────────────────────────────────────

function classifyDecisionType(lower: string): DecisionDomain {
  // 1. Compliance / statutory filing (highest specificity)
  if (
    /\b(tax|taxes|hmrc|vat|ct600|corporation tax|self.?assessment|companies house|statutory accounts|annual accounts|annual return|confirmation statement|payroll|paye|national insurance|ni contribution|irs|ato|cra|inland revenue|tax return|tax filing|file accounts|file tax|submit accounts|submit return)\b/.test(lower) ||
    (/\b(filing|file|submit)\b/.test(lower) && /\b(accounts|return|tax|hmrc|companies house|vat)\b/.test(lower))
  ) return "compliance_statutory";

  // 2. Legal / regulatory (non-tax) — includes disputes and general legal issues
  // Exclude negated patterns like "no legal obligation" which indicate absence of legal duty
  if (
    (/\b(lawsuit|litigation|court|tribunal|gdpr|data protection|regulatory approval|fca|ico|ofcom|planning permission|contract dispute|breach of contract|legal obligation|terms of service|intellectual property|patent|trademark|employment law|unfair dismissal|redundancy|legal dispute|legal issue|legal problem|legal matter|legal claim|legal action|legal proceeding|dispute resolution|arbitration)\b/.test(lower) ||
    (/\b(legal|law|lawyer|solicitor|barrister|attorney)\b/.test(lower) && /\b(dispute|issue|problem|matter|advice|help|question)\b/.test(lower))) &&
    !/\bno (legal|statutory|regulatory) (obligation|duty|requirement|need)\b/.test(lower)
  ) return "legal_regulatory";

  // 3. Family / personal legal
  // Note: "will" is excluded as a standalone word because it's too common ("no one will be harmed").
  // Use "last will" or "will and testament" for estate-specific detection.
  if (
    /\b(divorce|custody|probate|estate|inheritance|family court|child support|alimony|separation agreement|power of attorney|guardianship|adoption|last will|will and testament)\b/.test(lower)
  ) return "family_legal_admin";

  // 4. Board / executive authority decisions
  if (
    /\b(board (approval|decision|meeting|sign.?off|vote|needs|wants|members|directors|level|room)|shareholder (approval|vote|meeting)|executive (approval|committee|team)|c.?suite|board of directors|trustee (approval|decision)|committee approval|the board (is|has|will|must|needs|wants|expects|pressures|pushes|considers|discusses|debates|deliberates))\b/.test(lower)
  ) return "board_sensitive";

  // 5. Product / release
  if (
    /\b(release|deploy|deployment|launch|ship|go.?live|production (deploy|release)|feature flag|rollback plan|staging|pull request|ci.?cd)\b/.test(lower)
  ) return "product_release";

  // 6. Market / positioning claim
  if (
    /\b(market claim|positioning|messaging|value proposition|marketing copy|ad claim|brand statement|product claim|pricing strategy|competitive positioning)\b/.test(lower)
  ) return "market_claim";

  // 7. Financial exposure (without statutory filing)
  // Note: "fine" as a standalone word is intentionally excluded to avoid matching
  // "everyone seems fine with this" as financial exposure.
  if (
    /\b(investment decision|funding round|loan|debt|refinanc|equity|acquisition|merger|financial commitment|capital expenditure|capex)\b/.test(lower) ||
    (/\b(huge fine|large fine|serious penalty|significant penalty|surcharge|financial penalty|monetary penalty)\b/.test(lower) && !/ tax|filing/.test(lower))
  ) return "financial_exposure";

  // 8. Operational dependency
  if (
    /\b(vendor (lock|dependency|contract)|supplier (change|failure|risk)|system (migration|replacement|outage)|operational (continuity|risk|dependency)|critical (path|dependency|supplier))\b/.test(lower)
  ) return "operational_dependency";

  // 9. Has a deadline but domain is unclear
  // Exclude negated patterns like "no deadline"
  if (
    /\b(deadline|by \w+ \d{4}|due date|expir|time limit|must decide|must act|by end of)\b/.test(lower) &&
    !/\bno (deadline|due date|time limit|hurry|rush|urgency)\b/.test(lower)
  ) return "deadline_bound";

  // 10. Personal / low stakes — preference or administrative decisions with no consequence signals
  // Exclude negated patterns: "no legal obligation" should not block low-stakes classification
  if (
    /\b(prefer|favourite|which one|should (i|we) (choose|pick|go with|move|change|switch|reschedule|rename)|best option|what do you think|opinion|recommendation for me|which (day|time|date|option|approach))\b/.test(lower) &&
    !/\b(penalty|deadline|compliance|statutory|court|fine|risk|exposure|liability)\b/.test(lower) &&
    !(/\b(obligation|legal)\b/.test(lower) && !/\bno (legal |statutory |regulatory )?obligation\b/.test(lower))
  ) return "personal_low_stakes";

  return "unclear";
}

// ─── Constraint signal detector ───────────────────────────────────────────────

function detectConstraintSignals(lower: string): Set<ConstraintSignal> {
  const signals = new Set<ConstraintSignal>();

  // Cash constraint
  if (
    /\b(no funds|no money|no budget|can.?t afford|cannot afford|limited funds|limited budget|no cash|financially constrained|not enough money|tight budget|low funds|have no funds|has no funds|don.?t have (the )?funds|do not have (the )?funds|funds (are|is) (not |un)?available|can.?t pay for)\b/.test(lower) ||
    /\b(cost(s)? (too much|is a problem|is prohibitive))\b/.test(lower)
  ) signals.add("cash_constraint");

  // Capability gap
  if (
    /\b(no accountant|no (tax |legal |financial |professional )?(advisor|adviser|expert|specialist|help)|don.?t (know|understand) how|not sure how|complicated|complex accounts|no expertise|out of (my |our )?(depth|expertise)|not qualified|not trained|no experience (with|in))\b/.test(lower)
  ) signals.add("capability_gap");

  // Professional help unavailable (explicit or implied by cash + capability)
  if (
    /\b(can.?t (get|find|afford) (a |an )?(lawyer|accountant|solicitor|tax (advisor|adviser)|consultant|expert|professional)|no professional (help|support|advice) available|professional help (is )?not (available|accessible|affordable))\b/.test(lower)
  ) {
    signals.add("professional_help_unavailable");
  } else if (signals.has("cash_constraint") && signals.has("capability_gap")) {
    signals.add("professional_help_unavailable");
  }

  // Records incomplete — includes standalone "placeholder" or "provisional" as signals
  if (
    /\b(missing records|no records|can.?t find|incomplete (records|accounts|documentation|documents|files)|records (not |are )?complete|placeholder|provisional (filing|return|submission|return|accounts)|estimated (filing|return)|no (receipts|invoices|statements)|lost (records|documents|files)|submitted a placeholder|filed a placeholder|provisional filing|provisional return|provisional accounts)\b/.test(lower)
  ) signals.add("records_incomplete");

  // Authority unclear — use two-step detection to handle intervening words
  const hasApprovalConfirmed = /\b(approved|authorised|authorized|signed off|has authority|decision.?maker|sign.?off confirmed)\b/.test(lower);
  const hasAuthorityQuestion = /\b(not sure who|unclear who|don.?t know who|unsure who|nobody knows who|who (should|will|would|must|can|needs to) (decide|approve|authorise|authorize|sign)|who (decides|has authority|is responsible)|waiting for (approval|sign.?off|authority)|no.?one has (approved|signed|authorised|authorized)|hasn.?t been (approved|signed|authorised|authorized))\b/.test(lower);
  if (hasAuthorityQuestion && !hasApprovalConfirmed) {
    signals.add("authority_unclear");
  } else if (!hasApprovalConfirmed && /\b(approve|authority|mandate|sign.?off)\b/.test(lower) && /\b(decision|commit|proceed|go.?ahead)\b/.test(lower)) {
    signals.add("authority_unclear");
  }

  // External deadline (statutory/regulatory/contractual or named date)
  if (
    /\b(statutory deadline|filing deadline|legal deadline|regulatory deadline|compliance deadline|court date|tribunal date|due date|by \w+ \d{4}|till (june|july|august|september|october|november|december|january|february|march|april|may)|until (june|july|august|september|october|november|december|january|february|march|april|may)|31 (jan|oct|january|october)|by 31|must file by|must submit by|late penalty|overdue|extension (expires|expired|running out))\b/.test(lower) ||
    /\b(by (next |this )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|by (monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/.test(lower) ||
    /\b(court (date|hearing|notice)|respond by|must respond|response (is )?due|deadline (is|was) (next|this|last))\b/.test(lower)
  ) signals.add("deadline_external");

  // Self-imposed deadline
  if (
    !signals.has("deadline_external") &&
    /\b(end of (quarter|q\d|month|week|year)|by (next|this) (week|month|quarter)|(next|this) (week|month) (meeting|review|board|presentation)|internal deadline|our deadline|self.?imposed deadline|hoping to finish by|aiming (to|for)|target (date|of))\b/.test(lower)
  ) signals.add("deadline_self_imposed");

  // Penalty exposure — require "fine" to appear with financial context
  // Avoid matching "everyone is fine with this" or "seems fine"
  if (
    /\b(fines|penalty|penalties|penalt|late (fee|charge|penalty|fine)|surcharge|sanction|enforcement action|£\d|€\d|\$\d|\d+[km]? (fine|penalty)|huge fine|large fine|significant (fine|penalty)|risk (of )?a fine|face a fine|pay a fine|incur a fine|avoid a fine|financial (penalty|sanction))\b/.test(lower) ||
    (/\bfine\b/.test(lower) && /\b(risk|avoid|pay|face|incur|owe|liable|charge|issue|receive)\b/.test(lower))
  ) signals.add("penalty_exposure");

  // Wrong action exposure
  if (
    /\b(risk of error|risk (of )?getting (it )?wrong|wrong (filing|submission|decision)|error (risk|exposure)|liability (if|for|from) (wrong|error|incorrect)|cost of (error|mistake|being wrong)|what if (i|we) (get it wrong|make a mistake)|rejected (filing|submission))\b/.test(lower)
  ) signals.add("wrong_action_exposure");

  // Delay compounds harm (e.g. compounding interest, escalating penalties)
  if (
    signals.has("deadline_external") &&
    (signals.has("penalty_exposure") || /\b(compounds|escalat|worsen|accumulates|interest (on|accrues)|late (fee|interest) (accumulates|adds up)|every (day|week|month) (delayed|late))\b/.test(lower))
  ) signals.add("delay_compounds_harm");

  // Irreversible window
  if (
    /\b(irreversible|can.?t undo|no (going back|way back)|last chance|window (closing|closes|is closing)|point of no return|once (filed|submitted|signed|executed)|can.?t (reverse|undo|unwind))\b/.test(lower)
  ) signals.add("irreversible_window");

  // Emotional overload
  if (
    /\b(stressed|overwhelmed|don.?t know what to do|panic|terrified|scared|anxiety|anxious|at (my|our|a) (wits|wit.?s) end|no idea what|completely lost|out of options)\b/.test(lower)
  ) signals.add("emotional_overload");

  return signals;
}

// ─── Pressure type detector ───────────────────────────────────────────────────

function detectPressureTypes(
  lower: string,
  domain: DecisionDomain,
  constraints: Set<ConstraintSignal>,
): Set<PressureType> {
  const pressures = new Set<PressureType>();

  if (domain === "compliance_statutory" && constraints.has("deadline_external")) {
    pressures.add("statutory_deadline");
  }
  if (domain === "legal_regulatory") pressures.add("legal_pressure");
  if (domain === "family_legal_admin") pressures.add("family_pressure");
  // Governance pressure: from domain OR from board/executive language in text
  if (
    domain === "board_sensitive" ||
    /\b(board (meeting|approval|decision|vote|review)|executive (committee|team|approval)|c.?suite|board of directors|trustee|shareholder (vote|approval|meeting)|committee (approval|decision))\b/.test(lower)
  ) pressures.add("governance_pressure");
  if (domain === "product_release") pressures.add("commercial_pressure");
  if (domain === "operational_dependency") pressures.add("operational_pressure");

  if (constraints.has("cash_constraint") || constraints.has("penalty_exposure")) {
    pressures.add("cashflow_pressure");
  }
  if (/\b(reputat|brand (risk|damage)|public (perception|trust)|customer (trust|confidence)|pr (risk|crisis))\b/.test(lower)) {
    pressures.add("reputational_pressure");
  }
  if (constraints.has("deadline_external") && !pressures.has("statutory_deadline")) {
    pressures.add("commercial_pressure");
  }

  return pressures;
}

// ─── Directive computation ────────────────────────────────────────────────────

function computeDirective(
  domain: DecisionDomain,
  constraints: Set<ConstraintSignal>,
  pressures: Set<PressureType>,
): { directive: RiskDirective; score: number } {
  const isHighConsequenceDomain =
    domain === "compliance_statutory" ||
    domain === "legal_regulatory" ||
    domain === "family_legal_admin" ||
    domain === "financial_exposure";

  const hasExternalObligationPressure =
    constraints.has("deadline_external") ||
    constraints.has("penalty_exposure") ||
    pressures.has("statutory_deadline") ||
    pressures.has("legal_pressure");

  const isConstrained =
    (constraints.has("cash_constraint") || constraints.has("professional_help_unavailable")) &&
    (constraints.has("capability_gap") || constraints.has("records_incomplete"));

  // CONSTRAINED_RESCUE: high-consequence + external deadline/penalty + resource impossible
  if (
    isHighConsequenceDomain &&
    hasExternalObligationPressure &&
    isConstrained
  ) {
    return { directive: "CONSTRAINED_RESCUE", score: 10 };
  }

  // ESCALATE: high-consequence + external deadline/penalty (resources may be accessible)
  if (isHighConsequenceDomain && hasExternalObligationPressure) {
    return { directive: "ESCALATE", score: 20 };
  }

  // HIGH RISK: high-consequence domain or multiple constraint signals
  if (
    isHighConsequenceDomain ||
    constraints.has("irreversible_window") ||
    (constraints.has("deadline_external") && constraints.has("penalty_exposure"))
  ) {
    const score = constraints.has("delay_compounds_harm") ? 25 : 35;
    return { directive: "HIGH", score };
  }

  // MODERATE: some constraint signals or unclear domain with deadline
  if (
    constraints.has("authority_unclear") ||
    constraints.has("records_incomplete") ||
    constraints.has("deadline_self_imposed") ||
    constraints.has("capability_gap") ||
    domain === "board_sensitive" ||
    domain === "operational_dependency" ||
    domain === "deadline_bound"
  ) {
    return { directive: "MODERATE", score: 55 };
  }

  // LOW: genuinely low stakes or unclear domain with no concerning signals
  if (
    (domain === "personal_low_stakes" || domain === "unclear") &&
    !constraints.has("deadline_external") &&
    !constraints.has("penalty_exposure") &&
    !constraints.has("irreversible_window") &&
    !constraints.has("cash_constraint") &&
    !constraints.has("capability_gap") &&
    !constraints.has("authority_unclear") &&
    !constraints.has("records_incomplete") &&
    !constraints.has("delay_compounds_harm")
  ) {
    return { directive: "LOW", score: 85 };
  }

  // Default: cannot assess confidently
  return { directive: "MODERATE", score: 50 };
}

// ─── Finding generator ────────────────────────────────────────────────────────

function buildFindings(
  domain: DecisionDomain,
  constraints: Set<ConstraintSignal>,
  lower: string,
): CRLFinding[] {
  const findings: CRLFinding[] = [];

  if (domain === "compliance_statutory") {
    if (constraints.has("deadline_external")) {
      findings.push({
        label: "Deadline-bound statutory obligation",
        detail:
          "A filing or regulatory deadline is present. Statutory deadlines carry automatic penalties independent of the filer's financial position or intent.",
        severity: "HIGH",
      });
    }
    if (constraints.has("records_incomplete")) {
      findings.push({
        label: "Records or submission incomplete",
        detail:
          "A placeholder or provisional submission has been made, or records are missing. Provisional filings do not remove the obligation to file an accurate final return.",
        severity: "HIGH",
      });
    }
    if (constraints.has("capability_gap")) {
      findings.push({
        label: "Complexity exceeds self-service risk threshold",
        detail:
          "The accounts or filing are described as complex without professional guidance. Complex returns filed without review risk errors, rejected submissions, or missed reliefs — each of which may exceed the cost of limited-scope professional help.",
        severity: "HIGH",
      });
    }
    if (
      /turnover|revenue/.test(lower) &&
      /\b(profit|loss|little|small|low|minimal|very little|hardly any|negligible)\b/.test(lower)
    ) {
      findings.push({
        label: "Turnover/profit mismatch requires reconciliation",
        detail:
          "Significant turnover with low reported profit typically requires careful review of deductions, cost classification, and expense treatment. This is a common compliance review trigger.",
        severity: "HIGH",
      });
    }
    if (constraints.has("penalty_exposure")) {
      findings.push({
        label: "Material financial penalty at risk",
        detail:
          "A significant fine or penalty is referenced. The cost of an error or late filing typically exceeds the cost of a fixed-scope professional review.",
        severity: "HIGH",
      });
    }
    if (constraints.has("cash_constraint")) {
      findings.push({
        label: "Resource constraint does not remove the legal obligation",
        detail:
          "Limited budget is a real constraint but it does not reduce the duty to file accurately and on time. Fixed-scope or limited-review engagements typically cost significantly less than full-service accounting.",
        severity: "MEDIUM",
      });
    }
  }

  if (domain === "legal_regulatory" || domain === "family_legal_admin") {
    if (constraints.has("deadline_external")) {
      findings.push({
        label: "External legal or regulatory deadline",
        detail:
          "A court, regulatory, or contractual deadline is present. Missing these deadlines typically creates compounding exposure.",
        severity: "HIGH",
      });
    }
    if (constraints.has("professional_help_unavailable")) {
      findings.push({
        label: "Legal complexity without accessible professional support",
        detail:
          "Legal or regulatory matters require specialist input. When professional help is not financially accessible, self-help resources, free legal advice clinics, and legal aid eligibility checks become the minimum viable path.",
        severity: "HIGH",
      });
    }
  }

  if (domain === "board_sensitive") {
    if (constraints.has("authority_unclear")) {
      findings.push({
        label: "Authority and mandate not confirmed",
        detail:
          "The decision requires board or executive approval but no confirmed authority is recorded. Proceeding without mandate creates exposure to reversal.",
        severity: "HIGH",
      });
    }
    if (constraints.has("records_incomplete")) {
      findings.push({
        label: "Supporting records incomplete",
        detail:
          "Board decisions require a clear evidence pack. Incomplete records weaken the decision and create audit exposure.",
        severity: "MEDIUM",
      });
    }
  }

  if (domain === "product_release") {
    if (constraints.has("deadline_external")) {
      findings.push({
        label: "External release commitment present",
        detail:
          "A contractual or externally committed release date creates pressure to release before readiness is confirmed. Date-driven releases have higher failure rates.",
        severity: "HIGH",
      });
    }
    if (constraints.has("records_incomplete")) {
      findings.push({
        label: "Testing or approval evidence incomplete",
        detail:
          "Release requires confirmed testing evidence and sign-off. Releasing without these creates rollback and liability exposure.",
        severity: "HIGH",
      });
    }
  }

  // Universal findings
  if (constraints.has("delay_compounds_harm")) {
    findings.push({
      label: "Delay actively compounds the harm",
      detail:
        "Each day of inaction increases the cost or exposure. This decision cannot be safely deferred.",
      severity: "HIGH",
    });
  }

  if (constraints.has("irreversible_window")) {
    findings.push({
      label: "Action window is closing",
      detail:
        "There is a limited window to act. Once it closes, the options narrow significantly.",
      severity: "HIGH",
    });
  }

  if (constraints.has("wrong_action_exposure")) {
    findings.push({
      label: "Wrong action carries specific liability",
      detail:
        "An error in this decision is not easily corrected. The cost of getting it wrong may significantly exceed the cost of getting it right.",
      severity: "MEDIUM",
    });
  }

  // Pad to at least 3
  if (findings.length < 3) {
    if (!findings.some(f => f.label.includes("context"))) {
      findings.push({
        label: "Limited decision context provided",
        detail:
          "Additional detail about the scope, authority, and constraints would improve triage accuracy.",
        severity: "LOW",
      });
    }
    if (findings.length < 3) {
      findings.push({
        label: "Evidence and authority chain not confirmed",
        detail:
          "A governed decision requires both evidence of the basis and a named authority. Neither is confirmed from the description.",
        severity: "LOW",
      });
    }
  }

  return findings.slice(0, 5);
}

// ─── Output templates ─────────────────────────────────────────────────────────

function primaryTension(
  domain: DecisionDomain,
  constraints: Set<ConstraintSignal>,
): string | null {
  if (domain === "compliance_statutory") {
    if (constraints.has("cash_constraint") && constraints.has("penalty_exposure"))
      return "Cash constraint vs compliance exposure — the cost of not filing may exceed the cost of a fixed-scope professional review.";
    if (constraints.has("records_incomplete") && constraints.has("deadline_external"))
      return "Provisional filing vs final accurate return — the placeholder defers but does not resolve the compliance obligation.";
    if (constraints.has("capability_gap"))
      return "DIY efficiency vs error risk — complexity without professional oversight increases the probability of filing errors and missed reliefs.";
  }
  if (domain === "legal_regulatory") {
    if (constraints.has("cash_constraint"))
      return "Legal exposure vs resource constraint — the cost of inaction is likely higher than the cost of a minimum viable legal consultation.";
  }
  if (domain === "board_sensitive") {
    if (constraints.has("authority_unclear"))
      return "Decision urgency vs authority gap — proceeding without confirmed mandate creates the risk of reversal.";
    if (constraints.has("deadline_external"))
      return "External deadline vs incomplete evidence — the timeline is fixed but the information needed for a sound decision is not yet available.";
    return "Political pressure vs governance discipline — the desire for a specific outcome is competing with the duty to make a defensible decision.";
  }
  if (domain === "product_release") {
    if (constraints.has("deadline_external") && constraints.has("records_incomplete"))
      return "Revenue pressure vs release readiness — shipping without evidence of testing creates incident risk that costs more than the delay.";
    if (constraints.has("deadline_external"))
      return "Revenue urgency vs release safety — the cost of delay is known but the cost of failure may be higher.";
    return "Feature completion vs operational risk — the release is feature-complete but the governance and testing evidence is not.";
  }
  if (domain === "market_claim") {
    return "Claim strength vs proof weakness — the statement is compelling but lacks the evidence required to defend it under scrutiny.";
  }
  if (domain === "family_legal_admin") {
    if (constraints.has("cash_constraint"))
      return "Legal/admin obligation vs resource constraint — the required action cannot be deferred but the means to address it professionally are limited.";
    if (constraints.has("delay_compounds_harm"))
      return "Delay compounds harm vs capacity to act — every day of inaction worsens the situation but the path forward is unclear.";
    return "Personal consequence vs institutional process — the decision affects someone's welfare but must navigate formal legal or administrative channels.";
  }
  if (constraints.has("deadline_external") && constraints.has("cash_constraint")) {
    return "Time pressure vs resource constraint — the deadline is fixed but the budget to respond adequately is limited.";
  }
  if (constraints.has("irreversible_window")) {
    return "Irreversible consequence vs incomplete information — once taken, this decision cannot be undone, but not all necessary facts are known.";
  }
  if (domain === "financial_exposure") {
    if (constraints.has("irreversible_window"))
      return "Irreversible financial commitment vs incomplete information — the decision must be made but the full picture is not yet available.";
    return "Financial exposure vs constrained options — the downside of each available path is material, but inaction also carries a cost.";
  }
  if (domain === "personal_low_stakes") {
    return null; // No tension — genuinely low-stakes preference decision
  }
  return null;
}

function minimumViableMove(
  domain: DecisionDomain,
  constraints: Set<ConstraintSignal>,
  directive: RiskDirective,
): string {
  if (domain === "compliance_statutory" && directive === "CONSTRAINED_RESCUE") {
    return [
      "Build a minimum viable filing rescue path:",
      "— Identify the exact filing types required (HMRC corporation tax, Companies House accounts, and/or VAT are separate obligations with separate deadlines)",
      "— Separate what is already submitted from what is still outstanding",
      "— Prepare your records pack: bank statements, invoices, receipts, prior returns",
      "— Contact HMRC Business Payment Support Line (0300 200 3835) and Companies House — proactive contact is treated more favourably than non-response",
      "— Seek a fixed-fee limited-scope review (many accountants offer a review-and-sign service for far less than full preparation)",
      "— Check eligibility for free business advice: ICAEW Find a Firm, Citizens Advice Business, local LEP, Business Debtline",
      "— Document every attempt to obtain professional help",
      "— If no professional help is available before the deadline, file the most accurate defensible position you can, and correct it with an amended return once help is available",
    ].join("\n");
  }

  if (domain === "compliance_statutory") {
    return "Identify the exact deadline and filing type. Obtain a fixed-scope professional review if possible. Do not treat a placeholder submission as a completed obligation.";
  }

  if ((domain === "legal_regulatory" || domain === "family_legal_admin") && constraints.has("cash_constraint")) {
    return [
      "Minimum viable legal self-help path:",
      "— Check eligibility for legal aid (gov.uk/legal-aid) — availability depends on income and case type",
      "— Citizens Advice and LawWorks offer free legal triage",
      "— Local law school clinics often provide free initial consultations",
      "— Identify whether you can respond, file, or appear in person (self-representation is permitted in most civil matters)",
      "— Use government-issued forms and procedural guides (gov.uk/courts-tribunals)",
      "— Request a free or fixed-fee 30-minute consultation to understand your minimum obligations before committing to representation",
      "— Document all steps taken and all attempts to obtain help",
    ].join("\n");
  }

  if (domain === "financial_exposure" && constraints.has("cash_constraint")) {
    return [
      "Minimum viable path when professional advice is unaffordable:",
      "— Identify the single highest-risk element and the specific question you need answered",
      "— Many professionals offer a fixed-fee initial consultation (often 30–60 minutes) for a fraction of full engagement cost",
      "— Business advisory services (local enterprise partnerships, Chambers of Commerce, SCORE-equivalent) offer free guidance",
      "— Separate the decision into what you can assess yourself and what requires specialist input",
      "— Document your decision and the reasoning — this is evidence of due diligence if the decision is later challenged",
    ].join("\n");
  }

  if (domain === "board_sensitive") {
    return "Draft a one-page decision brief identifying what requires board approval, who holds mandate, and the minimum evidence package required. Circulate for pre-read before calling a formal decision.";
  }

  if (domain === "product_release") {
    return "Identify the minimum release criteria: approval, tested scope, rollback plan, monitoring defined. Do not proceed without all four. If the deadline is external, negotiate a conditional release with reduced scope rather than a full release with unconfirmed readiness.";
  }

  if (directive === "LOW") {
    return "Proceed with standard documentation. Record the decision, the rationale, and who approved it.";
  }

  return "Identify the one highest-risk element and address it first. Do not treat all findings as equal — resolve the blocking constraint before attempting the ideal solution.";
}

function fallbackPath(
  domain: DecisionDomain,
  constraints: Set<ConstraintSignal>,
): string {
  if (domain === "compliance_statutory") {
    if (constraints.has("cash_constraint") || constraints.has("professional_help_unavailable")) {
      return "If no professional help is available before the deadline: file the most accurate return you can prepare, clearly note any uncertainties, contact HMRC/Companies House in advance to explain your situation, and commit to submitting an amended return once professional help is accessible. Proactive partial compliance is treated significantly better than non-filing.";
    }
    return "If ideal professional support is unavailable: use HMRC's own guidance, ICAEW's free resources, and file a best-efforts return on time. Amend it once a professional review is possible.";
  }

  if (domain === "legal_regulatory" || domain === "family_legal_admin") {
    return "If full legal representation is unaffordable: use Citizens Advice or LawWorks for a free initial triage, check legal aid eligibility, and self-represent using government-issued procedural guides. File any required responses on time even if imperfect — late responses are harder to recover than imperfect ones.";
  }

  if (domain === "board_sensitive") {
    return "If full board convening is not possible before the deadline: obtain written approval from the minimum required authorities, document it, and proceed with a deferred formal ratification commitment.";
  }

  return "If the ideal path is blocked: identify the single highest-risk element, address it alone, and document your reasoning for the compromised approach.";
}

function evidenceNeeded(
  domain: DecisionDomain,
  constraints: Set<ConstraintSignal>,
  lower: string,
): string[] {
  if (domain === "compliance_statutory") {
    const items: string[] = [
      "Exact statutory deadlines for each outstanding obligation",
      "Confirmation of what has been submitted vs what is still outstanding",
      "Complete financial records for the relevant period",
    ];
    if (/turnover|revenue/.test(lower)) items.push("Reconciled turnover, cost of sales, and profit/loss figures");
    if (constraints.has("records_incomplete")) items.push("List of missing records and where they can be recovered");
    items.push("Budget available for fixed-scope professional review");
    return items;
  }

  if (domain === "legal_regulatory" || domain === "family_legal_admin") {
    return [
      "Name of the relevant court, regulator, or authority",
      "Exact deadlines for response or compliance",
      "Copies of all notices or correspondence received",
      "Legal aid eligibility status",
    ];
  }

  if (domain === "board_sensitive") {
    return [
      "Named decision-maker with confirmed authority",
      "One-page evidence brief with supporting data",
      "List of stakeholders who need to be notified",
      "Timeline for formal ratification",
    ];
  }

  if (domain === "product_release") {
    return [
      "Confirmation of test coverage and UAT sign-off",
      "Named release approver",
      "Rollback plan owner and trigger threshold",
      "Monitoring and alert configuration",
    ];
  }

  return [
    "Named decision authority",
    "Evidence cited and dated",
    "Deadline confirmed",
    "Constraints explicitly documented",
  ];
}

function mustNotDelay(
  domain: DecisionDomain,
  constraints: Set<ConstraintSignal>,
  directive: RiskDirective,
): string[] {
  if (directive === "CONSTRAINED_RESCUE" || directive === "ESCALATE") {
    const items: string[] = [];
    if (constraints.has("deadline_external")) items.push("Confirming the exact filing or compliance deadline");
    if (domain === "compliance_statutory") {
      items.push("Contacting the relevant authority (HMRC / Companies House) to register awareness");
      items.push("Identifying what type of filing or action is required");
    }
    if (constraints.has("records_incomplete")) items.push("Recovering or reconstructing missing records");
    if (constraints.has("professional_help_unavailable")) items.push("Exploring free advice routes (legal aid, ICAEW, Citizens Advice)");
    return items.length > 0 ? items : ["Confirm exact deadline and obligation type immediately"];
  }

  if (directive === "HIGH") {
    return [
      "Confirm who holds decision authority",
      "Establish the hard deadline",
      "Identify any irreversible action required",
    ];
  }

  return ["Confirm the decision scope and authority before committing"];
}

function escalationThreshold(
  domain: DecisionDomain,
  constraints: Set<ConstraintSignal>,
  directive: RiskDirective,
): string {
  if (directive === "CONSTRAINED_RESCUE") {
    return "This decision has already crossed the escalation threshold. Immediate action on the minimum viable path is required. Do not wait for ideal conditions.";
  }
  if (directive === "ESCALATE") {
    return "Escalate immediately if: the deadline passes without action, professional help is identified as inaccessible, or the financial exposure exceeds your ability to self-fund a correction.";
  }
  if (directive === "HIGH") {
    return "Escalate if: the blocking constraint cannot be resolved within 48 hours, or if the cost of inaction is higher than the cost of any available path forward.";
  }
  return "Escalate if: the decision requires authority you do not hold, or if the evidence basis changes materially before the decision is made.";
}

function actionFeasibility(
  domain: DecisionDomain,
  constraints: Set<ConstraintSignal>,
  directive: RiskDirective,
): ActionFeasibility {
  if (directive === "CONSTRAINED_RESCUE") return "ideal_but_inaccessible";
  if (constraints.has("deadline_external")) return "must_act_now";
  if (constraints.has("cash_constraint") && !constraints.has("deadline_external")) return "possible_with_low_funds";
  if (constraints.has("authority_unclear")) return "requires_authority";
  if (constraints.has("records_incomplete")) return "requires_records";
  if (constraints.has("professional_help_unavailable")) return "requires_external_help";
  return "requires_delay";
}

// ─── Situation summary ────────────────────────────────────────────────────────

function situationSummary(
  domain: DecisionDomain,
  constraints: Set<ConstraintSignal>,
  directive: RiskDirective,
): string {
  if (directive === "CONSTRAINED_RESCUE") {
    const domainLabel =
      domain === "compliance_statutory" ? "statutory compliance obligation" :
      domain === "legal_regulatory" ? "legal or regulatory obligation" :
      domain === "family_legal_admin" ? "personal legal obligation" :
      "high-consequence obligation";
    return `This is a deadline-bound ${domainLabel} where the ideal path (professional assistance) is not currently accessible. The available options are constrained but a viable minimum rescue path exists.`;
  }

  if (directive === "ESCALATE") {
    return "This decision involves an external obligation with material consequences. Pattern analysis alone is insufficient — professional triage is required before committing to a course of action.";
  }

  const domainDescriptions: Partial<Record<DecisionDomain, string>> = {
    compliance_statutory: "This is a statutory compliance decision",
    legal_regulatory: "This is a legal or regulatory decision",
    family_legal_admin: "This is a personal legal or administrative decision",
    board_sensitive: "This decision requires formal governance authority",
    product_release: "This is a release readiness decision",
    market_claim: "This is a market positioning decision",
    financial_exposure: "This is a financial commitment decision",
    operational_dependency: "This is an operational risk decision",
    deadline_bound: "This is a time-bound decision",
    personal_low_stakes: "This is a low-stakes preference decision",
    unclear: "The decision type requires clarification",
  };

  const base = domainDescriptions[domain] ?? "This decision requires assessment";
  const constraintCount = constraints.size;
  const suffix =
    directive === "HIGH" ? " with significant risk factors that must be addressed before proceeding." :
    directive === "MODERATE" ? " with gaps that should be resolved before committing." :
    " with no critical blockers identified.";

  return `${base}${suffix}${constraintCount > 0 ? ` ${constraintCount} constraint signal${constraintCount !== 1 ? "s" : ""} detected.` : ""}`;
}

// ─── Main analyser ────────────────────────────────────────────────────────────

export function analyzeConstraintReality(text: string): CRLResult {
  const lower = text.toLowerCase();

  const decisionType = classifyDecisionType(lower);
  const constraintSignals = detectConstraintSignals(lower);
  const pressureTypes = detectPressureTypes(lower, decisionType, constraintSignals);
  const { directive, score } = computeDirective(decisionType, constraintSignals, pressureTypes);
  const findings = buildFindings(decisionType, constraintSignals, lower);

  return {
    decisionType,
    constraintSignals: [...constraintSignals],
    pressureTypes: [...pressureTypes],
    directive,
    score,
    situationSummary: situationSummary(decisionType, constraintSignals, directive),
    primaryTension: primaryTension(decisionType, constraintSignals),
    downsideOfDelay:
      constraintSignals.has("delay_compounds_harm")
        ? "Each day of inaction increases the penalty, exposure, or cost. This is not a deferrable decision."
        : directive === "CONSTRAINED_RESCUE" || directive === "ESCALATE"
        ? "Missing the deadline creates a penalty or enforcement position that is significantly harder and more expensive to resolve than acting now."
        : "Delay reduces the available options and may allow a reversible situation to become irreversible.",
    downsideOfWrongAction:
      directive === "CONSTRAINED_RESCUE" || directive === "ESCALATE"
        ? "An error in a statutory or legal submission can trigger corrections, rejected filings, additional penalties, or audit — each of which costs more to fix than prevention."
        : "An unsupported or unauthorised decision is vulnerable to reversal, escalation, or rework.",
    minimumViableNextMove: minimumViableMove(decisionType, constraintSignals, directive),
    fallback: fallbackPath(decisionType, constraintSignals),
    evidenceNeeded: evidenceNeeded(decisionType, constraintSignals, lower),
    mustNotDelay: mustNotDelay(decisionType, constraintSignals, directive),
    escalationThreshold: escalationThreshold(decisionType, constraintSignals, directive),
    findings,
    actionFeasibility: actionFeasibility(decisionType, constraintSignals, directive),
  };
}
