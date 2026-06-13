/**
 * Case-Derived Judgement Composer.
 *
 * Produces judgement that varies with the classified decision pattern and
 * the actual facts of the case. Diagnosis, tension, consequence, next
 * move, falsification challenge, escalation trigger, and execution
 * sequence all derive from the pattern profile bound to case facts —
 * never from a shared template.
 *
 * Core invariant: materially different cases must produce materially
 * different judgement. If classification cannot be supported by the
 * input, no judgement is produced and gold output is blocked.
 */

import {
  DECISION_PATTERN_PROFILES,
  type DecisionPattern,
} from "@/lib/judgement/decision-pattern-model";
import {
  classifyDecisionPattern,
  type DecisionCaseInput,
  type DecisionPatternClassification,
} from "@/lib/judgement/classify-decision-pattern";

export interface CaseDerivedJudgement {
  primaryDiagnosis: string;
  decisionTension: string;
  commercialConsequence: string;
  recommendedNextMove: string;
  falsificationChallenge: string;
  escalationTrigger: string;
  executionSequence: string[];
  patternBasis: string[];
  confidence: number;
  limitations: string[];
}

export type CaseDerivedJudgementResult =
  | { status: "judged"; classification: DecisionPatternClassification; judgement: CaseDerivedJudgement }
  | { status: "insufficient_pattern_evidence"; missingSignals: string[] };

interface CaseFacts {
  decision: string;
  constraint: string;
  owner: string;
  deadline: string;
  delay: string;
  outcome: string;
}

/**
 * Pattern-specific judgement frames. Each frame uses distinct analytical
 * vocabulary; case facts are bound into the frame, but the judgement
 * skeleton itself changes with the pattern.
 */
const PATTERN_FRAMES: Record<DecisionPattern, {
  diagnosis: string;
  tension: string;
  sequence: string[];
}> = {
  ownership_ambiguity: {
    diagnosis: "Authority over {decision} is diffused: no single accountable owner holds the right to decide, so {constraint} persists as a vacuum every function can defer into.",
    tension: "The tension is accountability versus comfort: naming an owner ends the ambiguity but forces someone — likely {owner} — to carry a decision colleagues can then judge.",
    sequence: [
      "Write the decision as one sentence and circulate it to {owner} and each implicated function within 24 hours.",
      "Name the single owner in writing, including the explicit right to decide against either function's preference.",
      "Have the owner set the decision date and the minimum evidence they need by {deadline}.",
      "Record the ownership assignment where the next dispute will find it.",
    ],
  },
  pricing_pressure: {
    diagnosis: "The economics of {decision} are being contested without a priced hypothesis: value capture, willingness-to-pay, and margin floor are all asserted, none tested, while {constraint} compresses the room to manoeuvre.",
    tension: "The tension is margin versus momentum: protecting price risks losing deals now; matching pressure surrenders margin permanently — and the case currently lacks the evidence to price that trade.",
    sequence: [
      "State the pricing hypothesis explicitly: segment, value metric, floor, and walk-away boundary for {decision}.",
      "Apply the hypothesis to the next ten live deals instead of debating it internally; {owner} adjudicates exceptions.",
      "Track willingness-to-pay evidence deal by deal against {delay}.",
      "Review the boundary by {deadline} with the recorded deal evidence, not opinion.",
    ],
  },
  execution_drift: {
    diagnosis: "{decision} is drifting, not failing: the commitment survives every planning cycle while delivery quietly slips, and {constraint} is the cover story rather than the cause.",
    tension: "The tension is honesty versus optics: declaring the commitment stalled looks like failure, but keeping it nominally alive spends credibility every cycle it drifts.",
    sequence: [
      "Trace the single most consequential drifted commitment inside {decision} to its real blocker: capacity, priority, or quiet veto.",
      "Make {owner} either cancel it in writing or re-commit it with a dated, resourced plan.",
      "Strip downstream plans of any assumption that the drifted work has shipped.",
      "Re-inspect at {deadline}: a third slip converts this from drift management to escalation.",
    ],
  },
  stakeholder_misalignment: {
    diagnosis: "The principals around {decision} hold materially different positions — the divergence shows in execution while the meetings perform agreement, and {constraint} keeps the conflict profitable to leave unspoken.",
    tension: "The tension is surface harmony versus operational truth: forcing the disagreement into the open costs comfort now; leaving it implicit costs the execution capacity spent pulling in different directions.",
    sequence: [
      "Collect each principal's written answer to the same three questions about {decision} — priority, ownership, and success measure.",
      "Lay the conflicting answers side by side and name the divergences without softening them.",
      "Resolve each divergence one at a time with {owner} deciding where positions cannot be reconciled.",
      "Re-collect the written answers by {deadline}; persisting divergence is the escalation signal.",
    ],
  },
  resource_constraint: {
    diagnosis: "{decision} is capacity-bound: the constraint — {constraint} — is real, but it is being absorbed as uniform strain across all commitments instead of being converted into an explicit stop-list.",
    tension: "The tension is fairness versus effectiveness: spreading the shortage evenly feels equitable and guarantees everything degrades; concentrating it requires {owner} to stop work someone champions.",
    sequence: [
      "Rank every active commitment touched by {decision} in a single ordered list — no ties.",
      "Stop, in writing, the bottom of the list; 'paused' does not count.",
      "Re-sequence what remains around the scarcest capacity, honouring {delay} as the binding cost.",
      "Confirm by {deadline} that something has actually stopped; if nothing has, the constraint is still unmanaged.",
    ],
  },
  timing_pressure: {
    diagnosis: "{decision} is being driven by the calendar: the date is treated as fixed while scope and quality flex informally, and {constraint} makes the slippage non-linear rather than gradual.",
    tension: "The tension is the date versus the definition of done: meeting the deadline by silently cutting the wrong scope trades a visible miss for an invisible one that surfaces after delivery.",
    sequence: [
      "Separate what is genuinely date-fixed in {decision} from what is negotiable, with the evidence for each.",
      "Decide the cut explicitly — scope, quality bar, or date — and have {owner} sign it rather than letting it happen by exhaustion.",
      "Re-order remaining work by dependency, not panic, against {deadline}.",
      "Name now what happens the day after a miss, so the contingency is a plan and not an improvisation.",
    ],
  },
  evidence_gap: {
    diagnosis: "The evidence under {decision} is contradictory: credible inputs point in opposite directions, and {constraint} means the contradiction will be paid for in production if it is not reconciled first.",
    tension: "The tension is speed versus discrimination: deciding now means betting on one model while the other is still credible; waiting costs {delay} — and the case needs the cheapest fact that discriminates, not more analysis of both.",
    sequence: [
      "Isolate the single assumption on which the conflicting inputs about {decision} actually diverge.",
      "Buy the cheapest piece of real-world evidence that discriminates between them — a measurement, not a meeting.",
      "Pre-commit with {owner} which way each evidence outcome decides the question.",
      "If the discriminating evidence cannot arrive before {deadline}, make the bet explicitly and record the uncertainty it was made under.",
    ],
  },
  authority_conflict: {
    diagnosis: "{decision} is contested between authorities: the question is not what to decide but whose decision it is, and until that mandate is settled, {constraint} guarantees every resolution is provisional.",
    tension: "The tension is mandate versus matter: resolving the issue without resolving the mandate invites the loser to reopen it; resolving the mandate first costs time while {delay} accrues.",
    sequence: [
      "Separate the mandate question — whose decision is {decision} — from the substantive question, in writing.",
      "Obtain agreement between the conflicting parties on the mandate alone, witnessed by the governing body if needed.",
      "Let the mandated owner decide the substantive question without re-negotiation.",
      "Record both the mandate and the decision by {deadline} so the next instance of this class does not restart the conflict.",
    ],
  },
  risk_blindness: {
    diagnosis: "Warning signals around {decision} are being individually explained away: the pattern of dismissal is itself the finding, and {constraint} means the signals' mitigation options expire while confidence holds.",
    tension: "The tension is conviction versus instrumentation: the team's reported confidence and the measured signals diverge, and the organisation is currently demanding more proof from the warning than from the plan.",
    sequence: [
      "Take the strongest dismissed signal touching {decision} and run a pre-mortem: assume it fired, and write the post-incident review now.",
      "Act on the cheapest prevention the pre-mortem names, with {owner} accountable for it.",
      "Instrument the signal so its movement is measured rather than debated, with thresholds tied to {delay}.",
      "Re-review at {deadline}; a second dismissal without investigation escalates automatically.",
    ],
  },
  strategic_overreach: {
    diagnosis: "{decision} adds ambition without subtraction: the bet list grows while nothing is formally abandoned, and {constraint} means the core is funding expansion precisely while the expansion erodes it.",
    tension: "The tension is optionality versus focus: every retained bet preserves a story, and collectively they guarantee under-delivery on the bets that matter — including the core.",
    sequence: [
      "Rank the bets inside {decision} by strategic necessity, scored against the core's health rather than against each other.",
      "Fully fund the top of the list; formally abandon — not defer — the bottom, with {owner} signing the abandonment.",
      "Re-state the core-business guardrail metrics that expansion may not breach, referencing {delay}.",
      "Review the guardrails by {deadline}; any breach pulls investment back to the core before the next cycle.",
    ],
  },
  operational_bottleneck: {
    diagnosis: "{decision} queues behind a single point of approval: throughput is capped by one person's capacity, and {constraint} shows the routing — not the workload — is the binding problem.",
    tension: "The tension is control versus throughput: the bottleneck's involvement genuinely reduces error on the cases it reaches, while silently rationing every case it does not.",
    sequence: [
      "Define the two decision classes inside {decision} that no longer require the bottleneck's approval, with written thresholds.",
      "Delegate them to named owners — starting with {owner} — and publish the thresholds.",
      "Refuse the test escalations that will arrive in the first two weeks; each refusal is the delegation taking hold.",
      "Measure queue time before and after by {deadline}; reversal of delegated decisions more than once reopens the design.",
    ],
  },
  market_uncertainty: {
    diagnosis: "{decision} is stalled on unknowable demand: the uncertainty is real but is being met with prediction instead of exposure, and {constraint} ensures the window narrows while analysis accumulates.",
    tension: "The tension is evidence versus window: certainty arrives only after the market resolves it — usually through a competitor — while moving now means betting under stated, bounded uncertainty.",
    sequence: [
      "Design the smallest real commitment inside {decision} that produces genuine market evidence rather than opinion.",
      "Pre-agree the continue/kill threshold and who calls it — {owner} — before any spend.",
      "Bound the exposure explicitly against {delay} so the bet cannot silently grow.",
      "At {deadline}, honour the threshold as written; arguing to move it after the fact is the failure mode this sequence exists to prevent.",
    ],
  },
  governance_failure: {
    diagnosis: "The breach inside {decision} is a system reading, not an individual failing: a control existed in policy and failed in practice, and {constraint} indicates the detection gap is older than this incident.",
    tension: "The tension is accountability versus learning: assigning individual blame closes the incident fast and leaves the control gap open; fixing the system first feels slow while exposure continues.",
    sequence: [
      "Trace the control that should have caught the breach in {decision} and determine whether it failed by design or by enforcement.",
      "Fix the detection gap first — the organisation must find the next instance before the regulator does.",
      "Assign remediation with dated owners, starting with {owner}, and report status against {deadline}.",
      "Verify the fix with a deliberate test of the control, not with the absence of further incidents.",
    ],
  },
  commitment_avoidance: {
    diagnosis: "{decision} has agreement without commitment: approvals arrive hedged, no resource moves, and {constraint} makes the deferral feel prudent while it quietly compounds {delay}.",
    tension: "The tension is optionality versus cost: keeping the decision open preserves flexibility that feels valuable, while every cycle of openness re-spends the planning capacity and stalls execution.",
    sequence: [
      "Restate {decision} as a costed commitment: the resource that moves, the date it moves, and the named owner.",
      "Put the costed version in front of {owner} for a yes that moves resource or a no that ends the question.",
      "Treat refusal to attach resource as the real answer and record it as such.",
      "If the same question returns a third cycle without movement by {deadline}, escalate it as a governance issue, not a planning one.",
    ],
  },
  false_consensus: {
    diagnosis: "The agreement around {decision} is performative: the room aligns quickly while execution and corridor conversation diverge, and {constraint} suggests dissent has somewhere safer to live than the meeting.",
    tension: "The tension is harmony versus truth: the fastest agreement is appearing on the most consequential items, which is the signature of silence, not alignment.",
    sequence: [
      "Require each principal to write the strongest case against {decision} before it is ratified.",
      "Treat an empty page as a warning signal and have {owner} probe it directly.",
      "Ratify only after the written objections have been answered on the record.",
      "Watch execution against the agreed position until {deadline}; quiet contradiction in delivery is the escalation trigger.",
    ],
  },
  decision_paralysis: {
    diagnosis: "{decision} is frozen, not pending: the option set has been stable while deciding keeps restarting, and {constraint} means the daily default — the status quo — is itself the most expensive option on the table.",
    tension: "The tension is completeness versus motion: every additional review buys imagined safety while {delay} accrues in reality; no new information is actually expected to arrive.",
    sequence: [
      "Eliminate options under {decision} down to two, using the desired outcome — {outcome} — as the only filter.",
      "Set a decision date inside ten working days and name {owner} as the decider.",
      "Pre-agree the default that executes automatically if the date passes undecided.",
      "Record the decision and its basis by {deadline}; reopening it requires new information, not new discomfort.",
    ],
  },
};

export function composeCaseDerivedJudgement(input: DecisionCaseInput): CaseDerivedJudgementResult {
  const classification = classifyDecisionPattern(input);
  if (classification.status === "insufficient_pattern_evidence") {
    return classification;
  }

  const profile = DECISION_PATTERN_PROFILES[classification.primaryPattern];
  const frame = PATTERN_FRAMES[classification.primaryPattern];
  const facts: CaseFacts = {
    decision: trimOrFallback(input.decisionDescription, "the decision under review"),
    constraint: trimOrFallback(input.constraint, "the stated constraint"),
    owner: input.stakeholders[0]?.trim() || "the accountable owner",
    deadline: trimOrFallback(input.deadline, "the next review point"),
    delay: trimOrFallback(input.consequenceOfDelay, "the stated cost of delay"),
    outcome: trimOrFallback(input.desiredOutcome, "the stated desired outcome"),
  };

  const secondaryNote = classification.secondaryPatterns.length > 0
    ? ` A secondary ${classification.secondaryPatterns.join(" and ")} signal is present and may become primary if the case evolves.`
    : "";

  const judgement: CaseDerivedJudgement = {
    primaryDiagnosis: bind(frame.diagnosis, facts) + secondaryNote,
    decisionTension: bind(frame.tension, facts),
    commercialConsequence: `${profile.commercialConsequence} In this case the stated exposure is ${facts.delay}.`,
    recommendedNextMove: `${profile.recommendedIntervention} For ${facts.decision}, that responsibility sits with ${facts.owner} as the accountable owner, to be visibly underway within 48 hours.`,
    falsificationChallenge: `${profile.falsificationQuestion} Test it against ${facts.decision} before acting on this judgement.`,
    escalationTrigger: profile.escalationTrigger,
    executionSequence: frame.sequence.map((step) => bind(step, facts)),
    patternBasis: classification.evidenceMatched,
    confidence: classification.confidence,
    limitations: [
      `This judgement classifies the case as ${classification.primaryPattern} from ${classification.evidenceMatched.length} matched input signal${classification.evidenceMatched.length === 1 ? "" : "s"}; signals absent from the input could not be weighed.`,
      `The common false move for this pattern — ${profile.commonFalseMove.toLowerCase()} — was assumed avoidable; if it is already underway, the sequence above needs re-sequencing.`,
      ...classification.uncertainty,
    ],
  };

  return { status: "judged", classification, judgement };
}

function bind(template: string, facts: CaseFacts): string {
  return template
    .replaceAll("{decision}", facts.decision)
    .replaceAll("{constraint}", facts.constraint)
    .replaceAll("{owner}", facts.owner)
    .replaceAll("{deadline}", facts.deadline)
    .replaceAll("{delay}", facts.delay)
    .replaceAll("{outcome}", facts.outcome);
}

function trimOrFallback(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}
