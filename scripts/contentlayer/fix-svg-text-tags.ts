import fs from "fs";
import path from "path";

const TARGET_FILE = "content/downloads/ultimate-purpose-of-man-editorial.mdx";

function read(p: string) {
  return fs.readFileSync(p, "utf8");
}
function write(p: string, s: string) {
  fs.writeFileSync(p, s, "utf8");
}
function normalizeNewlines(s: string) {
  return s.replace(/\r\n/g, "\n");
}

function countRegex(haystack: string, re: RegExp): number {
  const m = haystack.match(re);
  return m ? m.length : 0;
}

/**
 * Fix unclosed <text> tags inside <svg> blocks by balancing open/close counts.
 * Conservative:
 * - Only operates within <svg>...</svg>
 * - Only adds missing </text> BEFORE </svg>
 * - Does not remove anything
 */
function fixSvgTextBalance(content: string): { fixed: string; inserted: number } {
  let insertedTotal = 0;
  let s = normalizeNewlines(content);

  // Replace each SVG block with a potentially fixed version
  s = s.replace(/<svg\b[\s\S]*?<\/svg>/gi, (svgBlock) => {
    // Count <text ...> openings (excluding </text>)
    const openCount = countRegex(svgBlock, /<text\b(?![^>]*\/>)[^>]*>/gi);
    const closeCount = countRegex(svgBlock, /<\/text>/gi);

    if (openCount <= closeCount) return svgBlock;

    const missing = openCount - closeCount;
    insertedTotal += missing;

    const insertion = "\n" + Array.from({ length: missing }).map(() => "</text>").join("\n") + "\n";

    // Insert missing closings immediately before </svg> (last occurrence)
    return svgBlock.replace(/<\/svg>\s*$/i, `${insertion}</svg>`);
  });

  return { fixed: s, inserted: insertedTotal };
}

function main() {
  console.log("========================================");
  console.log("🧩 FIX: Balance <text> tags inside <svg> (no loops)");
  console.log("========================================");

  const abs = path.resolve(process.cwd(), TARGET_FILE);
  if (!fs.existsSync(abs)) {
    console.log(`❌ Missing: ${TARGET_FILE}`);
    process.exit(1);
  }

  const before = read(abs);
  const { fixed, inserted } = fixSvgTextBalance(before);

  if (fixed !== before) {
    write(abs, fixed);
    console.log(`✅ ${TARGET_FILE}  (inserted </text>: ${inserted})`);
  } else {
    console.log(`⏭️  ${TARGET_FILE}  (no changes)`);
  }

  console.log("========================================");
}

main();