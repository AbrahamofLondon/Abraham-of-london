/**
 * Golden Decision Scenario Test Set.
 *
 * Twelve materially different decision cases with expected dominant
 * patterns and unacceptable generic-output markers. The judgement
 * differentiation gate runs every Wave 1 composer against these scenarios
 * and fails if cross-case judgement converges or template language leaks
 * across patterns.
 */

import type { DecisionPattern } from "@/lib/judgement/decision-pattern-model";
import type { DecisionCaseInput } from "@/lib/judgement/classify-decision-pattern";

export interface GoldenDecisionScenario {
  id: string;
  title: string;
  caseInput: DecisionCaseInput;
  expectedPrimaryPattern: DecisionPattern;
  acceptableSecondaryPatterns: DecisionPattern[];
  /** Phrases whose appearance in this scenario's output betrays template judgement. */
  unacceptableGenericMarkers: string[];
}

/** Template phrases from the pre-engine composers; must never appear anywhere. */
export const GLOBAL_GENERIC_MARKERS = [
  "name the decision owner, the next irreversible choice",
  "smallest reversible move that tests the constraint",
  "test the signal against your own case this week",
  "consider exploring",
  "best practice",
];

export const GOLDEN_DECISION_SCENARIOS: GoldenDecisionScenario[] = [
  {
    id: "pricing-ownership",
    title: "Pricing ownership ambiguity",
    caseInput: {
      decisionDescription: "the enterprise pricing change, where it is unclear who owns the call because pricing sits between sales and finance and there is no single owner",
      stakeholders: ["the commercial director", "VP Sales", "Finance Director"],
      deadline: "the Q3 renewal cycle opening in five weeks",
      evidenceAvailable: ["March churn analysis", "two enterprise renewal objections citing price", "meeting notes show no single owner and unclear authority"],
      constraint: "unclear authority: nobody accountable will sign a price floor while both functions claim a veto",
      desiredOutcome: "a priced enterprise offer one accountable person defends",
      priorAttempts: ["three pricing committee meetings ended without an accountable name", "the ownership question was deferred each time"],
      consequenceOfDelay: "Q3 enterprise renewal revenue repricing by default at renewal",
      optionsUnderConsideration: ["hold price", "match competitor", "segment-based floor"],
    },
    expectedPrimaryPattern: "ownership_ambiguity",
    acceptableSecondaryPatterns: ["pricing_pressure", "authority_conflict"],
    unacceptableGenericMarkers: ["rank every active commitment", "pre-mortem"],
  },
  {
    id: "hiring-freeze",
    title: "Hiring freeze prioritisation",
    caseInput: {
      decisionDescription: "how to re-plan engineering delivery under the hiring freeze now that headcount is fixed and the team is stretched across five committed workstreams",
      stakeholders: ["the COO", "VP Engineering"],
      deadline: "the platform launch window in nine weeks",
      evidenceAvailable: ["capacity model showing 140% allocation", "burn-rate forecast"],
      constraint: "capacity cannot grow and no workstream has been de-scoped",
      desiredOutcome: "a delivery plan the remaining team can actually execute",
      priorAttempts: ["asked every team to find 10% efficiency — nothing was stopped"],
      consequenceOfDelay: "the launch slips while every workstream degrades together",
      optionsUnderConsideration: ["cut two workstreams", "slip the launch", "contract out the platform work"],
    },
    expectedPrimaryPattern: "resource_constraint",
    acceptableSecondaryPatterns: ["timing_pressure", "decision_paralysis"],
    unacceptableGenericMarkers: ["force ownership assignment", "pricing hypothesis"],
  },
  {
    id: "board-disagreement",
    title: "Board disagreement over expansion",
    caseInput: {
      decisionDescription: "the European expansion approval, where the board disagrees with the executive team and the chair and CEO have publicly different positions",
      stakeholders: ["the chair", "the CEO", "two non-executive directors"],
      deadline: "the next board meeting in three weeks",
      evidenceAvailable: ["expansion business case", "dissenting NED memo"],
      constraint: "the board has intervened twice to pause commitments the CEO believed were within mandate",
      desiredOutcome: "a decision that is made once and is not reopened",
      priorAttempts: ["a compromise scope was drafted and both sides rejected it"],
      consequenceOfDelay: "the acquisition target in the region is courting another buyer",
      optionsUnderConsideration: ["proceed under CEO mandate", "defer to board vote", "renegotiate the mandate"],
    },
    expectedPrimaryPattern: "authority_conflict",
    acceptableSecondaryPatterns: ["stakeholder_misalignment", "strategic_overreach"],
    unacceptableGenericMarkers: ["stop-list", "pre-mortem"],
  },
  {
    id: "market-entry",
    title: "Market entry uncertainty",
    caseInput: {
      decisionDescription: "the market entry into the Gulf region, an unproven market with uncertain demand where the competitive response is unknown",
      stakeholders: ["the strategy director", "regional GM candidate"],
      deadline: "the partner's exclusivity offer lapses in eight weeks",
      evidenceAvailable: ["one analyst report", "three discovery calls with prospective customers"],
      constraint: "forecasts from the two advisers differ by a factor of four",
      desiredOutcome: "a bounded entry decision with a pre-agreed kill threshold",
      priorAttempts: ["a second market study was commissioned and changed no one's view"],
      consequenceOfDelay: "the exclusivity lapses and entry would then be against an installed rival",
      optionsUnderConsideration: ["pilot with the partner", "full entry", "decline the region"],
    },
    expectedPrimaryPattern: "market_uncertainty",
    acceptableSecondaryPatterns: ["evidence_gap", "strategic_overreach"],
    unacceptableGenericMarkers: ["force ownership assignment", "written answer to the same three questions"],
  },
  {
    id: "deadline-slippage",
    title: "Delivery deadline slippage",
    caseInput: {
      decisionDescription: "the client migration launch date, which is slipping for the second time while the contractual deadline holds and quality gates are being waived informally",
      stakeholders: ["the delivery director", "the client partner"],
      deadline: "the contractual go-live on the first of next month",
      evidenceAvailable: ["burn-down showing 60% scope complete", "defect trend rising"],
      constraint: "the date is contractually fixed while the scope definition is not",
      desiredOutcome: "a go-live that survives the first month of production load",
      priorAttempts: ["two re-plans moved internal milestones but not the critical path"],
      consequenceOfDelay: "contractual penalties and the client's yearly freeze window closing",
      optionsUnderConsideration: ["descope phase two features", "negotiate two-week extension", "go live with known defects"],
    },
    expectedPrimaryPattern: "timing_pressure",
    acceptableSecondaryPatterns: ["execution_drift", "risk_blindness"],
    unacceptableGenericMarkers: ["kill threshold", "force ownership assignment"],
  },
  {
    id: "founder-delegation",
    title: "Founder delegation failure",
    caseInput: {
      decisionDescription: "fixing the approval flow where everything goes through the founder — the founder approves every hire, discount, and design call, and delegation keeps reverting",
      stakeholders: ["the founder", "the newly hired COO"],
      deadline: "the COO's first-100-days review next month",
      evidenceAvailable: ["approval queue averaging nine days", "two senior leaders citing the bottleneck in exit interviews"],
      constraint: "every decision class still routes through one calendar despite the delegation announcement",
      desiredOutcome: "decisions of defined classes made and standing without founder involvement",
      priorAttempts: ["a delegation matrix was published and approvals quietly returned to the founder"],
      consequenceOfDelay: "the COO hire fails and the leadership pipeline keeps draining",
      optionsUnderConsideration: ["written approval thresholds", "chief of staff filter", "keep current flow"],
    },
    expectedPrimaryPattern: "operational_bottleneck",
    acceptableSecondaryPatterns: ["commitment_avoidance", "ownership_ambiguity"],
    unacceptableGenericMarkers: ["pricing hypothesis", "stop-list"],
  },
  {
    id: "team-misalignment",
    title: "Team misalignment after reorganisation",
    caseInput: {
      decisionDescription: "resolving the operations leadership split where the five team leads give conflicting answers about this quarter's priority and are pulling in different directions since the reorganisation",
      stakeholders: ["the operations director", "five team leads"],
      deadline: "the quarterly commitments lock in three weeks",
      evidenceAvailable: ["five 1:1 notes with materially different priority lists", "two cross-team handoffs that failed last sprint"],
      constraint: "the leads agree in meetings and then execute different priorities",
      desiredOutcome: "one written priority order all five leads execute against",
      priorAttempts: ["an offsite produced a shared slide and no shared commitments"],
      consequenceOfDelay: "the quarter locks with teams committed to incompatible plans",
      optionsUnderConsideration: ["forced ranking workshop", "director dictates the order", "restructure the teams"],
    },
    expectedPrimaryPattern: "stakeholder_misalignment",
    acceptableSecondaryPatterns: ["false_consensus", "ownership_ambiguity"],
    unacceptableGenericMarkers: ["kill threshold", "pre-mortem"],
  },
  {
    id: "evidence-conflict",
    title: "Evidence conflict between models",
    caseInput: {
      decisionDescription: "the warehouse automation investment, where the two models disagree — the finance model and the operations model contradict each other on payback by a factor of three",
      stakeholders: ["the CFO", "the operations director"],
      deadline: "the capex committee sitting in six weeks",
      evidenceAvailable: ["finance payback model", "operations throughput model", "vendor reference visits"],
      constraint: "both models are internally consistent and share no common assumption base",
      desiredOutcome: "a capex decision grounded in evidence both functions accept",
      priorAttempts: ["a joint workshop restated each model's assumptions without reconciling them"],
      consequenceOfDelay: "the vendor's price lock expires and the peak season window closes",
      optionsUnderConsideration: ["fund a two-aisle pilot", "approve full automation", "reject and revisit next year"],
    },
    expectedPrimaryPattern: "evidence_gap",
    acceptableSecondaryPatterns: ["decision_paralysis", "timing_pressure"],
    unacceptableGenericMarkers: ["force ownership assignment", "written case against"],
  },
  {
    id: "budget-cut",
    title: "Budget cut response paralysis",
    caseInput: {
      decisionDescription: "allocating the 20% budget reduction, where leadership can't decide between the three cut options and has been deliberating for six weeks with another review scheduled",
      stakeholders: ["the managing director", "the finance director"],
      deadline: "the revised budget is due to the group in two weeks",
      evidenceAvailable: ["three costed cut options, stable since week one", "group directive memo"],
      constraint: "every deferral has been justified by asking for another review that produced no new information",
      desiredOutcome: "a signed allocation of the reduction across the three options",
      priorAttempts: ["the decision was deferred again at each of the last four leadership meetings"],
      consequenceOfDelay: "the group imposes a uniform cut that everyone agrees is the worst outcome",
      optionsUnderConsideration: ["protect delivery and cut marketing", "uniform 20% cut", "cut the lowest-margin service line"],
    },
    expectedPrimaryPattern: "decision_paralysis",
    acceptableSecondaryPatterns: ["resource_constraint", "commitment_avoidance"],
    unacceptableGenericMarkers: ["pricing hypothesis", "pre-mortem"],
  },
  {
    id: "launch-risk",
    title: "Product launch risk blindness",
    caseInput: {
      decisionDescription: "whether to hold the product launch while the team is ignoring warning signs — load-test red flags and a dismissed concern from support about data migration failures",
      stakeholders: ["the product director", "the engineering lead"],
      deadline: "the announced launch date in four weeks",
      evidenceAvailable: ["two failed load tests explained away as environment issues", "support's migration defect log"],
      constraint: "reported confidence stayed at green while every leading indicator degraded",
      desiredOutcome: "a launch decision that prices the known failure signals",
      priorAttempts: ["the engineer who raised the red flag was moved to another workstream"],
      consequenceOfDelay: "a public launch failure with the migration defects live in customer data",
      optionsUnderConsideration: ["launch as announced", "two-week hardening delay", "staged rollout to 5% of accounts"],
    },
    expectedPrimaryPattern: "risk_blindness",
    acceptableSecondaryPatterns: ["timing_pressure", "false_consensus"],
    unacceptableGenericMarkers: ["stop-list", "written answer to the same three questions"],
  },
  {
    id: "churn-drift",
    title: "Customer churn retention drift",
    caseInput: {
      decisionDescription: "the enterprise retention programme that was promised but not delivered — committed work from two quarters ago is still not done and the churn-response initiative has stalled",
      stakeholders: ["the customer success director", "the CRO"],
      deadline: "the three flagship renewals landing next quarter",
      evidenceAvailable: ["churn cohort analysis", "the untouched retention backlog, quietly dropped from two roadmaps"],
      constraint: "the retention commitments survive every planning cycle while delivery keeps slipping",
      desiredOutcome: "the flagship renewals defended by work that actually shipped",
      priorAttempts: ["the programme was re-announced under a new name last quarter with the same backlog"],
      consequenceOfDelay: "the flagship accounts renew against an experience that never improved",
      optionsUnderConsideration: ["cancel and rebuild the programme", "re-commit with dedicated capacity", "manual save-desk for the three renewals"],
    },
    expectedPrimaryPattern: "execution_drift",
    acceptableSecondaryPatterns: ["resource_constraint", "commitment_avoidance"],
    unacceptableGenericMarkers: ["kill threshold", "mandate"],
  },
  {
    id: "compliance-breakdown",
    title: "Compliance control breakdown",
    caseInput: {
      decisionDescription: "responding to the compliance breach where the client-money reconciliation control failed for five months and the audit finding shows the policy was ignored in practice",
      stakeholders: ["the CEO", "the compliance officer", "the audit committee chair"],
      deadline: "the regulator's response window of 28 days",
      evidenceAvailable: ["the audit finding", "five months of unreconciled exception reports"],
      constraint: "the control existed in policy and was never operated; exceptions outnumbered the rule",
      desiredOutcome: "a remediation the regulator accepts and the next audit verifies",
      priorAttempts: ["a new policy was drafted on top of the unenforced one after the previous finding"],
      consequenceOfDelay: "a reportable repeat finding with personal liability for the approved persons",
      optionsUnderConsideration: ["system-enforced reconciliation", "external remediation programme", "disciplinary route only"],
    },
    expectedPrimaryPattern: "governance_failure",
    acceptableSecondaryPatterns: ["risk_blindness", "execution_drift"],
    unacceptableGenericMarkers: ["pricing hypothesis", "kill threshold"],
  },
];
