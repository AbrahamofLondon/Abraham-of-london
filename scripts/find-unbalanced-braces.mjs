// scripts/find-unbalanced-braces.mjs
import fs from "fs";
import path from "path";

const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".mdx", ".md", ".mjs", ".cjs"]);
const ignoreDirs = new Set(["node_modules", ".next", ".git", "public", ".contentlayer"]);

const root = process.cwd();
let bad = [];

function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      scan(path.join(dir, entry.name));
      continue;
    }
    const ext = path.extname(entry.name);
    if (!exts.has(ext)) continue;
    const file = path.join(dir, entry.name);
    const txt = fs.readFileSync(file, "utf8");

    const balances = { "{": 0, "(": 0, "[": 0, "<": 0 };
    const pairs = { "}": "{", ")": "(", "]": "[", ">": "<" };

    let line = 1, col = 0, flagged = false;
    for (const ch of txt) {
      if (ch === "\n") { line++; col = 0; continue; }
      col++;

      if (balances.hasOwnProperty(ch)) balances[ch]++;
      if (pairs[ch]) {
        const open = pairs[ch];
        balances[open]--;
        if (balances[open] < 0 && !flagged) {
          bad.push({ file, reason: `early closing "${ch}"`, line, col });
          flagged = true;
        }
      }
    }

    const leftovers = Object.entries(balances).filter(([k,v]) => v > 0);
    if (leftovers.length && !flagged) {
      bad.push({ file, reason: `unclosed ${leftovers.map(([k,v])=>`${k}×${v}`).join(", ")}` });
    }
  }
}

scan(root);

if (!bad.length) {
  console.log("✅ No obvious unbalanced braces/brackets/angles.");
  process.exit(0);
}

console.log("❌ Unbalanced delimiters found:");
for (const b of bad) {
  console.log(`- ${b.file}  ${b.reason}${b.line ? `  (line ${b.line}, col ${b.col})` : ""}`);
}
