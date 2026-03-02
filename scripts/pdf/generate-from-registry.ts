// scripts/pdf/generate-from-registry.ts
// SERVER-ONLY GENERATOR
// - Reads from lib/pdf/registry.static.ts (generated inventory registry)
// - Renders using scripts/pdf/templates/index.ts
// - Writes output to registry outputPath (canonical)
// - Updates public/assets/downloads/pdf-manifest.json (build-safe)
//
// IMPORTANT:
// - Do NOT import this from Next.js runtime.
// - Run via: npx tsx scripts/pdf/generate-from-registry.ts --id <assetId> --format A4 --quality premium --tier member

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Command } from "commander";

import { GENERATED_PDF_CONFIGS, type PDFRegistryEntry } from "../../lib/pdf/registry.static";

import {
  renderAssetPDF,
  buildDefaultRenderOptions,
  type PaperFormat,
  type Quality,
  type Tier,
} from "./templates/index";

const program = new Command();

program
  .name("generate-from-registry")
  .description("Generate a PDF by registry id, writing to registry outputPath and updating pdf-manifest.json")
  .requiredOption("--id <id>", "Registry asset id")
  .option("--format <format>", "Paper format (A4,Letter,A3)", "A4")
  .option("--quality <quality>", "Quality (premium, enterprise)", "premium")
  .option("--tier <tier>", "Tier context for watermark + metadata (free,member,architect,inner-circle)", "member")
  .option("--outputRoot <dir>", "Filesystem output root for /assets/downloads", "./public/assets/downloads")
  .option("--forceFillable", "Force fillable rendering regardless of registry flags", false)
  .option("--forceInteractive", "Force interactive rendering regardless of registry flags", false)
  .option("--noManifest", "Do not update pdf-manifest.json", false)
  .option("--strictPdf", "Fail if generated output fails PDF integrity checks", true)
  .option("--minKb <n>", "Minimum acceptable PDF size KB (default 50)", "50")
  .option("--verbose", "Verbose logging", false);

type ManifestFile = {
  id: string;
  title: string;
  path: string;
  sizeBytes: number | null;
  sizeHuman: string | null;
  exists: boolean;
  tier: string;
  category: string | null;
  categorySlug: string | null;
  type: string;
  format: string;
  lastModified: string;
  md5: string | null;

  isFillable?: boolean;
  isInteractive?: boolean;
  requiresAuth?: boolean;
  formats?: string[];
  priority?: number | null;
  preload?: boolean;
  version?: string;
};

type Manifest = {
  generatedAt: string;
  total: number;
  available: number;
  byTier: Record<string, number>;
  byCategory: Record<string, number>;
  files: ManifestFile[];
};

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function isPaperFormat(x: string): x is PaperFormat {
  return x === "A4" || x === "Letter" || x === "A3";
}

function normalizeQuality(x: string): Quality {
  const s = String(x || "premium").toLowerCase();
  return s === "enterprise" ? "enterprise" : "premium";
}

function normalizeTier(x: string): Tier {
  const s = String(x || "member").toLowerCase();
  if (s === "free") return "free";
  if (s === "member") return "member";
  if (s === "architect") return "architect";
  return "inner-circle";
}

function findAsset(id: string): PDFRegistryEntry | null {
  return GENERATED_PDF_CONFIGS.find((a) => a.id === id) || null;
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

function md5Bytes(bytes: Uint8Array): string {
  return crypto.createHash("md5").update(bytes).digest("hex");
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  const digits = unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(digits)} ${units[unitIndex]}`;
}

// Registry outputPath is a web path like "/assets/downloads/lib-pdf/file.pdf"
// Map it to FS path using outputRoot (which corresponds to "./public/assets/downloads").
function toFsPath(outputPath: string, outputRoot: string): string {
  const normalized = String(outputPath || "").replace(/\\/g, "/");
  const prefix = "/assets/downloads/";
  if (normalized.startsWith(prefix)) {
    const rel = normalized.slice(prefix.length); // e.g. "lib-pdf/x.pdf"
    return path.join(outputRoot, rel);
  }
  // Hard safety: never write outside outputRoot
  return path.join(outputRoot, path.basename(normalized || "output.pdf"));
}

function readManifest(manifestPath: string): Manifest {
  try {
    if (!fs.existsSync(manifestPath)) {
      return { generatedAt: new Date().toISOString(), total: 0, available: 0, byTier: {}, byCategory: {}, files: [] };
    }
    const raw = fs.readFileSync(manifestPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("manifest invalid");
    if (!Array.isArray(parsed.files)) parsed.files = [];
    if (!parsed.byTier || typeof parsed.byTier !== "object") parsed.byTier = {};
    if (!parsed.byCategory || typeof parsed.byCategory !== "object") parsed.byCategory = {};
    if (!parsed.generatedAt) parsed.generatedAt = new Date().toISOString();
    if (typeof parsed.total !== "number") parsed.total = parsed.files.length;
    if (typeof parsed.available !== "number")
      parsed.available = parsed.files.filter((f: any) => Boolean(f?.exists)).length;
    return parsed as Manifest;
  } catch {
    return { generatedAt: new Date().toISOString(), total: 0, available: 0, byTier: {}, byCategory: {}, files: [] };
  }
}

function recomputeAggregates(manifest: Manifest) {
  manifest.total = manifest.files.length;
  manifest.available = manifest.files.filter((f) => Boolean(f.exists)).length;

  const byTier: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const f of manifest.files) {
    const tier = String(f.tier || "unknown");
    const cat = String(f.categorySlug || f.category || "uncategorized");
    byTier[tier] = (byTier[tier] || 0) + 1;
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  manifest.byTier = byTier;
  manifest.byCategory = byCategory;

  // Stable sort: tier then title then id
  const tierOrder: Record<string, number> = { "inner-circle": 0, architect: 1, member: 2, free: 3 };
  manifest.files.sort((a, b) => {
    const ta = tierOrder[String(a.tier)] ?? 99;
    const tb = tierOrder[String(b.tier)] ?? 99;
    if (ta !== tb) return ta - tb;
    const t = a.title.localeCompare(b.title);
    if (t !== 0) return t;
    return a.id.localeCompare(b.id);
  });
}

function writeManifestAtomic(manifestPath: string, manifest: Manifest) {
  ensureDir(path.dirname(manifestPath));
  manifest.generatedAt = new Date().toISOString();

  const tmp = manifestPath.replace(/\.json$/i, `.__tmp__.json`);
  fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2), "utf8");
  fs.renameSync(tmp, manifestPath);
}

function upsertManifestFile(manifest: Manifest, file: ManifestFile) {
  const idx = manifest.files.findIndex((f) => f.id === file.id);
  if (idx >= 0) manifest.files[idx] = file;
  else manifest.files.push(file);
  recomputeAggregates(manifest);
}

async function main() {
  program.parse(process.argv);
  const opts = program.opts();

  const id = String(opts.id || "").trim();
  const fmtRaw = String(opts.format || "A4").trim();
  const format: PaperFormat = isPaperFormat(fmtRaw) ? fmtRaw : "A4";
  const quality: Quality = normalizeQuality(opts.quality);
  const tier: Tier = normalizeTier(opts.tier);

  const outputRoot = String(opts.outputRoot || "./public/assets/downloads");
  const verbose = Boolean(opts.verbose);
  const noManifest = Boolean(opts.noManifest);
  const strictPdf = Boolean(opts.strictPdf);
  const minKb = Math.max(1, Number(opts.minKb || 50));

  const asset = findAsset(id);
  if (!asset) {
    console.error(`❌ Asset not found in GENERATED_PDF_CONFIGS: "${id}"`);
    process.exit(1);
  }

  // Decide interactive/fillable (registry-first, with override flags)
  const interactive = Boolean(opts.forceInteractive) ? true : Boolean((asset as any).isInteractive);
  const fillable = Boolean(opts.forceFillable) ? true : Boolean((asset as any).isFillable);

  ensureDir(outputRoot);

  if (verbose) {
    console.log("────────────────────────────────────────────────────────────────");
    console.log(`Generating:   ${asset.title}`);
    console.log(`ID:           ${asset.id}`);
    console.log(`Type:         ${asset.type}`);
    console.log(`Tier:         ${tier} (watermark context)`);
    console.log(`Quality:      ${quality}`);
    console.log(`Format:       ${format}`);
    console.log(`Interactive:  ${interactive}`);
    console.log(`Fillable:     ${fillable}`);
    console.log(`OutputRoot:   ${outputRoot}`);
    console.log(`OutputPath:   ${asset.outputPath}`);
    console.log("────────────────────────────────────────────────────────────────");
  }

  const renderOpts = buildDefaultRenderOptions({
    format,
    quality,
    tier,
    interactive,
    fillable,
    enableAcroForm: interactive || fillable,
  });

  const { pdfBytes, pageCount, warnings } = await renderAssetPDF(
    {
      id: asset.id,
      title: asset.title,
      description: (asset as any).description,
      excerpt: (asset as any).excerpt,
      type: asset.type as any,
      tier: asset.tier as any,
      category: (asset as any).category,
      tags: (asset as any).tags,
      isInteractive: Boolean((asset as any).isInteractive),
      isFillable: Boolean((asset as any).isFillable),
      requiresAuth: Boolean((asset as any).requiresAuth),
      version: (asset as any).version || "1.0.0",
    },
    renderOpts,
  );

  const outFsPath = toFsPath(asset.outputPath, outputRoot);
  ensureDir(path.dirname(outFsPath));

  // Atomic write (prevents half-written files on failure)
  const tmpPath = outFsPath.replace(/\.pdf$/i, `.__tmp__.pdf`);
  fs.writeFileSync(tmpPath, pdfBytes);

  const bytes = pdfBytes.byteLength;
  const sizeKB = Math.round(bytes / 1024);

  if (strictPdf) {
    if (sizeKB < minKb) {
      try { fs.unlinkSync(tmpPath); } catch {}
      throw new Error(`Generated PDF too small (<${minKb}KB): ${asset.outputPath} (${sizeKB}KB)`);
    }
    if (!isPdfHeader(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch {}
      throw new Error(`Generated file does not start with "%PDF": ${asset.outputPath}`);
    }
  }

  fs.renameSync(tmpPath, outFsPath);

  console.log(`✅ Generated (${pageCount} page): ${asset.outputPath}`);
  console.log(`   - File: ${outFsPath}`);
  console.log(`   - Size: ${sizeKB} KB`);

  if (warnings.length) {
    console.log("⚠️  Warnings:");
    for (const w of warnings) console.log(`   - ${w}`);
  }

  // Update pdf-manifest.json (aligned with inventory generator)
  if (!noManifest) {
    const manifestPath = path.join(outputRoot, "pdf-manifest.json");
    const manifest = readManifest(manifestPath);

    const file: ManifestFile = {
      id: asset.id,
      title: asset.title,
      path: asset.outputPath,
      sizeBytes: bytes,
      sizeHuman: formatBytes(bytes),
      exists: true,
      tier: String(asset.tier),
      category: (asset as any).category ? String((asset as any).category) : null,
      categorySlug: (asset as any).categorySlug ? String((asset as any).categorySlug) : null,
      type: String(asset.type),
      format: "PDF",
      lastModified: new Date().toISOString(),
      md5: md5Bytes(pdfBytes),

      isFillable: Boolean(fillable),
      isInteractive: Boolean(interactive),
      requiresAuth: Boolean((asset as any).requiresAuth),
      formats: Array.isArray((asset as any).formats) ? (asset as any).formats.map(String) : [],
      priority: typeof (asset as any).priority === "number" ? (asset as any).priority : null,
      preload: Boolean((asset as any).preload),
      version: String((asset as any).version || "1.0.0"),
    };

    upsertManifestFile(manifest, file);
    writeManifestAtomic(manifestPath, manifest);

    console.log(`📌 Updated manifest: ${manifestPath}`);
    console.log(`   - Manifest files: ${manifest.files.length}`);
  }
}

main().catch((err) => {
  console.error("❌ Fatal:", err?.message || String(err));
  process.exit(1);
});