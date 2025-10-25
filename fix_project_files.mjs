// fix_project_files.mjs
import fs from "node:fs";
import path from "node:path";

const TARGET_DIR = "./pages/print";
const EXTS = new Set([".tsx", ".jsx"]);

// Patterns to fix (mirrors your Python)
const FIXES = [
  // 1) Remove EmbossedBrandMark prop that doesn't exist
  [/\s*baseColor="transparent"\s*/g, ""],

  // 2) Unicode fixes commonly seen after bad encoding passes
  [/-/g, "-"], // em dash
  [/-/g, "-"], // en dash
  [/'/g, "'"], // right single quote
  [/'/g, "'"], // left single quote
  [/"/g, '"'], // left double quote
  [/€\x9d/g, '"'], // right double quote (guarded)
  [/€\x9D/g, '"'], // alt right double quote
  [/"/g, '"'], // right double quote (explicit)
  [/©/g, "©"], // copyright
  [/•/g, "•"], // bullet
  [/.../g, "..."], // ellipsis
];

let filesProcessed = 0;
let filesModified = 0;

function applyFixes(text) {
  let out = text;
  for (const [re, replacement] of FIXES) {
    out = out.replace(re, replacement);
  }
  return out;
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
    } else if (EXTS.has(path.extname(entry.name))) {
      filesProcessed++;
      const orig = fs.readFileSync(p, "utf8");
      const fixed = applyFixes(orig);
      if (fixed !== orig) {
        fs.writeFileSync(p, fixed, { encoding: "utf8" });
        console.log(`✅ Fixed and updated: ${p}`);
        filesModified++;
      }
    }
  }
}

function main() {
  if (!fs.existsSync(TARGET_DIR) || !fs.statSync(TARGET_DIR).isDirectory()) {
    console.error(`❌ Target directory not found: ${TARGET_DIR}`);
    process.exit(1);
  }
  console.log(`🚀 Starting script to fix files in: ${TARGET_DIR}`);
  walk(TARGET_DIR);
  console.log("\n-------------------------------------------");
  console.log("✨ Script complete.");
  console.log(`Total files scanned: ${filesProcessed}`);
  console.log(`Total files modified: ${filesModified}`);
  console.log("-------------------------------------------");
}

main();
