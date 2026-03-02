// scripts/pdf/universal-converter.ts
// Universal converter with:
// - source roots: content/downloads + lib/pdf ONLY
// - print-grade HTML -> PDF for MD/MDX via SecurePuppeteerPDFGenerator (flagship renderer)
// - LibreOffice for Office docs (if available)
// - PDF validation + rebuild/upgrade path for invalid lib/pdf files
// - deterministic output structure + manifest
// - non-strict default (won't exit 1 unless --strict)

import fs from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

type SourceKind = "mdx" | "md" | "xlsx" | "xls" | "pptx" | "ppt" | "pdf";

type ConvertMethod =
  | "copy"
  | "puppeteer"
  | "libreoffice"
  | "skip_existing"
  | "skip_dedupe"
  | "failed";

type SourceFile = {
  absPath: string;
  relPath: string;
  kind: SourceKind;
  baseName: string; // filename without extension
  mtimeMs: number;
  size: number;
  from: "content/downloads" | "lib/pdf";
};

type ConvertResult = {
  ok: boolean;
  method: ConvertMethod;
  source: SourceFile | null;
  outRelPath: string;
  outAbsPath: string;
  size: number;
  ms: number;
  note?: string;
  error?: string;
  checksum16?: string;
};

const CWD = process.cwd();

const CONFIG = {
  // REQUIRED: only these two sources
  sourceContent: path.join(CWD, "content", "downloads"),
  sourceLibPdf: path.join(CWD, "lib", "pdf"),

  // output
  outRoot: path.join(CWD, "public", "assets", "downloads"),
  outContentDir: "content-downloads",
  outLibDir: "lib-pdf",
  outGeneratedDir: "generated",

  tempDir: path.join(CWD, ".temp", "pdf-conversion"),

  // behaviour
  recursive: true,
  overwrite: false,
  dryRun: false,
  strict: false, // if true -> exit 1 on failures
  quality: "print" as "print" | "draft",

  // validation
  minPdfBytes: 8_000, // filter out broken/tiny PDFs
  minPdfHeaderBytes: 4,

  // dedupe preferences (higher wins)
  priority: {
    // Special PDFs should generally win, but only if valid
    libPdf_fillable_pdf: 100,
    libPdf_pdf: 80,

    // Office conversions often preserve layout better than MDX if the source exists
    content_office: 60,

    // MD/MDX via print HTML
    content_mdx: 50,
  },
};

function nowIso() {
  return new Date().toISOString();
}

function safeMkdir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function isPdfHeader(buf: Buffer) {
  if (!buf || buf.length < CONFIG.minPdfHeaderBytes) return false;
  const head = buf.subarray(0, 4).toString("utf8");
  return head === "%PDF";
}

function checksum16(filePath: string) {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
  } catch {
    return null;
  }
}

function statSafe(p: string) {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function hasLibreOffice(): boolean {
  try {
    execSync("libreoffice --version", { stdio: "ignore", shell: true });
    return true;
  } catch {
    try {
      execSync("soffice --version", { stdio: "ignore", shell: true });
      return true;
    } catch {
      return false;
    }
  }
}

function parseArgs(argv: string[]) {
  const args = new Set(argv);
  const getValue = (key: string) => {
    const hit = argv.find((a) => a.startsWith(`${key}=`));
    return hit ? hit.split("=").slice(1).join("=") : null;
  };

  const overwrite = args.has("--overwrite") || args.has("-o");
  const dryRun = args.has("--dry-run") || args.has("-n");
  const strict = args.has("--strict");
  const recursive = !args.has("--no-recursive");
  const quality = (getValue("--quality") || process.env.PDF_QUALITY || "print").toLowerCase();
  const minPdfBytesRaw = getValue("--min-bytes");

  return {
    overwrite,
    dryRun,
    strict,
    recursive,
    quality: quality === "draft" ? "draft" : "print",
    minPdfBytes: minPdfBytesRaw ? Math.max(1024, Number(minPdfBytesRaw) || CONFIG.minPdfBytes) : CONFIG.minPdfBytes,
  };
}

function discoverFiles(root: string, from: SourceFile["from"], recursive: boolean): SourceFile[] {
  if (!fs.existsSync(root)) return [];

  const out: SourceFile[] = [];
  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (recursive) walk(abs);
        continue;
      }
      const ext = path.extname(e.name).toLowerCase().replace(".", "");
      const kind = ext as SourceKind;

      if (!["mdx", "md", "xlsx", "xls", "pptx", "ppt", "pdf"].includes(kind)) continue;

      const st = fs.statSync(abs);
      out.push({
        absPath: abs,
        relPath: path.relative(root, abs),
        kind,
        baseName: path.basename(e.name, path.extname(e.name)),
        mtimeMs: st.mtimeMs,
        size: st.size,
        from,
      });
    }
  };

  walk(root);
  return out;
}

function chooseOutputPath(src: SourceFile) {
  // Deterministic layout:
  // - content/downloads -> public/assets/downloads/content-downloads/<same-relative>.pdf
  // - lib/pdf          -> public/assets/downloads/lib-pdf/<same-relative>.pdf
  //
  // But we always output as .pdf (even if source is mdx/xlsx/etc).
  const outDir =
    src.from === "content/downloads"
      ? path.join(CONFIG.outRoot, CONFIG.outContentDir, path.dirname(src.relPath))
      : path.join(CONFIG.outRoot, CONFIG.outLibDir, path.dirname(src.relPath));

  const outFile = `${src.baseName}.pdf`;
  return {
    outDir,
    outAbsPath: path.join(outDir, outFile),
    outRelPath: path.relative(CONFIG.outRoot, path.join(outDir, outFile)),
  };
}

function pdfLooksValid(absPath: string, minBytes: number) {
  const st = statSafe(absPath);
  if (!st || st.size < minBytes) return { ok: false, reason: "too small or missing" };

  const head = fs.readFileSync(absPath, { encoding: null, flag: "r" });
  if (!isPdfHeader(head)) return { ok: false, reason: "missing %PDF header" };

  return { ok: true, reason: "ok" };
}

function scoreSource(src: SourceFile) {
  // Priority rules:
  // - lib/pdf wins when valid; fillable naming gets extra weight
  // - office sources next
  // - md/mdx last (still good because we render carefully)
  if (src.from === "lib/pdf") {
    const lower = path.basename(src.absPath).toLowerCase();
    if (lower.includes("fillable")) return CONFIG.priority.libPdf_fillable_pdf;
    return CONFIG.priority.libPdf_pdf;
  }

  if (["xlsx", "xls", "pptx", "ppt"].includes(src.kind)) return CONFIG.priority.content_office;
  return CONFIG.priority.content_mdx;
}

function buildDedupPlan(sources: SourceFile[]) {
  // We dedupe by a "logical key".
  // For content/downloads, you may have:
  //   foo.mdx + foo.xlsx
  // We pick one to produce the canonical foo.pdf in its lane.
  //
  // NOTE: we keep both lanes separate:
  // - content lane outputs under content-downloads
  // - lib lane outputs under lib-pdf
  //
  // Dedup is per lane folder+baseName, so you don't end up with multiple foo.pdf
  // inside content-downloads when multiple source types exist.
  type Key = string;
  const byKey = new Map<Key, SourceFile[]>();

  for (const s of sources) {
    const lane = s.from === "lib/pdf" ? "lib" : "content";
    const relDir = path.dirname(s.relPath).replace(/\\/g, "/");
    const key = `${lane}::${relDir}::${s.baseName}`.toLowerCase();
    const arr = byKey.get(key) || [];
    arr.push(s);
    byKey.set(key, arr);
  }

  const chosen: SourceFile[] = [];
  const skipped: Array<{ reason: string; src: SourceFile }> = [];

  for (const [, group] of byKey.entries()) {
    const sorted = [...group].sort((a, b) => scoreSource(b) - scoreSource(a) || b.mtimeMs - a.mtimeMs);
    const pick = sorted[0];
    chosen.push(pick);
    for (const s of sorted.slice(1)) skipped.push({ reason: "dedupe", src: s });
  }

  return { chosen, skipped };
}

// =============================================================================
// ELITE FIX: Delegate MDX/MD conversion to SecurePuppeteerPDFGenerator
// =============================================================================
async function convertMdxOrMdWithPuppeteer(src: SourceFile, outAbsPath: string, quality: "print" | "draft") {
  // Dynamic import to avoid circular dependencies
  const { SecurePuppeteerPDFGenerator } = await import("./secure-puppeteer-generator");

  const gen = new SecurePuppeteerPDFGenerator({
    headless: true,
    chromePath: process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH,
    timeout: 90_000,
    watchdogMs: 160_000,
    maxRetries: 2,
  });

  const q = quality === "draft" ? "draft" : "premium";

  // Treat content as “free” unless your frontmatter overrides it
  await gen.generateFromSource({
    sourceAbsPath: src.absPath,
    sourceKind: src.kind === "md" ? "md" : "mdx",
    outputAbsPath: outAbsPath,
    quality: q,
    format: "A4",
    includeCover: true,
    allowFileUrls: false,
    // title/tier/subtitle/description resolved from frontmatter automatically
  });

  await gen.close().catch(() => {});
}

function convertWithLibreOffice(srcAbsPath: string, outAbsPath: string) {
  safeMkdir(CONFIG.tempDir);
  safeMkdir(path.dirname(outAbsPath));

  // LibreOffice outputs: <basename>.pdf
  // We convert into tempDir, then rename to outAbsPath.
  // Use soffice (common) but libreoffice works too.
  const cmd = `soffice --headless --convert-to pdf --outdir "${CONFIG.tempDir}" "${srcAbsPath}"`;
  execSync(cmd, { stdio: "pipe", shell: true });

  const base = path.basename(srcAbsPath, path.extname(srcAbsPath));
  const produced = path.join(CONFIG.tempDir, `${base}.pdf`);

  if (!fs.existsSync(produced)) {
    // Sometimes LO emits slightly different names; fallback: pick first pdf
    const pdfs = fs.readdirSync(CONFIG.tempDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
    if (pdfs.length === 0) throw new Error("LibreOffice produced no PDF output");
    fs.copyFileSync(path.join(CONFIG.tempDir, pdfs[0]), outAbsPath);
    return;
  }

  fs.copyFileSync(produced, outAbsPath);

  // cleanup best-effort
  try {
    fs.unlinkSync(produced);
  } catch {}
}

async function convertOne(
  src: SourceFile,
  flags: {
    overwrite: boolean;
    dryRun: boolean;
    quality: "print" | "draft";
    minPdfBytes: number;
  },
  capabilities: {
    libreoffice: boolean;
    puppeteer: boolean;
  }
): Promise<ConvertResult> {
  const t0 = Date.now();
  const { outDir, outAbsPath, outRelPath } = chooseOutputPath(src);

  safeMkdir(outDir);

  // If output exists and overwrite=false: skip unless it is invalid or older than source
  const outStat = statSafe(outAbsPath);
  if (outStat && !flags.overwrite) {
    const valid = pdfLooksValid(outAbsPath, flags.minPdfBytes);
    const newerSource = src.mtimeMs > outStat.mtimeMs + 5; // small skew
    if (valid.ok && !newerSource) {
      return {
        ok: true,
        method: "skip_existing",
        source: src,
        outRelPath,
        outAbsPath,
        size: outStat.size,
        ms: Date.now() - t0,
        checksum16: checksum16(outAbsPath) || undefined,
      };
    }
  }

  if (flags.dryRun) {
    return {
      ok: true,
      method: "skip_existing",
      source: src,
      outRelPath,
      outAbsPath,
      size: 0,
      ms: Date.now() - t0,
      note: "dryRun",
    };
  }

  try {
    if (src.kind === "pdf") {
      // Copy as-is, but validate. If invalid: attempt rebuild from matching content source later (handled in orchestrator)
      fs.copyFileSync(src.absPath, outAbsPath);

      const st = fs.statSync(outAbsPath);
      const v = pdfLooksValid(outAbsPath, flags.minPdfBytes);
      if (!v.ok) {
        return {
          ok: false,
          method: "failed",
          source: src,
          outRelPath,
          outAbsPath,
          size: st.size,
          ms: Date.now() - t0,
          error: `invalid pdf: ${v.reason}`,
          checksum16: checksum16(outAbsPath) || undefined,
        };
      }

      return {
        ok: true,
        method: "copy",
        source: src,
        outRelPath,
        outAbsPath,
        size: st.size,
        ms: Date.now() - t0,
        checksum16: checksum16(outAbsPath) || undefined,
      };
    }

    if (["xlsx", "xls", "pptx", "ppt"].includes(src.kind)) {
      if (!capabilities.libreoffice) throw new Error("LibreOffice not available for Office conversion");
      convertWithLibreOffice(src.absPath, outAbsPath);

      const st = fs.statSync(outAbsPath);
      const v = pdfLooksValid(outAbsPath, flags.minPdfBytes);
      if (!v.ok) throw new Error(`converted pdf invalid: ${v.reason}`);

      return {
        ok: true,
        method: "libreoffice",
        source: src,
        outRelPath,
        outAbsPath,
        size: st.size,
        ms: Date.now() - t0,
        checksum16: checksum16(outAbsPath) || undefined,
      };
    }

    if (src.kind === "mdx" || src.kind === "md") {
      if (!capabilities.puppeteer) throw new Error("Puppeteer not available for MDX/MD conversion");
      await convertMdxOrMdWithPuppeteer(src, outAbsPath, flags.quality);

      const st = fs.statSync(outAbsPath);
      const v = pdfLooksValid(outAbsPath, flags.minPdfBytes);
      if (!v.ok) throw new Error(`rendered pdf invalid: ${v.reason}`);

      return {
        ok: true,
        method: "puppeteer",
        source: src,
        outRelPath,
        outAbsPath,
        size: st.size,
        ms: Date.now() - t0,
        checksum16: checksum16(outAbsPath) || undefined,
      };
    }

    throw new Error(`unsupported type: ${src.kind}`);
  } catch (e: any) {
    return {
      ok: false,
      method: "failed",
      source: src,
      outRelPath,
      outAbsPath,
      size: statSafe(outAbsPath)?.size || 0,
      ms: Date.now() - t0,
      error: e?.message || String(e),
    };
  }
}

function matchRebuildCandidate(invalidLibPdf: SourceFile, contentSources: SourceFile[]) {
  // If lib/pdf/foo.pdf is invalid, try to rebuild from content/downloads/foo.<mdx|md|xlsx|pptx...>
  // We match by basename only (and prefer same relative directory if possible).
  const base = invalidLibPdf.baseName.toLowerCase();

  const sameDirRel = path
    .dirname(invalidLibPdf.relPath)
    .replace(/\\/g, "/")
    .toLowerCase();

  const matches = contentSources.filter((c) => {
    if (c.baseName.toLowerCase() !== base) return false;
    return true;
  });

  if (matches.length === 0) return null;

  // Prefer same relative dir name if present, else by type priority
  const ranked = matches.sort((a, b) => {
    const aDir = path.dirname(a.relPath).replace(/\\/g, "/").toLowerCase();
    const bDir = path.dirname(b.relPath).replace(/\\/g, "/").toLowerCase();

    const aSame = aDir === sameDirRel ? 1 : 0;
    const bSame = bDir === sameDirRel ? 1 : 0;
    if (aSame !== bSame) return bSame - aSame;

    return scoreSource(b) - scoreSource(a) || b.mtimeMs - a.mtimeMs;
  });

  return ranked[0];
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  CONFIG.overwrite = flags.overwrite;
  CONFIG.dryRun = flags.dryRun;
  CONFIG.strict = flags.strict;
  CONFIG.recursive = flags.recursive;
  CONFIG.quality = flags.quality;
  CONFIG.minPdfBytes = flags.minPdfBytes;

  safeMkdir(CONFIG.outRoot);
  safeMkdir(path.join(CONFIG.outRoot, CONFIG.outContentDir));
  safeMkdir(path.join(CONFIG.outRoot, CONFIG.outLibDir));
  safeMkdir(path.join(CONFIG.outRoot, CONFIG.outGeneratedDir));
  safeMkdir(CONFIG.tempDir);

  const libreofficeAvailable = hasLibreOffice();

  // Discover only two sources (as required)
  const contentFiles = discoverFiles(CONFIG.sourceContent, "content/downloads", CONFIG.recursive);
  const libPdfFiles = discoverFiles(CONFIG.sourceLibPdf, "lib/pdf", CONFIG.recursive);

  // Build a unified plan with dedupe per lane
  const { chosen: chosenContent, skipped: skippedContent } = buildDedupPlan(contentFiles);
  const { chosen: chosenLib, skipped: skippedLib } = buildDedupPlan(libPdfFiles);

  const chosen = [...chosenContent, ...chosenLib];
  const skipped = [...skippedContent, ...skippedLib];

  const manifest: any = {
    startedAt: nowIso(),
    node: process.version,
    platform: `${os.platform()} ${os.arch()}`,
    config: {
      sources: {
        content: path.relative(CWD, CONFIG.sourceContent),
        libPdf: path.relative(CWD, CONFIG.sourceLibPdf),
      },
      out: path.relative(CWD, CONFIG.outRoot),
      recursive: CONFIG.recursive,
      overwrite: CONFIG.overwrite,
      dryRun: CONFIG.dryRun,
      strict: CONFIG.strict,
      quality: CONFIG.quality,
      minPdfBytes: CONFIG.minPdfBytes,
      libreoffice: libreofficeAvailable,
      puppeteer: true, // always available with our flagship renderer
    },
    counts: {
      contentFound: contentFiles.length,
      libFound: libPdfFiles.length,
      chosen: chosen.length,
      skipped: skipped.length,
    },
    skipped: skipped.map((s) => ({
      reason: s.reason,
      from: s.src.from,
      relPath: s.src.relPath.replace(/\\/g, "/"),
      kind: s.src.kind,
    })),
    results: [] as ConvertResult[],
    rebuilds: [] as any[],
    summary: {},
  };

  console.log(`[INFO] converter start`);
  console.log(
    `[INFO] node=${process.version} platform=${os.platform()} arch=${os.arch()}`
  );
  console.log(`[INFO] out=${path.relative(CWD, CONFIG.outRoot)}`);
  console.log(`[INFO] temp=${path.relative(CWD, CONFIG.tempDir)}`);
  console.log(`[INFO] recursive=${String(CONFIG.recursive)} overwrite=${String(CONFIG.overwrite)} dryRun=${String(CONFIG.dryRun)}`);
  console.log(`[INFO] quality=${CONFIG.quality}`);
  console.log(`[INFO] libreoffice=${libreofficeAvailable ? "available" : "missing"}`);
  console.log(`[INFO] puppeteer=available (via SecurePuppeteerPDFGenerator)`);
  console.log(`[INFO] files=${chosen.length}`);

  const results: ConvertResult[] = [];
  let ok = 0;
  let fail = 0;

  // 1) Convert chosen files normally
  for (let i = 0; i < chosen.length; i++) {
    const src = chosen[i];
    const label = `${i + 1}/${chosen.length} ${path.basename(src.absPath)}`;
    console.log(`[INFO] convert: ${label}`);

    const r = await convertOne(
      src,
      {
        overwrite: CONFIG.overwrite,
        dryRun: CONFIG.dryRun,
        quality: CONFIG.quality,
        minPdfBytes: CONFIG.minPdfBytes,
      },
      {
        libreoffice: libreofficeAvailable,
        puppeteer: true, // always available
      }
    );

    results.push(r);
    manifest.results.push(r);

    if (r.ok) {
      ok++;
      console.log(
        `[INFO] ok: ${r.outRelPath.replace(/\\/g, "/")} (${(r.size / 1024).toFixed(1)} KB) via ${r.method}`
      );
    } else {
      fail++;
      console.log(
        `[ERROR] fail: ${path.basename(src.absPath)} (${r.error || "unknown error"})`
      );
    }
  }

  // 2) Rebuild invalid lib/pdf outputs from matching content sources (upgrade path)
  //    Example: lib/pdf/foo.pdf invalid -> rebuild from content/downloads/foo.mdx/xlsx/etc into lib-pdf output
  const invalidLibPdf = results.filter(
    (r) => r.source?.from === "lib/pdf" && !r.ok
  );

  if (invalidLibPdf.length > 0) {
    console.log(`[INFO] rebuild candidates=${invalidLibPdf.length}`);

    for (const bad of invalidLibPdf) {
      const src = bad.source!;
      const candidate = matchRebuildCandidate(src, chosenContent);

      if (!candidate) {
        manifest.rebuilds.push({
          libPdf: src.relPath.replace(/\\/g, "/"),
          action: "none",
          reason: "no matching content source",
        });
        continue;
      }

      // Rebuild into lib lane output path (same as the lib/pdf output location)
      const { outAbsPath, outRelPath } = chooseOutputPath(src);

      console.log(
        `[INFO] rebuild: ${path.basename(src.absPath)} -> from ${candidate.kind} (${candidate.relPath.replace(/\\/g, "/")})`
      );

      const rebuilt = await convertOne(
        { ...candidate, from: "content/downloads" }, // convert content source
        {
          overwrite: true, // force rebuild
          dryRun: CONFIG.dryRun,
          quality: CONFIG.quality,
          minPdfBytes: CONFIG.minPdfBytes,
        },
        {
          libreoffice: libreofficeAvailable,
          puppeteer: true, // always available
        }
      );

      // If rebuild succeeded, copy rebuilt output into lib output target
      // (rebuilt went to content-downloads by lane rules; we move it into lib-pdf output path)
      if (rebuilt.ok && !CONFIG.dryRun) {
        safeMkdir(path.dirname(outAbsPath));
        fs.copyFileSync(rebuilt.outAbsPath, outAbsPath);

        const st = fs.statSync(outAbsPath);
        const v = pdfLooksValid(outAbsPath, CONFIG.minPdfBytes);
        const finalOk = v.ok;

        manifest.rebuilds.push({
          libPdf: src.relPath.replace(/\\/g, "/"),
          fromContent: candidate.relPath.replace(/\\/g, "/"),
          method: rebuilt.method,
          out: outRelPath.replace(/\\/g, "/"),
          ok: finalOk,
          size: st.size,
        });

        if (finalOk) {
          console.log(
            `[INFO] rebuild ok: ${outRelPath.replace(/\\/g, "/")} (${(st.size / 1024).toFixed(1)} KB)`
          );
          ok++;
          fail--; // one less failure effectively
        } else {
          console.log(`[ERROR] rebuild fail: ${outRelPath} (${v.reason})`);
        }
      } else {
        manifest.rebuilds.push({
          libPdf: src.relPath.replace(/\\/g, "/"),
          fromContent: candidate.relPath.replace(/\\/g, "/"),
          ok: false,
          error: rebuilt.error || "rebuild failed",
        });
      }
    }
  }

  const msTotal = manifest.results.reduce((sum: number, r: ConvertResult) => sum + (r.ms || 0), 0);

  manifest.summary = {
    endedAt: nowIso(),
    ok,
    fail,
    ms: msTotal,
    outputs: {
      root: path.relative(CWD, CONFIG.outRoot).replace(/\\/g, "/"),
      content: path.join("public/assets/downloads", CONFIG.outContentDir).replace(/\\/g, "/"),
      lib: path.join("public/assets/downloads", CONFIG.outLibDir).replace(/\\/g, "/"),
      generated: path.join("public/assets/downloads", CONFIG.outGeneratedDir).replace(/\\/g, "/"),
    },
  };

  const manifestPath = path.join(CONFIG.outRoot, "conversion-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  console.log(`[INFO] done: ok=${ok} fail=${fail}`);
  console.log(`[INFO] manifest=${manifestPath}`);

  // Default behaviour: do NOT fail the entire run unless strict.
  if (CONFIG.strict && fail > 0) process.exit(1);
  process.exit(0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((e) => {
    console.error(`[ERROR] fatal: ${e?.message || String(e)}`);
    process.exit(1);
  });
}

export { main };