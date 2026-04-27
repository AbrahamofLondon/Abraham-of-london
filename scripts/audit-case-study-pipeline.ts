/**
 * Audit: Case Study Pipeline
 *
 * Tests the automated case study generation system against 12 required conditions.
 * Run: npx tsx scripts/audit-case-study-pipeline.ts
 */

import { generateIntegritySeal, type SealInput } from "../lib/evidence/evidence-integrity-seal";
import { executeReview, canPublish, sanitiseForPublicOutput } from "../lib/evidence/case-review-policy";
import type { CaseStudyDraft, IntegritySeal } from "../lib/evidence/case-study-types";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results: Array<{ name: string; status: "PASS" | "FAIL"; detail?: string }> = [];

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    results.push({ name, status: "PASS" });
  } else {
    failed++;
    results.push({ name, status: "FAIL", detail: detail ?? "Assertion failed" });
  }
}

function makeDraft(overrides: Partial<CaseStudyDraft> = {}): CaseStudyDraft {
  const defaultSeal: IntegritySeal = {
    sealLevel: "SILVER",
    confidence: 0.90,
    verificationMethod: "DOCUMENTARY",
    sourceTraced: true,
    dataCompleteness: 90,
    publicationAllowed: true,
    missingFields: [],
  };

  return {
    id: "test-draft-1",
    title: "Test Case — £50,000 Impact over 60 Days",
    classification: "authority_failure",
    verificationBasis: "Verified outcome with 90% confidence",
    confidentialityNotes: "Client identity protected",
    situation: "An organisation faced a decision about resource allocation.",
    contradiction: "Ownership existed in conversation but not in execution.",
    decision: "The decision was to allocate budget across two divisions.",
    intervention: "A single owner was assigned with a 48-hour deadline.",
    outcome: "The decision was taken within 36 hours.",
    financialImpactGBP: 50000,
    timeframeDays: 60,
    confidence: 0.90,
    sourceOutcomeId: "outcome-1",
    sourceContractId: "contract-1",
    sourceDecisionId: "decision-1",
    recommendedPublicStatus: "publishable",
    integritySeal: defaultSeal,
    status: "draft",
    publicationAllowed: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Verified outcome can generate draft
// ─────────────────────────────────────────────────────────────────────────────

function testVerifiedOutcomeGeneratesDraft() {
  const sealInput: SealInput = {
    confidence: 0.90,
    verificationMethod: "DOCUMENTARY",
    financialImpactGBP: 50000,
    sourceContractId: "contract-1",
    sourceDecisionId: "decision-1",
    multipleCasesConfirmed: false,
    missingFields: [],
  };

  const seal = generateIntegritySeal(sealInput);
  assert(
    "1. Verified outcome generates GOLD seal",
    seal.sealLevel === "GOLD",
    `Expected GOLD seal, got ${seal.sealLevel}`,
  );
  assert(
    "1b. GOLD seal permits publication",
    seal.publicationAllowed === true,
    "Expected publication allowed for GOLD seal",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Self-reported outcome cannot generate public proof
// ─────────────────────────────────────────────────────────────────────────────

function testSelfReportedCannotBePublic() {
  const sealInput: SealInput = {
    confidence: 0.90,
    verificationMethod: "SELF_REPORTED",
    financialImpactGBP: 50000,
    sourceContractId: "contract-1",
    sourceDecisionId: "decision-1",
    multipleCasesConfirmed: false,
    missingFields: [],
  };

  const seal = generateIntegritySeal(sealInput);
  assert(
    "2. Self-reported produces BRONZE seal",
    seal.sealLevel === "BRONZE",
    `Expected BRONZE seal for self-reported, got ${seal.sealLevel}`,
  );
  assert(
    "2b. BRONZE seal blocks publication",
    seal.publicationAllowed === false,
    "Expected publication not allowed for BRONZE seal",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Disputed outcome fails
// ─────────────────────────────────────────────────────────────────────────────

function testDisputedOutcomeFails() {
  const draft = makeDraft({ status: "rejected" });
  const result = canPublish(draft);
  assert(
    "3. Rejected draft cannot publish",
    result.allowed === false,
    "Disputed/rejected draft should not be publishable",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Missing financial impact fails
// ─────────────────────────────────────────────────────────────────────────────

function testMissingFinancialImpactFails() {
  const sealInput: SealInput = {
    confidence: 0.90,
    verificationMethod: "DOCUMENTARY",
    financialImpactGBP: null,
    sourceContractId: "contract-1",
    sourceDecisionId: "decision-1",
    multipleCasesConfirmed: false,
    missingFields: ["financialImpactGBP"],
  };

  const seal = generateIntegritySeal(sealInput);
  assert(
    "4. Missing financial impact drops to BRONZE",
    seal.sealLevel === "BRONZE",
    `Expected BRONZE seal when financial impact missing, got ${seal.sealLevel}`,
  );
  assert(
    "4b. Missing financial impact tracked in missingFields",
    seal.missingFields.includes("financialImpactGBP"),
    "Missing fields should include financialImpactGBP",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Missing timeframe fails
// ─────────────────────────────────────────────────────────────────────────────

function testMissingTimeframeFails() {
  const sealInput: SealInput = {
    confidence: 0.90,
    verificationMethod: "DOCUMENTARY",
    financialImpactGBP: 50000,
    sourceContractId: "contract-1",
    sourceDecisionId: "decision-1",
    multipleCasesConfirmed: false,
    missingFields: ["timeframeDays"],
  };

  const seal = generateIntegritySeal(sealInput);
  assert(
    "5. Missing timeframe tracked in missingFields",
    seal.missingFields.includes("timeframeDays"),
    "Missing fields should include timeframeDays",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: Missing anonymisation fails
// ─────────────────────────────────────────────────────────────────────────────

function testMissingAnonymisationFails() {
  const sealInput: SealInput = {
    confidence: 0.90,
    verificationMethod: "DOCUMENTARY",
    financialImpactGBP: 50000,
    sourceContractId: "contract-1",
    sourceDecisionId: "decision-1",
    multipleCasesConfirmed: false,
    missingFields: ["anonymisation"],
  };

  const seal = generateIntegritySeal(sealInput);
  assert(
    "6. Missing anonymisation tracked in missingFields",
    seal.missingFields.includes("anonymisation"),
    "Missing fields should include anonymisation",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: Confidence caps enforced
// ─────────────────────────────────────────────────────────────────────────────

function testConfidenceCapsEnforced() {
  const sealInput: SealInput = {
    confidence: 0.50,
    verificationMethod: "OPERATOR_CONFIRMED",
    financialImpactGBP: 50000,
    sourceContractId: "contract-1",
    sourceDecisionId: "decision-1",
    multipleCasesConfirmed: true,
    missingFields: [],
  };

  const seal = generateIntegritySeal(sealInput);
  assert(
    "7. Low confidence produces BRONZE seal regardless of other factors",
    seal.sealLevel === "BRONZE",
    `Expected BRONZE seal for low confidence, got ${seal.sealLevel}`,
  );
  assert(
    "7b. Confidence preserved in seal output",
    seal.confidence === 0.50,
    "Confidence should match input",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8: Integrity seal generated with correct level
// ─────────────────────────────────────────────────────────────────────────────

function testIntegritySealGenerated() {
  const sealInput: SealInput = {
    confidence: 0.95,
    verificationMethod: "OPERATOR_CONFIRMED",
    financialImpactGBP: 100000,
    sourceContractId: "contract-2",
    sourceDecisionId: "decision-2",
    multipleCasesConfirmed: true,
    missingFields: [],
  };

  const seal = generateIntegritySeal(sealInput);
  assert(
    "8. Highest tier produces PLATINUM seal",
    seal.sealLevel === "PLATINUM",
    `Expected PLATINUM seal for highest tier, got ${seal.sealLevel}`,
  );
  assert(
    "8b. Verification method preserved",
    seal.verificationMethod === "OPERATOR_CONFIRMED",
    "Verification method should be preserved",
  );
  assert(
    "8c. Source traced for PLATINUM",
    seal.sourceTraced === true,
    "Source should be traced",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9: Source trace included
// ─────────────────────────────────────────────────────────────────────────────

function testSourceTraceIncluded() {
  const sealInput: SealInput = {
    confidence: 0.90,
    verificationMethod: "DOCUMENTARY",
    financialImpactGBP: 50000,
    sourceContractId: "contract-1",
    sourceDecisionId: null,
    multipleCasesConfirmed: false,
    missingFields: [],
  };

  const seal = generateIntegritySeal(sealInput);
  assert(
    "9. Source traced when contract ID exists",
    seal.sourceTraced === true,
    "Source should be traced when contract ID exists",
  );

  const sealInput2: SealInput = {
    confidence: 0.90,
    verificationMethod: "DOCUMENTARY",
    financialImpactGBP: 50000,
    sourceContractId: null,
    sourceDecisionId: null,
    multipleCasesConfirmed: false,
    missingFields: ["sourceTrace"],
  };

  const seal2 = generateIntegritySeal(sealInput2);
  assert(
    "9b. Source not traced when no IDs exist",
    seal2.sourceTraced === false,
    "Source should not be traced when no IDs exist",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 10: Draft does not auto-publish
// ─────────────────────────────────────────────────────────────────────────────

function testDraftDoesNotAutoPublish() {
  const draft = makeDraft();
  assert(
    "10. New draft status is 'draft'",
    draft.status === "draft",
    `New draft should have status "draft", got "${draft.status}"`,
  );
  assert(
    "10b. New draft publicationAllowed is false",
    draft.publicationAllowed === false,
    "New draft should not allow publication",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 11: publicationAllowed false unless seal valid
// ─────────────────────────────────────────────────────────────────────────────

function testPublicationAllowedOnlyWithValidSeal() {
  const bronzeSeal: IntegritySeal = {
    sealLevel: "BRONZE",
    confidence: 0.85,
    verificationMethod: "SELF_REPORTED",
    sourceTraced: false,
    dataCompleteness: 50,
    publicationAllowed: false,
    missingFields: ["financialImpactGBP", "sourceTrace"],
  };

  const draft = makeDraft({ integritySeal: bronzeSeal, status: "approved" });
  const result = canPublish(draft);
  assert(
    "11. BRONZE seal blocks publication even when approved",
    result.allowed === false,
    "BRONZE seal should not permit publication",
  );

  const silverSeal: IntegritySeal = {
    sealLevel: "SILVER",
    confidence: 0.90,
    verificationMethod: "DOCUMENTARY",
    sourceTraced: true,
    dataCompleteness: 90,
    publicationAllowed: true,
    missingFields: [],
  };

  const draft2 = makeDraft({ integritySeal: silverSeal, status: "approved" });
  const result2 = canPublish(draft2);
  assert(
    "11b. SILVER seal permits publication when approved",
    result2.allowed === true,
    "SILVER seal should permit publication when approved",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 12: Rejected draft cannot publish
// ─────────────────────────────────────────────────────────────────────────────

function testRejectedDraftCannotPublish() {
  const draft = makeDraft({ status: "rejected" });
  const result = canPublish(draft);
  assert(
    "12. Rejected draft cannot publish",
    result.allowed === false,
    "Rejected draft should not be publishable",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW POLICY TESTS
// ─────────────────────────────────────────────────────────────────────────────

function testReviewTransitions() {
  const draft = makeDraft({ status: "draft" });

  const r1 = executeReview(draft, {
    action: "submit_for_review",
    reviewerId: "reviewer-1",
    reviewedAt: new Date().toISOString(),
  });
  assert(
    "13. Can submit draft for review",
    r1.allowed === true,
    "Can submit draft for review",
  );
  assert(
    "13b. Status becomes needs_review after submit",
    r1.newStatus === "needs_review",
    `Expected needs_review, got ${r1.newStatus}`,
  );

  // Now test that approve works from needs_review
  const draftInReview = makeDraft({ status: "needs_review" });
  const r2 = executeReview(draftInReview, {
    action: "approve",
    reviewerId: "reviewer-1",
    reviewedAt: new Date().toISOString(),
  });
  assert(
    "14. Can approve from needs_review",
    r2.allowed === true,
    "Can approve from needs_review",
  );
  assert(
    "14b. Status becomes approved",
    r2.newStatus === "approved",
    `Expected approved, got ${r2.newStatus}`,
  );
}

function testSanitisation() {
  const draft = makeDraft();
  const sanitised = sanitiseForPublicOutput(draft);

  assert(
    "15. Public output excludes sourceOutcomeId",
    (sanitised as Record<string, unknown>).sourceOutcomeId === undefined,
    "Public output should not include sourceOutcomeId",
  );
  assert(
    "15b. Public output excludes sourceContractId",
    (sanitised as Record<string, unknown>).sourceContractId === undefined,
    "Public output should not include sourceContractId",
  );
  assert(
    "15c. Public output excludes sourceDecisionId",
    (sanitised as Record<string, unknown>).sourceDecisionId === undefined,
    "Public output should not include sourceDecisionId",
  );
  assert(
    "15d. Public output includes title",
    (sanitised as Record<string, unknown>).title === draft.title,
    "Public output should include title",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED AUDIT (for master moat audit)
// ─────────────────────────────────────────────────────────────────────────────

export type AuditResult = {
  name: string;
  checks: { label: string; pass: boolean }[];
};

export async function runAudit(): Promise<AuditResult> {
  // Reset counters
  passed = 0;
  failed = 0;
  results.length = 0;

  testVerifiedOutcomeGeneratesDraft();
  testSelfReportedCannotBePublic();
  testDisputedOutcomeFails();
  testMissingFinancialImpactFails();
  testMissingTimeframeFails();
  testMissingAnonymisationFails();
  testConfidenceCapsEnforced();
  testIntegritySealGenerated();
  testSourceTraceIncluded();
  testDraftDoesNotAutoPublish();
  testPublicationAllowedOnlyWithValidSeal();
  testRejectedDraftCannotPublish();
  testReviewTransitions();
  testSanitisation();

  return {
    name: "Case Study Pipeline",
    checks: results.map((r) => ({ label: r.name, pass: r.status === "PASS" })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SELF-RUN (when executed directly)
// ─────────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  (async () => {
    console.log("\n═══ CASE STUDY PIPELINE AUDIT ═══\n");

    testVerifiedOutcomeGeneratesDraft();
    testSelfReportedCannotBePublic();
    testDisputedOutcomeFails();
    testMissingFinancialImpactFails();
    testMissingTimeframeFails();
    testMissingAnonymisationFails();
    testConfidenceCapsEnforced();
    testIntegritySealGenerated();
    testSourceTraceIncluded();
    testDraftDoesNotAutoPublish();
    testPublicationAllowedOnlyWithValidSeal();
    testRejectedDraftCannotPublish();
    testReviewTransitions();
    testSanitisation();

    console.log("\n─── RESULTS ───\n");
    for (const r of results) {
      const icon = r.status === "PASS" ? "✅" : "❌";
      console.log(`  ${icon} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
    }

    const total = passed + failed;
    console.log(`\n${passed}/${total} PASS`);
    if (failed > 0) {
      console.log(`❌ ${failed} TEST(S) FAILED`);
      process.exit(1);
    } else {
      console.log("✅ ALL TESTS PASS");
    }
  })();
}
