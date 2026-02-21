import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules", ".next", ".contentlayer", "dist", "out"]);
const TARGET_EXT = new Set([".mdx", ".md"]);

function walk(dir, out = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) {
      if (!IGNORE_DIRS.has(it.name)) walk(full, out);
      continue;
    }
    const ext = path.extname(it.name).toLowerCase();
    if (TARGET_EXT.has(ext)) out.push(full);
  }
  return out;
}

// Patterns that break MDX parsing
const BAD_PATTERNS = [
  { name: "Illegal JSX tag starts with <[", re: /<\[/g },
  { name: "Illegal JSX tag starts with <(", re: /<\(/g },
];

const files = walk(ROOT);
const hits = [];

for (const file of files) {
  const txt = fs.readFileSync(file, "utf8");
  for (const p of BAD_PATTERNS) {
    if (p.re.test(txt)) {
      // Find line numbers
      const lines = txt.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (p.re.test(lines[i])) {
          hits.push({
            file: path.relative(ROOT, file),
            line: i + 1,
            pattern: p.name,
            preview: lines[i].slice(0, 200),
          });
        }
      }
    }
  }
}

if (hits.length) {
  console.error("\n⛔ MDX GATE FAILED — Illegal JSX patterns found:\n");
  for (const h of hits) {
    console.error(`- ${h.file}:${h.line}  (${h.pattern})`);
    console.error(`  ${h.preview}\n`);
  }
  process.exit(1);
}

console.log("✅ MDX GATE PASSED — no illegal JSX patterns detected.");