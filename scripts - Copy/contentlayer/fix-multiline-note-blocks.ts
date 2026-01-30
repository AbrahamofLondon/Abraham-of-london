import fs from "fs";
import path from "path";

type FixLog = {
  file: string;
  changed: boolean;
  noteFixes: number;
  textFixes: number;
  notes: string[];
};

const ROOT = process.cwd();

const TARGET_FILES = [
  "content/blog/fathering-principles.mdx",
  "content/blog/in-my-fathers-house.mdx",
  "content/blog/principles-for-my-son.mdx",
  "content/downloads/ultimate-purpose-of-man-editorial.mdx",
];

/**
 * Fix 1: Close <Note ...> tags that were written as:
 *   <Note ...>Some text...
 * but missing </Note>
 *
 * We fix in two patterns:
 * A) Single-line Note: <Note ...>content
 *    -> <Note ...>content</Note>
 * B) Multi-line Note:
 *    <Note ...>
 *    line1
 *    line2
 *    (blank line ends the paragraph/block)
 *    -> insert </Note> before the blank line (or before EOF)
 */
function fixUnclosedNoteTags(input: string): { out: string; fixes: number; notes: string[] } {
  const lines = input.split(/\r?\n/);
  let fixes = 0;
  const notes: string[] = [];

  // Quick helper checks
  const isNoteOpenLine = (line: string) =>
    /<Note\b[^>]*>/.test(line) && !/<Note\b[^>]*\/>/.test(line);

  const hasNoteClose = (line: string) => /<\/Note>/.test(line);

  // Pass line-by-line with simple state
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!isNoteOpenLine(line)) continue;

    // If this same line already contains </Note>, it's fine
    if (hasNoteClose(line)) continue;

    // If there IS a </Note> later soon, also fine (multi-line note already closed)
    // but your errors indicate it never closes inside the paragraph.
    let foundCloseAhead = false;
    for (let j = i + 1; j < Math.min(lines.length, i + 40); j++) {
      if (hasNoteClose(lines[j])) {
        foundCloseAhead = true;
        break;
      }
      // If we hit another <Note> before a close, it's almost certainly broken nesting
      if (isNoteOpenLine(lines[j])) break;
    }
    if (foundCloseAhead) continue;

    // CASE A: single-line: there is content after '>'
    // Example: <Note ...>60s room reset ...
    const idx = line.indexOf(">");
    const after = idx >= 0 ? line.slice(idx + 1) : "";
    const hasInlineContent = idx >= 0 && after.trim().length > 0;

    if (hasInlineContent) {
      lines[i] = `${line}</Note>`;
      fixes += 1;
      notes.push(`Closed single-line <Note> on line ${i + 1}`);
      continue;
    }

    // CASE B: multi-line: open tag line ends at '>' and content follows on later lines.
    // We insert </Note> before the next blank line, or before EOF.
    let insertAt = -1;
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j];

      // if we find a close, we'd have returned earlier, but be safe:
      if (hasNoteClose(l)) {
        insertAt = -1;
        break;
      }

      // stop at blank line (paragraph break)
      if (l.trim() === "") {
        insertAt = j; // insert before this blank line
        break;
      }

      // stop before another tag block that likely ends the paragraph
      // (This is conservative. You can extend if needed.)
      if (/^<\/(section|div|p|article|svg)>/.test(l.trim())) {
        insertAt = j;
        break;
      }
    }

    if (insertAt === -1) insertAt = lines.length; // EOF

    lines.splice(insertAt, 0, "</Note>");
    fixes += 1;
    notes.push(`Inserted </Note> before line ${insertAt + 1} (opened on line ${i + 1})`);

    // If we inserted before i, adjust i; but insertion is after i, so safe.
  }

  return { out: lines.join("\n"), fixes, notes };
}

/**
 * Fix 2: Close <text ...> in inline SVG.
 * Common broken pattern:
 *   <text
 *     ...
 *   >
 *   Some text
 *   (missing </text>)
 *
 * We detect any "<text" open with no matching "</text>" later and inject it
 * just before "</svg>" if present, else at EOF.
 */
function fixUnclosedSvgText(input: string): { out: string; fixes: number; notes: string[] } {
  const notes: string[] = [];

  // Fast exit
  if (!/<text\b/.test(input)) return { out: input, fixes: 0, notes };

  // If number of open tags > close tags, we fix conservatively.
  const openCount = (input.match(/<text\b/g) || []).length;
  const closeCount = (input.match(/<\/text>/g) || []).length;
  if (openCount <= closeCount) return { out: input, fixes: 0, notes };

  // If there are multiple <text> blocks, try to fix each missing close by inserting before </svg>
  let out = input;
  let fixes = 0;

  while (true) {
    const opens = (out.match(/<text\b/g) || []).length;
    const closes = (out.match(/<\/text>/g) || []).length;
    if (opens <= closes) break;

    const svgCloseIndex = out.lastIndexOf("</svg>");
    if (svgCloseIndex !== -1) {
      out = out.slice(0, svgCloseIndex) + "\n</text>\n" + out.slice(svgCloseIndex);
      fixes += 1;
      notes.push(`Inserted </text> before </svg> (missing close detected)`);
    } else {
      out = out + "\n</text>\n";
      fixes += 1;
      notes.push(`Appended </text> at EOF (missing close detected)`);
    }

    // Avoid infinite loops in the unlikely case of pathological content
    if (fixes > 10) break;
  }

  return { out, fixes, notes };
}

function processFile(relPath: string): FixLog {
  const abs = path.join(ROOT, relPath);

  if (!fs.existsSync(abs)) {
    return { file: relPath, changed: false, noteFixes: 0, textFixes: 0, notes: [`Missing file`] };
  }

  const raw = fs.readFileSync(abs, "utf8");

  const noteRes = fixUnclosedNoteTags(raw);
  const textRes = fixUnclosedSvgText(noteRes.out);

  const changed = textRes.out !== raw;

  if (changed) fs.writeFileSync(abs, textRes.out, "utf8");

  return {
    file: relPath,
    changed,
    noteFixes: noteRes.fixes,
    textFixes: textRes.fixes,
    notes: [...noteRes.notes, ...textRes.notes],
  };
}

function main() {
  console.log("========================================");
  console.log("🧩 MDX TAG REPAIR — <Note> + <text> CLOSERS");
  console.log("========================================");

  const logs = TARGET_FILES.map(processFile);

  let changedFiles = 0;
  let noteFixes = 0;
  let textFixes = 0;

  for (const l of logs) {
    if (l.changed) changedFiles += 1;
    noteFixes += l.noteFixes;
    textFixes += l.textFixes;

    console.log(`${l.changed ? "✅" : "⏭️ "} ${l.file}`);
    if (l.notes.length) {
      for (const n of l.notes) console.log(`   • ${n}`);
    } else {
      console.log(`   • No changes needed`);
    }
  }

  console.log("----------------------------------------");
  console.log(`Files processed: ${logs.length}`);
  console.log(`Files changed:   ${changedFiles}`);
  console.log(`</Note> fixes:   ${noteFixes}`);
  console.log(`</text> fixes:   ${textFixes}`);
  console.log("========================================");
}

main();