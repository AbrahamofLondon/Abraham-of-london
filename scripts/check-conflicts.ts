/* scripts/check-conflicts.ts - INSTITUTIONAL AUDITOR V2.1 */
import fs from "node:fs";
import path from "node:path";

const SOURCE_DIRS = ["app", "components", "lib", "src", "scripts", "styles", "pages", "config"];
const IGNORE_DIRS = ["node_modules", ".next", ".netlify", ".contentlayer", ".git", "dist", "build"];
const TEXT_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".md", ".mdx", ".css", ".yml", ".yaml"]);

const START_RE = /^<{7}(?:[ \t].*)?$/m;
const MID_RE = /^={7}\s*$/m;
const END_RE = /^>{7}(?:[ \t].*)?$/m;

function walk(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (IGNORE_DIRS.some((d) => full.includes(path.sep + d + path.sep))) continue;
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function hasRealConflict(text: string): boolean {
  return START_RE.test(text) && MID_RE.test(text) && END_RE.test(text);
}

function collectFiles(): string[] {
  let files: string[] = [];
  for (const d of SOURCE_DIRS) if (fs.existsSync(d)) files.push(...walk(d));
  return files.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    if (!TEXT_EXTS.has(ext)) return false;
    try {
      const st = fs.statSync(f);
      return st.isFile() && st.size < 2 * 1024 * 1024; // Limit to 2MB for performance
    } catch { return false; }
  });
}

console.log("🔍 Auditing source tree for merge conflicts...");

const conflicted: string[] = [];
for (const f of collectFiles()) {
  try {
    const txt = fs.readFileSync(f, "utf8");
    if (hasRealConflict(txt)) conflicted.push(f);
  } catch { /* skip inaccessible */ }
}

if (conflicted.length) {
  console.error("\n❌ CRITICAL: Merge conflict markers found in source files:\n");
  conflicted.forEach((f) => console.error(`  • ${f}`));
  console.error("\n🚨 Action Required: Resolve these markers before proceeding.\n");
  process.exit(1);
}

console.log("✅ Integrity Verified: No merge conflicts found.");

export {};