/**
 * lib/intelligence/situation-translator.ts
 *
 * Situation Translator — the first gate of the Decision Intelligence Kernel.
 *
 * Converts raw buyer language into institutional structure without
 * destroying ambiguity. The buyer does not arrive with a case.
 * The buyer arrives with a situation.
 *
 * Translation law:
 *   Never collapse ambiguity into false precision.
 *   If authority is unclear, say so.
 *   If obligation may exist but is unconfirmed, preserve both readings.
 *   If the situation belongs to two decision classes, surface both.
 *
 * Vocabulary states:
 *   1 — Urgency without structure
 *   2 — Structure without diagnosis
 *   3 — Diagnosis without path
 *   4 — Path without governance
 *   5 — Misclassified stakes (low presented as high, or high as low)
 *
 * Pure TypeScript. No side effects. Browser-safe.
 */

import type {
  TranslationResult,
  VocabularyState,
  ClarificationQuestion,
  ActorCandidate,
} from "./living-decision-case-contract";
import type {
  DecisionClass,
  ConfidenceLevel,
} from "./decision-class-taxonomy";

// ─── Vocabulary state detector ────────────────────────────────────────────────

function detectVocabularyState(lower: string): VocabularyState {
  const hasUrgency = /\b(urgent|asap|deadline|must|need to|immediately|running out|by (monday|tuesday|wednesday|thursday|friday|today|tomorrow|this week|next week)|\d{1,2} (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\d{1,2}\/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))\b/.test(lower);
  const hasStructure = /\b(decision|options?|choice|alternatives?|path|route|approach|considering|evaluating)\b/.test(lower);
  const hasDiagnosis = /\b(problem|issue|risk|fail|failing|concern|gap|missing|unknown|unclear|not sure|uncertain)\b/.test(lower);
  const hasPath = /\b(plan|going to|will|decided|have decided|we have chosen|intend to|our plan|the plan)\b/.test(lower);
  const hasGovernance = /\b(approved|authority|mandate|record|document|sign.?off|board|governance|compliance)\b/.test(lower);

  // State 5: Misclassified stakes — high stakes described as minor/simple
  const hasHighStakes = /\b(fine|penalty|court|board|statutory|legal|compliance|hmrc|£\d|thousands?|hundred.?thousand|million)\b/.test(lower);
  const hasTrivialLanguage = /\b(minor|simple|quick|small|easy|just a|only a|shouldn.?t take long|shouldn.?t be (hard|difficult))\b/.test(lower);
  if (hasHighStakes && hasTrivialLanguage) return 5;

  // State 4: Path without governance
  if (hasPath && !hasGovernance && !hasUrgency) return 4;

  // State 3: Diagnosis without path
  if (hasDiagnosis && !hasPath && !hasUrgency) return 3;

  // State 2: Structure without diagnosis
  if (hasStructure && !hasDiagnosis && !hasUrgency) return 2;

  // State 1: Urgency without structure
  if (hasUrgency && !hasStructure && !hasDiagnosis) return 1;

  // Default: urgency + structure, or diagnosis + urgency
  return hasUrgency ? 1 : 2;
}

// ─── Decision class classifier ────────────────────────────────────────────────

type ClassScore = { cls: DecisionClass; score: number };

function scoreDecisionClasses(lower: string): ClassScore[] {
  const scores: ClassScore[] = [
    { cls: "COMPLIANCE_AND_FILING",     score: 0 },
    { cls: "GOVERNANCE_AND_BOARD",      score: 0 },
    { cls: "COMMERCIAL_AND_MARKET",     score: 0 },
    { cls: "OPERATIONAL_AND_EXECUTION", score: 0 },
    { cls: "STRATEGIC_AND_POSITIONING", score: 0 },
    { cls: "REPUTATIONAL_AND_EXPOSURE", score: 0 },
    { cls: "FINANCIAL_AND_CAPITAL",     score: 0 },
    { cls: "LEGAL_AND_CONTRACTUAL",     score: 0 },
    { cls: "PEOPLE_AND_AUTHORITY",      score: 0 },
    { cls: "TECHNOLOGY_AND_DEPENDENCY", score: 0 },
    { cls: "CONTINUITY_AND_TRANSITION", score: 0 },
    { cls: "LOW_STAKES_PREFERENCE",     score: 0 },
  ];

  function boost(cls: DecisionClass, points: number) {
    const entry = scores.find(s => s.cls === cls);
    if (entry) entry.score += points;
  }

  // COMPLIANCE_AND_FILING
  if (/\b(tax|taxes|hmrc|vat|ct600|corporation tax|self.?assessment|companies house|statutory accounts|annual accounts|annual return|confirmation statement|paye|national insurance|irs|ato|cra|inland revenue|tax return|tax filing|file accounts)\b/.test(lower)) boost("COMPLIANCE_AND_FILING", 10);
  if (/\b(filing deadline|compliance deadline|statutory deadline|must file|must submit|overdue filing|compliance implications|regulatory compliance)\b/.test(lower)) boost("COMPLIANCE_AND_FILING", 5);
  // payroll alone does not indicate compliance filing — only when combined with tax/hmrc context
  if (/\bpayroll\b/.test(lower) && /\b(tax|hmrc|paye|national insurance)\b/.test(lower)) boost("COMPLIANCE_AND_FILING", 5);

  // GOVERNANCE_AND_BOARD
  if (/\b(board (approval|decision|meeting|vote|sign.?off)|board of directors|shareholder (approval|vote|meeting)|trustee|fiduciary|committee approval|executive committee)\b/.test(lower)) boost("GOVERNANCE_AND_BOARD", 10);
  if (/\b(governance|c.?suite|ceo|cfo|cto)\b/.test(lower)) boost("GOVERNANCE_AND_BOARD", 3);

  // COMMERCIAL_AND_MARKET
  if (/\b(market claim|positioning|messaging|value proposition|marketing copy|brand statement|product claim|offer|pitch|go.?to.?market|pricing strategy|competitive positioning|buyer|customer claim)\b/.test(lower)) boost("COMMERCIAL_AND_MARKET", 10);
  if (/\b(claim|superlative|guarantee|industry.?leading|best.?in.?class|revolutionary|proven|certified)\b/.test(lower)) boost("COMMERCIAL_AND_MARKET", 4);

  // OPERATIONAL_AND_EXECUTION
  if (/\b(release|deploy|deployment|launch|ship|go.?live|production (deploy|release)|feature flag|rollback|staging|pull request|ci.?cd|operational commitment)\b/.test(lower)) boost("OPERATIONAL_AND_EXECUTION", 10);
  if (/\b(testing|qa|sign.?off|approval for|monitoring|alert|dashboard)\b/.test(lower)) boost("OPERATIONAL_AND_EXECUTION", 3);

  // STRATEGIC_AND_POSITIONING
  if (/\b(strategy|strategic|market entry|pivot|repositioning|strategic bet|long.?term (direction|investment|position)|competitive (advantage|moat|position)|exclusive (deal|agreement|distribution|partnership)|distribution deal|partnership (offer|deal|terms)|lose (our )?ability to|give up (our )?(direct|own))\b/.test(lower)) boost("STRATEGIC_AND_POSITIONING", 8);

  // REPUTATIONAL_AND_EXPOSURE
  if (/\b(reputat|brand (risk|damage)|public (statement|response|apology)|pr (risk|crisis)|media|press release|communication (strategy|response)|crisis)\b/.test(lower)) boost("REPUTATIONAL_AND_EXPOSURE", 10);

  // FINANCIAL_AND_CAPITAL
  if (/\b(investment decision|funding round|loan|debt|refinanc|equity|acquisition|merger|financial commitment|capital expenditure|capex|raise funding|investor|term sheet|bridge round|runway|weeks of runway|months of runway|wind down|wind.?down|out of cash|payroll (is )?due)\b/.test(lower)) boost("FINANCIAL_AND_CAPITAL", 10);

  // LEGAL_AND_CONTRACTUAL
  if (/\b(lawsuit|litigation|court|tribunal|gdpr|data protection|regulatory approval|contract dispute|breach of contract|legal obligation|terms of service|intellectual property|patent|trademark|employment law|unfair dismissal|redundancy|legal dispute|legal issue|legal matter|legal contract|contract issue|lawyer|solicitor|barrister|legal (problem|question|concern|implications|risk|review|advice|claim|action))\b/.test(lower)) boost("LEGAL_AND_CONTRACTUAL", 10);

  // PEOPLE_AND_AUTHORITY
  if (/\b(hire|hiring|fire|firing|redundan|dismiss|performance (management|review)|succession|promotion|demotion|authority (structure|delegation)|delegate|handover|reporting (line|structure))\b/.test(lower)) boost("PEOPLE_AND_AUTHORITY", 10);

  // TECHNOLOGY_AND_DEPENDENCY
  if (/\b(vendor (lock|dependency|contract)|supplier (change|failure|risk|acquired|dependency)|system (migration|replacement|outage)|critical (path|dependency|supplier)|technical debt|infrastructure (change|migration)|main supplier|key supplier|sole supplier|no alternative (supplier|vendor)|depend (on|upon) (them|it|the supplier)|60%|80%|90% (of production|of supply|of revenue))\b/.test(lower)) boost("TECHNOLOGY_AND_DEPENDENCY", 10);

  // CONTINUITY_AND_TRANSITION
  if (/\b(succession|handover|wind.?down|closure|transition|continuity (plan|record)|institutional (memory|knowledge)|what happens when|after (i|we) (leave|go|move on))\b/.test(lower)) boost("CONTINUITY_AND_TRANSITION", 10);

  // LOW_STAKES_PREFERENCE
  if (
    /\b(prefer|favourite|which one|should (i|we) (choose|pick|go with|move|change|switch|reschedule)|best option|what do you think|opinion|recommendation for me|which (day|time|date|option))\b/.test(lower) &&
    !/\b(penalty|deadline|fine|obligation|compliance|statutory|legal|court|risk|exposure|liability|board|contract|file|filing)\b/.test(lower)
  ) boost("LOW_STAKES_PREFERENCE", 15);

  return scores.sort((a, b) => b.score - a.score);
}

function scoreToConfidence(score: number, runnerUp: number): ConfidenceLevel {
  if (score >= 10 && runnerUp === 0) return "HIGH";
  if (score >= 10 && score - runnerUp >= 5) return "HIGH";
  if (score >= 6 && score - runnerUp >= 3) return "MEDIUM";
  if (score === 0) return "LOW";
  return "MEDIUM";
}

// ─── Actor extractor ──────────────────────────────────────────────────────────

function extractActors(lower: string): ActorCandidate[] {
  const actors: ActorCandidate[] = [];

  if (/\bhmrc\b/.test(lower) || (/\b(tax|taxes|tax return|tax filing)\b/.test(lower) && /\b(file|filing|submit|return)\b/.test(lower))) {
    actors.push({ label: "HMRC", role: "regulator", named: true, authorityLevel: "confirmed" });
  }
  if (/\bcompanies house\b/.test(lower)) actors.push({ label: "Companies House", role: "regulator", named: true, authorityLevel: "confirmed" });
  if (/\bboard( of directors)?\b/.test(lower)) actors.push({ label: "the board", role: "approver", named: false, authorityLevel: "inferred" });
  if (/\bceo\b/.test(lower)) actors.push({ label: "the CEO", role: "decision_maker", named: false, authorityLevel: "inferred" });
  if (/\bcfo\b/.test(lower)) actors.push({ label: "the CFO", role: "reviewer", named: false, authorityLevel: "inferred" });
  if (/\bsolicitor\b|\blawyer\b|\babarrister\b|\battorney\b/.test(lower)) actors.push({ label: "legal adviser", role: "reviewer", named: false, authorityLevel: "unknown" });
  if (/\baccountant\b/.test(lower)) actors.push({ label: "accountant", role: "reviewer", named: false, authorityLevel: "unknown" });
  if (/\bcourt\b/.test(lower)) actors.push({ label: "the court", role: "regulator", named: false, authorityLevel: "confirmed" });
  if (/\bteam\b/.test(lower)) actors.push({ label: "the team", role: "implementer", named: false, authorityLevel: "unknown" });

  // I / we / the company (first person)
  if (/\b(i |we |our (company|organisation|organization|business|team))\b/.test(lower)) {
    actors.push({ label: "the decision-maker (self/organisation)", role: "decision_maker", named: false, authorityLevel: "inferred" });
  }

  return actors;
}

// ─── Dimension surfacing ──────────────────────────────────────────────────────

function surfaceDimensions(lower: string, cls: DecisionClass): string[] {
  const dims: string[] = [];

  if (
    /\b(no funds|no money|can.?t afford|cannot afford|limited budget|no budget|do not have funds|not sure (i|we) can afford|may not be able to afford|afford a|runway|weeks of runway|months of runway|cash.?constrained|cash position|out of cash|tight on cash|no capital|raising (a )?(bridge|emergency) round)\b/.test(lower)
  ) dims.push("constraint:cash");
  if (/\b(complicated|complex|no expertise|no accountant|no professional)\b/.test(lower)) dims.push("constraint:capability");
  if (
    /\b(deadline|by \w+ \d{4}|must file|must submit|overdue|till|until|by end of|by (next|this)|within \d+ (day|week|month)|need to respond|respond (by|within)|response (is )?due|next week|next month|10 days|3 weeks|6 weeks)\b/.test(lower)
  ) dims.push("obligation:deadline");
  if (/\b(fine|penalty|penalt|enforcement|sanction|fine if|fined|huge fine|large fine)\b/.test(lower) && !/\b(seems fine|is fine|that.?s fine|quite fine|looks fine|all fine|seem fine)\b/.test(lower)) dims.push("consequence:penalty");
  if (/\b(not sure who|unclear who|who (decides|approves|signs)|no (approval|authority) (yet|confirmed))\b/.test(lower)) dims.push("authority:unclear");
  if (/\b(data|evidence|research|analysis|benchmark|measured)\b/.test(lower)) dims.push("evidence:present");
  if (
    /\b(assume|assuming|believ|think|probably|maybe|projecting|unvalidated|internally|our (view|estimate|assessment)|we (expect|hope|feel)|team (believes|thinks)|haven.?t (validated|verified|externally validated)|not (yet )?(externally )?validated|internal (projection|estimate|forecast))\b/.test(lower) ||
    /\bprojection(s)?\b/.test(lower)
  ) dims.push("evidence:assumed");
  if (/\b(placeholder|provisional|estimated|missing records|no records)\b/.test(lower)) dims.push("constraint:records_incomplete");
  if (/\b(irreversible|can.?t undo|no going back|irrevocable|once (filed|signed|executed))\b/.test(lower)) dims.push("reversibility:irreversible");
  if (/\b(waiting for|blocked by|depends on|pending (approval|review|data))\b/.test(lower)) dims.push("dependency:unresolved");
  if (cls === "COMPLIANCE_AND_FILING") dims.push("obligation:statutory");
  if (cls === "GOVERNANCE_AND_BOARD") dims.push("authority:board_required");

  return [...new Set(dims)];
}

// ─── Hidden stakes detector ───────────────────────────────────────────────────

function detectHiddenStakes(lower: string, cls: DecisionClass): boolean {
  // Stakes misclassified as LOW when they are actually HIGH
  if (
    cls === "LOW_STAKES_PREFERENCE" &&
    /\b(fine|penalty|deadline|obligation|compliance|statutory|legal|court|board|contract|file|filing|hmrc|tax)\b/.test(lower)
  ) return true;

  // High-consequence situation described with trivial language
  if (
    /\b(fine|penalty|statutory|legal|court|compliance)\b/.test(lower) &&
    /\b(minor|simple|quick|small|easy|just a|only a|shouldn.?t take long)\b/.test(lower)
  ) return true;

  // Compliance with "no risk" framing
  if (
    cls === "COMPLIANCE_AND_FILING" &&
    /\b(low risk|no risk|not a big deal|shouldn.?t matter)\b/.test(lower)
  ) return true;

  return false;
}

// ─── Preserved ambiguities ────────────────────────────────────────────────────

function detectAmbiguities(lower: string, cls: DecisionClass, confidence: ConfidenceLevel): string[] {
  const ambiguities: string[] = [];

  if (confidence !== "HIGH") {
    ambiguities.push(`Decision class may be ${cls} or an adjacent class — more context needed`);
  }
  if (/\b(maybe|possibly|might be|could be|not sure if)\b/.test(lower)) {
    ambiguities.push("Obligation status is not confirmed — may or may not be legally required");
  }
  if (/\b(some|partial|partly|not fully|almost|nearly)\b/.test(lower)) {
    ambiguities.push("Constraint severity is partially described — full extent unclear");
  }
  if (/\b(they|them|someone|somebody|a person|the other party)\b/.test(lower) && !extractActors(lower).length) {
    ambiguities.push("Actors referenced but not identified — authority chain is incomplete");
  }

  return ambiguities;
}

// ─── Clarification questions ──────────────────────────────────────────────────

function buildClarificationQuestions(
  lower: string,
  cls: DecisionClass,
  confidence: ConfidenceLevel,
  dims: string[],
): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];

  // Authority — missing for governance/board decisions
  if (
    (cls === "GOVERNANCE_AND_BOARD" || dims.includes("authority:unclear")) &&
    !/\b(approved by|authorised by|signed off by|confirmed authority|board has decided|board approved|board voted)\b/.test(lower)
  ) {
    questions.push({
      field: "authority",
      question: "To map the authority structure accurately, we need to know: is the board being asked to approve this decision, ratify a decision already made, or receive information after management has already acted?",
      whyNeeded: "The answer changes the authority failure risk and the minimum viable next move.",
      exampleAnswer: "The CEO made the decision, the board needs to ratify it at the next meeting.",
    });
  }

  // Obligation — is there a legal/statutory requirement?
  if (
    cls === "COMPLIANCE_AND_FILING" &&
    !dims.includes("obligation:statutory") &&
    confidence !== "HIGH"
  ) {
    questions.push({
      field: "obligation_source",
      question: "Is this filing required by law (e.g. Companies Act, HMRC statutory filing), or is it something you have chosen to submit?",
      whyNeeded: "Statutory obligations carry mandatory penalties. Voluntary submissions carry different risk profiles.",
      exampleAnswer: "It is the mandatory annual corporation tax return — HMRC requires it.",
    });
  }

  // Constraint — is the ideal path genuinely inaccessible?
  if (
    /\b(no funds|can.?t afford|cannot afford|no (accountant|lawyer|adviser))\b/.test(lower) &&
    !dims.includes("constraint:cash")
  ) {
    questions.push({
      field: "constraint_confirmation",
      question: "When you say you cannot afford professional help, do you mean: (a) no available funds at all, (b) funds are very limited but some fixed-fee engagement may be possible, or (c) the cost is prohibitive relative to the amount at stake?",
      whyNeeded: "The answer determines whether the minimum viable path should include fixed-scope professional options or free-only routes.",
      exampleAnswer: "Funds are very limited — I could pay for a targeted 1-hour review but not full preparation.",
    });
  }

  // Deadline — confirmed or estimated?
  if (dims.includes("obligation:deadline") && !/\b(\d{1,2} (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|june 30|july 31|31 january|31 october)\b/.test(lower)) {
    questions.push({
      field: "deadline_confirmed",
      question: "Is the deadline you mentioned confirmed (e.g. a statutory date from HMRC, a court notice), or is it estimated?",
      whyNeeded: "A confirmed statutory deadline requires immediate action. An estimated deadline may allow more preparation time.",
      exampleAnswer: "It is confirmed — HMRC correspondence states the deadline is 30 June 2026.",
    });
  }

  return questions.slice(0, 3); // Cap at 3 to avoid cognitive overload
}

// ─── Situation summary and interpretation ────────────────────────────────────

function buildSituationSummary(
  cls: DecisionClass,
  vocabularyState: VocabularyState,
  dims: string[],
  hiddenStakes: boolean,
): string {
  const vocabDescriptions: Record<VocabularyState, string> = {
    1: "The situation is presented with urgency but without structural clarity",
    2: "The situation is described with some structure but the failure point has not been diagnosed",
    3: "The problem has been identified but there is no clear path forward",
    4: "A path has been chosen but it has not been formally governed or recorded",
    5: "The stakes appear to be misclassified — the situation may be more serious than described",
  };

  const classDescriptions: Partial<Record<DecisionClass, string>> = {
    COMPLIANCE_AND_FILING: "This is a compliance or statutory filing situation",
    GOVERNANCE_AND_BOARD: "This is a governance or board decision",
    COMMERCIAL_AND_MARKET: "This is a market claim or commercial positioning decision",
    OPERATIONAL_AND_EXECUTION: "This is an operational or release decision",
    LEGAL_AND_CONTRACTUAL: "This is a legal or contractual matter",
    FINANCIAL_AND_CAPITAL: "This is a financial or capital commitment decision",
    REPUTATIONAL_AND_EXPOSURE: "This is a reputational or exposure situation",
    STRATEGIC_AND_POSITIONING: "This is a strategic positioning decision",
    PEOPLE_AND_AUTHORITY: "This is a people or authority decision",
    TECHNOLOGY_AND_DEPENDENCY: "This is a technology or dependency situation",
    CONTINUITY_AND_TRANSITION: "This is a continuity or transition matter",
    LOW_STAKES_PREFERENCE: "This appears to be a low-stakes preference decision",
  };

  const base = classDescriptions[cls] ?? "The decision class requires further clarification";
  const vocab = vocabDescriptions[vocabularyState];
  const hiddenNote = hiddenStakes ? " Note: the stakes may be higher than described." : "";
  const constraint = dims.includes("constraint:cash") ? " Financial constraint is present." : "";
  const deadline = dims.includes("obligation:deadline") ? " A deadline is referenced." : "";

  return `${base}. ${vocab}.${constraint}${deadline}${hiddenNote}`;
}

function buildKernelInterpretation(
  cls: DecisionClass,
  dims: string[],
  vocabularyState: VocabularyState,
): string {
  const hasCash = dims.includes("constraint:cash");
  const hasDeadline = dims.includes("obligation:deadline");
  const hasStatutory = dims.includes("obligation:statutory");
  const hasAuthorityUnclear = dims.includes("authority:unclear");
  const hasPenalty = dims.includes("consequence:penalty");
  const hasIncomplete = dims.includes("constraint:records_incomplete");

  if (cls === "COMPLIANCE_AND_FILING" && hasDeadline && hasCash) {
    return "This is a constrained statutory compliance situation. The primary institutional question is not whether to comply — the obligation is legal. The question is what is the minimum viable rescue path given the resource constraint.";
  }
  if (cls === "COMPLIANCE_AND_FILING" && hasStatutory) {
    return "This is a statutory filing situation. The obligation is externally imposed and non-negotiable. The governing questions are: what exactly is required, by when, and what is the evidence/records state.";
  }
  if (cls === "GOVERNANCE_AND_BOARD" && hasAuthorityUnclear) {
    return "This is a governance decision with unclear authority. The primary failure risk is not in the decision itself but in the mandate. Proceeding without confirmed authority creates reversal risk.";
  }
  if (cls === "COMMERCIAL_AND_MARKET") {
    return "This is a market claim situation. The institutional question is not whether the claim is polished — it is whether the claim can survive serious challenge. Buyer validation and cited evidence are the governing tests.";
  }
  if (cls === "OPERATIONAL_AND_EXECUTION" && hasPenalty) {
    return "This is an operational commitment with consequence exposure. The governing question is whether readiness is confirmed or whether date pressure is overriding it.";
  }
  if (hasAuthorityUnclear) {
    return "Authority is unclear or unconfirmed. No decision can be binding without a named mandate holder. This is the primary failure point to resolve before any other analysis.";
  }
  if (hasCash && hasDeadline) {
    return "Resource constraint meets external deadline. The system maps the minimum viable path rather than the ideal path, because the ideal path may not be accessible under current constraints.";
  }
  if (vocabularyState === 5) {
    return "The situation may be more serious than the framing suggests. The language minimises what appears to be a material obligation or exposure. Stakes have been preserved at their higher reading.";
  }

  return "The system has translated the raw situation into its institutional form. The governing questions are being mapped across authority, obligation, evidence, and constraint dimensions.";
}

// ─── Main translator ──────────────────────────────────────────────────────────

export function translateSituation(rawInput: string): TranslationResult {
  const lower = rawInput.toLowerCase();

  // Step 1: Vocabulary state
  const vocabularyState = detectVocabularyState(lower);

  // Step 2: Decision class scoring
  const classScores = scoreDecisionClasses(lower);
  const topScore = classScores[0];
  const runnerUp = classScores[1];
  const confidence = scoreToConfidence(topScore?.score ?? 0, runnerUp?.score ?? 0);
  const primaryClass: DecisionClass = topScore?.cls ?? "LOW_STAKES_PREFERENCE";

  // Step 3: Alternative classes (score > 0, not primary)
  const alternatives = classScores
    .slice(1, 4)
    .filter(s => s.score > 0)
    .map(s => ({
      cls: s.cls,
      confidence: scoreToConfidence(s.score, classScores[2]?.score ?? 0) as ConfidenceLevel,
    }));

  // Step 4: Actors
  const initialActors = extractActors(lower);

  // Step 5: Dimensions
  const surfacedDimensions = surfaceDimensions(lower, primaryClass);

  // Step 6: Hidden stakes
  const hiddenStakesDetected = detectHiddenStakes(lower, primaryClass);

  // Step 7: Ambiguities
  const preservedAmbiguities = detectAmbiguities(lower, primaryClass, confidence);

  // Step 8: Clarification questions
  const clarificationRequired = buildClarificationQuestions(
    lower, primaryClass, confidence, surfacedDimensions,
  );

  // Step 9: Narratives
  const situationSummary = buildSituationSummary(
    primaryClass, vocabularyState, surfacedDimensions, hiddenStakesDetected,
  );
  const kernelInterpretation = buildKernelInterpretation(
    primaryClass, surfacedDimensions, vocabularyState,
  );

  return {
    vocabularyState,
    situationSummary,
    kernelInterpretation,
    translationConfidence: confidence,
    clarificationRequired,
    decisionClass: primaryClass,
    alternativeClasses: alternatives,
    initialActors,
    surfacedDimensions,
    preservedAmbiguities,
    hiddenStakesDetected,
  };
}
