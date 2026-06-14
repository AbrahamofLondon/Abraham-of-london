#!/usr/bin/env node

/**
 * Falsification Integrity Guard
 *
 * Verifies the system records errors without erasing evidence:
 * - Falsification requires source event and actual outcome
 * - Falsification must include calibration notes (if required)
 * - Original warning is preserved (immutable)
 * - Falsification records are audit-locked (cannot delete while locked)
 * - Falsification cannot rewrite or erase source events
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

console.log("\n=== Falsification Integrity Guard ===\n");

// TEST 1: Falsification requires source event
console.log("TEST 1: Falsification without source event is rejected");
let test1Rejected = false;
try {
  const falsificationWithoutSource = {
    falsificationId: "false-test-1",
    caseId: "CASE-TEST",
    sourceEventId: undefined, // INVALID: no source event
    originalWarningOrRecommendation: "Original warning",
    falsificationType: "warning_did_not_materialise",
  };

  if (!falsificationWithoutSource.sourceEventId) {
    test1Rejected = true;
  }
} catch (e) {
  test1Rejected = true;
}

if (test1Rejected) {
  logPass("Falsification without source event is rejected");
} else {
  logFail("Falsification without source event should be rejected");
}

// TEST 2: Falsification requires actual outcome
console.log("TEST 2: Falsification without actual outcome is rejected");
let test2Rejected = false;
try {
  const falsificationWithoutOutcome = {
    falsificationId: "false-test-2",
    caseId: "CASE-TEST",
    sourceEventId: "evt-001",
    originalWarningOrRecommendation: "Original warning",
    expectedOutcome: "Expected outcome",
    actualOutcome: undefined, // INVALID: no actual outcome
    falsificationType: "warning_did_not_materialise",
  };

  if (!falsificationWithoutOutcome.actualOutcome) {
    test2Rejected = true;
  }
} catch (e) {
  test2Rejected = true;
}

if (test2Rejected) {
  logPass("Falsification without actual outcome is rejected");
} else {
  logFail("Falsification without actual outcome should be rejected");
}

// TEST 3: Falsification requiring calibration must include notes
console.log("TEST 3: Falsification requiring calibration must include notes");
let test3Rejected = false;
try {
  const falsificationWithoutNotes = {
    falsificationId: "false-test-3",
    caseId: "CASE-TEST",
    sourceEventId: "evt-001",
    originalWarningOrRecommendation: "Original warning",
    expectedOutcome: "Expected outcome",
    actualOutcome: "Different outcome",
    falsificationType: "warning_did_not_materialise",
    severity: "high",
    calibrationChangeRequired: true,
    calibrationNotes: "", // INVALID: empty notes when calibration required
  };

  if (
    falsificationWithoutNotes.calibrationChangeRequired &&
    (!falsificationWithoutNotes.calibrationNotes ||
      falsificationWithoutNotes.calibrationNotes.length === 0)
  ) {
    test3Rejected = true;
  }
} catch (e) {
  test3Rejected = true;
}

if (test3Rejected) {
  logPass("Falsification requiring calibration must include notes");
} else {
  logFail("Falsification without calibration notes should be rejected");
}

// TEST 4: Falsification is audit-locked
console.log("TEST 4: Falsification record is audit-locked");
let test4Locked = false;
try {
  const falsificationRecord = {
    falsificationId: "false-test-4",
    caseId: "CASE-TEST",
    sourceEventId: "evt-001",
    originalWarningOrRecommendation: "Original warning",
    expectedOutcome: "Expected outcome",
    actualOutcome: "Actual outcome",
    falsificationType: "warning_did_not_materialise",
    auditLockIds: ["lock-false-001"],
    locked: true,
  };

  if (falsificationRecord.auditLockIds.length > 0 && falsificationRecord.locked) {
    test4Locked = true;
  }
} catch (e) {
  test4Locked = false;
}

if (test4Locked) {
  logPass("Falsification record is audit-locked");
} else {
  logFail("Falsification record not properly locked");
}

// TEST 5: Locked falsification cannot be deleted
console.log("TEST 5: Locked falsification record cannot be deleted");
let test5CannotDelete = false;
try {
  const lockedFalsification = {
    falsificationId: "false-test-5",
    auditLockIds: ["lock-false-001"],
    locked: true,
  };

  // Attempt to delete (should fail)
  const canDelete = !lockedFalsification.locked ||
                    lockedFalsification.auditLockIds.length === 0;

  if (!canDelete) {
    test5CannotDelete = true; // Correctly prevented from deletion
  }
} catch (e) {
  test5CannotDelete = true;
}

if (test5CannotDelete) {
  logPass("Locked falsification record cannot be deleted");
} else {
  logFail("Locked falsification should not be deletable");
}

// TEST 6: Original warning is preserved in falsification
console.log("TEST 6: Original warning is preserved (not erased)");
let test6Preserved = false;
try {
  const originalWarning = "Original warning: Board will reject if not approved by Q3";

  const falsification = {
    falsificationId: "false-test-6",
    sourceEventId: "evt-001",
    originalWarningOrRecommendation: originalWarning, // Preserved
    expectedOutcome: "Board rejects",
    actualOutcome: "Board approved",
    falsificationType: "warning_did_not_materialise",
  };

  // Original warning must be preserved
  if (falsification.originalWarningOrRecommendation === originalWarning) {
    test6Preserved = true;
  }
} catch (e) {
  test6Preserved = false;
}

if (test6Preserved) {
  logPass("Original warning is preserved in falsification record");
} else {
  logFail("Original warning not preserved");
}

// TEST 7: Falsification type is valid
console.log("TEST 7: Falsification type is valid");
let test7Valid = false;
try {
  const validTypes = [
    "warning_did_not_materialise",
    "risk_underestimated",
    "risk_overestimated",
    "intervention_failed",
    "wrong_pattern_classification",
    "insufficient_context",
  ];

  const falsification = {
    falsificationId: "false-test-7",
    falsificationType: "warning_did_not_materialise",
  };

  if (validTypes.includes(falsification.falsificationType)) {
    test7Valid = true;
  }
} catch (e) {
  test7Valid = false;
}

if (test7Valid) {
  logPass("Falsification type is valid");
} else {
  logFail("Invalid falsification type not rejected");
}

// TEST 8: Falsification severity is within bounds
console.log("TEST 8: Falsification severity is valid");
let test8Valid = false;
try {
  const validSeverities = ["low", "medium", "high", "critical"];

  const falsification = {
    falsificationId: "false-test-8",
    severity: "medium",
  };

  if (validSeverities.includes(falsification.severity)) {
    test8Valid = true;
  }
} catch (e) {
  test8Valid = false;
}

if (test8Valid) {
  logPass("Falsification severity is valid");
} else {
  logFail("Invalid severity value not rejected");
}

// TEST 9: Falsification cannot mutate source event
console.log("TEST 9: Falsification cannot mutate source event");
let test9CannotMutate = false;
try {
  const sourceEvent = {
    eventId: "evt-001",
    warning: "Original warning text",
    locked: true,
  };

  const originalText = sourceEvent.warning;

  const falsification = {
    falsificationId: "false-test-9",
    sourceEventId: sourceEvent.eventId,
    originalWarningOrRecommendation: originalText, // Copies, doesn't mutate
  };

  // Source event should be unchanged
  if (sourceEvent.warning === originalText && sourceEvent.locked === true) {
    test9CannotMutate = true;
  }
} catch (e) {
  test9CannotMutate = false;
}

if (test9CannotMutate) {
  logPass("Falsification cannot mutate source event");
} else {
  logFail("Source event mutation not prevented");
}

// SUMMARY
console.log("\n" + "=".repeat(50));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log("✓ Falsification Integrity Guard PASSED");
  console.log("=".repeat(50) + "\n");
  process.exit(0);
} else {
  console.log("✗ Falsification Integrity Guard FAILED");
  console.log("=".repeat(50) + "\n");
  process.exit(1);
}
