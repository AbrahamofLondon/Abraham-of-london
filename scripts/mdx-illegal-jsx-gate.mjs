// scripts/mdx-illegal-jsx-gate.mjs
import fs from "fs";
import glob from "fast-glob";

const CONTENT_DIR = "content";

/**
 * STRICT FRONTMATTER:
 * - Only valid if it begins at the very start of the file.
 * - Frontmatter ends at the next standalone --- line.
 */
function parseTopFrontmatter(src) {
  // Normalize BOM
  const s = src.replace(/^\uFEFF/, "");

  // Must start with a FM fence line
  if (!s.startsWith("---\n") && !s.startsWith("---\r\n")) {
    return { hasFrontmatter: false, fm: "", body: s };
  }

  // Find closing fence line on its own line
  // We search AFTER the opening fence.
  const reClose = /\r?\n---\s*(?:\r?\n|$)/g;
  reClose.lastIndex = 3; // after initial '---'
  const m = reClose.exec(s);
  if (!m) {
    // Frontmatter started but never closed
    return { hasFrontmatter: true, invalid: true, fm: "", body: s };
  }

  const fmEndIndex = reClose.lastIndex; // points just after closing fence line
  const fm = s.slice(0, fmEndIndex);
  const body = s.slice(fmEndIndex);
  return { hasFrontmatter: true, invalid: false, fm, body };
}

/**
 * Detect an IMMEDIATE duplicate frontmatter block at top,
 * i.e. FM + optional whitespace + FM again.
 * We remove only the second one.
 */
function stripImmediateDuplicateFrontmatter(src) {
  const p1 = parseTopFrontmatter(src);
  if (!p1.hasFrontmatter) return { changed: false, out: src };
  if (p1.invalid) {
    return { changed: false, out: src, fatal: "Frontmatter starts but is not closed." };
  }

  const between = p1.body.match(/^\s*/)?.[0] ?? "";
  const rest = p1.body.slice(between.length);

  const p2 = parseTopFrontmatter(rest);
  if (!p2.hasFrontmatter) return { changed: false, out: src };

  if (p2.invalid) {
    return { changed: false, out: src, fatal: "Duplicate frontmatter starts but is not closed." };
  }

  // Keep first FM, drop second FM, keep everything else
  const out = p1.fm + "\n" + rest.slice(p2.fm.length).replace(/^\s+/, "");
  return { changed: true, out };
}

/**
 * If there is ANY non-whitespace content before the first FM fence,
 * we do NOT attempt to "move it" (that is corruption). We fail.
 */
function hasNonWhitespaceBeforeFrontmatterFence(src) {
  const idx = src.indexOf("\n---");
  if (idx === -1) return false;

  // Check if there is any non-whitespace before the first fence line
  // by finding the first fence at a line boundary.
  const m = src.match(/(^|\r?\n)---\s*(\r?\n)/);
  if (!m) return false;

  const startIndex = m.index + (m[1] ? m[1].length : 0);
  const before = src.slice(0, startIndex);
  return before.trim().length > 0;
}

function stripLegacyMarkers(src) {
  return src.replace(/\{\/\*\s*stripped: duplicate frontmatter block\s*\*\/\}/g, "");
}

function detectFatalIntegrityIssues(src) {
  const issues = [];

  // Leading content before FM (dangerous in Contentlayer)
  if (hasNonWhitespaceBeforeFrontmatterFence(src)) {
    issues.push("Non-whitespace content found before the first frontmatter fence. Fix the file manually.");
  }

  // FM opened but not closed
  const top = parseTopFrontmatter(src);
  if (top.hasFrontmatter && top.invalid) {
    issues.push("Frontmatter fence opened but not properly closed.");
  }

  // More than 1 FM block that is NOT immediately duplicated (we do not auto-fix that)
  // We scan only for FM-like blocks at line starts, but we refuse to touch body.
  // If you intentionally have '---' in body, that's normal. We do NOT flag it.
  // We only flag if we detect another FM block *near the top* after the first body begins with '---\n' again
  // beyond whitespace and beyond immediate duplicate.
  if (top.hasFrontmatter && !top.invalid) {
    const body = top.body;

    // If the body (after trimming only leading whitespace) starts with '---', that is likely a duplicate FM.
    const trimmed = body.replace(/^\s+/, "");
    if (trimmed.startsWith("---\n") || trimmed.startsWith("---\r\n")) {
      // Our stripImmediateDuplicateFrontmatter handles immediate duplicates only.
      // If it’s still here, it means there is something between them (content),
      // and we refuse to guess intent.
      issues.push("Possible second frontmatter block detected after content. Manual fix required (no auto-rewrite).");
    }
  }

  return issues;
}

async function run() {
  const files = await glob([`${CONTENT_DIR}/**/*.mdx`], { dot: false });

  let patched = 0;
  const fatal = [];

  for (const file of files) {
    const original = fs.readFileSync(file, "utf8");
    let updated = original;

    // 1) Strip legacy markers only (safe)
    updated = stripLegacyMarkers(updated);

    // 2) Remove ONLY immediate duplicate top-frontmatter
    const dup = stripImmediateDuplicateFrontmatter(updated);
    if (dup.fatal) {
      fatal.push({ file, issues: [dup.fatal] });
    } else if (dup.changed) {
      updated = dup.out;
    }

    // 3) Validate integrity (conservative)
    const issues = detectFatalIntegrityIssues(updated);
    if (issues.length) {
      fatal.push({ file, issues });
    }

    if (updated !== original) {
      fs.writeFileSync(file, updated, "utf8");
      console.log(`[MDX_GATE] Cleaned: ${file}`);
      patched++;
    }
  }

  console.log(`[MDX_GATE] Completed. Files scanned: ${files.length}. Files patched: ${patched}. Fatal: ${fatal.length}.`);

  if (fatal.length) {
    console.error("\n[MDX_GATE] Fatal MDX integrity issues detected:");
    for (const f of fatal.slice(0, 25)) {
      console.error(`\n- ${f.file}`);
      for (const issue of f.issues) console.error(`  • ${issue}`);
    }
    if (fatal.length > 25) console.error(`\n...and ${fatal.length - 25} more.`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("[MDX_GATE] Failed:", err);
  process.exit(1);
});