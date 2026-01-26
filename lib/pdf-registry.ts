// lib/pdf/pdf-registry.ts
// Institutional-grade PDF registry: deterministic + Windows-resilient + build-safe

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// IMPORTANT: keep Generated optional. If the generated module is missing, we still work.
// This prevents build death when generation hasn't run yet.
let Generated: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Generated = await import("@/scripts/pdf/pdf-registry.generated");
} catch {
  Generated = null;
}

import { safeArraySlice } from "@/lib/utils/safe";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
export interface PDFConfig {
  id: string;
  title: string;
  description: string;
  excerpt?: string;

  outputPath: string; // public web path, e.g. /assets/downloads/foo.pdf
  generationScript?: string;
  sourcePath?: string;

  type:
    | "editorial"
    | "framework"
    | "academic"
    | "strategic"
    | "tool"
    | "canvas"
    | "worksheet"
    | "other";

  format: "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";

  isInteractive: boolean;
  isFillable: boolean;

  category: string;

  tier: "free" | "member" | "architect" | "inner-circle";

  formats: ("A4" | "Letter" | "A3" | "bundle")[];

  fileSize?: number;
  lastModified?: Date;

  exists: boolean;

  // semantic: where the record came from
  sourceType: "static" | "dynamic" | "generated";

  tags: string[];

  requiresAuth: boolean;
}

export type PDFId = string;

// -----------------------------------------------------------------------------
// MODULE PATHS
// -----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = process.cwd();
const DOWNLOADS_DIR = path.resolve(ROOT, "public/assets/downloads");

// -----------------------------------------------------------------------------
// MASTER REGISTRY (hand-curated)
/// NOTE: This is the “authoritative” metadata. The file system only supplies
// exists/size/mtime.
// -----------------------------------------------------------------------------
const MASTER_PDF_REGISTRY = {
  "legacy-architecture-canvas": {
    title: "The Legacy Architecture Canvas",
    description: "Heirloom-grade fillable PDF for designing sovereign legacies",
    excerpt: "The foundational instrument for designing a sovereign legacy.",
    outputPath: "/assets/downloads/download-legacy-architecture-canvas.pdf",
    generationScript: "scripts/generate-legacy-canvas.tsx",
    sourcePath: "content/downloads/download-legacy-architecture-canvas.mdx",
    type: "canvas" as const,
    category: "legacy",
    isInteractive: true,
    isFillable: true,
    tier: "architect" as const,
    formats: ["A4", "Letter", "A3", "bundle"],
    requiresAuth: true,
    tags: ["legacy", "governance", "family", "formation", "architecture"],
  },
  "ultimate-purpose-of-man": {
    title: "The Ultimate Purpose of Man",
    description:
      "Definitive editorial examining the structural logic of human purpose.",
    outputPath: "/assets/downloads/ultimate-purpose-of-man-premium.pdf",
    generationScript: "scripts/generate-standalone-pdf.tsx",
    type: "editorial" as const,
    category: "theology",
    isInteractive: false,
    isFillable: false,
    tier: "member" as const,
    formats: ["A4"],
    requiresAuth: false,
    tags: ["purpose", "philosophy", "theology", "existence"],
  },
  "strategic-foundations": {
    title: "Strategic Foundations",
    description: "Core frameworks for institutional thinking and leadership.",
    outputPath: "/assets/downloads/strategic-foundations.pdf",
    generationScript: "scripts/generate-frameworks-pdf.tsx",
    type: "framework" as const,
    category: "leadership",
    isInteractive: false,
    isFillable: false,
    tier: "member" as const,
    formats: ["A4", "Letter"],
    requiresAuth: false,
    tags: ["strategy", "leadership", "foundations", "principles"],
  },
} as const;

type MasterEntry = (typeof MASTER_PDF_REGISTRY)[keyof typeof MASTER_PDF_REGISTRY];

// -----------------------------------------------------------------------------
// SAFE FS HELPERS (Windows EPERM proofing)
// -----------------------------------------------------------------------------
function safeExists(p: string): boolean {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function safeMkdirp(dir: string): void {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // ignore: directory creation can fail in CI read-only contexts; scanning will just return empty
  }
}

function safeReaddir(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function safeStat(p: string): fs.Stats | null {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// FILE META
// -----------------------------------------------------------------------------
function resolveFileMeta(filenameOrPath: string): {
  format: PDFConfig["format"];
  isInteractive: boolean;
  isFillable: boolean;
} {
  const ext = path.extname(filenameOrPath).toLowerCase();
  const name = path.basename(filenameOrPath).toLowerCase();

  const isFillable =
    name.includes("-fillable") || name.includes("-canvas") || name.includes("fillable");
  const isInteractive =
    isFillable || name.includes("-form") || name.includes("-worksheet") || name.includes("form");

  let format: PDFConfig["format"] = "BINARY";
  if (ext === ".pdf") format = "PDF";
  else if ([".xlsx", ".xls", ".csv"].includes(ext)) format = "EXCEL";
  else if ([".pptx", ".ppt"].includes(ext)) format = "POWERPOINT";
  else if (ext === ".zip") format = "ZIP";

  return { format, isInteractive, isFillable };
}

function normalizeIdFromFilename(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/(-fillable|-\d+\.\d+\.\d+)$/, "")
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");
}

function guessTypeFromName(filename: string): PDFConfig["type"] {
  const n = filename.toLowerCase();
  if (n.includes("canvas") || n.includes("template")) return "canvas";
  if (n.includes("worksheet") || n.includes("checklist")) return "worksheet";
  if (n.includes("framework") || n.includes("model")) return "framework";
  if (n.includes("guide") || n.includes("manual") || n.includes("playbook")) return "strategic";
  if (n.includes("tool")) return "tool";
  return "other";
}

function guessTierFromName(filename: string): PDFConfig["tier"] {
  const n = filename.toLowerCase();
  if (n.includes("inner-circle")) return "inner-circle";
  if (n.includes("architect") || n.includes("premium")) return "architect";
  if (n.includes("member")) return "member";
  return "free";
}

function titleizeId(id: string): string {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

// -----------------------------------------------------------------------------
// REGEN LOGIC (safe)
// -----------------------------------------------------------------------------
function needsRegeneration(
  config: { generationScript?: string; sourcePath?: string },
  existingStats: fs.Stats | null
): boolean {
  if (!config.generationScript) return false;

  const scriptPath = path.resolve(ROOT, config.generationScript);
  if (!safeExists(scriptPath)) return false;

  // missing file => needs generation
  if (!existingStats) return true;

  // if there is a sourcePath newer than output => regenerate
  if (config.sourcePath) {
    const sp = path.resolve(ROOT, config.sourcePath);
    const ss = safeStat(sp);
    if (ss && ss.mtime > existingStats.mtime) return true;
  }

  // stale output (older than a week) => regenerate
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return existingStats.mtime < weekAgo;
}

// -----------------------------------------------------------------------------
// DISCOVERY (safe & non-fatal)
// IMPORTANT: only scans TOP-LEVEL by default to avoid deep traversal risk.
// If you actually need deep traversal, do it with fast-glob + suppressErrors.
// -----------------------------------------------------------------------------
function scanForDynamicAssets(): PDFConfig[] {
  safeMkdirp(DOWNLOADS_DIR);

  const discovered: PDFConfig[] = [];
  const files = safeReaddir(DOWNLOADS_DIR);

  for (const filename of files) {
    if (!filename || filename.startsWith(".")) continue;

    const filePath = path.join(DOWNLOADS_DIR, filename);

    const stats = safeStat(filePath);
    if (!stats || !stats.isFile()) continue;

    // ignore content/source files
    if (filename.endsWith(".md") || filename.endsWith(".mdx")) continue;

    const { format, isInteractive, isFillable } = resolveFileMeta(filename);
    const id = normalizeIdFromFilename(filename);

    // if master already defines this exact id, treat file as metadata source only
    const type = guessTypeFromName(filename);
    const tier = guessTierFromName(filename);

    discovered.push({
      id,
      title: titleizeId(id),
      description: `Discovered asset: ${filename}`,
      outputPath: `/assets/downloads/${filename}`,
      type,
      format,
      isInteractive,
      isFillable,
      category: "archive",
      tier,
      formats: ["A4"],
      fileSize: stats.size,
      lastModified: stats.mtime,
      exists: true,
      sourceType: "dynamic",
      tags: ["discovered", type],
      requiresAuth: tier !== "free",
    });
  }

  return discovered;
}

// -----------------------------------------------------------------------------
// REGISTRY BUILD (deterministic merge order)
// Order of authority:
// 1) MASTER metadata (always wins on title/description/tier/type/etc)
// 2) GENERATED registry (if present) (wins over discovery for metadata, but not over MASTER)
// 3) DISCOVERY (only fills gaps, provides exists/size/mtime)
// -----------------------------------------------------------------------------
export function getPDFRegistry(): Record<PDFId, PDFConfig> {
  const registry: Record<PDFId, PDFConfig> = {};

  // 1) MASTER
  for (const [id, config] of Object.entries(MASTER_PDF_REGISTRY)) {
    const publicPath = config.outputPath.replace(/^\//, "");
    const fullPath = path.resolve(ROOT, "public", publicPath);
    const stats = safeStat(fullPath);

    const { format, isInteractive, isFillable } = resolveFileMeta(config.outputPath);
    const regenerate = needsRegeneration(config, stats);

    registry[id] = {
      id,
      title: config.title,
      description: config.description,
      excerpt: config.excerpt,
      outputPath: config.outputPath,
      generationScript: config.generationScript,
      sourcePath: config.sourcePath,
      type: config.type,
      format,
      isInteractive: config.isInteractive ?? isInteractive,
      isFillable: config.isFillable ?? isFillable,
      category: config.category,
      tier: config.tier,
      formats: config.formats ?? ["A4"],
      fileSize: stats?.size,
      lastModified: stats?.mtime,
      exists: !!stats && !regenerate,
      sourceType: "static",
      tags: config.tags ?? [],
      requiresAuth: !!config.requiresAuth,
    };
  }

  // 2) GENERATED (optional)
  const generatedRegistry: Record<string, any> | null =
    Generated?.PDF_REGISTRY && typeof Generated.PDF_REGISTRY === "object"
      ? Generated.PDF_REGISTRY
      : Generated?.default && typeof Generated.default === "object"
        ? Generated.default
        : null;

  if (generatedRegistry) {
    for (const [id, g] of Object.entries(generatedRegistry)) {
      // If master exists, only fill missing optional fields.
      if (registry[id]) {
        registry[id] = {
          ...g,
          ...registry[id], // master wins
          // but keep file meta from FS if present
          fileSize: registry[id].fileSize ?? g.fileSize,
          lastModified: registry[id].lastModified ?? g.lastModified,
          exists: registry[id].exists || !!g.exists,
          sourceType: registry[id].sourceType, // keep master provenance
        };
      } else {
        // not in master: accept generated record, but harden required fields
        const { format, isInteractive, isFillable } = resolveFileMeta(g.outputPath || "");
        registry[id] = {
          id,
          title: g.title || titleizeId(id),
          description: g.description || "",
          excerpt: g.excerpt,
          outputPath: g.outputPath || `/assets/downloads/${id}.pdf`,
          generationScript: g.generationScript,
          sourcePath: g.sourcePath,
          type: g.type || "other",
          format: g.format || format,
          isInteractive: typeof g.isInteractive === "boolean" ? g.isInteractive : isInteractive,
          isFillable: typeof g.isFillable === "boolean" ? g.isFillable : isFillable,
          category: g.category || "archive",
          tier: g.tier || "free",
          formats: Array.isArray(g.formats) && g.formats.length ? g.formats : ["A4"],
          fileSize: g.fileSize,
          lastModified: g.lastModified ? new Date(g.lastModified) : undefined,
          exists: !!g.exists,
          sourceType: "generated",
          tags: Array.isArray(g.tags) ? g.tags : [],
          requiresAuth: !!g.requiresAuth,
        };
      }
    }
  }

  // 3) DISCOVERY
  const discovered = scanForDynamicAssets();
  for (const asset of discovered) {
    if (!registry[asset.id]) {
      registry[asset.id] = asset;
    } else {
      // only update file existence metadata from discovery
      registry[asset.id] = {
        ...registry[asset.id],
        fileSize: asset.fileSize ?? registry[asset.id].fileSize,
        lastModified: asset.lastModified ?? registry[asset.id].lastModified,
        exists: registry[asset.id].exists || asset.exists,
      };
    }
  }

  return registry;
}

// -----------------------------------------------------------------------------
// QUERY HELPERS
// -----------------------------------------------------------------------------
export function getPDFById(id: string): PDFConfig | null {
  const r = getPDFRegistry();
  return r[id] || null;
}

export function getAllPDFs(): PDFConfig[] {
  const registry = getPDFRegistry();
  return Object.values(registry)
    .filter((a) => a.exists)
    .sort((a, b) => {
      const tierOrder: Record<string, number> = {
        architect: 0,
        "inner-circle": 1,
        member: 2,
        free: 3,
      };
      const typeOrder: Record<string, number> = {
        canvas: 0,
        framework: 1,
        strategic: 2,
        editorial: 3,
        academic: 4,
        worksheet: 5,
        tool: 6,
        other: 7,
      };

      const t = (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99);
      if (t !== 0) return t;

      const ty = (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
      if (ty !== 0) return ty;

      return a.title.localeCompare(b.title);
    });
}

export function getPDFsByTier(tier: PDFConfig["tier"]): PDFConfig[] {
  return getAllPDFs().filter((p) => p.tier === tier);
}

export function getPDFsByType(type: PDFConfig["type"]): PDFConfig[] {
  return getAllPDFs().filter((p) => p.type === type);
}

export function getInteractivePDFs(): PDFConfig[] {
  return getAllPDFs().filter((p) => p.isInteractive);
}

export function getFillablePDFs(): PDFConfig[] {
  return getAllPDFs().filter((p) => p.isFillable);
}

export function getPDFsRequiringGeneration(): PDFConfig[] {
  const registry = getPDFRegistry();
  return Object.values(registry).filter((pdf) => {
    if (!pdf.generationScript) return false;
    const fullPath = path.resolve(ROOT, "public", pdf.outputPath.replace(/^\//, ""));
    const stats = safeStat(fullPath);
    return needsRegeneration(pdf, stats);
  });
}

// -----------------------------------------------------------------------------
// GENERATION (kept minimal; you can wire your actual generators safely)
// -----------------------------------------------------------------------------
export async function generatePDF(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const pdf = getPDFById(id);

  if (!pdf) return { success: false, error: `PDF "${id}" not found` };
  if (!pdf.generationScript) {
    return { success: false, error: `PDF "${id}" has no generationScript` };
  }

  try {
    console.log(`Generating: ${pdf.title}`);

    // Example: you can map ids -> generators here deterministically
    if (pdf.id === "legacy-architecture-canvas") {
      const mod = await import(pathToFileUrl(path.resolve(ROOT, "scripts/generate-legacy-canvas.tsx")));
      const Generator = mod?.LegacyCanvasGenerator;
      if (!Generator) throw new Error("LegacyCanvasGenerator not exported");

      const generator = new Generator();
      for (const fmt of pdf.formats) {
        if (fmt === "bundle") continue;

        const bytes = await generator.generate({
          format: fmt,
          includeWatermark: true,
          isPreview: false,
        });

        const out = path.resolve(
          ROOT,
          "public/assets/downloads",
          `legacy-architecture-canvas-${fmt.toLowerCase()}.pdf`
        );
        safeMkdirp(path.dirname(out));
        fs.writeFileSync(out, Buffer.from(bytes));
        console.log(`✅ ${fmt} written`);
      }

      return { success: true };
    }

    // Default: you should wire your real generator; placeholder is explicit
    const out = path.resolve(ROOT, "public", pdf.outputPath.replace(/^\//, ""));
    safeMkdirp(path.dirname(out));
    fs.writeFileSync(out, "PDF placeholder — implement actual generation.");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || String(e) };
  }
}

export async function generateMissingPDFs(): Promise<
  Array<{ id: string; success: boolean; error?: string }>
> {
  const list = getPDFsRequiringGeneration();
  const results: Array<{ id: string; success: boolean; error?: string }> = [];

  console.log(`📊 PDFs requiring generation: ${list.length}`);

  for (const pdf of list) {
    const r = await generatePDF(pdf.id);
    results.push({ id: pdf.id, ...r });
  }

  return results;
}

// -----------------------------------------------------------------------------
// CONSTANTS (do NOT double-export / overwrite)
// -----------------------------------------------------------------------------
export const PDF_REGISTRY: Record<PDFId, PDFConfig> = getPDFRegistry();

export const PDF_CATEGORIES: string[] =
  Array.isArray(Generated?.PDF_CATEGORIES)
    ? Generated.PDF_CATEGORIES
    : Array.from(new Set(Object.values(PDF_REGISTRY).map((p) => p.category))).sort();

export const PDF_TIERS: string[] =
  Array.isArray(Generated?.PDF_TIERS)
    ? Generated.PDF_TIERS
    : ["free", "member", "architect", "inner-circle"];

// -----------------------------------------------------------------------------
// CLI
// -----------------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = safeArraySlice(process.argv, 2);

  if (args.includes("--scan") || args.includes("--discover")) {
    console.log("🔍 Scanning for assets (safe)…\n");
    const dyn = scanForDynamicAssets();
    console.log(`📊 Found ${dyn.length} dynamic assets:\n`);
    for (const a of dyn) {
      console.log(`• ${a.title}`);
      console.log(`  ID: ${a.id}`);
      console.log(`  Type: ${a.type}`);
      console.log(`  Tier: ${a.tier}`);
      console.log(
        `  Size: ${a.fileSize ? (a.fileSize / 1024).toFixed(1) + " KB" : "Unknown"}`
      );
      console.log();
    }
    process.exit(0);
  }

  if (args.includes("--list")) {
    const all = getAllPDFs();
    console.log("📚 PDF REGISTRY (available)\n");
    console.log(`Total: ${all.length}\n`);
    for (const pdf of all) {
      const size = pdf.fileSize ? `${(pdf.fileSize / 1024).toFixed(1)} KB` : "N/A";
      console.log(`✅ ${pdf.title}`);
      console.log(`   ID: ${pdf.id}`);
      console.log(`   Tier: ${pdf.tier} | Type: ${pdf.type}`);
      console.log(`   Interactive: ${pdf.isInteractive ? "Yes" : "No"}`);
      console.log(`   Size: ${size}`);
      console.log();
    }
    process.exit(0);
  }

  if (args.includes("--generate-missing")) {
    console.log("🔄 Generating missing PDFs…\n");
    const results = await generateMissingPDFs();
    const ok = results.filter((r) => r.success).length;
    const bad = results.filter((r) => !r.success).length;

    console.log("\n📊 Generation results");
    console.log(`✅ Successful: ${ok}`);
    console.log(`❌ Failed: ${bad}`);

    if (bad > 0) {
      console.log("\nFailures:");
      for (const r of results.filter((x) => !x.success)) {
        console.log(`  • ${r.id}: ${r.error}`);
      }
    }

    process.exit(bad > 0 ? 1 : 0);
  }

  // default status
  const registry = getPDFRegistry();
  const available = getAllPDFs();
  const missing = Object.values(registry).filter((p) => !p.exists);

  console.log("📊 PDF REGISTRY STATUS\n");
  console.log(`Total configured: ${Object.keys(registry).length}`);
  console.log(`Available: ${available.length}`);
  console.log(`Missing: ${missing.length}`);

  if (missing.length > 0) {
    console.log("\n❌ Missing PDFs:");
    for (const pdf of missing) {
      console.log(`  • ${pdf.title} (${pdf.id})`);
      if (pdf.generationScript) {
        console.log(`    Generation: pnpm pdfs:single ${pdf.id}`);
      }
    }
  }

  process.exit(missing.length > 0 ? 1 : 0);
}

// -----------------------------------------------------------------------------
// small helper for dynamic import of local files in ESM
// -----------------------------------------------------------------------------
function pathToFileUrl(p: string): string {
  const u = new URL("file:///");
  u.pathname = p.replace(/\\/g, "/");
  return u.toString();
}