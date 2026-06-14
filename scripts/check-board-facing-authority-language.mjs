#!/usr/bin/env node

/**
 * Board-Facing Authority Language Guard — Expanded Coverage
 *
 * Scans all board-facing runtime and delivery surfaces for unsupported
 * authority language that overstates evidence basis.
 *
 * Forbidden unless evidence-bounded:
 *   board-ready, BOARD_READY, board approved, investment-ready,
 *   governance assured, executive certainty, decision approved,
 *   guaranteed, verified cost, proven board case, board decision dossier
 *
 * Required correction pattern:
 *   "This is board-facing draft material based on user-supplied inputs.
 *    It does not constitute verified board evidence and requires evidence
 *    review before board reliance."
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, relative } from "path";
import { globSync } from "glob";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

// ── Unsafe Board-Facing Phrases ───────────────────────────────────────────
const UNSUPPORTED_PHRASES = [
  "board-ready",
  "BOARD_READY",
  "board approved",
  "investment-ready",
  "governance assured",
  "executive certainty",
  "decision approved",
  "guaranteed",
  "verified cost",
  "proven board case",
  "board decision dossier",
];

// ── Allowed Bounded Contexts ──────────────────────────────────────────────
const ALLOWED_CONTEXT = [
  "user provided",
  "user-supplied",
  "evidence-limited",
  "unverified",
  "requires verification",
  "board-facing draft",
  "preliminary",
  "subject to",
  "not yet",
  "needs",
  "downgraded to",
  "blocked",
  "pending",
  "cannot",
  "failing",
  "while blocked",
  "board-facing format only",
  "board-review material",
  "evidence-limited board brief",
  "user-supplied board input",
  "requires evidence review",
  "does not constitute",
  "not independently verified",
  "simulation_only_non_granting",
];

// ── Board-Facing Surface Patterns ─────────────────────────────────────────
// Discovered by searching for boardroom, board-ready, BOARD_READY,
// board brief, board decision dossier across the codebase.
const BOARD_FACING_PATTERNS = [
  // Core board instrument engines
  "lib/instruments/board-brief-template/engine.ts",
  "lib/constitution/boardroom-mode.ts",
  "lib/boardroom/*.ts",
  "lib/boardroom/*.tsx",
  // Board-facing pages
  "pages/boardroom-brief.tsx",
  "pages/boardroom-brief/**",
  // Board-facing components
  "components/admin/reporting/boardroom-mode.tsx",
  "components/diagnostics/results/BoardSnapshot.tsx",
  "components/reporting/boardroom/BoardroomMode.tsx",
  // Board-facing API routes
  "app/api/executive-reporting/export/boardroom-pdf/route.ts",
  "app/api/admin/boardroom-delivery/**/*.ts",
  // Board-facing PDF generation
  "lib/pdf/artifacts/global-market-intelligence-q1-2026-boardroom.tsx",
  "lib/pdf/oversight-brief-pdf.tsx",
  // Board-facing research engines
  "lib/research/engines/boardroom-dossier-adapter.ts",
  "lib/research/engines/boardroom-mode-adapter.ts",
  "lib/research/engines/executive-report-boardroom-bridge-adapter.ts",
  // Board-facing intelligence
  "lib/intelligence/gmi-board-pack-artifact-service.server.ts",
  "lib/intelligence/gmi-instrument.ts",
  // Board-facing product surfaces
  "lib/product/boardroom-archive-contract.ts",
  "lib/product/boardroom-archive-summary.ts",
  "lib/product/boardroom-archive.ts",
  "lib/product/boardroom-dossier-archive.ts",
  "lib/product/boardroom-history-summary.ts",
  "lib/product/product-surface-registry.ts",
  "lib/product/resolve-product-authority.ts",
  // Board-facing evidence governance
  "lib/board/evidence-governance.ts",
  // Board-facing commercial surfaces
  "lib/commercial/catalog.ts",
  "lib/commercial/premium-decision-assets.ts",
  // Board-facing admin surfaces
  "lib/admin/product-surface-registry.ts",
  "lib/admin/reporting/report-pdf.tsx",
  // Board-facing delivery
  "lib/boardroom/boardroom-delivery-pipeline.ts",
  "lib/boardroom/boardroom-dossier-service.ts",
  "lib/boardroom/dossier-builder.ts",
  "lib/boardroom/dossier-pdf.tsx",
  "lib/boardroom/dossier-types.ts",
  // Board-facing instruments
  "lib/instruments/governed-instrument-contract.ts",
  // Board-facing constitution
  "lib/constitution/boardroom-spine-builder.ts",
];

// ── Check File ────────────────────────────────────────────────────────────
function checkFile(filePath) {
  const fullPath = join(ROOT, filePath);

  if (!existsSync(fullPath)) {
    return { violations: [], warnings: [], notFound: true };
  }

  try {
    const content = readFileSync(fullPath, "utf-8");
    const lines = content.split("\n");
    const violations = [];
    const warnings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      for (const phrase of UNSUPPORTED_PHRASES) {
        if (line.toLowerCase().includes(phrase.toLowerCase())) {
          // Special case: lib/board/evidence-governance.ts is the guard definition itself.
          // Its detection lists define what patterns to look for — these are guard_pattern, not runtime claims.
          if (filePath.includes("evidence-governance.ts")) {
            const isDetectionList = line.includes("\"") && (
              line.includes("board-ready") ||
              line.includes("board approved") ||
              line.includes("investment-ready") ||
              line.includes("governance assured") ||
              line.includes("executive certainty") ||
              line.includes("decision approved") ||
              line.includes("guaranteed") ||
              line.includes("verified cost") ||
              line.includes("proven board case")
            );
            if (isDetectionList) {
              warnings.push({
                line: lineNum,
                phrase,
                context: line.trim().substring(0, 120),
                severity: "LOW",
                classification: "guard_pattern",
              });
              continue;
            }
          }

          // Check if this is in an allowed context
          const contextWindow = lines
            .slice(Math.max(0, i - 3), Math.min(lines.length, i + 4))
            .join(" ")
            .toLowerCase();

          const isAllowed = ALLOWED_CONTEXT.some((allowed) =>
            contextWindow.includes(allowed)
          );

          // Check if line has evidence boundary nearby
          const hasEvidenceBoundary =
            contextWindow.includes("evidence status") ||
            contextWindow.includes("user-supplied") ||
            contextWindow.includes("derived inference") ||
            contextWindow.includes("missing evidence") ||
            contextWindow.includes("next evidence action") ||
            contextWindow.includes("reliance boundary") ||
            contextWindow.includes("does not constitute") ||
            contextWindow.includes("not independently verified") ||
            contextWindow.includes("Detection list") ||
            contextWindow.includes("guard definition");

          if (!isAllowed && !hasEvidenceBoundary) {
            violations.push({
              line: lineNum,
              phrase,
              context: line.trim().substring(0, 120),
              severity: "HIGH",
              classification: "runtime_unsafe_claim",
            });
          } else {
            warnings.push({
              line: lineNum,
              phrase,
              context: line.trim().substring(0, 120),
              severity: "LOW",
              classification: "bounded_claim",
            });
          }
        }
      }
    }

    return { violations, warnings, notFound: false };
  } catch (err) {
    return { violations: [], warnings: [], notFound: false, error: err.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
function main() {
  console.log("BOARD-FACING AUTHORITY LANGUAGE GUARD (EXPANDED)");
  console.log("================================================\n");

  let totalViolations = 0;
  let totalWarnings = 0;
  const allViolations = [];
  const allWarnings = [];
  const scannedFiles = [];
  const notFoundFiles = [];

  // Resolve glob patterns
  const filesToCheck = [];
  for (const pattern of BOARD_FACING_PATTERNS) {
    if (pattern.includes("*")) {
      const matches = globSync(pattern, { cwd: ROOT });
      filesToCheck.push(...matches);
    } else {
      filesToCheck.push(pattern);
    }
  }

  // Deduplicate
  const uniqueFiles = [...new Set(filesToCheck)];

  for (const file of uniqueFiles) {
    const { violations, warnings, notFound, error } = checkFile(file);

    if (notFound) {
      notFoundFiles.push(file);
      continue;
    }

    scannedFiles.push(file);

    if (violations.length > 0) {
      console.log(`❌ ${file}`);
      for (const v of violations) {
        console.log(`   Line ${v.line}: "${v.phrase}" without evidence context`);
        console.log(`     ${v.context.substring(0, 100)}`);
        allViolations.push({ file, ...v });
      }
      totalViolations += violations.length;
    }

    if (warnings.length > 0) {
      console.log(`⚠️  ${file}`);
      for (const w of warnings) {
        console.log(`   Line ${w.line}: "${w.phrase}" (bounded)`);
        allWarnings.push({ file, ...w });
      }
      totalWarnings += warnings.length;
    }

    if (violations.length === 0 && warnings.length === 0) {
      console.log(`✓ ${file}`);
    }
  }

  console.log("\n=====================================");
  console.log(`Files scanned: ${scannedFiles.length}`);
  console.log(`Files not found: ${notFoundFiles.length}`);
  console.log(`Runtime unsafe claims: ${totalViolations}`);
  console.log(`Bounded claims: ${totalWarnings}`);
  console.log("=====================================\n");

  // Write findings report
  mkdirSync(REPORTS_DIR, { recursive: true });
  const findings = {
    generatedAt: new Date().toISOString(),
    filesScanned: scannedFiles.length,
    filesNotFound: notFoundFiles.length,
    runtimeUnsafeClaims: totalViolations,
    boundedClaims: totalWarnings,
    violations: allViolations,
    warnings: allWarnings,
    notFoundFiles,
    gateResult: totalViolations > 0 ? "FAILED" : "PASSED",
  };

  writeFileSync(
    join(REPORTS_DIR, "board-facing-authority-language-findings.json"),
    JSON.stringify(findings, null, 2) + "\n"
  );

  if (totalViolations > 0) {
    console.log("ACTION REQUIRED:");
    console.log(`- ${totalViolations} runtime unsafe board-facing claims detected`);
    console.log("- Add evidence context or downgrade language");
    console.log("- Use evidence-governance.ts to classify claims");
    console.log("- Each unsafe claim needs: evidence status, user-supplied label, reliance boundary\n");
    process.exit(1);
  } else {
    console.log("✓ Gate: PASSED\n");
    process.exit(0);
  }
}

main();