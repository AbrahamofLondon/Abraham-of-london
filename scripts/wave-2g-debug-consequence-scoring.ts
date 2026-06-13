/**
 * Debug: Check what's being scored for consequenceSpecificity
 */

import { composeDecisionDiagnosticOutput } from "../lib/product/decision-diagnostic-composer";

const partnershipInput = {
  decisionUnderReview:
    "Bring operational/sales specialist into existing technical SaaS business as co-founder (40% equity split, immediate) vs. hire as Head of Operations vs. remain solo founder.",
  decisionOwner: "Solo technical founder, 3-year-old SaaS, $800k ARR, bootstrapped",
  evidenceBasis: [
    "Candidate: 15+ years operations at two venture-backed companies (both exited)",
    "Growth ceiling with current skill set: estimated $5M ARR",
    "Candidate has investor relationships; founder does not",
  ],
  primaryContradiction:
    "Founder needs capital/network but fears loss of control and dilution. Growth speed vs. founder's product philosophy.",
  deadlinePressure: "Candidate considering other venture; 60-day exclusivity window closing in 20 days",
  irreversibleElements: [
    "40% equity grant is permanent",
    "Co-founder relationship likely to define next 5-10 years",
    "Enterprise vs. SMB pivot is structural",
  ],
  desiredOutcome: "Clear decision logic about co-founder value and protective terms",
  priorAttempts: [
    "One serious discussion (ended when founder raised control concerns)",
    "Founder consulted advisor (advised against)",
  ],
  optionsUnderConsideration: [
    "Co-founder: 40% equity, immediate, defined decision authority",
    "Co-founder: 40% equity, vested over 4 years",
    "Head of Operations: $180k salary, 5% equity",
    "Decline partnership, stay solo",
  ],
};

const output = composeDecisionDiagnosticOutput(partnershipInput);

console.log("DEBUG: Consequence Specificity Scoring (Partnership)");
console.log("=".repeat(70));
console.log("\nActual consequenceIfWrong being scored:");
console.log(`"${output.consequenceIfWrong}"`);
console.log(`\nLength: ${output.consequenceIfWrong.length} characters`);

const hasNumbers = /\d+|percent|million|thousand/.test(output.consequenceIfWrong);
console.log(`\nHas numbers/percentages: ${hasNumbers}`);

const isCaseSpecific = output.consequenceIfWrong.length > 50;
console.log(`Is case-specific (> 50 chars): ${isCaseSpecific}`);

const hasOutcome = /will|would|result|lead to|cause/.test(output.consequenceIfWrong.toLowerCase());
console.log(`Has outcome language (will/would/result/lead to/cause): ${hasOutcome}`);

let score = 2;
if (hasNumbers) score += 2;
if (isCaseSpecific) score += 2;
if (hasOutcome) score += 2;

console.log(`\nExpected score: ${Math.min(10, score)}`);

// Also check family
const familyInput = {
  decisionUnderReview:
    "Parent (age 75, declining cognition, diagnosed mild dementia) currently living alone. Options: memory-care facility ($6.5k/month), move in with adult child, hire 24-hour home care ($8k/month), or combination.",
  decisionOwner: "Primary adult child (age 43, lives 15 minutes away)",
  evidenceBasis: [
    "Neuropsychiatric evaluation: mild dementia, 2-3 year decline trajectory",
    "Fall risk assessment: moderate",
    "Financial sustainability: 7-10 years at $8k/month; 15+ years at facility",
    "Family prior pattern: conflict over parent's independence",
  ],
  primaryContradiction:
    "Parent's autonomy vs. safety/clinical needs. Adult child 2's care commitment vs. realistic availability. Family harmony vs. best-outcome safety.",
  deadlinePressure: "Current living situation unsustainable within 60 days. Facility waitlist: 8 months.",
  irreversibleElements: [
    "Staying home too long increases hospitalization risk",
    "Facility placement psychological difficulty",
    "Family relationship rupture risk",
  ],
  desiredOutcome: "Decision framework that weighs autonomy against safety and manages family disagreement",
  priorAttempts: ["Family meeting (ended in frustration)", "Social worker consultation (recommended facility)"],
  optionsUnderConsideration: [
    "Facility now",
    "Home care + clinical supervision for 12 months",
    "Move in with adult child 2 + hired clinical caregiver",
    "Assisted living once available",
  ],
};

const familyOutput = composeDecisionDiagnosticOutput(familyInput);

console.log("\n" + "=".repeat(70));
console.log("DEBUG: Consequence Specificity Scoring (Family)");
console.log("=".repeat(70));
console.log("\nActual consequenceIfWrong being scored:");
console.log(`"${familyOutput.consequenceIfWrong}"`);
console.log(`\nLength: ${familyOutput.consequenceIfWrong.length} characters`);

const familyHasNumbers = /\d+|percent|million|thousand/.test(familyOutput.consequenceIfWrong);
console.log(`\nHas numbers/percentages: ${familyHasNumbers}`);

const familyIsCaseSpecific = familyOutput.consequenceIfWrong.length > 50;
console.log(`Is case-specific (> 50 chars): ${familyIsCaseSpecific}`);

const familyHasOutcome = /will|would|result|lead to|cause/.test(familyOutput.consequenceIfWrong.toLowerCase());
console.log(`Has outcome language (will/would/result/lead to/cause): ${familyHasOutcome}`);

let familyScore = 2;
if (familyHasNumbers) familyScore += 2;
if (familyIsCaseSpecific) familyScore += 2;
if (familyHasOutcome) familyScore += 2;

console.log(`\nExpected score: ${Math.min(10, familyScore)}`);
