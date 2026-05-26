#!/usr/bin/env node
/**
 * Case-sensitive import guard for Windows-to-Linux parity.
 *
 * Checks:
 *  - @/ aliased imports resolve to an existing file with exact casing
 *  - relative local imports resolve to an existing file with exact casing
 *  - repository files do not differ only by path casing
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { globSync } from "glob";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_GLOBS = [
  "app/**/*.{ts,tsx,js,jsx,mjs,cjs}",
  "components/**/*.{ts,tsx,js,jsx,mjs,cjs}",
  "contexts/**/*.{ts,tsx,js,jsx,mjs,cjs}",
  "emails/**/*.{ts,tsx,js,jsx,mjs,cjs}",
  "hooks/**/*.{ts,tsx,js,jsx,mjs,cjs}",
  "lib/**/*.{ts,tsx,js,jsx,mjs,cjs}",
  "pages/**/*.{ts,tsx,js,jsx,mjs,cjs}",
  "services/**/*.{ts,tsx,js,jsx,mjs,cjs}",
  "types/**/*.{ts,tsx,js,jsx,mjs,cjs}",
  "utils/**/*.{ts,tsx,js,jsx,mjs,cjs}",
];

const IGNORE = [
  "**/node_modules/**",
  "**/.next/**",
  "**/.contentlayer/**",
  "**/.git/**",
  "**/coverage/**",
  "**/*.d.ts",
];

const EXTENSIONS = [
  "",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".scss",
  ".sass",
  ".md",
  ".mdx",
];

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[^"'()]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|require\s*\(\s*["']([^"']+)["']\s*\)/g;

function toPosix(filePath) {
  return filePath.replace(/\\/g, "/");
}

function exactPathStatus(absPath, exactPathCache, dirEntriesCache) {
  const resolved = path.resolve(absPath);
  const cached = exactPathCache.get(resolved);
  if (cached) return cached;

  const parsed = path.parse(resolved);
  let current = parsed.root;
  const segments = path.relative(parsed.root, resolved).split(path.sep).filter(Boolean);

  for (const segment of segments) {
    let entries;
    try {
      entries = dirEntriesCache.get(current);
      if (!entries) {
        entries = fs.readdirSync(current);
        dirEntriesCache.set(current, entries);
      }
    } catch {
      const status = { exact: false, missingAt: path.join(current, segment), caseMatch: null };
      exactPathCache.set(resolved, status);
      return status;
    }

    if (!entries.includes(segment)) {
      const caseMatch = entries.find((entry) => entry.toLowerCase() === segment.toLowerCase()) ?? null;
      const status = { exact: false, missingAt: path.join(current, segment), caseMatch };
      exactPathCache.set(resolved, status);
      return status;
    }

    current = path.join(current, segment);
  }

  const status = { exact: true, missingAt: null, caseMatch: null };
  exactPathCache.set(resolved, status);
  return status;
}

function candidatePaths(basePath) {
  const ext = path.extname(basePath);
  const hasKnownExtension = EXTENSIONS.includes(ext);
  const candidates = [];

  if (ext && hasKnownExtension) {
    candidates.push(basePath);
  } else {
    for (const extension of EXTENSIONS) candidates.push(`${basePath}${extension}`);
    for (const extension of EXTENSIONS.filter(Boolean)) {
      candidates.push(path.join(basePath, `index${extension}`));
    }
  }

  return candidates;
}

function resolveLocalImport(fromFile, specifier, root) {
  if (specifier.startsWith("@/")) {
    return path.join(root, specifier.slice(2));
  }
  if (specifier.startsWith(".")) {
    return path.resolve(path.dirname(path.join(root, fromFile)), specifier);
  }
  return null;
}

function checkImport(fromFile, specifier, root, violations, exactPathCache, dirEntriesCache) {
  const basePath = resolveLocalImport(fromFile, specifier, root);
  if (!basePath) return;

  let sawCaseInsensitiveMatch = false;
  const mismatches = [];

  for (const candidate of candidatePaths(basePath)) {
    const status = exactPathStatus(candidate, exactPathCache, dirEntriesCache);
    if (status.exact && fs.statSync(candidate).isFile()) return;

    if (fs.existsSync(candidate)) {
      sawCaseInsensitiveMatch = true;
      if (status.caseMatch) mismatches.push({ candidate, status });
    }
  }

  const normalizedFrom = toPosix(fromFile);
  if (sawCaseInsensitiveMatch) {
    const detail = mismatches[0];
    const target = detail ? toPosix(path.relative(root, detail.candidate)) : specifier;
    violations.push(`${normalizedFrom}: "${specifier}" casing does not match ${target}`);
  } else {
    violations.push(`${normalizedFrom}: "${specifier}" does not resolve to a local file`);
  }
}

export function collectCaseSensitiveImportViolations(root = ROOT) {
  const sourceFiles = globSync(SOURCE_GLOBS, { cwd: root, ignore: IGNORE, nodir: true });
  const allFiles = globSync("**/*", { cwd: root, ignore: IGNORE, nodir: true });
  const violations = [];
  const exactPathCache = new Map();
  const dirEntriesCache = new Map();

  const lowerPathMap = new Map();
  for (const file of allFiles) {
    const key = file.toLowerCase();
    const existing = lowerPathMap.get(key) ?? [];
    existing.push(file);
    lowerPathMap.set(key, existing);
  }

  for (const [key, files] of lowerPathMap.entries()) {
    const unique = [...new Set(files.map(toPosix))];
    if (unique.length > 1) {
      violations.push(`case-only filename collision for ${key}: ${unique.join(", ")}`);
    }
  }

  for (const file of sourceFiles) {
    const source = fs
      .readFileSync(path.join(root, file), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    let match;
    while ((match = IMPORT_RE.exec(source)) !== null) {
      const specifier = match[1] || match[2] || match[3];
      if (!specifier) continue;
      if (specifier === "...") continue;
      checkImport(file, specifier, root, violations, exactPathCache, dirEntriesCache);
    }
  }

  return violations;
}

export function runCaseSensitiveImportCheck(root = ROOT) {
  const violations = collectCaseSensitiveImportViolations(root);
  if (violations.length > 0) {
    console.error(`\n❌ [CASE_SENSITIVE_IMPORTS] Found ${violations.length} violation(s):\n`);
    for (const violation of violations) console.error(`  - ${violation}`);
    return 1;
  }

  console.log("✅ [CASE_SENSITIVE_IMPORTS] Local imports resolve with exact Linux casing.");
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(runCaseSensitiveImportCheck());
}
