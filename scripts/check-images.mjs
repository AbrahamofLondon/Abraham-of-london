import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");

// crude scanners
const blobs = [
  ...glob("content/blog", /\.(mdx?|json)$/i),
  ...glob("content/events", /\.(mdx?|json)$/i),
];

const missing = [];
for (const f of blobs) {
  const text = fs.readFileSync(f, "utf8");
  for (const m of text.matchAll(/(coverImage|heroImage)\s*:\s*["']([^"']+)["']/g)) {
    const p = m[2].replace(/\\/g, "/");
    if (!p.startsWith("/")) continue; // remote URLs are fine
    const full = path.join(publicDir, p);
    if (!fs.existsSync(full)) missing.push({ file: f, ref: p });
  }
}

if (missing.length) {
  console.log("Missing image files:");
  for (const m of missing) console.log("-", m.ref, "referenced in", m.file);
  process.exit(1);
} else {
  console.log("✅ All referenced local images exist under /public");
}

// mini glob helper
function glob(rel, rx) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  walk(dir);
  return out;
  function walk(d) {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (rx.test(name)) out.push(p);
    }
  }
}
