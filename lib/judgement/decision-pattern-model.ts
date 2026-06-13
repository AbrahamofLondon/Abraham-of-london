/**
 * Universal Decision Pattern Model.
 *
 * The judgement engine's vocabulary of decision pathologies. Each pattern
 * carries a diagnostic signature (the textual signals that betray it), the
 * symptoms it produces, the false move organisations typically make, the
 * commercial consequence of leaving it unworked, the intervention that
 * actually addresses it, the question that would falsify the diagnosis,
 * and the trigger that demands escalation.
 *
 * The model exists so that materially different cases produce materially
 * different judgement: diagnosis, tension, risk, consequence, next move,
 * escalation, falsification, and execution sequence all derive from the
 * classified pattern, not from a shared template.
 */

export type DecisionPattern =
  | "ownership_ambiguity"
  | "pricing_pressure"
  | "execution_drift"
  | "stakeholder_misalignment"
  | "resource_constraint"
  | "timing_pressure"
  | "evidence_gap"
  | "authority_conflict"
  | "risk_blindness"
  | "strategic_overreach"
  | "operational_bottleneck"
  | "market_uncertainty"
  | "governance_failure"
  | "commitment_avoidance"
  | "false_consensus"
  | "decision_paralysis";

export interface DecisionPatternProfile {
  pattern: DecisionPattern;
  diagnosticSignature: string[];
  likelySymptoms: string[];
  commonFalseMove: string;
  commercialConsequence: string;
  recommendedIntervention: string;
  falsificationQuestion: string;
  escalationTrigger: string;
}

export const DECISION_PATTERN_PROFILES: Record<DecisionPattern, DecisionPatternProfile> = {
  ownership_ambiguity: {
    pattern: "ownership_ambiguity",
    diagnosticSignature: ["unclear who owns", "ownership", "no single owner", "sits between", "nobody accountable", "whose call", "unclear authority", "shared responsibility", "owner is unclear"],
    likelySymptoms: ["Two functions each assume the other will decide", "Meetings end without an accountable name", "The decision restarts every time a new voice joins"],
    commonFalseMove: "Commissioning more analysis, which feels like progress but lets the ownership vacuum persist.",
    commercialConsequence: "An unowned decision is made by default — by the calendar, by the loudest function, or by a competitor — and accountability arrives only at post-mortem.",
    recommendedIntervention: "Force ownership assignment before any further analysis: one name, written, with the explicit right to decide against either function's preference.",
    falsificationQuestion: "If a single accountable owner were named tomorrow, would the decision still be stuck? If yes, ownership is not the binding constraint and this diagnosis is wrong.",
    escalationTrigger: "Escalate when no owner can be named within one working week, or when two functions both claim — or both refuse — the decision in writing.",
  },
  pricing_pressure: {
    pattern: "pricing_pressure",
    diagnosticSignature: ["pricing", "price", "discount", "margin", "undercut", "willingness to pay", "value capture", "competitor pricing", "renewal pricing"],
    likelySymptoms: ["Discounting decisions made ad hoc at the edge", "Margin erosion explained case-by-case", "Sales and finance hold different theories of customer willingness"],
    commonFalseMove: "Matching the competitor's price across the board, converting a segmentation problem into a margin problem.",
    commercialConsequence: "Every month without a priced hypothesis converts willingness-to-pay you could have captured into margin permanently surrendered.",
    recommendedIntervention: "Write a falsifiable pricing hypothesis — which segment, what value metric, what boundary — and test it on the next ten live deals rather than debating it in the abstract.",
    falsificationQuestion: "What observed customer behaviour — not internal opinion — would prove the current price is actually the reason deals are moving away?",
    escalationTrigger: "Escalate when discounting breaches the stated floor twice in one quarter, or when renewal pricing decisions start being made deal-by-deal without a recorded rationale.",
  },
  execution_drift: {
    pattern: "execution_drift",
    diagnosticSignature: ["promised but not", "keeps slipping", "drift", "not happening", "stalled initiative", "no follow-through", "committed work", "still not done", "quietly dropped"],
    likelySymptoms: ["Committed work resurfaces in every planning cycle untouched", "Status reports stay green while delivery dates move", "The same initiative is re-announced under a new name"],
    commonFalseMove: "Re-planning the work with a fresh timeline, which resets the clock without touching the reason it drifted.",
    commercialConsequence: "Drift compounds silently: the cost is not the late deliverable but the decisions made elsewhere assuming it had shipped.",
    recommendedIntervention: "Pick the single most consequential drifted commitment and trace why it drifted — capacity, priority, or quiet veto — before re-committing anything.",
    falsificationQuestion: "Name one drifted commitment that was explicitly cancelled rather than quietly dropped. If none exists, the system is hiding drift rather than managing it.",
    escalationTrigger: "Escalate when the same commitment slips a third cycle, or when downstream teams begin planning around the assumption that commitments will not hold.",
  },
  stakeholder_misalignment: {
    pattern: "stakeholder_misalignment",
    diagnosticSignature: ["conflicting answers", "misalignment", "different priorities", "pulling in different directions", "not aligned", "diverging", "each lead", "competing agendas"],
    likelySymptoms: ["Leads agree in the room and diverge in execution", "The same question gets materially different answers across the team", "Cross-functional work queues behind unstated disagreements"],
    commonFalseMove: "Holding an alignment workshop that produces a shared slide and no shared commitments.",
    commercialConsequence: "Misaligned leads spend the organisation's execution capacity against each other; the customer experiences the disagreement as inconsistency.",
    recommendedIntervention: "Surface the divergence explicitly: collect each lead's written answer to the same three questions, put the conflicts side by side, and resolve them one at a time with the accountable executive.",
    falsificationQuestion: "Would the leads' written answers to 'what is this quarter's top priority' actually differ? If they match, the misalignment is somewhere else — likely in incentives, not understanding.",
    escalationTrigger: "Escalate when written answers diverge on priority or ownership a second time after explicit reconciliation, or when a lead executes against the agreed position.",
  },
  resource_constraint: {
    pattern: "resource_constraint",
    diagnosticSignature: ["hiring freeze", "headcount", "capacity", "budget cut", "can't staff", "resource", "too few people", "stretched", "overcommitted team"],
    likelySymptoms: ["Everything is priority one because nothing has been de-scoped", "Key people appear on every critical path", "Quality and deadlines degrade together"],
    commonFalseMove: "Spreading the constraint evenly across all work, guaranteeing everything ships late instead of something shipping well.",
    commercialConsequence: "An unprioritised constraint taxes every initiative at once; the organisation pays full cost for partial delivery everywhere.",
    recommendedIntervention: "Cut scope before cutting corners: rank the active commitments, explicitly stop the bottom of the list, and re-sequence what remains around the scarcest capacity.",
    falsificationQuestion: "Which piece of work has actually been stopped — not paused, stopped — since the constraint appeared? If the answer is none, the constraint has not yet been managed.",
    escalationTrigger: "Escalate when the constraint forces a choice between commitments made to customers, or when the stop-list requires authority above the current owner.",
  },
  timing_pressure: {
    pattern: "timing_pressure",
    diagnosticSignature: ["deadline", "expires", "runs out", "by friday", "end of quarter", "window closes", "slipping", "launch date", "time pressure", "overdue"],
    likelySymptoms: ["The date is fixed while the scope is not", "Work is being re-ordered by panic rather than dependency", "Quality gates are being waived informally"],
    commonFalseMove: "Working backwards from the date with optimistic estimates, which converts a hard deadline into a guaranteed surprise.",
    commercialConsequence: "A missed external date costs trust once; a date met by silently cutting the wrong scope costs trust every week after delivery.",
    recommendedIntervention: "Split the deadline into what is truly date-fixed and what is negotiable, then decide the cut: scope, quality bar, or date — explicitly, by the owner, in writing.",
    falsificationQuestion: "What exactly happens on the day after the deadline is missed? If nobody can state the concrete consequence, the deadline may be softer than the panic suggests.",
    escalationTrigger: "Escalate when meeting the date requires waiving a safety, compliance, or contractual gate, or when the third re-plan still shows the date unreachable.",
  },
  evidence_gap: {
    pattern: "evidence_gap",
    diagnosticSignature: ["contradict", "conflicting data", "no data", "don't know", "unverified", "models disagree", "estimates differ", "evidence is thin", "two models"],
    likelySymptoms: ["Two credible models point in opposite directions", "Conviction substitutes for measurement", "The same dataset supports both sides of the argument"],
    commonFalseMove: "Choosing the model that supports the preferred conclusion and calling the matter evidence-based.",
    commercialConsequence: "Deciding on contradictory evidence means one function's model is wrong and the organisation will pay to discover which one in production.",
    recommendedIntervention: "Reconcile the contradiction before deciding: identify the one assumption on which the models diverge, and buy the cheapest piece of real-world evidence that discriminates between them.",
    falsificationQuestion: "What single measurable fact, if known, would collapse the disagreement? If no such fact exists, the dispute is about values, not evidence — a different problem.",
    escalationTrigger: "Escalate when the discriminating evidence cannot be obtained before the decision must be made, forcing an explicit bet under stated uncertainty.",
  },
  authority_conflict: {
    pattern: "authority_conflict",
    diagnosticSignature: ["board disagrees", "overruled", "intervened", "conflict between", "two executives", "veto", "competing mandates", "chair and ceo", "governance dispute"],
    likelySymptoms: ["Decisions are reopened by parties who were absent when they were made", "Executives seek pre-approval informally to avoid public conflict", "The org reads silence between principals as a stop signal"],
    commonFalseMove: "Splitting the difference between the conflicting authorities, producing a compromise neither would defend under pressure.",
    commercialConsequence: "While two authorities contest the decision, the organisation executes neither view — and learns that decisions are provisional, which slows every future commitment.",
    recommendedIntervention: "Resolve the mandate, not the issue: get the conflicting parties to agree in writing whose decision this class of question is, then let that person decide this instance.",
    falsificationQuestion: "Is there a written mandate that already answers whose decision this is? If yes, the conflict is defiance, not ambiguity — and needs a different response.",
    escalationTrigger: "Escalate to the governing body when the mandate question itself is contested, or when either party acts unilaterally while the mandate is unresolved.",
  },
  risk_blindness: {
    pattern: "risk_blindness",
    diagnosticSignature: ["ignoring warning", "known issue", "red flag", "dismissed concern", "confidence stayed", "no one is investigating", "optimism", "warning signs", "failure signals"],
    likelySymptoms: ["Leading indicators are explained away individually", "Reported confidence and measured results diverge", "The person raising the risk is managed instead of the risk"],
    commonFalseMove: "Requiring more certainty from the warning than from the plan, so the risk must fully materialise before it is acted on.",
    commercialConsequence: "Risks ignored at signal stage return at incident stage, with the original mitigation options expired and the cost multiplied.",
    recommendedIntervention: "Take the strongest dismissed signal and force a pre-mortem on it: assume it fired, write what the post-incident review would say, and act on the cheapest prevention it names.",
    falsificationQuestion: "What evidence would have to appear for the team to act on this signal? If the honest answer is 'the failure itself', blindness is confirmed.",
    escalationTrigger: "Escalate when a signal touches customer safety, regulatory exposure, or irreversible commitments, or when the same signal is dismissed twice without investigation.",
  },
  strategic_overreach: {
    pattern: "strategic_overreach",
    diagnosticSignature: ["expand into", "new market and", "simultaneously", "all at once", "ambitious", "too many bets", "stretch goal", "transformation", "everything this year"],
    likelySymptoms: ["The strategy lists destinations without naming what is given up", "Every initiative is strategic so none can be cut", "Capacity math is treated as pessimism"],
    commonFalseMove: "Scaling the ambition to motivate the team, which converts a focus problem into a credibility problem when targets are missed.",
    commercialConsequence: "Overreach spends real position in the core to buy options elsewhere; the core erodes precisely when it is funding the adventure.",
    recommendedIntervention: "Force the sacrifice question: rank the bets by strategic necessity, fully fund the top of the list, and formally abandon — not defer — the bottom.",
    falsificationQuestion: "Which existing commitment was explicitly ended to fund the new ambition? If nothing was ended, the strategy is addition, not choice.",
    escalationTrigger: "Escalate when core-business metrics begin degrading while expansion bets are still pre-revenue, or when the bet list grows within a single planning cycle.",
  },
  operational_bottleneck: {
    pattern: "operational_bottleneck",
    diagnosticSignature: ["everything goes through", "founder approves", "single point", "waiting on one person", "bottleneck", "delegation", "queue behind", "only person who"],
    likelySymptoms: ["Throughput is capped by one calendar", "Delegation is announced but approvals quietly return", "Senior people do work their teams were hired to do"],
    commonFalseMove: "Hiring around the bottleneck while leaving every decision routed through it, which adds cost without adding throughput.",
    commercialConsequence: "The organisation's growth asymptotes at the bottleneck's personal capacity; everything else paid for is partially idle.",
    recommendedIntervention: "Remove the route, not the person: define the two decision classes that no longer require the bottleneck's approval, delegate them with written thresholds, and refuse the escalations that test it.",
    falsificationQuestion: "In the last month, what decision of real consequence was made without the bottleneck's involvement and stood? If none, delegation exists on paper only.",
    escalationTrigger: "Escalate when the bottleneck's queue starts costing external commitments, or when delegated decisions are reversed more than once without stated cause.",
  },
  market_uncertainty: {
    pattern: "market_uncertainty",
    diagnosticSignature: ["market entry", "uncertain demand", "unproven market", "no clear signal", "competitive response unknown", "regulatory uncertainty", "new geography", "untested segment"],
    likelySymptoms: ["Forecasts diverge by multiples rather than percentages", "The debate recycles the same opinions without new information", "Analysis is being purchased where exposure should be"],
    commonFalseMove: "Commissioning a larger market study, deferring the decision while the window and the team's conviction both decay.",
    commercialConsequence: "Waiting for certainty in an uncertain market means entering after the uncertainty has been resolved — by someone else's success.",
    recommendedIntervention: "Replace prediction with exposure: design the smallest real commitment that produces genuine market evidence, with a pre-agreed continue/kill threshold.",
    falsificationQuestion: "What market evidence would change the decision? If no evidence would, the uncertainty is rhetorical and the real blocker is appetite, not information.",
    escalationTrigger: "Escalate when the entry bet requires capacity already committed to the core, or when the kill threshold is reached and the bet's sponsor argues to move it.",
  },
  governance_failure: {
    pattern: "governance_failure",
    diagnosticSignature: ["compliance", "breach", "audit finding", "control failed", "policy ignored", "regulator", "no oversight", "unauthorised", "governance gap"],
    likelySymptoms: ["Controls exist in policy and not in practice", "Exceptions outnumber the rule", "The first complete account of an incident is assembled for the regulator, not for management"],
    commonFalseMove: "Adding a new policy on top of the unenforced one, increasing documented obligations without increasing actual control.",
    commercialConsequence: "A control that fails silently converts ordinary operational errors into reportable events, personal liability, and licence-to-operate risk.",
    recommendedIntervention: "Treat the breach as a system reading, not an individual failing: trace the control that should have caught it, fix the detection gap first, then assign remediation with dated owners.",
    falsificationQuestion: "Would the existing control have caught this incident if everyone had followed it? If yes, the failure is enforcement; if no, the failure is design — the remediations differ completely.",
    escalationTrigger: "Escalate immediately when the breach is reportable, repeats after remediation, or when any party suggests managing the record rather than the cause.",
  },
  commitment_avoidance: {
    pattern: "commitment_avoidance",
    diagnosticSignature: ["keeps options open", "revisit later", "no commitment", "won't sign off", "provisional", "hedge", "soft yes", "agreed in principle"],
    likelySymptoms: ["Approvals arrive with conditions that defer them", "Decisions are 'made' but no resource moves", "Everyone agrees in principle and nothing changes in practice"],
    commonFalseMove: "Seeking yet another round of socialisation, mistaking the absence of objection for the presence of commitment.",
    commercialConsequence: "Unmade commitments consume planning capacity forever: every cycle re-litigates the same question while execution waits.",
    recommendedIntervention: "Convert the soft yes into a costed yes: attach the resource movement, the date, and the named owner to the decision, and treat refusal to attach them as the real answer.",
    falsificationQuestion: "What resource — money, people, calendar — actually moved after the last 'agreement'? If nothing moved, nothing was agreed.",
    escalationTrigger: "Escalate when the same decision passes through three cycles without resource movement, or when avoidance starts costing a dated external opportunity.",
  },
  false_consensus: {
    pattern: "false_consensus",
    diagnosticSignature: ["everyone agrees", "no objections", "silent room", "nodding", "alignment illusion", "agreement in meetings", "no dissent", "harmony"],
    likelySymptoms: ["Agreement is fastest on the most consequential items", "Dissent appears in corridors and direct messages, never in the room", "Execution quietly contradicts the agreed position"],
    commonFalseMove: "Celebrating the alignment and accelerating, which spends the disagreement later at execution speed.",
    commercialConsequence: "False consensus defers conflict to the most expensive possible moment — after commitment, in front of customers, under deadline.",
    recommendedIntervention: "Manufacture safe dissent: require each principal to write the strongest case against the decision before it is ratified, and treat an empty page as a warning, not a confirmation.",
    falsificationQuestion: "When did this group last change a decision because someone disagreed in the room? If the answer is never, silence is compliance, not consensus.",
    escalationTrigger: "Escalate when execution behaviour contradicts the agreed position, or when private dissent reaches the sponsor through any channel other than the room.",
  },
  decision_paralysis: {
    pattern: "decision_paralysis",
    diagnosticSignature: ["can't decide", "six weeks", "still deciding", "frozen", "no decision", "deliberating", "another review", "deferred again", "paralysis"],
    likelySymptoms: ["The option set is stable while the deciding keeps restarting", "New analysis is requested that no one expects to change the answer", "The cost of deciding is weighed; the cost of not deciding is not"],
    commonFalseMove: "Widening the option set to be safe, which multiplies the comparison space and deepens the freeze.",
    commercialConsequence: "Paralysis is a decision for the status quo made daily without anyone owning it — it pays the worst option's cost without its accountability.",
    recommendedIntervention: "Shrink and timebox: eliminate options to two, set a decision date inside ten working days, and pre-agree what happens by default if the date passes undecided.",
    falsificationQuestion: "What new information arrived since the last deferral that the next deferral is waiting for? If none can be named, more time will not produce a different decision.",
    escalationTrigger: "Escalate when the default-by-inaction outcome is worse than either live option, or when the decision date passes and the pre-agreed default is itself contested.",
  },
};

export function getDecisionPatternProfile(pattern: DecisionPattern): DecisionPatternProfile {
  return DECISION_PATTERN_PROFILES[pattern];
}

export const ALL_DECISION_PATTERNS = Object.keys(DECISION_PATTERN_PROFILES) as DecisionPattern[];
