// scripts/fix-unescaped-entities.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = "pages/print";
const EXTS = new Set([".tsx", ".jsx"]);

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (EXTS.has(path.extname(p))) fix(p);
  }
}
function fix(p) {
  let s = fs.readFileSync(p, "utf8");
  const orig = s;
  // Escape only quotes between JSX text nodes (very lightweight heuristic)
  s = s.replace(/>([^<]*?)</g, (_m, txt) => {
    return ">" + txt
      .replace(/(?<!&)"/g, "&quot;")
      .replace(/(?<!&)'/g, "&#39;") + "<";
  });
  if (s !== orig) {
    fs.writeFileSync(p, s, "utf8");
    console.log("✅ Escaped text nodes:", p);
  }
}
walk(ROOT);
