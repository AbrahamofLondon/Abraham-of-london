// scripts/pdf/registry-audit.ts
/**
 * PDF REGISTRY AUDIT — Production QA
 * ---------------------------------
 * Reads generated registry + public manifest and reports:
 * - files with qualityFlag (e.g. SMALL_PDF_xKB)
 * - missing-on-disk entries
 * - mismatches between registry and manifest
 *
 * Usage:
 *   pnpm pdf:registry:audit
 *   pnpm pdf:registry:audit -- --minWarnKb 50 --limit 200 --json
 */

import fs from "fs";
import path from "path";

type AuditOptions = {
  minWarnKb: number;
  limit: number;
  json: boolean;
};

type AnyEntry = Record<string, any>;

const ROOT = process.cwd();
const GENERATED_TS = path.join(ROOT, "lib", "pdf", "pdf-registry.generated.ts");
const MANIFEST_JSON = path.join(ROOT, "public", "assets", "downloads", "pdf-manifest.json");
const DOWNLOADS_PUBLIC = path.join(ROOT, "public", "assets", "downloads");

function parseArgs(): AuditOptions {
  const args = process.argv.slice(2);
  const get = (k: string) => {
    const p = args.find((a) => a.startsWith(`${k}=`));
    return p ? p.split("=").slice(1).join("=") : "";
  };

  const minWarnKb = Math.max(1, parseInt(get("--minWarnKb") || "50", 10) || 50);
  const limit = Math.max(10, parseInt(get("--limit") || "200", 10) || 200);
  const json = args.includes("--json");
  return { minWarnKb, limit, json };
}

function toAbsPublicPath(outputPath: string): string {
  const rel = String(outputPath || "").replace(/^\/+/, "");
  return path.join(ROOT, "public", rel);
}

function existsAndSize(abs: string): { exists: boolean; sizeBytes: number } {
  try {
    if (!fs.existsSync(abs)) return { exists: false, sizeBytes: 0 };
    const st = fs.statSync(abs);
    if (!st.isFile()) return { exists: false, sizeBytes: 0 };
    return { exists: true, sizeBytes: st.size };
  } catch {
    return { exists: false, sizeBytes: 0 };
  }
}

function parseWarnKb(flag: any): number | null {
  const s = String(flag || "");
  const m = s.match(/SMALL_PDF_(\d+)KB/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

async function loadRegistry(): Promise<AnyEntry[]> {
  if (!fs.existsSync(GENERATED_TS)) {
    throw new Error(`Missing generated registry: ${GENERATED_TS}`);
  }
  // dynamic import of TS module (tsx/ts-node not needed since you run via tsx)
  const mod = await import(pathToFileUrl(GENERATED_TS));
  const arr = (mod as any).GENERATED_PDF_CONFIGS;
  if (!Array.isArray(arr)) throw new Error("GENERATED_PDF_CONFIGS not found or not an array");
  return arr;
}

function pathToFileUrl(p: string) {
  const u = new URL("file:///");
  // Windows path normalization
  u.pathname = p.replace(/\\/g, "/").replace(/^([A-Za-z]):/, (_, d) => `${d}:`);
  return u.toString();
}

function loadManifest(): AnyEntry[] {
  if (!fs.existsSync(MANIFEST_JSON)) return [];
  try {
    const raw = fs.readFileSync(MANIFEST_JSON, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.files) ? parsed.files : [];
  } catch {
    return [];
  }
}

function main() {
  const opts = parseArgs();

  if (!fs.existsSync(DOWNLOADS_PUBLIC)) {
    console.error(`Missing downloads root: ${DOWNLOADS_PUBLIC}`);
    process.exit(1);
  }

  (async () => {
    const registry = await loadRegistry();
    const manifestFiles = loadManifest();

    const regById = new Map<string, AnyEntry>();
    for (const r of registry) regById.set(String(r.id), r);

    const manById = new Map<string, AnyEntry>();
    for (const m of manifestFiles) manById.set(String(m.id), m);

    const warned = registry
      .map((r) => {
        const warnKb = parseWarnKb(r.qualityFlag);
        return { r, warnKb };
      })
      .filter((x) => x.warnKb !== null && (x.warnKb as number) < opts.minWarnKb)
      .map((x) => x.r);

    const missingOnDisk = registry.filter((r) => {
      const out = toAbsPublicPath(String(r.outputPath || r.path || ""));
      return !existsAndSize(out).exists;
    });

    const manifestMissing = registry.filter((r) => !manById.has(String(r.id)));
    const registryMissing = manifestFiles.filter((m) => !regById.has(String(m.id)));

    const payload = {
      auditedAt: new Date().toISOString(),
      counts: {
        registry: registry.length,
        manifest: manifestFiles.length,
        warned: warned.length,
        missingOnDisk: missingOnDisk.length,
        manifestMissing: manifestMissing.length,
        registryMissing: registryMissing.length,
      },
      thresholds: {
        minWarnKb: opts.minWarnKb,
      },
      warned: warned.slice(0, opts.limit).map((r) => ({
        id: r.id,
        title: r.title,
        outputPath: r.outputPath,
        qualityFlag: r.qualityFlag,
        sizeBytes: r.fileSizeBytes ?? null,
        sizeHuman: r.fileSizeHuman ?? null,
        tier: r.tier ?? null,
        category: r.categorySlug ?? r.category ?? null,
      })),
      missingOnDisk: missingOnDisk.slice(0, opts.limit).map((r) => ({
        id: r.id,
        title: r.title,
        outputPath: r.outputPath,
        tier: r.tier ?? null,
        category: r.categorySlug ?? r.category ?? null,
      })),
      manifestMissing: manifestMissing.slice(0, opts.limit).map((r) => ({
        id: r.id,
        outputPath: r.outputPath,
      })),
      registryMissing: registryMissing.slice(0, opts.limit).map((m) => ({
        id: m.id,
        path: m.path,
      })),
    };

    if (opts.json) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }

    console.log("=".repeat(72));
    console.log("🧾 PDF REGISTRY AUDIT");
    console.log("=".repeat(72));
    console.log(`Registry entries: ${payload.counts.registry}`);
    console.log(`Manifest entries: ${payload.counts.manifest}`);
    console.log(`Warn threshold:   < ${opts.minWarnKb} KB`);
    console.log("-".repeat(72));

    if (warned.length) {
      console.log(`⚠ SMALL PDFs: ${warned.length}`);
      for (const r of warned.slice(0, opts.limit)) {
        console.log(`  • ${r.id}  ${r.qualityFlag}  ${r.outputPath}`);
      }
      if (warned.length > opts.limit) console.log(`  … ${warned.length - opts.limit} more`);
      console.log("-".repeat(72));
    } else {
      console.log("✅ No SMALL_PDF warnings under threshold.");
      console.log("-".repeat(72));
    }

    if (missingOnDisk.length) {
      console.log(`❌ Missing on disk: ${missingOnDisk.length}`);
      for (const r of missingOnDisk.slice(0, opts.limit)) {
        console.log(`  • ${r.id}  ${r.outputPath}`);
      }
      if (missingOnDisk.length > opts.limit) console.log(`  … ${missingOnDisk.length - opts.limit} more`);
      console.log("-".repeat(72));
    } else {
      console.log("✅ No missing files on disk for registry entries.");
      console.log("-".repeat(72));
    }

    if (manifestMissing.length) {
      console.log(`⚠ In registry but missing from manifest: ${manifestMissing.length}`);
      for (const r of manifestMissing.slice(0, opts.limit)) {
        console.log(`  • ${r.id}`);
      }
      if (manifestMissing.length > opts.limit) console.log(`  … ${manifestMissing.length - opts.limit} more`);
      console.log("-".repeat(72));
    }

    if (registryMissing.length) {
      console.log(`⚠ In manifest but missing from registry: ${registryMissing.length}`);
      for (const m of registryMissing.slice(0, opts.limit)) {
        console.log(`  • ${m.id}`);
      }
      if (registryMissing.length > opts.limit) console.log(`  … ${registryMissing.length - opts.limit} more`);
      console.log("-".repeat(72));
    }

    console.log("✅ Audit complete.");
  })().catch((e: any) => {
    console.error("❌ Audit failed:", e?.message || String(e));
    process.exit(1);
  });
}

main();
export default main;