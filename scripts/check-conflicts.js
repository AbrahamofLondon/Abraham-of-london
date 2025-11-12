const fs = require("node:fs");
const path = require("node:path");

// Scan only real source trees
const SOURCE_DIRS = [
  "app","components","lib","src","scripts","styles","netlify","patches","types","pages","config"
];

const IGNORE_DIRS = [
  "node_modules",".next",".netlify",".contentlayer",".turbo",".cache",".git","dist","build","public"
];

// Do not flag this script or other utility files
const IGNORE_FILES_ABS = new Set([
  path.resolve("scripts/check-conflicts.js"),
]);

// FIXED: More specific conflict marker detection
// Only matches lines that are ONLY conflict markers (no other text)
const MARKER_RE = /^\s*<<<<<<<\s*$|^\s*=======\s*$|^\s*>>>>>>>\s*$/m;

const TEXT_EXTS = new Set([
  ".ts",".tsx",".js",".jsx",".mjs",".cjs",".json",".md",".mdx",".css",".scss",".sass",".yml",".yaml",".toml",".tsconfig"
]);

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (IGNORE_DIRS.some(d => full.includes(path.sep + d + path.sep))) continue;
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function isTextFile(file) {
  return TEXT_EXTS.has(path.extname(file).toLowerCase());
}

function hasMarkers(file) {
  try {
    if (IGNORE_FILES_ABS.has(path.resolve(file))) return false;
    if (!isTextFile(file)) return false;
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > 1024 * 1024) return false; // skip >1MB
    const text = fs.readFileSync(file, "utf8");
    return MARKER_RE.test(text);
  } catch { return false; }
}

console.log("🔍 Checking for merge conflicts in editable source files...\n");

let candidates = [];
for (const d of SOURCE_DIRS) if (fs.existsSync(d)) candidates.push(...walk(d));
const conflicted = candidates.filter(hasMarkers);

if (conflicted.length) {
  console.error("❌ Merge conflict markers found in the following files:\n");
  conflicted.forEach(f => console.error(" • " + f));
  console.error("\n🚨 Resolve these before committing or deploying.\n");
  process.exit(1);
}

console.log("✅ No merge conflicts found in your source tree.");