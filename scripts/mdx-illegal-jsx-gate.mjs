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

/**
 * SAFE FRONTMATTER DETECTION - ONLY at the very top of the file
 * This prevents matching markdown horizontal rules (---) in the body
 */
function getTopFrontmatter(s) {
  // Only match if the file STARTS with frontmatter
  if (!s.startsWith("---\n") && !s.startsWith("---\r\n")) return null;
  
  // Capture ONLY top-of-file frontmatter blocks
  const fmRegex = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
  const match = s.match(fmRegex);
  return match ? match[0] : null;
}

function hasContentBeforeFirstFrontmatter(s) {
  // This is now a safeguard, but with our safe detection, it's rarely needed
  const idx = s.indexOf("---");
  if (idx === -1) return false;
  const before = s.slice(0, idx);
  return before.trim().length > 0;
}

function moveLeadingContentBelowFrontmatter(s) {
  // Only use this if absolutely necessary - better to fail than mangle
  const firstFm = getTopFrontmatter(s);
  if (!firstFm) return s;

  const firstStart = s.indexOf(firstFm);
  if (firstStart !== 0) {
    const leading = s.slice(0, firstStart).trimEnd();
    const rest = s.slice(firstStart + firstFm.length);
    return `${firstFm}\n${leading}\n\n${rest.trimStart()}`;
  }
  return s;
}

/**
 * SAFE duplicate frontmatter removal - ONLY removes if duplicate is at the top
 */
function removeDuplicateFrontmatter(s) {
  const firstFm = getTopFrontmatter(s);
  if (!firstFm) return s;

  const afterFirst = s.slice(firstFm.length);
  const secondFm = getTopFrontmatter(afterFirst);
  
  if (secondFm) {
    // Remove the duplicate and any content between (though shouldn't exist)
    const rest = afterFirst.slice(secondFm.length);
    return firstFm + rest;
  }
  
  return s;
}

function looksLikeYamlKeyLine(line) {
  return /^[A-Za-z0-9_-]+\s*:\s*.*$/.test(line);
}

function detectFatalPatterns(s) {
  const issues = [];

  // Check for content that looks like YAML before any frontmatter
  const idx = s.indexOf("---");
  if (idx !== -1) {
    const before = s.slice(0, idx).split("\n").map(l => l.trim()).filter(Boolean);
    const yamlish = before.filter(l => looksLikeYamlKeyLine(l));
    if (yamlish.length) {
      issues.push(`YAML-like keys found before first frontmatter: ${yamlish.slice(0, 3).join(" | ")}${yamlish.length > 3 ? " ..." : ""}`);
    }
  }

  // Check for multiple frontmatter blocks (now only relevant if they're truly duplicated)
  const firstFm = getTopFrontmatter(s);
  if (firstFm) {
    const afterFirst = s.slice(firstFm.length);
    if (getTopFrontmatter(afterFirst)) {
      issues.push("Duplicate frontmatter blocks detected at top of file");
    }
  }

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

    // Remove any leftover marker comments (harmless)
    updated = stripStrippedMarkers(updated);

    // SAFELY handle duplicate frontmatter at the top only
    updated = removeDuplicateFrontmatter(updated);

    // Only reposition if there's truly content before frontmatter (rare)
    if (hasContentBeforeFirstFrontmatter(updated) && !getTopFrontmatter(updated)) {
      // This is a red flag - better to flag than auto-fix
      const issues = detectFatalPatterns(updated);
      if (issues.length) {
        fatal.push({ file, issues });
      }
    }

    // Check for fatal patterns after cleaning
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