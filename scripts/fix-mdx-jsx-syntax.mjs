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

let fixed = 0;

for (const file of files) {
  let text = fs.readFileSync(file, "utf8");

  const original = text;

  // Replace smart quotes with ASCII
  text = text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  // Replace em dash inside JSX tag names
  text = text.replace(/<([A-Za-z]+)[—–-]([A-Za-z]+)/g, "<$1$2");

  // Remove stray non-printable characters
  text = text.replace(/[\u0000-\u001F\u007F]/g, "");

  if (text !== original) {
    fs.writeFileSync(file, text, "utf8");
    console.log("Fixed:", file);
    fixed++;
  }
}

console.log(`Done. Repaired ${fixed} files.`);