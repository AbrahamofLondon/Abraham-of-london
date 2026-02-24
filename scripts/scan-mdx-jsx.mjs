// scripts/scan-mdx-jsx.mjs
import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "content");

function walk(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".mdx")) out.push(p);
  }
  return out;
}

const files = walk(ROOT);

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");

  const badQuotes = text.match(/[“”‘’]/);
  const emDashInTag = text.match(/<[^>]*[—–][^>]*>/);
  const badHyphenTag = text.match(/<[A-Za-z]+-[A-Za-z]+/);

  if (badQuotes || emDashInTag || badHyphenTag) {
    console.log("⚠ Potential JSX issue in:", file);
  }
}

console.log("Scan complete.");