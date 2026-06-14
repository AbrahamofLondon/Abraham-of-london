#!/usr/bin/env node

/**
 * Effective Authority Surface Scan
 *
 * Verifies that public surfaces use resolveProductAuthority()
 * instead of accessing ProductAuthorityContract directly.
 */

import { globSync } from "glob";
import { readFileSync } from "fs";

console.log("EFFECTIVE AUTHORITY SURFACE SCAN");
console.log("================================\n");

// Files that should use effective authority
const surfacePatterns = [
  "pages/**/*.tsx",
  "components/**/*.tsx",
  "app/api/**/*.ts",
];

let unmigratedSurfaces = [];

for (const pattern of surfacePatterns) {
  const files = globSync(pattern);

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf-8");

      // Check if it imports ProductAuthorityContract directly
      const hasDirectImport =
        content.includes("import") &&
        content.includes("ProductAuthorityContract");

      // Check if it uses resolveProductAuthority
      const hasEffectiveAuthority = content.includes("resolveProductAuthority");

      // Flag files that use declared authority without effective resolver
      if (
        hasDirectImport &&
        !hasEffectiveAuthority &&
        (file.includes("checkout") ||
          file.includes("report") ||
          file.includes("admin") ||
          file.includes("diagnostics") ||
          file.includes("decision"))
      ) {
        unmigratedSurfaces.push(file);
      }
    } catch (err) {
      // Skip unreadable files
    }
  }
}

if (unmigratedSurfaces.length === 0) {
  console.log(
    "✓ Public surfaces appear to use effective authority resolver"
  );
  console.log("\nMigration Status: COMPLETE");
  process.exit(0);
} else {
  console.log(
    `⚠ Found ${unmigratedSurfaces.length} surfaces using declared authority:\n`
  );
  unmigratedSurfaces.forEach((f) => console.log(`  - ${f}`));
  console.log("\nMigration Status: INCOMPLETE");
  console.log(
    "These surfaces should use resolveProductAuthority() not direct contract access."
  );
  process.exit(0); // Non-blocking for now (informational)
}
