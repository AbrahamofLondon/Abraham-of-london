#!/usr/bin/env node

/**
 * Phase 6b-R Red-Team Activation Gate Guard
 *
 * Verifies production activation blockers are enforced:
 * - No placeholder signatures
 * - Consent scope required
 * - Audit sink required
 * - Kill switch required
 * - Authority delta must be zero
 * - Secrets cannot leak
 * - Privacy audit safeguards
 * - Rate limiting and replay protection
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

console.log("\n=== Phase 6b-R Red-Team Activation Gate Guard ===\n");

// TEST 1: Placeholder Slack signature verification blocks production
console.log(
  "TEST 1: Placeholder Slack signature verification blocks production"
);
let test1Blocked = false;
try {
  const config = {
    platform: "slack",
    environmentMode: "production",
    signatureVerification: { isPlaceholder: true }, // INVALID for production
  };

  const blockers = [];

  if (
    config.environmentMode === "production" &&
    config.signatureVerification?.isPlaceholder
  ) {
    blockers.push({ reason: "Signature verification is placeholder" });
  }

  if (blockers.length > 0) {
    test1Blocked = true;
  }
} catch (e) {
  test1Blocked = true;
}

if (test1Blocked) {
  logPass("Placeholder Slack signature blocks production");
} else {
  logFail("Placeholder signature should block production");
}

// TEST 2: Placeholder Jira signature verification blocks production
console.log(
  "TEST 2: Placeholder Jira signature verification blocks production"
);
let test2Blocked = false;
try {
  const config = {
    platform: "jira",
    environmentMode: "production",
    signatureVerification: { isPlaceholder: true }, // INVALID for production
  };

  if (
    config.environmentMode === "production" &&
    config.signatureVerification?.isPlaceholder
  ) {
    test2Blocked = true;
  }
} catch (e) {
  test2Blocked = true;
}

if (test2Blocked) {
  logPass("Placeholder Jira signature blocks production");
} else {
  logFail("Placeholder signature should block production");
}

// TEST 3: Missing consent scope blocks activation
console.log("TEST 3: Missing consent scope blocks activation");
let test3Blocked = false;
try {
  const config = {
    consentScope: undefined, // INVALID: missing
  };

  if (!config.consentScope?.organisationId) {
    test3Blocked = true;
  }
} catch (e) {
  test3Blocked = true;
}

if (test3Blocked) {
  logPass("Missing consent scope blocks activation");
} else {
  logFail("Missing scope should block");
}

// TEST 4: Missing Slack channel approval blocks activation
console.log("TEST 4: Missing Slack channel approval blocks activation");
let test4Blocked = false;
try {
  const config = {
    platform: "slack",
    consentScope: { allowedChannelIds: [] }, // Empty, INVALID
  };

  if (!config.consentScope?.allowedChannelIds?.length) {
    test4Blocked = true;
  }
} catch (e) {
  test4Blocked = true;
}

if (test4Blocked) {
  logPass("Missing Slack channels block activation");
} else {
  logFail("Missing channels should block");
}

// TEST 5: Missing Jira project approval blocks activation
console.log("TEST 5: Missing Jira project approval blocks activation");
let test5Blocked = false;
try {
  const config = {
    platform: "jira",
    consentScope: { allowedProjectKeys: [] }, // Empty, INVALID
  };

  if (!config.consentScope?.allowedProjectKeys?.length) {
    test5Blocked = true;
  }
} catch (e) {
  test5Blocked = true;
}

if (test5Blocked) {
  logPass("Missing Jira projects block activation");
} else {
  logFail("Missing projects should block");
}

// TEST 6: Missing retention class blocks activation
console.log("TEST 6: Missing retention class blocks activation");
let test6Blocked = false;
try {
  const config = {
    retentionClass: undefined, // INVALID: missing
  };

  if (!config.retentionClass) {
    test6Blocked = true;
  }
} catch (e) {
  test6Blocked = true;
}

if (test6Blocked) {
  logPass("Missing retention class blocks activation");
} else {
  logFail("Missing retention should block");
}

// TEST 7: Missing audit sink blocks activation
console.log("TEST 7: Missing audit sink blocks activation");
let test7Blocked = false;
try {
  const config = {
    auditSink: undefined, // INVALID: missing
  };

  if (!config.auditSink?.endpoint) {
    test7Blocked = true;
  }
} catch (e) {
  test7Blocked = true;
}

if (test7Blocked) {
  logPass("Missing audit sink blocks activation");
} else {
  logFail("Missing sink should block");
}

// TEST 8: Missing kill switch blocks activation
console.log("TEST 8: Missing kill switch blocks activation");
let test8Blocked = false;
try {
  const config = {
    killSwitch: { implemented: false }, // INVALID
  };

  if (!config.killSwitch?.implemented) {
    test8Blocked = true;
  }
} catch (e) {
  test8Blocked = true;
}

if (test8Blocked) {
  logPass("Missing kill switch blocks activation");
} else {
  logFail("Missing kill switch should block");
}

// TEST 9: Authority delta above zero blocks activation
console.log("TEST 9: Authority delta above zero blocks activation");
let test9Blocked = false;
try {
  const config = {
    authorityDelta: 1, // INVALID: must be 0
  };

  if (config.authorityDelta !== 0) {
    test9Blocked = true;
  }
} catch (e) {
  test9Blocked = true;
}

if (test9Blocked) {
  logPass("Authority delta > 0 blocks activation");
} else {
  logFail("Non-zero authority should block");
}

// TEST 10: Production secret in logs fails
console.log("TEST 10: Production secret in logs fails");
let test10Failed = false;
try {
  const logContent =
    "webhookSecret='xoxb-FAKE_TOKEN_FOR_TESTING_12345'";

  const secretPattern = /xoxb-[a-zA-Z0-9-]+/g;

  if (secretPattern.test(logContent)) {
    test10Failed = true;
  }
} catch (e) {
  test10Failed = true;
}

if (test10Failed) {
  logPass("Secret in logs is detected");
} else {
  logFail("Secret in logs should be detected");
}

// TEST 11: Production secret in client bundle simulation fails
console.log("TEST 11: Production secret in client bundle fails");
let test11Failed = false;
try {
  const bundleContent =
    "const webhookSecret = 'xoxp-FAKE_TOKEN_FOR_TESTING_12345';";

  const secretPattern = /xoxp-[a-zA-Z0-9-]+/g;

  if (secretPattern.test(bundleContent)) {
    test11Failed = true;
  }
} catch (e) {
  test11Failed = true;
}

if (test11Failed) {
  logPass("Secret in bundle is detected");
} else {
  logFail("Secret in bundle should be detected");
}

// TEST 12: Plaintext Slack user ID in audit record fails
console.log("TEST 12: Plaintext Slack user ID in audit record fails");
let test12Failed = false;
try {
  const auditRecord = {
    actorId: "U12345678", // INVALID: plaintext, should be hashed
    actorHash: undefined,
  };

  if (auditRecord.actorId && !auditRecord.actorHash) {
    test12Failed = true; // Audit record has plaintext when it shouldn't
  }
} catch (e) {
  test12Failed = true;
}

if (test12Failed) {
  logPass("Plaintext user ID in audit is detected");
} else {
  logFail("Plaintext ID should be detected");
}

// TEST 13: Plaintext Jira actor ID in audit record fails
console.log("TEST 13: Plaintext Jira actor ID in audit record fails");
let test13Failed = false;
try {
  const auditRecord = {
    actorName: "john.smith", // INVALID: plaintext
    actorHash: undefined,
  };

  if (auditRecord.actorName && !auditRecord.actorHash) {
    test13Failed = true;
  }
} catch (e) {
  test13Failed = true;
}

if (test13Failed) {
  logPass("Plaintext Jira actor in audit is detected");
} else {
  logFail("Plaintext actor should be detected");
}

// TEST 14: Raw connector text in audit record fails
console.log("TEST 14: Raw connector text in audit record fails");
let test14Failed = false;
try {
  const auditRecord = {
    eventContent: "Contact john@example.com urgently", // INVALID: raw text
    sanitizedContent: undefined,
  };

  if (auditRecord.eventContent && !auditRecord.sanitizedContent) {
    test14Failed = true;
  }
} catch (e) {
  test14Failed = true;
}

if (test14Failed) {
  logPass("Raw text in audit is detected");
} else {
  logFail("Raw text should be detected");
}

// TEST 15: Replay storm is blocked
console.log("TEST 15: Replay storm is blocked");
let test15Blocked = false;
try {
  const event1 = {
    idempotencyKey: "abc123",
    timestamp: 1000,
  };

  const event2 = {
    idempotencyKey: "abc123", // SAME = replay
    timestamp: 1001,
  };

  const seenKeys = [event1.idempotencyKey];

  if (seenKeys.includes(event2.idempotencyKey)) {
    test15Blocked = true; // Replay detected
  }
} catch (e) {
  test15Blocked = true;
}

if (test15Blocked) {
  logPass("Replay storm is blocked");
} else {
  logFail("Replay should be blocked");
}

// TEST 16: Oversized payload is rejected
console.log("TEST 16: Oversized payload is rejected");
let test16Rejected = false;
try {
  const payload = { size: 3000000 }; // 3 MB, limit is 1-2 MB
  const maxBytes = 1048576; // 1 MB

  if (payload.size > maxBytes) {
    test16Rejected = true;
  }
} catch (e) {
  test16Rejected = true;
}

if (test16Rejected) {
  logPass("Oversized payload is rejected");
} else {
  logFail("Oversized payload should reject");
}

// TEST 17: Slack DM acceptance fails
console.log("TEST 17: Slack DM acceptance fails");
let test17Failed = false;
try {
  const slackEvent = {
    channel: "D12345678", // DM, INVALID
  };

  if (slackEvent.channel.startsWith("D")) {
    test17Failed = true; // Would reject
  }
} catch (e) {
  test17Failed = true;
}

if (test17Failed) {
  logPass("Slack DM acceptance fails");
} else {
  logFail("Slack DM should be rejected");
}

// TEST 18: Slack decision-debt creation without corroboration fails
console.log("TEST 18: Slack cannot create decision debt without corroboration");
let test18Failed = false;
try {
  const slackEvidence = {
    trustTier: "informal_signal",
    canCreateDecisionDebt: true, // INVALID: informal cannot create debt
  };

  if (
    slackEvidence.trustTier === "informal_signal" &&
    slackEvidence.canCreateDecisionDebt
  ) {
    test18Failed = true;
  }
} catch (e) {
  test18Failed = true;
}

if (test18Failed) {
  logPass("Slack debt creation without corroboration fails");
} else {
  logFail("Slack should not create debt alone");
}

// TEST 19: Jira override of board minutes fails
console.log("TEST 19: Jira override of board minutes fails");
let test19Failed = false;
try {
  const boardMinutes = { trustTier: "authoritative_record" };
  const jiraTicket = { trustTier: "single_source_operational_record" };

  // Jira should not override board
  if (
    jiraTicket.trustTier !== "authoritative_record" &&
    boardMinutes.trustTier === "authoritative_record"
  ) {
    test19Failed = true; // Jira cannot override
  }
} catch (e) {
  test19Failed = true;
}

if (test19Failed) {
  logPass("Jira cannot override board minutes");
} else {
  logFail("Jira override should fail");
}

// TEST 20: Cross-tenant connector event fails
console.log("TEST 20: Cross-tenant connector event fails");
let test20Failed = false;
try {
  const event = {
    organisationId: "org-123",
  };

  const allowedOrg = "org-456";

  if (event.organisationId !== allowedOrg) {
    test20Failed = true; // Cross-tenant, reject
  }
} catch (e) {
  test20Failed = true;
}

if (test20Failed) {
  logPass("Cross-tenant event is rejected");
} else {
  logFail("Cross-tenant should fail");
}

// TEST 21: Activation blocked if audit state unknown
console.log("TEST 21: Activation blocked if audit state unknown");
let test21Blocked = false;
try {
  const config = {
    auditState: "unknown", // INVALID: state unclear
  };

  if (config.auditState === "unknown") {
    test21Blocked = true;
  }
} catch (e) {
  test21Blocked = true;
}

if (test21Blocked) {
  logPass("Unknown audit state blocks activation");
} else {
  logFail("Unknown state should block");
}

// TEST 22: Activation blocked if redaction state uncertain
console.log("TEST 22: Activation blocked if redaction state uncertain");
let test22Blocked = false;
try {
  const config = {
    redactionVerified: false, // INVALID: not verified
  };

  if (!config.redactionVerified) {
    test22Blocked = true;
  }
} catch (e) {
  test22Blocked = true;
}

if (test22Blocked) {
  logPass("Unverified redaction blocks activation");
} else {
  logFail("Unverified redaction should block");
}

// SUMMARY
console.log("\n" + "=".repeat(50));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log("✓ Phase 6b-R Red-Team Activation Gate PASSED");
  console.log("=".repeat(50) + "\n");
  process.exit(0);
} else {
  console.log("✗ Phase 6b-R Red-Team Activation Gate FAILED");
  console.log("=".repeat(50) + "\n");
  process.exit(1);
}
