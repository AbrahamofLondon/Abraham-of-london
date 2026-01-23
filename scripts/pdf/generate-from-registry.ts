// scripts/pdf/generate-from-registry.ts
// SERVER-ONLY GENERATOR
// - Reads from scripts/pdf/pdf-registry.generated.ts
// - Renders using scripts/pdf/templates/index.ts
// - Writes output to registry outputPath (canonical)
// - Updates public/assets/downloads/manifest.json (non-empty, build-safe)
//
// IMPORTANT:
// - Do NOT import this from Next.js runtime.
// - Run via: npx tsx scripts/pdf/generate-from-registry.ts --id <assetId> --format A4 --quality premium --tier member

import fs from "fs";
import path from "path";
import { Command } from "commander";

import {
  GENERATED_PDF_CONFIGS,
  type PDFConfigGenerated,
  type PDFTier,
} from "./pdf-registry.generated";

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
  .description("Generate a PDF by registry id, writing to registry outputPath and updating manifest.json")
  .requiredOption("--id <id>", "Registry asset id")
  .option("--format <format>", "Paper format (A4,Letter,A3)", "A4")
  .option("--quality <quality>", "Quality (premium, enterprise)", "premium")
  .option("--tier <tier>", "Tier context for watermark + metadata (free,member,architect,inner-circle)", "member")
  .option("--outputRoot <dir>", "Filesystem output root for /assets/downloads", "./public/assets/downloads")
  .option("--forceFillable", "Force fillable rendering regardless of registry flags", false)
  .option("--forceInteractive", "Force interactive rendering regardless of registry flags", false)
  .option("--noManifest", "Do not update manifest.json", false)
  .option("--verbose", "Verbose logging", false);

type ManifestEntry = {
  id: string;
  title: string;
  path: string;
  bytes: number;
  sizeKB: number;
  type: string;
  tier: string;
  interactive: boolean;
  fillable: boolean;
  generatedAt: string;
  version: string;
};

type Manifest = {
  generatedAt: string;
  files: ManifestEntry[];
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

function findAsset(id: string): PDFConfigGenerated | null {
  return GENERATED_PDF_CONFIGS.find((a) => a.id === id) || null;
}

// Registry outputPath is a web path like "/assets/downloads/file.pdf"
// Map it to FS path using outputRoot.
function toFsPath(outputPath: string, outputRoot: string): string {
  const normalized = String(outputPath || "").replace(/\\/g, "/");

  const prefix = "/assets/downloads/";
  if (normalized.startsWith(prefix)) {
    const rel = normalized.slice(prefix.length);
    return path.join(outputRoot, rel);
  }

  // Fallback: if registry stored something odd, still write safely into outputRoot
  return path.join(outputRoot, path.basename(normalized || "output.pdf"));
}

function readManifest(manifestPath: string): Manifest {
  try {
    if (!fs.existsSync(manifestPath)) {
      return { generatedAt: new Date().toISOString(), files: [] };
    }
    const raw = fs.readFileSync(manifestPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("manifest invalid");
    if (!Array.isArray(parsed.files)) parsed.files = [];
    if (!parsed.generatedAt) parsed.generatedAt = new Date().toISOString();
    return parsed as Manifest;
  } catch {
    return { generatedAt: new Date().toISOString(), files: [] };
  }
}

function writeManifest(manifestPath: string, manifest: Manifest) {
  manifest.generatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

function upsertManifestEntry(manifest: Manifest, entry: ManifestEntry) {
  const idx = manifest.files.findIndex((f) => f.id === entry.id && f.path === entry.path);
  if (idx >= 0) manifest.files[idx] = entry;
  else manifest.files.push(entry);

  // Keep manifest stable and useful: sort by tier then title
  manifest.files.sort((a, b) => {
    const tierOrder: Record<string, number> = {
      "inner-circle": 0,
      architect: 1,
      member: 2,
      free: 3,
    };
    const ta = tierOrder[a.tier] ?? 99;
    const tb = tierOrder[b.tier] ?? 99;
    if (ta !== tb) return ta - tb;
    return a.title.localeCompare(b.title);
  });
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

  const asset = findAsset(id);
  if (!asset) {
    console.error(`❌ Asset not found in GENERATED_PDF_CONFIGS: "${id}"`);
    process.exit(1);
  }

  // Decide interactive/fillable (registry-first, with override flags)
  const interactive = Boolean(opts.forceInteractive) ? true : Boolean((asset as any).isInteractive);
  const fillable = Boolean(opts.forceFillable) ? true : Boolean((asset as any).isFillable);

  // Ensure output directory exists
  ensureDir(outputRoot);

  // Render
  if (verbose) {
    console.log("────────────────────────────────────────────────────────────────");
    console.log(`Generating: ${asset.title}`);
    console.log(`ID:        ${asset.id}`);
    console.log(`Type:      ${asset.type}`);
    console.log(`Tier:      ${tier} (watermark context)`);
    console.log(`Quality:   ${quality}`);
    console.log(`Format:    ${format}`);
    console.log(`Interactive: ${interactive}`);
    console.log(`Fillable:    ${fillable}`);
    console.log(`OutputRoot:  ${outputRoot}`);
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
  fs.writeFileSync(outFsPath, pdfBytes);

  const bytes = pdfBytes.byteLength;
  const sizeKB = Math.round(bytes / 1024);

  console.log(`✅ Generated (${pageCount} page): ${asset.outputPath}`);
  console.log(`   - File: ${outFsPath}`);
  console.log(`   - Size: ${sizeKB} KB`);

  if (warnings.length) {
    console.log("⚠️  Warnings:");
    for (const w of warnings) console.log(`   - ${w}`);
  }

  // Update manifest
  if (!noManifest) {
    const manifestPath = path.join(outputRoot, "manifest.json");
    const manifest = readManifest(manifestPath);

    const entry: ManifestEntry = {
      id: asset.id,
      title: asset.title,
      path: asset.outputPath,
      bytes,
      sizeKB,
      type: String(asset.type),
      tier: String(asset.tier),
      interactive,
      fillable,
      generatedAt: new Date().toISOString(),
      version: (asset as any).version || "1.0.0",
    };

    upsertManifestEntry(manifest, entry);
    writeManifest(manifestPath, manifest);

    console.log(`📌 Updated manifest: ${path.join(outputRoot, "manifest.json")}`);
    console.log(`   - Manifest files: ${manifest.files.length}`);
  }
}

main().catch((err) => {
  console.error("❌ Fatal:", err?.message || String(err));
  process.exit(1);
});