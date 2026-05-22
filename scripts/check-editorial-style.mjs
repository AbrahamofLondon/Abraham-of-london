import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const strict = process.argv.includes("--strict");
const termsPath = path.join(rootDir, "config", "editorial-style-terms.json");
const scanRoots = [
  path.join(rootDir, "content", "editorial-series"),
  path.join(rootDir, "content", "editorials"),
  path.join(rootDir, "content", "blog"),
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripInlineCodeAndUrls(line) {
  return line
    .replace(/`[^`]*`/g, " ")
    .replace(/\[[^\]]+\]\((?:https?:\/\/|mailto:)[^)]+\)/gi, " ")
    .replace(/(?:https?:\/\/|mailto:)\S+/gi, " ")
    .replace(/<\/?[A-Za-z][^>]*>/g, " ");
}

function frontmatterValue(line) {
  const match = line.match(/^\s*[A-Za-z][A-Za-z0-9_-]*\s*:\s*(.*)$/);
  if (!match) return "";

  const value = match[1]?.trim() ?? "";
  if (!value || value === "|" || value === ">") return "";

  return value.replace(/^["']|["']$/g, "");
}

function lineForScan(line, state) {
  const trimmed = line.trim();

  if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
    state.inCodeFence = !state.inCodeFence;
    return "";
  }

  if (state.inCodeFence) return "";

  if (trimmed === "---" && state.frontmatterBoundaryCount < 2) {
    state.frontmatterBoundaryCount += 1;
    state.inFrontmatter = state.frontmatterBoundaryCount === 1;
    return "";
  }

  if (state.inFrontmatter) {
    // Skip technical frontmatter keys whose values are CSS/system constants, not prose
    const technicalKeys = /^\s*(?:coverPosition|coverFit|coverAspect|coverImage|ogImage|ogType|ogTitle|ogDescription|twitterCard|twitterImage|canonicalUrl|slug|href|type|docKind|layout|accessLevel|accessTier|access|lockMessage|robots|status|density|section|version|institutionalId)\s*:/i;
    if (technicalKeys.test(line)) return "";
    return stripInlineCodeAndUrls(frontmatterValue(line));
  }
  return stripInlineCodeAndUrls(line);
}

async function collectMdxFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map(async (entry) => {
        const target = path.join(dir, entry.name);
        if (entry.isDirectory()) return collectMdxFiles(target);
        if (entry.isFile() && entry.name.endsWith(".mdx")) return [target];
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

function matchingFindings(filePath, content, terms) {
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
      const match = expression.exec(scanLine);
      if (!match) continue;

      findings.push({
        filePath,
        lineNumber: index + 1,
        term: match[0],
        preferred: term.preferred,
        review: term.review,
      });
    }
  });

  return findings;
}

function displayPath(filePath) {
  return path.relative(rootDir, filePath).replaceAll(path.sep, "/");
}

async function main() {
  const dictionary = JSON.parse(await fs.readFile(termsPath, "utf8"));
  const terms = dictionary.bannedOrFlaggedTerms ?? [];
  const files = (await Promise.all(scanRoots.map(collectMdxFiles))).flat().sort();
  const findings = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, "utf8");
    findings.push(...matchingFindings(filePath, content, terms));
  }

  console.log(
    `[EDITORIAL_STYLE] Scanned ${files.length} MDX file${files.length === 1 ? "" : "s"}.`,
  );

  if (findings.length === 0) {
    console.log("[EDITORIAL_STYLE] No flagged UK/US spelling risks found.");
    return;
  }

  console.log(
    `[EDITORIAL_STYLE] ${findings.length} flagged spelling risk${findings.length === 1 ? "" : "s"}:`,
  );

  for (const finding of findings) {
    const review = finding.review ? ` ${finding.review}` : "";
    console.log(
      `- ${displayPath(finding.filePath)}:${finding.lineNumber} ${finding.term} -> ${finding.preferred}.${review}`,
    );
  }

  if (strict) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[EDITORIAL_STYLE] Failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
