#!/usr/bin/env node
/**
 * Scan repo for download links, list what's missing, and (optionally) create
 * padded placeholder PDFs in kebab-case to keep pages clean.
 *
 * Usage:
 *  Dry run (recommended first):
 *    node scripts/scan-and-fill-downloads.mjs
 *
 *  Actually create placeholders:
 *    node scripts/scan-and-fill-downloads.mjs --write
 *
 *  Options:
 *    --root=.               Repo root (default ".")
 *    --dir=public/downloads Downloads dir (default "public/downloads")
 *    --out=scripts/output   Report output dir (default "scripts/output")
 *    --min-bytes=12000      Minimum placeholder size to avoid warnings
 */

import fs from "fs/promises";
import fscb from "fs";
import path from "path";
import { fileURLToPath } from "url";

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v === undefined ? true : v];
    }),
);

const WRITE = Boolean(args.write);
const ROOT = path.resolve(args.root || ".");
const DL_DIR = path.resolve(ROOT, args.dir || "public/downloads");
const OUT_DIR = path.resolve(ROOT, args.out || "scripts/output");
const MIN_BYTES = Math.max(1024, Number(args["min-bytes"] || 12000));

const TEXT_EXTS = new Set([
  ".md",
  ".mdx",
  ".txt",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".toml",
  ".yaml",
  ".yml",
  ".css",
  ".html",
]);

const shouldScan = (file) => {
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTS.has(ext)) return false;
  if (/(^|\/)\.next\//.test(file)) return false;
  if (/(^|\/)node_modules\//.test(file)) return false;
  if (/(^|\/)dist\//.test(file)) return false;
  if (/(^|\/)\.git\//.test(file)) return false;
  return true;
};

const walkFiles = async (dir, out = []) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (
        [
          ".next",
          "node_modules",
          "dist",
          ".git",
          ".vercel",
          ".netlify",
        ].includes(e.name)
      )
        continue;
      await walkFiles(p, out);
    } else if (shouldScan(p)) {
      out.push(p);
    }
  }
  return out;
};

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true }).catch(() => {});
};

const kebabize = (base) => {
  const name = base.replace(/\.pdf$/i, "");
  return (
    name
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-zA-Z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "")
      .toLowerCase() + ".pdf"
  );
};

/** Extract /downloads refs (with or without .pdf) from a text blob */
const extractDownloadRefs = (src) => {
  const out = new Set();

  // /downloads/something.pdf or /downloads/something (slug)
  // capture up to whitespace, quote, paren, or angle bracket
  const re = /\/downloads\/([A-Za-z0-9._\-]+)(?:\.pdf)?(?=[\s"')>\]}]|$)/g;
  let m;
  while ((m = re.exec(src))) {
    const raw = m[1]; // may be Title_Case or kebab or has dots/underscores
    const withPdf = /\.pdf$/i.test(raw) ? raw : `${raw}.pdf`;
    out.add(withPdf);
  }

  return Array.from(out);
};

const readText = async (p) => fs.readFile(p, "utf8");

const nowStamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

/** Tiny PDF with one line of text, then padded to MIN_BYTES */
const makePlaceholderPdfBuffer = (label) => {
  const text = `Placeholder: ${label}`;
  const content = `BT /F1 24 Tf 50 780 Td (${text.replace(/[()\\]/g, (m) => "\\" + m)}) Tj ET`;
  const stream = `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`;
  const pdf = [
    "%PDF-1.4",
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj",
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj ${stream} endobj`,
    "xref",
    "0 6",
    "0000000000 65535 f ",
    "0000000010 00000 n ",
    "0000000061 00000 n ",
    "0000000121 00000 n ",
    "0000000310 00000 n ",
    "0000000281 00000 n ",
    "trailer << /Size 6 /Root 1 0 R >>",
    "startxref",
    "400",
    "%%EOF",
  ].join("\n");

  let buf = Buffer.from(pdf, "utf8");
  if (buf.length < MIN_BYTES) {
    const pad = Buffer.alloc(MIN_BYTES - buf.length, 0x20); // spaces
    buf = Buffer.concat([buf, pad]);
  }
  return buf;
};

const listExisting = async (dir) => {
  const items = await fs.readdir(dir).catch(() => []);
  return items.filter((n) => /\.pdf$/i.test(n));
};

(async () => {
  console.log("— scan-and-fill-downloads —");
  console.log(`root : ${ROOT}`);
  console.log(`dir  : ${DL_DIR}`);
  console.log(
    `mode : ${WRITE ? "WRITE (will create placeholders)" : "DRY-RUN"}`,
  );
  console.log("");

  await ensureDir(OUT_DIR);

  // 1) Gather expected from repo refs
  const files = await walkFiles(ROOT);
  const expected = new Set();

  for (const file of files) {
    const src = await readText(file);
    for (const ref of extractDownloadRefs(src)) {
      expected.add(kebabize(ref)); // normalize to kebab-case + .pdf
    }
  }

  // 2) What actually exists?
  const existing = await listExisting(DL_DIR);
  const existingLC = new Set(existing.map((f) => f.toLowerCase()));

  // 3) Resolve missing (case-insensitive compare)
  const missing = Array.from(expected).filter(
    (e) => !existingLC.has(e.toLowerCase()),
  );

  // 4) Report
  const stamp = nowStamp();
  const report = {
    generatedAt: stamp,
    downloadsDir: path.relative(ROOT, DL_DIR),
    counts: {
      expected: expected.size,
      present: existing.length,
      missing: missing.length,
    },
    expected: Array.from(expected).sort(),
    present: existing.sort(),
    missing: missing.sort(),
  };

  const reportPath = path.join(OUT_DIR, `downloads-scan-${stamp}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`Expected (normalized): ${report.counts.expected}`);
  console.log(`Present             : ${report.counts.present}`);
  console.log(`Missing             : ${report.counts.missing}`);
  if (report.missing.length) {
    console.log("\nMissing list:");
    for (const m of report.missing) console.log(`  • ${m}`);
  } else {
    console.log("\nNo missing downloads detected ");
  }
  console.log(`\nWrote report → ${path.relative(ROOT, reportPath)}`);

  // 5) Create placeholders for missing
  if (WRITE && missing.length) {
    console.log("\nCreating placeholders…");
    for (const m of missing) {
      const outPath = path.join(DL_DIR, m);
      const buf = makePlaceholderPdfBuffer(m);
      await fs.writeFile(outPath, buf);
      const stat = await fs.stat(outPath);
      console.log(`  + ${path.relative(ROOT, outPath)} (${stat.size} bytes)`);
    }
    console.log("\nDone creating placeholders.");
  } else if (!WRITE && missing.length) {
    console.log(
      "\n(DRY-RUN) No files were created. Re-run with --write to create placeholders.",
    );
  }
})();
