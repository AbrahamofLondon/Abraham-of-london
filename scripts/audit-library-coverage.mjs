#!/usr/bin/env node
/**
 * scripts/audit-library-coverage.mjs
 *
 * Audits the library index for content coverage.
 * Fails or warns if major content types disappear from the library index.
 *
 * Usage:
 *   node scripts/audit-library-coverage.mjs
 *   pnpm library:audit
 *
 * Note: This script uses tsx to resolve TypeScript imports.
 * Run via: npx tsx scripts/audit-library-coverage.mjs
 * Or via the pnpm script which handles this.
 */

const EXPECTED_SECTIONS = [
  "essays_analysis",
  "books_manuscripts",
  "canon_lexicon",
  "frameworks_playbooks",
  "intelligence_briefs",
  "downloads_resources",
  "vault",
  "events",
];

const EXPECTED_TYPES = [
  "essay",
  "short",
  "book",
  "canon",
  "lexicon",
  "framework",
  "playbook",
  "strategy",
  "toolkit",
  "intelligence",
  "brief",
  "evidence",
  "download",
  "pdf",
  "print",
  "resource",
  "vault",
  "event",
  "premium",
];

async function main() {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  LIBRARY COVERAGE AUDIT");
  console.log("═══════════════════════════════════════════════════\n");

  let exitCode = 0;

  try {
    // Use tsx to resolve TypeScript with path aliases
    // This script is intended to be run via: npx tsx scripts/audit-library-coverage.mjs
    const { buildLibraryIndex } = await import("../lib/library/library-index.ts");
    const index = buildLibraryIndex();

    // ── Section coverage ──
    console.log("📂 Sections:");
    const sectionIds = index.sections.map((s) => s.id);

    for (const expected of EXPECTED_SECTIONS) {
      const found = sectionIds.includes(expected);
      const section = index.sections.find((s) => s.id === expected);
      const count = section ? section.count : 0;
      const status = found ? "✅" : "❌";
      console.log(`  ${status} ${expected.padEnd(30)} ${count} items`);
      if (!found) {
        console.error(`    ERROR: Expected section "${expected}" is missing from the library index.`);
        exitCode = 1;
      }
    }

    // ── Type coverage ──
    console.log("\n📦 Content types:");
    const typeCounts = {};
    for (const item of index.items) {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    }

    for (const expected of EXPECTED_TYPES) {
      const count = typeCounts[expected] || 0;
      const status = count > 0 ? "✅" : "⚠️ ";
      console.log(`  ${status} ${expected.padEnd(20)} ${count} items`);
      if (count === 0) {
        console.warn(`    WARNING: Content type "${expected}" has 0 items in the library index.`);
      }
    }

    // ── Stats ──
    console.log("\n📊 Summary:");
    console.log(`  Total items:      ${index.stats.total}`);
    console.log(`  Public:           ${index.stats.public}`);
    console.log(`  Member:           ${index.stats.member}`);
    console.log(`  Restricted:       ${index.stats.restricted}`);
    console.log(`  Paid:             ${index.stats.paid}`);
    console.log(`  Downloads/Res.:   ${index.stats.downloads}`);
    console.log(`  Canon/Lexicon:    ${index.stats.canonLexicon}`);

    // ── Data integrity ──
    console.log("\n🔍 Data integrity:");

    const emptyTitles = index.items.filter((i) => !i.title || i.title.trim() === "");
    if (emptyTitles.length > 0) {
      console.warn(`  ⚠️  ${emptyTitles.length} item(s) with empty title`);
      for (const item of emptyTitles.slice(0, 5)) {
        console.warn(`     - ${item.id} (${item.type})`);
      }
    } else {
      console.log("  ✅ No empty titles");
    }

    const missingHref = index.items.filter((i) => !i.href || i.href === "/" || i.href.trim() === "");
    if (missingHref.length > 0) {
      console.warn(`  ⚠️  ${missingHref.length} item(s) with missing href`);
      exitCode = 1;
    } else {
      console.log("  ✅ All items have hrefs");
    }

    const unknownAccess = index.items.filter((i) => i.access === "unknown");
    if (unknownAccess.length > 0) {
      console.warn(`  ⚠️  ${unknownAccess.length} item(s) with unknown access`);
    } else {
      console.log("  ✅ All items have valid access");
    }

    const bodyExposed = index.items.filter(
      (i) => (i).body !== undefined || (i).content !== undefined
    );
    if (bodyExposed.length > 0) {
      console.error(`  ❌ ${bodyExposed.length} item(s) expose body/content — possible leak`);
      exitCode = 1;
    } else {
      console.log("  ✅ No body/content exposed");
    }

    const coverageChecks = [
      {
        label: "Intelligence docs indexed",
        pass: index.items.filter((i) => i.type === "intelligence").length >= 12,
      },
      {
        label: "Toolkit metadata indexed",
        pass: index.items.filter((i) => i.sourceType === "toolkit-metadata").length === 19,
      },
      {
        label: "Evidence metadata indexed",
        pass: index.items.filter((i) => i.sourceType === "evidence-metadata").length === 8,
      },
      {
        label: "Vault index protected",
        pass:
          index.items.filter(
            (i) =>
              i.sourceType === "vault-index-metadata" &&
              i.access === "restricted" &&
              i.href === "/vault",
          ).length === 1,
      },
      {
        label: "EPUB manifest indexed",
        pass: index.items.filter((i) => i.sourceType === "epub-manifest").length === 4,
      },
      {
        label: "LinkedIn outbound excluded",
        pass: !index.items.some((i) => i.sourcePath?.startsWith("content/outbound/")),
      },
      {
        label: "Linked download companions excluded",
        pass: !index.items.some((i) => i.sourcePath?.startsWith("content/downloads/linked-")),
      },
      {
        label: "Generated operational reports excluded",
        pass: !index.items.some((i) => i.sourceType === "report-file"),
      },
    ];

    console.log("\n🧭 Gap closure checks:");
    for (const check of coverageChecks) {
      console.log(`  ${check.pass ? "✅" : "❌"} ${check.label}`);
      if (!check.pass) exitCode = 1;
    }

    // ── Final verdict ──
    console.log("\n═══════════════════════════════════════════════════");
    if (exitCode === 0) {
      console.log("  ✅ LIBRARY COVERAGE: PASS");
    } else {
      console.log("  ❌ LIBRARY COVERAGE: FAIL — review warnings above");
    }
    console.log("═══════════════════════════════════════════════════\n");
  } catch (error) {
    console.error("\n❌ LIBRARY COVERAGE AUDIT FAILED:");
    console.error(error);
    exitCode = 1;
  }

  process.exit(exitCode);
}

main();
