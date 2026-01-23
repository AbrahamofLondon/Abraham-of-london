// FIXED VERSION: scripts/contentlayer/sanitize-mdx.ts
import fs from "fs";
import path from "path";

type ScanResult = {
  file: string;
  changed: boolean;
  issues: string[];
};

const CONTENT_ROOT = path.join(process.cwd(), "content");
const TARGET_DIRS = [
  "downloads",
  "blog",
  "shorts",
  "books",
  "canon",
  "events",
  "prints",
  "resources",
  "strategy",
];

const MDX_EXT = new Set([".mdx", ".md"]);

function walk(dir: string, out: string[] = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === ".next" ||
        entry.name === ".contentlayer" ||
        entry.name === "_templates"
      ) continue;
      walk(abs, out);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (MDX_EXT.has(ext)) out.push(abs);
    }
  }
  return out;
}

/**
 * SAFE sanitizer that only replaces comparison operators in TEXT contexts
 * NOT inside JSX/HTML tags, code blocks, or inline code
 */
function sanitize(content: string, issues: string[]): { out: string; changed: boolean } {
  let out = content;
  let changed = false;
  
  // PROTECT: Code blocks (```...```)
  const codeBlockPattern = /```[\s\S]*?```/g;
  const codeBlocks: string[] = [];
  out = out.replace(codeBlockPattern, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });
  
  // PROTECT: Inline code (`...`)
  const inlineCodePattern = /`[^`\n]+`/g;
  const inlineCodes: string[] = [];
  out = out.replace(inlineCodePattern, (match) => {
    inlineCodes.push(match);
    return `__INLINE_CODE_${inlineCodes.length - 1}__`;
  });
  
  // PROTECT: JSX/HTML tags (<...>)
  const jsxTagPattern = /<[^>\n]*>/g;
  const jsxTags: string[] = [];
  out = out.replace(jsxTagPattern, (match) => {
    // Skip if it's already an entity (&lt; or &gt;)
    if (match.includes('&lt;') || match.includes('&gt;')) return match;
    jsxTags.push(match);
    return `__JSX_TAG_${jsxTags.length - 1}__`;
  });
  
  // NOW safely replace comparison operators in remaining text
  
  // Pattern 1: **<50** or **< 50** (bold text with comparison)
  const boldComparisonPattern = /\*\*\s*<\s*(\d+)\s*\*\*/g;
  out = out.replace(boldComparisonPattern, (match, num) => {
    changed = true;
    issues.push(`Replaced "**<${num}**" with "**&lt;${num}**"`);
    return `**&lt;${num}**`;
  });
  
  // Pattern 2: **>50** or **> 50** (bold text with comparison)
  const boldGreaterPattern = /\*\*\s*>\s*(\d+)\s*\*\*/g;
  out = out.replace(boldGreaterPattern, (match, num) => {
    changed = true;
    issues.push(`Replaced "**>${num}**" with "**&gt;${num}**"`);
    return `**&gt;${num}**`;
  });
  
  // Pattern 3: Standalone comparisons <50 or >50 (not in bold)
  // Only replace if NOT preceded by a letter (to avoid breaking component names)
  const standaloneLessPattern = /([^a-zA-Z_\-])<\s*(\d+)/g;
  out = out.replace(standaloneLessPattern, (match, before, num) => {
    changed = true;
    issues.push(`Replaced "${before}<${num}" with "${before}&lt;${num}"`);
    return `${before}&lt;${num}`;
  });
  
  const standaloneGreaterPattern = /([^a-zA-Z_\-])>\s*(\d+)/g;
  out = out.replace(standaloneGreaterPattern, (match, before, num) => {
    changed = true;
    issues.push(`Replaced "${before}>${num}" with "${before}&gt;${num}"`);
    return `${before}&gt;${num}`;
  });
  
  // RESTORE protected content
  jsxTags.forEach((tag, index) => {
    out = out.replace(`__JSX_TAG_${index}__`, tag);
  });
  
  inlineCodes.forEach((code, index) => {
    out = out.replace(`__INLINE_CODE_${index}__`, code);
  });
  
  codeBlocks.forEach((block, index) => {
    out = out.replace(`__CODE_BLOCK_${index}__`, block);
  });
  
  return { out, changed };
}

function run(): { scanned: number; changed: number; results: ScanResult[] } {
  const results: ScanResult[] = [];
  const roots = TARGET_DIRS.map((d) => path.join(CONTENT_ROOT, d));
  const files = roots.flatMap((dir) => walk(dir));

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const issues: string[] = [];
    const { out, changed } = sanitize(raw, issues);

    if (changed) {
      fs.writeFileSync(file, out, "utf8");
      results.push({
        file: path.relative(process.cwd(), file),
        changed,
        issues,
      });
    }
  }

  return {
    scanned: files.length,
    changed: results.length,
    results,
  };
}

const summary = run();

console.log("========================================");
console.log("🧼 MDX SANITIZER REPORT (SAFE VERSION)");
console.log("========================================");
console.log(`Scanned: ${summary.scanned}`);
console.log(`Changed: ${summary.changed}`);

if (summary.changed) {
  console.log("\nChanged files:");
  for (const r of summary.results) {
    console.log(`- ${r.file}`);
    r.issues.slice(0, 5).forEach((i) => console.log(`   • ${i}`));
    if (r.issues.length > 5) console.log(`   • ... (${r.issues.length - 5} more)`);
  }
}

console.log("========================================");