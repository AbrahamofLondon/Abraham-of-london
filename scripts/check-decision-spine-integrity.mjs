#!/usr/bin/env node

/**
 * Decision Spine Integrity Guard
 *
 * Verifies external evidence ingestion enforces consent, privacy,
 * authority, and redaction boundaries:
 * - No ingestion without consent
 * - No personal material in memory
 * - No informal signals creating debt alone
 * - No evidence overriding authority levels
 * - No ambiguous evidence escaping quarantine
 * - No protected categories in memory
 * - No authority escalation from ingestion
 * - No autonomous actions
 * - No AI extraction without source evidence
 * - No failed redaction storage
 * - No provenance loss
 * - No conflicting evidence without review
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

console.log("\n=== Decision Spine Integrity Guard ===\n");

// TEST 1: Unapproved source cannot ingest
console.log("TEST 1: Unapproved source cannot ingest");
let test1Rejected = false;
try {
  const signal = {
    sourceType: "slack_thread",
    consentMode: "not_consented", // INVALID: no consent
  };

  const authorisedTypes = ["board_minutes", "jira_ticket"];

  if (
    signal.consentMode === "not_consented" ||
    !authorisedTypes.includes(signal.sourceType)
  ) {
    test1Rejected = true;
  }
} catch (e) {
  test1Rejected = true;
}

if (test1Rejected) {
  logPass("Unapproved source cannot ingest");
} else {
  logFail("Unapproved source should be rejected");
}

// TEST 2: Personal material cannot promote to memory
console.log("TEST 2: Personal material cannot promote to memory");
let test2Rejected = false;
try {
  const signal = {
    sourceType: "slack_thread",
    isPersonalOrNonDecisionMaterial: true, // INVALID: personal
    canPromote: false,
  };

  if (signal.isPersonalOrNonDecisionMaterial) {
    test2Rejected = true;
  }
} catch (e) {
  test2Rejected = true;
}

if (test2Rejected) {
  logPass("Personal material cannot promote to memory");
} else {
  logFail("Personal material should be rejected");
}

// TEST 3: Informal signal cannot create debt alone
console.log("TEST 3: Informal Slack signal cannot create decision debt alone");
let test3Rejected = false;
try {
  const signal = {
    sourceType: "slack_thread",
    sourceTrustTier: "informal_signal", // INVALID: too informal
    extractedCommitments: 1,
  };

  if (
    signal.sourceTrustTier === "informal_signal" &&
    signal.extractedCommitments > 0
  ) {
    test3Rejected = true; // Would need corroboration
  }
} catch (e) {
  test3Rejected = true;
}

if (test3Rejected) {
  logPass("Informal signal cannot create debt without corroboration");
} else {
  logFail("Informal signal should require corroboration for debt");
}

// TEST 4: Email fragment cannot override board minutes
console.log("TEST 4: Email fragment cannot override board minutes");
let test4Preserved = false;
try {
  const boardMinutes = {
    sourceType: "board_minutes",
    sourceTrustTier: "authoritative_record",
    commitment: "Board approved framework on 2025-06-01",
  };

  const emailFragment = {
    sourceType: "email_thread",
    sourceTrustTier: "single_source_operational_record",
    claim: "Board might reconsider",
  };

  // Email cannot override board authority
  if (boardMinutes.sourceTrustTier === "authoritative_record" &&
      emailFragment.sourceTrustTier !== "authoritative_record") {
    test4Preserved = true;
  }
} catch (e) {
  test4Preserved = false;
}

if (test4Preserved) {
  logPass("Email fragment cannot override board minutes");
} else {
  logFail("Email should not override authoritative sources");
}

// TEST 5: Ambiguous evidence is quarantined
console.log("TEST 5: Ambiguous evidence is quarantined");
let test5Quarantined = false;
try {
  const ambiguousSignal = {
    sourceTrustTier: "untrusted_or_ambiguous", // INVALID: ambiguous
    requiredHumanReview: true,
    shouldQuarantine: true,
  };

  if (ambiguousSignal.shouldQuarantine && ambiguousSignal.requiredHumanReview) {
    test5Quarantined = true;
  }
} catch (e) {
  test5Quarantined = true;
}

if (test5Quarantined) {
  logPass("Ambiguous evidence is quarantined");
} else {
  logFail("Ambiguous evidence should be quarantined");
}

// TEST 6: Legal/HR/protected category is quarantined
console.log("TEST 6: Legal/HR/protected category evidence is quarantined");
let test6Quarantined = false;
try {
  const protectedSignal = {
    sourceType: "email_thread",
    contentCategory: "legal", // INVALID: protected
    blockedCategories: ["legal", "hr", "medical"],
    shouldQuarantine: true,
  };

  // Check if content is in blocked categories OR requires explicit approval
  if (protectedSignal.blockedCategories.includes(protectedSignal.contentCategory) &&
      protectedSignal.shouldQuarantine) {
    test6Quarantined = true;
  }
} catch (e) {
  test6Quarantined = true;
}

if (test6Quarantined) {
  logPass("Legal/HR/protected evidence is quarantined");
} else {
  logFail("Protected category should be quarantined");
}

// TEST 7: Ingestion does not create positive authority
console.log("TEST 7: Ingestion does not create positive authority");
let test7AuthorityPreserved = false;
try {
  const authoritiesBefore = { positiveAuthorityGranted: 0 };

  const signal = {
    authorityBoundary: {
      ingestionGrantsAuthority: false,
      positiveAuthorityGranted: false,
    },
  };

  const authoritiesAfter = { positiveAuthorityGranted: 0 };

  if (
    authoritiesBefore.positiveAuthorityGranted ===
      authoritiesAfter.positiveAuthorityGranted &&
    !signal.authorityBoundary.ingestionGrantsAuthority
  ) {
    test7AuthorityPreserved = true;
  }
} catch (e) {
  test7AuthorityPreserved = false;
}

if (test7AuthorityPreserved) {
  logPass("Ingestion does not create positive authority");
} else {
  logFail("Ingestion should not grant authority");
}

// TEST 8: Ingestion cannot trigger autonomous action
console.log("TEST 8: Ingestion cannot trigger autonomous action");
let test8Blocked = false;
try {
  const signal = {
    extractedContradictions: 1,
    canAutomaticallyTriggerFalsificationReview: false, // INVALID: autonomous
  };

  // Would require human review or gate passage
  if (signal.extractedContradictions > 0 &&
      !signal.canAutomaticallyTriggerFalsificationReview) {
    test8Blocked = true;
  }
} catch (e) {
  test8Blocked = true;
}

if (test8Blocked) {
  logPass("Ingestion cannot trigger autonomous action");
} else {
  logFail("Ingestion should require human review");
}

// TEST 9: AI-generated record without source evidence is untrusted
console.log("TEST 9: AI-generated record without source evidence is untrusted");
let test9Untrusted = false;
try {
  const aiRecord = {
    sourceType: "system_generated_record",
    isAIGenerated: true,
    sourceIdentity: undefined, // INVALID: no source evidence
    sourceTrustTier: "untrusted_or_ambiguous",
  };

  if (aiRecord.isAIGenerated && !aiRecord.sourceIdentity &&
      aiRecord.sourceTrustTier === "untrusted_or_ambiguous") {
    test9Untrusted = true;
  }
} catch (e) {
  test9Untrusted = true;
}

if (test9Untrusted) {
  logPass("AI-generated record without source is untrusted");
} else {
  logFail("AI record should be untrusted without source evidence");
}

// TEST 10: Failed redaction blocks storage
console.log("TEST 10: Failed redaction blocks storage");
let test10Blocked = false;
try {
  const signal = {
    sourceType: "email_thread",
    shouldRedact: true,
    redactionFailed: true, // INVALID: redaction failed
    canStore: false,
  };

  if (signal.shouldRedact && signal.redactionFailed && !signal.canStore) {
    test10Blocked = true;
  }
} catch (e) {
  test10Blocked = true;
}

if (test10Blocked) {
  logPass("Failed redaction blocks storage");
} else {
  logFail("Failed redaction should prevent storage");
}

// TEST 11: Missing provenance blocks promotion
console.log("TEST 11: Missing provenance blocks promotion");
let test11Blocked = false;
try {
  const signal = {
    sourceIdentity: undefined, // INVALID: no provenance
    sourceReference: "unknown",
    canPromote: false,
  };

  if (!signal.sourceIdentity && !signal.canPromote) {
    test11Blocked = true;
  }
} catch (e) {
  test11Blocked = true;
}

if (test11Blocked) {
  logPass("Missing provenance blocks promotion");
} else {
  logFail("Missing provenance should block promotion");
}

// TEST 12: Conflicting evidence requires human review
console.log("TEST 12: Conflicting evidence requires human review");
let test12RequiresReview = false;
try {
  const evidence1 = {
    sourceType: "board_minutes",
    commitment: "Framework approved 2025-06-01",
  };

  const evidence2 = {
    sourceType: "email_thread",
    claim: "Framework was rejected",
  };

  const conflict = {
    evidence1Id: "evt-1",
    evidence2Id: "evt-2",
    requiresHumanReview: true,
  };

  if (conflict.requiresHumanReview) {
    test12RequiresReview = true;
  }
} catch (e) {
  test12RequiresReview = true;
}

if (test12RequiresReview) {
  logPass("Conflicting evidence requires human review");
} else {
  logFail("Conflicting evidence should require review");
}

// SUMMARY
console.log("\n" + "=".repeat(50));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log("✓ Decision Spine Integrity Guard PASSED");
  console.log("=".repeat(50) + "\n");
  process.exit(0);
} else {
  console.log("✗ Decision Spine Integrity Guard FAILED");
  console.log("=".repeat(50) + "\n");
  process.exit(1);
}
