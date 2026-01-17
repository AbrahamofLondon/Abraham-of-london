/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

/**
 * Minimal, safe YAML fixer for frontmatter blocks.
 * - Converts Windows CRLF -> LF in content files
 * - Replaces tab indentation with 2 spaces (YAML hates tabs)
 * - Removes BOM if present
 *
 * Target: your /content directory only (where MDX lives).
 */

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");

const exts = new Set([".md", ".mdx", ".yaml", ".yml"]);

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) {
    console.warn(`[fix:yaml] Directory does not exist: ${dir}`);
    return out;
  }

  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
      // Skip junk
      if (it.name.startsWith(".") || it.name === "node_modules") continue;
      
      const full = path.join(dir, it.name);
      try {
        if (it.isDirectory()) {
          out.push(...walk(full));
        } else if (it.isFile() && exts.has(path.extname(it.name).toLowerCase())) {
          out.push(full);
        }
      } catch (err) {
        console.warn(`[fix:yaml] Skipping ${full}: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`[fix:yaml] Could not read directory ${dir}: ${err.message}`);
  }
  return out;
}

function fixFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    let next = raw;

    // Remove UTF-8 BOM if present
    if (next.charCodeAt(0) === 0xfeff) next = next.slice(1);

    // Normalize line endings
    next = next.replace(/\r\n/g, "\n");

    // Replace tabs with 2 spaces (YAML hates tabs)
    next = next.replace(/\t/g, "  ");

    // Mild cleanup: avoid trailing spaces
    next = next.replace(/[ \t]+\n/g, "\n");

    if (next !== raw) {
      fs.writeFileSync(filePath, next, "utf8");
      console.log(`[fix:yaml] Fixed: ${path.relative(ROOT, filePath)}`);
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`[fix:yaml] Could not process ${filePath}: ${err.message}`);
    return false;
  }
}

(function main() {
  try {
    console.log(`[fix:yaml] Scanning directory: ${CONTENT_DIR}`);
    
    if (!fs.existsSync(CONTENT_DIR)) {
      console.error(`[fix:yaml] ERROR: Content directory not found at ${CONTENT_DIR}`);
      console.log(`[fix:yaml] Current directory: ${ROOT}`);
      console.log(`[fix:yaml] Available directories in ${ROOT}:`);
      try {
        const items = fs.readdirSync(ROOT, { withFileTypes: true });
        const dirs = items.filter(it => it.isDirectory()).map(it => it.name);
        console.log(`[fix:yaml]   ${dirs.join(", ")}`);
      } catch (e) {
        console.log(`[fix:yaml]   Could not list directories: ${e.message}`);
      }
      process.exit(1);
    }

    const files = walk(CONTENT_DIR);
    
    if (files.length === 0) {
      console.log(`[fix:yaml] No content files found in ${CONTENT_DIR}`);
      console.log(`[fix:yaml] Looking for files with extensions: ${Array.from(extts).join(", ")}`);
      process.exit(0);
    }

    let changed = 0;
    for (const f of files) {
      if (fixFile(f)) changed++;
    }

    console.log(`[fix:yaml] Scanned ${files.length} files. Updated ${changed}.`);
    process.exit(0);
  } catch (err) {
    console.error("[fix:yaml] Failed:", err);
    process.exit(1);
  }
})();