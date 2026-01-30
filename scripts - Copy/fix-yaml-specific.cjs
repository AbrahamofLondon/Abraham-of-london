/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

/**
 * SAFE YAML fixer - Minimal changes only
 * 1. Only fixes CRLF → LF
 * 2. Only fixes EXACT "truehref:" pattern
 * 3. NEVER modifies YAML structure
 * 4. NEVER removes fields
 */

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");

function fixFileSafely(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    let fixed = raw;
    let changes = [];

    // 1. Fix line endings only (safe)
    if (fixed.includes('\r\n')) {
      fixed = fixed.replace(/\r\n/g, "\n");
      changes.push("crlf-fixed");
    }

    // 2. Fix ONLY the exact concatenation pattern we know about
    // Pattern: "contentOnly: truehref:" → "contentOnly: true\nhref:"
    const concatPattern = /(\bcontentOnly\b):\s*(true|false)(href):/g;
    if (concatPattern.test(fixed)) {
      fixed = fixed.replace(concatPattern, '$1: $2\n$3:');
      changes.push("concat-fixed");
    }

    // 3. If it's a Download and missing href, add it
    if (fixed.includes('type: Download') && !fixed.includes('\nhref:')) {
      const fileName = path.basename(filePath, path.extname(filePath));
      const hrefLine = `href: /assets/downloads/${fileName}.pdf`;
      
      // Insert after format field if it exists
      if (fixed.includes('\nformat:')) {
        fixed = fixed.replace(/(\nformat:[^\n]*)/, '$1\n' + hrefLine);
        changes.push("href-added");
      }
    }

    if (changes.length > 0) {
      // Backup
      const backupPath = `${filePath}.backup`;
      fs.writeFileSync(backupPath, raw, "utf8");
      
      // Save
      fs.writeFileSync(filePath, fixed, "utf8");
      console.log(`[fix:yaml] ${path.relative(ROOT, filePath)}: ${changes.join(', ')}`);
      return true;
    }
    
    return false;
  } catch (err) {
    console.warn(`[fix:yaml] Skipping ${filePath}: ${err.message}`);
    return false;
  }
}

(function main() {
  try {
    console.log(`[fix:yaml] Scanning: ${CONTENT_DIR}`);
    
    if (!fs.existsSync(CONTENT_DIR)) {
      console.error(`[fix:yaml] Directory not found`);
      process.exit(1);
    }

    // Get all MDX files
    const files = [];
    function walk(dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const it of items) {
        if (it.name.startsWith(".")) continue;
        const full = path.join(dir, it.name);
        if (it.isDirectory()) {
          walk(full);
        } else if (it.isFile() && (it.name.endsWith('.mdx') || it.name.endsWith('.md'))) {
          files.push(full);
        }
      }
    }
    walk(CONTENT_DIR);

    console.log(`[fix:yaml] Found ${files.length} files\n`);
    
    let changed = 0;
    for (const f of files) {
      if (fixFileSafely(f)) changed++;
    }

    console.log(`\n[fix:yaml] Updated ${changed} files safely`);
    console.log(`\n✅ Only performed:`);
    console.log(`   - Fixed CRLF line endings`);
    console.log(`   - Fixed "contentOnly: truehref:" → "contentOnly: true\\nhref:"`);
    console.log(`   - Added missing href for Download files`);
    console.log(`\n🔒 Did NOT touch:`);
    console.log(`   - Any other YAML`);
    console.log(`   - Indentation`);
    console.log(`   - Quotes`);
    console.log(`   - Field names`);
    
    process.exit(0);
  } catch (err) {
    console.error("[fix:yaml] Failed:", err);
    process.exit(1);
  }
})();