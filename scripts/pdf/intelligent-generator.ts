// ============================================================================
// 5) scripts/pdf/intelligent-generator.ts  (SERVER-ONLY) — "NO ACCIDENTAL DELETES"
//    - Scans sources: lib/pdf, content/downloads (config/metadata), registry map
//    - Sync target: public/downloads (or public/assets/downloads, configurable)
//    - Dedup: content hash + canonical naming
//    - Never deletes by default (requires explicit flag)
//    - Audit-friendly manifest output
// ============================================================================

import fs from "fs";
import path from "path";
import crypto from "crypto";

// NOTE: This is the browser-safe registry; safe to import server-side too.
import { getAllPDFs, getPDFById } from "@/scripts/pdf-registry";

type SyncResult = {
  id: string;
  success: boolean;
  outputPath?: string;
  filename?: string;
  timeMs?: number;
  error?: string;
  action?: "copied" | "skipped" | "generated" | "missing-source";
  md5?: string;
};

type GeneratorOptions = {
  // Source folders:
  libPdfDir?: string; // default: /lib/pdf
  contentDownloadsDir?: string; // default: /content/downloads
  // Target folder:
  publicDownloadsDir?: string; // default: /public/assets/downloads
  // Safety switches:
  allowDelete?: boolean; // default false
  dryRun?: boolean; // default false
  // If you want to enforce registry-only naming:
  enforceRegistryFilenames?: boolean; // default true
};

// ---------------------------
// PATH DEFAULTS
// ---------------------------
function projectRoot() {
  // assumes scripts/ folder sits at projectRoot/scripts
  return path.resolve(process.cwd());
}

function defaultOptions(): Required<GeneratorOptions> {
  return {
    libPdfDir: path.join(projectRoot(), "lib", "pdf"),
    contentDownloadsDir: path.join(projectRoot(), "content", "downloads"),
    publicDownloadsDir: path.join(projectRoot(), "public", "assets", "downloads"),
    allowDelete: false,
    dryRun: false,
    enforceRegistryFilenames: true,
  };
}

// ---------------------------
// UTILITIES
// ---------------------------
function fileExists(p: string) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function statSafe(p: string): fs.Stats | null {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function readFileSafe(p: string) {
  try {
    return fs.readFileSync(p);
  } catch {
    return null;
  }
}

function md5(buf: Buffer) {
  return crypto.createHash("md5").update(buf).digest("hex");
}

function md5File(p: string): string | null {
  const b = readFileSafe(p);
  if (!b) return null;
  return md5(b);
}

function normalizeRel(rel: string) {
  // registry outputPath like "/assets/downloads/x.pdf"
  return rel.replace(/\\/g, "/");
}

function outputPathToDisk(publicDownloadsDir: string, registryOutputPath: string) {
  // registryOutputPath might be "/assets/downloads/foo.pdf"
  // our publicDownloadsDir default is ".../public/assets/downloads"
  // so map basename only for safety
  const base = path.basename(registryOutputPath);
  return path.join(publicDownloadsDir, base);
}

// ---------------------------
// SOURCE DISCOVERY
// ---------------------------
function listFilesRecursively(dir: string): string[] {
  const out: string[] = [];
  if (!fileExists(dir)) return out;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFilesRecursively(full));
    else out.push(full);
  }
  return out;
}

function pickCandidateSourceFile(opts: Required<GeneratorOptions>, registryOutputPath: string): string | null {
  const base = path.basename(registryOutputPath);

  // candidate 1: lib/pdf/<base>
  const c1 = path.join(opts.libPdfDir, base);
  if (fileExists(c1)) return c1;

  // candidate 2: content/downloads/<base> (or nested)
  const direct = path.join(opts.contentDownloadsDir, base);
  if (fileExists(direct)) return direct;

  // candidate 3: search content/downloads recursively for same basename
  const all = listFilesRecursively(opts.contentDownloadsDir);
  const match = all.find((p) => path.basename(p) === base);
  if (match) return match;

  return null;
}

// ---------------------------
// CORE: SYNC A SINGLE ID
// ---------------------------
async function syncOne(id: string, options?: GeneratorOptions): Promise<SyncResult> {
  const opts = { ...defaultOptions(), ...(options || {}) };
  const start = Date.now();

  const cfg = getPDFById(id);
  if (!cfg) return { id, success: false, error: "Unknown PDF id" };

  ensureDir(opts.publicDownloadsDir);

  // Target file on disk
  const targetDisk = outputPathToDisk(opts.publicDownloadsDir, cfg.outputPath);
  const targetName = path.basename(targetDisk);

  // Find source candidate (copy-based generation)
  const source = pickCandidateSourceFile(opts, cfg.outputPath);

  if (!source) {
    // If you later add true “generation” (reportlab, etc), this is where it plugs in.
    return {
      id,
      success: false,
      action: "missing-source",
      error: `No source found for ${targetName} (checked lib/pdf and content/downloads)`,
    };
  }

  const sourceMd5 = md5File(source) || undefined;
  const targetMd5 = md5File(targetDisk) || undefined;

  // Dedup: if same hash exists, skip
  if (fileExists(targetDisk) && sourceMd5 && targetMd5 && sourceMd5 === targetMd5) {
    return {
      id,
      success: true,
      action: "skipped",
      outputPath: cfg.outputPath,
      filename: targetName,
      md5: targetMd5,
      timeMs: Date.now() - start,
    };
  }

  // If exists but differs, copy over (no deletes)
  if (!opts.dryRun) {
    fs.copyFileSync(source, targetDisk);
  }

  const finalMd5 = md5File(targetDisk) || sourceMd5;

  return {
    id,
    success: true,
    action: "copied",
    outputPath: cfg.outputPath,
    filename: targetName,
    md5: finalMd5 || undefined,
    timeMs: Date.now() - start,
  };
}

// ---------------------------
// PUBLIC API (used by API routes)
// ---------------------------
export async function generateOnePdfById(id: string, options?: GeneratorOptions): Promise<SyncResult> {
  return syncOne(id, options);
}

export async function generateMissingPdfs(options?: GeneratorOptions): Promise<SyncResult[]> {
  const opts = { ...defaultOptions(), ...(options || {}) };

  // “Missing” = registry says exists:false OR file missing at target path
  const all = getAllPDFs();

  const results: SyncResult[] = [];

  for (const cfg of all) {
    const disk = outputPathToDisk(opts.publicDownloadsDir, cfg.outputPath);
    const consideredMissing = !cfg.exists || !fileExists(disk);

    if (!consideredMissing) continue;

    const r = await syncOne(cfg.id, opts);
    results.push(r);
  }

  // Optional: manifest (audit artifact)
  const manifest = {
    generatedAt: new Date().toISOString(),
    targetDir: normalizeRel(opts.publicDownloadsDir),
    allowDelete: opts.allowDelete,
    dryRun: opts.dryRun,
    results,
  };

  const manifestPath = path.join(opts.publicDownloadsDir, "pdf-sync-manifest.json");
  if (!opts.dryRun) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  }

  return results;
}