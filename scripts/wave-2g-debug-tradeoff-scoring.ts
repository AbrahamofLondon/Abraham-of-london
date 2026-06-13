/**
 * Debug: Check what's actually being scored for tradeOffSharpness
 */

import { composeDecisionDiagnosticOutput } from "../lib/product/decision-diagnostic-composer";

const input = {
  decisionUnderReview:
    "Accept a startup offer ($100k base, equity vest over 4 years) vs. stay in stable corporate role ($110k, annual raises). Startup success probability: 25%. Household has just discovered $15k emergency expense (home repair) that depletes reserves.",
  decisionOwner: "Chief Technology Officer, age 38, two dependents",
  evidenceBasis: [
    "Startup has proven market fit in beta",
    "Team includes two successful founders from acquired company",
    "Runway: 18 months with current burn",
    "Personal savings: $45k after emergency expense",
  ],
  primaryContradiction:
    "Financial security vs. career growth. Timing conflict: emergency creates short-term pressure; opportunity window closes in 2 weeks.",
  deadlinePressure: "Startup offer expires in 14 days",
  irreversibleElements: [
    "Corporate role will be filled by external hire",
    "Startup equity cliff at year 2 means leaving before then forfeits most upside",
  ],
  desiredOutcome: "A decision framework that balances financial obligations, career trajectory, and family stability.",
  priorAttempts: [
    "Discussed with spouse twice (emotionally charged, no decision framework)",
    "Consulted with mentor (told to follow the dream)",
  ],
  optionsUnderConsideration: [
    "Accept startup, aggressive savings plan",
    "Decline startup, stay corporate",
    "Negotiate startup offer for higher base",
  ],
};

const output = composeDecisionDiagnosticOutput(input);

console.log("DEBUG: Trade-off Sharpness Scoring");
console.log("=".repeat(70));
console.log("\nActual decisionTension being scored:");
console.log(`"${output.decisionTension}"`);
console.log(`\nLength: ${output.decisionTension.length} characters`);
console.log(`\nContains " vs ": ${output.decisionTension.includes(" vs ")}`);
console.log(`Contains "versus": ${output.decisionTension.includes("versus")}`);
console.log(`Contains "trade-off": ${output.decisionTension.includes("trade-off")}`);

const hasTradeOff = [" vs ", "versus", "trade-off", "either/or", "but", "however", "on the other hand"].some(
  (phrase) => output.decisionTension.toLowerCase().includes(phrase)
);
console.log(`\nHas trade-off phrase: ${hasTradeOff}`);

const hasSpecifics = /[A-Z][a-z]+ /.test(output.decisionTension);
console.log(`Has capitalized terms: ${hasSpecifics}`);

const matches = output.decisionTension.match(/[A-Z][a-z]+ /g);
console.log(`\nMatched capitalized terms: ${matches?.join(", ") || "NONE"}`);

const expectedScore = hasTradeOff && hasSpecifics ? 8 : hasTradeOff ? 5 : 2;
console.log(`\nExpected score: ${expectedScore}`);

console.log("\n" + "=".repeat(70));
console.log("Full output object:");
console.log(JSON.stringify(output, null, 2).substring(0, 500));
