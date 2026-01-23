import fs from "fs";
import path from "path";

const ROOT = process.cwd();

// Only the files Contentlayer reported as failing
const FILES = [
  "content/blog/fathering-principles.mdx",
  "content/blog/in-my-fathers-house.mdx",
  "content/blog/principles-for-my-son.mdx",
  "content/downloads/ultimate-purpose-of-man-editorial.mdx",
];

function fixNotes(content: string): { out: string; fixes: number } {
  // Fix ONLY inline Notes that look like:
  // <Note ...>some text...
  // (missing </Note> on same line)
  // We close them at the end of the line, unless already closed.
  const lines = content.split(/\r?\n/);
  let fixes = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasOpen = /<Note\b[^>]*>/.test(line);
    const hasClose = /<\/Note>/.test(line);
    if (!hasOpen || hasClose) continue;

    // Only close if there is inline content after the first '>'
    const gt = line.indexOf(">");
    if (gt === -1) continue;

    const after = line.slice(gt + 1);
    if (after.trim().length === 0) continue; // multi-line Note; we won't guess here

    lines[i] = line + "</Note>";
    fixes++;
  }

  return { out: lines.join("\n"), fixes };
}

function fixSvgText(content: string): { out: string; fixes: number } {
  // If there are more <text ...> than </text>, insert missing </text>
  // right before the last </svg> in the file.
  const openCount = (content.match(/<text\b/g) || []).length;
  const closeCount = (content.match(/<\/text>/g) || []).length;
  if (openCount <= closeCount) return { out: content, fixes: 0 };

  const missing = openCount - closeCount;
  const svgClose = content.lastIndexOf("</svg>");
  if (svgClose === -1) {
    // If no </svg>, append closes at EOF (rare)
    return { out: content + "\n" + "</text>\n".repeat(missing), fixes: missing };
  }

  const insert = "\n" + "</text>\n".repeat(missing);
  const out = content.slice(0, svgClose) + insert + content.slice(svgClose);
  return { out, fixes: missing };
}

function processOne(rel: string) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    console.log(`⏭️  Missing: ${rel}`);
    return { changed: false, noteFixes: 0, textFixes: 0 };
  }

  const raw = fs.readFileSync(abs, "utf8");

  const n = fixNotes(raw);
  const t = fixSvgText(n.out);

  const changed = t.out !== raw;
  if (changed) fs.writeFileSync(abs, t.out, "utf8");

  console.log(`${changed ? "✅" : "⏭️ "} ${rel}  (</Note>: ${n.fixes}, </text>: ${t.fixes})`);
  return { changed, noteFixes: n.fixes, textFixes: t.fixes };
}

function main() {
  console.log("========================================");
  console.log("🧩 FIX: Unclosed <Note> and <text> (targeted)");
  console.log("========================================");

  let changedFiles = 0;
  let noteFixes = 0;
  let textFixes = 0;

  for (const f of FILES) {
    const r = processOne(f);
    if (r.changed) changedFiles++;
    noteFixes += r.noteFixes;
    textFixes += r.textFixes;
  }

  console.log("----------------------------------------");
  console.log(`Files changed: ${changedFiles}`);
  console.log(`</Note> fixes: ${noteFixes}`);
  console.log(`</text> fixes: ${textFixes}`);
  console.log("========================================");
}

main();