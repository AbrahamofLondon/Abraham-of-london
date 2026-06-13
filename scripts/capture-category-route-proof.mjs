#!/usr/bin/env node

/**
 * scripts/capture-category-route-proof.mjs
 *
 * Live Route Capture Proof
 *
 * Audits major routes to verify that:
 * 1. ProductAuthorityContract is rendered (not just imported)
 * 2. Evidence state is visible
 * 3. Authority state is visible
 * 4. Limitations are visible
 * 5. Next evidence action is visible
 * 6. Market pain is clear
 * 7. Generic-AI contrast exists
 * 8. Unsupported claims are blocked
 *
 * Routes to check:
 * - Landing page (market pain clarity)
 * - Decision pressure page
 * - Fast diagnostic entry
 * - Fast diagnostic results
 * - Team assessment page
 * - Enterprise assessment page
 * - Personal decision audit
 * - Admin control room
 * - Executive reporting
 * - Market report / library
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { globSync } from "glob";
import { auditRouteForCategory, getProofStatus } from "./lib/audit-route-render-proof.mjs";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

console.log("CATEGORY ROUTE PROOF CAPTURE");
console.log("Auditing major product routes for evidence-governed demonstration\n");

// Major routes to audit — estate-wide expansion
const ROUTES_TO_AUDIT = [
  // Reference routes (already wired)
  {
    path: "pages/foundry/decision-test.tsx",
    route: "/foundry/decision-test",
    name: "Fast Diagnostic — Decision Test",
    type: "product",
    productCode: "fast_diagnostic",
    expectations: {
      rendersAuthorityState: true,
      showsEvidence: true,
      showsLimitations: false,
    },
  },
  {
    path: "pages/enterprise-decision-scan.tsx",
    route: "/enterprise-decision-scan",
    name: "Enterprise Assessment — Decision Scan",
    type: "product",
    productCode: "enterprise_assessment",
    expectations: {
      rendersAuthorityState: true,
      showsEvidence: true,
      showsLimitations: true,
    },
  },
  {
    path: "pages/decision-centre.tsx",
    route: "/decision-centre",
    name: "Decision Centre — Authority Overview",
    type: "admin",
    expectations: {
      rendersAuthorityState: true,
      showsEvidence: true,
      showsBlockingReasons: true,
      showsNextAction: true,
    },
  },
  // Expansion routes (estate-wide)
  {
    path: "pages/checkout/personal-decision-audit.tsx",
    route: "/checkout/personal-decision-audit",
    name: "Checkout — Personal Decision Audit",
    type: "checkout",
    productCode: "personal_decision_audit",
    expectations: {
      rendersAuthorityState: true,
      showsEvidence: true,
      showsLimitations: true,
    },
  },
  {
    path: "pages/diagnostics/executive-reporting/run.tsx",
    route: "/diagnostics/executive-reporting/run",
    name: "Executive Reporting",
    type: "product",
    expectations: {
      rendersAuthorityState: true,
      showsEvidence: true,
    },
  },
  {
    path: "pages/library/index.tsx",
    route: "/library",
    name: "Library Index",
    type: "reference",
    expectations: {
      rendersAuthorityState: false,
      purpose: "content_reference_not_product_claim",
    },
  },
  {
    path: "pages/test-your-decision.tsx",
    route: "/test-your-decision",
    name: "Test Your Decision",
    type: "hub",
    expectations: {
      rendersAuthorityState: false,
      purpose: "routing_hub_not_product_claim",
    },
  },
];

const findings = {
  routesAudited: 0,
  routesDemonstrating: 0,
  routesWithAuthority: 0,
  routesWithEvidence: 0,
  routesWithLimitations: 0,
  routesWithNextAction: 0,
  overclaim_risks: 0,
  routes: [],
};

// Audit each route
for (const routeConfig of ROUTES_TO_AUDIT) {
  const filePath = join(ROOT, routeConfig.path);

  let content = "";
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (e) {
    // Try alternative paths
    const alternatives = [
      routeConfig.path.replace(/\.tsx$/, ".jsx"),
      routeConfig.path.replace(/pages/, "app").replace(/\.tsx$/, ""),
      `app${routeConfig.route}/page.tsx`,
      `app${routeConfig.route}/layout.tsx`,
    ];

    for (const alt of alternatives) {
      try {
        const altPath = join(ROOT, alt);
        content = readFileSync(altPath, "utf-8");
        break;
      } catch {}
    }
  }

  if (!content) {
    findings.routes.push({
      route: routeConfig.route,
      name: routeConfig.name,
      status: "route_not_found",
      path: routeConfig.path,
    });
    continue;
  }

  findings.routesAudited++;

  const analysis = auditRouteForCategory(
    routeConfig.route,
    content,
    routeConfig
  );
  const proofStatus = getProofStatus(analysis);

  // Count features
  if (analysis.readiness === "category_demonstrated") {
    findings.routesDemonstrating++;
  }
  if (
    analysis.rendersEvidence.ProductAuthorityBadge ||
    analysis.rendersEvidence.ProductAuthorityPanel
  ) {
    findings.routesWithAuthority++;
  }
  if (analysis.showsInformation.currentAuthorityState) {
    findings.routesWithEvidence++;
  }
  if (analysis.showsInformation.limitations) {
    findings.routesWithLimitations++;
  }
  if (analysis.showsInformation.nextAction) {
    findings.routesWithNextAction++;
  }
  if (proofStatus.overclaim_risk) {
    findings.overclaim_risks++;
  }

  findings.routes.push({
    route: routeConfig.route,
    name: routeConfig.name,
    readiness: analysis.readiness,
    demonstrating: analysis.readiness === "category_demonstrated",
    renders: {
      badge: analysis.rendersEvidence.ProductAuthorityBadge,
      panel: analysis.rendersEvidence.ProductAuthorityPanel,
      notice: analysis.rendersEvidence.ProductAuthorityNotice,
      evidenceStatus: analysis.rendersEvidence.ProductEvidenceStatus,
    },
    shows: {
      authority: analysis.showsInformation.currentAuthorityState,
      publicClaim: analysis.showsInformation.publicClaimLanguage,
      blocking: analysis.showsInformation.blockingReasons,
      nextAction: analysis.showsInformation.nextAction,
      limitations: analysis.showsInformation.limitations,
      source: analysis.showsInformation.evidenceSource,
    },
    overclaim_risk: proofStatus.overclaim_risk,
    meetsStandard:
      analysis.meetsProductPageStandard ||
      analysis.meetsAdminPageStandard ||
      false,
  });

  console.log(`\n${routeConfig.name} (${routeConfig.route})`);
  console.log(`  Readiness: ${analysis.readiness}`);
  console.log(
    `  Authority rendered: ${analysis.rendersEvidence.ProductAuthorityPanel || analysis.rendersEvidence.ProductAuthorityBadge ? "✓" : "✗"}`
  );
  console.log(
    `  Evidence visible: ${analysis.showsInformation.currentAuthorityState ? "✓" : "✗"}`
  );
  console.log(
    `  Limitations shown: ${analysis.showsInformation.limitations ? "✓" : "✗"}`
  );
  console.log(
    `  Next action clear: ${analysis.showsInformation.nextAction ? "✓" : "✗"}`
  );
  if (proofStatus.overclaim_risk) {
    console.log(`  ⚠️  OVERCLAIM RISK DETECTED`);
  }
}

// Summary
console.log(`\n${"=".repeat(70)}`);
console.log("CATEGORY ROUTE PROOF — SUMMARY");
console.log(`${"=".repeat(70)}`);
console.log(`\nRoutes audited: ${findings.routesAudited}/${ROUTES_TO_AUDIT.length}`);
console.log(`Routes demonstrating category: ${findings.routesDemonstrating}`);
console.log(`Routes with authority visible: ${findings.routesWithAuthority}`);
console.log(`Routes with evidence visible: ${findings.routesWithEvidence}`);
console.log(`Routes with limitations shown: ${findings.routesWithLimitations}`);
console.log(`Routes with next action clear: ${findings.routesWithNextAction}`);
console.log(`Overclaim risks detected: ${findings.overclaim_risks}`);

console.log(`\n${"=".repeat(70)}`);
console.log("ROUTES DEMONSTRATING CATEGORY");
console.log(`${"=".repeat(70)}`);
findings.routes
  .filter((r) => r.demonstrating)
  .forEach((r) => {
    console.log(`  ✓ ${r.name} (${r.route})`);
  });

if (findings.routes.filter((r) => r.demonstrating).length === 0) {
  console.log(`  ⚠️  No routes currently demonstrate the category`);
}

console.log(`\n${"=".repeat(70)}`);
console.log("ROUTES NEEDING WORK");
console.log(`${"=".repeat(70)}`);
findings.routes
  .filter((r) => !r.demonstrating && r.status !== "route_not_found")
  .forEach((r) => {
    console.log(`  ⚠️  ${r.name} (${r.route})`);
    console.log(
      `     Status: ${r.readiness}`
    );
    if (r.overclaim_risk) {
      console.log(`     ⚠️  Overclaim risk`);
    }
  });

// Determine overall gate status
const categoryDemonstrated = findings.routesDemonstrating >= 3;
const gateStatus = categoryDemonstrated ? "PASSED" : "FAILED";

console.log(`\n${"=".repeat(70)}`);
console.log("CATEGORY DEMONSTRATION STATUS");
console.log(`${"=".repeat(70)}`);
console.log(
  `\nTarget: At least 3 routes demonstrating category`
);
console.log(
  `Current: ${findings.routesDemonstrating} routes demonstrating category`
);
console.log(`\nGate Status: ${gateStatus === "PASSED" ? "✓ PASSED" : "✗ FAILED"}`);

// Write reports
mkdirSync(REPORTS_DIR, { recursive: true });

writeFileSync(
  join(REPORTS_DIR, "category-route-proof.json"),
  JSON.stringify(findings, null, 2) + "\n"
);

const markdownReport = `# Category Route Proof — Live Audit Report

**Audit Date:** ${new Date().toISOString()}

## Gate Status

**Status:** ${gateStatus === "PASSED" ? "✓ PASSED" : "✗ FAILED"}

## Route Audit Results

**Routes Audited:** ${findings.routesAudited}/${ROUTES_TO_AUDIT.length}
**Routes Demonstrating Category:** ${findings.routesDemonstrating}
**Routes With Authority Visible:** ${findings.routesWithAuthority}
**Routes With Evidence Visible:** ${findings.routesWithEvidence}
**Routes With Limitations Shown:** ${findings.routesWithLimitations}
**Overclaim Risks Detected:** ${findings.overclaim_risks}

## Routes Demonstrating Category Experience

${findings.routes
  .filter((r) => r.demonstrating)
  .map(
    (r) => `
### ${r.name} (\`${r.route}\`)

**Status:** ✓ Category Demonstrated

**Rendered Components:**
- ProductAuthorityBadge: ${r.renders.badge ? "✓" : "✗"}
- ProductAuthorityPanel: ${r.renders.panel ? "✓" : "✗"}
- ProductAuthorityNotice: ${r.renders.notice ? "✓" : "✗"}
- ProductEvidenceStatus: ${r.renders.evidenceStatus ? "✓" : "✗"}

**Information Visible:**
- Authority State: ${r.shows.authority ? "✓" : "✗"}
- Public Claim Language: ${r.shows.publicClaim ? "✓" : "✗"}
- Blocking Reasons: ${r.shows.blocking ? "✓" : "✗"}
- Next Evidence Action: ${r.shows.nextAction ? "✓" : "✗"}
- Limitations: ${r.shows.limitations ? "✓" : "✗"}
- Evidence Source: ${r.shows.source ? "✓" : "✗"}
`
  )
  .join("\n")}

## Routes Needing Work

${findings.routes
  .filter((r) => !r.demonstrating && r.status !== "route_not_found")
  .map(
    (r) => `
### ${r.name} (\`${r.route}\`)

**Status:** ${r.readiness}

**What's Missing:**
- Authority Rendered: ${r.renders.panel || r.renders.badge ? "✓" : "✗ Needs ProductAuthorityPanel or Badge"}
- Evidence Visible: ${r.shows.authority ? "✓" : "✗ Show currentAuthorityState"}
- Limitations Clear: ${r.shows.limitations ? "✓" : "✗ Show limitations"}
- Next Action: ${r.shows.nextAction ? "✓" : "✗ Show nextEvidenceAction"}
${r.overclaim_risk ? "- ⚠️  OVERCLAIM RISK: Claims authority without showing evidence" : ""}
`
  )
  .join("\n")}

## Category Demonstration Requirements

Each route demonstrating the category must:

1. ✓ Render a ProductAuthorityContract component (Badge, Panel, or Notice)
2. ✓ Show current authority state (not just claim it)
3. ✓ Show evidence status (what exists, what's missing)
4. ✓ Show limitations (what's blocked, why)
5. ✓ Show next evidence action (what to do)
6. ✓ Link to canonical evidence (where to verify)
7. ✓ Explain market pain being solved
8. ✓ Show contrast vs generic AI

## Remaining Blockers

${
  findings.overclaim_risks > 0
    ? `- **Overclaim Risk:** ${findings.overclaim_risks} route(s) make claims without showing evidence support\n`
    : ""
}
- **Hidden Infrastructure:** ${findings.routesAudited - findings.routesDemonstrating} route(s) have not yet wired ProductAuthorityContract into visible experience
- **Target Gap:** Need ${Math.max(0, 3 - findings.routesDemonstrating)} more routes demonstrating category

---

**Report Generated:** ${new Date().toISOString()}
**Gate Status:** ${gateStatus}
`;

writeFileSync(
  join(REPORTS_DIR, "category-route-proof.md"),
  markdownReport + "\n"
);

console.log(`\nWritten: ${join(REPORTS_DIR, "category-route-proof.json")}`);
console.log(`Written: ${join(REPORTS_DIR, "category-route-proof.md")}`);

process.exit(gateStatus === "PASSED" ? 0 : 1);
