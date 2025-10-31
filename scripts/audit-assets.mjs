// scripts/audit-assets.mjs
import fs from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

// simple globless search for /assets/... in your codebase
const roots = ["pages", "components", "content", "lib", "app"].filter(d => fs.existsSync(d));
const fileRx = /\.(tsx?|jsx?|mdx?|md|json|css|html)$/i;
const webPathRx = /(["'`])\/assets\/[^\1]+?\.(?:png|jpe?g|webp|svg|gif)\1/g;

let missing = [];

function walk(p) {
  for (const name of fs.readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, name.name);
    if (name.isDirectory()) walk(full);
    else if (fileRx.test(name.name)) {
      const text = fs.readFileSync(full, "utf8");
      for (const m of text.matchAll(webPathRx)) {
        const rel = m[0].slice(1, -1); // strip quotes
        const disk = path.join(PUBLIC_DIR, rel);
        if (!fs.existsSync(disk)) missing.push({ file: full, ref: rel });
      }
    }
  }
}

roots.forEach(walk);

if (missing.length) {
  console.error("\n❌ Missing assets detected:");
  for (const m of missing) console.error(`- ${m.ref} (referenced in ${m.file})`);
  process.exit(1);
}
console.log("✅ All referenced /assets/* images exist.");
