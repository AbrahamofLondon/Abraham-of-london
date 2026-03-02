/**
 * PDF REGISTRY GENERATOR — INVENTORY-FIRST (NO PLACEHOLDERS)
 * ------------------------------------------------------------
 * Source of truth = REAL downloadable files in repo:
 *   public/assets/downloads/**
 *
 * Writes:
 *  - lib/pdf/pdf-registry.generated.ts              (runtime SSOT import)
 *  - public/assets/downloads/pdf-manifest.json      (public manifest)
 *  - public/assets/downloads/pdf-duplicates.json    (audit trail)
 *
 * HARD POLICY:
 * - No placeholders.
 * - If something is corrupt / invalid / dangerously tiny: FAIL BUILD.
 * - Duplicates resolved deterministically (no “random winner”).
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type PDFFormat = "PDF" | "ZIP" | "BINARY";
type PaperFormat = "A4" | "Letter" | "A3" | "bundle";

type PDFType =
  | "editorial"
  | "framework"
  | "academic"
  | "strategic"
  | "tool"
  | "canvas"
  | "worksheet"
  | "assessment"
  | "journal"
  | "tracker"
  | "bundle"
  | "toolkit"
  | "playbook"
  | "brief"
  | "checklist"
  | "pack"
  | "blueprint"
  | "liturgy"
  | "study"
  | "other";

interface PDFRegistryEntry {
  id: string;
  title: string;
  type: PDFType;
  tier: string;

  // must start with "/"
  outputPath: string;

  description?: string;
  excerpt?: string;
  tags?: string[];

  paper?: PaperFormat;
  formats?: PaperFormat[];

  format: PDFFormat;

  isInteractive?: boolean;
  isFillable?: boolean;
  requiresAuth?: boolean;

  version?: string;
  author?: string;

  category?: string;
  categorySlug?: string;

  priority?: number;
  preload?: boolean;

  lastModified?: string;
  exists?: boolean;

  fileSizeBytes?: number;
  fileSizeHuman?: string;

  md5?: string;

  // Quality flag for small but valid files
  qualityFlag?: string | null;

  [k: string]: unknown;
}

type Bucket = "lib-pdf" | "content-downloads" | "other";

type EntryWithMeta = PDFRegistryEntry & {
  __abs: string;
  __bucket: Bucket;
  __bytes: number;
  __mtime: number;
  __ext: string;
};

// -----------------------------------------------------------------------------
// CONFIG
// -----------------------------------------------------------------------------

const ROOT = process.cwd();
const DOWNLOADS_ROOT = path.join(ROOT, "public", "assets", "downloads");

// runtime generated TS (imported by lib/pdf/registry.static.ts)
const OUT_GENERATED_TS = path.join(ROOT, "lib", "pdf", "pdf-registry.generated.ts");

// public outputs
const OUT_MANIFEST_JSON = path.join(ROOT, "public", "assets", "downloads", "pdf-manifest.json");
const OUT_DUPLICATES_JSON = path.join(ROOT, "public", "assets", "downloads", "pdf-duplicates.json");

// extensions actually served under /assets/downloads
const EXT_ALLOW = new Set([".pdf", ".zip"]);

// quality gates — SMART SIZE RULES
const MIN_PDF_KB_STANDARD = 12;   // blocks stubs, allows legit small templates
const MIN_PDF_KB_FILLABLE = 8;    // fillable forms can be smaller
const WARN_PDF_KB_SMALL = 50;     // warn-only threshold for “premium” expectations
const REQUIRE_PDF_HEADER = true;   // enforce %PDF

// bucket precedence (UX: prefer canonical “lib-pdf” if duplicates exist)
const BUCKET_RANK: Record<Bucket, number> = { "lib-pdf": 3, "content-downloads": 2, other: 1 };

// keep “generated” content stable
const VERSION_DEFAULT = "1.0.0";

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function normalizeSlash(p: string) {
  return p.replace(/\\/g, "/");
}

function toSlugId(fileBase: string): string {
  return String(fileBase || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromSlug(id: string): string {
  return String(id || "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function slugify(v: string) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function md5File(absPath: string): string {
  const buf = fs.readFileSync(absPath);
  return crypto.createHash("md5").update(buf).digest("hex");
}

function formatFromExt(ext: string): PDFFormat {
  if (ext === ".pdf") return "PDF";
  if (ext === ".zip") return "ZIP";
  return "BINARY";
}

function getBucketFromOutputPath(outputPath: string): Bucket {
  const s = outputPath.toLowerCase();
  if (s.includes("/assets/downloads/lib-pdf/")) return "lib-pdf";
  if (s.includes("/assets/downloads/content-downloads/")) return "content-downloads";
  return "other";
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

function kb(bytes: number) {
  return Math.round(bytes / 1024);
}

/**
 * Tiered PDF integrity validation
 * - Returns { ok: true, warn: string | null } for valid files
 * - Throws error for invalid/corrupt files
 */
function validatePdfIntegrity(abs: string, outputPath: string, bytes: number): { ok: true; warn: string | null } {
  const ext = path.extname(abs).toLowerCase();
  if (ext !== ".pdf") return { ok: true as const, warn: null as string | null };

  const sizeKb = Math.round(bytes / 1024);
  const isFillable = outputPath.toLowerCase().includes("fillable");

  const minKb = isFillable ? MIN_PDF_KB_FILLABLE : MIN_PDF_KB_STANDARD;

  if (sizeKb < minKb) {
    throw new Error(
      `[REGISTRY] PDF too small (<${minKb}KB): ${outputPath} (${sizeKb}KB) — likely stub/corrupt`,
    );
  }

  if (REQUIRE_PDF_HEADER && !isPdfHeader(abs)) {
    throw new Error(`[REGISTRY] Invalid PDF header (expected "%PDF"): ${outputPath}`);
  }

  // Warn only (do NOT fail) for “premium” expectations
  if (sizeKb < WARN_PDF_KB_SMALL) {
    return { ok: true as const, warn: `SMALL_PDF_${sizeKb}KB` };
  }

  return { ok: true as const, warn: null as string | null };
}

// Conservative heuristics. You can refine later without breaking SSOT.
function detectTierFromPath(outputPath: string): string {
  const s = outputPath.toLowerCase();
  if (s.includes("/inner-circle/") || s.includes("inner-circle")) return "inner-circle";
  if (s.includes("/architect/") || s.includes("architect") || s.includes("premium")) return "architect";
  if (s.includes("/member/") || s.includes("member") || s.includes("pro")) return "member";
  return "free";
}

function detectCategoryFromPath(outputPath: string, id: string): { category: string; categorySlug: string } {
  const s = outputPath.toLowerCase();

  // Prefer folder immediately under downloads as category (lib-pdf/content-downloads/etc).
  // This matches your current repo structure and avoids inventing categories.
  const parts = s.split("/").filter(Boolean);
  const idx = parts.lastIndexOf("downloads");
  const next = idx >= 0 ? parts[idx + 1] : "";
  const folder = next && next !== "pdf-manifest.json" ? next : "";

  if (folder) {
    const cat = folder.replace(/[^a-z0-9-]/g, "");
    return { category: cat, categorySlug: slugify(cat) };
  }

  // fallback via id keywords
  if (id.includes("legacy") || id.includes("architecture")) return { category: "legacy", categorySlug: "legacy" };
  if (id.includes("leadership") || id.includes("management")) return { category: "leadership", categorySlug: "leadership" };
  if (id.includes("theology") || id.includes("scripture")) return { category: "theology", categorySlug: "theology" };
  if (id.includes("purpose")) return { category: "purpose", categorySlug: "purpose" };

  return { category: "downloads", categorySlug: "downloads" };
}

function detectTypeFromId(id: string): PDFType {
  const s = id.toLowerCase();
  if (s.includes("canvas")) return "canvas";
  if (s.includes("worksheet")) return "worksheet";
  if (s.includes("assessment") || s.includes("diagnostic")) return "assessment";
  if (s.includes("journal") || s.includes("log")) return "journal";
  if (s.includes("tracker")) return "tracker";
  if (s.includes("bundle") || s.includes("pack") || s.includes("kit")) return "bundle";
  if (s.includes("toolkit")) return "toolkit";
  if (s.includes("playbook")) return "playbook";
  if (s.includes("brief")) return "brief";
  if (s.includes("checklist")) return "checklist";
  if (s.includes("blueprint")) return "blueprint";
  if (s.includes("liturgy")) return "liturgy";
  if (s.includes("study")) return "study";
  if (s.includes("framework")) return "framework";
  if (s.includes("editorial")) return "editorial";
  if (s.includes("strategic")) return "strategic";
  if (s.includes("academic")) return "academic";
  return "tool";
}

function detectFormatsFromId(id: string): PaperFormat[] {
  const s = id.toLowerCase();
  const formats: PaperFormat[] = [];
  if (s.includes("-a4") || s.includes("_a4")) formats.push("A4");
  if (s.includes("-letter") || s.includes("_letter")) formats.push("Letter");
  if (s.includes("-a3") || s.includes("_a3")) formats.push("A3");
  if (s.includes("bundle")) formats.push("bundle");
  return formats.length ? formats : ["A4"];
}

function walkFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  const stack = [root];

  while (stack.length) {
    const dir = stack.pop()!;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(abs);
      else out.push(abs);
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// VALIDATIONS (UX PROTECTION)
// -----------------------------------------------------------------------------

function assertSafeOutputPath(outputPath: string) {
  if (!outputPath.startsWith("/")) throw new Error(`[REGISTRY] outputPath must be public-relative (start with "/"): ${outputPath}`);
  if (outputPath.includes("..")) throw new Error(`[REGISTRY] outputPath must not contain "..": ${outputPath}`);
  if (!outputPath.startsWith("/assets/downloads/")) {
    throw new Error(`[REGISTRY] outputPath must live under /assets/downloads/: ${outputPath}`);
  }
}

// -----------------------------------------------------------------------------
// BUILD REGISTRY (INVENTORY-FIRST)
// -----------------------------------------------------------------------------

function buildEntries(): {
  entries: PDFRegistryEntry[];
  duplicates: Array<{ id: string; chosen: string; dropped: string[]; reason: string }>;
  stats: { scannedFiles: number; keptUnique: number; duplicatesResolved: number };
} {
  const files = walkFiles(DOWNLOADS_ROOT)
    .filter((abs) => EXT_ALLOW.has(path.extname(abs).toLowerCase()))
    .filter((abs) => path.basename(abs).toLowerCase() !== "pdf-manifest.json")
    .filter((abs) => path.basename(abs).toLowerCase() !== "pdf-duplicates.json");

  // Raw entries with meta
  const raw: EntryWithMeta[] = files.map((abs) => {
    const relFromPublic = normalizeSlash(path.relative(path.join(ROOT, "public"), abs));
    const outputPath = "/" + relFromPublic;

    assertSafeOutputPath(outputPath);

    const ext = path.extname(abs).toLowerCase();
    const base = path.basename(abs, ext);
    const id = toSlugId(base);

    const st = fs.statSync(abs);

    // ✅ SMART PDF INTEGRITY CHECK - capture warnings
    const integrity = validatePdfIntegrity(abs, outputPath, st.size);

    const tier = detectTierFromPath(outputPath);
    const { category, categorySlug } = detectCategoryFromPath(outputPath, id);

    const formats = detectFormatsFromId(id);
    const type = detectTypeFromId(id);

    const isFillable = id.includes("fillable");
    const isInteractive = id.includes("interactive") || isFillable;

    const bucket = getBucketFromOutputPath(outputPath);

    return {
      id,
      title: titleFromSlug(id),

      // Keep description/excerpt intentionally short + neutral (premium UX)
      description: `${titleFromSlug(id)} — Abraham of London resource.`,
      excerpt: `${titleFromSlug(id)}.`,

      outputPath,
      type,
      format: formatFromExt(ext),

      tier,
      formats,

      category,
      categorySlug,

      isFillable,
      isInteractive,
      requiresAuth: tier !== "free",

      exists: true,
      fileSizeBytes: st.size,
      fileSizeHuman: formatBytes(st.size),
      lastModified: st.mtime.toISOString(),

      md5: md5File(abs),
      version: VERSION_DEFAULT,

      // Add quality flag for small but valid files
      qualityFlag: integrity.warn,

      // priority can be refined later; keep stable now
      priority: tier === "architect" ? 5 : tier === "inner-circle" ? 3 : 10,
      preload: false,

      __abs: abs,
      __bucket: bucket,
      __bytes: st.size,
      __mtime: st.mtimeMs,
      __ext: ext,
    };
  });

  // Group by id
  const byId = new Map<string, EntryWithMeta[]>();
  for (const e of raw) {
    const arr = byId.get(e.id) || [];
    arr.push(e);
    byId.set(e.id, arr);
  }

  // Deduplicate deterministically
  const deduped: PDFRegistryEntry[] = [];
  const dupReport: Array<{ id: string; chosen: string; dropped: string[]; reason: string }> = [];

  for (const [id, list] of byId.entries()) {
    if (list.length === 1) {
      const { __abs, __bucket, __bytes, __mtime, __ext, ...clean } = list[0];
      deduped.push(clean);
      continue;
    }

    // Sort by:
    // 1) bucket precedence
    // 2) prefer PDFs over ZIPs if both exist (rare but possible)
    // 3) largest file
    // 4) newest mtime
    const sorted = [...list].sort((a, b) => {
      const br = BUCKET_RANK[b.__bucket] - BUCKET_RANK[a.__bucket];
      if (br !== 0) return br;

      const pdfFirst = (b.__ext === ".pdf" ? 1 : 0) - (a.__ext === ".pdf" ? 1 : 0);
      if (pdfFirst !== 0) return pdfFirst;

      const sz = b.__bytes - a.__bytes;
      if (sz !== 0) return sz;

      return b.__mtime - a.__mtime;
    });

    const winner = sorted[0];
    const losers = sorted.slice(1);

    const { __abs, __bucket, __bytes, __mtime, __ext, ...winnerClean } = winner;
    deduped.push(winnerClean);

    dupReport.push({
      id,
      chosen: winner.outputPath,
      dropped: losers.map((x) => x.outputPath),
      reason: `bucket(${winner.__bucket}) > type(${winner.__ext}) > size(${kb(winner.__bytes)}KB) > mtime`,
    });
  }

  // Stable ordering for clean diffs & predictable UX
  deduped.sort((a, b) => {
    const t = String(a.tier).localeCompare(String(b.tier));
    if (t !== 0) return t;
    const c = String(a.categorySlug || "").localeCompare(String(b.categorySlug || ""));
    if (c !== 0) return c;
    return String(a.id).localeCompare(String(b.id));
  });

  return {
    entries: deduped,
    duplicates: dupReport,
    stats: {
      scannedFiles: raw.length,
      keptUnique: deduped.length,
      duplicatesResolved: dupReport.length,
    },
  };
}

// -----------------------------------------------------------------------------
// OUTPUT WRITERS
// -----------------------------------------------------------------------------

function writeGeneratedTS(entries: PDFRegistryEntry[], nowISO: string) {
  ensureDir(path.dirname(OUT_GENERATED_TS));
  const json = JSON.stringify(entries, null, 2);

  // IMPORTANT:
  // - no `as const`
  // - import type from runtime registry to keep TS aligned
  const content = `// lib/pdf/pdf-registry.generated.ts
// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Generated: ${nowISO}

import type { PDFRegistryEntry } from "./registry.static";

export const GENERATED_PDF_CONFIGS: ReadonlyArray<PDFRegistryEntry> = ${json};
export const GENERATED_AT = "${nowISO}";
export const GENERATED_COUNT = ${entries.length};
`;

  fs.writeFileSync(OUT_GENERATED_TS, content, "utf-8");
}

function writeManifestJSON(entries: PDFRegistryEntry[], nowISO: string) {
  ensureDir(path.dirname(OUT_MANIFEST_JSON));

  const manifest = {
    generatedAt: nowISO,
    total: entries.length,
    available: entries.length,
    byTier: entries.reduce((acc, e) => {
      const k = String(e.tier || "unknown");
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byCategory: entries.reduce((acc, e) => {
      const k = String(e.categorySlug || e.category || "uncategorized");
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    files: entries.map((e) => ({
      id: e.id,
      title: e.title,
      path: e.outputPath,
      sizeBytes: e.fileSizeBytes ?? null,
      sizeHuman: (e as any).fileSizeHuman ?? null,
      tier: e.tier,
      category: e.category,
      categorySlug: e.categorySlug,
      type: e.type,
      format: e.format,
      lastModified: e.lastModified,
      md5: e.md5 ?? null,
      isFillable: Boolean(e.isFillable),
      isInteractive: Boolean(e.isInteractive),
      requiresAuth: Boolean(e.requiresAuth),
      formats: Array.isArray(e.formats) ? e.formats : [],
      priority: typeof e.priority === "number" ? e.priority : null,
      preload: Boolean(e.preload),
      version: String(e.version || VERSION_DEFAULT),
      qualityFlag: e.qualityFlag ?? null,
    })),
  };

  fs.writeFileSync(OUT_MANIFEST_JSON, JSON.stringify(manifest, null, 2), "utf-8");
}

function writeDuplicatesJSON(
  duplicates: Array<{ id: string; chosen: string; dropped: string[]; reason: string }>,
  nowISO: string,
) {
  ensureDir(path.dirname(OUT_DUPLICATES_JSON));

  const payload = {
    generatedAt: nowISO,
    totalDuplicateIds: duplicates.length,
    duplicates,
  };

  fs.writeFileSync(OUT_DUPLICATES_JSON, JSON.stringify(payload, null, 2), "utf-8");
}

// -----------------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------------

function main() {
  console.log("🛠️  [REGISTRY BUILD]: Inventorying public downloads (NO PLACEHOLDERS)...");
  if (!fs.existsSync(DOWNLOADS_ROOT)) {
    throw new Error(`[REGISTRY BUILD] Missing directory: ${DOWNLOADS_ROOT}`);
  }

  const { entries, duplicates, stats } = buildEntries();
  const nowISO = new Date().toISOString();

  writeGeneratedTS(entries, nowISO);
  writeManifestJSON(entries, nowISO);
  writeDuplicatesJSON(duplicates, nowISO);

  console.log(`✅ [SUCCESS]: Registry built with ${entries.length} records.`);
  console.log(`📊 Scanned files: ${stats.scannedFiles}`);
  console.log(`🧬 Unique kept:   ${stats.keptUnique}`);
  console.log(`⚠ Duplicates:    ${stats.duplicatesResolved}`);
  if (duplicates.length) {
    console.log(`⚠ DEDUPE: ${duplicates.length} duplicate IDs resolved by canonical precedence.`);
    for (const r of duplicates.slice(0, 15)) {
      console.log(`  • ${r.id}: kept ${r.chosen} (dropped ${r.dropped.length})`);
    }
    if (duplicates.length > 15) console.log(`  … ${duplicates.length - 15} more (see pdf-duplicates.json)`);
  }

  // Count files with quality warnings
  const warnedFiles = entries.filter(e => e.qualityFlag).length;
  if (warnedFiles > 0) {
    console.log(`⚠ Quality warnings: ${warnedFiles} files are below premium size threshold (${WARN_PDF_KB_SMALL}KB)`);
  }

  console.log(`📦 Wrote: ${path.relative(ROOT, OUT_GENERATED_TS)}`);
  console.log(`📄 Wrote: ${path.relative(ROOT, OUT_MANIFEST_JSON)}`);
  console.log(`🧾 Wrote: ${path.relative(ROOT, OUT_DUPLICATES_JSON)}`);
}

main();
export default main;