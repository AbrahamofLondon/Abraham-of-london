/**
 * Script to update catalog.ts with Stripe IDs and commercial statuses.
 * Run: npx tsx scripts/update-catalog.ts
 */
import * as fs from "fs";
import * as path from "path";

const filePath = path.resolve(__dirname, "../lib/commercial/catalog.ts");
let content = fs.readFileSync(filePath, "utf8");

// ─── 1. Update Professional Monthly ───────────────────────────────────────
content = content.replace(
  `  professional: {
    code: "professional",
    displayName: "Professional",
    marketName: "Professional",
    publicLabel: "Professional",
    amount: 0,
    displayPrice: "TBC",
    stripeProductId: null,
    stripePriceId: null,`,
  `  professional: {
    code: "professional",
    displayName: "Professional",
    marketName: "Professional",
    publicLabel: "Professional",
    amount: 5900,
    displayPrice: "£59/month",
    stripeProductId: "prod_UWwpCLnxMuqDff",
    stripePriceId: "price_1TXsvkQFpelVFMXJ4OSKRCiR",`
);

// ─── 2. Update Professional Annual ────────────────────────────────────────
content = content.replace(
  `  professional_annual: {
    code: "professional_annual",
    displayName: "Professional Annual",
    marketName: "Professional Annual",
    publicLabel: "Professional Annual",
    amount: 0,
    displayPrice: "TBC",
    stripeProductId: null,
    stripePriceId: null,`,
  `  professional_annual: {
    code: "professional_annual",
    displayName: "Professional Annual",
    marketName: "Professional Annual",
    publicLabel: "Professional Annual",
    amount: 59000,
    displayPrice: "£590/year",
    stripeProductId: "prod_UWwsNbIyuncGmT",
    stripePriceId: "price_1TXsyXQFpelVFMXJp9Ey5FiB",`
);

// ─── 3. Update Executive Reporting ────────────────────────────────────────
content = content.replace(
  `  executive_reporting: {
    code: "executive_reporting",
    displayName: "Executive Reporting",
    amount: 29500,
    displayPrice: "£295",
    stripeProductId: "prod_SQGrT5cFHJ3MFH",
    stripePriceId: "price_1TP22XQFpelVFMXJ4IWRIaqb",`,
  `  executive_reporting: {
    code: "executive_reporting",
    displayName: "Executive Reporting",
    amount: 29500,
    displayPrice: "£295",
    stripeProductId: "prod_UWxIps4rApNxcx",
    stripePriceId: "price_1TXtNlQFpelVFMXJtn73BFTl",`
);

// ─── 4. Update Additional Collaborator ────────────────────────────────────
content = content.replace(
  `  additional_collaborator: {
    code: "additional_collaborator",
    displayName: "Additional Collaborator",
    marketName: "Additional Collaborator",
    publicLabel: "Additional Collaborator",
    amount: 1500,
    displayPrice: "£15/month",
    stripeProductId: null,
    stripePriceId: null,`,
  `  additional_collaborator: {
    code: "additional_collaborator",
    displayName: "Additional Collaborator",
    marketName: "Additional Collaborator",
    publicLabel: "Additional Collaborator",
    amount: 1500,
    displayPrice: "£15/month",
    stripeProductId: "prod_UWwvGUtEuJn6mx",
    stripePriceId: null,`
);

// ─── 5. Add commercialStatus: "paid" to all active paid products missing it ──
const paidProductsMissingStatus = [
  "decision_exposure_instrument",
  "mandate_clarity_framework",
  "intervention_path_selector",
  "escalation_readiness_scorecard",
  "structural_failure_diagnostic_canvas",
  "execution_risk_index",
  "team_alignment_gap_map",
  "governance_drift_detector",
  "strategic_priority_stack_builder",
  "board_brief_builder",
  "operator_decision_pack",
  "executive_reporting",
  "strategy_room",
  "strategy_room_extended",
];

for (const code of paidProductsMissingStatus) {
  // Find the product block and add commercialStatus + requiresCheckout after "active: true,"
  const regex = new RegExp(`(${code}: \\{[^}]*?active: true,)([^}]*?)(\\n  \\})`, "s");
  const match = content.match(regex);
  if (match) {
    const block = match[0];
    // Check if commercialStatus already exists
    if (!block.includes("commercialStatus:")) {
      const updated = block.replace(
        "active: true,",
        "active: true,\n    commercialStatus: \"paid\",\n    requiresCheckout: true,"
      );
      content = content.replace(block, updated);
      console.log(`  ✅ Updated ${code} with commercialStatus: "paid"`);
    } else {
      console.log(`  ⏭️  ${code} already has commercialStatus`);
    }
  } else {
    console.log(`  ❌ Could not find ${code}`);
  }
}

// ─── 6. Update professional commercialStatus ──────────────────────────────
content = content.replace(
  `    commercialStatus: "free_controlled",\n    requiresCheckout: false,\n    requiresContract: false,\n    futurePaidCandidate: true,`,
  `    commercialStatus: "paid",\n    requiresCheckout: true,\n    requiresContract: false,\n    futurePaidCandidate: false,`
);

// ─── 7. Update professional_annual commercialStatus ───────────────────────
content = content.replace(
  `    commercialStatus: "free_controlled",\n    requiresCheckout: false,\n    requiresContract: false,\n    futurePaidCandidate: true,`,
  `    commercialStatus: "paid",\n    requiresCheckout: true,\n    requiresContract: false,\n    futurePaidCandidate: false,`
);

// ─── 8. Update enterprise ─────────────────────────────────────────────────
content = content.replace(
  `    commercialStatus: "contracted",\n    requiresCheckout: false,\n    requiresContract: false,`,
  `    commercialStatus: "contracted",\n    requiresCheckout: false,\n    requiresContract: true,`
);

// ─── 9. Update additional_collaborator ────────────────────────────────────
content = content.replace(
  `    commercialStatus: "free_controlled",\n    requiresCheckout: false,\n    requiresContract: false,\n    futurePaidCandidate: true,`,
  `    commercialStatus: "manual_billing",\n    requiresCheckout: false,\n    requiresContract: false,\n    futurePaidCandidate: true,`
);

// ─── 10. Update gmi_q1_2026 — mark inactive (stale, not actively sold) ────
content = content.replace(
  `    active: true,\n    successPath: "/artifacts/global-market-intelligence-report-q1-2026",`,
  `    active: false,\n    commercialStatus: "inactive",\n    successPath: "/artifacts/global-market-intelligence-report-q1-2026",`
);

// ─── 11. Add commercialStatus to case dossiers ────────────────────────────
for (const code of ["case_dossier_tariff_shock", "case_dossier_team_alignment", "case_dossier_escalation_denied"]) {
  const regex = new RegExp(`(${code}: \\{[^}]*?active: true,)([^}]*?)(\\n  \\})`, "s");
  const match = content.match(regex);
  if (match) {
    const block = match[0];
    if (!block.includes("commercialStatus:")) {
      const updated = block.replace(
        "active: true,",
        "active: true,\n    commercialStatus: \"free_controlled\","
      );
      content = content.replace(block, updated);
      console.log(`  ✅ Updated ${code} with commercialStatus: "free_controlled"`);
    }
  }
}

// ─── 12. Update retainer products ─────────────────────────────────────────
for (const code of ["retainer_core", "retainer_operational", "retainer_institutional"]) {
  const regex = new RegExp(`(${code}: \\{[^}]*?active: (false|true),)([^}]*?)(\\n  \\})`, "s");
  const match = content.match(regex);
  if (match) {
    const block = match[0];
    if (!block.includes("commercialStatus:")) {
      const updated = block.replace(
        "active: false,",
        "active: false,\n    commercialStatus: \"contracted\",\n    requiresContract: true,\n    requiresCheckout: false,"
      );
      content = content.replace(block, updated);
      console.log(`  ✅ Updated ${code} with commercialStatus: "contracted"`);
    }
  }
}

// ─── 13. Update inactive products with Stripe IDs ─────────────────────────
for (const code of ["operator_essentials_pack", "command_pack", "governance_suite", "executive_reporting_priority"]) {
  const regex = new RegExp(`(${code}: \\{[^}]*?active: false,)([^}]*?)(\\n  \\})`, "s");
  const match = content.match(regex);
  if (match) {
    const block = match[0];
    if (!block.includes("commercialStatus:")) {
      const updated = block.replace(
        "active: false,",
        "active: false,\n    commercialStatus: \"inactive\","
      );
      content = content.replace(block, updated);
      console.log(`  ✅ Updated ${code} with commercialStatus: "inactive"`);
    }
  }
}

// ─── 14. Add commercialStatus to inner_circle ─────────────────────────────
content = content.replace(
  `    active: false,\n    successPath: "/inner-circle",`,
  `    active: false,\n    commercialStatus: "inactive",\n    successPath: "/inner-circle",`
);

// ─── 15. Add commercialStatus to diagnostic reports ───────────────────────
for (const code of ["diagnostic_report_basic", "diagnostic_report_pro"]) {
  content = content.replace(
    `    active: false,\n    successPath: "/diagnostics",`,
    `    active: false,\n    commercialStatus: "inactive",\n    successPath: "/diagnostics",`
  );
}

// ─── Write ────────────────────────────────────────────────────────────────
fs.writeFileSync(filePath, content, "utf8");
console.log("\n✅ Catalog updated successfully!");
