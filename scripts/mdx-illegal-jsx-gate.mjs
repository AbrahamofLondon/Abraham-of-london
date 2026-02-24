/* scripts/mdx-illegal-jsx-gate.mjs - SAFETY-FIRST INSTITUTIONAL VERSION */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import glob from "fast-glob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = "content";
const FIX = process.argv.includes("--fix");
const BOM = "\uFEFF"; 

const RESERVED_WORDS = new Set([
  'Object', 'Array', 'Function', 'String', 'Number', 'Boolean', 'Symbol',
  'Promise', 'Error', 'Date', 'Math', 'JSON', 'console', 'window', 'document',
  'undefined', 'null', 'NaN', 'Infinity', 'global', 'process', 'module',
  'exports', 'require', 'arguments', 'eval', 'this', 'super', 'new', 'typeof',
  'instanceof', 'delete', 'in', 'with', 'void', 'await', 'async', 'yield',
  'let', 'const', 'var', 'class', 'extends', 'import', 'export', 'default',
  'return', 'throw', 'try', 'catch', 'finally', 'if', 'else', 'switch',
  'case', 'break', 'continue', 'for', 'while', 'do', 'true', 'false'
]);

/**
 * Validates MDX structure and looks for characters that cause 
 * "Invalid code point -4" errors.
 */
function auditContent(s, filename) {
  const issues = [];
  
  // 1. CRLF Check (The primary cause of offset errors on Windows)
  if (s.includes('\r\n')) {
    issues.push("Structural Risk: CRLF (Windows) line endings detected. Contentlayer requires LF.");
  }

  // 2. Trailing Whitespace (The cause of 'pointer drift' in MDX parsers)
  if (/[ \t]+(\n|$)/.test(s)) {
    issues.push("Structural Risk: Trailing whitespace detected (Common cause of 'Invalid code point').");
  }

  const analysisTarget = s.replace(/```[\s\S]*?```/g, "");

  // 3. Brace Balance
  const openBraces = (analysisTarget.match(/\{/g) || []).length;
  const closeBraces = (analysisTarget.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    issues.push(`Structural Risk: Unbalanced braces detected ({:${openBraces}, }: ${closeBraces})`);
  }

  // 4. Reserved Components
  const tagRe = /<\/?\s*([A-Z][A-Za-z0-9_]*)\b/g;
  let m;
  while ((m = tagRe.exec(analysisTarget)) !== null) {
    if (RESERVED_WORDS.has(m[1])) {
      issues.push(`Illegal Component: <${m[1]}> is a JS reserved word.`);
    }
  }

  return issues;
}

async function run() {
  const files = await glob([`${CONTENT_DIR}/**/*.mdx`], { dot: false });
  const failures = [];
  let correctedFiles = 0;

  console.log(`🏛️ [MDX_GATE]: Performing safety audit on ${files.length} assets...`);

  for (const file of files) {
    const originalBuffer = fs.readFileSync(file);
    let content = originalBuffer.toString("utf8");
    let fileIssues = [];

    // LAYER 1: BOM & STRUCTURE SANITIZATION
    if (FIX) {
      let needsWrite = false;
      let newContent = content;

      // Strip BOM
      if (newContent.startsWith(BOM)) {
        newContent = newContent.slice(1);
        needsWrite = true;
      }

      // Heal CRLF -> LF
      if (newContent.includes('\r\n')) {
        newContent = newContent.replace(/\r\n/g, '\n');
        needsWrite = true;
      }

      // Trim Trailing Whitespace
      if (/[ \t]+(\n|$)/.test(newContent)) {
        newContent = newContent.replace(/[ \t]+(\n|$)/g, '$1');
        needsWrite = true;
      }

      if (needsWrite) {
        fs.writeFileSync(file, newContent, "utf8");
        correctedFiles++;
        content = newContent; // Update local variable for next checks
      }
    } else {
      // If not in FIX mode, flag these as issues
      if (content.startsWith(BOM)) fileIssues.push("Contains UTF-8 BOM");
      if (content.includes('\r\n')) fileIssues.push("CRLF Line Endings");
      if (/[ \t]+(\n|$)/.test(content)) fileIssues.push("Trailing Whitespace");
    }

    // LAYER 2: FRONTMATTER INTEGRITY
    if (!content.trimStart().startsWith('---')) {
      fileIssues.push("Missing Frontmatter: File must start with '---'");
    }

    // LAYER 3: CONTENT AUDIT
    const contentIssues = auditContent(content, file);
    fileIssues = [...fileIssues, ...contentIssues];

    if (fileIssues.length > 0) {
      failures.push({ file, issues: fileIssues });
    }
  }

  if (correctedFiles > 0) {
    console.log(`🩹 [HEALED]: Automatically stabilized ${correctedFiles} assets.`);
  }

  if (failures.length > 0) {
    console.error(`\n❌ [INTEGRITY FAILURE]: Structural risks in ${failures.length} files:`);
    failures.forEach(f => {
      console.error(`\nLocation: ${f.file}`);
      f.issues.forEach(issue => console.error(`  └─ ${issue}`));
    });
    
    console.error(`\n[ADVISORY]: Run 'node scripts/mdx-illegal-jsx-gate.mjs --fix' to stabilize structures automatically.`);
    process.exit(1);
  }

  console.log(`✅ [SUCCESS]: All ${files.length} assets verified.`);
}

run().catch(err => {
  console.error("Critical System Error:", err);
  process.exit(1);
});