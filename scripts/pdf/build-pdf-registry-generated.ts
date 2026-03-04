/**
 * PDF REGISTRY GENERATOR — INVENTORY-FIRST (NO PLACEHOLDERS)
 * ------------------------------------------------------------
 * Source of truth = REAL downloadable files in repo:
 *   public/assets/downloads/**
 *   public/downloads/briefs/**
 *
 * Writes:
 *  - lib/pdf/pdf-registry.generated.ts              (runtime SSOT import)
 *  - public/assets/downloads/pdf-manifest.json      (public manifest)
 *  - public/assets/downloads/pdf-duplicates.json    (audit trail)
 *  - public/assets/downloads/pdf-stubs.json         (audit report for skipped stubs)
 *
 * HARD POLICY (UPDATED):
 * - No placeholders in the registry.
 * - Corrupt/invalid PDFs (bad header / missing EOF) => FAIL BUILD.
 * - "Stub PDFs" (valid header+EOF but < MIN_KB_KEEP) => SKIP, WARN (do not fail build).
 * - Minimum keep size for PDFs: 7KB (fillable: 7KB too, unless allowlisted).
 * - Allowlist can override min size for legit small PDFs.
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

export interface PDFRegistryEntry {
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

type Bucket = "lib-pdf" | "content-downloads" | "briefs" | "other";

type EntryWithMeta = PDFRegistryEntry & {
  __abs: string;
  __bucket: Bucket;
  __bytes: number;
  __mtime: number;
  __ext: string;
};

type PdfAllowlist = {
  minSizeOverridesKb?: Record<string, number>;
  notes?: Record<string, string>;
};

type PdfStub = {
  outputPath: string;
  sizeBytes: number;
  sizeHuman: string;
  reason: string;
};

// -----------------------------------------------------------------------------
// CONFIG
// -----------------------------------------------------------------------------

const ROOT = process.cwd();

const ASSETS_DOWNLOADS_ROOT = path.join(ROOT, "public", "assets", "downloads");
const BRIEFS_ROOT = path.join(ROOT, "public", "downloads", "briefs");

// allowlist lives under assets downloads
const ALLOWLIST_JSON = path.join(ASSETS_DOWNLOADS_ROOT, "pdf-allowlist.json");

// runtime generated TS (imported by lib/pdf/registry.static.ts)
const OUT_GENERATED_TS = path.join(ROOT, "lib", "pdf", "pdf-registry.generated.ts");

// public outputs
const OUT_MANIFEST_JSON = path.join(ROOT, "public", "assets", "downloads", "pdf-manifest.json");
const OUT_DUPLICATES_JSON = path.join(ROOT, "public", "assets", "downloads", "pdf-duplicates.json");
const OUT_STUBS_JSON = path.join(ROOT, "public", "assets", "downloads", "pdf-stubs.json");

// extensions actually served
const EXT_ALLOW = new Set([".pdf", ".zip"]);

// UPDATED POLICY: keep PDFs >= 7KB; skip stubs below this threshold (warn only)
const MIN_KB_KEEP = 7;

// warning threshold (does not fail build)
const WARN_PDF_KB_SMALL = 50;

// integrity requirements (still fatal)
const REQUIRE_PDF_HEADER = true;
const REQUIRE_PDF_EOF = true;

// bucket precedence (UX: prefer canonical “lib-pdf” if duplicates exist)
const BUCKET_RANK: Record<Bucket, number> = {
  "lib-pdf": 3,
  "content-downloads": 2,
  briefs: 1,
  other: 0,
};

// keep generated content stable
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

// ✅ ADD THIS FUNCTION HERE
function kb(bytes: number) {
  return Math.round(bytes / 1024);
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
  if (s.includes("/downloads/briefs/")) return "briefs";
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

function hasPdfEOF(absPath: string): boolean {
  try {
    const st = fs.statSync(absPath);
    const readBytes = Math.min(4096, st.size);
    const fd = fs.openSync(absPath, "r");
    const buf = Buffer.alloc(readBytes);
    fs.readSync(fd, buf, 0, readBytes, st.size - readBytes);
    fs.closeSync(fd);
    return buf.toString("utf8").includes("%%EOF");
  } catch {
    return false;
  }
}

function readJsonIfExists<T>(absPath: string, fallback: T): T {
  try {
    if (!fs.existsSync(absPath)) return fallback;
    const raw = fs.readFileSync(absPath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readPdfAllowlist(): PdfAllowlist {
  return readJsonIfExists<PdfAllowlist>(ALLOWLIST_JSON, { minSizeOverridesKb: {}, notes: {} });
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
  if (!outputPath.startsWith("/assets/downloads/") && !outputPath.startsWith("/downloads/briefs/")) {
    throw new Error(`[REGISTRY] outputPath must live under /assets/downloads/ or /downloads/briefs/: ${outputPath}`);
  }
}

// -----------------------------------------------------------------------------
// PDF INTEGRITY POLICY (UPDATED)
// -----------------------------------------------------------------------------

type IntegrityOk = { kind: "ok"; warn: string | null };
type IntegritySkip = { kind: "skip"; warn: string; reason: string };
type IntegrityResult = IntegrityOk | IntegritySkip;

/**
 * Updated policy:
 * - Corrupt PDFs => throw (fail build)
 * - Valid PDFs < MIN_KB_KEEP and not allowlisted => skip + warn (stub)
 * - Valid PDFs >= MIN_KB_KEEP => include (warn if < WARN_PDF_KB_SMALL)
 * - Allowlist can override minimum size for specific files
 */
function validatePdfIntegrity(
  abs: string,
  outputPath: string,
  bytes: number,
  allowlist: PdfAllowlist
): IntegrityResult {
  const ext = path.extname(abs).toLowerCase();
  if (ext !== ".pdf") return { kind: "ok", warn: null };

  const sizeKb = Math.round(bytes / 1024);

  // Fatal integrity checks
  if (REQUIRE_PDF_HEADER && !isPdfHeader(abs)) {
    throw new Error(`[REGISTRY] Invalid PDF header (expected "%PDF"): ${outputPath}`);
  }
  if (REQUIRE_PDF_EOF && !hasPdfEOF(abs)) {
    throw new Error(`[REGISTRY] Invalid PDF EOF (missing "%%EOF"): ${outputPath}`);
  }

  const overrideMinKb = allowlist?.minSizeOverridesKb?.[outputPath];
  const minKb = typeof overrideMinKb === "number" ? Math.max(1, Math.floor(overrideMinKb)) : MIN_KB_KEEP;

  // Stub: valid but too small => skip + warn
  if (sizeKb < minKb && typeof overrideMinKb !== "number") {
    return {
      kind: "skip",
      warn: `STUB_SKIPPED_${sizeKb}KB`,
      reason: `Valid PDF but below keep threshold (${minKb}KB).`,
    };
  }

  // Included: warn if small (premium expectation)
  if (sizeKb < WARN_PDF_KB_SMALL) {
    const note = allowlist?.notes?.[outputPath];
    return { kind: "ok", warn: note ? `SMALL_PDF_${sizeKb}KB_ALLOWLISTED` : `SMALL_PDF_${sizeKb}KB` };
  }

  return { kind: "ok", warn: null };
}

// -----------------------------------------------------------------------------
// DETECTORS
// -----------------------------------------------------------------------------

function detectTierFromPath(outputPath: string): string {
  const s = outputPath.toLowerCase();
  if (s.includes("/inner-circle/") || s.includes("inner-circle")) return "inner-circle";
  if (s.includes("/architect/") || s.includes("architect") || s.includes("premium")) return "architect";
  if (s.includes("/member/") || s.includes("member") || s.includes("pro")) return "member";
  return "free";
}

function detectCategoryFromPath(outputPath: string, id: string): { category: string; categorySlug: string } {
  const s = outputPath.toLowerCase();

  // Prefer folder immediately under downloads/briefs as category
  const parts = s.split("/").filter(Boolean);
  const idx = Math.max(parts.lastIndexOf("downloads"), parts.lastIndexOf("briefs"));
  const next = idx >= 0 && idx < parts.length - 1 ? parts[idx + 1] : "";
  const folder = next && next !== "pdf-manifest.json" ? next : "";

  if (folder) {
    const cat = folder.replace(/[^a-z0-9-]/g, "");
    return { category: cat, categorySlug: slugify(cat) };
  }

  if (id.startsWith("fr-") || id.startsWith("ia-") || id.startsWith("si-")) {
    return { category: "briefs", categorySlug: "briefs" };
  }

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

// -----------------------------------------------------------------------------
// BUILD REGISTRY (INVENTORY-FIRST)
// -----------------------------------------------------------------------------

function buildEntries(): {
  entries: PDFRegistryEntry[];
  duplicates: Array<{ id: string; chosen: string; dropped: string[]; reason: string }>;
  stubs: PdfStub[];
  stats: { scannedFiles: number; keptUnique: number; duplicatesResolved: number; stubsSkipped: number };
} {
  const files = [...walkFiles(ASSETS_DOWNLOADS_ROOT), ...walkFiles(BRIEFS_ROOT)]
    .filter((abs) => EXT_ALLOW.has(path.extname(abs).toLowerCase()))
    .filter((abs) => {
      const base = path.basename(abs).toLowerCase();
      return base !== "pdf-manifest.json" && base !== "pdf-duplicates.json" && base !== "pdf-stubs.json";
    });

  const allowlist = readPdfAllowlist();

  const raw: EntryWithMeta[] = [];
  const stubs: PdfStub[] = [];

  for (const abs of files) {
    const relFromPublic = normalizeSlash(path.relative(path.join(ROOT, "public"), abs));
    const outputPath = "/" + relFromPublic;

    assertSafeOutputPath(outputPath);

    const ext = path.extname(abs).toLowerCase();
    const base = path.basename(abs, ext);
    const id = toSlugId(base);

    const st = fs.statSync(abs);

    const integrity = validatePdfIntegrity(abs, outputPath, st.size, allowlist);

    if (integrity.kind === "skip") {
      stubs.push({
        outputPath,
        sizeBytes: st.size,
        sizeHuman: formatBytes(st.size),
        reason: integrity.reason,
      });
      continue;
    }

    const tier = detectTierFromPath(outputPath);
    const { category, categorySlug } = detectCategoryFromPath(outputPath, id);

    const formats = detectFormatsFromId(id);
    const type = detectTypeFromId(id);

    const isFillable = id.includes("fillable");
    const isInteractive = id.includes("interactive") || isFillable;

    const bucket = getBucketFromOutputPath(outputPath);

    raw.push({
      id,
      title: titleFromSlug(id),
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
      qualityFlag: integrity.warn,
      priority: tier === "architect" ? 5 : tier === "inner-circle" ? 3 : 10,
      preload: false,
      __abs: abs,
      __bucket: bucket,
      __bytes: st.size,
      __mtime: st.mtimeMs,
      __ext: ext,
    });
  }

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
    stubs,
    stats: {
      scannedFiles: files.length,
      keptUnique: deduped.length,
      duplicatesResolved: dupReport.length,
      stubsSkipped: stubs.length,
    },
  };
}

// -----------------------------------------------------------------------------
// OUTPUT WRITERS
// -----------------------------------------------------------------------------

function writeGeneratedTS(entries: PDFRegistryEntry[], nowISO: string) {
  ensureDir(path.dirname(OUT_GENERATED_TS));
  const json = JSON.stringify(entries, null, 2);

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
    minKbKeep: MIN_KB_KEEP,
    warnKbSmall: WARN_PDF_KB_SMALL,
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
  nowISO: string
) {
  ensureDir(path.dirname(OUT_DUPLICATES_JSON));

  const payload = {
    generatedAt: nowISO,
    totalDuplicateIds: duplicates.length,
    duplicates,
  };

  fs.writeFileSync(OUT_DUPLICATES_JSON, JSON.stringify(payload, null, 2), "utf-8");
}

function writeStubsJSON(stubs: PdfStub[], nowISO: string) {
  ensureDir(path.dirname(OUT_STUBS_JSON));

  const payload = {
    generatedAt: nowISO,
    total: stubs.length,
    stubs: stubs
      .slice()
      .sort((a, b) => a.outputPath.localeCompare(b.outputPath)),
  };

  fs.writeFileSync(OUT_STUBS_JSON, JSON.stringify(payload, null, 2), "utf-8");
}

// -----------------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------------

function main() {
  console.log("🛠️  [REGISTRY BUILD]: Inventorying public downloads (NO PLACEHOLDERS)...");
  console.log(`📁 Scanning: ${path.relative(ROOT, ASSETS_DOWNLOADS_ROOT)}`);
  console.log(`📁 Scanning: ${path.relative(ROOT, BRIEFS_ROOT)}`);
  console.log(`🧱 Policy: keep PDFs >= ${MIN_KB_KEEP}KB; skip smaller stubs (warn only). Corrupt PDFs still fail.`);

  const { entries, duplicates, stubs, stats } = buildEntries();
  const nowISO = new Date().toISOString();

  writeGeneratedTS(entries, nowISO);
  writeManifestJSON(entries, nowISO);
  writeDuplicatesJSON(duplicates, nowISO);
  writeStubsJSON(stubs, nowISO);

  console.log(`✅ [SUCCESS]: Registry built with ${entries.length} records.`);
  console.log(`📊 Scanned files: ${stats.scannedFiles}`);
  console.log(`🧬 Unique kept:   ${stats.keptUnique}`);
  console.log(`⚠ Duplicates:    ${stats.duplicatesResolved}`);
  console.log(`🧱 Stubs skipped: ${stats.stubsSkipped} (see pdf-stubs.json)`);

  if (duplicates.length) {
    console.log(`⚠ DEDUPE: ${duplicates.length} duplicate IDs resolved by canonical precedence.`);
    for (const r of duplicates.slice(0, 15)) {
      console.log(`  • ${r.id}: kept ${r.chosen} (dropped ${r.dropped.length})`);
    }
    if (duplicates.length > 15) console.log(`  … ${duplicates.length - 15} more (see pdf-duplicates.json)`);
  }

  if (stubs.length) {
    console.warn(`⚠ [REGISTRY]: Stub PDFs skipped (valid but < ${MIN_KB_KEEP}KB): ${stubs.length}`);
    for (const s of stubs.slice(0, 15)) {
      console.warn(`  • ${s.outputPath} (${s.sizeHuman}) — ${s.reason}`);
    }
    if (stubs.length > 15) console.warn(`  … ${stubs.length - 15} more (see pdf-stubs.json)`);
  }

  const warnedFiles = entries.filter((e) => e.qualityFlag).length;
  if (warnedFiles > 0) {
    console.log(`⚠ Quality warnings: ${warnedFiles} included files are below ${WARN_PDF_KB_SMALL}KB (warn-only).`);
  }

  console.log(`📦 Wrote: ${path.relative(ROOT, OUT_GENERATED_TS)}`);
  console.log(`📄 Wrote: ${path.relative(ROOT, OUT_MANIFEST_JSON)}`);
  console.log(`🧾 Wrote: ${path.relative(ROOT, OUT_DUPLICATES_JSON)}`);
  console.log(`🧱 Wrote: ${path.relative(ROOT, OUT_STUBS_JSON)}`);
}

main();
export default main;