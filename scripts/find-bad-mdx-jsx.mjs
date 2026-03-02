import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "content");
const exts = new Set([".md", ".mdx"]);

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (exts.has(path.extname(ent.name).toLowerCase())) out.push(p);
  }
  return out;
}

// Heuristic: find "<tag" that looks like JSX/HTML opening (not "</", not "<!", not "<?")
const OPEN_TAG = /<([^\s>\/!?\n][^>\n]*)/g;

// Extract tagName up to whitespace, ">", or "/"
function getTagName(raw) {
  const m = raw.match(/^([^\s/>]+)/);
  return m ? m[1] : "";
}

// Valid MDX JSX tag name (practical approximation):
// - Component, component
// - Component.Sub
// - allow ":" for svg-ish tags
// - first char letter/_/$
// - subsequent chars letter/digit/_/$/./:
const VALID_TAG = /^[A-Za-z_$][A-Za-z0-9_$.:]*$/;

const files = fs.existsSync(ROOT) ? walk(ROOT) : [];
if (!files.length) {
  console.error(`No .md/.mdx files found under: ${ROOT}`);
  process.exit(1);
}

let badCount = 0;

for (const f of files) {
  const text = fs.readFileSync(f, "utf8");

  // crude skip of fenced code blocks to avoid false positives
  const lines = text.split(/\r?\n/);
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```") || line.trim().startsWith("~~~")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    OPEN_TAG.lastIndex = 0;
    let m;
    while ((m = OPEN_TAG.exec(line))) {
      const raw = m[1];
      const tagName = getTagName(raw);

      // ignore closing tags and comments etc
      if (!tagName || tagName.startsWith("/") || tagName.startsWith("!")) continue;

      // Flag anything that isn't a normal JSX tag name
      if (!VALID_TAG.test(tagName)) {
        badCount++;
        console.log(
          `🚨 BAD JSX TAG: ${path.relative(process.cwd(), f)}:${i + 1}\n` +
          `    tagName: "${tagName}"\n` +
          `    line: ${line}\n`
        );
      }
    }
  }
}

if (!badCount) {
  console.log("✅ No obviously invalid JSX tag names found (by heuristic).");
  process.exit(0);
}

console.log(`\nFound ${badCount} invalid JSX tag occurrences.`);
process.exit(2);