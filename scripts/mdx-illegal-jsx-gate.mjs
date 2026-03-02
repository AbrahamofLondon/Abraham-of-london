/* scripts/mdx-illegal-jsx-gate.mjs — HEAD BUTLER (SAFE, REVERSIBLE, CI-SANE) */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import glob from "fast-glob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = "content";

const FIX = process.argv.includes("--fix");
const VERBOSE = process.argv.includes("--verbose");
const DRY_RUN = process.argv.includes("--dry-run");
const CLEANUP = process.argv.includes("--cleanup");
const STRICT = process.argv.includes("--strict"); // fail on any issue
const CI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

const BOM = "\uFEFF";
const BACKUP_PATTERN = "**/*.backup-*";
const BACKUP_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const RESERVED_WORDS = new Set([
  "Object","Array","Function","String","Number","Boolean","Symbol",
  "Promise","Error","Date","Math","JSON","console","window","document",
  "undefined","null","NaN","Infinity","global","process","module",
  "exports","require","arguments","eval","this","super","new","typeof",
  "instanceof","delete","in","with","void","await","async","yield",
  "let","const","var","class","extends","import","export","default",
  "return","throw","try","catch","finally","if","else","switch",
  "case","break","continue","for","while","do","true","false",
  "component","Fragment","React",
]);

function rel(p) {
  return path.relative(process.cwd(), p);
}

function isCritical(issue) {
  return (
    issue.includes("Invalid control characters") ||
    issue.includes("CRLF Line Endings") ||
    issue.includes("Contains UTF-8 BOM") ||
    issue.includes("Zero-width/invisible characters detected")
  );
}

async function cleanupBackups() {
  console.log(`\n🧹 [CLEANUP]: Scanning for backup files...`);

  const backupFiles = await glob([`${CONTENT_DIR}/${BACKUP_PATTERN}`], { dot: false, absolute: true });

  if (backupFiles.length === 0) {
    console.log(`   No backup files found.`);
    return { deleted: 0, kept: 0 };
  }

  console.log(`   Found ${backupFiles.length} backup files.`);
  const now = Date.now();

  let deleted = 0;
  let kept = 0;
  const oldBackups = [];

  for (const file of backupFiles) {
    try {
      const stats = fs.statSync(file);
      const age = now - stats.mtimeMs;

      if (age > BACKUP_RETENTION_MS) {
        if (!DRY_RUN) fs.unlinkSync(file);
        deleted++;
        oldBackups.push(path.basename(file));
      } else {
        kept++;
      }
    } catch (err) {
      console.error(`   ⚠️  Error processing backup ${file}: ${err.message}`);
    }
  }

  if (DRY_RUN) {
    console.log(`   🔍 [DRY RUN] Would delete ${deleted} old backups.`);
    oldBackups.slice(0, 5).forEach((f) => console.log(`     - ${f}`));
    if (oldBackups.length > 5) console.log(`     ... and ${oldBackups.length - 5} more`);
  } else if (deleted > 0) {
    console.log(`   ✅ Deleted ${deleted} old backup files.`);
  }

  return { deleted, kept };
}

function isInsideCodeBlock(lines, index) {
  let codeBlockCount = 0;
  for (let i = 0; i <= index; i++) {
    if (lines[i].trim().startsWith("```")) codeBlockCount++;
  }
  return codeBlockCount % 2 === 1;
}

function auditContent(content, filePath) {
  const issues = [];
  const lines = content.split("\n");

  // 0) Frontmatter presence (soft, but helpful)
  const startsWithFm = content.trimStart().startsWith("---");
  if (!startsWithFm) issues.push("Missing frontmatter fence (file should start with '---')");

  // 1) BOM
  if (content.startsWith(BOM)) {
    issues.push("Contains UTF-8 BOM");
  }

  // 2) CRLF
  const crlfMatches = content.match(/\r\n/g);
  if (crlfMatches?.length) {
    issues.push(`CRLF Line Endings (${crlfMatches.length} occurrences) - Contentlayer requires LF`);
  }

  // 3) Trailing whitespace (outside code blocks)
  const trailing = [];
  lines.forEach((line, i) => {
    if (/[ \t]+$/.test(line) && !isInsideCodeBlock(lines, i)) trailing.push(i + 1);
  });
  if (trailing.length) {
    issues.push(`Trailing whitespace on lines: ${trailing.join(", ")}`);
  }

  // 4) Invalid control chars
  const invalid = content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g);
  if (invalid?.length) {
    issues.push(`Invalid control characters detected (${invalid.length} found) - WILL CAUSE BUILD FAILURE`);
  }

  // 5) Zero-width / invisible
  const invisible = content.match(/[\u200B-\u200D\uFEFF]/g);
  if (invisible?.length) {
    issues.push(`Zero-width/invisible characters detected (${invisible.length} found)`);
  }

  // Build a version of text with code blocks blanked out for structural checks
  const withoutCode = [];
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith("```")) {
      inCode = !inCode;
      withoutCode.push("");
      continue;
    }
    withoutCode.push(inCode ? "" : lines[i]);
  }
  const analysisTarget = withoutCode.join("\n");

  // 6) Brace balance (outside code blocks)
  const openBraces = (analysisTarget.match(/\{/g) || []).length;
  const closeBraces = (analysisTarget.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    issues.push(`Unbalanced braces ({: ${openBraces}, }: ${closeBraces})`);
  }

  // 7) Reserved component tags (outside code blocks)
  const tagRe = /<\/?\s*([A-Z][A-Za-z0-9_]*)\b/g;
  let m;
  while ((m = tagRe.exec(analysisTarget)) !== null) {
    if (RESERVED_WORDS.has(m[1])) issues.push(`Illegal Component: <${m[1]}> is a JS reserved word`);
  }

  // 8) Table literal < risk (outside code blocks)
  for (let i = 0; i < lines.length; i++) {
    if (isInsideCodeBlock(lines, i)) continue;
    const line = lines[i];
    if (line.includes("|") && line.includes("<") && !line.includes("&lt;")) {
      const hasHtmlTag = /<[a-z][^>]*>/i.test(line);
      if (!hasHtmlTag) issues.push(`Line ${i + 1}: Possible unescaped '<' in table. Use &lt; for literal less-than.`);
    }
  }

  return issues;
}

function applySafeFixes(content) {
  const original = content;
  let modified = content;
  const changes = [];

  if (modified.startsWith(BOM)) {
    modified = modified.slice(1);
    changes.push("Removed UTF-8 BOM");
  }

  if (modified.includes("\r\n")) {
    modified = modified.replace(/\r\n/g, "\n");
    changes.push("Normalized line endings: CRLF → LF");
  }

  // Remove trailing whitespace (all lines; safe)
  {
    const lines = modified.split("\n");
    let touched = false;
    for (let i = 0; i < lines.length; i++) {
      const before = lines[i];
      lines[i] = lines[i].replace(/[ \t]+$/, "");
      if (before !== lines[i]) touched = true;
    }
    if (touched) {
      modified = lines.join("\n");
      changes.push("Removed trailing whitespace");
    }
  }

  if (/[\u200B-\u200D\uFEFF]/.test(modified)) {
    modified = modified.replace(/[\u200B-\u200D\uFEFF]/g, "");
    changes.push("Removed zero-width/invisible characters");
  }

  return { modified, changes, wasModified: original !== modified };
}

function verifyFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const stillHasCrlf = content.includes("\r\n");
    const stillHasBom = content.startsWith(BOM);
    const stillHasControl = /[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/.test(content);
    const stillHasInvisible = /[\u200B-\u200D\uFEFF]/.test(content);

    const issues = [];
    if (stillHasCrlf) issues.push("CRLF still present");
    if (stillHasBom) issues.push("BOM still present");
    if (stillHasControl) issues.push("Control chars still present");
    if (stillHasInvisible) issues.push("Invisible chars still present");

    return { valid: issues.length === 0, issues };
  } catch (err) {
    return { valid: false, issues: [`Failed to read: ${err.message}`] };
  }
}

async function run() {
  if (CLEANUP) {
    await cleanupBackups();
    return;
  }

  const files = await glob([`${CONTENT_DIR}/**/*.{md,mdx}`], {
    dot: false,
    ignore: ["**/node_modules/**", "**/.next/**", "**/.contentlayer/**"],
    absolute: true,
  });

  console.log(`🏛️ [MDX_GATE]: Auditing ${files.length} assets...`);
  if (CI) console.log(`🏗️  [ENV]: CI detected`);
  if (STRICT) console.log(`🚨 [MODE]: STRICT enabled`);

  const report = [];
  const fixed = [];
  let criticalUnresolved = 0;
  let anyUnresolved = 0;

  for (const file of files) {
    const originalBuffer = fs.readFileSync(file);
    const original = originalBuffer.toString("utf8");

    // Audit
    const issuesBefore = auditContent(original, file);

    if (issuesBefore.length === 0) continue;

    // If fixing, apply safe fixes and re-audit
    let issuesAfter = issuesBefore;
    let changes = [];

    if (FIX) {
      const patch = applySafeFixes(original);
      changes = patch.changes;

      if (patch.wasModified) {
        if (DRY_RUN) {
          fixed.push({ file, changes, dry: true });
        } else {
          const backupPath = `${file}.backup-${Date.now()}`;
          fs.writeFileSync(backupPath, originalBuffer);
          fs.writeFileSync(file, patch.modified, "utf8");

          const verification = verifyFile(file);
          if (!verification.valid) {
            // Restore
            console.error(`⚠️  Verification failed: ${rel(file)} -> restoring backup`);
            fs.writeFileSync(file, originalBuffer);
            fs.unlinkSync(backupPath);
            issuesAfter = issuesBefore.concat([`Failed to fix: ${verification.issues.join(", ")}`]);
          } else {
            fixed.push({ file, changes, backup: backupPath });
            // Re-audit after successful write
            const now = fs.readFileSync(file, "utf8");
            issuesAfter = auditContent(now, file);
          }
        }
      }
    }

    // Determine unresolved
    const unresolved = issuesAfter.filter((i) => {
      // If fix mode, we only treat issues as unresolved if they remain after re-audit
      return true;
    });

    // In fix mode, some issues are advisory; determine if any critical remain
    const criticalRemain = unresolved.some(isCritical);
    const anyRemain = unresolved.length > 0;

    if (anyRemain) {
      report.push({ file, issues: unresolved });
      anyUnresolved++;
      if (criticalRemain) criticalUnresolved++;
    }
  }

  // Print fix report
  if (fixed.length > 0) {
    if (DRY_RUN) {
      console.log(`\n🔍 [DRY RUN]: Would fix ${fixed.length} files.`);
      fixed.slice(0, 8).forEach((f) => {
        console.log(`  📄 ${rel(f.file)}`);
        f.changes.forEach((c) => console.log(`    └─ ${c}`));
      });
      if (fixed.length > 8) console.log(`  ...and ${fixed.length - 8} more`);
    } else {
      console.log(`\n🩹 [HEALED]: Fixed ${fixed.length} files.`);
      if (VERBOSE) {
        fixed.slice(0, 8).forEach((f) => {
          console.log(`  📄 ${rel(f.file)}`);
          f.changes.forEach((c) => console.log(`    └─ ${c}`));
          if (f.backup) console.log(`    └─ Backup: ${path.basename(f.backup)}`);
        });
      }
      console.log(`   🧹 Run '--cleanup' to remove backups older than 7 days.`);
    }
  }

  // Print unresolved issues summary
  if (report.length > 0) {
    console.log(`\n📋 [AUDIT]: ${report.length} files still report issues.`);
    report.slice(0, 10).forEach((r) => {
      console.log(`\nLocation: ${rel(r.file)}`);
      r.issues.slice(0, 6).forEach((i) => console.log(`  └─ ${i}`));
      if (r.issues.length > 6) console.log(`  └─ ...and ${r.issues.length - 6} more`);
    });
    if (report.length > 10) console.log(`\n...and ${report.length - 10} more files with issues.`);
  } else {
    console.log(`✅ [SUCCESS]: All assets verified. No unresolved issues.`);
  }

  // Exit logic
  // - In STRICT mode: fail if any unresolved issues remain
  // - Otherwise: fail only if critical unresolved issues remain
  const shouldFail = STRICT ? report.length > 0 : criticalUnresolved > 0;

  if (shouldFail) {
    console.error(
      STRICT
        ? `\n❌ [FAIL]: STRICT mode - unresolved issues remain (${report.length} files).`
        : `\n❌ [FAIL]: Critical issues remain (${criticalUnresolved} files).`
    );
    process.exit(1);
  }

  // Helpful hint
  if (!FIX && report.length > 0) {
    console.log(`\n[ADVISORY]: Run with '--fix' to apply safe fixes. Use '--dry-run' to preview.`);
  }
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
🏛️  MDX Safety Gate — Head Butler Edition

Usage:
  node scripts/mdx-illegal-jsx-gate.mjs [options]

Options:
  --fix         Apply safe, reversible fixes
  --dry-run     Preview fixes without writing
  --cleanup     Delete backup files older than 7 days
  --verbose     More logs (especially fix details)
  --strict      Fail on ANY unresolved issue (not just critical)
  --help, -h    Show help

Exit behavior:
  Default: exits 1 only when CRITICAL issues remain
  Strict:  exits 1 when ANY issues remain
`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Critical System Error:", err);
  process.exit(1);
});