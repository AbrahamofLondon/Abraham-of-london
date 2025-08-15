// ESM script (package.json has "type":"module")
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");

// Files to scan & sanitize
const PATTERNS = [
  "**/*.{ts,tsx,js,jsx,md,mdx,css,scss,json,html}"
];

const IGNORE = [
  "node_modules/**",
  ".next/**",
  ".git/**",
  "public/**",
  "out/**",
  ".vercel/**",
  ".netlify/**"
];

// Character fixes
const replacements = [
  // Remove BOM
  [/\uFEFF/g, ""],
  // Replace non-breaking spaces with regular spaces
  [/\u00A0/g, " "],
  // Remove soft hyphen
  [/\u00AD/g, ""],
  // Replace various unicode spaces with normal space
  [/[\u2000-\u200B\u202F\u205F\u3000]/g, " "],
  // Remove zero-width joiners/non-joiners & word joiner
  [/[\u200C\u200D\u2060]/g, ""],
  // Normalize line separators to newline
  [/\u2028|\u2029/g, "\n"]
];

// Optional: collapse sequences of the common mojibake characters into a single quote or dash.
// This is conservative to avoid touching legit accented text.
// Common patterns from double-decoded UTF-8 for quotes/dashes:
const mojibakeFixes = [
  // weird apostrophe clusters → '
  [/(?:Ã|Â|¢|â|€|™|œ|ž|||||||){1,}/g, ""]
];

function sanitizeContents(input) {
  let out = input;
  for (const [re, val] of replacements) out = out.replace(re, val);
  for (const [re, val] of mojibakeFixes) out = out.replace(re, val);

  // Trim trailing spaces at line ends
  out = out.replace(/[ \t]+$/gm, "");
  // Ensure file ends with newline (nice to have)
  if (!out.endsWith("\n")) out += "\n";
  return out;
}

async function run() {
  const files = await glob(PATTERNS, { cwd: ROOT, ignore: IGNORE, dot: true, nodir: true });
  let changed = 0;

  await Promise.all(
    files.map(async (rel) => {
      const abs = path.join(ROOT, rel);
      try {
        const buf = await fs.readFile(abs, "utf8");
        const cleaned = sanitizeContents(buf);
        if (cleaned !== buf) {
          await fs.writeFile(abs, cleaned, "utf8");
          changed++;
        }
      } catch (e) {
        // ignore read errors
      }
    })
  );

  console.log(`sanitize-source: processed ${files.length} files, changed ${changed}`);
}

run().catch((e) => {
  console.error("sanitize-source failed:", e);
  process.exit(1);
});
