import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const downloadsDir = path.join(repoRoot, "public", "assets", "downloads");
const contentDir = path.join(repoRoot, "content");

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const downloadFiles = new Set(
  fs.readdirSync(downloadsDir).map((f) => `/assets/downloads/${f}`)
);

const mdxFiles = walk(contentDir).filter((f) => f.endsWith(".mdx"));

const referenced = new Set();
for (const f of mdxFiles) {
  const txt = fs.readFileSync(f, "utf8");
  // catches "/assets/downloads/anything.pdf" anywhere (frontmatter or body)
  const matches = txt.match(/\/assets\/downloads\/[^\s"')]+/g) || [];
  matches.forEach((m) => referenced.add(m));
}

const missing = [...referenced].filter((m) => !downloadFiles.has(m));

if (missing.length === 0) {
  console.log("✅ No missing /assets/downloads references found.");
  process.exit(0);
}

console.log("❌ Missing download assets referenced in MDX:");
for (const m of missing) console.log(" -", m);

console.log("\nTip: check Unicode dashes/spaces. Best practice: rename files to kebab-case.");
process.exit(1);