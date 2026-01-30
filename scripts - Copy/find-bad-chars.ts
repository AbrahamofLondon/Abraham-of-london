import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const TARGET_DIRS = ["pages", "components", "lib"];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".ts"]);

const BAD_RE = /[\u2018\u2019\u201C\u201D\u00A0\u200B\u200C\u200D\uFEFF]/g;

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

function lineColFromIndex(s, idx) {
  const upTo = s.slice(0, idx);
  const lines = upTo.split("\n");
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

let hits = 0;

for (const d of TARGET_DIRS) {
  const dir = path.join(ROOT, d);
  if (!fs.existsSync(dir)) continue;

  for (const file of walk(dir)) {
    if (!EXTS.has(path.extname(file))) continue;

    const s = fs.readFileSync(file, "utf8");
    BAD_RE.lastIndex = 0;

    let m;
    while ((m = BAD_RE.exec(s))) {
      hits++;
      const idx = m.index;
      const ch = m[0];
      const cp = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
      const { line, col } = lineColFromIndex(s, idx);
      console.log(`${path.relative(ROOT, file)}:${line}:${col} U+${cp}`);
    }
  }
}

console.log(`Done. Total bad-char hits: ${hits}`);
process.exit(hits ? 1 : 0);
