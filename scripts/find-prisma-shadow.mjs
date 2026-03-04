import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const IGNORE = new Set(["node_modules", ".next", ".contentlayer", "dist", "out", "public", ".git"]);

const PATTERNS = [
  /declare module\s+['"]@prisma\/client['"]/,
  /module\s+['"]@prisma\/client['"]/,
];

function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (IGNORE.has(e.name)) continue;
      walk(p);
      continue;
    }
    if (!p.endsWith(".d.ts")) continue;

    let s;
    try { s = fs.readFileSync(p, "utf8"); } catch { continue; }

    for (const re of PATTERNS) {
      const m = s.match(re);
      if (m) {
        const idx = s.indexOf(m[0]);
        const line = s.slice(0, idx).split(/\r?\n/).length;
        console.log(`${p}:${line}  ${m[0]}`);
        break;
      }
    }
  }
}

walk(ROOT);
console.log("DONE");