/**
 * scripts/check-editorial-style.mjs
 *
 * UK editorial house-style checker for Abraham of London.
 *
 * Scans editorial/blog/outbound prose files and flags US spellings
 * that should use UK equivalents in published content.
 *
 * Usage:
 *   node scripts/check-editorial-style.mjs
 *   node scripts/check-editorial-style.mjs --strict
 *   node scripts/check-editorial-style.mjs --roots content/outbound
 *   node scripts/check-editorial-style.mjs --roots content/outbound --strict
 *
 * Flags:
 *   --strict            Exit non-zero if any violations are found.
 *   --roots <dirs...>   Comma-separated list of content root directories to scan
 *                       (relative to project root). Overrides default roots.
 *
 * Default scan roots:
 *   content/editorial-series
 *   content/editorials
 *   content/blog
 *   content/outbound
 *
 * NOT scanned (never):
 *   node_modules, .next, .netlify, public, .contentlayer, scripts, lib, pages,
 *   components, generated files, or code files.
 *
 * Technical exceptions automatically applied:
 *   - Lines inside ``` code fences
 *   - Inline code: `backtick content`
 *   - URLs: https://... and mailto:...
 *   - Markdown links: [text](url)
 *   - HTML tags
 *   - Frontmatter technical keys (slug, coverImage, ogImage, etc.)
 *   - Prose-like frontmatter values (title, description, excerpt, etc.) ARE scanned
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();

// ─── CLI flag parsing ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const strict = args.includes("--strict");

// --roots a,b,c  or  --roots a --roots b
const rootsArg = (() => {
  const idx = args.indexOf("--roots");
  if (idx === -1) return null;
  const val = args[idx + 1];
  if (!val || val.startsWith("--")) return null;
  // Allow comma-separated or multiple --roots flags
  return val.split(",").map((r) => r.trim()).filter(Boolean);
})();

const DEFAULT_SCAN_ROOTS = [
  "content/editorial-series",
  "content/editorials",
  "content/blog",
  "content/outbound",
];

const scanRoots = (rootsArg ?? DEFAULT_SCAN_ROOTS).map((r) =>
  path.isAbsolute(r) ? r : path.join(rootDir, r),
);

const termsPath = path.join(rootDir, "config", "editorial-style-terms.json");

// ─── Prose-scannable frontmatter keys ────────────────────────────────────────

const PROSE_FM_KEYS = new Set([
  "title", "description", "excerpt", "dek", "subtitle", "summary",
  "metadescription", "socialtitle", "socialdescription",
  "outboundtext", "text", "body",
]);

// Technical frontmatter keys whose values must NOT be scanned
const TECHNICAL_FM_KEY_PATTERN =
  /^\s*(?:coverposition|coverfit|coveraspect|coverimage|ogimage|ogtype|ogtitle|ogdescription|twittercard|twitterimage|canonicalurl|slug|href|type|dockind|layout|accesslevel|accesstier|access|lockmessage|robots|density|section|version|institutionalid|platform|channel|contenttype|status|draft|published|date|category|tier|campaign|linkedproduct|claimrisk|productline|imagepath|asseturl|link|schedulefor|scheduledfor|requiresfinalaproval|requiresfinalaproval|approvalstatus|createday|createdat|updatedat|idempotencykey|sourcepath|sourceslug|sourcetype|threadindex|xcharcount|id|sequence)\s*:/i;

// ─── Text cleaning helpers ────────────────────────────────────────────────────

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strip inline code, URLs, markdown links, and HTML tags from a line
 * so that technical identifiers are not flagged.
 */
function stripTechnicalContent(line) {
  return line
    // Inline code — ` content `
    .replace(/`[^`]*`/g, " ")
    // Markdown link text + URL
    .replace(/\[[^\]]+\]\((?:https?:\/\/|mailto:)[^)]+\)/gi, " ")
    // Bare URLs
    .replace(/(?:https?:\/\/|mailto:)\S+/gi, " ")
    // HTML/JSX tags
    .replace(/<\/?[A-Za-z][^>]*>/g, " ");
}

/**
 * Extract the prose value from a frontmatter line.
 * Returns empty string for technical keys or non-key lines.
 */
function frontmatterProseValue(line) {
  const match = line.match(/^\s*([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
  if (!match) return "";

  const key = (match[1] ?? "").toLowerCase();
  const value = (match[2] ?? "").trim();

  if (!value || value === "|" || value === ">") return "";
  // Technical key — skip
  if (TECHNICAL_FM_KEY_PATTERN.test(line)) return "";
  // Only scan prose-like keys
  if (!PROSE_FM_KEYS.has(key)) return "";

  return value.replace(/^["']|["']$/g, "");
}

// ─── State-machine line classifier ───────────────────────────────────────────

/**
 * Return the text that should be checked for a given line, or "" to skip.
 * Mutates `state` to track position within the document.
 */
function lineForScan(line, state) {
  const trimmed = line.trim();

  // Code fence toggle
  if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
    state.inCodeFence = !state.inCodeFence;
    return "";
  }
  if (state.inCodeFence) return "";

  // Frontmatter boundary (first two occurrences of ---)
  if (trimmed === "---" && state.frontmatterBoundaryCount < 2) {
    state.frontmatterBoundaryCount += 1;
    state.inFrontmatter = state.frontmatterBoundaryCount === 1;
    return "";
  }

  if (state.inFrontmatter) {
    return stripTechnicalContent(frontmatterProseValue(line));
  }

  // Ordinary prose line
  return stripTechnicalContent(line);
}

// ─── File collection ──────────────────────────────────────────────────────────

async function collectProsFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map(async (entry) => {
        const target = path.join(dir, entry.name);
        if (entry.isDirectory()) return collectProsFiles(target);
        if (!entry.isFile()) return [];
        const n = entry.name;
        // Scan .mdx, .md, and .json (for JSON-based outbound drafts)
        if (n.endsWith(".mdx") || n.endsWith(".md") || n.endsWith(".json")) {
          // Skip backup files
          if (n.includes(".backup-")) return [];
          return [target];
        }
        return [];
      }),
    );
    return nested.flat();
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

// ─── JSON file scanning ───────────────────────────────────────────────────────

/**
 * For JSON outbound files, extract string values that look like prose
 * (text, title, excerpt, description) and scan only those.
 */
function scanJsonContent(filePath, content, terms) {
  const findings = [];
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return findings; // skip unparseable JSON
  }

  const PROSE_KEYS = new Set(["text", "title", "excerpt", "description", "subtitle", "body"]);

  function scanValue(value, keyHint, lineHint) {
    if (typeof value !== "string") return;
    const stripped = stripTechnicalContent(value);
    for (const term of terms) {
      const expression = new RegExp(`\\b${escapeRegExp(term.term)}\\b`, "giu");
      const match = expression.exec(stripped);
      if (!match) continue;
      findings.push({
        filePath,
        lineNumber: lineHint,
        term: match[0],
        preferred: term.preferred,
        review: term.review,
      });
    }
  }

  function traverseObject(obj, depth = 0) {
    if (depth > 6) return;
    if (Array.isArray(obj)) {
      obj.forEach((item) => traverseObject(item, depth + 1));
    } else if (obj && typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        if (PROSE_KEYS.has(key.toLowerCase())) {
          scanValue(value, key, 0);
        } else {
          traverseObject(value, depth + 1);
        }
      }
    }
  }

  traverseObject(parsed);
  return findings;
}

// ─── MDX/MD file scanning ─────────────────────────────────────────────────────

function matchingFindings(filePath, content, terms) {
  // Route JSON files to the JSON scanner
  if (filePath.endsWith(".json")) {
    return scanJsonContent(filePath, content, terms);
  }

  const findings = [];
  const state = {
    frontmatterBoundaryCount: 0,
    inCodeFence: false,
    inFrontmatter: false,
  };

  content.split(/\r?\n/).forEach((line, index) => {
    const scanLine = lineForScan(line, state);
    if (!scanLine) return;

    for (const term of terms) {
      const expression = new RegExp(`\\b${escapeRegExp(term.term)}\\b`, "giu");
      let match;
      // Reset lastIndex for global re-use
      expression.lastIndex = 0;
      while ((match = expression.exec(scanLine)) !== null) {
        findings.push({
          filePath,
          lineNumber: index + 1,
          term: match[0],
          preferred: term.preferred,
          review: term.review,
        });
        // Avoid infinite loops on zero-width matches
        if (match.index === expression.lastIndex) {
          expression.lastIndex++;
        }
        // Only report first match per term per line to avoid duplicates
        break;
      }
    }
  });

  return findings;
}

// ─── Deduplication ───────────────────────────────────────────────────────────

function deduplicateFindings(findings) {
  const seen = new Set();
  return findings.filter((f) => {
    const key = `${f.filePath}:${f.lineNumber}:${f.term.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Display helpers ─────────────────────────────────────────────────────────

function displayPath(filePath) {
  return path.relative(rootDir, filePath).replaceAll(path.sep, "/");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dictionary = JSON.parse(await fs.readFile(termsPath, "utf8"));
  const terms = dictionary.bannedOrFlaggedTerms ?? [];
  const files = (await Promise.all(scanRoots.map(collectProsFiles))).flat().sort();
  const rawFindings = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, "utf8");
    rawFindings.push(...matchingFindings(filePath, content, terms));
  }

  const findings = deduplicateFindings(rawFindings);

  console.log(
    `[EDITORIAL_STYLE] Scanned ${files.length} file${files.length === 1 ? "" : "s"} across ${scanRoots.length} root${scanRoots.length === 1 ? "" : "s"}.`,
  );

  if (findings.length === 0) {
    console.log("[EDITORIAL_STYLE] No flagged UK/US spelling risks found. ✓");
    return;
  }

  console.log(
    `[EDITORIAL_STYLE] ${findings.length} flagged spelling risk${findings.length === 1 ? "" : "s"}:`,
  );

  for (const finding of findings) {
    const review = finding.review ? ` ${finding.review}` : "";
    console.log(
      `- ${displayPath(finding.filePath)}:${finding.lineNumber} "${finding.term}" → "${finding.preferred}".${review}`,
    );
  }

  if (strict) {
    console.error(
      `\n[EDITORIAL_STYLE] Strict mode: ${findings.length} violation${findings.length === 1 ? "" : "s"} found. Fix before publishing.`,
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[EDITORIAL_STYLE] Failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
