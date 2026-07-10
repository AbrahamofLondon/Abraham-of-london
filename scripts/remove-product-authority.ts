#!/usr/bin/env node
/**
 * scripts/remove-product-authority.ts
 * Remove ProductAuthority imports and JSX from all public pages
 */

import * as fs from "fs";
import * as path from "path";

const PAGES = [
  "pages/test-your-decision.tsx",
  "pages/report/[reportId].tsx",
  "pages/enterprise-decision-scan.tsx",
  "pages/diagnostics/executive-reporting/run.tsx",
  "pages/decision-instruments/team-alignment-gap-map/run.tsx",
  "pages/decision-instruments/strategic-priority-stack-builder/run.tsx",
  "pages/decision-instruments/structural-failure-diagnostic-canvas/run.tsx",
  "pages/decision-instruments/mandate-clarity-framework/run.tsx",
  "pages/decision-instruments/intervention-path-selector/run.tsx",
  "pages/decision-instruments/governance-drift-detector/run.tsx",
  "pages/decision-instruments/execution-risk-index/run.tsx",
  "pages/decision-instruments/escalation-readiness-scorecard/run.tsx",
  "pages/decision-instruments/decision-exposure-instrument/run.tsx",
  "pages/decision-instruments/board-brief-builder/run.tsx",
  "pages/checkout/personal-decision-audit.tsx",
  "pages/boardroom-brief.tsx",
  "pages/decision-centre.tsx",
];

function removeProductAuthority(content: string): string {
  // Remove ProductAuthority imports
  content = content.replace(
    /import\s+{[^}]*ProductAuthority[^}]*}\s+from\s+["']@\/components\/product\/ProductAuthority[^"']*["'];?\n?/g,
    ""
  );

  // Remove resolve-product-authority imports
  content = content.replace(
    /import\s+{[^}]*(?:resolveProductAuthority|PUBLIC_NON_EXEMPT_PRODUCT_AUTHORITY_CONFIGS|getDefaultProductConfigurations)[^}]*}\s+from\s+["']@\/lib\/product\/resolve-product-authority["'];?\n?/g,
    ""
  );

  // Remove config/contract variable assignments
  content = content.replace(
    /\s*const\s+\w*config\s*=\s*PUBLIC_NON_EXEMPT_PRODUCT_AUTHORITY_CONFIGS\.find\([^)]*\);?\n?/g,
    ""
  );
  content = content.replace(
    /\s*const\s+\w*contract\s*=\s*\w*config\s*\?\s*resolveProductAuthority\([^)]*\)\s*:\s*null;?\n?/g,
    ""
  );
  content = content.replace(
    /\s*const\s+\w*\s*=\s*(?:resolveProductAuthority|getDefaultProductConfigurations)\([^)]*\);?\n?/g,
    ""
  );

  // Remove JSX blocks containing ProductAuthority
  // Pattern: {!result && contract &&... through closing }
  content = content.replace(
    /\s*\{!result\s*&&\s*\w+\s*&&\s*\([^}]*ProductAuthority[^}]*\n\s*\)\}\n?/gs,
    ""
  );

  // Alternative pattern: <div ...>...<ProductAuthority...></div>
  content = content.replace(
    /\s*<div[^>]*>\s*\n?\s*<ProductAuthority[^>]*\/>\s*\n?\s*.*<\/div>\n?/gs,
    ""
  );

  // Remove standalone ProductAuthority JSX
  content = content.replace(
    /\s*<ProductAuthority[^>]*\/>\s*\n?/g,
    ""
  );
  content = content.replace(
    /\s*<ProductNotice[^>]*\/>\s*\n?/g,
    ""
  );

  // Clean up excess blank lines
  content = content.replace(/\n\n\n+/g, "\n\n");

  return content;
}

function main() {
  console.log("🔄 Removing ProductAuthority from public pages...\n");

  let processed = 0;
  let errors = 0;

  for (const pagePath of PAGES) {
    try {
      const fullPath = path.join(process.cwd(), pagePath);

      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  Skipping ${pagePath} (not found)`);
        continue;
      }

      const content = fs.readFileSync(fullPath, "utf-8");
      const updated = removeProductAuthority(content);

      if (content !== updated) {
        fs.writeFileSync(fullPath, updated, "utf-8");
        console.log(`✅ ${pagePath}`);
        processed++;
      } else {
        console.log(`⊘  ${pagePath} (no changes needed)`);
      }
    } catch (err) {
      console.error(`❌ Error processing ${pagePath}:`, (err as Error).message);
      errors++;
    }
  }

  console.log(`\n📊 Summary: ${processed} files updated, ${errors} errors`);
  process.exit(errors > 0 ? 1 : 0);
}

main();
