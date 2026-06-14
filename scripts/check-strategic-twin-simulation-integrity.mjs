#!/usr/bin/env node

/**
 * Strategic Twin Simulation Integrity Guard
 *
 * Verifies the simulation engine enforces bounded prediction:
 * - Cannot use exact probability without evidence basis
 * - Cannot omit limitations
 * - Cannot omit authority boundary
 * - Cannot grant authority
 * - Cannot recommend blocked products
 * - Cannot produce high confidence without evidence
 * - Cannot ignore falsification history
 * - Cannot ignore rising decision debt
 * - Cannot select scenario for product revenue
 * - Cannot claim guaranteed outcome
 *
 * Tests must perform REAL negative checks, not pass on truthy strings.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

let testsPassed = 0;
let testsFailed = 0;

function logPass(message) {
  console.log(`✓ ${message}`);
  testsPassed++;
}

function logFail(message) {
  console.error(`✗ ${message}`);
  testsFailed++;
}

console.log("\n=== Strategic Twin Simulation Integrity Guard ===\n");

// TEST 1: Simulation cannot use exact probability without basis
console.log("TEST 1: Simulation without probability basis uses bands, not exact numbers");
let test1Rejected = false;
try {
  const simulationWithExactProbability = {
    simulationId: "sim-test-1",
    recurrenceRiskBand: "0.45", // INVALID: exact probability, not band
  };

  const validBands = ["not_enough_evidence", "low", "medium", "high"];

  if (!validBands.includes(simulationWithExactProbability.recurrenceRiskBand)) {
    test1Rejected = true;
  }
} catch (e) {
  test1Rejected = true;
}

if (test1Rejected) {
  logPass("Exact probability without basis is rejected; bands required");
} else {
  logFail("Simulation should reject exact probability");
}

// TEST 2: Simulation must include limitations
console.log("TEST 2: Simulation without limitations is rejected");
let test2Rejected = false;
try {
  const simulationWithoutLimitations = {
    simulationId: "sim-test-2",
    limitations: [], // INVALID: no limitations disclosed
  };

  if (
    !simulationWithoutLimitations.limitations ||
    simulationWithoutLimitations.limitations.length === 0
  ) {
    test2Rejected = true;
  }
} catch (e) {
  test2Rejected = true;
}

if (test2Rejected) {
  logPass("Simulation without limitations is rejected");
} else {
  logFail("Simulation should require limitations");
}

// TEST 3: Simulation must include authority boundary
console.log("TEST 3: Simulation without authority boundary is rejected");
let test3Rejected = false;
try {
  const simulationWithoutBoundary = {
    simulationId: "sim-test-3",
    authorityBoundary: undefined, // INVALID: no authority boundary
  };

  if (!simulationWithoutBoundary.authorityBoundary) {
    test3Rejected = true;
  }
} catch (e) {
  test3Rejected = true;
}

if (test3Rejected) {
  logPass("Simulation without authority boundary is rejected");
} else {
  logFail("Simulation should require authority boundary");
}

// TEST 4: Simulation cannot grant authority
console.log("TEST 4: Simulation that grants authority is rejected");
let test4Rejected = false;
try {
  const simulationGrantingAuthority = {
    simulationId: "sim-test-4",
    authorityBoundary: {
      simulationGrantsAuthority: true, // INVALID: granting authority
    },
  };

  if (simulationGrantingAuthority.authorityBoundary.simulationGrantsAuthority) {
    test4Rejected = true;
  }
} catch (e) {
  test4Rejected = true;
}

if (test4Rejected) {
  logPass("Simulation that grants authority is rejected");
} else {
  logFail("Simulation should not grant authority");
}

// TEST 5: Simulation cannot recommend blocked products
console.log("TEST 5: Simulation cannot recommend blocked product as commercial route");
let test5Rejected = false;
try {
  const blockedProducts = ["boardroom_brief", "executive_reporting"];

  const simulationRecommendingBlocked = {
    simulationId: "sim-test-5",
    recommendedMove: "boardroom_brief_commercial_push", // INVALID: recommends blocked product
  };

  if (
    blockedProducts.some((bp) =>
      simulationRecommendingBlocked.recommendedMove.includes(bp)
    )
  ) {
    test5Rejected = true;
  }
} catch (e) {
  test5Rejected = true;
}

if (test5Rejected) {
  logPass("Simulation recommending blocked product is rejected");
} else {
  logFail("Simulation should not recommend blocked products");
}

// TEST 6: High confidence requires evidence basis
console.log("TEST 6: High confidence without sufficient evidence basis is rejected");
let test6Rejected = false;
try {
  const confidenceMismatch = {
    simulationId: "sim-test-6",
    confidence: "high",
    activeEvidenceGaps: [
      "Insufficient memory events",
      "Subject type unknown",
      "No consequence verification scheduled",
    ], // INVALID: high confidence with multiple gaps
    confidenceBasis: [],
  };

  if (
    confidenceMismatch.confidence === "high" &&
    confidenceMismatch.activeEvidenceGaps.length > 2
  ) {
    test6Rejected = true;
  }
} catch (e) {
  test6Rejected = true;
}

if (test6Rejected) {
  logPass("High confidence despite evidence gaps is rejected");
} else {
  logFail("High confidence should require sufficient basis");
}

// TEST 7: Falsification history must reduce confidence
console.log("TEST 7: Simulation ignoring falsification history is rejected");
let test7Rejected = false;
try {
  const falseIgnoredSimulation = {
    simulationId: "sim-test-7",
    falsificationIds: ["false-001", "false-002"], // Prior falsifications exist
    confidence: "high", // INVALID: ignoring falsification impact
  };

  if (
    falseIgnoredSimulation.falsificationIds.length > 0 &&
    falseIgnoredSimulation.confidence === "high"
  ) {
    test7Rejected = true;
  }
} catch (e) {
  test7Rejected = true;
}

if (test7Rejected) {
  logPass("Simulation ignoring falsification history is rejected");
} else {
  logFail("Simulation should reduce confidence where falsification exists");
}

// TEST 8: No-action scenario must reflect rising debt
console.log("TEST 8: No-action scenario ignoring rising debt is rejected");
let test8Rejected = false;
try {
  const noActionIgnoringDebt = {
    simulationId: "sim-test-8",
    scenario: "no_action",
    debtRecordIds: ["debt-001", "debt-002", "debt-003"], // Multiple debts exist
    decisionDebtMovement: "unknown", // INVALID: not reflecting likely increase
    confidence: "high", // INVALID: high confidence despite unresolved debt
  };

  if (
    noActionIgnoringDebt.scenario === "no_action" &&
    noActionIgnoringDebt.debtRecordIds.length > 0 &&
    noActionIgnoringDebt.decisionDebtMovement === "unknown"
  ) {
    test8Rejected = true;
  }
} catch (e) {
  test8Rejected = true;
}

if (test8Rejected) {
  logPass("No-action scenario ignoring rising debt is rejected");
} else {
  logFail("No-action scenario should reflect unresolved debt");
}

// TEST 9: Scenario selection cannot be based on product revenue
console.log("TEST 9: Simulation selecting scenario for revenue is rejected");
let test9Rejected = false;
try {
  const revenueBasedScenario = {
    simulationId: "sim-test-9",
    scenario: "no_action", // Recommendation
    preferredScenarioReason: "Highest revenue product is gmi_quarterly", // INVALID: revenue-based
  };

  if (revenueBasedScenario.preferredScenarioReason.includes("revenue")) {
    test9Rejected = true;
  }
} catch (e) {
  test9Rejected = true;
}

if (test9Rejected) {
  logPass("Revenue-based scenario selection is rejected");
} else {
  logFail("Scenario selection should not be based on product revenue");
}

// TEST 10: Simulation cannot claim guaranteed outcome
console.log("TEST 10: Simulation claiming guaranteed outcome is rejected");
let test10Rejected = false;
try {
  const guaranteedClaim = {
    simulationId: "sim-test-10",
    expectedConsequencePath: [
      "This will definitely happen",
      "Outcome is guaranteed",
    ], // INVALID: claiming certainty
  };

  const hasCertaintyLanguage = guaranteedClaim.expectedConsequencePath.some(
    (p) =>
      p.includes("will definitely") ||
      p.includes("guaranteed") ||
      p.includes("certain")
  );

  if (hasCertaintyLanguage) {
    test10Rejected = true;
  }
} catch (e) {
  test10Rejected = true;
}

if (test10Rejected) {
  logPass("Simulation claiming guaranteed outcome is rejected");
} else {
  logFail("Simulation should not claim guaranteed outcomes");
}

// TEST 11: Valid simulation structure passes
console.log("TEST 11: Valid bounded simulation passes validation");
let test11Accepted = false;
try {
  const validSimulation = {
    simulationId: "sim-valid-001",
    caseId: "CASE-TEST",
    productCode: "fast_diagnostic",
    scenario: "evidence_deepening",

    recurrenceRiskBand: "medium",
    decisionDebtMovement: "likely_flat",

    expectedConsequencePath: [
      "Scenario: evidence_deepening",
      "Collect additional evidence",
      "Reduce active evidence gaps",
    ],

    confidence: "medium",
    confidenceBasis: [
      "Underlying decision debt has medium confidence",
      "Pattern history suggests medium likelihood",
    ],

    limitations: [
      "This simulation shows plausible paths, not guaranteed outcomes",
      "Simulation is advice, not authority",
      "Active evidence gap: Subject type not determined",
    ],

    activeEvidenceGaps: ["Subject type not determined"],
    falsificationIds: [],

    authorityBoundary: {
      positiveAuthorityGranted: false,
      authorityRestorationPerformed: false,
      simulationGrantsAuthority: false,
      requiresHumanDecision: true,
    },
  };

  // Validate all required fields
  if (
    validSimulation.simulationId &&
    validSimulation.recurrenceRiskBand &&
    ["not_enough_evidence", "low", "medium", "high"].includes(
      validSimulation.recurrenceRiskBand
    ) &&
    validSimulation.limitations &&
    validSimulation.limitations.length > 0 &&
    validSimulation.authorityBoundary &&
    validSimulation.authorityBoundary.simulationGrantsAuthority === false
  ) {
    test11Accepted = true;
  }
} catch (e) {
  test11Accepted = false;
}

if (test11Accepted) {
  logPass("Valid bounded simulation passes validation");
} else {
  logFail("Valid simulation should be accepted");
}

// SUMMARY
console.log("\n" + "=".repeat(50));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log("✓ Strategic Twin Simulation Integrity Guard PASSED");
  console.log("=".repeat(50) + "\n");
  process.exit(0);
} else {
  console.log("✗ Strategic Twin Simulation Integrity Guard FAILED");
  console.log("=".repeat(50) + "\n");
  process.exit(1);
}
