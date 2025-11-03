// scripts/validate-downloads.mjs
// Cross-platform validator for /public/downloads PDFs.
// Fails (exit 1) only when --strict is passed AND there are errors.

import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DOWNLOADS_DIR = path.join(ROOT, "public", "downloads");

const argv = new Set(process.argv.slice(2));
const STRICT = argv.has("--strict");

const MIN_BYTES = 10 * 1024; // warn if <10KB

// Allow either kebab-case.pdf OR Title_Case_With_Underscores.pdf
const BAD_NAME = /^(?![a-z0-9]+(?:-[a-z0-9]+)*\.pdf$)(?![A-Z][A-Za-z0-9]*(?:_[A-Z][A-Za-z0-9]*)*\.pdf$).+/;

// Provide expected filenames via env (comma separated)
const EXPECTED = new Set(
  (process.env.EXPECTED_DOWNLOADS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

// Always check these common ones
["leaders-cue-card.pdf", "brotherhood-covenant.pdf", "brotherhood-cue-card.pdf"].forEach((f) =>
  EXPECTED.add(f)
);

// Canonical Title_Case files that are OK to be served via redirect
const CANONICAL_ALIASES = new Set([
  "Leaders_Cue_Card.pdf",
  "Fathering_Without_Fear.pdf",
  "Fathering_Without_Fear_Teaser-Mobile.pdf",
]);

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

async function listPdfs(dir) {
  if (!fssync.existsSync(dir)) return [];
  const files = await fs.readdir(dir);
  return files.filter((f) => f.toLowerCase().endsWith(".pdf")).sort();
}

async function main() {
  console.log(`🔍 Validating downloads in: ${DOWNLOADS_DIR}`);
  const pdfs = await listPdfs(DOWNLOADS_DIR);
  console.log(`✅ Found ${pdfs.length} PDF(s).`);

  const warnings = [];
  const errors = [];

  for (const name of pdfs) {
    const full = path.join(DOWNLOADS_DIR, name);
    const stat = await fs.stat(full).catch(() => null);
    if (!stat) {
      errors.push(`Missing file (race condition?): ${rel(full)}`);
      continue;
    }
    if (BAD_NAME.test(name)) {
      warnings.push(
        `Filename style should be Title_Case_With_Underscores.pdf or kebab-case.pdf: ${name}`
      );
    }
    if (stat.size < MIN_BYTES) {
      warnings.push(`Suspiciously small PDF (<10KB): ${name}`);
    }
  }

  if (EXPECTED.size) {
    const present = new Set(pdfs);
    for (const needed of EXPECTED) {
      if (!present.has(needed) && !CANONICAL_ALIASES.has(needed)) {
        errors.push(`Expected download not found: /downloads/${needed}`);
      }
    }
  }

  // Report
  for (const w of warnings) console.warn("⚠️", w);

  if (errors.length) {
    for (const e of errors) console.error("❌", e);
    const msg = `Failed: ${errors.length} error(s), ${warnings.length} warning(s).`;
    if (STRICT) {
      console.error(msg);
      process.exit(1);
    } else {
      console.warn(msg);
      process.exit(0);
    }
  } else {
    console.log(`✅ Passed with ${warnings.length} warning(s).`);
  }
}
