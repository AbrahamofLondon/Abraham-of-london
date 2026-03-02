import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const TARGET_DIR = path.join(ROOT, "content");

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(abs));
    else out.push(abs);
  }
  return out;
}

function isTextFile(p) {
  return /\.(mdx|md|json|ya?ml)$/i.test(p);
}

function normalizeText(raw) {
  // 1) CRLF -> LF
  let s = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2) Remove trailing whitespace (spaces/tabs) on each line
  s = s.replace(/[ \t]+$/gm, "");

  // 3) Ensure file ends with a single newline
  s = s.replace(/\n*$/g, "\n");

  return s;
}

let touched = 0;

for (const file of walk(TARGET_DIR)) {
  if (!isTextFile(file)) continue;

  const before = fs.readFileSync(file, "utf8");
  const after = normalizeText(before);

  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    touched++;
    console.log(`✅ normalized: ${path.relative(ROOT, file)}`);
  }
}

console.log(`\nDone. Files updated: ${touched}`);
process.exit(0);