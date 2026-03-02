// scripts/pdf/intelligent-generator.ts
/* scripts/pdf/intelligent-generator.ts — INVENTORY-FIRST SYNC (NO PLACEHOLDERS)
 * ----------------------------------------------------------------------------
 * Purpose:
 * - Reconcile sources (lib/pdf + content/downloads) into public/assets/downloads
 * - Deterministic paths: /assets/downloads/{lib-pdf|content-downloads}/<id>.pdf
 * - Never generate placeholders.
 *
 * This script does NOT render MDX/Office -> PDF.
 * That is handled by unified generator / converters.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

type SourceKind = "pdf";

export type SyncResult = {
  id: string;
  success: boolean;
  action: "copied" | "skipped" | "missing-source" | "invalid-source" | "error";
  sourcePath?: string;
  outputPath?: string;
  md5?: string;
  bytes?: number;
  error?: string;
};

type Options = {
  libPdfDir: string;
  contentDownloadsDir: string;
  publicDownloadsDir: string;
  overwrite: boolean;
  dryRun: boolean;
};

function root() {
  return process.cwd();
}

function defaults(): Options {
  return {
    libPdfDir: path.join(root(), "lib", "pdf"),
    contentDownloadsDir: path.join(root(), "content", "downloads"),
    publicDownloadsDir: path.join(root(), "public", "assets", "downloads"),
    overwrite: false,
    dryRun: false,
  };
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function md5File(p: string): string {
  const b = fs.readFileSync(p);
  return crypto.createHash("md5").update(b).digest("hex");
}

function isPdfHeader(abs: string): boolean {
  try {
    const fd = fs.openSync(abs, "r");
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    return buf.toString("utf8") === "%PDF";
  } catch {
    return false;
  }
}

function normalizeId(base: string) {
  return String(base || "")
    .trim()
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function bucketForSource(abs: string): "lib-pdf" | "content-downloads" {
  const n = abs.replace(/\\/g, "/").toLowerCase();
  return n.includes("/lib/pdf/") ? "lib-pdf" : "content-downloads";
}

function outputAbsFor(id: string, bucket: "lib-pdf" | "content-downloads"): { abs: string; web: string } {
  const web = `/assets/downloads/${bucket}/${id}.pdf`;
  const abs = path.join(root(), "public", web.replace(/^\/+/, ""));
  return { abs, web };
}

function walkPdfs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const stack = [dir];

  while (stack.length) {
    const d = stack.pop()!;
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(d, e.name);
      if (e.isDirectory()) stack.push(abs);
      else if (e.isFile() && path.extname(e.name).toLowerCase() === ".pdf") out.push(abs);
    }
  }
  return out;
}

function pickSources(opts: Options): { id: string; abs: string; bucket: "lib-pdf" | "content-downloads" }[] {
  const libPdfs = walkPdfs(opts.libPdfDir);
  const contentPdfs = walkPdfs(opts.contentDownloadsDir);

  // prefer lib/pdf if duplicate id exists
  const map = new Map<string, { abs: string; bucket: "lib-pdf" | "content-downloads" }>();

  const ingest = (abs: string) => {
    const id = normalizeId(path.basename(abs, path.extname(abs)));
    const bucket = bucketForSource(abs);
    const current = map.get(id);
    if (!current) {
      map.set(id, { abs, bucket });
      return;
    }
    // precedence: lib-pdf > content-downloads
    if (current.bucket !== "lib-pdf" && bucket === "lib-pdf") {
      map.set(id, { abs, bucket });
    }
  };

  for (const p of contentPdfs) ingest(p);
  for (const p of libPdfs) ingest(p);

  return Array.from(map.entries()).map(([id, v]) => ({ id, abs: v.abs, bucket: v.bucket }));
}

export async function syncAll(options?: Partial<Options>): Promise<SyncResult[]> {
  const opts = { ...defaults(), ...(options || {}) };
  ensureDir(opts.publicDownloadsDir);

  const sources = pickSources(opts);
  const results: SyncResult[] = [];

  for (const s of sources) {
    const { abs: outAbs, web: outWeb } = outputAbsFor(s.id, s.bucket);

    try {
      const srcAbs = s.abs;

      if (!fs.existsSync(srcAbs)) {
        results.push({ id: s.id, success: false, action: "missing-source", sourcePath: srcAbs });
        continue;
      }

      const st = fs.statSync(srcAbs);
      if (st.size < 8000) {
        results.push({
          id: s.id,
          success: false,
          action: "invalid-source",
          sourcePath: srcAbs,
          error: `Source too small (${Math.round(st.size / 1024)}KB)`,
        });
        continue;
      }

      if (!isPdfHeader(srcAbs)) {
        results.push({ id: s.id, success: false, action: "invalid-source", sourcePath: srcAbs, error: "Missing %PDF header" });
        continue;
      }

      const exists = fs.existsSync(outAbs);
      if (exists && !opts.overwrite) {
        results.push({ id: s.id, success: true, action: "skipped", outputPath: outWeb, md5: md5File(outAbs) });
        continue;
      }

      if (!opts.dryRun) {
        ensureDir(path.dirname(outAbs));
        fs.copyFileSync(srcAbs, outAbs);
      }

      results.push({
        id: s.id,
        success: true,
        action: "copied",
        sourcePath: srcAbs,
        outputPath: outWeb,
        md5: opts.dryRun ? undefined : md5File(outAbs),
        bytes: st.size,
      });
    } catch (e: any) {
      results.push({ id: s.id, success: false, action: "error", error: e?.message || String(e) });
    }
  }

  return results;
}

// CLI
if (require.main === module) {
  const overwrite = process.argv.includes("--overwrite");
  const dryRun = process.argv.includes("--dry-run");

  syncAll({ overwrite, dryRun })
    .then((r) => {
      const ok = r.filter((x) => x.success).length;
      const fail = r.length - ok;
      console.log(`\n✅ Sync complete: ok=${ok} fail=${fail}`);
      if (fail) process.exit(1);
    })
    .catch((e) => {
      console.error("❌ Sync failed:", e);
      process.exit(1);
    });
}

export async function generateOnePdfById(id: string) {
  // TODO: wire to your actual registry-driven generator.
  // This placeholder prevents build breakage and gives a clean error at runtime.
  throw new Error(
    `generateOnePdfById is not wired yet. Requested id="${id}". ` +
    `Implement this by calling your registry generator (generate-from-registry.ts / renderAssetPDF).`
  );
}