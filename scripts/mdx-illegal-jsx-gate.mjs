// scripts/mdx-illegal-jsx-gate.mjs
// MDX INTEGRITY GATE (VALIDATION-ONLY)
// - NEVER mutates files
// - Fails fast with actionable diagnostics
// Abraham of London — hardened mode.

import fs from "fs";
import path from "path";
import glob from "fast-glob";

const CONTENT_DIR = "content";

/**
 * Frontmatter must:
 * - start at byte 0 (no BOM, no text, no headings, no stray '---' later)
 * - be exactly one YAML block
 * - be followed by body (or empty)
 */
const FRONTMATTER_RE = /^---\s*\n[\s\S]*?\n---\s*(\n|$)/;

/**
 * Returns { ok: boolean, errors: string[] }
 */
function validateMdx(filePath, text) {
  const errors = [];

  // 1) Disallow UTF-8 BOM (invisible, breaks "start at 0" checks)
  if (text.charCodeAt(0) === 0xfeff) {
    errors.push("File begins with UTF-8 BOM. Remove BOM so frontmatter starts at byte 0.");
  }

  // 2) Must have frontmatter at top (for your Contentlayer schema)
  if (!FRONTMATTER_RE.test(text)) {
    // Determine if there IS a frontmatter fence later (common corruption)
    const firstFence = text.indexOf("\n---");
    const firstFenceAtTop = text.startsWith("---");
    if (!firstFenceAtTop && text.includes("---")) {
      errors.push("Non-whitespace content found before the first frontmatter fence. Frontmatter must be the first thing in the file.");
    } else {
      errors.push("Missing or malformed frontmatter. Expected YAML frontmatter at top delimited by --- fences.");
    }
  } else {
    // 3) Ensure ONLY one frontmatter block
    const allBlocks = text.match(/^---\s*\n[\s\S]*?\n---\s*(\n|$)/gm) || [];
    if (allBlocks.length > 1) {
      errors.push(`Multiple frontmatter blocks detected (${allBlocks.length}). Keep exactly one at the top.`);
    }

    // 4) Disallow content that looks like frontmatter AFTER the first block
    const first = allBlocks[0];
    const rest = text.slice(first.length);
    if (/^---\s*\n/m.test(rest)) {
      errors.push("Additional '---' frontmatter fence found after the first block. Remove or convert to a divider (e.g. '***').");
    }
  }

  // 5) Detect HTML-escaped markdown that often appears due to copy/paste
  // This won't break YAML, but it often breaks rendering / expectations.
  // You can downgrade this to a warning if desired.
  if (text.includes("&gt;") || text.includes("&lt;") || text.includes("&amp;")) {
    // avoid false positives in code fences (simple heuristic)
    const hasCodeFences = text.includes("```");
    if (!hasCodeFences) {
      errors.push("HTML-escaped entities detected (&gt; / &lt; / &amp;) outside code fences. Convert back to raw markdown ('>') where appropriate.");
    }
  }

  // 6) Detect orphaned closing tags that cause Contentlayer MDX parse errors
  // e.g. </Creed> without <Creed>
  const orphanClosers = [];
  const closerRe = /<\/([A-Za-z][A-Za-z0-9]*)\s*>/g;
  let m;
  while ((m = closerRe.exec(text))) orphanClosers.push(m[1]);
  if (orphanClosers.length) {
    // Not always fatal, but usually indicates broken JSX in MDX
    // We'll keep it as fatal to prevent CI breakage.
    errors.push(`Potential orphan closing tag(s) found: ${[...new Set(orphanClosers)].slice(0, 8).join(", ")}. Ensure every </X> has a matching <X>.`);
  }

  return { ok: errors.length === 0, errors };
}

async function run() {
  const files = await glob([`${CONTENT_DIR}/**/*.mdx`], { dot: false });
  const bad = [];

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const res = validateMdx(file, text);
    if (!res.ok) bad.push({ file, errors: res.errors });
  }

  if (bad.length) {
    console.error(`\n[MDX_GATE] Integrity check failed: ${bad.length} file(s) invalid.\n`);
    for (const item of bad.slice(0, 40)) {
      console.error(`- ${item.file}`);
      for (const e of item.errors) console.error(`  • ${e}`);
      console.error("");
    }
    if (bad.length > 40) {
      console.error(`...and ${bad.length - 40} more.\n`);
    }
    process.exit(1);
  }

  console.log(`[MDX_GATE] OK. ${files.length} file(s) validated. 0 invalid.`);
}

run().catch((err) => {
  console.error("[MDX_GATE] Failed:", err);
  process.exit(1);
});