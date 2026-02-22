// scripts/mdx-illegal-jsx-gate.mjs - FIXED VERSION
import fs from "fs";
import path from "path";
import glob from "fast-glob";

const CONTENT_DIR = "content";
const FIX = process.argv.includes("--fix");
const QUARANTINE = process.argv.includes("--quarantine");

const BOM = "\uFEFF";

function stripBom(s) {
  return s.startsWith(BOM) ? s.slice(1) : s;
}

function splitCodeFences(s) {
  const parts = [];
  const fenceRe = /```[\s\S]*?```/g;
  let last = 0;
  let m;
  while ((m = fenceRe.exec(s))) {
    if (m.index > last) parts.push({ type: "text", value: s.slice(last, m.index) });
    parts.push({ type: "code", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push({ type: "text", value: s.slice(last) });
  return parts;
}

// REMOVED: unescapeHtmlOutsideCode - this was causing issues
// We should NOT automatically unescape HTML entities

function hasValidFrontmatter(s) {
  // Check if file starts with --- and has closing ---
  const trimmed = s.trimStart();
  return trimmed.startsWith('---\n') && trimmed.includes('\n---\n');
}

function ensureFrontmatterAtTop(s) {
  // Only move frontmatter if it exists but not at the top
  const fmMatch = s.match(/^---\s*\n[\s\S]*?\n---\s*(\n|$)/);
  if (!fmMatch) return s;
  
  const fm = fmMatch[0];
  const rest = s.replace(fm, '');
  
  // If frontmatter wasn't at the top, move it there
  if (!s.startsWith('---')) {
    return `${fm}\n${rest.trimStart()}`;
  }
  return s;
}

// REMOVED: demoteExtraFrontmatterFences - this was corrupting files
// We should NEVER automatically convert --- to ***

function validateFrontmatter(s) {
  const lines = s.split('\n');
  let inFrontmatter = false;
  let frontmatterCount = 0;
  const issues = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        frontmatterCount++;
      } else {
        inFrontmatter = false;
      }
    }
  }
  
  if (frontmatterCount > 2) {
    issues.push(`Found ${frontmatterCount} frontmatter delimiters (should be exactly 2)`);
  }
  
  return issues;
}

async function run() {
  const files = await glob([`${CONTENT_DIR}/**/*.mdx`], { dot: false });
  const invalid = [];
  let fixedCount = 0;

  for (const file of files) {
    const original = fs.readFileSync(file, "utf8");
    let s = original;
    const issues = [];

    // Check for BOM
    if (s.startsWith(BOM)) {
      issues.push("File begins with UTF-8 BOM");
    }

    // Check frontmatter validity
    if (!hasValidFrontmatter(s)) {
      issues.push("File does not have valid frontmatter (must start with --- and have closing ---)");
    } else {
      // Additional frontmatter validation
      const fmIssues = validateFrontmatter(s);
      issues.push(...fmIssues);
    }

    if (issues.length) {
      if (FIX) {
        let updated = s;
        
        // Only apply safe fixes
        updated = stripBom(updated);
        updated = ensureFrontmatterAtTop(updated);
        
        // DON'T automatically unescape HTML or convert --- to ***
        
        if (updated !== original) {
          fs.writeFileSync(file, updated, "utf8");
          fixedCount++;
          console.log(`✅ Fixed: ${file}`);
        } else if (QUARANTINE) {
          quarantineFile(file, issues.join("\n"));
        }
      } else {
        invalid.push({ file, issues });
      }
    }
  }

  if (!FIX) {
    if (invalid.length) {
      console.error(`[MDX_GATE] Integrity check failed: ${invalid.length} file(s) invalid.`);
      for (const f of invalid.slice(0, 40)) {
        console.error(`- ${f.file}`);
        for (const i of f.issues) console.error(`  • ${i}`);
      }
      if (invalid.length > 40) console.error(`...and ${invalid.length - 40} more.`);
      process.exit(1);
    } else {
      console.log(`[MDX_GATE] OK. ${files.length} file(s) checked. 0 invalid.`);
    }
  } else {
    console.log(`[MDX_GATE] Fix mode complete. Files checked: ${files.length}. Files modified: ${fixedCount}.`);
  }
}

run().catch((err) => {
  console.error("[MDX_GATE] Failed:", err);
  process.exit(1);
});