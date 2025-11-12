import fs from "node:fs";
import path from "node:path";

// Try to import postcss, but exit gracefully if not available
let postcss;
try {
  postcss = (await import('postcss')).default;
} catch (e) {
  console.log('postcss not available; skipping postcss guard.');
  process.exit(0);
}

import guard from "../postcss/no-slash-opacity.js";

const ROOT = process.cwd();
const CSS_DIRS = ["styles"];
const WRITE = process.argv.includes("--write");
const MODE = process.env.NO_SLASH_OPACITY_MODE || (WRITE ? "fix" : "error");

function collect() {
  const files = [];
  for (const dir of CSS_DIRS) {
    const base = path.join(ROOT, dir);
    if (!fs.existsSync(base)) continue;
    const stack = [base];
    while (stack.length) {
      const d = stack.pop();
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) stack.push(p);
        else if (e.isFile() && p.endsWith(".css")) files.push(p);
      }
    }
  }
  return files;
}

const cssFiles = collect();
let violations = 0;
const logs = [];

for (const file of cssFiles) {
  const src = fs.readFileSync(file, "utf8");
  try {
    const out = await postcss([guard({ mode: MODE })]).process(src, { from: file, to: file });
    if (WRITE && out.css !== src) {
      fs.writeFileSync(file, out.css, "utf8");
      logs.push(`? auto-fixed: ${path.relative(ROOT, file)}`);
    } else {
      logs.push(`OK: ${path.relative(ROOT, file)}`);
    }
  } catch (err) {
    violations++;
    logs.push(`? ${path.relative(ROOT, file)} ${err.message}`);
  }
}

const report = logs.join("\n");
const outDir = path.join(ROOT, "artifacts");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "postcss-guard-report.txt"), report, "utf8");
console.log(report);

if (violations && !WRITE) {
  console.error(`\nFound ${violations} CSS violation(s). See artifacts/postcss-guard-report.txt`);
  process.exit(1);
}