// scripts/pdf/generate-pdfs.ts
// ABRAHAM OF LONDON — SSOT VALIDATOR (Inventory Registry → Public Assets)
// -----------------------------------------------------------------------------
// ✅ Adds RENDER SANITY CHECK for PDFs:
//    - Loads PDF with pdf-lib
//    - Requires pageCount > 0
//
// HARD POLICY (default):
// - PDFs: require %PDF header, minKB std=12, fillable=8
// - ZIPs: require ZIP header, minKB=12 (unless --allow-small-zip)
// - Writes audit JSON: public/assets/downloads/pdf-ssot-validate.json
//
// NOTE: No top-level await (tsx/esbuild safe).

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Command } from "commander";

import { GENERATED_PDF_CONFIGS } from "@/lib/pdf/pdf-registry.generated";
import type { PDFRegistryEntry } from "@/lib/pdf/registry.static";

// -----------------------------------------------------------------------------
// CONFIG DEFAULTS
// -----------------------------------------------------------------------------

const ROOT = process.cwd();
const DOWNLOADS_PUBLIC_ROOT = path.join(ROOT, "public", "assets", "downloads");
const OUT_AUDIT_JSON = path.join(DOWNLOADS_PUBLIC_ROOT, "pdf-ssot-validate.json");

const MIN_PDF_KB_STANDARD = 12;
const MIN_PDF_KB_FILLABLE = 8;
const WARN_PDF_KB_SMALL = 50;

const MIN_ZIP_KB = 12;

type Failure =
  | { kind: "MISSING"; id: string; outputPath: string; reason: string }
  | { kind: "INVALID"; id: string; outputPath: string; reason: string };

type Warning = { id: string; outputPath: string; code: string };

type Audit = {
  generatedAt: string;
  settings: {
    requirePdfHeader: boolean;
    requireZipHeader: boolean;
    minPdfKBStandard: number;
    minPdfKBFillable: number;
    warnPdfKB: number;
    minZipKB: number;
    allowSmallZip: boolean;
    renderSanity: boolean;
  };
  summary: {
    total: number;
    ok: number;
    warnings: number;
    failed: number;
    missing: number;
    invalid: number;
  };
  failures: Failure[];
  warnings: Warning[];
  ok: Array<{ id: string; outputPath: string; bytes: number }>;
};

// -----------------------------------------------------------------------------
// CLI
// -----------------------------------------------------------------------------

const program = new Command();

program
  .name("generate-pdfs")
  .description("Validate SSOT assets (inventory registry) against public/assets/downloads")
  .option("--no-require-pdf-header", "Do not require %PDF header")
  .option("--no-require-zip-header", "Do not require ZIP local header (PK\\x03\\x04)")
  .option("--allow-small-zip", "Treat tiny ZIPs as warnings (non-fatal)", false)
  .option("--no-render-sanity", "Disable PDF render sanity check (pdf-lib load + pageCount)", false)
  .option("--out <file>", "Audit JSON output path", "./public/assets/downloads/pdf-ssot-validate.json")
  .option("--verbose", "Verbose logging", false);

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function toAbs(p: string) {
  return path.isAbsolute(p) ? p : path.join(ROOT, p);
}

function safePosix(p: string) {
  return String(p || "").replace(/\\/g, "/");
}

function repoAbsFromWebPath(webPath: string) {
  // webPath like "/assets/downloads/content-downloads/x.pdf"
  const rel = safePosix(webPath).replace(/^\/+/, "");
  return path.join(ROOT, "public", rel);
}

function kb(bytes: number) {
  return Math.round(bytes / 1024);
}

function readHead(abs: string, n: number) {
  const fd = fs.openSync(abs, "r");
  try {
    const buf = Buffer.alloc(n);
    fs.readSync(fd, buf, 0, n, 0);
    return buf;
  } finally {
    try { fs.closeSync(fd); } catch {}
  }
}

function isPdfHeader(abs: string) {
  try {
    const h = readHead(abs, 4);
    return h.toString("utf8") === "%PDF";
  } catch {
    return false;
  }
}

function isZipHeader(abs: string) {
  // ZIP local file header is PK\x03\x04
  try {
    const h = readHead(abs, 4);
    return h[0] === 0x50 && h[1] === 0x4b && h[2] === 0x03 && h[3] === 0x04;
  } catch {
    return false;
  }
}

function sha256File(abs: string) {
  const buf = fs.readFileSync(abs);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function renderSanityCheckPdf(abs: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    // Lazy import to keep startup light
    const { PDFDocument } = await import("pdf-lib");
    const buf = fs.readFileSync(abs);

    // If a PDF is encrypted, pdf-lib can throw. That’s still “not safe for web serve”
    const pdf = await PDFDocument.load(buf, { ignoreEncryption: false });
    const pages = pdf.getPageCount();

    if (!Number.isFinite(pages) || pages <= 0) return { ok: false, reason: "render sanity failed (pageCount<=0)" };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: `render sanity failed (${e?.message || "unknown"})` };
  }
}

// -----------------------------------------------------------------------------
// VALIDATION
// -----------------------------------------------------------------------------

async function validateOne(
  entry: PDFRegistryEntry,
  opts: {
    requirePdfHeader: boolean;
    requireZipHeader: boolean;
    allowSmallZip: boolean;
    renderSanity: boolean;
    verbose: boolean;
  }
): Promise<{ ok: true; bytes: number; warnings: string[] } | Failure> {
  const id = String(entry.id || "").trim();
  const outputPath = String(entry.outputPath || "").trim();

  if (!id || !outputPath) {
    return { kind: "INVALID", id: id || "(missing-id)", outputPath: outputPath || "(missing-path)", reason: "missing id/outputPath" };
  }

  const abs = repoAbsFromWebPath(outputPath);
  if (!fs.existsSync(abs)) {
    return { kind: "MISSING", id, outputPath, reason: "file missing on disk" };
  }

  const st = fs.statSync(abs);
  if (!st.isFile() || st.size <= 0) {
    return { kind: "INVALID", id, outputPath, reason: "not a file or empty" };
  }

  const ext = path.extname(abs).toLowerCase();
  const sizeKb = kb(st.size);
  const warnings: string[] = [];

  // PDF rules
  if (ext === ".pdf") {
    const isFillable = outputPath.toLowerCase().includes("fillable") || Boolean((entry as any).isFillable);
    const minKb = isFillable ? MIN_PDF_KB_FILLABLE : MIN_PDF_KB_STANDARD;

    if (sizeKb < minKb) {
      return { kind: "INVALID", id, outputPath, reason: `too small (<${minKb}KB): ${sizeKb}KB` };
    }

    if (opts.requirePdfHeader && !isPdfHeader(abs)) {
      return { kind: "INVALID", id, outputPath, reason: `missing %PDF header` };
    }

    // ✅ RENDER SANITY CHECK (new)
    if (opts.renderSanity) {
      const r = await renderSanityCheckPdf(abs);
      if (!r.ok) {
        return { kind: "INVALID", id, outputPath, reason: r.reason };
      }
    }

    if (sizeKb < WARN_PDF_KB_SMALL) warnings.push(`SMALL_PDF_${sizeKb}KB`);

    return { ok: true, bytes: st.size, warnings };
  }

  // ZIP rules
  if (ext === ".zip") {
    if (sizeKb < MIN_ZIP_KB) {
      if (opts.allowSmallZip) {
        warnings.push(`SMALL_ZIP_${sizeKb}KB`);
      } else {
        return { kind: "INVALID", id, outputPath, reason: `ZIP_TOO_SMALL_<${MIN_ZIP_KB}KB(${sizeKb}KB)` };
      }
    }

    if (opts.requireZipHeader && !isZipHeader(abs)) {
      // Some zips can start with different records, but in practice this catches junk files.
      // Keep it strict unless explicitly disabled.
      return { kind: "INVALID", id, outputPath, reason: "invalid ZIP header (expected PK\\x03\\x04)" };
    }

    return { ok: true, bytes: st.size, warnings };
  }

  // Other formats: ignore (registry usually only has pdf/zip)
  return { ok: true, bytes: st.size, warnings };
}

// -----------------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------------

async function main() {
  program.parse(process.argv);
  const raw = program.opts();

  const requirePdfHeader = Boolean(raw.requirePdfHeader);
  const requireZipHeader = Boolean(raw.requireZipHeader);
  const allowSmallZip = Boolean(raw.allowSmallZip);
  const renderSanity = Boolean(raw.renderSanity);
  const verbose = Boolean(raw.verbose);
  const outAbs = toAbs(String(raw.out || OUT_AUDIT_JSON));

  const records = GENERATED_PDF_CONFIGS as ReadonlyArray<PDFRegistryEntry>;

  console.log(`🔍 Validating SSOT PDF assets (inventory registry)...`);
  console.log(`   - Records: ${records.length}`);
  console.log(
    `   - PDF: require header=${requirePdfHeader ? "YES" : "NO"}, renderSanity=${renderSanity ? "YES" : "NO"}, minKB std=${MIN_PDF_KB_STANDARD}, fillable=${MIN_PDF_KB_FILLABLE}, warn<${WARN_PDF_KB_SMALL}KB`
  );
  console.log(
    `   - ZIP: require header=${requireZipHeader ? "YES" : "NO"}, minKB=${MIN_ZIP_KB}, allowSmallZip=${allowSmallZip ? "YES" : "NO"}`
  );

  const audit: Audit = {
    generatedAt: new Date().toISOString(),
    settings: {
      requirePdfHeader,
      requireZipHeader,
      minPdfKBStandard: MIN_PDF_KB_STANDARD,
      minPdfKBFillable: MIN_PDF_KB_FILLABLE,
      warnPdfKB: WARN_PDF_KB_SMALL,
      minZipKB: MIN_ZIP_KB,
      allowSmallZip,
      renderSanity,
    },
    summary: { total: records.length, ok: 0, warnings: 0, failed: 0, missing: 0, invalid: 0 },
    failures: [],
    warnings: [],
    ok: [],
  };

  for (const e of records) {
    const res = await validateOne(e, { requirePdfHeader, requireZipHeader, allowSmallZip, renderSanity, verbose });

    if ("ok" in res && res.ok) {
      audit.summary.ok++;
      audit.ok.push({ id: e.id, outputPath: e.outputPath, bytes: res.bytes });

      for (const w of res.warnings) {
        audit.summary.warnings++;
        audit.warnings.push({ id: e.id, outputPath: e.outputPath, code: w });
      }

      if (verbose) {
        const sizeKb = kb(res.bytes);
        const w = res.warnings.length ? ` (${res.warnings.join(",")})` : "";
        console.log(`✅ OK: ${e.id}: ${e.outputPath} (${sizeKb}KB)${w}`);
      }

      continue;
    }

    // failure
    audit.summary.failed++;
    if (res.kind === "MISSING") audit.summary.missing++;
    else audit.summary.invalid++;

    audit.failures.push(res);
  }

  // Write audit JSON (always)
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, JSON.stringify(audit, null, 2), "utf8");
  console.log(`\n🧾 Audit written: ${safePosix(path.relative(ROOT, outAbs))}`);

  // Summary
  console.log("============================================================");
  console.log("📊 SSOT VALIDATION SUMMARY");
  console.log("============================================================");
  console.log(`✅ OK:       ${audit.summary.ok}`);
  console.log(`⚠ Warnings: ${audit.summary.warnings} (non-fatal)`);
  console.log(`❌ Failed:   ${audit.summary.failed}`);
  console.log(`📦 Total:    ${audit.summary.total}`);
  console.log("============================================================\n");

  if (audit.summary.failed > 0) {
    console.log(`❌ FAILURES (first 25):`);
    for (const f of audit.failures.slice(0, 25)) {
      console.log(` - ${f.id}: ${f.outputPath} (${f.reason})`);
    }
    process.exit(1);
  }

  // Print warnings (limited)
  if (audit.summary.warnings > 0) {
    console.log(`⚠ WARNINGS (first 40):`);
    for (const w of audit.warnings.slice(0, 40)) {
      console.log(` - ${w.id}: ${w.outputPath} (${w.code})`);
    }
    if (audit.summary.warnings > 40) console.log(` - … ${audit.summary.warnings - 40} more`);
    console.log("");
  }

  console.log("✅ SSOT assets validated successfully.");
  process.exit(0);
}

main().catch((e) => {
  console.error(`❌ Validator fatal: ${e?.message || String(e)}`);
  process.exit(1);
});

export default main;