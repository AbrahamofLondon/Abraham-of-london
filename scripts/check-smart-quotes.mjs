import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const TARGET_DIRS = ["pages", "components", "lib", "scripts", "types", "content"];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".mdx", ".md"]);

const REPLACEMENTS = [
  // Smart quotes → straight
  [/\u2018|\u2019/g, "'"], // ' '
  [/\u201C|\u201D/g, '"'], // " "
  // Other common "word" punctuation
  [/\u2013|\u2014/g, "-"], // - -
  [/\u2026/g, "..."], // ...
  // Invisible troublemakers
  [/\u00A0/g, " "], // NBSP
  [/\u200B|\u200C|\u200D/g, ""], // zero-width
  [/\uFEFF/g, ""], // BOM
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

function shouldProcess(file) {
  const ext = path.extname(file);
  if (!EXTS.has(ext)) return false;
  return true;
}

let changed = 0;

for (const d of TARGET_DIRS) {
  const dir = path.join(ROOT, d);
  if (!fs.existsSync(dir)) continue;

  for (const file of walk(dir)) {
    if (!shouldProcess(file)) continue;

    const before = fs.readFileSync(file, "utf8");
    let after = before;

    for (const [re, rep] of REPLACEMENTS) after = after.replace(re, rep);

    // normalize Windows newlines not needed; leave as-is
    if (after !== before) {
      fs.writeFileSync(file, after, "utf8");
      changed++;
      console.log(`sanitized: ${path.relative(ROOT, file)}`);
    }
  }
}

console.log(`Done. Files changed: ${changed}`);