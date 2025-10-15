#!/usr/bin/env node
/**
 * Finds MDX/MD files and replaces:
 *   <script type="application/ld+json">
 *     { JSON ... }
 *   </script>
 * with:
 *   <JsonLd data={ ... } />
 *
 * Scans common content folders; adjust FOLDERS as needed.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FOLDERS = ["content", "posts", "data/blog", "blog", "pages/blog", "app/blog"].map(p => path.join(ROOT, p));
const exts = new Set([".mdx", ".md"]);

const WRITE = process.argv.includes("--write");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && exts.has(path.extname(p))) out.push(p);
  }
  return out;
}

const files = FOLDERS.flatMap(d => walk(d));
let changed = 0;

const BLOCK_RX = /<script\s+type=["']application\/ld\+json["']\s*>\s*([\s\S]*?)\s*<\/script>/gi;

for (const file of files) {
  let src = fs.readFileSync(file, "utf8");
  let next = src;
  next = next.replace(BLOCK_RX, (_m, jsonLike) => {
    try {
      // Try to parse as JSON (handles quotes, escapes)
      const obj = JSON.parse(jsonLike);
      return `<JsonLd data={${JSON.stringify(obj)}} />`;
    } catch {
      // Fallback: wrap raw text, best-effort; user can fix manually if needed
      const safe = jsonLike.trim();
      return `<JsonLd data={${safe}} />`;
    }
  });

  if (next !== src) {
    changed++;
    if (WRITE) fs.writeFileSync(file, next, "utf8");
    console.log(`${WRITE ? "✔ fixed" : "→ would fix"}: ${path.relative(ROOT, file)}`);
  }
}

console.log(changed ? `${WRITE ? "Updated" : "Would update"} ${changed} file(s).` : "No JSON-LD <script> blocks found.");
if (!WRITE && changed) process.exitCode = 1;
