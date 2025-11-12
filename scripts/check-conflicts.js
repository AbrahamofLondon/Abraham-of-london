import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Only scan real source trees (skip build output) */
const SOURCE_DIRS = [
  "app","components","lib","src","scripts","styles","netlify","patches","types","pages","config"
]
const IGNORE_DIRS = [
  "node_modules",".next",".netlify",".contentlayer",".turbo",".cache",".git","dist","build","public"
]
const TEXT_EXTS = new Set([
  ".ts",".tsx",".js",".jsx",".mjs",".cjs",".json",".md",".mdx",".css",".scss",".sass",".yml",".yaml",".toml"
])

/** Strict Git marker regexes (line must match the actual markers) */
const START_RE = /^<{7}(?:[ \t].*)?$/m   // <<<<<<< HEAD or <<<<<<< branch
const MID_RE   = /^={7}\s*$/m            // =======
const END_RE   = /^>{7}(?:[ \t].*)?$/m   // >>>>>>> commit/branch

function walk(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (IGNORE_DIRS.some(d => full.includes(path.sep + d + path.sep))) continue
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

function isTextFile(file) {
  return TEXT_EXTS.has(path.extname(file).toLowerCase())
}

/** True conflict iff a file has a proper block: start + mid + end (at least one set) */
function hasRealConflict(text) {
  // fast check
  if (!START_RE.test(text)) return false
  // verify a block order exists
  let i = 0
  while (i < text.length) {
    const start = text.slice(i).search(START_RE)
    if (start === -1) return false
    const sIdx = i + start

    const afterStart = text.slice(sIdx)
    const midRel = afterStart.search(MID_RE)
    if (midRel === -1) return false
    const mIdx = sIdx + midRel

    const afterMid = text.slice(mIdx)
    const endRel = afterMid.search(END_RE)
    if (endRel === -1) return false
    const eIdx = mIdx + endRel

    // Found one valid block
    return true
  }
  return false
}

function collectCandidates() {
  let files = []
  for (const d of SOURCE_DIRS) if (fs.existsSync(d)) files.push(...walk(d))
  // only text files under 1MB
  return files.filter(f => {
    try {
      const st = fs.statSync(f)
      if (!st.isFile() || st.size > 1024 * 1024) return false
      return isTextFile(f)
    } catch { return false }
  })
}

console.log("🔍 Checking for merge conflicts in editable source files...\n")

const conflicted = []
for (const f of collectCandidates()) {
  try {
    const txt = fs.readFileSync(f, "utf8")
    if (hasRealConflict(txt)) conflicted.push(f)
  } catch { /* ignore */ }
}

if (conflicted.length) {
  console.error("❌ Merge conflict markers found in the following files:\n")
  conflicted.forEach(f => console.error(" • " + f))
  console.error("\n🚨 Resolve these before committing or deploying.\n")
  process.exit(1)
}

console.log("✅ No merge conflicts found in your source tree.")