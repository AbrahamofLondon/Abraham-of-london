/**
 * Product Surface Claim Scanner
 *
 * Scans all product-facing surfaces (pages, components, content, CTAs, checkout,
 * marketing copy, evidence pages, admin previews) for claim vocabulary.
 *
 * Maps each claim to its product, allowed authority, and required action.
 *
 * Philosophy: if the codebase CAN support the claim (has composer, can be tested),
 * mark for upgrade. Only downgrade if the claim is structurally impossible.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { getAllProducts } from "../lib/commercial/catalog";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

// Claim vocabulary to scan for
const CLAIM_VOCABULARY = [
  "judgement",
  "judgment",
  "diagnosis",
  "intelligence",
  "simulation",
  "falsification",
  "board-grade",
  "boardroom",
  "gold standard",
  "externally proven",
  "premium",
  "governed",
  "decision authority",
  "market intelligence",
  "executive-grade",
  "strategic judgement",
  "decision infrastructure",
  "retainer oversight",
  "proprietary judgement",
  "expert diagnosis",
];

interface SurfaceClaim {
  productCode: string | "unmapped";
  surfaceType: string;
  filePath: string;
  lineNumber: number;
  claimUsed: string;
  context: string;
  claimAllowedByAuthority: boolean;
  claimCapabilityExists: boolean;
  evidenceSupportingClaim: string[];
  actionRequired: "correct_now" | "plan_upgrade" | "investigate" | "accept";
}

const allClaims: SurfaceClaim[] = [];

// Get product info
const products = getAllProducts();
const productCodeMap = new Map(products.map((p) => [p.code, p]));

// Get claim authority
const claimAuthorityReport = readFileSync(
  join(REPORTS_DIR, "universal-claim-authority-gate.json"),
  "utf-8"
);
const authorityData = JSON.parse(claimAuthorityReport);

// Map products to their maximum state
const productMaxState = new Map<string, string>();
const externalBenchmark = JSON.parse(
  readFileSync(join(REPORTS_DIR, "external-product-value-benchmark.json"), "utf-8")
);

if (externalBenchmark.results) {
  externalBenchmark.results.forEach((r: any) => {
    productMaxState.set(r.productCode, r.finalStatus);
  });
}

// Scan files recursively
function scanDirectory(dir: string, surfaceType: string) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry) => {
      if (entry.name.startsWith(".")) return;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirectory(fullPath, surfaceType);
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".mdx") || entry.name.endsWith(".md"))) {
        try {
          const content = readFileSync(fullPath, "utf-8");
          scanFile(fullPath, content, surfaceType);
        } catch {
          // Skip if can't read
        }
      }
    });
  } catch {
    // Skip directories that don't exist
  }
}

function scanFile(filePath: string, content: string, surfaceType: string) {
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    CLAIM_VOCABULARY.forEach((vocab) => {
      if (line.toLowerCase().includes(vocab.toLowerCase())) {
        // Extract product code if possible
        let productCode = "unmapped";

        // Try to match product code in the line or nearby context
        products.forEach((p) => {
          if (
            line.includes(p.code) ||
            line.includes(p.displayName) ||
            filePath.includes(p.code)
          ) {
            productCode = p.code;
          }
        });

        // Determine if claim is allowed by authority
        const maxState = productMaxState.get(productCode) || "blocked_until_evidence";
        const product = productCodeMap.get(productCode);
        const isComposer = product && ["decision_tools", "reporting", "execution", "bundle", "governance_playbooks"].includes(product.category);
        const isPaid = product && product.commercialStatus === "paid";

        // Capability: if there's a composer, the claim could be supportable
        const claimCapabilityExists = productCode !== "unmapped" && isComposer;

        // Authority: is the claim currently allowed?
        let claimAllowedByAuthority = false;
        if (maxState === "externally_proven_gold") {
          claimAllowedByAuthority = true; // Can use gold/proven language
        } else if (maxState === "diagnostic_product" && vocab === "diagnosis") {
          claimAllowedByAuthority = true;
        } else if (
          maxState === "signal_product" &&
          (vocab === "signal" || vocab === "insight")
        ) {
          claimAllowedByAuthority = true;
        }

        // Determine action
        let actionRequired: "correct_now" | "plan_upgrade" | "investigate" | "accept" = "investigate";

        if (claimAllowedByAuthority) {
          actionRequired = "accept";
        } else if (claimCapabilityExists && !claimAllowedByAuthority) {
          // Product CAN support this claim via testing; plan to upgrade
          actionRequired = "plan_upgrade";
        } else if (!claimCapabilityExists && !claimAllowedByAuthority) {
          // Structurally impossible: correct now
          actionRequired = "correct_now";
        }

        allClaims.push({
          productCode,
          surfaceType,
          filePath: relative(ROOT, filePath),
          lineNumber: lineNum,
          claimUsed: vocab,
          context: line.trim().substring(0, 100),
          claimAllowedByAuthority,
          claimCapabilityExists,
          evidenceSupportingClaim: maxState === "externally_proven_gold" ? ["externally_proven"] : [],
          actionRequired,
        });
      }
    });
  });
}

// Scan key directories
console.log("Scanning product surfaces...");
["pages", "app", "components", "content", "data", "lib/commercial", "lib/product"].forEach((dir) => {
  const fullPath = join(ROOT, dir);
  try {
    scanDirectory(fullPath, dir);
  } catch {
    // Directory doesn't exist
  }
});

// Summarize
const byAction = {
  correct_now: allClaims.filter((c) => c.actionRequired === "correct_now"),
  plan_upgrade: allClaims.filter((c) => c.actionRequired === "plan_upgrade"),
  accept: allClaims.filter((c) => c.actionRequired === "accept"),
  investigate: allClaims.filter((c) => c.actionRequired === "investigate"),
};

console.log(`\nSURFACE CLAIM SCAN COMPLETE`);
console.log(`Total claims found: ${allClaims.length}`);
console.log(`Accept (authorized): ${byAction.accept.length}`);
console.log(`Plan upgrade (capability exists): ${byAction.plan_upgrade.length}`);
console.log(`Correct now (unsupported): ${byAction.correct_now.length}`);
console.log(`Investigate (unmapped): ${byAction.investigate.length}`);

// Write reports
mkdirSync(REPORTS_DIR, { recursive: true });

writeFileSync(
  join(REPORTS_DIR, "product-surface-claims.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary: {
        totalClaimsFound: allClaims.length,
        authorized: byAction.accept.length,
        planUpgrade: byAction.plan_upgrade.length,
        correctNow: byAction.correct_now.length,
        investigate: byAction.investigate.length,
      },
      byAction,
      allClaims: allClaims.sort((a, b) => a.filePath.localeCompare(b.filePath)),
    },
    null,
    2
  ) + "\n"
);

console.log(`\nWritten: ${join(REPORTS_DIR, "product-surface-claims.json")}`);

// Write markdown
const markdown = `# Product Surface Claim Scan

**Generated**: ${new Date().toISOString()}

## Summary

| Category | Count |
|----------|-------|
| Total Claims Found | ${allClaims.length} |
| Authorized Claims | ${byAction.accept.length} |
| Plan Upgrade (Capability Exists) | ${byAction.plan_upgrade.length} |
| Correct Now (Unsupported) | ${byAction.correct_now.length} |
| Investigate (Unmapped) | ${byAction.investigate.length} |

## Action Items

### Correct Now (Structurally Unsupported) — ${byAction.correct_now.length}

These claims must be corrected immediately. The product does not have the capability to support the claim.

${
  byAction.correct_now.length > 0
    ? byAction.correct_now
        .map(
          (c) =>
            `- **${c.filePath}:${c.lineNumber}** — "${c.claimUsed}" on product ${c.productCode || "unmapped"}\n  Context: "${c.context}"\n  Action: Replace with supported claim`
        )
        .join("\n")
    : "✓ None found"
}

### Plan Upgrade (Capability Exists) — ${byAction.plan_upgrade.length}

These products CAN support the claim through Wave 2 testing. Keep the claim and plan external validation.

${
  byAction.plan_upgrade.length > 0
    ? byAction.plan_upgrade
        .map(
          (c) =>
            `- **${c.filePath}:${c.lineNumber}** — "${c.claimUsed}" on product ${c.productCode}\n  Current state: ${productMaxState.get(c.productCode) || "blocked"}\n  Action: Wire route, test externally, upgrade if evidence supports`
        )
        .join("\n")
    : "✓ None found"
}

### Authorized Claims — ${byAction.accept.length}

These claims are already authorized by claim authority. No action needed.

${
  byAction.accept.length > 0
    ? byAction.accept.slice(0, 10).map((c) => `- **${c.filePath}:${c.lineNumber}** — "${c.claimUsed}" on product ${c.productCode}`)
      .join("\n") + (byAction.accept.length > 10 ? `\n... and ${byAction.accept.length - 10} more` : "")
    : "✓ None found"
}

### Investigate (Unmapped) — ${byAction.investigate.length}

These claims could not be mapped to a specific product. Manual review recommended.

${
  byAction.investigate.length > 0
    ? byAction.investigate.slice(0, 10).map((c) => `- **${c.filePath}:${c.lineNumber}** — "${c.claimUsed}"\n  Context: "${c.context}"`)
      .join("\n") + (byAction.investigate.length > 10 ? `\n... and ${byAction.investigate.length - 10} more` : "")
    : "✓ None found"
}

## Philosophy

Products with composers that can be wired to live routes are marked "plan upgrade" — the code capability exists to support the claim through external testing. Only claims on static products or products with no computation are marked "correct now."

This is capability-first evaluation, not defensiveness-first.
`;

writeFileSync(join(REPORTS_DIR, "product-surface-claims.md"), markdown);
console.log(`Written: ${join(REPORTS_DIR, "product-surface-claims.md")}`);
