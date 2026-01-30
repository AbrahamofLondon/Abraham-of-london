// scripts/optimize-images.js — PRODUCTION-GRADED, WINDOWS-SAFE, CI-FRIENDLY (ESM)
// Purpose: deterministically optimize images from known source dirs into /public/optimized-images
// Notes:
// - Uses Sharp if available; otherwise exits with clear error.
// - Never silently no-ops: always prints a run banner + summary.
// - Windows-safe “run directly” detection: always executes when run as a script.
// - Smart: skips up-to-date outputs unless --force.
// - Generates: optimized original format + WebP for raster; optional AVIF with rules.
// - Copies: SVG/GIF as-is (no rasterization).
// - Produces a JSON report in outputDir.

import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { fileURLToPath } from "url";

// ----------------------------------------------------------------------------
// Banner
// ----------------------------------------------------------------------------
const BOLD_MAGENTA = "\x1b[1;35m";
const BOLD_WHITE = "\x1b[1;37m";
const RESET = "\x1b[0m";

console.log(`${BOLD_MAGENTA}🚀 ENTERPRISE IMAGE OPTIMIZER (PRODUCTION)${RESET}`);
console.log(`${BOLD_WHITE}════════════════════════════════════════════════════════════════════${RESET}`);

// ----------------------------------------------------------------------------
// Paths
// ----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------------------------------
// Args / Env
// ----------------------------------------------------------------------------
const ARGV = new Set(process.argv.slice(2));
const bool = (flag, envKey, fallback = false) => {
  if (ARGV.has(flag)) return true;
  if (envKey && process.env[envKey] != null) {
    const v = String(process.env[envKey]).toLowerCase().trim();
    if (["1", "true", "yes", "y", "on"].includes(v)) return true;
    if (["0", "false", "no", "n", "off"].includes(v)) return false;
  }
  return fallback;
};

const num = (flag, envKey, fallback) => {
  const arg = process.argv.find((x) => x.startsWith(`${flag}=`));
  if (arg) {
    const n = Number(arg.split("=", 2)[1]);
    return Number.isFinite(n) ? n : fallback;
  }
  if (envKey && process.env[envKey] != null) {
    const n = Number(process.env[envKey]);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
};

const str = (flag, envKey, fallback) => {
  const arg = process.argv.find((x) => x.startsWith(`${flag}=`));
  if (arg) return arg.split("=", 2)[1] ?? fallback;
  if (envKey && process.env[envKey] != null) return String(process.env[envKey]);
  return fallback;
};

// ----------------------------------------------------------------------------
// Config (sane defaults, override via flags/env if needed)
// ----------------------------------------------------------------------------
const CONFIG = {
  // Source & Output
  sourceDirs: [
    path.join(__dirname, "../public/assets/images"),
    path.join(__dirname, "../public/images"),
  ],
  outputDir: path.join(__dirname, "../public/optimized-images"),

  // Supported extensions we will *consider* (some copied as-is)
  extensions: new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff", ".tif"]),

  // Behavior flags
  force: bool("--force", "OPTIMIZE_FORCE", false) || bool("-f", null, false),
  verbose: bool("--verbose", "OPTIMIZE_VERBOSE", false) || bool("-v", null, false),

  // Size / processing
  maxWidth: num("--maxWidth", "OPTIMIZE_MAX_WIDTH", 2560),
  maxHeight: num("--maxHeight", "OPTIMIZE_MAX_HEIGHT", 1440),
  concurrentLimit: Math.max(1, num("--concurrency", "OPTIMIZE_CONCURRENCY", Math.min(4, os.cpus().length || 4))),
  maxFileSizeBytes: num("--maxFileSizeBytes", "OPTIMIZE_MAX_FILE_SIZE_BYTES", 10 * 1024 * 1024), // 10MB

  // Formats
  generateWebp: bool("--webp", "OPTIMIZE_WEBP", true), // default ON
  generateAvif: bool("--avif", "OPTIMIZE_AVIF", false), // default OFF unless flag/env
  ultraQuality: bool("--ultra-quality", "ULTRA_QUALITY", false),

  // Smart strategy
  smartFormatStrategy: true,

  // AVIF decision rules
  avifRules: {
    minSizeBytesJpeg: 300_000, // only if JPEG >= 300KB
    minSizeBytesAny: 500_000,  // for other raster formats (png/webp) we usually skip anyway
    skipForPng: true,
    skipForWebpSources: true,
    skipForSmallImagesUnderPx: 800, // if both dims < 800, skip AVIF
  },

  // What to do with these formats
  copyAsIs: new Set([".svg", ".gif"]), // don't transcode
};

// Quality profiles (practical, stable, avoids exotic options that break between sharp versions)
const QUALITY = CONFIG.ultraQuality
  ? {
      jpeg: { quality: 92, progressive: true, mozjpeg: true },
      png: { compressionLevel: 9, palette: true },
      webp: { quality: 90, effort: 6 },
      avif: { quality: 82, effort: 6, speed: 6 },
    }
  : {
      jpeg: { quality: 85, progressive: true, mozjpeg: true },
      png: { compressionLevel: 9, palette: true },
      webp: { quality: 85, effort: 6 },
      avif: { quality: 80, effort: 6, speed: 6 },
    };

// ----------------------------------------------------------------------------
// Logger
// ----------------------------------------------------------------------------
const logger = {
  info: (msg) => console.log(`\x1b[36mℹ️\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m✅\x1b[0m ${msg}`),
  warning: (msg) => console.log(`\x1b[33m⚠️\x1b[0m ${msg}`),
  error: (msg) => console.error(`\x1b[31m❌\x1b[0m ${msg}`),
  debug: (msg) => CONFIG.verbose && console.log(`\x1b[90m🔎\x1b[0m ${msg}`),
  progress: (msg) => process.stdout.write(`\x1b[35m⏳\x1b[0m ${msg}`),
};

// ----------------------------------------------------------------------------
// Sharp loader (hard fail if missing; this is an optimizer)
// ----------------------------------------------------------------------------
async function loadSharp() {
  try {
    const mod = await import("sharp");
    const sharp = mod.default ?? mod;
    if (typeof sharp !== "function") throw new Error(`sharp import resolved to ${typeof sharp}`);
    return sharp;
  } catch (e) {
    throw new Error(
      `Sharp is required but could not be loaded. Install it (pnpm add -D sharp) or fix native deps.\nRoot error: ${e?.message || e}`
    );
  }
}

// ----------------------------------------------------------------------------
// Utilities
// ----------------------------------------------------------------------------
async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function statSafe(p) {
  try {
    const s = await fs.stat(p);
    return s;
  } catch {
    return null;
  }
}

function normalizeExt(ext) {
  const e = ext.toLowerCase();
  if (e === ".tif") return ".tiff";
  return e;
}

function replaceExt(fileName, newExtWithDot) {
  const base = path.basename(fileName, path.extname(fileName));
  return `${base}${newExtWithDot}`;
}

function toPosix(p) {
  return p.replace(/\\/g, "/");
}

function safeRel(from, to) {
  const rel = path.relative(from, to);
  // Avoid ".." leaking outside; keep it predictable
  return rel.split(path.sep).filter((seg) => seg && seg !== "..").join(path.sep);
}

// ----------------------------------------------------------------------------
// File discovery
// ----------------------------------------------------------------------------
async function collectFiles() {
  const out = [];
  const seen = new Set();

  for (const root of CONFIG.sourceDirs) {
    if (!(await exists(root))) {
      logger.warning(`Source dir missing: ${path.relative(process.cwd(), root)}`);
      continue;
    }

    const stack = [root];
    while (stack.length) {
      const cur = stack.pop();
      let entries;
      try {
        entries = await fs.readdir(cur, { withFileTypes: true });
      } catch (e) {
        logger.warning(`Cannot read dir: ${path.relative(process.cwd(), cur)} (${e.message})`);
        continue;
      }

      for (const ent of entries) {
        const full = path.join(cur, ent.name);

        if (ent.isDirectory()) {
          if (ent.name.startsWith(".") || ["node_modules", ".git", "__MACOSX"].includes(ent.name)) continue;
          stack.push(full);
          continue;
        }

        if (!ent.isFile()) continue;

        const ext = normalizeExt(path.extname(ent.name));
        if (!CONFIG.extensions.has(ext)) continue;

        const key = full.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        out.push({
          absPath: full,
          rootDir: root,
          relFromRoot: safeRel(root, full),
          name: ent.name,
          ext,
        });
      }
    }
  }

  return out;
}

// ----------------------------------------------------------------------------
// Smart decisions
// ----------------------------------------------------------------------------
function isRaster(ext) {
  return [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"].includes(ext);
}

function shouldResize(meta) {
  const w = meta?.width;
  const h = meta?.height;
  if (!w || !h) return false;
  return w > CONFIG.maxWidth || h > CONFIG.maxHeight;
}

function shouldGenerateWebp(ext) {
  if (!CONFIG.generateWebp) return false;
  if (!isRaster(ext)) return false;
  if (CONFIG.copyAsIs.has(ext)) return false;
  // For webp source: still allow recompress to webp (often worthwhile), but only if forced or resizing.
  return true;
}

function shouldGenerateAvif({ ext, sizeBytes, meta }) {
  if (!CONFIG.generateAvif) return false;
  if (!CONFIG.smartFormatStrategy) return true;
  if (!isRaster(ext)) return false;

  if (CONFIG.copyAsIs.has(ext)) return false;
  if (ext === ".png" && CONFIG.avifRules.skipForPng) return false;
  if (ext === ".webp" && CONFIG.avifRules.skipForWebpSources) return false;

  const w = meta?.width || 0;
  const h = meta?.height || 0;
  if (w && h && w < CONFIG.avifRules.skipForSmallImagesUnderPx && h < CONFIG.avifRules.skipForSmallImagesUnderPx) {
    return false;
  }

  if (ext === ".jpg" || ext === ".jpeg") {
    return sizeBytes >= CONFIG.avifRules.minSizeBytesJpeg;
  }

  return sizeBytes >= CONFIG.avifRules.minSizeBytesAny;
}

function outputsForFile(file) {
  // Always output:
  // - optimized original (or copy for svg/gif)
  // - webp for raster (optional)
  // - avif (optional, smart)
  return {
    originalOutName: file.name,
    webpOutName: replaceExt(file.name, ".webp"),
    avifOutName: replaceExt(file.name, ".avif"),
  };
}

function buildOutputPaths(file) {
  const relDir = path.dirname(file.relFromRoot);
  const baseOutDir = path.join(CONFIG.outputDir, relDir);

  const names = outputsForFile(file);
  return {
    outDir: baseOutDir,
    original: path.join(baseOutDir, names.originalOutName),
    webp: path.join(baseOutDir, names.webpOutName),
    avif: path.join(baseOutDir, names.avifOutName),
  };
}

async function isUpToDate(sourcePath, destPath) {
  if (CONFIG.force) return false;
  const src = await statSafe(sourcePath);
  const dst = await statSafe(destPath);
  if (!src || !dst) return false;
  // If dest newer than source: treat as up-to-date
  return dst.mtimeMs >= src.mtimeMs;
}

// ----------------------------------------------------------------------------
// Core processing
// ----------------------------------------------------------------------------
async function optimizeOne(sharp, file) {
  const results = [];
  const out = buildOutputPaths(file);

  await fs.mkdir(out.outDir, { recursive: true });

  const srcStat = await statSafe(file.absPath);
  if (!srcStat) {
    return [
      {
        src: file.absPath,
        out: out.original,
        format: file.ext.slice(1),
        status: "failed",
        reason: "source_stat_failed",
      },
    ];
  }

  if (srcStat.size === 0) {
    return [
      {
        src: file.absPath,
        out: out.original,
        format: file.ext.slice(1),
        status: "skipped",
        reason: "empty_file",
        originalSize: 0,
        optimizedSize: 0,
      },
    ];
  }

  if (srcStat.size > CONFIG.maxFileSizeBytes) {
    return [
      {
        src: file.absPath,
        out: out.original,
        format: file.ext.slice(1),
        status: "skipped",
        reason: "file_too_large",
        originalSize: srcStat.size,
        optimizedSize: 0,
      },
    ];
  }

  // SVG/GIF copied as-is (and only one output: original path)
  if (CONFIG.copyAsIs.has(file.ext)) {
    const up = await isUpToDate(file.absPath, out.original);
    if (up) {
      const dst = await statSafe(out.original);
      results.push({
        src: file.absPath,
        out: out.original,
        format: file.ext.slice(1),
        status: "skipped",
        reason: "up_to_date",
        originalSize: srcStat.size,
        optimizedSize: dst?.size ?? srcStat.size,
      });
      return results;
    }

    await fs.copyFile(file.absPath, out.original);
    const dst = await statSafe(out.original);
    results.push({
      src: file.absPath,
      out: out.original,
      format: file.ext.slice(1),
      status: "copied",
      reason: "copied_as_is",
      originalSize: srcStat.size,
      optimizedSize: dst?.size ?? srcStat.size,
      savings: (srcStat.size - (dst?.size ?? srcStat.size)) || 0,
    });
    return results;
  }

  // Read metadata once for smart decisions
  let meta = null;
  try {
    meta = await sharp(file.absPath, { failOnError: false }).metadata();
  } catch (e) {
    // We can still try to process without metadata (no resize)
    logger.debug(`Metadata read failed for ${file.name}: ${e.message}`);
    meta = null;
  }

  // 1) Optimized original (same extension)
  {
    const up = await isUpToDate(file.absPath, out.original);
    if (up) {
      const dst = await statSafe(out.original);
      results.push({
        src: file.absPath,
        out: out.original,
        format: file.ext.slice(1),
        status: "skipped",
        reason: "up_to_date",
        originalSize: srcStat.size,
        optimizedSize: dst?.size ?? 0,
      });
    } else {
      try {
        let img = sharp(file.absPath, { failOnError: false });
        if (meta && shouldResize(meta)) {
          img = img.resize(CONFIG.maxWidth, CONFIG.maxHeight, {
            fit: "inside",
            withoutEnlargement: true,
          });
        }

        if (file.ext === ".jpg" || file.ext === ".jpeg") {
          await img.jpeg(QUALITY.jpeg).toFile(out.original);
        } else if (file.ext === ".png") {
          await img.png(QUALITY.png).toFile(out.original);
        } else if (file.ext === ".webp") {
          await img.webp(QUALITY.webp).toFile(out.original);
        } else if (file.ext === ".bmp" || file.ext === ".tiff") {
          // Normalize to original extension path but encode safely:
          // - bmp/tiff support varies; attempt to re-encode as png to be stable.
          // If you truly want to keep bmp/tiff as bmp/tiff, change here.
          await img.png(QUALITY.png).toFile(out.original);
        } else {
          // Fallback: copy
          await fs.copyFile(file.absPath, out.original);
        }

        const dst = await statSafe(out.original);
        const optimizedSize = dst?.size ?? 0;
        results.push({
          src: file.absPath,
          out: out.original,
          format: file.ext.slice(1),
          status: "optimized",
          reason: "optimized_original",
          originalSize: srcStat.size,
          optimizedSize,
          savings: srcStat.size - optimizedSize,
          savingsPercent: srcStat.size ? (((srcStat.size - optimizedSize) / srcStat.size) * 100).toFixed(1) : "0",
          width: meta?.width ?? null,
          height: meta?.height ?? null,
        });
      } catch (e) {
        // Fallback: copy original to keep pipeline deterministic
        await fs.copyFile(file.absPath, out.original);
        const dst = await statSafe(out.original);
        results.push({
          src: file.absPath,
          out: out.original,
          format: file.ext.slice(1),
          status: "copied",
          reason: "optimize_failed_fallback_copy",
          error: e.message,
          originalSize: srcStat.size,
          optimizedSize: dst?.size ?? srcStat.size,
          savings: 0,
        });
      }
    }
  }

  // 2) WebP (optional)
  if (shouldGenerateWebp(file.ext)) {
    const up = await isUpToDate(file.absPath, out.webp);
    if (up) {
      const dst = await statSafe(out.webp);
      results.push({
        src: file.absPath,
        out: out.webp,
        format: "webp",
        status: "skipped",
        reason: "up_to_date",
        originalSize: srcStat.size,
        optimizedSize: dst?.size ?? 0,
      });
    } else {
      try {
        let img = sharp(file.absPath, { failOnError: false });
        if (meta && shouldResize(meta)) {
          img = img.resize(CONFIG.maxWidth, CONFIG.maxHeight, {
            fit: "inside",
            withoutEnlargement: true,
          });
        }
        await img.webp(QUALITY.webp).toFile(out.webp);
        const dst = await statSafe(out.webp);
        results.push({
          src: file.absPath,
          out: out.webp,
          format: "webp",
          status: "optimized",
          reason: "generated_webp",
          originalSize: srcStat.size,
          optimizedSize: dst?.size ?? 0,
          width: meta?.width ?? null,
          height: meta?.height ?? null,
        });
      } catch (e) {
        results.push({
          src: file.absPath,
          out: out.webp,
          format: "webp",
          status: "failed",
          reason: "webp_failed",
          error: e.message,
          originalSize: srcStat.size,
          optimizedSize: 0,
        });
      }
    }
  }

  // 3) AVIF (optional, smart)
  if (shouldGenerateAvif({ ext: file.ext, sizeBytes: srcStat.size, meta })) {
    const up = await isUpToDate(file.absPath, out.avif);
    if (up) {
      const dst = await statSafe(out.avif);
      results.push({
        src: file.absPath,
        out: out.avif,
        format: "avif",
        status: "skipped",
        reason: "up_to_date",
        originalSize: srcStat.size,
        optimizedSize: dst?.size ?? 0,
      });
    } else {
      try {
        let img = sharp(file.absPath, { failOnError: false });
        if (meta && shouldResize(meta)) {
          img = img.resize(CONFIG.maxWidth, CONFIG.maxHeight, {
            fit: "inside",
            withoutEnlargement: true,
          });
        }
        await img.avif(QUALITY.avif).toFile(out.avif);
        const dst = await statSafe(out.avif);
        results.push({
          src: file.absPath,
          out: out.avif,
          format: "avif",
          status: "optimized",
          reason: "generated_avif",
          originalSize: srcStat.size,
          optimizedSize: dst?.size ?? 0,
          width: meta?.width ?? null,
          height: meta?.height ?? null,
        });
      } catch (e) {
        // AVIF support can be missing in some sharp/libvips builds; log but don’t fail the run
        results.push({
          src: file.absPath,
          out: out.avif,
          format: "avif",
          status: "skipped",
          reason: "avif_not_supported_or_failed",
          error: e.message,
          originalSize: srcStat.size,
          optimizedSize: 0,
        });
      }
    }
  }

  return results;
}

// ----------------------------------------------------------------------------
// Concurrency control (simple, stable)
// ----------------------------------------------------------------------------
async function runPool(items, limit, worker) {
  const results = [];
  let idx = 0;

  const runners = Array.from({ length: limit }, async () => {
    while (idx < items.length) {
      const cur = items[idx++];
      try {
        const r = await worker(cur);
        results.push(...r);
      } catch (e) {
        results.push({
          src: cur?.absPath ?? "unknown",
          out: null,
          format: null,
          status: "failed",
          reason: "worker_threw",
          error: e?.message ?? String(e),
        });
      }
    }
  });

  await Promise.all(runners);
  return results;
}

// ----------------------------------------------------------------------------
// Reporting
// ----------------------------------------------------------------------------
function bytes(n) {
  if (!Number.isFinite(n)) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let x = n;
  let u = 0;
  while (x >= 1024 && u < units.length - 1) {
    x /= 1024;
    u++;
  }
  return `${x.toFixed(u === 0 ? 0 : 2)} ${units[u]}`;
}

function summarize(results, startedAt) {
  const durationMs = Date.now() - startedAt;

  const optimized = results.filter((r) => r.status === "optimized").length;
  const copied = results.filter((r) => r.status === "copied").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  const totalOriginal = results.reduce((s, r) => s + (r.originalSize || 0), 0);
  const totalOptimized = results.reduce((s, r) => s + (r.optimizedSize || 0), 0);

  const savings = totalOriginal - totalOptimized;
  const savingsPct = totalOriginal ? ((savings / totalOriginal) * 100).toFixed(1) : "0";

  const byFormat = {};
  for (const r of results) {
    const f = r.format || "unknown";
    byFormat[f] ||= { count: 0, optimized: 0, skipped: 0, failed: 0, copied: 0 };
    byFormat[f].count++;
    byFormat[f][r.status] = (byFormat[f][r.status] || 0) + 1;
  }

  return {
    durationMs,
    optimized,
    copied,
    skipped,
    failed,
    totalResults: results.length,
    totalOriginal,
    totalOptimized,
    savings,
    savingsPct,
    byFormat,
  };
}

async function writeReport(results, summary) {
  const report = {
    timestamp: new Date().toISOString(),
    config: {
      ...CONFIG,
      // avoid serializing Sets
      extensions: Array.from(CONFIG.extensions),
      copyAsIs: Array.from(CONFIG.copyAsIs),
    },
    quality: QUALITY,
    summary,
    results,
  };

  const reportPath = path.join(CONFIG.outputDir, "optimization-report.json");
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  return reportPath;
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
async function optimizeImages() {
  const startedAt = Date.now();

  logger.info(`ENTRYPOINT OK: node ${process.argv[1] ? toPosix(process.argv[1]) : "(unknown)"}`);
  logger.info(`Output: ${path.relative(process.cwd(), CONFIG.outputDir)}`);
  logger.info(`Mode: ${CONFIG.force ? "FORCE" : "SMART (skip up-to-date)"}`);
  logger.info(`Quality: ${CONFIG.ultraQuality ? "ULTRA" : "STANDARD"}`);
  logger.info(`Generate WebP: ${CONFIG.generateWebp ? "YES" : "NO"}`);
  logger.info(`Generate AVIF: ${CONFIG.generateAvif ? "YES (smart rules)" : "NO"}`);
  logger.info(`Max dims: ${CONFIG.maxWidth}×${CONFIG.maxHeight}`);
  logger.info(`Concurrency: ${CONFIG.concurrentLimit}`);

  await fs.mkdir(CONFIG.outputDir, { recursive: true });

  // Discover
  logger.info("Scanning source directories...");
  const files = await collectFiles();
  if (!files.length) {
    logger.warning("No image files found in configured source dirs.");
    return { success: true, summary: summarize([], startedAt), results: [] };
  }
  logger.success(`Found ${files.length} candidate files.`);

  // Sharp
  const sharp = await loadSharp();
  logger.success("Sharp loaded.");

  // Process
  let processed = 0;
  const total = files.length;

  const results = await runPool(files, CONFIG.concurrentLimit, async (file) => {
    processed++;
    if (processed % 10 === 0 || processed === 1 || processed === total) {
      const pct = Math.round((processed / total) * 100);
      logger.progress(`Processing ${processed}/${total} (${pct}%)...\r`);
    }
    return optimizeOne(sharp, file);
  });

  process.stdout.write("\n");

  const summary = summarize(results, startedAt);

  // Console summary
  console.log(`${BOLD_WHITE}════════════════════════════════════════════════════════════════════${RESET}`);
  logger.success(`Done in ${(summary.durationMs / 1000).toFixed(1)}s`);
  logger.info(`Results: optimized=${summary.optimized}, copied=${summary.copied}, skipped=${summary.skipped}, failed=${summary.failed}`);
  logger.info(`Size: ${bytes(summary.totalOriginal)} → ${bytes(summary.totalOptimized)} (saved ${bytes(summary.savings)} / ${summary.savingsPct}%)`);

  // Persist report
  const reportPath = await writeReport(results, summary);
  logger.success(`Report: ${path.relative(process.cwd(), reportPath)}`);

  // Exit code policy: only fail on real failures (not skips)
  const success = summary.failed === 0;
  return { success, summary, results, reportPath };
}

// ----------------------------------------------------------------------------
// Hard error handlers
// ----------------------------------------------------------------------------
process.on("uncaughtException", (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err?.message || err}`);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`UNHANDLED REJECTION: ${reason?.message || reason}`);
  process.exit(1);
});

// ----------------------------------------------------------------------------
// Exports
// ----------------------------------------------------------------------------
export { optimizeImages };

// ----------------------------------------------------------------------------
// Execute (no silent bounce; Windows-safe)
// ----------------------------------------------------------------------------
(async () => {
  try {
    const res = await optimizeImages();
    if (res.success) {
      logger.success("Optimization completed successfully.");
      process.exit(0);
    } else {
      logger.warning("Optimization completed with failures (see report).");
      process.exit(1);
    }
  } catch (e) {
    logger.error(`FATAL: ${e?.message || e}`);
    if (e?.stack) console.error(e.stack);
    process.exit(1);
  }
})();