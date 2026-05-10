/**
 * scripts/github-workflow-guard.mjs
 *
 * CI workflow consistency guard. Prevents drift in workflow configuration.
 * Run as part of CI to ensure all workflows follow institutional policy.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKFLOWS_DIR = path.resolve(__dirname, "..", ".github", "workflows");

const errors = [];
const warnings = [];

function getWorkflowFiles() {
  if (!fs.existsSync(WORKFLOWS_DIR)) {
    errors.push(`Workflows directory not found: ${WORKFLOWS_DIR}`);
    return [];
  }
  return fs
    .readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
}

function checkWorkflow(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const name = path.basename(filePath);

  // Check 1: All workflows must use --frozen-lockfile
  if (
    content.includes("pnpm install") &&
    !content.includes("--frozen-lockfile") &&
    !content.includes("npm install")
  ) {
    errors.push(`${name}: pnpm install without --frozen-lockfile`);
  }

  // Check 2: No workflow should set NODE_ENV manually
  const nodeEnvMatch = content.match(/NODE_ENV:\s*(.+)/);
  if (nodeEnvMatch) {
    errors.push(`${name}: Sets NODE_ENV manually (${nodeEnvMatch[1].trim()})`);
  }

  // Check 3: No workflow should use build:diagnostic as a required gate
  if (
    content.includes("build:diagnostic") &&
    !content.includes("continue-on-error: true")
  ) {
    warnings.push(
      `${name}: Uses build:diagnostic — ensure this is not a required gate`
    );
  }

  // Check 4: No workflow should mask build failure with "|| echo"
  const maskedBuildPatterns = [
    /build.*\|\|\s*echo/,
    /contentlayer.*\|\|\s*echo/,
    /next build.*\|\|\s*echo/,
  ];
  for (const pattern of maskedBuildPatterns) {
    if (pattern.test(content)) {
      errors.push(
        `${name}: Masks build failure with '|| echo' — remove the mask`
      );
    }
  }

  // Check 5: institutional-audit.yml must include DATABASE_URL where prisma generate is called
  if (name === "institutional-audit.yml") {
    if (content.includes("prisma generate") && !content.includes("DATABASE_URL")) {
      errors.push(
        `${name}: prisma generate without DATABASE_URL environment variable`
      );
    }
  }

  // Check 6: No duplicated contentlayer build before build:netlify:safe
  if (
    content.includes("contentlayer:build") &&
    content.includes("build:netlify:safe") &&
    content.indexOf("contentlayer:build") < content.indexOf("build:netlify:safe")
  ) {
    warnings.push(
      `${name}: Runs contentlayer:build before build:netlify:safe — build:netlify:safe already includes contentlayer:build`
    );
  }

  return { errors, warnings };
}

// Run checks
const files = getWorkflowFiles();
for (const file of files) {
  checkWorkflow(path.join(WORKFLOWS_DIR, file));
}

// Report
console.log("\n=== GITHUB WORKFLOW CONSISTENCY GUARD ===\n");
console.log(`Scanned ${files.length} workflow files.\n`);

if (errors.length > 0) {
  console.error("❌ POLICY VIOLATIONS (must fix):");
  errors.forEach((e) => console.error(`  - ${e}`));
  console.error(`\n${errors.length} violation(s) found.`);
  process.exit(1);
} else {
  console.log("✅ All workflows comply with institutional policy.");
}

if (warnings.length > 0) {
  console.log("\n⚠️  ADVISORY WARNINGS:");
  warnings.forEach((w) => console.log(`  - ${w}`));
}

console.log("\n=== GUARD PASSED ===\n");
