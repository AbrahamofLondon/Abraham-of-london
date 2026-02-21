// scripts/mdx-illegal-jsx-gate.mjs
import fs from "fs";
import glob from "fast-glob";

const CONTENT_DIR = "content";

// -----------------------------
// Helpers
// -----------------------------
function stripStrippedMarkers(s) {
  return s.replace(/\{\/\*\s*stripped: duplicate frontmatter block\s*\*\/\}/g, "");
}

function getFrontmatterBlocks(s) {
  // Strict: frontmatter blocks starting at line boundary
  const re = /^---\s*\n[\s\S]*?\n---\s*\n?/gm;
  return s.match(re) || [];
}

function hasContentBeforeFirstFrontmatter(s) {
  const idx = s.indexOf("---");
  if (idx === -1) return false;
  const before = s.slice(0, idx);
  return before.trim().length > 0;
}

function moveLeadingContentBelowFrontmatter(s) {
  const blocks = getFrontmatterBlocks(s);
  if (!blocks.length) return s;

  const first = blocks[0];
  const firstStart = s.indexOf(first);
  if (firstStart !== 0) {
    // There is leading content before the first FM block
    const leading = s.slice(0, firstStart).trimEnd();
    const rest = s.slice(firstStart + first.length);

    // Put leading content after frontmatter with spacing
    return `${first}\n${leading}\n\n${rest.trimStart()}`;
  }
  return s;
}

function keepOnlyFirstFrontmatter(s) {
  const blocks = getFrontmatterBlocks(s);
  if (blocks.length <= 1) return s;

  const first = blocks[0];
  // Remove all frontmatter blocks
  const body = s.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/gm, "").trimStart();
  return `${first}\n${body}`;
}

function looksLikeYamlKeyLine(line) {
  // e.g. "title: X" or "tags:" etc.
  return /^[A-Za-z0-9_-]+\s*:\s*.*$/.test(line);
}

function detectFatalPatterns(s) {
  const issues = [];

  const blocks = getFrontmatterBlocks(s);
  if (blocks.length >= 3) {
    issues.push(`Found ${blocks.length} frontmatter blocks (>=3). This is almost certainly corruption.`);
  }

  // If file has frontmatter but also looks like YAML keys *before* it, that's usually broken paste.
  const idx = s.indexOf("---");
  if (idx !== -1) {
    const before = s.slice(0, idx).split("\n").map((l) => l.trim()).filter(Boolean);
    const yamlish = before.filter((l) => looksLikeYamlKeyLine(l));
    if (yamlish.length) {
      issues.push(`YAML-like keys found before first frontmatter: ${yamlish.slice(0, 3).join(" | ")}${yamlish.length > 3 ? " ..." : ""}`);
    }
  }

  // If there's no frontmatter at all, we don't fail here (some MDX might be allowed),
  // but you can tighten this if your system requires FM always.
  return issues;
}

// -----------------------------
// Run
// -----------------------------
async function run() {
  const files = await glob([`${CONTENT_DIR}/**/*.mdx`], { dot: false });
  let patched = 0;
  const fatal = [];

  for (const file of files) {
    const original = fs.readFileSync(file, "utf8");
    let updated = original;

    updated = stripStrippedMarkers(updated);

    // If there is content before frontmatter, reposition it (safer than leaving it to break parsers)
    if (hasContentBeforeFirstFrontmatter(updated)) {
      updated = moveLeadingContentBelowFrontmatter(updated);
    }

    // If duplicate frontmatter blocks exist, keep only the first
    const fmBlocks = getFrontmatterBlocks(updated);
    if (fmBlocks.length > 1) {
      updated = keepOnlyFirstFrontmatter(updated);
    }

    // Re-check fatal patterns after clean
    const issues = detectFatalPatterns(updated);
    if (issues.length) {
      fatal.push({ file, issues });
    }

    if (updated !== original) {
      fs.writeFileSync(file, updated, "utf8");
      console.log(`[MDX_GATE] Cleaned: ${file}`);
      patched++;
    }
  }

  console.log(
    `[MDX_GATE] Completed. Files scanned: ${files.length}. Files patched: ${patched}. Fatal: ${fatal.length}.`
  );

  if (fatal.length) {
    console.error("\n[MDX_GATE] Fatal MDX integrity issues detected:");
    for (const f of fatal.slice(0, 20)) {
      console.error(`\n- ${f.file}`);
      for (const issue of f.issues) console.error(`  • ${issue}`);
    }
    if (fatal.length > 20) {
      console.error(`\n...and ${fatal.length - 20} more.`);
    }
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("[MDX_GATE] Failed:", err);
  process.exit(1);
});