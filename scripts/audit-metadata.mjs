import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * INSTITUTIONAL METADATA AUDITOR (v2.0)
 * Dual-Layer Protection: 
 * 1. Raw YAML Parser (Catches "Fatal" syntax before build)
 * 2. Logical Validator (Enforces SEO and Identity standards)
 */
async function runAuditor() {
  const contentDir = path.resolve('./content');
  const ERRORS = [];
  const WARNINGS = [];

  // 1. RAW FILE SCAN (Prevents Build Crashes)
  const getAllFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.resolve(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) results = results.concat(getAllFiles(file));
      else if (file.endsWith('.mdx') || file.endsWith('.md')) results.push(file);
    });
    return results;
  };

  const files = getAllFiles(contentDir);
  console.log(`\n--- 🛡️  Institutional Audit: Checking ${files.length} Briefs ---`);

  files.forEach(fullPath => {
    const relativePath = path.relative(process.cwd(), fullPath);
    const rawContent = fs.readFileSync(fullPath, 'utf8');
    const parts = rawContent.split('---');

    if (parts.length < 3) {
      ERRORS.push({ file: relativePath, issue: "Malformed Frontmatter: Missing delimiters (---)" });
      return;
    }

    let doc;
    try {
      doc = yaml.load(parts[1]);
    } catch (e) {
      // THIS CATCHES THE NESTED QUOTES/SCALAR ERRORS
      ERRORS.push({ file: relativePath, issue: `YAML SYNTAX: ${e.message}` });
      return;
    }

    // 2. LOGICAL CHECKS (Institutional Standards)
    
    // Identity
    if (!doc.title) ERRORS.push({ file: relativePath, issue: "Missing 'title'" });
    if (!doc.date) ERRORS.push({ file: relativePath, issue: "Missing 'date'" });

    // Slug Pattern (Enforce absolute path & Cleanliness)
    if (doc.slug) {
      if (!doc.slug.startsWith('/')) {
        ERRORS.push({ file: relativePath, issue: `Slug must be absolute (start with /). Found: ${doc.slug}` });
      }
      if (doc.slug.includes('"')) {
        ERRORS.push({ file: relativePath, issue: "Slug contains illegal quote characters" });
      }
    }

    // SEO Integrity
    const summary = doc.description || doc.excerpt;
    if (!summary) {
      ERRORS.push({ file: relativePath, issue: "Missing SEO description or excerpt" });
    } else if (summary.length < 60) {
      WARNINGS.push({ file: relativePath, issue: "Summary is too short for optimal SEO" });
    }
  });

  // 3. REPORTING
  if (WARNINGS.length > 0) {
    console.warn(`\n⚠️  Metadata Warnings (${WARNINGS.length}):`);
    console.table(WARNINGS);
  }

  if (ERRORS.length > 0) {
    console.error(`\n❌ Metadata Errors (${ERRORS.length}). Build Aborted.`);
    console.table(ERRORS);
    process.exit(1);
  }

  console.log('✅ Audit Passed: All briefs are syntactically and institutionally sound.');
  process.exit(0);
}

runAuditor();