// scripts/check-unsafe-strings.js
import fs from "fs";
import path from "path";

/**
 * Fit-for-purpose unsafe string checks:
 * - Avoids RegExp /g .test() lastIndex false positives
 * - Ignores comments (single-line // and block comments)
 * - Flags string charAt usage and string slice usage (not array slice)
 * - Keeps your specific legacy checks (optional)
 */

// Patterns (NO /g flags to avoid lastIndex pitfalls)
const UNSAFE_PATTERNS = [
  {
    // s.charAt(...)
    pattern: /\.\s*charAt\s*\(/,
    message: "Use safeCharAt() from lib/utils/string (or lib/utils/safe) instead.",
  },
  {
    // s.slice(...)  (STRING slice only)
    // Best-effort: catches `.slice(` on an identifier or a quoted literal.
    pattern: /\b([A-Za-z_$][\w$]*|["'`][^"'`]*["'`])\s*\.\s*slice\s*\(/,
    message: "Use substring() or safeSubstring() instead of string slice().",
  },
  // Optional: specific legacy checks (redundant, but fine)
  {
    pattern: /\bauthor\s*\.\s*name\s*\.\s*charAt\b/,
    message: "Use safeFirstChar() (or safeCharAt(author.name, 0)) for author names.",
  },
  {
    pattern: /\bdifficulty\s*\.\s*charAt\b/,
    message: "Use safeCapitalize() (or safeCharAt(difficulty, 0)) for difficulty levels.",
  },
];

// Strip comments (block + line)
function stripComments(source) {
  // Remove block comments
  let s = source.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove line comments
  s = s.replace(/\/\/.*$/gm, "");
  return s;
}

// Heuristic: don't flag common array slice usage when targeting string slice only
function looksLikeArraySlice(line) {
  return /\b(arr|array|items|list|rows|cols|entries|tokens|parts)\s*\.\s*slice\s*\(/i.test(line);
}

function checkFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const content = stripComments(raw);
  const lines = content.split("\n");

  let hasUnsafe = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    for (const { pattern, message } of UNSAFE_PATTERNS) {
      // Skip likely array slice lines for the string-slice rule
      if (pattern.source.includes("\\.\\s*slice") && looksLikeArraySlice(trimmed)) continue;

      if (pattern.test(trimmed)) {
        console.error(`❌ ${message}`);
        console.error(`   File: ${filePath}:${index + 1}`);
        console.error(`   Line: ${trimmed}\n`);
        hasUnsafe = true;
      }
    }
  });

  return hasUnsafe;
}

function walkDir(dir) {
  let hasErrors = false;

  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      if (
        file.name.startsWith(".") ||
        file.name === "node_modules" ||
        file.name === ".next" ||
        file.name === "dist"
      ) {
        continue;
      }
      hasErrors = walkDir(fullPath) || hasErrors;
      continue;
    }

    if (file.isFile() && (file.name.endsWith(".tsx") || file.name.endsWith(".ts"))) {
      hasErrors = checkFile(fullPath) || hasErrors;
    }
  }

  return hasErrors;
}

// Run check
console.log("🔍 Checking for unsafe string methods...\n");

const dirsToCheck = ["components", "pages", "lib"];
let totalDirsWithErrors = 0;

for (const dir of dirsToCheck) {
  if (fs.existsSync(dir)) {
    console.log(`Checking ${dir}/...`);
    const errors = walkDir(dir);
    if (errors) totalDirsWithErrors++;
  }
}

if (totalDirsWithErrors > 0) {
  console.error(`\n⚠️  Found ${totalDirsWithErrors} directories with unsafe string usage!`);
  console.error('👉 Use safe utilities from "@/lib/utils/string" (or "@/lib/utils/safe") instead.');
  process.exit(1);
} else {
  console.log("✅ No unsafe string usage found!");
  process.exit(0);
}