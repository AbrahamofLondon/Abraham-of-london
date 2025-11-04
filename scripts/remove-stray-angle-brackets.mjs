scripts/remove-stray-angle-brackets.mjs
/**
 * Heuristic fixer for corruption that left stray '>' tokens.
 * - Only touches code/content files.
 * - Removes a single trailing '>' at end-of-line when there is no matching '<' on that line.
 * - Removes isolated '>' tokens between identifiers or at start of line where it cannot be valid JSX/TS.
 * - Makes a .bak sidecar before change.
 */
import fs from "node:fs";
import path from "node:path";

const exts = new Set([
  ".ts",".tsx",".js",".jsx",".mjs",".cjs",".md",".mdx",".json",".css",".mcss"
]);

const root = process.cwd();
const ignoreDirs = new Set([
  "node_modules",".next",".git","public/downloads",".contentlayer","dist","build","coverage"
]);

let changed = 0, scanned = 0;

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (ignoreDirs.has(name)) continue;
      walk(p);
    } else {
      const ext = path.extname(name);
      if (exts.has(ext)) fixFile(p);
    }
  }
}

// crude test: count '<' and '>' on the line; if endsWith('>') and
// number of '>' exceeds '<' by 1, probably stray.
function fixLines(src) {
  const lines = src.split(/\r?\n/);
  let touched = false;

  for (let i = 0; i < lines.length; i++) {
    let L = lines[i];

    // 1) kill isolated leading '>' (common in corruption)
    if (/^\s*>\s*$/.test(L)) {
      lines[i] = "";
      touched = true;
      continue;
    }

    // 2) Remove a trailing '>' that isn't paired
    if (/>$/.test(L)) {
      const openCount = (L.match(/</g) || []).length;
      const closeCount = (L.match(/>/g) || []).length;
      if (closeCount > openCount) {
        lines[i] = L.replace(/>\s*$/, "");
        touched = true;
        continue;
      }
    }

    // 3) Remove ' > ' between identifiers not in tags (foo > bar;) — corruption
    // (Keep CSS selectors and TS generics untouched by restricting to obvious junk)
    if (/\w+\s*>\s*\w+;?$/.test(L) && !/[.=:(]/.test(L)) {
      lines[i] = L.replace(/\s*>\s*/g, " ");
      touched = true;
    }
  }
  return touched ? lines.join("\n") : null;
}

function fixFile(file) {
  scanned++;
  let src = fs.readFileSync(file, "utf8");
  const out = fixLines(src);
  if (out !== null && out !== src) {
    fs.copyFileSync(file, file + ".bak");
    fs.writeFileSync(file, out, "utf8");
    changed++;
  }
}

walk(root);
console.log(`[stray-fix] Scanned ${scanned} files, fixed ${changed}.`);
