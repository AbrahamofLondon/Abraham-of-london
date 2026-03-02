// scripts/pdf/generate-pdfs.ts
// ABRAHAM OF LONDON — SSOT VALIDATOR (Inventory-First, No Placeholders)
// -----------------------------------------------------------------------------
// POLICY (matches build-pdf-registry-generated.ts):
// - PDF min KB: standard=12, fillable=8
// - PDF header required: %PDF
// - PDF warn-only if < 50KB
//
// ADDED (correct non-PDF handling):
// - ZIP min KB: 12 (configurable)
// - ZIP header required: PK.. signatures
//
// FIXES:
// - No top-level await
// - Accurate failure reasons per file type
// - Writes audit JSON always

import fs from "fs";
import path from "path";

type ValidateOptions = {
  requirePdfHeader: boolean;
  minKbStandardPdf: number;
  minKbFillablePdf: number;
  warnKbSmallPdf: number;

  minKbZip: number;
  requireZipHeader: boolean;
  allowSmallZip: boolean;

  outAuditAbs: string;
  printLimit: number;
};

const ROOT = process.cwd();

const DEFAULTS: ValidateOptions = {
  // PDF policy
  requirePdfHeader: true,
  minKbStandardPdf: 12,
  minKbFillablePdf: 8,
  warnKbSmallPdf: 50,

  // ZIP policy (new)
  minKbZip: 12,
  requireZipHeader: true,
  allowSmallZip: false,

  outAuditAbs: path.join(ROOT, "public", "assets", "downloads", "pdf-ssot-validate.json"),
  printLimit: 40,
};

function kb(bytes: number) {
  return Math.round(bytes / 1024);
}

function toAbsPublicPath(outputPath: string): string {
  const rel = String(outputPath || "").replace(/^\//, "");
  return path.join(ROOT, "public", rel);
}

function isPdfHeader(absPath: string): boolean {
  try {
    const fd = fs.openSync(absPath, "r");
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    return buf.toString("utf8") === "%PDF";
  } catch {
    return false;
  }
}

function isZipHeader(absPath: string): boolean {
  // ZIP signatures:
  // - Local file header:     PK\x03\x04
  // - Empty archive:         PK\x05\x06
  // - Spanned archive:       PK\x07\x08
  try {
    const fd = fs.openSync(absPath, "r");
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    const s = buf.toString("binary");
    return s === "PK\u0003\u0004" || s === "PK\u0005\u0006" || s === "PK\u0007\u0008";
  } catch {
    return false;
  }
}

function looksFillable(entry: any): boolean {
  return Boolean(entry?.isFillable) || String(entry?.outputPath || "").toLowerCase().includes("fillable");
}

function parseCli(): ValidateOptions {
  const argv = process.argv.slice(2);

  const get = (k: string) => {
    const eq = argv.find((a) => a.startsWith(`${k}=`));
    if (eq) return eq.split("=").slice(1).join("=");
    const i = argv.indexOf(k);
    if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
    return undefined;
  };

  const has = (k: string) => argv.includes(k);

  const requirePdfHeader = has("--no-require-pdf-header") ? false : DEFAULTS.requirePdfHeader;
  const requireZipHeader = has("--no-require-zip-header") ? false : DEFAULTS.requireZipHeader;
  const allowSmallZip = has("--allow-small-zip") ? true : DEFAULTS.allowSmallZip;

  const minKbStandardPdf = (() => {
    const raw = get("--min-kb-standard-pdf");
    const n = raw ? Number(raw) : DEFAULTS.minKbStandardPdf;
    return Number.isFinite(n) && n > 0 ? n : DEFAULTS.minKbStandardPdf;
  })();

  const minKbFillablePdf = (() => {
    const raw = get("--min-kb-fillable-pdf");
    const n = raw ? Number(raw) : DEFAULTS.minKbFillablePdf;
    return Number.isFinite(n) && n > 0 ? n : DEFAULTS.minKbFillablePdf;
  })();

  const warnKbSmallPdf = (() => {
    const raw = get("--warn-kb-small-pdf");
    const n = raw ? Number(raw) : DEFAULTS.warnKbSmallPdf;
    return Number.isFinite(n) && n > 0 ? n : DEFAULTS.warnKbSmallPdf;
  })();

  const minKbZip = (() => {
    const raw = get("--min-kb-zip");
    const n = raw ? Number(raw) : DEFAULTS.minKbZip;
    return Number.isFinite(n) && n > 0 ? n : DEFAULTS.minKbZip;
  })();

  const out = (() => {
    const raw = get("--out");
    if (!raw) return DEFAULTS.outAuditAbs;
    return path.isAbsolute(raw) ? raw : path.join(ROOT, raw);
  })();

  const printLimit = (() => {
    const raw = get("--limit");
    const n = raw ? Number(raw) : DEFAULTS.printLimit;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULTS.printLimit;
  })();

  return {
    requirePdfHeader,
    minKbStandardPdf,
    minKbFillablePdf,
    warnKbSmallPdf,
    minKbZip,
    requireZipHeader,
    allowSmallZip,
    outAuditAbs: out,
    printLimit,
  };
}

type Fail = { id: string; path: string; reason: string };
type Warn = { id: string; path: string; warn: string; sizeKb: number };

async function main() {
  const opts = parseCli();

  const reg = await import("../../lib/pdf/registry.static");
  const entries = (reg as any).GENERATED_PDF_CONFIGS as any[];

  if (!Array.isArray(entries) || entries.length === 0) {
    console.error("❌ SSOT VALIDATION: GENERATED_PDF_CONFIGS is empty or missing.");
    process.exit(1);
  }

  console.log("🔍 Validating SSOT assets (inventory registry)...");
  console.log(`   - Records: ${entries.length}`);
  console.log(`   - PDF: require header=${opts.requirePdfHeader ? "YES" : "NO"}, minKB std=${opts.minKbStandardPdf}, fillable=${opts.minKbFillablePdf}, warn<${opts.warnKbSmallPdf}KB`);
  console.log(`   - ZIP: require header=${opts.requireZipHeader ? "YES" : "NO"}, minKB=${opts.minKbZip}, allowSmallZip=${opts.allowSmallZip ? "YES" : "NO"}`);
  console.log("");

  let ok = 0;
  const fails: Fail[] = [];
  const warns: Warn[] = [];

  for (const e of entries) {
    const id = String(e?.id || "").trim();
    const out = String(e?.outputPath || "").trim();
    if (!id || !out) continue;

    const abs = toAbsPublicPath(out);
    const ext = path.extname(abs).toLowerCase();

    if (!fs.existsSync(abs)) {
      fails.push({ id, path: out, reason: "MISSING" });
      continue;
    }

    let st: fs.Stats;
    try {
      st = fs.statSync(abs);
    } catch {
      fails.push({ id, path: out, reason: "UNREADABLE_STAT" });
      continue;
    }

    if (!st.isFile()) {
      fails.push({ id, path: out, reason: "NOT_A_FILE" });
      continue;
    }

    const sizeKb = kb(st.size);

    // --- PDF ---
    if (ext === ".pdf") {
      const isFillable = looksFillable(e);
      const minKb = isFillable ? opts.minKbFillablePdf : opts.minKbStandardPdf;

      if (sizeKb < minKb) {
        fails.push({ id, path: out, reason: `PDF_TOO_SMALL_<${minKb}KB>(${sizeKb}KB)` });
        continue;
      }

      if (opts.requirePdfHeader && !isPdfHeader(abs)) {
        fails.push({ id, path: out, reason: "PDF_BAD_HEADER" });
        continue;
      }

      if (sizeKb < opts.warnKbSmallPdf) {
        warns.push({ id, path: out, warn: `SMALL_PDF_${sizeKb}KB`, sizeKb });
      }

      ok++;
      continue;
    }

    // --- ZIP ---
    if (ext === ".zip") {
      if (!opts.allowSmallZip && sizeKb < opts.minKbZip) {
        fails.push({ id, path: out, reason: `ZIP_TOO_SMALL_<${opts.minKbZip}KB>(${sizeKb}KB)` });
        continue;
      }

      if (opts.requireZipHeader && !isZipHeader(abs)) {
        fails.push({ id, path: out, reason: "ZIP_BAD_HEADER" });
        continue;
      }

      // Warn if tiny zip (even if allowed)
      if (sizeKb < opts.minKbZip) {
        warns.push({ id, path: out, warn: `SMALL_ZIP_${sizeKb}KB`, sizeKb });
      }

      ok++;
      continue;
    }

    // --- Other binaries (if ever introduced) ---
    if (st.size < 128) {
      fails.push({ id, path: out, reason: `BINARY_TOO_SMALL(${st.size}B)` });
      continue;
    }

    ok++;
  }

  // Write audit JSON always
  try {
    fs.mkdirSync(path.dirname(opts.outAuditAbs), { recursive: true });
    fs.writeFileSync(
      opts.outAuditAbs,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          policy: opts,
          totals: {
            registryRecords: entries.length,
            ok,
            failed: fails.length,
            warnings: warns.length,
          },
          failures: fails,
          warnings: warns,
        },
        null,
        2,
      ),
      "utf8",
    );
    console.log(`🧾 Audit written: ${path.relative(ROOT, opts.outAuditAbs)}`);
  } catch (e: any) {
    console.warn(`⚠️ Could not write audit JSON: ${e?.message || String(e)}`);
  }

  console.log("============================================================");
  console.log("📊 SSOT VALIDATION SUMMARY");
  console.log("============================================================");
  console.log(`✅ OK:       ${ok}`);
  console.log(`⚠ Warnings: ${warns.length} (non-fatal)`);
  console.log(`❌ Failed:   ${fails.length}`);
  console.log(`📦 Total:    ${entries.length}`);
  console.log("============================================================");

  if (warns.length) {
    console.log(`\n⚠ WARNINGS (first ${Math.min(opts.printLimit, warns.length)}):`);
    for (const w of warns.slice(0, opts.printLimit)) {
      console.log(` - ${w.id}: ${w.path} (${w.warn})`);
    }
    if (warns.length > opts.printLimit) console.log(` - … ${warns.length - opts.printLimit} more`);
  }

  if (fails.length) {
    console.log(`\n❌ FAILURES (first ${Math.min(opts.printLimit, fails.length)}):`);
    for (const f of fails.slice(0, opts.printLimit)) {
      console.log(` - ${f.id}: ${f.path} (${f.reason})`);
    }
    if (fails.length > opts.printLimit) console.log(` - … ${fails.length - opts.printLimit} more`);
    process.exit(1);
  }

  console.log("\n✅ SSOT assets validated successfully.");
}

const invokedAsScript = (() => {
  const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return argv1.endsWith("generate-pdfs.ts") || argv1.endsWith("generate-pdfs.js");
})();

if (invokedAsScript) {
  main().catch((e: any) => {
    console.error(`❌ SSOT VALIDATOR FATAL: ${e?.message || String(e)}`);
    process.exit(1);
  });
}

export default main;