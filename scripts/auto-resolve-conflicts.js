// scripts/auto-resolve-conflicts.js
const fs = require("node:fs");
const path = require("node:path");

const MODE = process.argv.includes("--theirs") ? "theirs" : "ours";
const DRY = process.argv.includes("--dry-run");

// same sources as the checker
const SOURCE_DIRS = ["app","components","lib","src","scripts","styles","netlify","patches","types","pages","config"];
const IGNORE_DIRS = ["node_modules",".next",".netlify",".contentlayer",".turbo",".cache",".git","dist","build","public"];
const MARKER_START = /^\s*<<<<<<<.*$/m;
const MARKER_MID   = /^\s*=======$/m;
const MARKER_END   = /^\s*>>>>>>>.*$/m;

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (IGNORE_DIRS.some(d => full.includes(path.sep + d + path.sep))) continue;
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function resolveText(text) {
  // iterative resolution of nested/serial conflict blocks
  let changed = false;
  let out = text;
  while (true) {
    const start = out.search(MARKER_START);
    if (start === -1) break;

    const afterStart = out.slice(start);
    const midRel = afterStart.search(MARKER_MID);
    const endRel = afterStart.search(MARKER_END);
    if (midRel === -1 || endRel === -1) break; // malformed; stop

    const mid = start + midRel;
    const end = start + endRel;

    const head = out.slice(0, start);
    const ours = out.slice(start, mid).replace(MARKER_START, "");
    const theirs = out.slice(mid, end).replace(MARKER_MID, "");
    const tail = out.slice(end).replace(MARKER_END, "");

    const keep = MODE === "ours" ? ours : theirs;
    out = head + keep + tail;
    changed = true;
  }
  return { text: out, changed };
}

function processFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  if (!MARKER_START.test(raw) || !MARKER_END.test(raw)) return false;
  const { text, changed } = resolveText(raw);
  if (!changed) return false;

  if (DRY) {
    console.log(`[dry-run] would resolve: ${file}`);
  } else {
    fs.copyFileSync(file, file + ".bak");
    fs.writeFileSync(file, text, "utf8");
    console.log(`resolved: ${file} (${MODE}), backup: ${path.basename(file)}.bak`);
  }
  return true;
}

let files = [];
for (const d of SOURCE_DIRS) if (fs.existsSync(d)) files.push(...walk(d));
let count = 0;
for (const f of files) {
  try {
    count += processFile(f) ? 1 : 0;
  } catch (e) {
    console.warn(`skip ${f}: ${e.message}`);
  }
}
console.log(`Done. ${count} file(s) ${DRY ? "would be " : ""}resolved using "${MODE}".`);