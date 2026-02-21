import fs from "fs";
import path from "path";

type FixResult = {
  file: string;
  changed: boolean;
  notes: string[];
};

const TARGETS = [
  "content/blog/fathering-principles.mdx",
  "content/blog/in-my-fathers-house.mdx",
  "content/blog/principles-for-my-son.mdx",
  "content/downloads/ultimate-purpose-of-man-editorial.mdx",
];

function read(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}
function write(filePath: string, content: string) {
  fs.writeFileSync(filePath, content, "utf8");
}
function exists(filePath: string) {
  return fs.existsSync(filePath);
}
function normalizeNewlines(s: string) {
  return s.replace(/\r\n/g, "\n");
}

function countMatches(haystack: string, re: RegExp): number {
  const m = haystack.match(re);
  return m ? m.length : 0;
}

/**
 * Fix #1: "Adjacent JSX elements must be wrapped"
 * Heuristic: inside any `return (` ... `);` block, if JSX siblings exist at the root
 * (multiple <Tag> at same indentation), wrap the whole return payload in <>...</>.
 *
 * Conservative:
 * - Only touches blocks that look like `return (` and contain multiple top-level JSX tags.
 * - Skips if a fragment wrapper already exists right after `return (`.
 */
function fixAdjacentJsxInReturn(src: string): { out: string; changed: boolean; note?: string } {
  let changed = false;
  let out = src;

  // Find `return (` blocks: naive but robust enough for your MDX component snippets.
  // We wrap only if:
  // - return ( ... );
  // - payload contains at least two JSX element starts at same indentation level
  // - not already wrapped in fragment at top
  out = out.replace(
    /return\s*\(\s*\n([\s\S]*?)\n\s*\)\s*;/g,
    (full, body: string) => {
      const bodyNorm = body;

      // Already fragment wrapped?
      if (/^\s*<>/m.test(bodyNorm.trimStart())) return full;

      // Must have at least 2 JSX starts at the *same* indent.
      // We approximate by counting lines that start with optional spaces then `<Capital` or `<[A-Za-z]`
      // and are not closing tags.
      const jsxStartLines = bodyNorm
        .split("\n")
        .filter((l) => /^\s*<([A-Za-z][A-Za-z0-9]*)\b/.test(l) && !/^\s*<\/\w+/.test(l));

      if (jsxStartLines.length < 2) return full;

      changed = true;
      const wrapped =
        "return (\n" +
        "  <>\n" +
        bodyNorm
          .split("\n")
          .map((l) => (l.trim().length ? "  " + l : l))
          .join("\n") +
        "\n  </>\n" +
        ");";

      return wrapped;
    }
  );

  return { out, changed, note: changed ? "Wrapped multi-root JSX inside return(...) with fragment <>...</>." : undefined };
}

/**
 * Fix #2: "JS comments in JSX tags are not supported in MDX"
 * You have a tag ending like:  ... " //>
 * or ... " // />
 *
 * We remove the `//` comment segment *only when it appears inside a tag*.
 * Conservative:
 * - Only on the specific file that threw this error, but safe on any MDX.
 */
function fixJsCommentsInJsxTags(src: string): { out: string; changed: boolean; note?: string } {
  let changed = false;
  let out = src;

  // Remove `//` comments that occur before the tag close.
  // Example: <Note title="x"//>
  // Example: <Component prop="x" //>
  const before = out;

  out = out.replace(/(<[^>\n]*?)\s*\/\/\s*(\/?>)/g, (_m, left, right) => {
    changed = true;
    return `${left}${right}`;
  });

  // Also handle the nastier variant: `"//>` attached directly after a quote
  out = out.replace(/"\/\/\s*(\/?>)/g, (_m, right) => {
    changed = true;
    return `"${right}`;
  });

  return { out, changed, note: changed ? "Removed unsupported `//` fragments inside JSX tag boundaries." : undefined };
}

/**
 * Fix #3: "Unexpected closing </text>, expected </svg>"
 * That means within an <svg>...</svg> block, </text> count > <text ...> count.
 * Solution: remove surplus </text> from the END of that svg block (right-to-left).
 *
 * Conservative:
 * - Only operates inside <svg>...</svg> blocks.
 * - Only removes *extra* </text> closings.
 */
function fixSvgTextOverClose(src: string): { out: string; changed: boolean; note?: string } {
  let changed = false;
  let out = src;

  out = out.replace(/<svg\b[\s\S]*?<\/svg>/gi, (svgBlock) => {
    const openCount = countMatches(svgBlock, /<text\b[^>]*>/gi);
    const closeCount = countMatches(svgBlock, /<\/text>/gi);

    if (closeCount <= openCount) return svgBlock;

    const extra = closeCount - openCount;
    changed = true;

    // Remove `extra` occurrences of </text> from the end of the svg block.
    let fixed = svgBlock;
    for (let i = 0; i < extra; i++) {
      // remove the last occurrence
      const idx = fixed.toLowerCase().lastIndexOf("</text>");
      if (idx === -1) break;
      fixed = fixed.slice(0, idx) + fixed.slice(idx + "</text>".length);
    }
    return fixed;
  });

  return { out, changed, note: changed ? "Removed surplus </text> closings inside <svg> blocks (right-to-left)." : undefined };
}

function processFile(rel: string): FixResult {
  const abs = path.resolve(process.cwd(), rel);
  const notes: string[] = [];

  if (!exists(abs)) {
    return { file: rel, changed: false, notes: ["Missing file (skipped)."] };
  }

  const before = normalizeNewlines(read(abs));
  let cur = before;
  let changed = false;

  // Apply in order (safe + deterministic)
  const a = fixAdjacentJsxInReturn(cur);
  cur = a.out;
  if (a.changed) {
    changed = true;
    if (a.note) notes.push(a.note);
  }

  const b = fixJsCommentsInJsxTags(cur);
  cur = b.out;
  if (b.changed) {
    changed = true;
    if (b.note) notes.push(b.note);
  }

  const c = fixSvgTextOverClose(cur);
  cur = c.out;
  if (c.changed) {
    changed = true;
    if (c.note) notes.push(c.note);
  }

  if (changed && cur !== before) {
    write(abs, cur);
  }

  return { file: rel, changed: changed && cur !== before, notes: notes.length ? notes : ["No changes needed."] };
}

function main() {
  console.log("========================================");
  console.log("🧰 FIX: MDX ACORN / JSX STRUCTURE ERRORS");
  console.log("========================================");
  console.log(`Targets: ${TARGETS.length}`);
  console.log("");

  const results = TARGETS.map(processFile);
  const changed = results.filter((r) => r.changed);

  for (const r of results) {
    const icon = r.changed ? "✅" : "⏭️ ";
    console.log(`${icon} ${r.file}`);
    for (const n of r.notes) console.log(`   • ${n}`);
  }

  console.log("----------------------------------------");
  console.log(`Files processed: ${results.length}`);
  console.log(`Files changed:   ${changed.length}`);
  console.log("========================================");
}

main();