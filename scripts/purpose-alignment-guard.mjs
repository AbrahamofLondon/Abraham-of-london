/**
 * scripts/purpose-alignment-guard.mjs
 *
 * Validates the Purpose Alignment paid instrument is commercially ready.
 * Checks:
 *   1. Paid result contract exists and exports buildPaidResult
 *   2. Catalog entry for personal_decision_audit is active and has Stripe IDs
 *   3. API route imports and uses the paid contract
 *   4. PDF dossier Netlify function exists
 *   5. Checkout page exists
 *   6. No forbidden claim language in PA-related files
 *   7. Decision Centre evidence loader is wired
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let errors = 0;
let warnings = 0;

function check(condition, label, detail) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${label} — ${detail}`);
    errors++;
  } else {
    console.log(`  ✅ PASS: ${label}`);
  }
}

function warn(condition, label, detail) {
  if (!condition) {
    console.warn(`  ⚠️  WARN: ${label} — ${detail}`);
    warnings++;
  } else {
    console.log(`  ✅ PASS: ${label}`);
  }
}

function fileExists(path) {
  return existsSync(join(ROOT, path));
}

function fileContains(path, pattern) {
  try {
    const content = readFileSync(join(ROOT, path), "utf-8");
    return content.includes(pattern);
  } catch {
    return false;
  }
}

console.log("\n🔍 PURPOSE ALIGNMENT GUARD — Commercial Readiness Check\n");

// 1. Paid result contract
console.log("\n📄 Paid Result Contract");
check(
  fileExists("lib/alignment/purpose-alignment-paid-contract.ts"),
  "Contract file exists",
  "lib/alignment/purpose-alignment-paid-contract.ts not found",
);
check(
  fileContains("lib/alignment/purpose-alignment-paid-contract.ts", "export function buildPaidResult"),
  "buildPaidResult exported",
  "buildPaidResult function not found in contract",
);
check(
  fileContains("lib/alignment/purpose-alignment-paid-contract.ts", "export type PurposeAlignmentPaidResult"),
  "PurposeAlignmentPaidResult type exported",
  "Type not found in contract",
);
check(
  fileContains("lib/alignment/purpose-alignment-paid-contract.ts", "export function validatePaidResult"),
  "validatePaidResult exported",
  "Validator not found in contract",
);
check(
  fileContains("lib/alignment/purpose-alignment-paid-contract.ts", "PAID_RESULT_CONTRACT"),
  "PAID_RESULT_CONTRACT exported",
  "Contract metadata not found",
);

// 2. Catalog entry
console.log("\n📦 Catalog Entry");
check(
  fileContains("lib/commercial/catalog.ts", "personal_decision_audit"),
  "personal_decision_audit in catalog",
  "Catalog entry missing",
);
check(
  fileContains("lib/commercial/catalog.ts", "stripeProductId: \"prod_UUahB8wv21HWQt\""),
  "Stripe product ID present",
  "Stripe product ID missing or changed",
);
check(
  fileContains("lib/commercial/catalog.ts", "stripePriceId: \"price_1TVbW8QFpelVFMXJzLrIQJu1\""),
  "Stripe price ID present",
  "Stripe price ID missing or changed",
);
check(
  fileContains("lib/commercial/catalog.ts", "active: true"),
  "Product is active",
  "Product not active",
);
check(
  fileContains("lib/commercial/catalog.ts", "commercialStatus: \"paid\""),
  "Commercial status is paid",
  "Status not paid",
);
check(
  fileContains("lib/commercial/catalog.ts", "deliveryFormat: \"combined\""),
  "Delivery format is combined",
  "Not set to combined delivery",
);
check(
  fileContains("lib/commercial/catalog.ts", "writesToDecisionMemory: true"),
  "Writes to decision memory",
  "Not set to write memory",
);
check(
  fileContains("lib/commercial/catalog.ts", "dossierEligible: true"),
  "Dossier eligible",
  "Not set as dossier eligible",
);

// 3. API route
console.log("\n🌐 API Route");
check(
  fileContains("app/api/purpose-alignment/assessments/route.ts", "buildPaidResult"),
  "API imports buildPaidResult",
  "buildPaidResult not imported in API route",
);
check(
  fileContains("app/api/purpose-alignment/assessments/route.ts", "resolveCanonicalEntitlement"),
  "API checks entitlement",
  "Entitlement check not found in API route",
);
check(
  fileContains("app/api/purpose-alignment/assessments/route.ts", "ENTITLEMENT CHECK"),
  "Entitlement check section exists",
  "Entitlement check section missing",
);
check(
  fileContains("app/api/purpose-alignment/assessments/route.ts", "createCheckpointForCommand"),
  "Checkpoint creation wired",
  "Checkpoint creation not found in API route",
);

// 4. PDF dossier
console.log("\n📑 PDF Dossier");
check(
  fileExists("lib/pdf/templates/PurposeAlignmentPaidDossier.tsx"),
  "Paid dossier template exists",
  "Template not found",
);
check(
  fileExists("netlify/functions_src/functions/purpose-alignment-paid-dossier.tsx"),
  "Netlify function exists",
  "Netlify function not found",
);
check(
  fileContains("netlify/functions_src/functions/purpose-alignment-paid-dossier.tsx", "resolveCanonicalEntitlement"),
  "PDF function checks entitlement",
  "Entitlement check not found in PDF function",
);
check(
  fileContains("netlify/functions_src/functions/purpose-alignment-paid-dossier.tsx", "PURCHASE_REQUIRED"),
  "PDF function returns 403 for unentitled",
  "403 response not found in PDF function",
);

// 5. Checkout page
console.log("\n🛒 Checkout");
check(
  fileExists("pages/checkout/personal-decision-audit.tsx"),
  "Checkout page exists",
  "Checkout page not found",
);
check(
  !fileContains("pages/checkout/personal-decision-audit.tsx", "@stripe/stripe-js"),
  "No @stripe/stripe-js dependency in checkout page",
  "Remove @stripe/stripe-js import from checkout page",
);

// 6. Front-end integration
console.log("\n🖥️  Front-end Integration");
check(
  fileContains("pages/diagnostics/purpose-alignment.tsx", "entitlementState"),
  "Page has entitlement state tracking",
  "Entitlement state not found in page",
);
check(
  fileContains("pages/diagnostics/purpose-alignment.tsx", "paid_unlocked"),
  "Page has paid_unlocked state label",
  "Paid unlocked state not found",
);
check(
  fileContains("pages/diagnostics/purpose-alignment.tsx", "isPaidEntitled"),
  "Page passes isPaidEntitled prop",
  "Prop not passed to component",
);
check(
  fileContains("lib/alignment/PurposeAlignmentAssessment.tsx", "isPaidEntitled"),
  "Component accepts isPaidEntitled prop",
  "Prop not accepted in component",
);
check(
  fileContains("lib/alignment/PurposeAlignmentAssessment.tsx", "isPaid && paidResult"),
  "Component conditionally shows paid result",
  "Paid result conditional rendering not found",
);

// 7. Decision Centre integration
console.log("\n🏛️  Decision Centre");
check(
  fileContains("pages/api/decision-centre/cases.ts", "loadPurposeAlignmentEvidence"),
  "DC API loads PA evidence",
  "PA evidence loader not found in DC API",
);
check(
  fileContains("pages/api/decision-centre/cases.ts", "convertPurposeAlignmentToGovernedMemory"),
  "DC API converts PA to governed memory",
  "Converter not found in DC API",
);

// 8. Corridor bridge
console.log("\n🌉 Corridor Bridge");
check(
  fileExists("lib/alignment/purpose-alignment-corridor-bridge.ts"),
  "Corridor bridge module exists",
  "Module not found",
);
check(
  fileContains("lib/alignment/purpose-alignment-corridor-bridge.ts", "buildCorridorBridgePayload"),
  "buildCorridorBridgePayload exported",
  "Function not found",
);
check(
  fileContains("lib/alignment/purpose-alignment-corridor-bridge.ts", "paidResultToEvidenceCarryForward"),
  "paidResultToEvidenceCarryForward exported",
  "Function not found",
);
check(
  fileContains("lib/alignment/purpose-alignment-corridor-bridge.ts", "buildPaidResultDecisionCentreMemory"),
  "buildPaidResultDecisionCentreMemory exported",
  "Function not found",
);
check(
  fileContains("lib/alignment/purpose-alignment-corridor-bridge.ts", "FUTURE_CORRIDOR_DEFINITION"),
  "Future corridor definition exists",
  "Future corridor definition not found",
);

// 9. Forbidden claim language
console.log("\n🚫 Forbidden Language Check");
const forbiddenPatterns = [
  "Automatically creates a full Decision Centre case",
  "Guaranteed clarity",
  "Therapeutic insight",
  "Find your destiny",
  "Unlock your potential",
];
const paFiles = [
  "lib/alignment/purpose-alignment-paid-contract.ts",
  "lib/alignment/purpose-alignment-corridor-bridge.ts",
  "pages/checkout/personal-decision-audit.tsx",
  "pages/diagnostics/purpose-alignment.tsx",
  "lib/alignment/PurposeAlignmentAssessment.tsx",
  "lib/commercial/catalog.ts",
  "app/api/purpose-alignment/assessments/route.ts",
];
for (const pattern of forbiddenPatterns) {
  let found = false;
  for (const file of paFiles) {
    if (fileContains(file, pattern)) {
      found = true;
      break;
    }
  }
  check(!found, `No "${pattern}" in PA files`, `Found forbidden language: ${pattern}`);
}

console.log(`\n${"=".repeat(50)}`);
console.log(`RESULTS: ${errors} errors, ${warnings} warnings`);
console.log(`${"=".repeat(50)}`);

if (errors > 0) {
  console.error("\n❌ PURPOSE ALIGNMENT GUARD FAILED — Fix errors before promotion\n");
  process.exit(1);
} else {
  console.log("\n✅ PURPOSE ALIGNMENT GUARD PASSED — Commercially ready\n");
}
