#!/usr/bin/env node
/**
 * scripts/validate-policy-routed-checkout.ts
 *
 * Validates that the policy-routed checkout system is correctly implemented.
 * Checks:
 * 1. All products have explicit commercial policies
 * 2. No product is missing a policy
 * 3. Policy consistency (no contradictions)
 * 4. All failure codes have customer-friendly messages
 * 5. No raw internal blockers exposed
 */

import { COMMERCIAL_ACCESS_POLICIES, validatePolicies } from "@/lib/commercial/commercial-access-policy";
import { CHECKOUT_FAILURE_MESSAGES } from "@/lib/commercial/checkout-failure-code";

function validateCheckoutSystem() {
  console.log("🔍 Validating policy-routed checkout system...\n");

  let passed = 0;
  let failed = 0;

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Policy Registry Coverage
  // ─────────────────────────────────────────────────────────────────────────
  console.log("1️⃣  Policy Registry Coverage:");

  const expectedProducts = [
    "gmi_q2_2026",
    "decision_exposure",
    "decision_alignment_gap_map",
    "mandate_clarity_framework",
    "execution_risk_index",
    "executive_reporting",
    "boardroom_brief",
    "professional",
    "professional_annual",
    "enterprise",
    "additional_collaborator",
    "fast_diagnostic",
  ];

  let allProductsCovered = true;
  for (const product of expectedProducts) {
    const policy = COMMERCIAL_ACCESS_POLICIES[product];
    if (!policy) {
      console.log(`   ❌ Missing policy for ${product}`);
      allProductsCovered = false;
      failed++;
    }
  }

  if (allProductsCovered) {
    console.log(`   ✅ All ${expectedProducts.length} products have explicit policies`);
    passed++;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Policy Consistency Validation
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n2️⃣  Policy Consistency:");

  const errors = validatePolicies();
  if (errors.length === 0) {
    console.log("   ✅ All policies are consistent (no validation errors)");
    passed++;
  } else {
    for (const error of errors) {
      console.log(`   ❌ ${error.productCode}: ${error.error}`);
    }
    failed += errors.length;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Failure Code Coverage
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n3️⃣  Failure Code Coverage:");

  const missingMessages: string[] = [];
  for (const [code, message] of Object.entries(CHECKOUT_FAILURE_MESSAGES)) {
    if (!message.publicMessage || message.publicMessage.length === 0) {
      missingMessages.push(code);
    }
  }

  if (missingMessages.length === 0) {
    console.log(`   ✅ All ${Object.keys(CHECKOUT_FAILURE_MESSAGES).length} failure codes have public messages`);
    passed++;
  } else {
    for (const code of missingMessages) {
      console.log(`   ❌ Missing public message for ${code}`);
    }
    failed += missingMessages.length;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Message Quality (No Technical Jargon)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n4️⃣  Message Quality (No Technical Jargon):");

  const technicalCodes = [
    "RELEASE_PROOF_MISSING",
    "DIAGNOSTIC_JOURNEY",
    "INTELLIGENCE_SPINE",
    "ADMISSION_RESTRICTED",
    "PREREQUISITE",
    "BLOCKAGE",
    "GATE",
  ];

  let messageQualityOk = true;
  for (const [failureCode, response] of Object.entries(CHECKOUT_FAILURE_MESSAGES)) {
    for (const tech of technicalCodes) {
      if (response.publicMessage.toUpperCase().includes(tech.toUpperCase())) {
        console.log(`   ❌ ${failureCode}: Message contains technical term "${tech}"`);
        messageQualityOk = false;
      }
    }
  }

  if (messageQualityOk) {
    console.log("   ✅ No technical jargon in failure messages");
    passed++;
  } else {
    failed++;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Prerequisite Policy Mapping
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n5️⃣  Prerequisite Policy Mapping:");

  const policyMapping: Record<string, string> = {
    NONE: "No prerequisite",
    RELEASE_RECEIPT: "Durable release receipt required (GMI)",
    INTELLIGENCE_SPINE: "Diagnostic journey required",
    EXECUTIVE_REPORTING_ADMISSION: "Custom admission evaluator",
    BOARDROOM_HANDOFF: "Boardroom-specific rules",
  };

  let mappingOk = true;
  for (const policy of Object.values(COMMERCIAL_ACCESS_POLICIES)) {
    if (!policyMapping[policy.prerequisitePolicy]) {
      console.log(`   ❌ Unknown prerequisite policy: ${policy.prerequisitePolicy}`);
      mappingOk = false;
    }
  }

  if (mappingOk) {
    console.log("   ✅ All prerequisite policies are recognized");
    passed++;
  } else {
    failed++;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Specific Product Checks
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n6️⃣  Specific Product Checks:");

  // GMI Q2 must have RELEASE_RECEIPT prerequisite
  const gmiPolicy = COMMERCIAL_ACCESS_POLICIES.gmi_q2_2026;
  if (gmiPolicy?.prerequisitePolicy === "RELEASE_RECEIPT") {
    console.log("   ✅ GMI Q2: RELEASE_RECEIPT prerequisite");
    passed++;
  } else {
    console.log("   ❌ GMI Q2: Missing RELEASE_RECEIPT prerequisite");
    failed++;
  }

  // Decision instruments must have NONE prerequisite
  const decisionInstruments = [
    "decision_exposure",
    "decision_alignment_gap_map",
    "mandate_clarity_framework",
    "execution_risk_index",
  ];

  let allDecisionNone = true;
  for (const product of decisionInstruments) {
    const policy = COMMERCIAL_ACCESS_POLICIES[product];
    if (policy?.prerequisitePolicy !== "NONE") {
      console.log(`   ❌ ${product}: Not NONE prerequisite`);
      allDecisionNone = false;
    }
  }

  if (allDecisionNone) {
    console.log("   ✅ All decision instruments: NONE prerequisite (no diagnostic required)");
    passed++;
  } else {
    failed++;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log("═".repeat(60));

  if (failed === 0) {
    console.log("\n🎉 Policy-routed checkout system is VALID and ready for production!");
    process.exit(0);
  } else {
    console.log("\n⚠️  System validation failed. Please fix errors above.");
    process.exit(1);
  }
}

validateCheckoutSystem();
