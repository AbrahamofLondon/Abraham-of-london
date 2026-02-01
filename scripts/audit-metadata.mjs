import fs from 'fs';
import path from 'path';

/**
 * METADATA AUDITOR
 * Enforces institutional standards across the 2026 intelligence portfolio.
 */
async function runAuditor() {
  // Use absolute path for the existence check to be safe across environments
  const SDK_PATH = path.resolve('./.contentlayer/generated/index.mjs');

  if (!fs.existsSync(SDK_PATH)) {
    console.error('\n❌ AUDIT FAILURE: Contentlayer SDK not found.');
    console.info('👉 Requirement: The content must be built before auditing.\n');
    process.exit(1);
  }

  try {
    // Dynamic import using the relative path from /scripts to /.contentlayer
    const { allDocuments } = await import('../.contentlayer/generated/index.mjs');

    const ERRORS = [];
    const WARNINGS = [];

    console.log(`\n--- 🔍 Auditing Metadata for ${allDocuments.length} Briefs ---`);

    allDocuments.forEach(doc => {
      const filePath = doc._raw.sourceFilePath;

      // 1. Critical Identity Checks
      if (!doc.title) ERRORS.push({ file: filePath, issue: "Missing 'title'" });
      if (!doc.date) ERRORS.push({ file: filePath, issue: "Missing 'date'" });

      // 2. SEO integrity
      const summary = doc.description || doc.excerpt;
      if (!summary) {
        ERRORS.push({ file: filePath, issue: "Missing SEO description or excerpt" });
      } else if (summary.length < 60) {
        WARNINGS.push({ file: filePath, issue: "Summary is too short for optimal SEO" });
      }

      // 3. Category Validation
      if (!doc._raw.sourceFileDir) {
        WARNINGS.push({ file: filePath, issue: "Brief is not categorized in a sub-folder" });
      }
    });

    if (WARNINGS.length > 0) {
      console.warn(`\n⚠️ Metadata Warnings (${WARNINGS.length}):`);
      console.table(WARNINGS);
    }

    if (ERRORS.length > 0) {
      console.error(`\n❌ Metadata Errors (${ERRORS.length}). Build Aborted.`);
      console.table(ERRORS);
      process.exit(1);
    }

    console.log('✅ Metadata Audit Passed: All briefs meet institutional standards.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Auditor Runtime Error:', err.message);
    process.exit(1);
  }
}

runAuditor();